# Temple Registry — Master Implementation Plan
## Feature: Public Search + Role-Based Temple Edit/Approve

**Created:** 2026-05-12  
**Status:** READY FOR IMPLEMENTATION  
**Based on:** `edit-approve-feature.md`, `EA-implementation_paln.md`, `EA-IMPLEMENTATION-PART1.MD`  
**Scope:** Additive modifications only. Existing DC/TA/approval flows must not break.

---

## 1. Executive Summary

Three distinct deliverables are bundled in this plan:

| # | Deliverable | Complexity |
|---|---|---|
| A | **Public Temple Search** — make `GET /api/v1/temples` unauthenticated; add `/search` public route | High (security-critical) |
| B | **DC District Filter Unlock** — allow DC to change their district filter in search | Low |
| C | **Role-Based Edit on Temple Detail Pages** — SA edits any temple; TA edits only their own | Very High |

All three share a common backend prerequisite: fixing anonymous-user crash paths in `JurisdictionGuard` and `OwnershipGuard`. This **must be done first** and independently verified before anything else.

---

## 2. Current System Understanding

### 2.1 Authentication Chain (Verified from Source)

```
HTTP Request
  → Spring Security Filter Chain (SecurityConfig.securityFilterChain)
      → PUBLIC_PATHS bypass (.requestMatchers(PUBLIC_PATHS).permitAll())
          Current PUBLIC_PATHS: /api/v1/auth/**, /api/v1/geo/**, /v3/api-docs/**, /swagger-ui/**, actuator, /error
      → .anyRequest().authenticated()  ← ALL other requests blocked here for anonymous
  → JwtAuthenticationFilter (reads Bearer / httpOnly cookie)
  → @PreAuthorize method security (Spring AOP on @Service/@Controller methods)
  → JurisdictionGuard / OwnershipGuard (called inside service methods)
```

### 2.2 Critical Crash Paths for Anonymous Users (MUST FIX FIRST)

**JurisdictionGuard.currentClaims()** (line ~42):
```java
Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
if (principal instanceof ScopeHelper.Claims c) return c;
throw new IllegalStateException("Authenticated principal is not a ScopeHelper.Claims instance.");
```
For anonymous requests, Spring sets principal = `"anonymousUser"` (a `String`). The `instanceof` check fails → `IllegalStateException` → 500 for any anonymous caller.

`currentClaims()` is called from:
- `enforceDistrictId()` — called from `TempleServiceImpl.search()`
- `assertSameDistrict()` — called from `TempleServiceImpl.getById()` and `getCurrentProfile()`
- `assertDistrictScope()` — called from workflow approval services

**OwnershipGuard.currentClaims()** (same pattern):
```java
Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
if (principal instanceof ScopeHelper.Claims c) return c;
throw new IllegalStateException(...)
```
Called from `assertOwnsTemple()` which is called in `TempleServiceImpl.search()`.

**Result:** Without the null-guard fix, opening `GET /api/v1/temples` publicly produces 500 on every unauthenticated request, even after SecurityConfig is updated.

### 2.3 Current Temple Search Flow (Verified)

`GET /api/v1/temples` → `TempleController.search()` (no `@PreAuthorize` at controller) → `TempleServiceImpl.search()` with `@PreAuthorize("isAuthenticated()")`.

`TempleServiceImpl.search()`:
1. `paginationUtil.clampSize(filter.getSize())` — safe
2. `jurisdictionGuard.enforceDistrictId(filter.getDistrictId())` — **CRASHES for anonymous**
3. Builds JPA spec from filter + scopedDistrictId
4. Returns `PaginatedResponse<TempleSearchResultResponse>` — contains: id, name, grade, primaryDeity, tradition, districtId, trustRegistered, assetDeclarationStatus, photoUrl (via serve endpoint). **No PII (no mobile, email, bank data).**

### 2.4 Current DC Search vs Public Search — Two Separate Endpoints

| Endpoint | Service | Users | Current Restriction |
|---|---|---|---|
| `GET /api/v1/temples` | `TempleServiceImpl.search()` | All roles + to-be-public | `isAuthenticated()` |
| `GET /api/v1/dc/temples` | `DcTempleSearchServiceImpl.search()` | DC, DC_STAFF, SA, AUDITOR | `CAN_READ_ALL` |

The public search must use `GET /api/v1/temples` (not the DC endpoint). The DC endpoint has enriched fields like `pendingDeclarations`, `overdueDeclarations`, `pendingProfileReview` that are DC-workflow-specific.

### 2.5 DC District Lock (Verified in Source)

`DcTempleSearchServiceImpl.resolveDistrictId()`:
```java
if (RoleConstants.DISTRICT_COLLECTOR.equals(role) || RoleConstants.DC_STAFF.equals(role)) {
    return claims.districtId(); // JWT claim always wins for DC roles — ignores filter param
}
return filter.getDistrictId(); // SA / AUDITOR may pass or omit
```

`useDcTempleSearch()` (dcHooks.ts) has TWO effects for DC:
1. **Initialization:** Sets `districtId` from `currentUser.districtId` on mount (correct — keep)
2. **DC pre-populate from dcContext:** Writes `districtId` param to URL when absent (correct — keep)
3. **State lock:** `isStatewideRole` is false for DC → `effectiveDistrictId = districtId` (state, not URL) → the URL can show a different districtId but the actual query uses state — **this is the implicit lock, not a separate useEffect**.

To unlock: The `effectiveDistrictId` for DC should come from URL (same as statewide roles) rather than the locked state. The initialization and prepopulation effects can stay; only the `effectiveDistrictId` derivation changes.

### 2.6 Current TA Access Model (Verified)

TA can currently access:
- `/ta/temple` — their OWN temple only (via `TaTemplePage`)
- `/ta/temple/edit` — edit their own temple profile
- `/ta/trust`, `/ta/employees`, etc. — own temple only

TA **cannot** currently access:
- Any DC-module temple search or detail page
- Any other temple's profile
- `GET /api/v1/temples/{id}` for another temple → `OwnershipGuard` throws 403

### 2.7 SA Access Model on DcTempleProfilePage (Verified)

SA already reaches `DcTempleProfilePage` via:
- Route: `<RoleRoute allowedRoles={[DC, DC_STAFF, SA]}>` → `/dc/temples/:templeId`
- `canAct = role === USER_ROLES.DISTRICT_COLLECTOR || role === USER_ROLES.SUPER_ADMIN` → **SA has canAct=true**
- SA can already approve/reject declarations and profile updates

What SA **cannot** currently do on `DcTempleProfilePage`:
- Edit temple profile (no Edit button in tabs)
- Edit trust (no Edit button)
- Add/Edit employees (no buttons)

### 2.8 Profile Staging Submit — Backend Gap (Verified)

`TempleController.java`:
```java
@PostMapping("/{templeId}/profile/submit")
@PreAuthorize(RoleConstants.TEMPLE_AUTHORITY_ONLY)  // ← SA blocked here
public ResponseEntity<...> submitForReview(@PathVariable Long templeId) { ... }
```

`TempleProfileStagingServiceImpl.submitForReview()`:
```java
@PreAuthorize(RoleConstants.CAN_SUBMIT)  // ← allows SA, but controller blocks first
```

`TempleProfileStagingServiceImpl.createOrUpdateDraft()`:
```java
@PreAuthorize(RoleConstants.CAN_SUBMIT)  // ← SA already allowed to save drafts
ownershipGuard.assertOwnsTemple(templeId);  // ← SA bypasses (only TEMPLE_AUTHORITY is checked)
```

**Fix:** Change controller annotation on `submitForReview` from `TEMPLE_AUTHORITY_ONLY` to `CAN_SUBMIT`. One line change.

---

## 3. Role & Permission Matrix

### 3.1 Complete Backend Permission Matrix

| Operation | Public | TA (own) | TA (other) | DC (own district) | DC (other district) | SA |
|---|---|---|---|---|---|---|
| `GET /api/v1/temples` (search list) | ✓ (new) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `GET /api/v1/temples/{id}` (detail, PII) | ✗ 401 | ✓ | ✗ 403 (OwnershipGuard) | ✓ | ✗ 403 (JurisdictionGuard) | ✓ |
| `GET /api/v1/dc/temples/{id}` (full profile) | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| `GET /api/v1/temples/{id}/profile-photo/serve` | ✓ (new) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `POST /api/v1/temples/{id}/profile/staging` | ✗ | ✓ | ✗ 403 | ✗ | ✗ | ✓ any |
| `POST /api/v1/temples/{id}/profile/submit` | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ (after fix) |
| `GET /api/v1/dc/temples` (search list, enriched) | ✗ | ✗ | ✗ | ✓ | ✓ (new) | ✓ |
| `PUT /api/v1/trusts/{id}` | ✗ | ✓ own | ✗ | ✗ | ✗ | ✓ any |
| `POST /api/v1/trusts/{id}/submit` | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ (verify) |
| `POST /api/v1/temples/{id}/employees` | ✗ | ✓ own | ✗ | ✗ | ✗ | ✓ any |
| `PUT /api/v1/employees/{id}` | ✗ | ✓ own | ✗ | ✗ | ✗ | ✓ any |
| Approve/Reject declarations | ✗ | ✗ | ✗ | ✓ | ✗ (assertDistrictScope) | ✓ |
| Approve/Reject profile staging | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ |
| `POST /api/v1/governance/declarations/{id}/approve` | ✗ | ✗ | ✗ | ✓ own-district only | ✗ | ✓ |
| Temple suspend/freeze/archive | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (`ADMIN_ONLY`) |

