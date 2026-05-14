---

## Execution Readiness Analysis

---

### 1. Current Architecture Understanding (Verified)

**Authentication chain (confirmed):**
1. `SecurityConfig` — global filter chain, `.anyRequest().authenticated()`. Current public paths: auth, geo, swagger, actuator, error only
2. `JwtAuthenticationFilter` — reads Bearer token / cookie; anonymous request passes through (no principal set)
3. `@PreAuthorize` at service layer (method security) — all temple read/write methods require `isAuthenticated()` or role
4. `JurisdictionGuard` / `OwnershipGuard` — component-level guards inside service methods

**Critical discovery — two runtime crash paths for anonymous users (blockers):**

- `JurisdictionGuard.enforceDistrictId()` → `currentClaims()` → casts `SecurityContextHolder` principal to `ScopeHelper.Claims` → throws `IllegalStateException` if principal is anonymous
- `OwnershipGuard.assertOwnsTemple()` → same crash path

Both are called from `TempleServiceImpl.search()`. Opening the endpoint without fixing these **will produce a 500 on every anonymous request**.

**Frontend architecture (confirmed):**
- `PrivateRoute` — validates `httpOnly` cookie via `useGetCurrentUserQuery`; redirects unauthenticated to `/login`
- `RoleRoute` — reads Redux `currentUser.role`; redirects wrong roles to `/403`
- `DcTempleSearchPage` — shared across DC, SA, AUDITOR, VIEWER routes
- **TA has NO access to any temple search page** — this is a missing route that must be added
- **No public route exists** — must be created
- `CurrentUser` interface has `userId`, `role`, `districtId?`, `templeId?` — ownership data is available for conditional button rendering
- `TempleCard` in search results currently has **one button only** (View/Review/Urgent) — Edit/Approve buttons do not exist yet
- `DcTempleSearchPage` uses `useDcDashboard()` and `useGetDcContextQuery()` — both are DC-only APIs that would fail for TA or public users

---

### 2. File-Level Impact Analysis

#### Backend Files — Impact & Risk

| File | Why Impacted | Change Type | Dependency Risk |
|---|---|---|---|
| `config/SecurityConfig.java` | Controls which paths bypass authentication | Add `HttpMethod.GET` matchers for temple search + photo serve endpoints | **High** — too-broad a path pattern opens unintended write endpoints |
| `security/JurisdictionGuard.java` | `currentClaims()` casts principal — throws NPE for anonymous | Add null/type-guard before accessing principal | **Critical** — all 5 methods use this; must verify each is guarded correctly |
| `security/OwnershipGuard.java` | `currentClaims()` same crash path | Add null/type-guard | **Critical** — called in every write path across Trust, Employee, Contractor, Declaration |
| `service/impl/temple/TempleServiceImpl.java` | `search()` has `@PreAuthorize("isAuthenticated()")` + calls `enforceDistrictId()` | Change to `permitAll()`, remove `enforceDistrictId()` call for search only | **High** — two independent changes on same method; risk of incorrectly touching other methods |
| `service/impl/dc/DcTempleSearchServiceImpl.java` | `resolveDistrictId()` hard-locks DC to JWT district | Remove DC district lock for search query | **Medium** — approval/reject paths do NOT call this; isolated to search service |

**Files confirmed NOT to be modified (approval/workflow services):**
- `TempleProfileWorkflowServiceImpl.java` — uses `assertDistrictScope()` directly
- `GovernanceWorkflowServiceImpl.java` — same
- `DcTempleVerificationServiceImpl.java` — same
- `DeclarationWorkflowServiceImpl.java` — same
- All remain untouched

#### Frontend Files — Impact & Risk

