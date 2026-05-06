# Super Admin & Viewer — Deep Implementation Plan (Part 3 of 3)
# Additive Strategy · Execution Plan · Final Verdict

---

## 8) Additive Implementation Strategy

> [!IMPORTANT]
> All changes are strictly additive. DC + TA workflows remain functionally untouched. No existing API contracts are broken. No existing routes are modified.

### 8.1 Backend Changes

#### Files Modified (Existing)

| File | Change | Impact on DC/TA |
|------|--------|----------------|
| `entity/auth/UserRole.java` | Add `VIEWER` enum value | None — additive enum |
| `security/RoleConstants.java` | Add `VIEWER` constant + update `CAN_READ_ALL` SpEL to include VIEWER | None — only expands read access |
| `frontend constants/roles.ts` | Add `VIEWER` | None |
| `controller/admin/AdminController.java` | Remove dead `toNotificationRuleResponse()` method; fix double-map in `listGovernanceHistory` | None — bug fix only |

#### SpEL Expression Changes (in `RoleConstants.java`)

```java
// BEFORE:
public static final String CAN_READ_ALL = "hasAnyRole('SUPER_ADMIN', 'DISTRICT_COLLECTOR', 'DC_STAFF', 'AUDITOR')";

// AFTER:
public static final String CAN_READ_ALL = "hasAnyRole('SUPER_ADMIN', 'DISTRICT_COLLECTOR', 'DC_STAFF', 'AUDITOR', 'VIEWER')";
```

No other SpEL expressions change. VIEWER is deliberately excluded from:
- `CAN_APPROVE` — no approval authority
- `CAN_ACT_DC` — no governance actions
- `CAN_WRITE_DC` — no write operations
- `CAN_SUBMIT` — no data submission
- `ADMIN_ONLY` — no admin access
- `CAN_RAISE_OBSERVATION` — no observation creation
- `TEMPLE_AUTHORITY_ONLY` — not a TA

#### New Backend Modules

| Module | Files | Purpose |
|--------|-------|---------|
| Viewer Dashboard | `controller/viewer/ViewerDashboardController.java` | Lightweight KPI endpoint for viewer |
| | `service/viewer/ViewerDashboardService.java` | Interface |
| | `service/impl/viewer/ViewerDashboardServiceImpl.java` | Reuses `TempleSearchSummaryRepository` + `AuditorService` |
| | `dto/response/viewer/ViewerDashboardResponse.java` | DTO |

#### New APIs

| Method | Path | Permission | Purpose |
|--------|------|-----------|---------|
| GET | `/api/v1/viewer/dashboard` | `CAN_READ_ALL` | Viewer dashboard KPIs |
| GET | `/api/v1/admin/pending-approvals` | `ADMIN_ONLY` | SA consolidated approval queue |

#### Database Migration

```sql
-- V73__add_viewer_role.sql
-- No schema change needed — UserRole is stored as VARCHAR via @Enumerated(EnumType.STRING)
-- The VIEWER value will be written as the string 'VIEWER' in the role column.
-- This migration is a no-op marker for Flyway versioning.

-- Seed a default VIEWER user for testing (optional)
-- INSERT INTO users (username, email, password_hash, role, full_name, is_active, aadhaar_verified, is_deleted)
-- VALUES ('viewer_test', 'viewer@karnataka.gov.in', '$2a$12$...', 'VIEWER', 'State Auditor', true, true, false);
```

#### Preserved Contracts

| Contract | Preserved? | Notes |
|----------|:----------:|-------|
| All DC controller endpoints | ✅ | No changes to DC controllers |
| All TA controller endpoints | ✅ | No changes to TA controllers |
| Governance workflow service | ✅ | No changes to workflow engine |
| Notification dispatch | ✅ | No changes to notification pipeline |
| Declaration service | ✅ | No changes to declaration workflow |
| Temple profile staging | ✅ | No changes to staging workflow |
| Trust/Board services | ✅ | No changes |
| Employee/Contractor services | ✅ | No changes |
| All existing API response shapes | ✅ | No DTO changes for existing endpoints |

### 8.2 Frontend Changes

#### Files Modified

| File | Change |
|------|--------|
| `constants/roles.ts` | Add `VIEWER: 'VIEWER'` |
| `constants/routePaths.ts` | Add `VIEWER_*` route constants |
| `routes/index.tsx` | Add Viewer route group with `RoleRoute` |
| `layouts/AppShell/Sidebar/Sidebar.tsx` | Add `getViewerNavItems()` + expand SA nav items |
| `layouts/AppShell/AppShell.tsx` | Add viewer page title entries |