### 3.2 Frontend UI Access Matrix

| UI Action | Public | TA (own temple) | TA (other temple) | DC | SA |
|---|---|---|---|---|---|
| View temple search page | ✓ (`/search`) | ✓ (`/ta/temples`) | ✓ (`/ta/temples`) | ✓ (`/dc/temples`) | ✓ (`/dc/temples`) |
| Change district filter | ✓ | ✓ | ✓ | ✓ (new) | ✓ |
| View temple detail page | ✗ (no detail page) | ✓ (`/ta/temples/:id`) | Read-only basic | ✓ (`/dc/temples/:id`) | ✓ (`/dc/temples/:id`) |
| Edit Profile button | ✗ | ✓ | ✗ | ✗ | ✓ |
| Edit Trust button | ✗ | ✓ | ✗ | ✗ | ✓ |
| Add/Edit Employee buttons | ✗ | ✓ | ✗ | ✗ | ✓ |
| Approve/Reject declarations | ✗ | ✗ | ✗ | ✓ (own district) | ✓ |
| Approve/Reject profile/trust | ✗ | ✗ | ✗ | ✓ (own district) | ✓ |

---

## 4. Feature-Wise Implementation Breakdown

### Feature A: Public Temple Search

**Current behavior:** `GET /api/v1/temples` requires authentication. No public route on frontend.

**Required new behavior:** Anonymous users can search temples at `/search` URL. No edit/action buttons shown.

**Backend impact:**
1. `SecurityConfig.java`: Add `HttpMethod.GET, "/api/v1/temples"` to public matchers. Also add photo serve endpoints: `"/api/v1/temples/*/profile-photo/serve"` and `"/api/v1/temples/*/photos/*/serve"`.
2. `JurisdictionGuard.java`: Null-guard `currentClaims()` — for anonymous, `enforceDistrictId()` returns `requestedDistrictId`, all assert methods return without restriction.
3. `OwnershipGuard.java`: Null-guard `currentClaims()` — for anonymous, return without restriction (write paths cannot be reached without auth anyway).
4. `TempleServiceImpl.search()`: Change `@PreAuthorize("isAuthenticated()")` → `@PreAuthorize("permitAll()")`.

**Frontend impact:**
1. `routePaths.ts`: Add `PUBLIC_SEARCH: '/search'`.
2. `routes/index.tsx`: Add `{ path: ROUTE_PATHS.PUBLIC_SEARCH, element: <PublicTempleSearchPage /> }` OUTSIDE `<PrivateRoute>` (before or after the protected block).
3. New file `features/search/PublicTempleSearchPage.tsx`: Uses `useSearchTemplesQuery` from `templeApi.ts`. Shows search filters (keyword, grade, district, deity). Read-only — no Edit/Approve buttons. If user is logged in, show their role-appropriate navigation hint ("Go to DC Dashboard" etc.).

**Security considerations:**
- `GET /api/v1/temples` returns: id, name, registrationNumber, grade, primaryDeity, tradition, districtId, trustRegistered, assetDeclarationStatus, photoUrl. **No PII.**
- The path matcher must be exact: `HttpMethod.GET, "/api/v1/temples"`. Do NOT use `/api/v1/temples/**` wildcard which would expose `/api/v1/temples/{id}` (contains contactMobile, contactEmail, bankName, bankIfsc).
- Photo serve endpoints are not sensitive — temple photos are for public display.

**Risks:**
- If wildcard is used accidentally, PII endpoint `GET /api/v1/temples/{id}` becomes public. Prevention: use explicit path matching only.
- Anonymous users can now enumerate all temple names. Acceptable — temple names are public information.

---

### Feature B: DC District Filter Unlock

**Current behavior:** DC is locked to their own district in the search UI. Even if the URL has a different districtId, `DcTempleSearchServiceImpl.resolveDistrictId()` overrides with JWT claim.

**Required new behavior:** DC search initializes to their own district but can change the dropdown to view other districts. DC approval actions still restricted to own district (unchanged).

**Backend impact:**
`DcTempleSearchServiceImpl.resolveDistrictId()`: Remove the DC-locks-to-JWT-district logic. Change to: return `filter.getDistrictId()` for ALL roles. (The approval restriction is in `assertDistrictScope()` which is untouched.)

```java
// Before:
private Long resolveDistrictId(...) {
    if (DC or DC_STAFF) return claims.districtId(); // lock
    return filter.getDistrictId();
}
// After:
private Long resolveDistrictId(...) {
    return filter.getDistrictId(); // All roles pass their selected district or null
}
```

**Frontend impact:**
`dcHooks.ts` `useDcTempleSearch()`:
- The `effectiveDistrictId` derivation currently: DC → uses `districtId` STATE (locked); statewide → uses URL.
- Change to: ALL roles use URL param for `effectiveDistrictId`.
- Keep the initialization `useEffect` that sets `districtId` state from `currentUser.districtId` (for initial URL population).
- Keep the DC context pre-populate `useEffect` (sets URL params when absent on first load).
- Remove the state-variable lock: `const effectiveDistrictId = parseIntParam(searchParams.get('districtId')) ?? null` for ALL roles.

`DcTempleSearchPage.tsx`:
- Find the `SearchableSelect` or district dropdown and remove the `disabled={isDcRole}` (or equivalent) prop.

**Risks:**
- DC selecting another district's temples, then clicking Approve: `assertDistrictScope()` in the backend still enforces district. The frontend's Approve button visibility logic (based on `temple.districtId === currentUser.districtId`) will hide the button, but even if bypassed, the backend blocks.
- Breaking SA/AUDITOR/VIEWER search behavior: These roles already use URL-based districtId. No change for them.

---

### Feature C: Role-Based Edit on Temple Detail Pages

This has two sub-features:

**C1: SA Edit on Existing DcTempleProfilePage**

SA already lands on `/dc/temples/:templeId`. We add edit capability.

**C2: TA Search Page + TA Temple Detail Page with Own-Temple Edit**

New pages: `TaTempleSearchPage` and `TaTempleDetailPage`.

---

## 5. Backend Architecture Plan

### 5.1 File-Level Backend Changes

#### 5.1.1 `SecurityConfig.java` — SECURITY CRITICAL

**What changes:** Add public path matchers for GET temple search and photo serve endpoints.

```java
// In securityFilterChain(), change .authorizeHttpRequests(auth -> auth block:
.requestMatchers(PUBLIC_PATHS).permitAll()
.requestMatchers(HttpMethod.GET, "/api/v1/temples").permitAll()         // exact path
.requestMatchers(HttpMethod.GET, "/api/v1/temples/*/profile-photo/serve").permitAll()
.requestMatchers(HttpMethod.GET, "/api/v1/temples/*/photos/*/serve").permitAll()
.anyRequest().authenticated()
```

**IMPORTANT:** These matchers must come AFTER `PUBLIC_PATHS` but BEFORE `.anyRequest().authenticated()`. Order matters in Spring Security filter chain.

**Do NOT add:** `/api/v1/temples/**` or any other wildcard covering `/{id}`, `/{id}/profile/staging`, etc.

**Cache-Control for public photos:** Change `"max-age=86400, private"` to `"max-age=86400, public"` in `TempleController.serveProfilePhoto()` and `serveTemplePhoto()`. Temple photos are public — `private` header is misleading.

#### 5.1.2 `JurisdictionGuard.java` — SECURITY CRITICAL

**What changes:** Add null/type-guard to `currentClaims()`. Change all callers to handle `null`.

**Strategy:** Change `currentClaims()` to return `Optional<ScopeHelper.Claims>` and update each method. Alternatively, add a separate `currentClaimsOrNull()` method and keep existing `currentClaims()` for authenticated-only paths.

**Recommended approach:** Add a `currentClaimsOrNull()` helper; use it only in methods that handle anonymous callers (`enforceDistrictId`, `assertSameDistrict`). Keep `currentClaims()` throwing for internal use in `assertDistrictScope()` (which is called only from authenticated workflow services).

