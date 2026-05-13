

## Plan: Temple Detail Edit Feature — TA + SA

**TL;DR:** Add conditional Edit dialogs to the three screenshot tabs (Overview, Trust & Board, Staff). One backend permission fix for SA. New TA temple search + detail pages. Employees stay as direct writes; Profile and Trust go through staging → PENDING_REVIEW.

---

### Key findings from codebase

- All three tabs are currently **read-only** — zero edit UI exists anywhere in them
- TA has **no route** to `DcTempleProfilePage` — it requires `[DC, DC_STAFF, SA]`
- SA already reaches `DcTempleProfilePage` via the DC RoleRoute
- **Backend gap**: `POST /{templeId}/profile/submit` uses `TEMPLE_AUTHORITY_ONLY` — SA is blocked despite SA being in `CAN_SUBMIT` for every other staging endpoint. Trust submit already uses `CAN_SUBMIT` ✓
- `GET /api/v1/temples/{id}/profile/current` allows `CAN_READ_ALL or TEMPLE_AUTHORITY_ONLY` — TA can read any temple's profile ✓

---

### Phase 1 — Backend (1 file, 1 line)

**1.** In TempleController.java: change `@PreAuthorize(RoleConstants.TEMPLE_AUTHORITY_ONLY)` → `@PreAuthorize(RoleConstants.CAN_SUBMIT)` on `POST /{templeId}/profile/submit`. This allows SA to submit staging for review. No other backend changes needed.

---

### Phase 2 — Route constants

**2.** In routePaths.ts: add `TA_TEMPLE_SEARCH: '/ta/temples'` and `TA_TEMPLE_DETAIL: '/ta/temples/:templeId'`.

---

### Phase 3 — New TA pages (parallel with Phase 5)

**3a. `TaTempleSearchPage`** (new file under `features/temple-search/`)
- Uses `GET /api/v1/temples` (no DC-only dependencies)
- Unrestricted district filter
- "View" navigates to `TA_TEMPLE_DETAIL`

**3b. `TaTempleDetailPage`** (new file)
- Route `/ta/temples/:templeId`
- Computes `isOwnTemple = currentUser.templeId === Number(templeId)`
- **Reuses** existing `OverviewTab`, `TrustTab`, `StaffTab` components — only adds optional edit callback props
- Edit buttons appear **only when `isOwnTemple` is true**; other temples are read-only

**3c. `useTaTempleDetail` hook** (new file)
Composes from TA-accessible APIs:
- `GET /temples/{id}` + `GET /temples/{id}/profile/current` → profile data
- Existing `useGetTrustByTempleQuery` + `useGetBoardMembersQuery` → trust/board
- `GET /temples/{id}/employees` → staff
- `GET /temples/{id}/profile/staging/active` → pending staging (own temple only)

---

### Phase 4 — Edit dialogs in TaTempleDetailPage (depends on Phase 3)

All forms open as **dialogs on the same page** — no navigation away.

| Tab | Edit triggers | API | Workflow |
|---|---|---|---|
| Overview | Edit Profile dialog | `POST /staging` → `POST /submit` | → PENDING_REVIEW, DC approves |
| Trust & Board | Edit Trust dialog | `PUT /trusts/{id}` → `POST /trusts/{id}/submit` | → PENDING_REVIEW, DC approves |
| Staff | Add/Edit employee dialogs | `POST /employees` or `PUT /employees/{id}` | Direct write, live immediately |

After profile/trust submit: header badge updates to `PENDING_REVIEW` via RTK Query cache invalidation.

---

### Phase 5 — SA edit on existing DcTempleProfilePage (parallel with Phase 3)

**Files**: DcTempleProfilePage.tsx, and the three tabs below.

- Add `canEdit = role === USER_ROLES.SUPER_ADMIN`
- Add dialog state + mutations (staging create, profile submit, trust update, employee CRUD)
- Pass `onEditProfile={canEdit ? openDialog : undefined}` to OverviewTab (same dialog UI as Phase 4)
- Pass `onEditTrust={canEdit ? openDialog : undefined}` to TrustTab
- Pass `onAddEmployee`/`onEditEmployee` to StaffTab

**SA self-approval flow**: SA edits → submits → PENDING_REVIEW → uses **existing** Approve button already in `DcTempleProfilePage` to self-approve.

---

### Phase 6 — Tab prop extensions (depends on Phase 5)

| File | Change |
|---|---|
| OverviewTab.tsx | Add `onEditProfile?: () => void` — renders "Edit Profile" button in section header only if defined |
| TrustTab.tsx | Add `onEditTrust?: () => void` — renders "Edit Trust" button only if defined |
| StaffTab.tsx | Add `onAddEmployee?` + `onEditEmployee?` — shows buttons only if defined |

Existing DC/AUDITOR/VIEWER use of these tabs is **unchanged** — new props are optional; those callers pass nothing.

---

### Phase 7 — Register routes (depends on Phases 3 + 5)

**7.** In routes/index.tsx: add `TA_TEMPLE_SEARCH` and `TA_TEMPLE_DETAIL` pages under the TA RoleRoute block.

---

### Verification checklist

1. SA → DC Temples → any temple → Overview tab → "Edit Profile" button visible → dialog opens → save → submit → badge shows PENDING_REVIEW → Approve → clears ✓
2. SA → Trust tab → "Edit Trust" button → same flow ✓
3. SA → Staff tab → Add/Edit employee → direct write → instantly in table ✓
4. TA → `/ta/temples` → search → View → lands on TaTempleDetailPage ✓
5. TA own temple: Edit Profile/Trust visible; after submit → PENDING_REVIEW shown ✓
6. TA other temple: No edit buttons in any tab ✓
7. DC workflow unchanged: DC approves own-district temples only, `assertDistrictScope()` unaffected ✓
8. TA cannot approve/reject — no governance callbacks passed to TaTempleDetailPage ✓

---

### Scope boundaries

**In scope**: Overview, Trust & Board, Declarations, Contractors,Staff tabs for TA (own temple) and SA (all temples)

---