| File | Why Impacted | Change Type | Dependency Risk |
|---|---|---|---|
| `routes/index.tsx` | No public search route; no TA search route | Add `/search` public route outside `<PrivateRoute>`; add TA to a search route | **High** — incorrect placement (inside PrivateRoute vs outside) breaks auth intent |
| `constants/routePaths.ts` | New route constant needed | Add `PUBLIC_SEARCH: '/search'` | Low |
| `features/dc/pages/DcTempleSearchPage/DcTempleSearchPage.tsx` | District dropdown locked; role-based buttons absent | Remove `disabled` prop on district select; add Edit/Approve logic per role | **Medium** — highly complex file (~1300 lines), many existing role checks |
| `features/dc/dcHooks.ts` | `useDcTempleSearch` locks `districtId` state to `currentUser.districtId` via `useEffect`; pre-populates DC lock | Remove the lock `useEffect`; keep initialization only | **Medium** — multiple related `useEffect`s for district; must not break SA/AUDITOR/VIEWER flows |
| TempleGovernancePage.tsx | Workspace root file — confirmed as SA admin lifecycle page (`suspend/freeze/archive`) | **No changes needed** — this is not the edit-from-search flow | None |

**New files needed:**
| File | Reason | Risk |
|---|---|---|
| `features/search/PublicTempleSearchPage.tsx` | Public/TA search cannot reuse `DcTempleSearchPage` — it calls `useGetDcContextQuery` (DC-only, returns 403 for TA/anonymous) and `useDcDashboard()` (DC-only stats) | **High** — must create a lightweight standalone page using `GET /api/v1/temples` |
| `features/search/usePublicTempleSearch.ts` (optional) | Separate hook for public/TA search if needed | Medium |

---

### 3. API Impact Analysis

#### APIs Becoming Public (New Behavior)

| API | Current Behavior | New Behavior | Security Concern |
|---|---|---|---|
| `GET /api/v1/temples` | `isAuthenticated()` required | No auth required | **Must use HttpMethod.GET matcher only; response shape exposes no PII (verified: only id, name, grade, photoUrl, districtId, trust status)** |
| `GET /api/v1/temples/{id}/profile-photo/serve` | No explicit @PreAuthorize (controller level — auth from filter chain) | No auth required | Photo URLs are not sensitive; acceptable |
| `GET /api/v1/temples/{id}/photos/{photoId}/serve` | Same | No auth required | Same |

#### APIs Requiring Behavior Change

| API | Current Behavior | Required Change | Risk |
|---|---|---|---|
| `GET /api/v1/dc/temples` | DC locked to JWT district | DC can pass any `districtId` | Low — approval is a separate endpoint |
| `GET /api/v1/temples` (DC calls) | `enforceDistrictId()` locks DC | Remove district lock for search | Medium — must confirm approval path doesn't call this |

#### APIs That MUST Remain Protected (Never Go Public)

| API | Reason |
|---|---|
| `GET /api/v1/temples/{id}` | Returns `contactMobile`, `contactEmail`, `bankName`, `bankIfsc`, `dcRejectionReason` |
| `GET /api/v1/temples/{templeId}/profile/current` | Returns contact details, bank info |
| `GET /api/v1/temples/{templeId}/profile/staging/active` | TA workspace data |
| ALL `POST /api/v1/temples/**` | Write operations |
| ALL `PUT /api/v1/temples/**` | Write operations |
| ALL `/api/v1/governance/**` | Approval/rejection workflow |
| ALL `/api/v1/dc/temples/{id}/verify|flag|unflag` | DC governance actions |
| ALL `/api/v1/admin/**` | SA lifecycle |
| `GET /api/v1/dc/temples/{id}` | Full profile with financials, PAN, Aadhaar-related data |

---

### 4. Role & Permission Validation Matrix