```java
// New private helper
private ScopeHelper.Claims currentClaimsOrNull() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null) return null;
    Object principal = auth.getPrincipal();
    return (principal instanceof ScopeHelper.Claims c) ? c : null;
}

// Modified enforceDistrictId:
public Long enforceDistrictId(Long requestedDistrictId) {
    ScopeHelper.Claims claims = currentClaimsOrNull();
    if (claims == null) return requestedDistrictId; // anonymous: no district restriction
    String role = claims.role();
    if (RoleConstants.DISTRICT_COLLECTOR.equals(role) || RoleConstants.DC_STAFF.equals(role)) {
        return claims.districtId();
    }
    return requestedDistrictId;
}

// Modified assertSameDistrict:
public void assertSameDistrict(Long resourceDistrictId) {
    ScopeHelper.Claims claims = currentClaimsOrNull();
    if (claims == null) return; // anonymous: no district restriction (read-only public endpoint)
    // ... existing role check ...
}
```

**`assertDistrictScope()` remains unchanged** — it already receives `ScopeHelper.Claims` as a parameter (not from SecurityContextHolder directly) and is only called from authenticated workflow services.

#### 5.1.3 `OwnershipGuard.java` — SECURITY CRITICAL

**What changes:** Same pattern — add null-guard for anonymous.

```java
private ScopeHelper.Claims currentClaimsOrNull() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null) return null;
    Object principal = auth.getPrincipal();
    return (principal instanceof ScopeHelper.Claims c) ? c : null;
}

public void assertOwnsTemple(Long resourceTempleId) {
    ScopeHelper.Claims claims = currentClaimsOrNull();
    if (claims == null) return; // anonymous: no ownership restriction (only reaches read endpoints)
    if (RoleConstants.TEMPLE_AUTHORITY.equals(claims.role())) {
        if (resourceTempleId == null || claims.templeId() == null
                || !resourceTempleId.equals(claims.templeId())) {
            throw new JurisdictionAccessDeniedException(...);
        }
    }
}
```

**Security invariant preserved:** Anonymous users can never reach `assertOwnsTemple()` on write paths because all write endpoints have `@PreAuthorize(RoleConstants.CAN_SUBMIT)` or stricter, which blocks anonymous before the service method is entered.

#### 5.1.4 `TempleServiceImpl.java`

**Change 1:** `search()` annotation: `@PreAuthorize("isAuthenticated()")` → `@PreAuthorize("permitAll()")`.

```java
@Override
@Transactional(readOnly = true)
@PreAuthorize("permitAll()")  // ← changed from "isAuthenticated()"
public PaginatedResponse<TempleSearchResultResponse> search(TempleSearchFilterRequest filter) { ... }
```

**Change 2 (DC Unlock):** The `search()` method calls `jurisdictionGuard.enforceDistrictId(filter.getDistrictId())`. After the JurisdictionGuard fix in 5.1.2, this will work correctly for anonymous (returns requestedDistrictId). **No other change needed in TempleServiceImpl for the DC unlock** — `enforceDistrictId()` already returns `requestedDistrictId` for non-DC roles.

**Note:** `getById()` retains `@PreAuthorize("isAuthenticated()")` — it returns PII and must stay protected.

#### 5.1.5 `DcTempleSearchServiceImpl.java`

**Change:** `resolveDistrictId()` — remove DC district lock.

```java
private Long resolveDistrictId(TempleSearchFilterRequest filter, ScopeHelper.Claims claims) {
    // Previously locked DC to JWT districtId. Now all roles use the filter param.
    // DC approval restriction is enforced in assertDistrictScope(), not here.
    return filter.getDistrictId();
}
```

**What does NOT change:** The `@PreAuthorize(RoleConstants.CAN_READ_ALL)` on `search()` — DC still needs to be authenticated to use this enriched endpoint. The goal is only to allow DC to choose a different district.

#### 5.1.6 `TempleController.java`

**Change:** On `submitForReview` endpoint, change `@PreAuthorize` from `TEMPLE_AUTHORITY_ONLY` to `CAN_SUBMIT`.

```java
@PostMapping("/{templeId}/profile/submit")
@Operation(summary = "Submit the current DRAFT profile for DC review (TA/SA)")
@PreAuthorize(RoleConstants.CAN_SUBMIT)  // ← changed from TEMPLE_AUTHORITY_ONLY
public ResponseEntity<ApiResponse<TempleProfileStagingResponse>> submitForReview(
        @PathVariable Long templeId) {
    return ResponseEntity.ok(ApiResponse.success("Profile submitted for review.",
            stagingService.submitForReview(templeId)));
}
```

**Trust submit endpoint:** Verify that `POST /trusts/{trustId}/submit` (or equivalent) already uses `CAN_SUBMIT`. Confirm before SA trust edit is wired in frontend. If it uses `TEMPLE_AUTHORITY_ONLY`, apply the same fix.

#### 5.1.7 Files NOT Modified

The following workflow/approval files are **explicitly excluded** from all changes:
- `TempleProfileWorkflowServiceImpl.java`
- `GovernanceWorkflowServiceImpl.java`
- `DcTempleVerificationServiceImpl.java`
- `DeclarationWorkflowServiceImpl.java`
- Any `*Repository.java`
- Any entity/DTO/mapper files
- Any Flyway migration scripts

---

## 6. Frontend Architecture Plan

### 6.1 New Files to Create

| File | Purpose | APIs Used |
|---|---|---|
| `features/search/PublicTempleSearchPage.tsx` | Public/unauthenticated temple search | `useSearchTemplesQuery` (templeApi) |
| `features/search/usePublicTempleSearch.ts` | Hook for public search state | `useSearchTemplesQuery` |
| `features/ta/pages/TaTempleSearchPage/TaTempleSearchPage.tsx` | TA's authenticated search with edit button on own temple | `useSearchTemplesQuery` |
| `features/ta/pages/TaTempleDetailPage/TaTempleDetailPage.tsx` | TA's temple detail page (edit own, read other) | TA hooks + DC profile hook for own temple |
| `features/ta/hooks/useTaTempleDetail.ts` | Aggregates all data needed for TA detail page | Various existing hooks |

### 6.2 Files to Modify

| File | Change | Risk |
|---|---|---|
| `constants/routePaths.ts` | Add `PUBLIC_SEARCH`, `TA_TEMPLE_SEARCH`, `TA_TEMPLE_DETAIL` | Low |
| `routes/index.tsx` | Add public route + TA routes | Medium (placement matters) |
| `features/dc/dcHooks.ts` | Remove DC district state lock in `useDcTempleSearch` | Medium |
| `features/dc/pages/DcTempleSearchPage/DcTempleSearchPage.tsx` | Remove `disabled` on district dropdown for DC | Low |
| `features/dc/pages/DcTempleProfilePage/DcTempleProfilePage.tsx` | Add SA edit dialogs + wire edit callbacks to tabs | High |
| `features/dc/pages/DcTempleProfilePage/tabs/OverviewTab.tsx` | Add optional `onEditProfile?: () => void` prop | Low |
| `features/dc/pages/DcTempleProfilePage/tabs/TrustTab.tsx` | Add optional `onEditTrust?: () => void` prop | Low |
| `features/dc/pages/DcTempleProfilePage/tabs/StaffTab.tsx` | Add optional `onAddEmployee?: () => void` + `onEditEmployee?: (id: number) => void` props | Low |

### 6.3 routePaths.ts — Additions

```typescript
// In ROUTE_PATHS object, add:
PUBLIC_SEARCH: '/search',
TA_TEMPLE_SEARCH: '/ta/temples',
TA_TEMPLE_DETAIL: '/ta/temples/:templeId',
```

### 6.4 routes/index.tsx — Changes

**Addition 1:** Public search route. Placed BEFORE the protected block:
```typescript
{ path: ROUTE_PATHS.PUBLIC_SEARCH, element: <Suspense ...><PublicTempleSearchPage /></Suspense> },
```

**Addition 2:** TA search + detail routes. Inside the TA `<RoleRoute allowedRoles={[TEMPLE_AUTHORITY]}>` block:
```typescript
{ path: ROUTE_PATHS.TA_TEMPLE_SEARCH, element: <Suspense ...><TaTempleSearchPage /></Suspense> },
{ path: ROUTE_PATHS.TA_TEMPLE_DETAIL, element: <Suspense ...><TaTempleDetailPage /></Suspense> },
```

**Note:** Lazy-import both new pages at the top of the file, following the existing lazy() pattern.

### 6.5 PublicTempleSearchPage.tsx — Specification

**Location:** `features/search/PublicTempleSearchPage.tsx`

**Rendering:** Standalone page (not inside `AppShell` / `<PrivateRoute>`). Must include its own minimal header/nav (or use a public layout component if one exists).

**Data:** Uses `useSearchTemplesQuery` from `templeApi.ts` (NOT `dcApi.ts`). This query already uses `baseQueryWithReauth` which handles 401 gracefully.

**Filters available:** keyword, grade (multi-select), districtId (SearchableSelect using `useGetDistrictsQuery` from geoApi), deity name. Same fields as `TempleSearchFilterRequest`.

**Results:** Displays `TempleSearchResultResponse` fields: name, grade badge, primaryDeity, tradition, districtId (resolved to name via geo data or just show ID), photo. NO edit/approve buttons.

**No action buttons:** Public users see View only. "View" button on a public page is optional (no backend public detail page exists — it would need auth). Safest: no detail navigation for public users, or link to `/login` with redirect param.

