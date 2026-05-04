# WorkflowStateMachineService Implementation

## Overview

The `WorkflowStateMachineService` has been implemented as part of the backend domain model cleanup bugfix (Task 10.1). This service centralizes all governance workflow state transitions to ensure consistency and prevent parallel state machine divergence.

## Purpose

**Bug Condition Addressed:**
- Scattered if-else status mutations across the codebase allowed parallel state machines to diverge
- Multiple status fields (submissionStatus, dcDecisionStatus, status) could hold contradictory values
- No single source of truth for workflow state

**Expected Behavior:**
- All governance actions go through a centralized state machine
- Single authoritative status field updated atomically
- Complete audit trail maintained for all transitions
- Optimistic locking prevents concurrent conflicting writes

## Architecture

### Design Principles

1. **Single Source of Truth**
   - Trust: `submissionStatus` is the single authoritative workflow field
   - AssetDeclaration: `status` (DeclarationStatus) is the single authoritative workflow field
   - Physical verification uses a separate `physicalVerificationStatus` field (DC-only, not part of main workflow)

2. **Atomic Transitions**
   - Each method updates only the single authoritative status field
   - No parallel state machines can diverge
   - All transitions are transactional

3. **Audit Trail**
   - Every transition appends a record to `governance_action_history`
   - Uses existing `GovernanceAuditService` for consistency
   - Includes user ID, action type, and comments/reasons

4. **Optimistic Locking**
   - `governanceVersion` field incremented on every transition
   - Prevents concurrent conflicting writes
   - Ensures data consistency

## API

### Trust Workflow Transitions

```java
// DRAFT → SUBMITTED
void submitTrust(Trust trust, Long submittedBy);

// SUBMITTED → APPROVED
void approveTrust(Trust trust, Long approvedBy, String comment);

// SUBMITTED → REJECTED (terminal)
void rejectTrust(Trust trust, Long rejectedBy, String reason);

// SUBMITTED → SENT_BACK
void sendBackTrust(Trust trust, Long sentBackBy, String reason);
```

### AssetDeclaration Workflow Transitions

```java
// DRAFT → SUBMITTED
void submitDeclaration(AssetDeclaration declaration, Long submittedBy);

// SUBMITTED/UNDER_REVIEW/VERIFIED → APPROVED
void approveDeclaration(AssetDeclaration declaration, Long approvedBy, String comment);

// SUBMITTED/UNDER_REVIEW → REJECTED (terminal)
void rejectDeclaration(AssetDeclaration declaration, Long rejectedBy, String reason);

// SUBMITTED/UNDER_REVIEW → CLARIFICATION_REQUIRED
void sendBackDeclaration(AssetDeclaration declaration, Long sentBackBy, String reason);

// Physical verification transitions (separate from main workflow)
void orderPhysicalVerification(AssetDeclaration declaration, Long orderedBy, String comment);
void markPhysicallyVerified(AssetDeclaration declaration, Long verifiedBy, String comment);
void markVerificationFailed(AssetDeclaration declaration, Long markedBy, String reason);
```

## Implementation Details

### Files Created

1. **Interface**: `backend/src/main/java/com/templeregistry/service/WorkflowStateMachineService.java`
   - Defines all workflow transition methods
   - Documents design principles and requirements
   - Specifies parameters and behavior for each transition

2. **Implementation**: `backend/src/main/java/com/templeregistry/service/impl/WorkflowStateMachineServiceImpl.java`
   - Implements all transition methods
   - Handles status updates, timestamps, and audit logging
   - Manages optimistic locking via governanceVersion

3. **Tests**: `backend/src/test/java/com/templeregistry/service/WorkflowStateMachineServiceTest.java`
   - 14 unit tests covering all transitions
   - Verifies single source of truth principle
   - Validates audit logging and optimistic locking
   - All tests passing ✓

### Key Features

1. **Trust Transitions**
   - Updates only `submissionStatus` field
   - Stores `sendBackReason` when applicable
   - Increments `governanceVersion` for optimistic locking
   - Logs all actions to `governance_action_history`

2. **AssetDeclaration Transitions**
   - Updates only `status` (DeclarationStatus) field
   - Sets `submittedAt`, `submittedBy`, `reviewedAt`, `reviewedBy` timestamps
   - Stores `sendBackReason` and increments `clarificationRound` when sent back
   - Increments `governanceVersion` for optimistic locking
   - Logs all actions to `governance_action_history`

3. **Physical Verification**
   - Separate from main workflow status
   - Updates `physicalVerificationStatus` field only
   - Sets verification timestamps (`physicalVerificationOrderedAt`, `physicalVerificationCompletedAt`)
   - Does NOT affect main workflow `status` field
   - DC-only field, never exposed to Temple Authority

## Usage Example

```java
@Service
@RequiredArgsConstructor
public class TrustService {
    private final WorkflowStateMachineService workflowStateMachineService;
    private final TrustRepository trustRepository;

    @Transactional
    public void submitTrust(Long trustId, Long userId) {
        Trust trust = trustRepository.findById(trustId)
            .orElseThrow(() -> new EntityNotFoundException("Trust not found"));
        
        // Use state machine service for transition
        workflowStateMachineService.submitTrust(trust, userId);
        
        // Save the updated entity
        trustRepository.save(trust);
    }
}
```

## Benefits

1. **Consistency**: All workflow transitions go through a single service
2. **Auditability**: Complete audit trail for all state changes
3. **Maintainability**: Centralized logic easier to understand and modify
4. **Testability**: Clear interface makes testing straightforward
5. **Safety**: Optimistic locking prevents concurrent conflicts
6. **Single Source of Truth**: No parallel state machines can diverge

## Requirements Satisfied

- **2.8**: AssetDeclaration uses DeclarationStatus as single authoritative workflow field
- **2.9**: Service methods query only status field for workflow decisions
- **2.10**: Trust uses submissionStatus as single workflow state field
- **3.5**: Trust workflow transitions (DRAFT → SUBMITTED → SENT_BACK/APPROVED/REJECTED) preserved
- **3.8**: AssetDeclaration workflow transitions preserved
- **3.15**: All DC governance actions append to governance_action_history

## Testing

All 14 unit tests pass successfully:

```
Tests run: 14, Failures: 0, Errors: 0, Skipped: 0
```

Test coverage includes:
- All Trust workflow transitions (submit, approve, reject, send back)
- All AssetDeclaration workflow transitions (submit, approve, reject, send back)
- Physical verification transitions (order, mark verified, mark failed)
- Single source of truth validation
- Audit logging verification
- Optimistic locking verification

## Next Steps

Task 10.2 will refactor existing service methods to use this centralized `WorkflowStateMachineService` instead of scattered status mutations throughout the codebase.