| Operation | Public User | Temple Authority | DC | Super Admin | Backend Enforced By |
|---|---|---|---|---|---|
| Access temple search page | ✓ (new) | ✓ (new route needed) | ✓ (existing) | ✓ (existing) | SecurityConfig public path |
| `GET /api/v1/temples` (search API) | ✓ (new) | ✓ | ✓ | ✓ | `permitAll()` |
| Filter by any district | ✓ | ✓ | ✓ (new) | ✓ | Removed `enforceDistrictId` |
| `GET /api/v1/temples/{id}` (detail) | ✗ | Own temple only | Own district only | ✓ all | `isAuthenticated()` + `OwnershipGuard` + `JurisdictionGuard` |
| Edit own temple profile staging | ✗ | ✓ (own temple) | ✗ | ✓ | `CAN_SUBMIT` + `OwnershipGuard` |
| Edit any temple | ✗ | ✗ | ✗ | ✓ | `ADMIN_ONLY` on PUT |
| Approve/reject own district | ✗ | ✗ | ✓ | ✓ | `CAN_ACT_DC` + `assertDistrictScope()` |
| Approve/reject any district | ✗ | ✗ | ✗ | ✓ | `CAN_ACT_DC` (SA bypasses `assertDistrictScope`) |
| Change district filter (search) | ✓ | ✓ | ✓ (new) | ✓ | No backend enforcement on search |
| Cross-temple ownership bypass | ✗ | ✗ | ✗ | ✓ | `OwnershipGuard` — TA only |
| Cross-district approval bypass | ✗ | ✗ | ✗ | ✓ | `JurisdictionGuard.assertDistrictScope()` |
| Temple suspension/freeze/archive | ✗ | ✗ | ✗ | ✓ | `ADMIN_ONLY` |
| View board member Aadhaar | ✗ | ✗ | ✗ | ✓ | `AesEncryptionConverter` + role check |

**Backend-only enforced (frontend hiding is defense-in-depth only):**
- TA cross-temple edit prevention → `OwnershipGuard.assertOwnsTemple()`
- DC cross-district approval prevention → `JurisdictionGuard.assertDistrictScope()`
- Write endpoint auth → Spring Security filter chain + `@PreAuthorize`

---

### 5. Security Readiness Review

#### Critical Risks

**Risk 1: Anonymous NPE crash (Severity: Critical)**
- `JurisdictionGuard.currentClaims()` casts `SecurityContextHolder.getContext().getAuthentication().getPrincipal()` to `ScopeHelper.Claims`. For anonymous requests, `getAuthentication()` returns an `AnonymousAuthenticationToken` with a `String` principal ("anonymousUser"), not `ScopeHelper.Claims`.
- Root cause: No type check before cast
- Prevention: Add `if (!(principal instanceof ScopeHelper.Claims c)) return;` pattern before any role-based logic

**Risk 2: OwnershipGuard called from authenticated-only write paths (Severity: High)**
- If the null-guard is added naively to `OwnershipGuard`, it must only skip restriction for anonymous (not bypass it for authenticated TA). Logic: "if anonymous, no ownership restriction" is correct for READ, but write paths are already gated by `@PreAuthorize("isAuthenticated()")` or stricter, so anonymous never reaches write methods.
- Prevention: The null-guard returns early (no restriction) for anonymous — correct because anonymous can only reach the `search()` method anyway. Write paths have role guards before `OwnershipGuard` is invoked.

**Risk 3: `SecurityConfig` overly broad GET path match (Severity: High)**
- If `/api/v1/temples/**` is added as a GET public path without careful scoping, it may inadvertently expose `GET /api/v1/temples/{id}` (detail with bank/contact info) and `GET /api/v1/temples/{templeId}/profile/staging/active` (staging data).
- Prevention: **Do NOT use a wildcard path.** Only explicitly list:
  - `GET /api/v1/temples` (the list endpoint)
  - `GET /api/v1/temples/{templeId}/profile-photo/serve`
  - `GET /api/v1/temples/{templeId}/photos/{photoId}/serve`
  - Use Spring's `requestMatchers(HttpMethod.GET, "/api/v1/temples")` exactly

**Risk 4: DC district spoofing for approval (Severity: High)**
- After DC district filter is unlocked for search, a malicious actor could test if the approval API also accepts an arbitrary district. It does not — `assertDistrictScope()` validates via the temple's actual geo data (temple → hobli → taluk → district traversal), not via the request body. Cannot be spoofed via payload.
- No change needed; verified safe.

**Risk 5: TA accessing DC detail page via URL manipulation (Severity: Medium)**
- TA is not in `RoleRoute allowedRoles=[DC, DC_STAFF, SA]` for `DC_TEMPLE_DETAIL`. Direct URL navigation by TA to `/dc/temples/123` will hit `RoleRoute` → redirect to `/403`. Backend API `GET /api/v1/dc/temples/{id}` requires `CAN_READ_ALL` (which excludes TA). Safe.
- The new TA search page will navigate TA to `/ta/temple` (their own temple detail) not to `/dc/temples/:id`.