**State management:** URL-based (use `useSearchParams`). No RTK Query for public route — use the existing `useSearchTemplesQuery` which works without auth after the backend fix.

**Error handling:** Shows `EmptyState` on 0 results. Shows error toast on API failure. Loading skeleton while fetching.

**Optional auth-aware banner:** If a logged-in user lands on `/search`, show a banner like "You're logged in as [role]. Go to your dashboard →".

### 6.6 TaTempleSearchPage.tsx — Specification

**Location:** `features/ta/pages/TaTempleSearchPage/TaTempleSearchPage.tsx`

**Inside:** `<PrivateRoute>` + `<RoleRoute allowedRoles={[TEMPLE_AUTHORITY]}>` + `<AppShell>`.

**Data:** Uses `useSearchTemplesQuery` from `templeApi.ts`. Same filters as public search.

**Key difference from public:** The `currentUser.templeId` is used to compute `isOwnTemple = temple.id === currentUser.templeId` for EACH search result.

**Action buttons per result:**
- For own temple (`isOwnTemple === true`): Show "View & Edit" button → navigate to `ROUTE_PATHS.TA_TEMPLE_DETAIL.replace(':templeId', String(temple.id))`
- For other temples: Show "View" button (read-only, or disabled, or navigates to a limited read-only detail view)

**District filter:** NOT locked. TA can search all districts.

### 6.7 TaTempleDetailPage.tsx — Specification

**Location:** `features/ta/pages/TaTempleDetailPage/TaTempleDetailPage.tsx`

**Route:** `/ta/temples/:templeId`

**Data loading modes:**

```typescript
const { templeId } = useParams<{ templeId: string }>()
const id = Number(templeId)
const currentUser = useAppSelector(s => s.auth.currentUser)
const isOwnTemple = currentUser?.templeId === id
```

**Mode A — Own Temple (`isOwnTemple === true`):**
Use existing TA hooks that call authenticated endpoints:
- `useGetTempleCurrentProfileQuery(id)` from templeApi → Overview data
- Active staging: `useGetActiveStagingQuery(id)` from templeApi
- Trust: find the existing hook used in `TaTrustPage` (uses `/api/v1/temples/{templeId}/trusts`)
- Board members: from trust service
- Employees: `useGetEmployeesByTempleQuery(id)` (or the equivalent TA hook)
- Shows Edit buttons via optional props on OverviewTab/TrustTab/StaffTab

**Mode B — Other Temple (`isOwnTemple === false`):**
- `useGetTempleByIdQuery(id)` from templeApi — this will return 403 for TA if they call it on another temple!
- **Decision:** For non-own temples, TA lands on this page but we show only PUBLIC info (the search result data + the basic public template data).
- **Implementation:** Pass the search result as navigation state (`navigate(path, { state: { templeSearchResult } })`). If state is available, show it. If not, call `useSearchTemplesQuery` with the specific id filter as a workaround.
- No edit buttons. Read-only view showing: name, grade, location, deity, photo.

**Tabs:**
Reuse the same `OverviewTab`, `TrustTab`, `StaffTab` components from `DcTempleProfilePage` — they accept optional `onEdit*` props. For Mode A (own temple), pass the edit callbacks. For Mode B (other temple), pass nothing (read-only).

**Note:** `TaTempleDetailPage` does NOT use `useDcTempleProfile()` (which calls `GET /api/v1/dc/temples/{id}` requiring `CAN_READ_ALL`). TA will get 403 from that endpoint. Use only TA-accessible endpoints.

### 6.8 useTaTempleDetail.ts — Hook Specification

**Location:** `features/ta/hooks/useTaTempleDetail.ts`

```typescript
export function useTaTempleDetail(templeId: number, isOwnTemple: boolean) {
  // Only fetch detail data for own temple — skip expensive calls for other temples
  const { data: profileData } = useGetTempleCurrentProfileQuery(templeId, { skip: !isOwnTemple })
  const { data: stagingData } = useGetActiveStagingQuery(templeId, { skip: !isOwnTemple })
  // Trust, board members, employees — from existing TA RTK Query hooks
  // ...
  return { profile, staging, trust, boardMembers, employees, isLoading }
}
```

### 6.9 DcTempleProfilePage.tsx — SA Edit Addition

**Location:** `features/dc/pages/DcTempleProfilePage/DcTempleProfilePage.tsx`

**Addition:** Add `canEdit` flag:
```typescript
const canEdit = role === USER_ROLES.SUPER_ADMIN
```

**Profile Edit Dialog (SA):**
- State: `const [profileEditOpen, setProfileEditOpen] = useState(false)`
- Mutation: `useCreateOrUpdateDraftMutation` + `useSubmitForReviewMutation` (from templeApi)
- Pass to OverviewTab: `onEditProfile={canEdit ? () => setProfileEditOpen(true) : undefined}`
- Dialog: Shadcn `<Dialog>` with a form for profile fields (phone, email, contactName, contactDesignation, website, landmark, historicalSignificance, bankName, bankIfsc, etc.)
- On save: `createOrUpdateDraft({ templeId: id, body: formValues })` then `submitForReview(id)` then cache invalidate

**Trust Edit Dialog (SA):**
- State: `const [trustEditOpen, setTrustEditOpen] = useState(false)`
- Mutation: `useUpdateTrustMutation` + trust submit mutation (from trustApi if it exists, or governanceApi)
- Pass to TrustTab: `onEditTrust={canEdit ? () => setTrustEditOpen(true) : undefined}`

**Employee Add/Edit (SA):**
- State: `const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false); const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null)`
- Mutation: `useCreateEmployeeMutation` + `useUpdateEmployeeMutation` (from employeeApi)
- Pass to StaffTab: `onAddEmployee={canEdit ? () => setEmployeeDialogOpen(true) : undefined}`, `onEditEmployee={canEdit ? (id) => { setEditingEmployeeId(id); setEmployeeDialogOpen(true) } : undefined}`

**SA Self-Approval Flow:** After SA submits staging, it becomes `PENDING_REVIEW`. The existing `Approve Profile` button in OverviewTab (rendered when `pendingStaging` is present and `canAct=true`) already handles SA approval. No new approval button needed.

### 6.10 Tab Prop Extensions

#### OverviewTab.tsx
Add to `OverviewTabProps`:
```typescript
onEditProfile?: () => void
```
Render in the "Temple Identity & Information" card header:
```tsx
{onEditProfile && (
  <Button variant="outline" size="sm" onClick={onEditProfile} className="ml-auto ...">
    Edit Profile
  </Button>
)}
```

**Existing callers not affected:** `DcTempleProfilePage` currently does not pass `onEditProfile`, so it defaults to `undefined` and button is hidden. Only the SA-updated `DcTempleProfilePage` and new `TaTempleDetailPage` will pass this prop.

#### TrustTab.tsx
Add to `TrustTabProps`:
```typescript
onEditTrust?: () => void
```
Render in the "Trust Registration" section header area:
```tsx
{onEditTrust && (
  <Button variant="outline" size="sm" onClick={onEditTrust}>Edit Trust</Button>
)}
```

#### StaffTab.tsx
Add to `StaffTabProps`:
```typescript
onAddEmployee?: () => void
onEditEmployee?: (employeeId: number) => void
```
- `onAddEmployee`: render "Add Employee" button near `SectionCard` title area
- `onEditEmployee`: replace or augment the existing "View" (Eye) button with an "Edit" option when this prop is provided

---

## 7. API & Authorization Plan

### 7.1 APIs Becoming Public

| API | Path | Current | New | PII Exposure | Safe? |
|---|---|---|---|---|---|
| Temple List | `GET /api/v1/temples` | isAuthenticated | permitAll | None (name, grade, deity, photo URL only) | ✓ |
| Profile Photo | `GET /api/v1/temples/{id}/profile-photo/serve` | filter chain auth | permitAll | None (binary image) | ✓ |
| Gallery Photo | `GET /api/v1/temples/{id}/photos/{photoId}/serve` | filter chain auth | permitAll | None (binary image) | ✓ |

### 7.2 APIs Requiring Behavior Change

| API | Change | Reason |
|---|---|---|
| `GET /api/v1/dc/temples` (DC search) | Remove district lock in `resolveDistrictId()` | DC can now select any district |
| `POST /api/v1/temples/{id}/profile/submit` | `TEMPLE_AUTHORITY_ONLY` → `CAN_SUBMIT` | SA must submit profile staging |

### 7.3 APIs That Must Remain Protected (No Changes)

| API | Why Protected |
|---|---|
| `GET /api/v1/temples/{id}` | Returns contactMobile, contactEmail, bankName, bankIfsc |
| `GET /api/v1/temples/{id}/profile/current` | Returns contact + bank info |
| `GET /api/v1/temples/{id}/profile/staging/active` | TA's workspace data |
| `GET /api/v1/dc/temples/{id}` | Full profile with financials, PAN, Aadhaar |
| All `POST/PUT/DELETE /api/v1/temples/**` | Write operations |
| All `/api/v1/governance/**` | Approval/rejection workflow |
| All `/api/v1/dc/temples/{id}/verify|flag|unflag` | DC governance actions |
| All `/api/v1/admin/**` | SA lifecycle actions |

