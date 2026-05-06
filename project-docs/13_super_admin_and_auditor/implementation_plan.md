# Super Admin & Viewer — Master Implementation Plan

> **Scope**: Sections 2.1 (Primary Stakeholders) and 2.2 (User Role Permissions Matrix) from the requirements document.
> **Roles in scope**: Super Admin (HR&CE Dept), Viewer (State Government / Audit Bodies)
> **Roles NOT modified**: District Collector, DC Staff, Temple Authority

---

## Document Structure

This plan is organized into **3 detailed part files** plus this master summary. Each part contains exhaustive analysis — this document provides the navigational overview and key decisions.

| Part | Contents | Path |
|------|----------|------|
| [Part 1](file:///C:/Users/adityaranjan/.gemini/antigravity/brain/c3fd837b-c4f6-4002-92b9-a777ef173131/implementation_plan_part1.md) | §1 Requirements Analysis · §2 Codebase Analysis · §3 Gap Analysis | 29 feature-by-feature gap mappings |
| [Part 2](file:///C:/Users/adityaranjan/.gemini/antigravity/brain/c3fd837b-c4f6-4002-92b9-a777ef173131/implementation_plan_part2.md) | §4 RBAC Matrix · §5 Workflow Design · §6 UI/UX Blueprint · §7 Architecture | 24-row permission matrix, all page blueprints |
| [Part 3](file:///C:/Users/adityaranjan/.gemini/antigravity/brain/c3fd837b-c4f6-4002-92b9-a777ef173131/implementation_plan_part3.md) | §8 Additive Strategy · §9 Execution Plan · §10 Final Verdict | Exact file changes, 7-phase plan |

---

## Executive Summary

### Current State

The **Super Admin module is ~80% production-ready**:
- ✅ Dashboard with statewide KPIs (users, temples, declarations, audit events, distributions)
- ✅ User Management (full CRUD, activate/deactivate, audit-logged)
- ✅ Audit Logs (data events + auth events, paginated, tabbed)
- ✅ Geo Master (State→District→Taluk→Hobli CRUD)
- ✅ System Configuration (SLA thresholds, feature flags, notification toggles)
- ✅ Notification Rules (channel-grouped, searchable, toggle enable/disable)
- ✅ Temple Governance (suspend/freeze/reactivate/archive with confirmation)
- ✅ Admin Tools (search summary rebuild, stale verification monitoring)
- ✅ RBAC enforcement via SpEL (SA bypasses jurisdiction, has full write access)
- ✅ 3-layer audit infrastructure (data mutations + auth events + governance actions)

The **Viewer role does not exist yet** — no enum value, no routes, no sidebar nav. However, the AUDITOR role already provides ~90% of the Viewer's read surface, and the SpEL-based RBAC makes adding a new role trivial.

### Key Gaps

| Gap | Severity | Effort |
|-----|----------|--------|
| No `VIEWER` in `UserRole` enum | Critical | 1 line |
| No VIEWER in `CAN_READ_ALL` SpEL | Critical | 1 line |
| No Viewer frontend routes/sidebar | Critical | ~50 lines |
| No Viewer dashboard page | Medium | ~150 lines (adapted from Auditor) |
| SA sidebar missing data access links (temples, declarations, export) | Medium | ~10 lines |
| No SA pending approvals page | Low | Phase 2 |
| Dead code in `AdminController` | Low | Delete 3 lines |
| Double-map bug in governance history | Low | Fix 1 line |

### Architecture Decision

> **Build on current implementation — do NOT refactor or replace.**

The codebase is architecturally sound. The SpEL-based RBAC, feature-sliced frontend, and comprehensive audit infrastructure make this a straightforward additive change.

### Impact Assessment

| Dimension | Impact |
|-----------|--------|
| DC workflows | **Zero** — no files touched |
| TA workflows | **Zero** — no files touched |
| Governance engine | **Zero** — no changes |
| Notification pipeline | **Zero** — no changes |
| Existing API contracts | **Zero** — no response shapes modified |
| Database schema | **Zero** — `UserRole` is `@Enumerated(EnumType.STRING)`, adding a new enum value requires no DDL |

### Effort Estimate

| Phase | Description | Effort |
|-------|-------------|--------|
| Phase 1 | Foundation (VIEWER enum + SpEL + constants) | 30 min |
| Phase 2 | Backend APIs (viewer dashboard + SA approvals endpoint) | 3-4 hrs |
| Phase 3 | Frontend UI (viewer routes + dashboard + SA sidebar) | 4-5 hrs |
| Phase 4 | Workflow integration verification | 2-3 hrs |
| Phase 5 | Export & reporting verification | 1 hr |
| Phase 6 | Testing (role-based + regression) | 3-4 hrs |
| Phase 7 | Rollout | 1-2 hrs |
| **Total** | | **~2-3 days** |

---

## Open Questions

> [!IMPORTANT]
> ### Q1: Viewer vs Auditor Separation
> The requirements list "State Government / Audit Bodies" as the **Viewer** stakeholder. The current codebase already has an `AUDITOR` role with observation-creation privileges. Should the new `VIEWER` role be:
> - **(A)** A pure read-only role with zero write surface (recommended — matches §2.1 description), OR
> - **(B)** Merged with the existing AUDITOR role (saves work but conflates two different stakeholder groups)?
>
> **Current recommendation**: Option A — keep them separate. The AUDITOR can create observations; the VIEWER cannot.

> [!IMPORTANT]  
> ### Q2: SA Cross-Navigation
> Super Admin currently has its own sidebar with 8 admin pages but **cannot navigate to DC temple search, declarations, or export from its sidebar** — even though the backend SpEL already grants access. Should we:
> - **(A)** Add DC data access links directly to the SA sidebar (recommended — simple, ~10 lines), OR
> - **(B)** Give SA a completely separate "Operations" section with its own temple search UI?
>
> **Current recommendation**: Option A — reuse DC pages via sidebar links.

> [!IMPORTANT]
> ### Q3: Viewer Export Scope
> The requirements say Viewer can "Review reports and asset disclosures." Should Viewer exports be:
> - **(A)** Full — same as DC/SA (CSV + PDF + evidence packs), OR
> - **(B)** Limited — reports only, no raw data export?
>
> **Current recommendation**: Option A — full export, since Viewer represents State Government audit bodies who need comprehensive data access.

---

## Proposed Changes Summary

### Backend

#### [MODIFY] [UserRole.java](file:///c:/Users/adityaranjan/zucitech/temple-registery/backend/src/main/java/com/templeregistry/entity/auth/UserRole.java)
Add `VIEWER` to the enum.

#### [MODIFY] [RoleConstants.java](file:///c:/Users/adityaranjan/zucitech/temple-registery/backend/src/main/java/com/templeregistry/security/RoleConstants.java)
Add `VIEWER` constant, update `CAN_READ_ALL` SpEL expression.

#### [MODIFY] [JurisdictionGuard.java](file:///c:/Users/adityaranjan/zucitech/temple-registery/backend/src/main/java/com/templeregistry/security/JurisdictionGuard.java)
Add VIEWER to the bypass list in `assertDistrictScope()` (alongside SA and TA).

#### [MODIFY] [AdminController.java](file:///c:/Users/adityaranjan/zucitech/temple-registery/backend/src/main/java/com/templeregistry/controller/admin/AdminController.java)
Fix dead code + double-map bug. Add pending approvals endpoint.

#### [NEW] Viewer Dashboard
- `controller/viewer/ViewerDashboardController.java`
- `service/viewer/ViewerDashboardService.java`  
- `service/impl/viewer/ViewerDashboardServiceImpl.java`
- `dto/response/viewer/ViewerDashboardResponse.java`

#### [NEW] `V73__add_viewer_role.sql`
Flyway marker migration (no DDL needed).

---

### Frontend

#### [MODIFY] [roles.ts](file:///c:/Users/adityaranjan/zucitech/temple-registery/frontend/src/constants/roles.ts)
Add `VIEWER: 'VIEWER'`.

#### [MODIFY] [routePaths.ts](file:///c:/Users/adityaranjan/zucitech/temple-registery/frontend/src/constants/routePaths.ts)
Add 8 viewer route constants.

#### [MODIFY] [index.tsx](file:///c:/Users/adityaranjan/zucitech/temple-registery/frontend/src/routes/index.tsx)
Add Viewer route group with `RoleRoute`.

#### [MODIFY] [Sidebar.tsx](file:///c:/Users/adityaranjan/zucitech/temple-registery/frontend/src/layouts/AppShell/Sidebar/Sidebar.tsx)
Add `getViewerNavItems()`, expand SA nav with data access links.

#### [MODIFY] [AppShell.tsx](file:///c:/Users/adityaranjan/zucitech/temple-registery/frontend/src/layouts/AppShell/AppShell.tsx)
Add page title entries for viewer + missing admin pages.

#### [NEW] Viewer Dashboard
- `features/viewer/pages/ViewerDashboardPage/ViewerDashboardPage.tsx`
- `features/viewer/viewerApi.ts`

---

## Verification Plan

### Automated Tests
- `mvn test` — all existing backend tests must pass (zero regressions)
- `npx vitest run` — all existing frontend tests must pass
- New test: VIEWER JWT → all read endpoints return 200
- New test: VIEWER JWT → all write endpoints return 403
- New test: SA can create VIEWER user via `/api/v1/admin/users`

### Manual Verification
1. Login as SA → verify expanded sidebar shows temple search, declarations, export
2. Login as SA → navigate to pending approvals (new page)
3. Login as SA → create a VIEWER user
4. Login as VIEWER → verify read-only dashboard
5. Login as VIEWER → search temples, view profiles, view declarations
6. Login as VIEWER → export CSV/PDF
7. Login as VIEWER → attempt write action → verify 403 / button not visible
8. Login as DC → verify nothing changed
9. Login as TA → verify nothing changed
10. Login as AUDITOR → verify nothing changed