**Risk 6: Frontend-only restrictions (Severity: Medium — must not be sole guard)**
- Edit buttons hidden for non-TA roles and approve buttons hidden for non-DC/SA roles in frontend are **defense-in-depth only**. Backend already enforces: `OwnershipGuard` for TA edits, `assertDistrictScope` for DC approvals. No new validation needed.

**Risk 7: Photo serve endpoints potentially leaking file paths (Severity: Low)**
- Photo serve endpoints stream files from local storage. Opening them publicly means temple photo files are accessible without auth. Temple photos are intended for public display. The response returns binary file data only; no metadata or file path is leaked. Acceptable.
- Ensure `Cache-Control: max-age=86400, private` is changed to `public` for genuinely public photos (minor improvement, optional).

---

### 6. Regression Risk Analysis

| Regression | Why It May Happen | Severity | Detection | Prevention |
|---|---|---|---|---|
| DC approval breaks | Removing `enforceDistrictId()` from `TempleServiceImpl.search()` might be confused with removing it from approval methods | **High** | Attempt DC approve on another district's temple → expect 404 | Only modify `search()` method; leave all approval service methods untouched |
| DC dashboard KPI breaks | `useDcDashboard()` fetches DC-specific stats; if routing changes break its role guard | Medium | DC dashboard shows no data | `useDcDashboard()` already skips for non-DC roles — unaffected |
| TA dashboard breaks | TA route changes | Medium | TA cannot navigate to dashboard | TA routes under `/ta/**` are unchanged; new search route is additive |
| `DcTempleSearchPage` breaks for SA/AUDITOR/VIEWER | Changes to `disabled` prop or `useEffect` in dcHooks.ts affecting statewide role logic | Medium | SA cannot change district in search | Targeted change: only modify DC-specific district lock, not statewide role path |
| Existing authenticated search breaks | Making `search()` `permitAll()` could change Spring Security AOP behavior | Low | Authenticated DC search returns wrong results | `permitAll()` in Spring Security still propagates authentication context if present; does not strip it |
| AUDITOR/VIEWER see wrong detail route | `detailPath` logic in `DcTempleSearchPage` computes route based on role; adding new roles may hit wrong branch | Low | TA or public user lands on wrong detail page | New public page will NOT reuse `DcTempleSearchPage`; avoids this entirely |
| `useDcTempleSearch` DC district pre-populate breaks | Modifying the `useEffect` that initializes `districtId` | Medium | DC sees blank district on page load | Only remove the lock on change; keep initialization (`setDistrictId(currentUser.districtId)`) intact |
| Existing E2E tests fail on route changes | No new routes conflict with existing ones; only additions | Low | E2E navigation fails | New routes use new paths (`/search`); existing `/dc/temples`, `/ta/*`, `/auditor/*` unchanged |

---

### 7. Dependency Chain & Execution Order

The following is the **critical dependency chain** — each phase must be completed and verified before the next begins:

```
Phase 1: Backend Security Layer (MUST BE FIRST)
    ├── Fix JurisdictionGuard null-guard        ← prerequisite for Phase 2
    ├── Fix OwnershipGuard null-guard           ← prerequisite for Phase 2
    └── Verify with unit tests
            ↓
Phase 2: Backend Public Endpoint
    ├── SecurityConfig: add explicit GET matchers
    ├── TempleServiceImpl.search(): change to permitAll()
    └── Integration test: GET /api/v1/temples without auth → 200
            ↓
Phase 3: Backend DC Search Unlock
    ├── DcTempleSearchServiceImpl: unlock resolveDistrictId()
    ├── TempleServiceImpl.search(): remove enforceDistrictId() call
    └── Verify DC approval on non-own-district still returns 404
            ↓
Phase 4: Frontend Public Search Page
    ├── routePaths.ts: add PUBLIC_SEARCH constant
    ├── routes/index.tsx: add public route
    ├── Create PublicTempleSearchPage.tsx (uses GET /api/v1/temples)
    └── Manual test: navigate to /search without login
            ↓
Phase 5: Frontend DC District Unlock
    ├── dcHooks.ts: remove DC district state lock
    ├── DcTempleSearchPage.tsx: remove disabled prop on district select
    └── Verify DC can change district AND approve/reject still restricted
            ↓
Phase 6: Frontend Role-Conditional Buttons
    ├── DcTempleSearchPage.tsx: add Edit button (SA all, TA own only, DC none)
    ├── DcTempleSearchPage.tsx: Approve/Reject accessible (SA all, DC own district)
    ├── routePaths.ts: add TA search route
    └── routes/index.tsx: add TA to public or shared search route
            ↓
Phase 7: Testing & Regression Verification
    ├── Backend unit tests
    ├── Integration/authorization tests
    ├── Frontend component tests
    └── Playwright E2E
```

