# Super Admin & Viewer — Deep Implementation Plan (Part 2 of 3)
# RBAC Matrix · Workflow Design · UI/UX Blueprint · Architecture

---

## 4) Role Matrix Deep Dive

### 4.1 Complete RBAC Matrix

| Action | Super Admin | Viewer | DC | DC Staff | TA | Auditor |
|--------|:-----------:|:------:|:--:|:--------:|:--:|:-------:|
| **Temple Search (all)** | ✅ Full | ✅ Read | ✅ Jurisdiction | ✅ Jurisdiction | Own only | ✅ Full |
| **View Temple Profile** | ✅ Full | ✅ Read | ✅ Jurisdiction | ✅ Jurisdiction | Own only | ✅ Full |
| **View Trust Details** | ✅ Full | ✅ Read | ✅ Full | ✅ Read | Own only | ✅ Read |
| **View Asset Declarations** | ✅ Full | ✅ Read | ✅ Full | ✅ Read | Own only | ✅ Read |
| **View Staff & Contractors** | ✅ Full | ✅ Read | ✅ Full | ✅ Read | Own only | ✅ Read |
| **Submit / Update Data** | ✅ Yes | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No |
| **Approve Submissions** | ✅ Yes | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Reject Submissions** | ✅ Yes | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Force Draft** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Export Reports** | ✅ Full | ✅ Full | ✅ Yes | ✅ Yes | ⚠️ Limited | ✅ Full |
| **Manage Users** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **System Config** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Geo Master CRUD** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Temple Lifecycle** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Notification Rules** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Audit Log Access** | ✅ Full | ✅ Read | ❌ No | ❌ No | ❌ No | ✅ Read |
| **Governance History** | ✅ Full | ✅ Read | ❌ No | ❌ No | ❌ No | ✅ Read |
| **Raise Observation** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes |
| **Assign Observation** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Close Observation** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **View Observations** | ✅ Full | ✅ Read | ✅ Read | ✅ Read | ❌ No | ✅ Full |
| **Compliance Report** | ✅ Full | ✅ Read | ❌ No | ❌ No | ❌ No | ✅ Full |
| **Search Summary Rebuild** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Evidence Pack Download** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No | ✅ Yes |

### 4.2 SA Guardrails

| Constraint | Enforcement |
|-----------|-------------|
| Cannot delete own user account | Backend: `AdminServiceImpl.deactivateUser` must reject self-deactivation |
| Archive is terminal — no undo | Backend: `TempleService.archiveTemple` sets terminal flag |
| All config changes logged | Backend: `SystemConfigServiceImpl.update` logs old→new values |
| Governance history immutable | DB: append-only table, no UPDATE/DELETE on `governance_action_history` |
| Password resets audited | Backend: Separate `RESET_PASSWORD` audit event type |
| Confirmation required for destructive ops | Frontend: `ConfirmDialog` on suspend/freeze/archive/deactivate |

### 4.3 Viewer Guardrails

| Constraint | Enforcement |
|-----------|-------------|
| Zero write surface | Backend: VIEWER excluded from all write SpEL expressions |
| No observation creation | Frontend: hide create button; Backend: `CAN_RAISE_OBSERVATION` excludes VIEWER |
| No approval/rejection | Backend: `CAN_APPROVE` excludes VIEWER |
| No data submission | Backend: `CAN_SUBMIT` excludes VIEWER |
| Export allowed (full) | Backend: add VIEWER to `CAN_READ_ALL` |

---

## 5) Workflow Design

### 5.1 Super Admin Flows

#### SA Onboarding
```
Login → MFA Verify → /admin/dashboard
```
No registration flow — SA accounts are seeded or created by another SA.

#### SA Dashboard Flow
```
screen: /admin/dashboard
  → KPI cards (users, temples, declarations, audit events)
  → Operational health panel (approval queue, risk level)
  → Quick actions → navigate to sub-pages
  → District/grade distribution
  → Recent audit events table
```

#### SA Monitoring Flow
```
screen: /admin/dashboard → click KPI
  → /admin/approvals (NEW) — consolidated pending items
  → drill into specific declaration/profile
    → backend: GET /api/v1/admin/pending-approvals
    → permission: ADMIN_ONLY
    → audit: read-only (no audit log for reads)
```

#### SA Intervention Flow
```
screen: /admin/temple-governance
  → search temple → select
  → choose action (suspend/freeze/reactivate/archive)
  → enter reason (min 5 chars)
  → confirm dialog
    → backend: POST /api/v1/admin/temples/{id}/{action}
    → permission: ADMIN_ONLY
    → audit: GovernanceActionHistory record created
```