### 7.4 Ownership Validation Strategy

`OwnershipGuard.assertOwnsTemple(templeId)`:
- Anonymous: return without restriction (cannot reach write endpoints)
- SA/DC/AUDITOR/VIEWER: return without restriction (logic checks only `TEMPLE_AUTHORITY`)
- TA (own temple): passes
- TA (other temple): throws 403

This guard is called in `createOrUpdateDraft`, `submitForReview`, `getActiveStaging`, `getById`, `getCurrentProfile`. SA is exempt from the guard. DC is exempt. Only TA is restricted.

### 7.5 District Validation Strategy

`JurisdictionGuard.assertDistrictScope(Temple temple, ScopeHelper.Claims claims)`:
- SA: returns immediately (no district restriction)
- TEMPLE_AUTHORITY: returns immediately (ownership is separate)
- VIEWER: returns immediately
- DC/DC_STAFF: traverses temple→hobli→taluk→district and throws 404 if mismatch
- Called from approval workflow services ONLY — never from search

`JurisdictionGuard.assertSameDistrict(Long resourceDistrictId)`:
- Called from `getById()` in TempleServiceImpl
- After fix: anonymous returns without restriction
- DC/DC_STAFF: throws 403 if district mismatch (TA/SA/etc. are bypassed)

---

## 8. Approval & Status Lifecycle

### 8.1 Temple Profile Staging Lifecycle

```
[TA/SA saves draft]
    POST /temples/{id}/profile/staging → DRAFT
                ↓
[TA/SA submits]
    POST /temples/{id}/profile/submit → SUBMITTED (via WorkflowEngine SUBMIT action)
    (or UPDATED_AFTER_APPROVAL → RESUBMITTED via RESUBMIT action)
                ↓
[DC opens profile page — auto-transition]
    POST /governance/declarations/... (via confirmMarkUnderReview) → UNDER_REVIEW
                ↓
[DC approves]
    POST /dc/profile/{stagingId}/approve → APPROVED
    → staging promoted to main temple table
    → TempleSearchSummary refreshed
                ↓
[DC rejects]
    POST /dc/profile/{stagingId}/reject → REJECTED (immutable)
    → TA must submit new draft
```

**SA Self-Approval:**
SA submits (via new `CAN_SUBMIT` endpoint) → `SUBMITTED` → SA views pending on DcTempleProfilePage → clicks existing "Approve Profile" button → APPROVED. The `canAct = true` for SA already exists. The existing `OverviewTab` approve flow already works for SA.

**Key invariant:** `REJECTED` is immutable. No re-edit of rejected staging. TA must create a new draft.

**Status displayed in frontend:** `pendingStaging.status` drives the `hasPendingData` / `hasUnreviewedData` flags in `OverviewTab`. After SA approves, `pendingStaging` becomes null → "Temple Oversight" governance panel shows `APPROVED`.

### 8.2 Trust Staging Lifecycle

Trust uses its own workflow (separate from profile staging). The flow is similar:
1. TA creates/updates trust: `POST/PUT /trusts/{id}` → DRAFT or UPDATED_AFTER_APPROVAL
2. TA submits: `POST /trusts/{id}/submit` (verify endpoint exists and uses `CAN_SUBMIT`)
3. DC/SA approves: existing `useApproveTrustMutation` in `governanceApi`

**SA Edit Trust:** SA calls `PUT /trusts/{id}` (`CAN_SUBMIT` — SA allowed, no ownership guard for SA) then `POST /trusts/{id}/submit` (verify). SA then uses existing Approve button on TrustTab (`canAct=true` for SA, `dcCanAct = trust.governanceStatus.actionableBy === 'DC'`).

**Action:** Must verify `POST /trusts/{trustId}/submit` endpoint exists in TrustController or elsewhere, and that it allows `CAN_SUBMIT` (not `TEMPLE_AUTHORITY_ONLY`).

### 8.3 Employee Direct Write Lifecycle

Employees use NO staging/workflow. Changes are live immediately:
- `POST /temples/{templeId}/employees` → employee created, instantly visible
- `PUT /employees/{id}` → employee updated instantly
- `OwnershipGuard` in EmployeeServiceImpl: only TA is restricted to own temple. SA bypasses.

No approval step. No pending review. Frontend updates immediately via RTK Query cache invalidation.

### 8.4 Status Synchronization

After any mutation, RTK Query cache invalidation:
- Profile staging mutations → invalidate `TempleStaging`, `TempleCurrentProfile`, `Temple` tags
- Trust mutations → invalidate `Trust`-related tags
- Employee mutations → invalidate `Employees` tag
- After SA profile submit + approve → invalidate `DcTempleProfile` + `DcTempleSearch` tags

The existing `useSubmitForReviewMutation` already invalidates `authApi` tags (for TA Dashboard checklist). This remains unchanged.

---

## 9. File-Level Impact Analysis

### 9.1 Backend — Complete File List

| File | Change Type | Risk | Lines Changed (est.) |
|---|---|---|---|
| `config/SecurityConfig.java` | Add 3 permit matchers | CRITICAL | 5 |
| `security/JurisdictionGuard.java` | Add `currentClaimsOrNull()`, update 2 methods | CRITICAL | 15 |
| `security/OwnershipGuard.java` | Add `currentClaimsOrNull()`, update 1 method | CRITICAL | 10 |
| `service/impl/temple/TempleServiceImpl.java` | Change 1 `@PreAuthorize` annotation | HIGH | 1 |
| `service/impl/dc/DcTempleSearchServiceImpl.java` | Change 3 lines in `resolveDistrictId()` | MEDIUM | 5 |
| `controller/temple/TempleController.java` | Change 1 `@PreAuthorize` annotation | MEDIUM | 1 |

### 9.2 Frontend — Complete File List

| File | Change Type | Risk | Notes |
|---|---|---|---|
| `constants/routePaths.ts` | Add 3 constants | LOW | |
| `routes/index.tsx` | Add 3 lazy imports + 3 routes | MEDIUM | Placement critical |
| `features/dc/dcHooks.ts` | Modify `effectiveDistrictId` logic | MEDIUM | Regression risk for DC |
| `features/dc/pages/DcTempleSearchPage/DcTempleSearchPage.tsx` | Remove `disabled` on district select | LOW | |
| `features/dc/pages/DcTempleProfilePage/DcTempleProfilePage.tsx` | Add SA edit dialogs + 3 callback props | HIGH | Complex file |
| `features/dc/pages/DcTempleProfilePage/tabs/OverviewTab.tsx` | Add `onEditProfile?` prop | LOW | |
| `features/dc/pages/DcTempleProfilePage/tabs/TrustTab.tsx` | Add `onEditTrust?` prop | LOW | |
| `features/dc/pages/DcTempleProfilePage/tabs/StaffTab.tsx` | Add `onAddEmployee?` + `onEditEmployee?` props | LOW | |
| **NEW:** `features/search/PublicTempleSearchPage.tsx` | New file | MEDIUM | No DC-only deps |
| **NEW:** `features/search/usePublicTempleSearch.ts` | New file | LOW | |
| **NEW:** `features/ta/pages/TaTempleSearchPage/TaTempleSearchPage.tsx` | New file | MEDIUM | |
| **NEW:** `features/ta/pages/TaTempleDetailPage/TaTempleDetailPage.tsx` | New file | HIGH | Two-mode rendering |
| **NEW:** `features/ta/hooks/useTaTempleDetail.ts` | New file | MEDIUM | |

---

## 10. Security Review

### 10.1 Risk Register

