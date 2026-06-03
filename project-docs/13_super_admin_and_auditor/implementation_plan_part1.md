# Super Admin & Viewer — Deep Implementation Plan (Part 1 of 3)
# Requirements Analysis · Codebase Analysis · Gap Analysis

---

## 1) Requirements Analysis (Sections 2.1 & 2.2)

### 1.1 Super Admin (HR & Charitable Endowments Dept.)

#### Functional Requirements
| ID | Requirement | Source |
|----|------------|--------|
| SA-F1 | Search temples across all geo-hierarchies and grades — **Full** access, no jurisdiction scoping | §2.2 |
| SA-F2 | View temple profile — **Full** | §2.2 |
| SA-F3 | View trust details — **Full** | §2.2 |
| SA-F4 | View asset declarations — **Full** | §2.2 |
| SA-F5 | View staff & contractors — **Full** | §2.2 |
| SA-F6 | Submit / update data — **Yes** (can act on behalf of any entity) | §2.2 |
| SA-F7 | Approve submissions — **Yes** (can approve any submission statewide) | §2.2 |
| SA-F8 | Export reports — **Full** (unrestricted format and scope) | §2.2 |
| SA-F9 | Manage users — **Yes** (CRUD all roles, activate/deactivate) | §2.2 |
| SA-F10 | System configuration — **Yes** (SLA, feature flags, notification rules) | §2.2 |

#### Operational Requirements
- Maintain geo-master data (State → City → District → Taluk → Hobli) — §3.1.1
- Manage temple grade classifications — §1.1
- Manage temple registrations — §2.1
- System-wide configuration of SLA thresholds
- Notification rule management (channels, priorities, enable/disable)

#### Permissions / RBAC
- **No jurisdiction scoping** — SA bypasses district-level restrictions
- **No ownership scoping** — SA can access any temple regardless of assignment
- All write operations permitted with audit trail
- Must still be subject to: audit logging, confirmation dialogs, immutable history

#### Workflow Responsibilities
- Can approve/reject any governance submission (profile, declaration, trust)
- Can force-revert declarations to DRAFT for data correction
- Can intervene in workflow: suspend, freeze, reactivate, archive temples
- Can override stuck workflows (escalation target)
- Can assign and close compliance observations raised by auditors

#### Reporting / Analytics
- Statewide dashboard with KPIs across all districts
- District distribution visualization
- Grade distribution analytics
- Pending declarations / overdue declarations counts
- User distribution by role
- Audit event volume metrics

#### Audit / Oversight
- Full access to data mutation audit logs
- Full access to authentication event logs
- Full governance action history (cross-entity)
- Per-entity governance timeline

#### Exception / Escalation Flows
- Receives escalation notifications when clarification rounds exceed limits
- Target for SLA-breach escalations
- Emergency override capability (force-draft, temple lifecycle changes)

#### Governance Visibility
- Must see all workflow states across all entities statewide
- Must see all pending items awaiting DC action
- Must see all overdue SLA items
- Must see stale physical verification flags

---

### 1.2 Viewer (State Government / Audit Bodies)

#### Functional Requirements
| ID | Requirement | Source |
|----|------------|--------|
| VW-F1 | Reviews reports and asset disclosures for compliance and audits | §2.1 |
| VW-F2 | Read-only access to all temple data statewide | Implied by §2.1 |
| VW-F3 | Export reports for offline analysis | Implied by audit function |
| VW-F4 | View compliance anomalies | Implied by audit function |
| VW-F5 | View audit trails for any entity | Implied by audit function |

#### What Viewer Must NOT Do
- **No** data submission or updates
- **No** approval or rejection of any governance action
- **No** user management
- **No** system configuration changes
- **No** temple lifecycle changes (suspend/freeze/archive)
- **No** observation creation (that is AUDITOR-specific per current architecture)
- **No** notification rule modifications
- **No** geo-master modifications

#### Where They Fit in the Lifecycle
- Pure observer role — downstream consumer of data
- Reviews compliance posture after DC/TA workflow completes
- Uses exports and reports for external audit proceedings
- No workflow participation — zero write surface

