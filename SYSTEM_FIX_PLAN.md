# System Fix Implementation Plan
_Single Source of Truth — Temple Registry Full-Stack Correction_

---

## 1. Issue Traceability Table

| Issue ID | Severity | Module | Summary | Status |
|---|---|---|---|---|
| C1 | CRITICAL | Frontend | ContractorFormPage uses `localStorage.getItem('token')` — document fetch always 401 | ✅ DONE |
| C2 | CRITICAL | Frontend/Backend | useWorkflowSse token never injected — SSE permanently broken | ✅ DONE |
| C3 | CRITICAL | Frontend | Trust has no Submit-for-Review button — trust never enters approval cycle | ✅ DONE |
| H1 | HIGH | Backend | WorkflowController dashboard returns raw `Page<WorkflowInstance>` entity | ✅ DONE |
| H2 | HIGH | Backend | All v2 WorkflowController responses bypass `ApiResponse<T>` envelope | ✅ DONE |
| H3 | HIGH | Backend | OverdueScheduler/OverdueWorkflowScheduler double-scheduling risk (downgraded — verify) | N/A — not a Spring bean |
| H4 | HIGH | Frontend | Duplicate templeApi.ts with diverging response types | ✅ DONE |
| H5 | HIGH | Backend+Frontend | clarification-respond sends `{message}` to endpoint expecting full asset DTO | N/A — backend correct |
| H6 | HIGH | Frontend | `POST /governance/declarations/${id}/submit` defined in both declarationApi and governanceApi | ✅ DONE |
| H7 | HIGH | Backend+Frontend | Missing `DELETE /temples/{id}/profile/staging/{stagingId}` endpoint | ✅ DONE |
| H8 | HIGH | Frontend+Backend | TA cannot withdraw submitted declaration — no button, possible missing endpoint | ✅ DONE |
| H9 | HIGH | Frontend | DC has no UI for UNFLAG_TEMPLE_PROFILE action | ✅ DONE |
| H10 | HIGH | Backend | AUDITOR role not explicitly denied on WorkflowController mutating endpoints | ✅ DONE |
| M1 | MEDIUM | Frontend | 7 of 13 declaration statuses unhandled in declarationPermissions.ts | ✅ DONE |
| M2 | MEDIUM | Frontend | dcHooks.ts uses deprecated useGetDcUnreadCountQuery from dcApi (dual polling) | N/A — same as C2 (SSE) |
| M3 | MEDIUM | Frontend | TA has no site visit visibility | ✅ DONE |
| M4 | MEDIUM | Frontend/UX | No guided path for TA after Temple Profile staging is REJECTED | ✅ DONE |
| M5 | MEDIUM | Frontend | WorkflowGovernancePanel both polls 30s AND opens SSE simultaneously | ✅ DONE |
| M6 | MEDIUM | Backend | GeoController @PreAuthorize("isAuthenticated()") conflicts with SecurityConfig permitAll | ✅ DONE |
| M7 | MEDIUM | Frontend | No DC Workflow Dashboard page despite full API existing | ✅ DONE |
| M8 | MEDIUM | Backend | Profile/Trust workflow notifications not confirmed via WorkflowEngine outbox | N/A — NotificationRouter outbox dispatcher already exists (V55) |
| M9 | MEDIUM | Integration | No DC notification when TA responds to clarification (CLARIFICATION_RESPONDED) | N/A — RESPOND_CLARIFICATION→DC rule seeded in V55 |
| m1 | MINOR | Backend | RefreshToken/NotificationEvent/InAppNotification/AuditDataEvent don't extend BaseEntity | N/A — intentionally append-only |
| m2 | MINOR | Backend | Deprecated shims still registered as Spring beans | ✅ DONE |
| m3 | MINOR | Frontend | 9 modules use window.location.reload() for retry | ✅ DONE |
| m4 | MINOR | Frontend | Dev credentials with password123 in LoginForm | ✅ DONE |
| m5 | MINOR | Frontend | TaDocumentsPage hardcodes ownerType: 'TEMPLE' | ✅ DONE |
| m7 | MINOR | Frontend | DcTempleSearchPage.old.tsx orphan file | ✅ DONE |
| m8 | MINOR | Backend | StateTransitionValidator.requestTransition() is no-op, legacy callers get silent bypass | N/A — intentional no-op, deprecated |

---

## 2. Implementation Tasks (Detailed)

_(Status updated as each task completes)_

---

## 3. Status Transition Fixes

### Declaration Status Machine (13 statuses)

| Status | TA canEdit | TA canSubmit | TA canRespond | TA canWithdraw | DC canApprove | DC canReject | DC canClarify | DC canBeginReview | DC canScheduleSiteVisit | DC canCompleteSiteVisit | DC canVerify |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SUBMITTED | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| UNDER_REVIEW | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| CLARIFICATION_REQUIRED | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| CLARIFICATION_RESPONDED | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| RESUBMITTED | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| APPROVED | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| RE_APPROVED | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| REJECTED | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| UPDATED_AFTER_APPROVAL | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| OVERDUE | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| WITHDRAWN | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SUPERSEDED | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SITE_VISIT_SCHEDULED | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| SITE_VISIT_COMPLETED | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| VERIFIED | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Notification Fix Plan

| Event | Backend Fix | Frontend Fix |
|---|---|---|
| SSE auth | Add ?token= param validation to NotificationSseController | Read Redux accessToken in useWorkflowSse |
| Clarification responded → DC | Verify outbox in WorkflowEngineImpl for RESPOND_CLARIFICATION | M1 fix makes CLARIFICATION_RESPONDED visible |
| Profile submitted → DC | Verify TempleProfileWorkflowServiceImpl outbox | None needed (polling) |
| Site visit scheduled → TA | Verify outbox for SCHEDULE_SITE_VISIT | M3 site visit banner |
| Dual poll removal | None | dcHooks.ts → useNotifications unified |

---

## 5. Frontend-Backend Alignment Fixes

- [ ] ContractorFormPage: raw fetch → RTK Query (C1)
- [ ] clarification-respond DTO split (H5)
- [ ] Duplicate governance mutations in declarationApi (H6)
- [ ] Duplicate templeApi.ts consolidation (H4)
- [ ] Declaration permissions cover all 13 statuses (M1)
- [ ] Geo endpoint auth conflict (M6)

---

## 6. Global Verification Checklist

- [ ] TA creates/submits declaration → DC notified via SSE
- [ ] DC approves/rejects → TA notified
- [ ] Clarification loop works without data loss
- [ ] TA can withdraw SUBMITTED declaration
- [ ] TA sees site visit status
- [ ] Trust can be submitted for review
- [ ] Profile rejection shows guided CTA
- [ ] DC sees unified workflow dashboard
- [ ] AUDITOR blocked from mutating endpoints
- [ ] Geo dropdowns work without login (registration flow)
- [ ] Contractor document fetch uses authenticated RTK Query

---

## 7. Execution Log

| # | Issue | Change Made | Verified | Blockers |
|---|---|---|---|---|
| — | — | — | — | — |