---

### 8. Testing Readiness Plan

#### Backend Unit Tests (JUnit 5 + Mockito)

| Test | Class | Method |
|---|---|---|
| Anonymous principal returns requestedDistrictId | `JurisdictionGuardTest` | `should_return_requestedDistrictId_when_principal_is_anonymous()` |
| DC principal returns JWT districtId | `JurisdictionGuardTest` | `should_return_jwtDistrictId_when_principal_is_DC_and_filter_has_different_districtId()` |
| SA principal returns requestedDistrictId | `JurisdictionGuardTest` | `should_return_requestedDistrictId_when_principal_is_SA()` |
| Anonymous principal does not throw in assertOwnsTemple | `OwnershipGuardTest` | `should_not_throw_when_principal_is_anonymous()` |
| TA with wrong temple throws in assertOwnsTemple | `OwnershipGuardTest` | `should_throw_when_TA_accesses_different_temple()` |
| DC search returns all districts when no filter | `DcTempleSearchServiceImplTest` | `should_return_all_temples_when_DC_provides_no_districtId()` |
| DC search scopes to provided district | `DcTempleSearchServiceImplTest` | `should_scope_to_provided_district_when_DC_selects_one()` |
| DC approval still rejects cross-district attempt | `GovernanceWorkflowServiceImplTest` | `should_throw_DistrictScopeViolation_when_DC_approves_different_district_temple()` |

#### Integration/Authorization Tests (Spring Boot Test)

| Scenario | HTTP Method | Path | Token | Expected |
|---|---|---|---|---|
| Anonymous search | GET | `/api/v1/temples` | None | 200 |
| Anonymous search with districtId | GET | `/api/v1/temples?districtId=1` | None | 200 |
| Anonymous detail access (PII endpoint) | GET | `/api/v1/temples/1` | None | 401 |
| Anonymous write attempt | POST | `/api/v1/temples` | None | 401 |
| Anonymous governance action | POST | `/api/v1/governance/declarations/1/approve` | None | 401 |
| DC photo serve | GET | `/api/v1/temples/1/profile-photo/serve` | None | 200 or 404 |
| DC approves own-district temple | POST | `/api/v1/governance/declarations/1/approve` | DC JWT | 200 |
| DC approves other-district temple | POST | `/api/v1/governance/declarations/1/approve` | DC JWT (district 1), temple in district 2 | 404 |
| TA edits own temple staging | POST | `/api/v1/temples/{ownTempleId}/profile/staging` | TA JWT | 200 |
| TA edits other temple staging | POST | `/api/v1/temples/{otherTempleId}/profile/staging` | TA JWT | 403 |
| SA edits any temple | PUT | `/api/v1/temples/1` | SA JWT | 200 |
| SA approves any district declaration | POST | `/api/v1/governance/declarations/1/approve` | SA JWT | 200 |

#### Frontend Component Tests (RTL + Vitest)

| Test | Component | Coverage |
|---|---|---|
| Shows no edit/approve buttons for public user | `PublicTempleSearchPage` | Public view |
| Shows edit button only for own temple when TA | `DcTempleSearchPage` | `role=TA, currentUser.templeId=5, temple.id=5` → Edit visible |
| Hides edit button for TA on other temple | `DcTempleSearchPage` | `role=TA, currentUser.templeId=5, temple.id=99` → Edit hidden |
| Shows edit button for all temples when SA | `DcTempleSearchPage` | `role=SA` → Edit visible on all |
| Shows approve button for DC own district | `DcTempleSearchPage` | `role=DC, currentUser.districtId=1, temple.districtId=1` → Approve visible |
| Hides approve button for DC on other district | `DcTempleSearchPage` | `role=DC, currentUser.districtId=1, temple.districtId=2` → Approve hidden |
| District dropdown is NOT disabled for DC | `DcTempleSearchPage` | `role=DC` → district SearchableSelect enabled |
| DC district initializes from currentUser but changes are allowed | `useDcTempleSearch` hook | Change `districtId` → filter updates |
| SA/AUDITOR/VIEWER district dropdown works | `DcTempleSearchPage` | Regression test |

