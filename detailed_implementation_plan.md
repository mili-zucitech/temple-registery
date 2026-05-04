# In-Depth Implementation Plan: Standardized Governance Workflow

This plan details the technical steps to achieve Phase B of the Temple Registry Governance architecture, including full end-to-end testing coverage.

## 1. Phase 1: Engine Foundation (P1, P4, P7)
*Objective: Stabilize the core state machine and business policies.*

### [P1] Transition Rule Registry Update
1.  Modify `TransitionRuleRegistry.java` to include the `OVERDUE` status transitions.
2.  Add `FLAG_OVERDUE` system action rules for `SUBMITTED` and `UNDER_REVIEW` states.
3.  Ensure `TransitionRule.matches()` handles wildcard `*` entity types with correct precedence.
4.  **Acceptance**: `WorkflowEngineImpl` starts without errors and recognizes `OVERDUE` transitions.

### [P4] SiteVisitBlocksApprovalPolicy
1.  Create `com.templeregistry.service.workflow.policy.SiteVisitBlocksApprovalPolicy`.
2.  Implement `evaluate()` to deny `APPROVE` if `instance.subStatus == "VERIFICATION_FAILED"`.
3.  Remove the hardcoded check in `GovernanceWorkflowServiceImpl.approveDeclaration()`.
4.  **Acceptance**: Attempting to approve a failed declaration via the API returns a 422 WorkflowException.

### [P7] Workflow Overdue Scheduler
1.  Create `com.templeregistry.service.workflow.WorkflowOverdueScheduler` with a daily `@Scheduled` job.
2.  Query `workflow_instances` for overdue deadlines in `SUBMITTED`/`UNDER_REVIEW` states.
3.  Call `workflowEngine.executeSystem(id, FLAG_OVERDUE, ...)`.
4.  **Acceptance**: Audit log shows `SYSTEM` actor flagging records as `OVERDUE`.

---

## 2. Phase 2: Correctness & Unified Snapshotting (P2, P3, P6)
*Objective: Align domain services with the VersionService and ClarificationEngine.*

### [P2] VersionService Snapshot Correction
1.  **Refactor `WorkflowEngineImpl`**: Remove the `versionService.snapshot()` call from the core `execute()` loop (lines 266-275).
2.  **Service Integration**:
    *   `GovernanceWorkflowServiceImpl`: Call `versionService.snapshot(entity)` in `submit/approve` for Trust and Declaration.
    *   `TempleProfileStagingServiceImpl`: Call `versionService.snapshot(entity)` in `submit/approve`.
3.  **Acceptance**: `entity_versions` table contains JSON of `AssetDeclaration`/`Trust` entities, not `WorkflowInstance`.