#### New Frontend Modules

| Module | Path | Component | Notes |
|--------|------|-----------|-------|
| Viewer Dashboard | `features/viewer/pages/ViewerDashboardPage/` | `ViewerDashboardPage.tsx` | Adapted from AuditorDashboardPage |
| Viewer API | `features/viewer/viewerApi.ts` | RTK Query API slice | Dashboard endpoint |

#### New Routes

```typescript
// Viewer routes — all read-only, reusing existing page components
{ path: ROUTE_PATHS.VIEWER_DASHBOARD, element: <ViewerDashboardPage /> }
{ path: ROUTE_PATHS.VIEWER_TEMPLES, element: <DcTempleSearchPage /> }
{ path: ROUTE_PATHS.VIEWER_TEMPLE_DETAIL, element: <DcTempleProfilePage /> }
{ path: ROUTE_PATHS.VIEWER_DECLARATIONS, element: <DcDeclarationListPage /> }
{ path: ROUTE_PATHS.VIEWER_DECLARATION_DETAIL, element: <DcDeclarationDetailPage /> }
{ path: ROUTE_PATHS.VIEWER_COMPLIANCE, element: <ComplianceReportPage /> }
{ path: ROUTE_PATHS.VIEWER_AUDIT_TRAIL, element: <AuditTrailPage /> }
{ path: ROUTE_PATHS.VIEWER_EXPORT, element: <DcExportPage /> }
```

#### SA Sidebar Enhancement

```typescript
// Add to getAdminNavItems():
{ label: 'Temple Search', to: ROUTE_PATHS.DC_TEMPLES, icon: <Search /> },
{ label: 'Declarations', to: ROUTE_PATHS.DC_DECLARATIONS, icon: <ClipboardList /> },
{ label: 'Export', to: ROUTE_PATHS.DC_EXPORT, icon: <Download /> },
{ label: 'Compliance', to: ROUTE_PATHS.AUDITOR_COMPLIANCE, icon: <ShieldCheck /> },
```

Note: SA is already allowed on DC routes via `RoleRoute allowedRoles={[DC, DC_STAFF, SUPER_ADMIN]}`. The change is purely navigational — adding sidebar links to routes SA can already access.

#### New Route Constants

```typescript
// In routePaths.ts:
VIEWER_DASHBOARD: '/viewer/dashboard',
VIEWER_TEMPLES: '/viewer/temples',
VIEWER_TEMPLE_DETAIL: '/viewer/temples/:templeId',
VIEWER_DECLARATIONS: '/viewer/declarations',
VIEWER_DECLARATION_DETAIL: '/viewer/declarations/:id',
VIEWER_COMPLIANCE: '/viewer/compliance',
VIEWER_AUDIT_TRAIL: '/viewer/audit-trail',
VIEWER_EXPORT: '/viewer/export',
```

#### Viewer Sidebar Items

```typescript
function getViewerNavItems(): NavItem[] {
  return [
    { label: 'Dashboard', to: ROUTE_PATHS.VIEWER_DASHBOARD, icon: <LayoutDashboard /> },
    { label: 'Temples', to: ROUTE_PATHS.VIEWER_TEMPLES, icon: <Building2 /> },
    { label: 'Declarations', to: ROUTE_PATHS.VIEWER_DECLARATIONS, icon: <ClipboardList /> },
    { label: 'Compliance', to: ROUTE_PATHS.VIEWER_COMPLIANCE, icon: <ShieldCheck /> },
    { label: 'Audit Trail', to: ROUTE_PATHS.VIEWER_AUDIT_TRAIL, icon: <History /> },
    { label: 'Export', to: ROUTE_PATHS.VIEWER_EXPORT, icon: <Download /> },
  ]
}
```

---

## 9) Execution Plan

### Phase 1 — Foundation (Backend RBAC + Migration)

**Scope**: Add VIEWER role to the system

| Task | File | Effort |
|------|------|--------|
| Add `VIEWER` to `UserRole` enum | `entity/auth/UserRole.java` | 1 line |
| Add VIEWER constants to `RoleConstants.java` | `security/RoleConstants.java` | 3 lines |
| Update `CAN_READ_ALL` SpEL | `security/RoleConstants.java` | 1 line |
| Create Flyway migration `V73__add_viewer_role.sql` | `db/migration/` | Marker migration |
| Add `VIEWER` to frontend `roles.ts` | `constants/roles.ts` | 1 line |

