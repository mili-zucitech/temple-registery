
---

## Plan: Fix 5 SA Bugs — Notifications, Dashboard, Audit, Geo UI, Edit Pages

**TL;DR**: Three confirmed backend data bugs (generic notification titles, district IDs not names, audit log missing actor/entity names) + two frontend rendering bugs (grade bar invisible, timeline missing performer) + one UI redesign (Geo Management) + one moderate feature (SA dedicated edit pages for all temple modules).

---

### Phase 1 — Backend Fixes

**Bug 1 — Notification titles generic ("Trust Approved" with no context)**

*Root cause*: `buildRichTitle()` in `NotificationDispatchServiceImpl` returns only a generic label. The body is already rich. The title needs enrichment.

1. Add `templeName` and `actorLabel` params to `buildRichTitle()` (already resolved at call site for `buildRichBody`)
2. New title format: `"Sri Rama Temple – Trust Approved by DC John Smith"` for APPROVE/REJECT events; `"Sri Rama Temple – Trust Submitted"` for SUBMIT

*File*: `backend/.../service/notification/impl/NotificationDispatchServiceImpl.java`

---

**Bug 2a — District Load Distribution shows "District #1" instead of name**

*Root cause*: `TempleSearchSummaryRepository.countByDistrict()` returns only `[districtId, count]`. `DistrictDistributionItem` has no `districtName` field. Service never looks up names.

1. Add `districtName` (String) to `StatewideDashboardResponse.DistrictDistributionItem`
2. In `AdminDashboardServiceImpl.getStatewideDashboard()`, inject `DistrictRepository` and batch-resolve district names (collect IDs → one query → build Map → enrich items)
3. Update frontend `adminApi.ts` interface + `AdminDashboardPage.tsx` to display `item.districtName`

*Files*: `StatewideDashboardResponse.java`, `AdminDashboardServiceImpl.java`, `adminApi.ts`, `AdminDashboardPage.tsx`

---

**Bug 3 — Audit Log WHO shows "User#23", RECORD shows "TRUST#5"**

*Root cause*: `AuditDataEvent` entity stores only `actorId` + `entityType+entityId`. `AdminController.listAuditEvents()` emits a raw Map without resolving names. `GovernanceHistoryResponse` has `actorUserId` but no `actorName`.

1. Create a proper `AuditEventResponse` DTO with `actorName`, `actorRole`, `entityName` fields
2. In `AdminController.listAuditEvents()`: resolve `actorId → user.fullName` (batch) and `entityId → temple/entity name` when entityType is TEMPLE; show `"Temple Name > EntityType"` for non-TEMPLE entities
3. Add `actorName` to `GovernanceHistoryResponse`; resolve in `GovernanceAuditService`
4. Update frontend: `AuditEventResponse` interface + `AuditLogPage.tsx` WHO/RECORD columns + `AdminDashboardPage.tsx` actor cell + CSV export

*Files*: New `AuditEventResponse.java`, `AdminController.java`, `GovernanceHistoryResponse.java`, `GovernanceAuditService`, `adminApi.ts`, `AuditLogPage.tsx`, `AdminDashboardPage.tsx`

---

### Phase 2 — Frontend-only Fixes

**Bug 2b — Grade distribution bars invisible**

*Root cause*: `bg-secondary` CSS variable is near-transparent in the current theme. Bar width calculation is correct.

1. Change `className="h-full bg-secondary"` → `className="h-full bg-amber-500"` in `AdminDashboardPage.tsx` grade section

*File*: `AdminDashboardPage.tsx`

---

**Timeline not showing SA actor**

*Root cause*: `timelineTypes.ts` has `performerName`/`performerRole` fields, but `TimelineTab.tsx` never renders them. SA submissions appear as anonymous events. Backend already logs the correct actor (SecurityContextHolder = SUPER_ADMIN).

1. Add performer name + role badge rendering to each timeline event card in `TimelineTab.tsx`

*File*: `frontend/.../DcTempleProfilePage/tabs/TimelineTab.tsx`

---

### Phase 3 — Geo Management UI Redesign