| # | Risk | Severity | Root Cause | Prevention |
|---|---|---|---|---|
| R1 | Anonymous NPE on `GET /api/v1/temples` | CRITICAL | `JurisdictionGuard.currentClaims()` and `OwnershipGuard.currentClaims()` cast principal without null-guard | Add `currentClaimsOrNull()` helper; return early for anonymous in `enforceDistrictId` and `assertOwnsTemple` |
| R2 | Wildcard public path exposes PII endpoint | CRITICAL | `GET /api/v1/temples/{id}` returns contactMobile, email, bankName, bankIfsc | Use EXACT path matchers: `"/api/v1/temples"` not `"/api/v1/temples/**"` |
| R3 | SA submits staging, DC bypassed (self-approves) | MEDIUM | SA has `canAct=true` in UI and is in `CAN_APPROVE` backend role | Acceptable by design — SA is authorized to self-approve. Document in governance audit log. |
| R4 | DC district spoofing for approval via payload | HIGH | After DC search unlock, DC can select any district | `assertDistrictScope()` validates against ACTUAL temple geo chain, not request params. Cannot be spoofed. Unchanged. |
| R5 | TA accesses another temple's staging via API | HIGH | URL manipulation: TA calls `POST /temples/{otherId}/profile/staging` | `OwnershipGuard.assertOwnsTemple(otherId)` blocks for TEMPLE_AUTHORITY with 403. Backend enforced. |
| R6 | TA navigates to `/dc/temples/1` directly | MEDIUM | URL manipulation | `RoleRoute allowedRoles=[DC, DC_STAFF, SA]` redirects TA to `/403`. Backend also blocks at `GET /api/v1/dc/temples/{id}` (CAN_READ_ALL excludes TA). |
| R7 | Public API scraping of temple list | LOW | Temple list now public | No PII in `TempleSearchResultResponse`. Rate limiting should be added as follow-up but is out of scope for this PR. |
| R8 | Concurrent profile approvals (race condition) | MEDIUM | SA + DC both approve same staging | `WorkflowEngine` uses optimistic locking (`@Version`). Second approval gets `OptimisticLockException` → 409. Already handled. |
| R9 | TA's temple reassigned but old JWT active | LOW | `claims.templeId()` in old JWT doesn't match new assignment | JWT has 15-min expiry. `OwnershipGuard` uses JWT claim. Old TA is blocked after refresh. |
| R10 | `permitAll()` on service method strips authentication context | LOW | Misconception: `permitAll()` still propagates existing auth context if present | Spring Security `permitAll()` means "don't block unauthenticated users" but still sets Authentication if a valid token is present. Authenticated users' contexts are preserved. |

### 10.2 Backend-Enforced Authorization (Frontend is defense-in-depth only)

The following restrictions MUST be backend-enforced (frontend hiding is insufficient alone):
- TA cross-temple write prevention → `OwnershipGuard.assertOwnsTemple()`
- DC cross-district approval prevention → `JurisdictionGuard.assertDistrictScope()`
- SA self-approval is intentional and backend-authorized
- Write endpoint authentication → Spring Security filter chain + `@PreAuthorize`

---

## 11. Edge Cases & Failure Handling

| Scenario | Risk | Expected Safe Behavior | Prevention |
|---|---|---|---|
| Anonymous `POST /api/v1/temples` | Privilege escalation | 401 from filter chain before service | `anyRequest().authenticated()` still applies to POST |
| DC selects another district, clicks Approve | District spoofing | Backend returns 404 via `assertDistrictScope()` | Frontend also hides Approve for non-own-district |
| TA edits profile while another submission is under DC review | Edit lock | `TempleProfileStagingServiceImpl.createOrUpdateDraft()` throws `IllegalStateException` (or auto-resolves for VERIFIED temples) | Existing EC-04 guard in service |
| SA edits suspended temple | Invalid lifecycle | `assertNotSuspended()` in service throws | Existing guard in `createOrUpdateDraft()` |
| Two SAs approve the same staging concurrently | Double approval | `WorkflowEngine` optimistic lock → 409 on second | Existing `@Version` field |
| TA views TaTempleDetailPage for temple where `getById` returns 403 | Frontend error | isError=true → show limited public info from navigation state | Handle error case: show public-only view |
| Session expires mid-edit | Stale form | RTK Query gets 401 → `baseQueryWithReauth` redirects to login | Existing `baseQueryWithReauth` handles 401 |
| Temple geo data incomplete (null hobli) during DC approval | NPE in `assertDistrictScope` | Throws `EntityNotFoundException(GEO_INCOMPLETE)` → 404 response | Existing null-guard chain in `assertDistrictScope` |
| `TempleSearchResultResponse.districtId` is null | Approve button logic breaks | DC approve button check: `temple.districtId === currentUser.districtId` → false when null → button hidden | Frontend null-safe comparison |
| Public user navigates to `/dc/temples` | Route bypass | `PrivateRoute` redirects to `/login` | `PrivateRoute` wraps all DC routes |
| TA navigates to `/ta/temples/99` where 99 is another temple | API returns 403 | `TaTempleDetailPage` catches error, shows limited view | Handle `isError` state in page component |
| DC searches another district, then refreshes — districtId persists in URL | Stale URL state | DC sees the previously selected district on reload — acceptable UX | DC initialization effect only fires when districtId is absent |

---

## 12. Regression Risk Analysis

| Existing Flow | Why It Could Break | Severity | Prevention |
|---|---|---|---|
| DC approval of own-district declarations | Removing `resolveDistrictId()` DC lock — could affect approval service | HIGH | `assertDistrictScope()` is NOT called from `DcTempleSearchServiceImpl`. It is called from `GovernanceWorkflowServiceImpl` which is not modified. Run approval test. |
| SA approval on `DcTempleProfilePage` | Adding SA edit dialogs could accidentally change `canAct` or profile load | MEDIUM | `canAct` logic is unchanged. New `canEdit` is additive. Audit OverviewTab `onApproveProfile` callback chain. |
| TA existing dashboard/edit flows (`/ta/temple`, `/ta/temple/edit`) | Adding TA search routes could conflict | LOW | New routes use `/ta/temples` (plural). Existing `/ta/temple` (singular) is unaffected. |
| DC district initialization on `DcTempleSearchPage` | Changing `effectiveDistrictId` logic could break DC initial load | HIGH | Keep initialization effects (populate from `dcContext`). Only change the derivation of `effectiveDistrictId` to read from URL for all roles. Test DC loading. |
| AUDITOR/VIEWER viewing DcTempleProfilePage | New tab props default to `undefined` — read-only for all users who don't pass them | LOW | Tab props are optional with `?` — existing callers pass nothing, no buttons rendered. |
| Existing TA `useSubmitForReviewMutation` | Backend annotation change from `TEMPLE_AUTHORITY_ONLY` to `CAN_SUBMIT` — TA still in `CAN_SUBMIT` | LOW | TA still has access. No behavioral change for TA. |
| `DcTempleSearchPage` for SA/AUDITOR/VIEWER | district dropdown change might affect statewide role behavior | MEDIUM | Statewide roles already use URL-based districtId. Only DC role behavior changes (from state lock to URL). |
| `TempleServiceImpl.search()` when authenticated DC calls it | Changing `@PreAuthorize` to `permitAll()` — does it break DC context? | LOW | `permitAll()` preserves authentication context when present. DC's JWT still flows through; `enforceDistrictId()` still applies DC lock from JWT via `JurisdictionGuard`. |
| `OwnershipGuard.assertOwnsTemple()` for TA write paths | Adding null-guard for anonymous — could it unintentionally allow TA to bypass? | HIGH | The null-guard returns only when `principal` is NOT `ScopeHelper.Claims`. TA write paths: JWT is present → `principal instanceof ScopeHelper.Claims` = true → existing check runs → TA is still blocked for non-own temples. |

---

## 13. Testing Strategy

### 13.1 Backend Unit Tests (JUnit 5 + Mockito)

All new tests go in `src/test/java/` mirroring the source structure. Follow the naming convention `should_<expected>_when_<condition>()`.

#### JurisdictionGuardTest

| Test Method | Scenario | Expected |
|---|---|---|
| `should_return_requestedDistrictId_when_principal_is_anonymous` | Anonymous auth in SecurityContext | Returns `requestedDistrictId` parameter |
| `should_return_jwtDistrictId_when_principal_is_DC` | DC principal in SecurityContext | Returns `claims.districtId()` (ignores filter) — still applies for authenticated DC |
| `should_return_requestedDistrictId_when_principal_is_SA` | SA principal | Returns filter's `requestedDistrictId` |
| `should_not_throw_when_principal_is_anonymous_assertSameDistrict` | Anonymous + `assertSameDistrict()` | Returns without throwing |
| `should_throw_when_DC_asserts_different_district` | DC principal, resourceDistrict ≠ jwtDistrict | Throws `JurisdictionAccessDeniedException` |

#### OwnershipGuardTest

| Test Method | Scenario | Expected |
|---|---|---|
| `should_not_throw_when_principal_is_anonymous` | Anonymous auth | Returns without throwing |
| `should_not_throw_when_principal_is_SA` | SA principal | Returns without throwing |
| `should_not_throw_when_TA_accesses_own_temple` | TA, templeId matches JWT | Returns without throwing |
| `should_throw_when_TA_accesses_different_temple` | TA, templeId ≠ JWT templeId | Throws `JurisdictionAccessDeniedException` |
| `should_throw_when_TA_has_null_templeId_in_jwt` | TA, `claims.templeId() = null` | Throws |

#### DcTempleSearchServiceImplTest (updated)

| Test Method | Scenario | Expected |
|---|---|---|
| `should_return_all_temples_when_DC_provides_no_districtId` | DC principal, no districtId in filter | Returns all districts (no filter) |
| `should_scope_to_provided_district_when_DC_selects_one` | DC principal, districtId=5 in filter | Returns only district 5 temples |
| `should_scope_to_provided_district_when_SA_selects_one` | SA principal, districtId=3 | Returns only district 3 |

#### GovernanceWorkflowServiceImplTest (regression test)