#### SA Approval Flow (reusing DC workflow)
```
screen: /dc/declarations/:id (SA accesses via DC routes)
  → review declaration details
  → approve / reject / request clarification
    → backend: existing governance workflow endpoints
    → permission: CAN_APPROVE (includes SA)
    → audit: GovernanceActionHistory + notifications
```

#### SA Configuration Flow
```
screen: /admin/system-config
  → browse by category (SLA/NOTIFICATION/FEATURE)
  → modify value inline
  → save per-key
    → backend: PUT /api/v1/admin/config/{key}
    → permission: ADMIN_ONLY
    → audit: AuditDataEvent with old→new values
```

### 5.2 Viewer Flows

#### Viewer Login
```
Login → MFA Verify → /viewer/dashboard
```

#### Viewer Dashboard Flow
```
screen: /viewer/dashboard (NEW)
  → KPI cards (compliance score, anomalies, overdue declarations)
  → Recent compliance anomalies table
  → Quick links to temples, declarations, compliance
  → backend: reuses /api/v1/auditor/compliance + /api/v1/observations
  → permission: CAN_READ_ALL (with VIEWER added)
  → audit: no audit for reads
```

#### Viewer Read-Only Drilldown
```
screen: /viewer/temples → /viewer/temples/:templeId
  → reuses DcTempleSearchPage + DcTempleProfilePage components
  → all action buttons hidden (no approve/reject/edit)
  → backend: existing DC temple endpoints
  → permission: CAN_READ_ALL
```

#### Viewer Export Flow
```
screen: /viewer/export (NEW)
  → select export type (temples/declarations)
  → select format (CSV/PDF)
  → download
    → backend: POST /api/v1/export/temples or /declarations
    → permission: CAN_READ_ALL
    → audit: AuditExportEvent logged
```

---

## 6) UI/UX Blueprint

### 6.1 Super Admin Pages

#### Admin Dashboard (`/admin/dashboard`) — EXISTS ✅
- **Purpose**: System-wide operational overview
- **Widgets**: KPI cards (users, temples, declarations, audit events)
- **Tables**: Recent audit events (5 most recent)
- **Charts**: District distribution bars, grade distribution bars
- **Quick Actions**: Users, Audit Logs, Notification Rules, Admin Tools
- **Missing**: Activity feed, trend indicators, link to temple search
- **Recommendation**: Add "View All Temples" and "Pending Approvals" to quick actions

#### User Management (`/admin/users`) — EXISTS ✅
- **Purpose**: CRUD for all user accounts
- **Widgets**: User count, inactive filter toggle
- **Table**: Full user table with role, status, Aadhaar, last login
- **Actions**: Create, Edit (dialog), Activate/Deactivate (confirm)
- **Recommendation**: Add role filter dropdown, search by name/email

#### Audit Logs (`/admin/audit`) — EXISTS ✅
- **Purpose**: System-wide audit trail
- **Tabs**: Data Events, Auth Events
- **Table**: Paginated with actor, action, entity, timestamp
- **Recommendation**: Add date range filter, entity type filter, export button

#### Geo Master (`/admin/geo`) — EXISTS ✅
- **Purpose**: Manage geographic hierarchy
- **Layout**: 4-column cascading cards (State → District → Taluk → Hobli)
- **Actions**: Create new entries at each level
- **Missing**: Edit/delete existing entries
- **Recommendation**: Add inline edit capability, delete with confirmation

#### System Config (`/admin/system-config`) — EXISTS ✅
- **Purpose**: Configure SLA thresholds, feature flags, notification settings
- **Layout**: Category-grouped config rows with inline editing
- **Features**: Search, category filter, unsaved change indicators
- **Recommendation**: Reuse as-is — well-implemented

#### Notification Rules (`/admin/notification-rules`) — EXISTS ✅
- **Purpose**: Manage notification routing rules
- **Layout**: Channel-grouped rule table with enable/disable toggles
- **Features**: Search filter
- **Recommendation**: Reuse as-is

#### Temple Governance (`/admin/temple-governance`) — EXISTS ✅
- **Purpose**: Temple lifecycle management
- **Layout**: Temple search → action cards (Suspend/Reactivate/Freeze/Archive)
- **Features**: Temple detail preview, reason field, confirmation
- **Recommendation**: Reuse as-is — excellent implementation

#### Admin Tools (`/admin/tools`) — EXISTS ✅
- **Purpose**: System maintenance operations
- **Widgets**: Search summary rebuild, system health, stale verifications
- **Recommendation**: Reuse as-is