- **Dependencies**: None
- **Risk**: Very low — additive enum + SpEL change
- **Effort**: 30 minutes
- **Validation**: Build succeeds, existing tests pass, VIEWER string accepted in user creation

---

### Phase 2 — Backend API Extensions

**Scope**: New endpoints for Viewer dashboard + SA enhancements

| Task | Files | Effort |
|------|-------|--------|
| Create `ViewerDashboardController` | New: controller + service + impl + DTO | 2 hours |
| Create SA pending approvals endpoint | New: method in `AdminController` | 1 hour |
| Fix dead code in `AdminController` | `AdminController.java` | 10 mins |
| Fix double-map bug in governance history | `AdminController.java` | 10 mins |

- **Dependencies**: Phase 1 complete
- **Risk**: Low — new endpoints only, no changes to existing
- **Effort**: 3-4 hours
- **Validation**: Swagger UI shows new endpoints, manual API test with VIEWER JWT returns data, VIEWER cannot hit admin-only endpoints (403)

---

### Phase 3 — Frontend UI

**Scope**: Viewer routes, dashboard page, SA sidebar enhancement

| Task | Files | Effort |
|------|-------|--------|
| Add viewer route constants | `routePaths.ts` | 10 mins |
| Create `ViewerDashboardPage` | New: `features/viewer/` | 2 hours |
| Create `viewerApi.ts` | New: RTK Query slice | 30 mins |
| Add viewer routes to `routes/index.tsx` | `routes/index.tsx` | 15 mins |
| Add `getViewerNavItems()` to Sidebar | `Sidebar.tsx` | 15 mins |
| Add VIEWER role handling in Sidebar | `Sidebar.tsx` | 5 mins |
| Add page titles for viewer + admin pages | `AppShell.tsx` | 10 mins |
| Expand SA sidebar with data access links | `Sidebar.tsx` | 15 mins |
| Add VIEWER to `app/store.ts` middleware | If needed for RTK Query | 10 mins |

- **Dependencies**: Phase 2 complete
- **Risk**: Low — new routes reuse existing components
- **Effort**: 4-5 hours
- **Validation**: Login as VIEWER → see dashboard → navigate to temples/declarations/compliance → all read-only → no action buttons visible → export works

---

### Phase 4 — Workflow Integration

**Scope**: Ensure SA can perform governance actions from shared routes

| Task | Details | Effort |
|------|---------|--------|
| Verify SA can approve declarations via DC routes | Already works via SpEL — verify in browser | 30 mins |
| Verify SA can approve temple profiles via governance endpoints | Already works — verify | 30 mins |
| Verify VIEWER cannot hit any write endpoint | Test all write endpoints with VIEWER JWT → expect 403 | 1 hour |
| Verify JurisdictionGuard bypasses for SA | Already implemented — regression test | 30 mins |
| Verify JurisdictionGuard bypasses for VIEWER | Need to add VIEWER to guard bypass list | 15 mins |

- **Dependencies**: Phase 3 complete
- **Risk**: Medium — need to verify VIEWER is jurisdiction-exempt (statewide access)
- **Effort**: 2-3 hours
- **Validation**: SA performs full governance cycle on a test temple; VIEWER reads same temple without action buttons

---

### Phase 5 — Reporting & Export

**Scope**: Ensure export and compliance report access works for both roles

| Task | Details | Effort |
|------|---------|--------|
| Verify VIEWER can access `/api/v1/export/temples` | Already allowed via `CAN_READ_ALL` after Phase 1 | 15 mins |
| Verify VIEWER can access `/api/v1/export/declarations` | Same | 15 mins |
| Verify VIEWER can access `/api/v1/export/evidence-pack` | Same | 15 mins |
| Verify SA can access all export endpoints | Already works | 15 mins |
| Verify export audit trail | Check `AuditExportEvent` records | 15 mins |

- **Dependencies**: Phase 4 complete
- **Risk**: Very low
- **Effort**: 1 hour
- **Validation**: VIEWER downloads CSV, PDF, evidence pack; audit events recorded

---

### Phase 6 — Testing

**Scope**: Comprehensive role-based testing

| Test Category | Tests |
|--------------|-------|
| **VIEWER read access** | Temples, profiles, declarations, trusts, staff, compliance, audit trail |
| **VIEWER write rejection** | Approve, reject, submit, update, force-draft, suspend, config, users, geo — all return 403 |
| **SA full access** | All admin pages functional, DC pages accessible, governance actions work |
| **SA → VIEWER user creation** | Create VIEWER user via admin, login as VIEWER, verify experience |
| **Sidebar navigation** | SA sees expanded nav; VIEWER sees read-only nav; DC/TA unchanged |
| **JurisdictionGuard** | VIEWER sees all districts (no jurisdiction filter); DC still scoped |
| **Regression** | DC workflow unchanged; TA workflow unchanged; Auditor workflow unchanged |