*Root cause*: Functional but visually plain.

1. Replace flat 4-column grid with two-panel layout: left tree-navigator + right context-aware create form (in a `Sheet` side drawer)
2. Modern selection state: highlighted cards with active ring
3. Clickable breadcrumb trail
4. Per-level count badges, skeleton loading, empty state illustrations

*File*: `frontend/.../GeoManagementPage/GeoManagementPage.tsx`

---

### Phase 4 — SA Temple Module Edit Pages

**Current state**: Trust/Staff/Contractors use inline dialogs. Declarations/Documents have no SA edit capability. User wants dedicated route pages.

**Workflow clarification confirmed**: SA submits → goes to workflow → SA or district DC can approve.

**Step 4.1 — New SA routes** *(depends on nothing)*
- Add to `routePaths.ts`: `ADMIN_TEMPLE_TRUST`, `ADMIN_TEMPLE_EMPLOYEES`, `ADMIN_TEMPLE_CONTRACTORS`, `ADMIN_TEMPLE_DOCUMENTS`, `ADMIN_TEMPLE_DECLARATIONS`, `ADMIN_TEMPLE_DECLARATION_NEW`
- Register in `routes/index.tsx` under SA/DC role group

**Step 4.2 — SA Trust Page** *(depends on 4.1)*
- New `SaTempleTrustPage.tsx` — templeId from route params, same form as `TaTrustPage`, auto-submit on save, "Back" to DC temple profile, SA-indicator banner

**Step 4.3 — SA Employees Page** *(depends on 4.1, parallel with 4.2)*
- New `SaTempleEmployeesPage.tsx` — templeId from params, reuse `employeeApi` hooks, list + add/edit form

**Step 4.4 — SA Contractors Page** *(parallel with 4.2/4.3)*
- New `SaTempleContractorsPage.tsx` — reuse `contractorApi` hooks

**Step 4.5 — SA Documents Page** *(parallel with 4.2–4.4)*
- New `SaTempleDocumentsPage.tsx` — upload + delete only; reuse `documentApi` hooks

**Step 4.6 — SA Declarations Page + backend check** *(depends on 4.1)*
- Read `DeclarationController` to verify if templeId comes from request body or user claims. If from claims, add a new `POST /api/v1/admin/declarations/temple/{templeId}` endpoint.
- New `SaTempleDeclarationsPage.tsx` — list declarations + "Create New" button
- New `SaTempleDeclarationFormPage.tsx` — same form as `DeclarationCreatePage` but templeId from route param

**Step 4.7 — Update DcTempleProfilePage navigation** *(depends on 4.1–4.6)*
- Replace `setTrustEditOpen(true)` → `navigate(ADMIN_TEMPLE_TRUST.replace(':templeId', id))`
- Same for Staff, Contractors, Documents, Declarations for SA
- Remove `SaTrustEditDialog`, `SaContractorDialog`, `SaEmployeeDialog` inline components

---

### Verification Checklist

1. SA notification inbox: click on trust approval notification → title shows temple name + DC name
2. SA dashboard district distribution: shows real names ("Bengaluru Urban", not "District #3")
3. Grade bars: visible amber/colored fills matching temple counts
4. Audit log WHO: "Ramesh Kumar (District Collector)" not "DISTRICT_COLLECTOR #23"; RECORD: "Sri Rama Temple > TRUST" not "TRUST #5"
5. Timeline: SA submit/approve events show "Super Administrator" actor name + role badge
6. Geo Management: modern two-panel UI with breadcrumb navigation
7. SA → temple Trust tab → "Edit Trust" navigates to `/admin/temples/5/trust` page; TA flow unchanged
8. SA can create a declaration for a temple via `/admin/temples/5/declarations/new`; logged as SUPER_ADMIN in timeline

---

**Scope Boundaries** — No schema/Flyway migrations. No changes to TA/DC pages. No workflow engine changes. Audit name resolution is query-time only (no new columns). Notification rules in DB unchanged.

---

Shall I proceed with implementation? I'd suggest starting Phase 1 backend fixes and Phase 2/Phase 4.1 in parallel, since they're independent.