#### SA Navigation Enhancement (NEEDED)
**Current sidebar**: Dashboard, Users, Temple Governance, Admin Tools, Audit Logs, Geo Master, System Config, Notification Rules (8 items)

**Proposed addition**: Add a "Data Access" section with:
- Temple Search → reuses `/dc/temples`
- Declarations → reuses `/dc/declarations`
- Export → reuses `/dc/export`
- Compliance → reuses `/auditor/compliance`

### 6.2 Viewer Pages (ALL NEW)

#### Viewer Dashboard (`/viewer/dashboard`) — NEW
- **Purpose**: Compliance-oriented read-only overview
- **KPIs**: Compliance anomalies, overdue declarations, open observations, assigned reviews
- **Table**: Recent compliance anomalies (8 rows)
- **Panel**: Compliance score, workload indicator
- **Quick Links**: Temples, Declarations, Compliance Report, Audit Trail
- **Empty State**: "No compliance anomalies detected" with checkmark icon
- **Base**: Adapted from `AuditorDashboardPage` with observation creation removed

#### Viewer Temple Search (`/viewer/temples`) — NEW (route only)
- Reuses `DcTempleSearchPage` component
- All action buttons hidden via role check

#### Viewer Temple Detail (`/viewer/temples/:templeId`) — NEW (route only)
- Reuses `DcTempleProfilePage` component
- Governance panel in read-only mode

#### Viewer Declarations (`/viewer/declarations`) — NEW (route only)
- Reuses `DcDeclarationListPage` component

#### Viewer Declaration Detail (`/viewer/declarations/:id`) — NEW (route only)
- Reuses `DcDeclarationDetailPage` component
- No approve/reject buttons

#### Viewer Compliance (`/viewer/compliance`) — NEW (route only)
- Reuses `ComplianceReportPage` from auditor feature

#### Viewer Audit Trail (`/viewer/audit-trail`) — NEW (route only)
- Reuses `AuditTrailPage` from auditor feature

#### Viewer Export (`/viewer/export`) — NEW (route only)
- Reuses `DcExportPage` from DC feature

### 6.3 Current UI Assessment

> **Verdict: The current admin UI is production-quality and can serve as the base layer.**

Reasons:
- Consistent design system (shadcn/ui + Tailwind)
- Proper loading/error/empty states throughout
- Responsive layout with collapsible sidebar
- Good use of KPI cards, data tables, confirmation dialogs
- RTK Query with proper cache invalidation
- Role-based sidebar navigation already in place

**No major redesign needed for Super Admin.** The existing pages cover ~80% of SA requirements. The gaps are navigational (SA can't reach DC/auditor pages from sidebar) and functional (no approval queue, no workflow monitoring).

**Viewer requires no new UI components** — only new routes that reuse existing page components with action buttons conditionally hidden.

---

## 7) Architecture Recommendation

### Verdict: **A) Build on current implementation** with targeted additions

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Code quality | ⭐⭐⭐⭐ | Clean separation, proper DTOs, service interfaces |
| Extensibility | ⭐⭐⭐⭐ | SpEL-based RBAC makes adding roles trivial |
| Workflow alignment | ⭐⭐⭐ | SA reuses DC workflow correctly, but navigation is fragmented |
| Maintainability | ⭐⭐⭐⭐ | Feature-sliced frontend, layered backend |
| UI maturity | ⭐⭐⭐⭐⭐ | shadcn/ui + Tailwind, consistent patterns, responsive |
| RBAC correctness | ⭐⭐⭐⭐ | Well-structured, but missing VIEWER role |
| Domain correctness | ⭐⭐⭐⭐ | Governance model sound, audit trail comprehensive |

### Why NOT refactor or replace:
1. **All admin pages work** — tested, styled, wired to APIs
2. **RBAC is SpEL-based** — adding a role is adding one enum value and updating 2-3 SpEL expressions
3. **Frontend is feature-sliced** — new routes can reuse existing page components
4. **Audit infrastructure is complete** — 3-layer audit (data + auth + governance) already captures everything
5. **DC/TA workflows are stable** — the requirement is explicitly additive, not disruptive

### What MUST change:
1. Add `VIEWER` to `UserRole` enum + Flyway migration
2. Add `VIEWER` to relevant `RoleConstants` SpEL expressions
3. Add frontend `VIEWER` constant + routes + sidebar nav
4. Create a lightweight Viewer dashboard (adapt from AuditorDashboard)
5. Expand SA sidebar navigation to include data access routes
6. Fix 2 minor bugs (dead code, double-map in governance history)