#### Playwright E2E Tests

| Scenario | Role | Steps | Assert |
|---|---|---|---|
| Public search without login | None | Navigate to `/search`, type keyword | Results render, no action buttons |
| TA search - see own edit button | TA | Login, navigate to `/search`, see temple list | Edit button on own temple; no Edit on others |
| TA search - edit own temple | TA | Click Edit on own temple | Navigates to `/ta/temple/edit` |
| DC search - change district | DC | Login, change district filter | Results update to new district |
| DC approve own district | DC | Login, navigate to temple detail in own district | Approve button present |
| DC cannot approve other district | DC | Navigate to temple detail in other district | Approve button absent OR API returns 404 |
| SA edit any temple | SA | Login, go to `/dc/temples`, click Edit on any temple | Navigates to temple edit page |
| SA approve any temple | SA | Go to temple detail | Approve/Reject buttons present |
| TA direct URL to DC edit page | TA | Navigate to `/dc/temples/1` | Redirected to `/403` |

---

### 9. Edge Case & Failure Scenarios

| Scenario | Risk | Expected Safe Behavior |
|---|---|---|
| Anonymous user submits POST to `/api/v1/temples` | Privilege escalation attempt | SecurityFilterChain blocks before controller; 401 response |
| DC sends `districtId=2` in approval API body while JWT says district 1 | District spoofing attempt | `assertDistrictScope()` validates against temple's ACTUAL geo chain, not request body. Returns 404. |
| TA modifies JWT claim to change `templeId` | Token forgery | JWT is signed RS256; cannot be modified without private key. Verification fails → 401. |
| TA sends API request with `templeId` set to another temple in URL | IDOR attempt | `OwnershipGuard.assertOwnsTemple()` compares URL templeId against JWT claim. 403. |
| DC changes district filter in UI, then quickly clicks Approve | Race between search and action | Frontend hides Approve for non-own-district results. Even if UI glitch shows it, `assertDistrictScope()` blocks server-side. |
| User logs out in tab A while tab B still shows search results with Edit buttons | Stale UI state | RTK Query auto-invalidates on next API call; 401 triggers redirect to login |
| Two DCs from different districts attempt to approve same declaration concurrently | Concurrent approval | WorkflowEngine uses optimistic lock (`@Version`). Second approval gets `OptimisticLockException` → 409 |
| Incomplete geo data (temple has null hobli) when DC tries to approve | Data integrity | `assertDistrictScope()` throws `EntityNotFoundException(GEO_INCOMPLETE)`. Does not silently approve. |
| TA's temple gets reassigned to another TA (admin user change) | Stale JWT | Old JWT still carries old `templeId`. `OwnershipGuard` uses JWT claim — blocks old TA correctly since JWT expires (15 min default). After token refresh, new claim loads. |
| Public user directly navigates to `/dc/temples` | Route bypass attempt | `PrivateRoute` redirects to `/login`. The `/search` public page remains accessible. |
| SA clicks Edit on a suspended temple | Invalid lifecycle state | `assertNotSuspended()` in `TempleProfileStagingServiceImpl.createOrUpdateDraft()` throws with clear error. Frontend should show error toast. |
| DC refreshes search page after district filter change — districtId persists in URL | Stale URL state | The new implementation reads districtId from URL for statewide/DC roles. On reload, DC sees their previously selected district. This is acceptable behavior. |
| `TempleSearchResultResponse.districtId` is null (bad data) | Button logic depends on districtId | DC approve button check: `temple.districtId === currentUser.districtId` — if `temple.districtId` is null, condition is false, button hidden. Safe. |
| Multi-tab: SA approves in tab A while tab B still shows Approve button for same item | Concurrent SA actions | WorkflowEngine's optimistic lock prevents double-approval. Second attempt returns 409 or "already approved" response. |