---

### 1.3 What "Super Admin Can Do Everything" Means

#### Explicitly Includes
- Create, edit, approve, reject any entity
- Override workflow states (force-draft, reopen)
- Temple lifecycle management (suspend, freeze, reactivate, archive)
- User CRUD across all roles
- Geo-master CRUD
- System configuration
- Notification rule management
- View and export all data, all reports, all audits
- Assign and close compliance observations
- Rebuild search summary indices

#### Guardrails (Must Still Be Enforced)
| Guardrail | Rationale |
|-----------|-----------|
| All actions must be audit-logged | Accountability |
| Destructive actions require confirmation dialog | Safety |
| Archive is irreversible (terminal) | Data integrity |
| Cannot delete own account | Self-preservation |
| Password resets are logged separately | Security compliance |
| Governance history is append-only / immutable | Legal record |

---

## 2) Current Codebase Analysis

### 2.1 Backend — What Exists

#### ✅ Fully Implemented (Reuse As-Is)

| Module | Files | Notes |
|--------|-------|-------|
| **User Management** | `AdminController`, `AdminServiceImpl` | Full CRUD, activate/deactivate, audit-logged |
| **System Config** | `SystemConfigController`, `SystemConfigServiceImpl` | Key-value store with categories, audit-logged |
| **Geo Management** | `GeoController`, `GeoServiceImpl` | Full CRUD for State→City→District→Taluk→Hobli, SA-only writes |
| **Temple Governance Lifecycle** | `AdminTempleController` | Suspend/freeze/reactivate/archive with reason + audit |
| **Audit Logging** | `AuditDataEvent`, `AuditAuthEvent`, `GovernanceActionHistory` | Three-layer audit capture |
| **Notification Rules** | `NotificationRuleService` via `AdminController` | List + update rules |
| **Statewide Dashboard** | `AdminDashboardServiceImpl` | KPIs from `TempleSearchSummary` + user counts |
| **Governance History** | `AdminController.listGovernanceHistory` | Paginated, per-entity history |
| **Declaration Admin** | `AdminController.forceDeclarationDraft`, `getPhysicalVerificationPending` | Force-draft + stale verification list |
| **Search Summary Rebuild** | `AdminController.rebuildSearchSummary` | Async rebuild trigger |
| **Observation Management** | `ObservationController` | SA can assign + close observations |
| **RBAC Constants** | `RoleConstants.java` | Well-structured SpEL expressions |
| **Jurisdiction Guard** | `JurisdictionGuard.java` | SA explicitly bypasses district scoping |
| **Scope Helper** | `ScopeHelper.java` | JWT claims extraction with role, districtId, templeId |

#### ✅ Partially Implemented (Reuse with Refactor)

| Module | Issue | Action |
|--------|-------|--------|
| **Export** | `ExportController` uses `CAN_READ_ALL` — includes DC_STAFF + AUDITOR but not a dedicated VIEWER role | Add VIEWER to `CAN_READ_ALL` |
| **Auditor endpoints** | `AuditorController` uses `CAN_READ_ALL` — close to Viewer needs but missing dedicated Viewer separation | Viewer can reuse these endpoints; add VIEWER to the SpEL |
| **DC Temple Search** | SA already accesses DC search routes on frontend, but backend temple search service does not have dedicated SA endpoints | SA currently reuses DC endpoints via SpEL — works but could use dedicated route |

#### ❌ Missing (New Implementation Required)

| Module | Gap |
|--------|-----|
| **VIEWER role** | `UserRole.java` enum has no `VIEWER` entry |
| **VIEWER role constant** | `RoleConstants.java` has no VIEWER-related SpEL expressions |
| **Viewer-specific SpEL** | No `CAN_VIEW_ALL` or similar read-only scope for Viewer |
| **Viewer dashboard API** | No lightweight viewer dashboard endpoint |
| **SA → DC module cross-access** | SA cannot view DC declarations list or DC dashboard from SA sidebar |
| **SA global search** | No cross-entity global search endpoint (temples + declarations + users) |
| **SA workflow monitoring** | No endpoint to list all workflow instances with statuses across entities |
| **SA escalation queue** | No dedicated endpoint for escalated/overdue items |