| Test Method | Scenario | Expected |
|---|---|---|
| `should_throw_DistrictScopeViolation_when_DC_approves_different_district_temple` | DC from district 1 approves district 2 declaration | Throws `DistrictScopeViolationException` |

#### TempleProfileStagingServiceImplTest (new)

| Test Method | Scenario | Expected |
|---|---|---|
| `should_create_draft_when_SA_calls_createOrUpdateDraft` | SA principal, any templeId | Returns staging response (SA bypasses ownership) |
| `should_submit_for_review_when_SA_calls_submitForReview` | SA principal (after controller fix) | Returns staging with SUBMITTED status |
| `should_throw_when_TA_calls_submitForReview_for_other_temple` | TA, different templeId | Throws `JurisdictionAccessDeniedException` |

### 13.2 Backend Integration Tests (Spring Boot Test + @WithMockUser)

| Scenario | Token | Method | Path | Expected Status |
|---|---|---|---|---|
| Anonymous search | None | GET | `/api/v1/temples` | 200 |
| Anonymous search with districtId | None | GET | `/api/v1/temples?districtId=1` | 200 |
| Anonymous detail access (PII) | None | GET | `/api/v1/temples/1` | 401 |
| Anonymous staging access | None | GET | `/api/v1/temples/1/profile/staging/active` | 401 |
| Anonymous write attempt | None | POST | `/api/v1/temples` | 401 |
| Anonymous governance action | None | POST | `/api/v1/governance/declarations/1/approve` | 401 |
| Photo serve | None | GET | `/api/v1/temples/1/profile-photo/serve` | 200 or 404 |
| DC search own district | DC JWT (district 1) | GET | `/api/v1/dc/temples?districtId=1` | 200 |
| DC search other district (new) | DC JWT (district 1) | GET | `/api/v1/dc/temples?districtId=2` | 200 (unlocked) |
| DC approves own-district declaration | DC JWT (district 1) | POST | `/api/v1/governance/declarations/{ownDistrictDecl}/approve` | 200 |
| DC approves other-district declaration | DC JWT (district 1) | POST | `/api/v1/governance/declarations/{otherDistrictDecl}/approve` | 404 |
| TA edits own temple staging | TA JWT | POST | `/api/v1/temples/{ownTempleId}/profile/staging` | 200 |
| TA edits other temple staging | TA JWT | POST | `/api/v1/temples/{otherTempleId}/profile/staging` | 403 |
| TA submits own temple (after fix) | TA JWT | POST | `/api/v1/temples/{ownTempleId}/profile/submit` | 200 |
| SA submits any temple (after fix) | SA JWT | POST | `/api/v1/temples/{anyTempleId}/profile/submit` | 200 |
| SA edits any temple | SA JWT | PUT | `/api/v1/temples/1` | 200 |

### 13.3 Frontend Component Tests (RTL + Vitest)

#### PublicTempleSearchPage

- `should_render_search_results_when_api_returns_data`: mock `useSearchTemplesQuery`, assert temple names rendered
- `should_show_empty_state_when_no_results`: mock empty response
- `should_not_render_edit_or_approve_buttons`: assert no "Edit" or "Approve" buttons present
- `should_show_loading_skeleton_while_fetching`: assert skeleton while `isLoading=true`

#### DcTempleSearchPage (regression tests)