---

### 10. Blockers & Unknowns (Pre-Implementation Clarifications)

| Item | Status | Risk if Unresolved |
|---|---|---|
| **TA search page navigation target**: When TA clicks "Edit" on own temple from public search, where does it go? `/ta/temple/edit` (existing TA edit route) or a new shared edit page? | Needs decision | Cannot implement TA edit button without knowing target route |
| **Public search path**: `/search` vs `/temples` vs `/public/search` | Needs decision | Low — any path works; requires agreement |
| **`DcTempleSearchPage` for SA via `/admin/temple-governance`**: `TempleGovernancePage` (confirmed at `features/admin/pages/TempleGovernancePage/`) uses suspend/freeze/archive, NOT the edit-from-search flow. SA edit of temple profile goes through DC_TEMPLES route. Confirmed — no governance page changes needed | Confirmed ✓ | None |
| **`permitAll()` vs removing `@PreAuthorize` on search()**: Spring `permitAll()` inside `@PreAuthorize` annotation is the correct approach; alternatively, removing the annotation entirely relies on the method having no security proxy by default. Use `permitAll()` explicitly for auditability | Confirmed — use `permitAll()` | None |
| **TA route structure**: Should TA access the same `PublicTempleSearchPage` (outside PrivateRoute) or have their own authenticated search route (inside PrivateRoute, inside TA RoleRoute)? | Needs decision | If inside PrivateRoute: TA edit button can safely use `currentUser.templeId`. If outside: anonymous and TA share same page, edit button uses optional `currentUser` |
| **Rate limiting on public endpoint**: No rate limiter currently exists; public search is now scrapable | Out of scope for this PR — noted as follow-up | Medium — scrapable but no PII exposed |

---

### 11. Final Execution Readiness Report

**Backend readiness:** 5 files need changes. All changes are surgical and isolated. Approval/workflow services require zero changes. The null-guard fix is the single most important item and must be done first.

**Frontend readiness:** 1 new page, 3 file modifications. The decision to create a separate `PublicTempleSearchPage` (not reuse `DcTempleSearchPage`) is mandatory — `DcTempleSearchPage` has hard dependencies on DC-only APIs that would crash for TA/public. The existing `TempleCard` needs an additional optional `onEdit` prop to support role-conditional edit navigation.

**Authorization readiness:** All approval/rejection guards are backend-enforced and unchanged. Frontend button visibility is defense-in-depth. No new privilege escalation paths identified. DC district spoofing via payload is already blocked.

---

### 12. Recommended Safe Implementation Sequence

**Step 1 (Backend — Security Guards)**
Fix `JurisdictionGuard` and `OwnershipGuard` null-guards. Run unit tests. Do not proceed until these pass.

**Step 2 (Backend — Public Endpoint)**
Add explicit `HttpMethod.GET` matchers for `/api/v1/temples` (exact path only, no wildcard). Change `TempleServiceImpl.search()` to `@PreAuthorize("permitAll()")`. Run integration test: anonymous GET → 200, anonymous POST → 401.

**Step 3 (Backend — DC Search Unlock)**
Change `DcTempleSearchServiceImpl.resolveDistrictId()` and remove `enforceDistrictId()` call in `TempleServiceImpl.search()`. Run authorization test: DC approve across districts → 404.

**Step 4 (Frontend — Public Page)**
Create `PublicTempleSearchPage` using the existing `templeApi.searchTemples` RTK query (which now works without auth). Add `/search` route outside `<PrivateRoute>`. Verify no DC-specific hooks are imported.

**Step 5 (Frontend — DC Unlock)**
Modify dcHooks.ts to remove district lock. Modify DcTempleSearchPage.tsx to remove `disabled` prop on district select. Regression test: SA and AUDITOR district behavior unchanged.

**Step 6 (Frontend — Role-Conditional Buttons)**
Add `onEdit` prop to `TempleCard`. Add role/ownership logic in `DcTempleSearchPage` for Edit (SA: always; TA via separate page: own temple only) and Approve accessibility (DC: own district; SA: always). Add TA search route.

**Step 7 (Testing)**
Execute full test suite across all phases per the testing plan above.