#### 🔴 Dead / Duplicated Code

| Item | Location | Issue |
|------|----------|-------|
| `AdminController.toNotificationRuleResponse()` | Line 218-220 | Throws `UnsupportedOperationException` — dead code |
| `AdminController.listGovernanceHistory` | Line 168-169 | Double-maps: `result.map(h -> toGovernanceResponse(h))` called twice (in `items` and in `PaginatedResponse.of`) — only the second is used |

---

### 2.2 Frontend — What Exists

#### ✅ Fully Implemented (Reuse As-Is)

| Page | Route | Quality |
|------|-------|---------|
| `AdminDashboardPage` | `/admin/dashboard` | Good — KPIs, operational health, quick actions, district/grade distribution |
| `UserManagementPage` | `/admin/users` | Good — full CRUD, status toggle, pagination, form dialog |
| `AuditLogPage` | `/admin/audit` | Good — tabbed data/auth events, pagination, filtering |
| `GeoManagementPage` | `/admin/geo` | Good — cascading 4-column hierarchy CRUD |
| `SystemConfigPage` | `/admin/system-config` | Good — categorized config editor with inline save |
| `NotificationRulesPage` | `/admin/notification-rules` | Good — grouped rules with search and toggle |
| `TempleGovernancePage` | `/admin/temple-governance` | Good — temple search + lifecycle action cards |
| `AdminToolsPage` | `/admin/tools` | Good — rebuild summary + stale verifications |
| `adminApi.ts` | RTK Query | Complete — all admin endpoints wired |

#### ✅ Partially Implemented (Reuse with Refactor for Viewer)

| Page | Issue | Action |
|------|-------|--------|
| `AuditorDashboardPage` | Maps closely to Viewer needs (compliance KPIs, observation queue, anomalies) | Fork/adapt for read-only Viewer dashboard |
| `DcTempleSearchPage` | SA already routes here via `RoleRoute` | Already shared — works |
| `DcTempleProfilePage` | SA routes here | Already shared — works |
| `DcDeclarationListPage` | SA routes here | Already shared — works |
| `DcDeclarationDetailPage` | SA routes here | Already shared — works |
| Auditor routes | Reuse `DcTempleSearchPage`, `DcTempleProfilePage`, `DcDeclarationListPage`, `DcDeclarationDetailPage` for Viewer | Clone route group with VIEWER role |

#### ❌ Missing (New Implementation Required)

| Item | Gap |
|------|-----|
| **VIEWER role in frontend** | `roles.ts` has no `VIEWER` constant |
| **VIEWER routes** | `routePaths.ts` has no viewer-specific paths |
| **VIEWER sidebar nav** | `Sidebar.tsx` has no `getViewerNavItems()` |
| **VIEWER dashboard page** | No dedicated viewer dashboard |
| **SA → DC cross-navigation** | SA sidebar has no links to temple search, declarations, or DC views |
| **SA approval queue page** | No consolidated page for all pending approvals statewide |
| **SA escalation monitoring page** | No UI for escalated/overdue items |
| **SA workflow monitoring page** | No UI for active workflow instances |
| **AppShell page titles** | Missing entries for admin tools, system config, notification rules, temple governance |

---

## 3) Gap Analysis

### Feature-by-Feature Mapping