- **Dependencies**: Phase 5 complete
- **Risk**: Low
- **Effort**: 3-4 hours
- **Validation**: Zero regressions in existing role tests; all new VIEWER tests pass

---

### Phase 7 — Rollout

**Scope**: Production deployment

| Step | Action |
|------|--------|
| 1 | Run Flyway migration V73 — no-op marker |
| 2 | Deploy backend with VIEWER enum + updated SpEL |
| 3 | Deploy frontend with viewer routes + enhanced SA sidebar |
| 4 | SA creates first VIEWER account via User Management |
| 5 | VIEWER logs in and verifies read-only experience |
| 6 | Monitor audit logs for any unexpected VIEWER write attempts |

- **Dependencies**: Phase 6 complete
- **Risk**: Very low — additive deployment
- **Effort**: 1-2 hours (deployment + smoke test)

---

## 10) Final Verdict

### What Is Usable Today

| Component | Status |
|-----------|--------|
| SA Dashboard | ✅ Production-ready |
| SA User Management | ✅ Production-ready |
| SA Audit Logs | ✅ Production-ready |
| SA Geo Management | ✅ Production-ready (create only; edit/delete deferred) |
| SA System Config | ✅ Production-ready |
| SA Notification Rules | ✅ Production-ready |
| SA Temple Governance | ✅ Production-ready |
| SA Admin Tools | ✅ Production-ready |
| SA RBAC (backend) | ✅ Production-ready — all SpEL expressions correctly include SA |
| SA Jurisdiction bypass | ✅ Production-ready — `JurisdictionGuard` explicitly exempts SA |
| SA Approval via DC routes | ✅ Works — SA already allowed on DC routes |
| Audit infrastructure | ✅ Production-ready — 3-layer audit capture |

### What Must Be Fixed (Bugs)

| Bug | Severity | Fix |
|-----|----------|-----|
| Dead `toNotificationRuleResponse()` method | Low | Delete it |
| Double-map in `listGovernanceHistory` | Low | Remove redundant `.map()` |
| Missing page titles in AppShell | Low | Add entries for admin sub-pages |

### What Must Be Built (New)

| Feature | Complexity | Priority |
|---------|-----------|----------|
| VIEWER role (enum + SpEL + frontend constant) | Trivial | P0 |
| Viewer routes and sidebar navigation | Low | P0 |
| Viewer Dashboard page | Low (adapted from Auditor) | P0 |
| SA sidebar data access links | Trivial | P1 |
| SA pending approvals page + API | Medium | P1 |
| VIEWER JurisdictionGuard bypass | Trivial | P0 |
| Viewer API slice (RTK Query) | Low | P0 |

### What Should Be Deferred (Phase 2)

| Feature | Rationale |
|---------|-----------|
| SA workflow monitoring page | Complex — requires new workflow instance query API |
| SA escalation queue | Requires SLA-breach detection pipeline |
| Time-series analytics | Requires data aggregation infrastructure |
| Geo master edit/delete | Low priority — create-only sufficient for launch |
| Role delegation / impersonation | Complex security implications |
| Accessibility (WCAG) | Important but orthogonal to role implementation |

### Implementation Complexity

| Metric | Value |
|--------|-------|
| New backend files | ~5 (controller, service, impl, DTO, migration) |
| Modified backend files | ~3 (UserRole, RoleConstants, AdminController) |
| New frontend files | ~4 (ViewerDashboardPage, viewerApi, route constants) |
| Modified frontend files | ~4 (roles.ts, routePaths.ts, routes/index.tsx, Sidebar.tsx) |
| Total new lines of code | ~400-500 |
| Total modified lines | ~30-40 |
| Risk to existing workflows | **Zero** — all changes are additive |
| Estimated effort | **2-3 days** for a single developer |

### Recommended Path

> **Build on current implementation. The codebase is architecturally sound.**
>
> The SpEL-based RBAC system makes adding the VIEWER role a matter of updating 2-3 constant strings. The feature-sliced frontend allows Viewer routes to reuse 100% of existing page components. The SA module is 80% complete and needs only navigation expansion and a pending approvals page.
>
> No refactoring, no replacement, no architectural changes needed.