- `should_not_lock_district_for_DC`: mount with DC role, change district dropdown, assert query fires with new district
- `should_initialize_district_from_context_for_DC`: DC role, dcContext.districtId=3, assert initial filter.districtId=3
- `should_work_for_SA_statewide`: SA role, no district lock, can filter any district
- `should_not_show_edit_buttons_for_DC`: DC role, assert no "Edit" buttons on temple cards (DC doesn't edit)

#### DcTempleProfilePage (SA edit addition)

- `should_show_edit_profile_button_for_SA`: role=SA, assert "Edit Profile" button visible in OverviewTab
- `should_not_show_edit_profile_button_for_DC`: role=DC, assert "Edit Profile" button absent
- `should_not_show_edit_profile_button_for_AUDITOR`: role=AUDITOR, assert absent
- `should_open_profile_edit_dialog_when_SA_clicks_edit`: click "Edit Profile", assert dialog opens

#### Tab Props (regression)

- `OverviewTab should_not_render_edit_button_when_onEditProfile_is_undefined`: pass no `onEditProfile` prop, assert button absent
- `TrustTab should_not_render_edit_button_when_onEditTrust_is_undefined`: same
- `StaffTab should_not_render_add_button_when_onAddEmployee_is_undefined`: same

#### TaTempleSearchPage

- `should_show_view_and_edit_button_for_own_temple`: currentUser.templeId=5, temple.id=5 → "View & Edit" visible
- `should_show_view_only_button_for_other_temple`: currentUser.templeId=5, temple.id=9 → "Edit" hidden

### 13.4 Playwright E2E Tests

#### Public Search

| Test | Steps | Assert |
|---|---|---|
| `public_search_renders_without_login` | Navigate to `/search` (no auth) | Temple list renders, no buttons except "View" (if any) |
| `public_search_keyword_filter` | Type keyword, wait for results | Results update |
| `public_search_district_filter` | Select district, apply | Results filtered by district |

#### DC District Unlock

| Test | Role | Steps | Assert |
|---|---|---|---|
| `dc_can_change_district_filter` | DC | Login, go to DC search, change district dropdown | New district temples shown |
| `dc_approval_still_blocked_cross_district` | DC | Login, change to different district, click approve on a temple | 404 from API or button hidden |

#### SA Edit Flow

| Test | Steps | Assert |
|---|---|---|
| `sa_edit_temple_profile` | SA login → DC temples → temple → Overview tab → Edit Profile → save → submit → badge shows PENDING_REVIEW |
| `sa_approve_own_edit` | Continue from above → click Approve Profile → APPROVED |
| `sa_edit_employee` | SA login → temple → Staff tab → Add Employee → save → employee appears immediately |

#### TA Own Temple Edit

| Test | Steps | Assert |
|---|---|---|
| `ta_own_temple_edit_via_search` | TA login → `/ta/temples` → own temple → "View & Edit" → Edit Profile → save → submit → PENDING_REVIEW badge |
| `ta_cannot_edit_other_temple` | TA login → `/ta/temples` → other temple → no Edit button visible |

#### Auth Barriers

| Test | Steps | Assert |
|---|---|---|
| `ta_cannot_access_dc_temple_detail` | TA login → navigate to `/dc/temples/1` directly | Redirected to `/403` |
| `public_user_cannot_access_protected_route` | Not logged in → navigate to `/dc/temples` | Redirected to `/login` |

---

## 14. Step-by-Step Execution Phases

### Phase 1 — Backend Security Guards (MUST BE FIRST)
**Goal:** Fix anonymous crash paths. Zero functional changes.

**Changes:**
1. `JurisdictionGuard.java` — add `currentClaimsOrNull()`, update `enforceDistrictId()` and `assertSameDistrict()`.
2. `OwnershipGuard.java` — add `currentClaimsOrNull()`, update `assertOwnsTemple()`.

**Validation checklist:**
- [ ] `JurisdictionGuardTest` all methods pass
- [ ] `OwnershipGuardTest` all methods pass
- [ ] Existing authenticated DC approval test passes (no regression)

**Do NOT proceed to Phase 2 until all Phase 1 tests pass.**

---

### Phase 2 — Backend Public Endpoint
**Goal:** Open `GET /api/v1/temples` to anonymous. Photo endpoints also public.

**Changes:**
1. `SecurityConfig.java` — add 3 explicit GET matchers.
2. `TempleServiceImpl.java` — change `@PreAuthorize` on `search()` to `permitAll()`.

**Validation checklist:**
- [ ] `GET /api/v1/temples` without auth token → 200
- [ ] `GET /api/v1/temples` with auth token → 200 (still works for authenticated)
- [ ] `GET /api/v1/temples/1` without auth → 401 (PII endpoint still protected)
- [ ] `POST /api/v1/temples` without auth → 401 (write still protected)
- [ ] `GET /api/v1/temples/1/profile-photo/serve` without auth → 200 or 404

---

### Phase 3 — Backend DC Search Unlock + SA Profile Submit Fix
**Goal:** DC can search any district. SA can submit profile staging.

**Changes:**
1. `DcTempleSearchServiceImpl.java` — change `resolveDistrictId()`.
2. `TempleController.java` — change `@PreAuthorize` on `submitForReview`.

**Validation checklist:**
- [ ] DC with district=1 JWT, sends districtId=2 to `/api/v1/dc/temples?districtId=2` → returns district 2 temples
- [ ] DC approval on other district still returns 404 (assertDistrictScope unchanged)
- [ ] SA calls `POST /api/v1/temples/{id}/profile/submit` → 200 (was 403)
- [ ] TA calls `POST /api/v1/temples/{ownId}/profile/submit` → still 200
- [ ] TA calls `POST /api/v1/temples/{otherId}/profile/submit` → still 403

---

### Phase 4 — Frontend Public Search Page
**Goal:** `/search` route accessible without login, shows temple list.

**Changes:**
1. `routePaths.ts` — add `PUBLIC_SEARCH`.
2. `routes/index.tsx` — add public route.
3. Create `PublicTempleSearchPage.tsx` and `usePublicTempleSearch.ts`.

**Validation checklist:**
- [ ] Navigate to `/search` without login → page renders (no redirect to `/login`)
- [ ] Keyword filter works → results update
- [ ] District filter works
- [ ] No edit/approve buttons visible
- [ ] Authenticated user can also access `/search`
- [ ] Existing `/login`, `/dc/temples`, `/ta/temple` routes unaffected

---

### Phase 5 — Frontend DC District Unlock
**Goal:** DC can change district filter in search UI.

**Changes:**
1. `dcHooks.ts` — change `effectiveDistrictId` derivation for DC to use URL.
2. `DcTempleSearchPage.tsx` — remove `disabled` on district select for DC role.

**Validation checklist:**
- [ ] DC logs in → district pre-populated from JWT (initialization still works)
- [ ] DC changes district dropdown → search results update to new district
- [ ] SA district dropdown behavior unchanged
- [ ] AUDITOR district behavior unchanged
- [ ] DC refresh after district change → selected district persists in URL

---

### Phase 6 — Frontend Tab Prop Extensions
**Goal:** OverviewTab/TrustTab/StaffTab have optional edit props. Existing callers unaffected.

**Changes:**
1. `OverviewTab.tsx` — add `onEditProfile?` prop.
2. `TrustTab.tsx` — add `onEditTrust?` prop.
3. `StaffTab.tsx` — add `onAddEmployee?` + `onEditEmployee?` props.

**Validation checklist:**
- [ ] Existing `DcTempleProfilePage` (DC/AUDITOR/VIEWER) — no buttons appear (props undefined)
- [ ] TypeScript compilation passes with no errors

---

### Phase 7 — SA Edit on DcTempleProfilePage
**Goal:** SA sees and can use Edit buttons on all three tabs of DcTempleProfilePage.

**Changes:**
1. `DcTempleProfilePage.tsx` — add `canEdit`, edit dialog states, mutations, pass callbacks to tabs.

**Validation checklist:**
- [ ] SA: "Edit Profile" button visible in Overview tab
- [ ] SA: opens dialog, fills form, saves draft, submits → pendingStaging badge shows
- [ ] SA: uses existing Approve button to self-approve
- [ ] SA: "Edit Trust" button visible → dialog opens → saves
- [ ] SA: "Add Employee" button in Staff tab → saves → employee instantly visible
- [ ] DC: NO edit buttons visible (canEdit=false for DC)
- [ ] AUDITOR/VIEWER: NO edit buttons visible

---

### Phase 8 — TA Search and Detail Pages
**Goal:** TA has temple search page with edit capability for own temple.

**Changes:**
1. `routePaths.ts` — add `TA_TEMPLE_SEARCH`, `TA_TEMPLE_DETAIL`.
2. `routes/index.tsx` — add TA routes.
3. Create `TaTempleSearchPage.tsx`.
4. Create `TaTempleDetailPage.tsx`.
5. Create `useTaTempleDetail.ts`.

**Validation checklist:**
- [ ] TA navigates to `/ta/temples` → search page loads
- [ ] TA own temple card shows "View & Edit" button
- [ ] TA clicks "View & Edit" on own temple → lands on `/ta/temples/{ownId}` → edit buttons visible
- [ ] TA navigates to `/ta/temples/{otherId}` → no edit buttons (isOwnTemple=false)
- [ ] TA profile edit → submit → PENDING_REVIEW badge
- [ ] TA navigates to `/dc/temples/1` → redirected to `/403` (existing RoleRoute)
- [ ] Existing `/ta/temple` route (own temple dashboard) still works

---

### Phase 9 — Testing & Regression Verification
**Goal:** Full test suite passes. No regressions.

**Run order:**
1. Backend unit tests: `mvn test -pl backend`
2. Backend integration tests: `mvn test -Dgroups=integration -pl backend`
3. Frontend unit tests: `cd frontend && pnpm test`
4. Frontend component tests (RTL): `pnpm test --run`
5. Playwright E2E: `cd e2e && npx playwright test`

**Regression checks to run manually:**
- DC declaration approval flow (own district)
- DC temple profile approval flow
- TA existing `/ta/temple` edit flow
- TA declaration submission
- SA admin governance page (`/admin/temple-governance`)
- AUDITOR read-only access
- VIEWER read-only access

---

## 15. Rollback & Recovery Considerations

### 15.1 Rollback Strategy Per Phase

| Phase | Rollback Method | Impact |
|---|---|---|
| Phase 1 (Security Guards) | Revert JurisdictionGuard + OwnershipGuard | Anonymous NPE returns (as before); no data loss |
| Phase 2 (Public Endpoint) | Revert SecurityConfig + TempleServiceImpl annotation | Temple search requires auth again; no data loss |
| Phase 3 (DC Unlock + SA Submit Fix) | Revert DcTempleSearchServiceImpl + TempleController | DC locks reapply; SA cannot submit (as before) |
| Phases 4-8 (Frontend) | Revert frontend files; no backend rollback needed | Routes removed; pages disappear; no data impact |

### 15.2 Database

No database schema changes in this plan. No Flyway migrations required. All changes are application-layer only. Rollback risk from DB perspective: zero.

### 15.3 Feature Flags (Optional)

If available in the codebase, wrap Phases 4-8 behind a feature flag for staged rollout. Backend phases (1-3) should be deployed independently and do not require feature flags — they are either safe to apply globally or are prerequisites.

---

## 16. Final Recommendations Before Implementation

### 16.1 Must-Do Before Starting

1. **Verify trust submit endpoint:** Find `POST /trusts/{trustId}/submit` (or equivalent). Confirm it exists and uses `CAN_SUBMIT` or broader. If it uses `TEMPLE_AUTHORITY_ONLY`, apply same fix as Phase 3. If it doesn't exist, SA trust edit via dialog cannot do submit — SA can only edit (PUT) without staging workflow.

2. **Verify `GET /api/v1/dc/temples` path vs `GET /api/v1/temples`:** Confirm `DcTempleSearchPage` uses `/api/v1/dc/temples` (via `useSearchDcTemplesQuery`) and NOT `/api/v1/temples` (via `useSearchTemplesQuery`). The plan assumes this. The `PublicTempleSearchPage` must use `useSearchTemplesQuery` from `templeApi.ts`, NOT `dcApi.ts`.

3. **Check `EmployeeServiceImpl` ownership guard:** Verify `EmployeeServiceImpl.create()` and `update()` call `OwnershipGuard.assertOwnsTemple()`. SA must bypass this for SA-to-write-any-temple to work. If missing, SA employee writes may fail.

4. **Review AppShell for public page:** `PublicTempleSearchPage` is NOT inside `<AppShell>`. It needs its own header/layout. Check if a public layout component exists; if not, create a minimal wrapper.

5. **Confirm `TempleSearchResultResponse` fields:** Verify `districtId` is included in the response. The DC approve button logic in `DcTempleSearchPage` relies on `temple.districtId`.

### 16.2 Architecture Decisions That Need Confirmation

| Decision | Options | Recommendation |
|---|---|---|
| TA viewing other temple details | A) Show only public data from search result; B) No detail page for other temples | **Option A** — pass navigation state from search to detail page; display public fields only |
| Public search page layout | A) Minimal header (no AppShell); B) New public layout component | **Option A** first — add to AppShell later if required |
| SA edit trust submit | A) PUT trust only (no submit); B) PUT + POST submit | **Option A** if no submit endpoint; **Option B** if endpoint confirmed |
| TA search URL | `/ta/temples` vs `/search` (shared with public) | **`/ta/temples`** — TA route is authenticated and uses TA-specific edit logic |

### 16.3 Implementation Priority Order

**Start with Phase 1 (Security Guards) — always first.** The crash paths are the most critical issue. All other phases depend on them.

**Then Phase 2 (Public Endpoint) + Phase 3 (DC Unlock + SA Submit) together** — they are independent.

**Frontend phases can proceed in parallel** once backend phases 1-3 are deployed and verified.

**Never deploy frontend changes before the backend security fixes** — the frontend may call `GET /api/v1/temples` without auth, which will 500 until the guards are fixed.

### 16.4 Code Quality Reminders

- No try-catch in controllers — let `@RestControllerAdvice` handle exceptions
- All new service methods: `@Transactional` (write) or `@Transactional(readOnly = true)` (read)
- All new React components: must handle loading, empty, and error states
- No API calls inside components — all data fetching in custom hooks
- New tab edit buttons: use Shadcn `<Button>` component exclusively
- Edit dialogs: use Shadcn `<Dialog>` + `<Form>` with Zod schema validation
- RTK Query mutations: invalidate appropriate tags after success
- No hardcoded secrets or sensitive data in logs

---

*End of Master Implementation Plan*