### [P3] Service Layer State & Notification Sync
1.  **Reorder Calls**: Move `workflowEngineAdaptor.adaptApprove()` **above** `declaration.setStatus()` in `approveDeclaration()`.
2.  **Cleanup Notifications**: Remove manual `notificationHelper` calls in `approveDeclaration` and `rejectDeclaration`.
3.  **Acceptance**: TA receives exactly one notification (via the engine's event outbox).

### [P6] Clarification Engine Expansion
1.  Refactor `GovernanceWorkflowServiceImpl.sendBackTrust()` to use `clarificationEngine.requestClarification()`.
2.  Implement `requestClarification()` in `TempleProfileStagingServiceImpl`.
3.  Update the UI/API to fetch threads from `clarification_thread` for all three modules.

---

## 3. Phase 3: Unified API v2 (P5)
*Objective: Provide a cohesive response contract to the frontend.*

### [P5] Workflow Envelope Assembler
1.  Create `com.templeregistry.dto.response.workflow.WorkflowEnvelope<T>`.
2.  Create `com.templeregistry.service.workflow.WorkflowEnvelopeAssembler` to merge:
    *   Domain Data (`T`)
    *   `WorkflowInstance` (Status, Available Actions)
    *   `ClarificationSummary`
    *   `VersionSummary` (from `EntityVersion`)
3.  Expose `GET /api/v2/declarations/{id}` etc., returning the envelope.
4.  **Acceptance**: Frontend can render history, diffs, and actions from a single JSON response.

---

## 4. Phase 4: Final Cutover & Cleanup (P8, P9)
*Objective: Remove legacy artifacts and enforce engine authority.*

### [P8] Exception Propagation
1.  Modify `WorkflowEngineAdaptor.safeExecute()` to remove the `try/catch` shim.
2.  Update `GlobalExceptionHandler` to map `WorkflowException` to a clean 422 JSON response.
3.  **Acceptance**: Any rule violation (e.g., duplicate submission) is visible to the user as an error.

### [P9] Retirement of Legacy Artifacts
1.  Delete `SnapshotService` and `AssetDeclarationVersion`.
2.  Delete `DeclarationClarification` repository.
3.  Remove `Trust.sendBackReason` usage in favor of `ClarificationEngine`.
4.  **Acceptance**: Project compiles and passes tests without legacy governance classes.

---

## 5. Comprehensive Testing Strategy

To ensure "end-to-end" coverage as requested, the following test suite will be implemented alongside the P1-P9 features.

### A. Backend Unit & Integration Tests (JUnit 5 + Mockito)
| Test Class | Focus Area | Requirement Covered |
| :--- | :--- | :--- |
| `TransitionRuleRegistryTest` | Verification of all 15+ state transitions (Universal + Module Specific). | P1 |
| `WorkflowPolicyTest` | Testing `SiteVisitBlocksApprovalPolicy` with various sub-status combinations. | P4 |
| `WorkflowEngineExecuteTest` | Comprehensive execution flow including Role checks, Snapshots, and Audit logs. | P2, P8 |
| `VersionServiceTest` | Deep validation of JSON diffing logic and field-level change detection. | P2 |
| `ClarificationEngineTest` | Multi-round thread management and automated state transitions. | P6 |
| `WorkflowOverdueSchedulerTest` | Mocking `deadlineAt` and verifying the `SYSTEM` actor's auto-flagging. | P7 |

### B. API Integration Tests (RestAssured / MockMvc)
*   **API v2 Contract Validation**: Verify that `GET /api/v2/declarations/{id}` returns the full `WorkflowEnvelope` with all 5 nested summaries.
*   **Access Control**: Negative tests ensuring DC cannot approve records from other districts (HTTP 403).

### C. Frontend Tests (Vitest + React Testing Library + MSW)
*   **Workflow UI Components**: Test that the "Approve" button is correctly disabled if the declaration has a `VERIFICATION_FAILED` sub-status.
*   **Clarification Sidebar**: Verify that multiple rounds of threads are rendered in chronological order.
*   **Version Diff View**: Test the rendering of field-level changes (Added/Removed/Changed colors).

### D. End-to-End Governance Scenarios (Playwright / Cypress)
1.  **The "Success Path"**:
    *   TA logins -> Enters Trust data -> Submits.
    *   DC logins -> Filters by "Pending" -> Sees Trust record -> Reviews -> Approves.
    *   Verify: Trust status is "APPROVED" and Digital Acknowledgement is generated.
2.  **The "Clarification Loop"**:
    *   DC finds issue -> Requests Clarification.
    *   TA receives notification -> Updates record -> Resubmits.
    *   DC reviews updated record -> Approves.
3.  **The "Policy Block"**:
    *   DC orders Physical Verification -> Marks as "FAILED".
    *   DC attempts to click "Approve" -> System displays "Action Blocked by Policy" error.
    *   DC Rejects record.

---

## Success Criteria
1.  **Test Parity**: Every transition in the `TransitionRuleRegistry` must have a corresponding test case.
2.  **Zero Duplication**: No duplicate notifications for any governance event.
3.  **Clean Retirement**: `SnapshotService` and legacy versioning classes are removed with no compilation errors.
4.  **100% Code Coverage**: All new workflow logic (P1-P8) must be covered by unit tests.