| # | Feature | Requirement | Current State | Gap | Proposed |
|---|---------|------------|---------------|-----|----------|
| 1 | **SA Dashboard** | Statewide KPIs, user counts, distributions | ✅ Implemented | Minor: no trend data, no recent activity feed | Enhance with activity feed |
| 2 | **SA Approval Visibility** | See all pending approvals statewide | ⚠️ Partial (KPI count only) | No drill-down list of pending items | New: `/admin/approvals` page + API |
| 3 | **SA Audit Monitoring** | Full audit log access | ✅ Implemented | None | Reuse as-is |
| 4 | **SA Global Search** | Search temples across all hierarchies | ⚠️ SA reuses DC search route | No SA-dedicated search in sidebar | Add DC temple search to SA navigation |
| 5 | **SA User Management** | Full CRUD, all roles | ✅ Implemented | Cannot create VIEWER role users | Add VIEWER to UserRole enum |
| 6 | **SA Geo Master** | Full CRUD on geo hierarchy | ✅ Implemented | No edit/delete for existing entries | Add PUT/DELETE for geo entities |
| 7 | **SA Workflow Monitoring** | See all active workflows | ❌ Missing | No workflow instance listing | New: workflow monitoring endpoint + UI |
| 8 | **SA Escalation Mgmt** | See overdue/escalated items | ⚠️ Partial (stale verifications) | No unified escalation queue | New: `/admin/escalations` page |
| 9 | **SA Analytics/Reporting** | Statewide analytics | ⚠️ Partial (dashboard KPIs) | No time-series, no downloadable reports | Phase 2: analytics module |
| 10 | **SA Notification Visibility** | See all notifications | ⚠️ SA has notification inbox | No cross-user notification view | Low priority — current inbox sufficient |
| 11 | **SA Clarification Monitoring** | Monitor clarification threads | ❌ No cross-entity view | Cannot see all open clarifications | New: API + page |
| 12 | **SA Compliance Tracking** | Track compliance posture | ⚠️ Via auditor endpoints | SA can access auditor compliance endpoint | Add SA route to compliance page |
| 13 | **SA Logs/History** | Governance + data events | ✅ Implemented | None | Reuse as-is |
| 14 | **SA Exports** | Full export capability | ⚠️ SA reuses DC export route | No SA-dedicated export in sidebar | Add export link to SA navigation |
| 15 | **SA System Config** | SLA, features, notifications | ✅ Implemented | None | Reuse as-is |
| 16 | **SA Temple Governance** | Lifecycle management | ✅ Implemented | None | Reuse as-is |
| 17 | **Viewer Role** | Read-only statewide access | ❌ Not implemented | No VIEWER in enum, no routes, no sidebar | Full implementation needed |
| 18 | **Viewer Dashboard** | Compliance-oriented KPIs | ❌ Missing | No viewer dashboard | New: adapted from AuditorDashboard |
| 19 | **Viewer Temple Search** | Read-only search | ⚠️ Auditor reuses DC search | Add VIEWER to route + SpEL | Minor wiring |
| 20 | **Viewer Profile View** | Read-only profile | ⚠️ Auditor reuses DC profile view | Add VIEWER to route + SpEL | Minor wiring |
| 21 | **Viewer Declarations** | Read-only declarations | ⚠️ Auditor reuses DC declaration list | Add VIEWER to route + SpEL | Minor wiring |
| 22 | **Viewer Exports** | Limited exports | ⚠️ Export requires `CAN_READ_ALL` | Add VIEWER to `CAN_READ_ALL` SpEL | One-line change |
| 23 | **Viewer Audit Trail** | Read audit trails | ⚠️ Auditor has this | Add VIEWER to route + SpEL | Minor wiring |
| 24 | **Viewer Compliance** | View compliance reports | ⚠️ Auditor has this | Add VIEWER to route + SpEL | Minor wiring |
| 25 | **Viewer Observations** | View observations (no create) | ⚠️ Auditor can list + create | Viewer must NOT create | Route guards only — no create button |
| 26 | **Filtering/Searching** | All list pages | ✅ Most pages have search/filter | Some admin pages lack filtering | Incremental improvement |
| 27 | **Pagination** | All list pages | ✅ Implemented throughout | None | Reuse as-is |
| 28 | **Mobile Responsive** | All pages | ✅ AppShell is responsive | Some admin pages could improve | Incremental |
| 29 | **Accessibility** | WCAG compliance | ⚠️ Basic semantic HTML | No aria-labels on many elements | Phase 2 |

