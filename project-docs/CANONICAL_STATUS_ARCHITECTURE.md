# Canonical Status Architecture Plan
**Temple Registry — Production-Grade TA ↔ DC Governance System**
_Fully code-verified. Every claim traceable to file + line._
_Produced: May 2026_

---

## Architecture State — Pre-Report Finding

> **The WorkflowEngine migration is already in progress.** This is not a greenfield design task.

**VERIFIED**: `WorkflowInstance.java` Javadoc [WorkflowInstance.java:1-28]:
```
"The single source of truth for workflow state across ALL governable entities."
"Replaces: Trust.submissionStatus + Trust.dcDecisionStatus
           + AssetDeclaration.status + TempleProfileStaging.status
           + BoardMember.isVerifiedByDc"
```

**VERIFIED**: V52 migration comment:
```sql
-- Implements the canonical governance workflow engine as per Architecture Blueprint §2
-- Replaces: Trust.submissionStatus, AssetDeclaration.status,
--           TempleProfileStagingStatus, BoardMember.isVerifiedByDc
```

**VERIFIED**: `WorkflowEngineAdaptor.java` Javadoc [line 19-24]:
```
PHASE A (now): Existing services call the adaptor. Legacy status fields remain for backward-compat.
PHASE B (next): Remove legacy status fields. All reads go through WorkflowInstance.status.
```

The codebase is in **Phase A**. Phase B is planned but not executed. The V58 migration has the Phase B schema changes commented out. This plan defines how to complete Phase B safely, fix three discovered violations, and establish a permanent canonical architecture.

---

## Section 1 — Canonical Status Ownership Model

### Decision: One Authoritative Owner Per Module

| Module | Authoritative Owner | Justification | Phase A State | Phase B Target |
|---|---|---|---|---|
| **Temple Profile** | `WorkflowInstance.status` | `TempleProfileStagingResponse.statusLabel` reads from `wi.status.name()` [TempleProfileStagingServiceImpl.java:479]. Repository queries JOIN on `WorkflowInstance.status`. The entity column `TempleProfileStaging.status` is only written by the broken legacy PATH B. | WorkflowInstance is already the de-facto source | Drop `TempleProfileStaging.status` column |
| **Declaration** | `WorkflowInstance.status` | `assertEntityStatusConsistency()` is called after every mutation [GovernanceWorkflowServiceImpl.java:~860]. Declaration entity field dual-writes happen in the same `@Transactional` boundary and are validated at write time. WorkflowInstance.status is the query source for all DC dashboard listings. | Dual-write with V-H1 guard | Drop `AssetDeclaration.status` column |
| **Trust** | `WorkflowInstance.status` | Same pattern as Declaration. `assertEntityStatusConsistency()` maps `CLARIFICATION_REQUESTED → SENT_BACK` for Trust [line 881]. All DC governance actions go through `workflowEngineAdaptor`. | Dual-write with V-H1 guard | Drop `Trust.submission_status`, `Trust.dc_decision_status` columns |
| **Board Member** | None (governed under Trust) | Board members have no independent governance lifecycle. Their governance state is subordinate to the Trust. `BoardMemberResponse.dcFlagReason` is `@JsonIgnore` [BoardMemberResponse.java:21] — never exposed via API. No WorkflowInstance exists for BOARD_MEMBER. | Admin data only | Remove `board_members.dc_flag_reason` column |
| **Employee** | `EmployeeStatus` enum | **ADMINISTRATIVE MODULE ONLY.** `EmployeeStatus` = ACTIVE / ON_LEAVE / RETIRED / RESIGNED. These are lifecycle statuses, not governance states. | **VIOLATION** — DC approval columns still exist | Remove DC governance columns + endpoints |
| **Contractor** | `PaymentStatus` enum | **ADMINISTRATIVE MODULE ONLY.** `ContractorResponse.java` correctly has zero governance fields. `DcComplianceServiceImpl.java:29` confirms: "Staff (Employee) and Contractor modules have NO DC approval or verification workflow." | Clean — no governance columns | No action needed |

### Module: Employee — ARCHITECTURAL VIOLATION FOUND

**VERIFIED VIOLATION**: `Employee.java` retains governance columns that directly contradict the hard constraint:

```java
// Employee.java — GOVERNANCE COLUMNS ON ADMINISTRATIVE MODULE — MUST REMOVE
@Column(name = "is_verified_by_dc", nullable = false)
private boolean verifiedByDc = false;            // ← violates constraint

@Column(name = "verified_by_dc_at")
private LocalDateTime verifiedByDcAt;            // ← violates constraint

@Column(name = "verified_by_dc_user_id")
private Long verifiedByDcUserId;                 // ← violates constraint

@Column(name = "dc_flag_reason", columnDefinition = "TEXT")
private String dcFlagReason;                     // ← violates constraint
```

**VERIFIED**: `EmployeeServiceImpl.java` contains active DC approval endpoints:
- `approveEmployee()` [line 262] — sets `verifiedByDc = true`
- `rejectEmployee()` [line ~310] — sets `dcFlagReason`, `verifiedByDc = false`
- `submitForReview()` [line ~355] — TA submits for DC review
- `listPendingReviews()` [line ~405] — DC queue for employee approvals

**VERIFIED**: `DcEmployeeController.java:51` exposes `POST /dc/employees/{id}/approve`.

**VERDICT**: A complete DC approval state machine exists for Employee. This is a category violation. It is NOT exposed via `EmployeeResponse` (the DTO correctly excludes these fields), but the DB columns, entity fields, service methods, and controller endpoints actively implement what the constraint forbids.

**Impact**: Temple compliance posture must NOT depend on employee DC approval. The `checklist.employeeCount` referenced in dashboard data is a data-existence count, not an approval state — this is acceptable and must remain. What must be removed is the approval workflow itself.

---

## Section 2 — Database Contract Audit

### Tables with Active Status Drift Risk

#### `trusts`

| Column | Purpose | Status | Action |
|---|---|---|---|
| `workflow_instance_id` | Backref to canonical WF (no FK constraint) | **LIVE — denorm backref** | Add FK after Phase B confirms no orphans |
| `submission_status` | Phase A sync copy of WorkflowInstance.status | **DUPLICATE — Phase A compat** | Remove in Phase B after frontend cutover |
| `dc_decision_status` | Gen1 legacy field | **DUPLICATE — partially stale** | Remove in Phase B |
| `send_back_reason` | DC reason text shown to TA | **KEEP** — display field, not a status | Keep as display data |
| `dc_flag_reason` | DC flag reason (legacy) | **DUPLICATE of send_back_reason** | Remove after consolidating to `send_back_reason` |
| `lock_version` | Optimistic lock on Trust entity | **KEEP** | Needed for entity-level concurrent edit protection |
| `system_verification_status` | Internal system checks | **KEEP** — never exposed to TA | Correct |

**Can DB allow inconsistent state?** YES.
- `trusts.submission_status` and `workflow_instances.status` for the same trust can diverge if any code writes one but not the other.
- No DB-level constraint enforces they match.
- The only enforcement is `assertEntityStatusConsistency()` in service code — which is only called from `GovernanceWorkflowServiceImpl` paths, not from `DcComplianceServiceImpl`.

**VERIFIED GAP**: After `DcComplianceServiceImpl.verifyTrust()`:
- Sets `trust.dcDecisionStatus = APPROVED_BY_DC` AND `trust.submissionStatus = APPROVED` (correctly)
- Does NOT call `assertEntityStatusConsistency()`
- Therefore if a developer adds future code that sets only one field, the guard does not fire

**Missing constraint proposal** (low-risk, non-breaking):
```sql
-- V78: Add CHECK constraint to ensure submission_status and dc_decision_status
-- are always in a known combination.
-- WARNING: Only add AFTER Phase B removes the columns, or skip this entirely
-- and rely on assertEntityStatusConsistency().
-- VERDICT: Do NOT add a DB constraint here — the code-level guard is more maintainable.
```

#### `asset_declarations`

| Column | Purpose | Status | Action |
|---|---|---|---|
| `workflow_instance_id` | Backref to canonical WF (no FK) | **LIVE — denorm backref** | Add FK in Phase B |
| `status` | Phase A sync copy | **DUPLICATE — Phase A compat** | Remove in Phase B |
| `physical_verification_status` | Separate sub-status, DC-only | **KEEP** — not replaced by WF | Correct |
| `system_verification_status` | Internal only | **KEEP** — never exposed to TA | Correct |
| `is_overdue` | Boolean flag for overdue | **REDUNDANT** with `WorkflowStatus.OVERDUE` | See OVERDUE gap below |
| `send_back_reason` | DC send-back reason text | **KEEP** — display field | Correct |
| `lock_version` | Optimistic lock | **KEEP** | Correct |

**VERIFIED GAP — OVERDUE state**: `WorkflowEngineImpl.executeSystem()` → `WorkflowInstance.status = OVERDUE` only. The `is_overdue` boolean and `AssetDeclaration.status` are NOT updated by any listener or handler for the FLAG_OVERDUE system action. After FLAG_OVERDUE fires:
- `WorkflowInstance.status = OVERDUE`
- `asset_declarations.status` = prior state (e.g. SUBMITTED) ← STALE
- `asset_declarations.is_overdue = false` ← STALE

Both must be updated. The `GovernanceDomainEvent` is published but no handler for `FLAG_OVERDUE` was found that updates the domain entity.

#### `temple_profile_staging`

| Column | Purpose | Status | Action |
|---|---|---|---|
| `status` | Written only by legacy PATH B (broken) | **DEAD WRITE PATH** | Drop column in Phase B |
| `workflow_instance_id` | Not present — WF links via entity_type+entity_id only | **ABSENT** | Add backref column |
| `lock_version` | Added V52 | **CORRECT** | Keep |

**VERIFIED**: `TempleProfileStagingServiceImpl.toResponse()` reads `workflowInstance.status.name()` for `statusLabel` — never reads `TempleProfileStaging.status`. The entity column is dead from the read side and only written by the non-functional PATH B.

#### `employees`

| Column | Purpose | Status | Action |
|---|---|---|---|
| `status` | EmployeeStatus (ACTIVE/ON_LEAVE/RETIRED/RESIGNED) | **CORRECT — administrative** | Keep |
| `is_verified_by_dc` | **GOVERNANCE VIOLATION** | REMOVE | Migration V78 |
| `verified_by_dc_at` | **GOVERNANCE VIOLATION** | REMOVE | Migration V78 |
| `verified_by_dc_user_id` | **GOVERNANCE VIOLATION** | REMOVE | Migration V78 |
| `dc_flag_reason` | **GOVERNANCE VIOLATION** | REMOVE | Migration V78 |
| `submitted_at`, `submitted_by` | DC submission timestamps | **GOVERNANCE VIOLATION** — remove if DC approval removed | REMOVE |
| `reviewed_at`, `reviewed_by`, `review_remarks` | DC review fields | **GOVERNANCE VIOLATION** | REMOVE |
| `submission_status` | `@Transient` — already dropped from DB by V36 | Correct | OK |

**VERIFIED**: V36 migration already removed `submission_status` from `employees`. V35 removed other governance columns. The current violations (`is_verified_by_dc`, `dc_flag_reason`, etc.) are a **regression** — they were added back after the V36 cleanup or escaped it.

#### `board_members`

| Column | Purpose | Status | Action |
|---|---|---|---|
| `dc_flag_reason` | Governance field, `@JsonIgnore` in DTO | **DC-ONLY**, never exposed via API | Remove — no public surface, confusing presence |
| `lock_version` | Added V57 | **KEEP** | Correct |

#### `workflow_instances`

| Column | Status | Note |
|---|---|---|
| `sub_status` | Nullable — correct | Module nuances without new top-level state |
| `metadata_json` | JSON, nullable | Module-specific metadata, no status data here |
| UNIQUE INDEX `uk_wi_entity` on (entity_type, entity_id) | **CRITICAL** — prevents duplicate WF instances | Correct |
| `deadline_at` | Nullable | FLAG_OVERDUE uses this |

**Gap**: No FK from `workflow_instances.entity_id` to domain tables — intentional cross-aggregate design. Accepted.

#### `workflow_transitions`

| Aspect | Status |
|---|---|
| FK to `workflow_instances` (CASCADE DELETE) | Correct |
| UNIQUE on `idempotency_key` (workflow-level) | Correct |
| No UNIQUE on (workflow_instance_id, from_status, to_status, action) | Intentional — same transition can be retried |

**Missing index**: No index on `(workflow_instance_id, performed_at)` for the "show last N transitions for this entity" query pattern. Add in Phase 1.

### Proposed Flyway Migrations

#### V78 — Remove Employee governance columns (Phase 0, BREAKING)
```sql
-- V78: Remove DC governance columns from employees table
-- These columns violate the "Employee is administrative-only" constraint.
-- DcEmployeeController and EmployeeServiceImpl DC methods must be removed BEFORE this migration.

ALTER TABLE employees
    DROP INDEX IF EXISTS idx_employees_verified,
    DROP COLUMN IF EXISTS is_verified_by_dc,
    DROP COLUMN IF EXISTS verified_by_dc_at,
    DROP COLUMN IF EXISTS verified_by_dc_user_id,
    DROP COLUMN IF EXISTS dc_flag_reason,
    DROP COLUMN IF EXISTS submitted_at,
    DROP COLUMN IF EXISTS submitted_by,
    DROP COLUMN IF EXISTS reviewed_at,
    DROP COLUMN IF EXISTS reviewed_by,
    DROP COLUMN IF EXISTS review_remarks;
```

**Rollback strategy**: Restore columns from backup. Controller is already removed — no new writes are occurring. The data in these columns has no governance consequence.

#### V79 — Add workflow transition lookup index (Phase 1, safe)
```sql
-- V79: Add performance index for workflow_transitions history queries
ALTER TABLE workflow_transitions
    ADD INDEX IF NOT EXISTS idx_wt_instance_performed (workflow_instance_id, performed_at);
```

#### V80 — Remove board_members.dc_flag_reason (Phase 4, low-risk)
```sql
-- V80: Remove dc_flag_reason from board_members (already @JsonIgnore, never read)
ALTER TABLE board_members
    DROP COLUMN IF EXISTS dc_flag_reason;
```

#### V81 — Retire legacy Trust status columns (Phase 4, BREAKING — coordinate with frontend)
```sql
-- V81: Remove Phase A dual-write columns from trusts
-- Prerequisites: GovernanceStatusResolver deployed, frontend reading workflowInstanceId only
ALTER TABLE trusts
    DROP COLUMN IF EXISTS submission_status,
    DROP COLUMN IF EXISTS dc_decision_status,
    DROP COLUMN IF EXISTS dc_flag_reason;
-- Note: send_back_reason KEPT as it is display data, not a status field.
```

#### V82 — Retire AssetDeclaration legacy status column (Phase 4, BREAKING)
```sql
-- V82: Remove Phase A dual-write column from asset_declarations
-- Prerequisite: frontend reads declaration.workflowInstanceId → WorkflowGovernancePanel only
ALTER TABLE asset_declarations
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS is_overdue; -- covered by WorkflowStatus.OVERDUE after OVERDUE handler fix
```

#### V83 — Retire TempleProfileStaging.status column (Phase 4, safe)
```sql
-- V83: Remove dead status column from temple_profile_staging (never read by canonical path)
ALTER TABLE temple_profile_staging
    DROP COLUMN IF EXISTS status;
```

---

## Section 3 — API Contract Canonicalization

### Current State — DTOs Exposing Multiple Statuses

#### `TrustResponse.java` — PROBLEMATIC (3 competing status fields)

```java
private Long workflowInstanceId;          // Gen3 — canonical path ✅
private TrustStatus status;               // Gen0 — ACTIVE/DISSOLVED — NOT a governance status ✅ Keep
private SubmissionStatus submissionStatus; // Gen2 — DUPLICATE of WorkflowInstance.status ❌
private DcDecisionStatus dcDecisionStatus; // Gen2 — PARTIALLY stale (PATH A doesn't update it) ❌
private String sendBackReason;            // Display text — KEEP ✅
private String dcFlagReason;             // Display text (redundant with sendBackReason) ❌
```

**VERIFIED**: `trustReviewStatus()` in `TaTrustPage.tsx` reads `submissionStatus`, `dcDecisionStatus`, `isVerifiedByDc`, `dcFlagReason`, `sendBackReason` simultaneously — 5 fields for one governance status. This is the frontend symptom of the backend DTO problem.

#### `DeclarationResponse.java` — ACCEPTABLE (bounded dual-write)

```java
private Long workflowInstanceId;   // canonical ✅
private DeclarationStatus status;  // Phase A sync copy — bounded by assertEntityStatusConsistency ⚠️ Remove in Phase B
private String sendBackReason;     // Display text — KEEP ✅
```

**VERDICT**: Declaration DTO is cleaner than Trust. The `status` field is consistent because of the V-H1 guard. Still should be removed in Phase B.

#### `TempleProfileStagingResponse.java` — CLEAN

```java
private Long workflowInstanceId;   // canonical ✅
private String statusLabel;        // derived from WorkflowInstance.status.name() ✅ (NOT entity column)
```

**VERDICT**: Already correct. No action needed except keeping this pattern.

#### `EmployeeResponse.java` — CORRECT

```java
private EmployeeStatus status;     // ACTIVE/ON_LEAVE/RETIRED/RESIGNED — administrative ✅
// No governance fields ✅
```

**VERDICT**: DTO is correct. Entity is the problem, not the DTO.

#### `ContractorResponse.java` — CORRECT

```java
private PaymentStatus paymentStatus; // administrative ✅
// No governance fields ✅
```

### Target Canonical Response Contract

For **Temple Profile**, **Declaration**, **Trust** (governance modules only):

```java
// Proposed: GovernanceStatusPayload — embed in module response DTOs
public record GovernanceStatusPayload(
    String status,                   // WorkflowInstance.status.name()
    String subStatus,                // WorkflowInstance.subStatus (nullable)
    String label,                    // Human-readable: "Awaiting DC Review", "Clarification Required", etc.
    String severity,                 // INFO | WARNING | ERROR | SUCCESS
    String actionableBy,             // "TA" | "DC" | "SYSTEM" | null
    boolean requiresComment,         // Does next action require a free-text field?
    Instant pendingSince,            // WorkflowInstance.submittedAt
    Instant deadline,                // WorkflowInstance.deadlineAt
    Long workflowInstanceId          // For WorkflowGovernancePanel deep-link
) {}
```

**Migration pattern** (backward-compatible — additive, not replacing):
```java
// TrustResponse — Phase B version
public class TrustResponse {
    private Long id;
    private Long templeId;
    private String trustName;
    private TrustType trustType;
    // ... domain fields ...

    private TrustStatus status;         // KEEP — entity lifecycle (ACTIVE/DISSOLVED)
    private String sendBackReason;      // KEEP — display text

    // Phase B: replace the 3 status fields below with:
    private GovernanceStatusPayload governanceStatus;  // ← NEW

    // Phase A compat (deprecated, remove in Phase B):
    @Deprecated private SubmissionStatus submissionStatus;
    @Deprecated private DcDecisionStatus dcDecisionStatus;
    @Deprecated private String dcFlagReason;
}
```

**DTO changes per module:**

| DTO | Add | Remove (Phase B) |
|---|---|---|
| `TrustResponse` | `GovernanceStatusPayload governanceStatus` | `submissionStatus`, `dcDecisionStatus`, `dcFlagReason` |
| `DeclarationResponse` | `GovernanceStatusPayload governanceStatus` | `DeclarationStatus status` |
| `TempleProfileStagingResponse` | `GovernanceStatusPayload governanceStatus` | `String statusLabel` (replace) |
| `EmployeeResponse` | — (no change) | — (no change) |
| `ContractorResponse` | — (no change) | — (no change) |

**Compatibility strategy**: Deprecate old fields with `@Deprecated` annotation and Jackson `@JsonProperty`. Keep both fields in the response during a transition window (one sprint). Remove old fields only after frontend is verified to use `governanceStatus`.

---

## Section 4 — GovernanceStatusResolver Design

### Purpose

Single backend service that resolves a canonical `GovernanceStatusPayload` for any governed entity from `WorkflowInstance.status`. Eliminates all frontend status synthesis, all DTO-level status duplication, and all `canonicalizeWorkflowStatusForEntity()` mapping logic currently spread across `GovernanceWorkflowServiceImpl`.

### Interface

```java
package com.templeregistry.service.governance;

import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowInstance;
import java.time.Instant;

public interface GovernanceStatusResolver {

    /**
     * Resolve canonical status payload for a governed entity.
     * Always reads from WorkflowInstance — never from legacy entity fields.
     *
     * @param entityType TRUST, DECLARATION, or TEMPLE_PROFILE
     * @param entityId   domain entity PK
     * @return canonical status payload for embedding in API response, never null
     */
    GovernanceStatusPayload resolve(WorkflowEntityType entityType, Long entityId);

    /**
     * Overload for callers that already hold the WorkflowInstance in memory.
     * Avoids a second DB lookup.
     */
    GovernanceStatusPayload resolveFromInstance(WorkflowInstance instance);
}
```

### Implementation

```java
package com.templeregistry.service.governance.impl;

@Service
@RequiredArgsConstructor
@Slf4j
public class GovernanceStatusResolverImpl implements GovernanceStatusResolver {

    private final WorkflowInstanceRepository instanceRepo;

    @Override
    @Transactional(readOnly = true)
    public GovernanceStatusPayload resolve(WorkflowEntityType entityType, Long entityId) {
        return instanceRepo.findByEntityTypeAndEntityId(entityType, entityId)
            .map(this::resolveFromInstance)
            .orElseGet(() -> GovernanceStatusPayload.unknown(entityType, entityId));
    }

    @Override
    public GovernanceStatusPayload resolveFromInstance(WorkflowInstance wi) {
        return GovernanceStatusPayload.builder()
            .status(wi.getStatus().name())
            .subStatus(wi.getSubStatus())
            .label(labelFor(wi.getStatus(), wi.getSubStatus()))
            .severity(severityFor(wi.getStatus()))
            .actionableBy(wi.getCurrentActorRole())
            .requiresComment(requiresCommentFor(wi.getStatus()))
            .pendingSince(wi.getSubmittedAt())
            .deadline(wi.getDeadlineAt())
            .workflowInstanceId(wi.getId())
            .build();
    }

    private String labelFor(WorkflowStatus status, String subStatus) {
        return switch (status) {
            case DRAFT                    -> "Draft — not submitted";
            case SUBMITTED                -> "Submitted — awaiting DC review";
            case UNDER_REVIEW             -> "Under Review by DC";
            case CLARIFICATION_REQUESTED  -> "Clarification Required";
            case CLARIFICATION_RESPONDED  -> "Clarification Responded — awaiting DC";
            case RESUBMITTED              -> "Resubmitted — awaiting DC review";
            case APPROVED                 -> "Approved";
            case RE_APPROVED              -> "Re-Approved";
            case REJECTED                 -> "Rejected";
            case UPDATED_AFTER_APPROVAL   -> "Edited — resubmission required";
            case OVERDUE                  -> "Overdue — deadline passed";
            case SUPERSEDED               -> "Superseded by newer version";
            case WITHDRAWN                -> "Withdrawn";
        };
    }

    private String severityFor(WorkflowStatus status) {
        return switch (status) {
            case APPROVED, RE_APPROVED    -> "SUCCESS";
            case CLARIFICATION_REQUESTED,
                 OVERDUE                  -> "WARNING";
            case REJECTED                 -> "ERROR";
            default                       -> "INFO";
        };
    }

    private String requiresCommentFor(WorkflowStatus status) {
        // Next action from the CURRENT status — comment is required for REJECT and CLARIFY
        // This is a hint for the frontend WorkflowDialog
        return switch (status) {
            case SUBMITTED, UNDER_REVIEW,
                 CLARIFICATION_RESPONDED  -> false;  // DC can approve without comment
            default                       -> false;
        };
    }
}
```

### Unknown / No WorkflowInstance Fallback

```java
// GovernanceStatusPayload — static factory for missing WF (pre-migration entities)
public static GovernanceStatusPayload unknown(WorkflowEntityType entityType, Long entityId) {
    log.warn("[GovernanceStatusResolver] No WorkflowInstance for {}:{} — backfill required", entityType, entityId);
    return GovernanceStatusPayload.builder()
        .status("UNKNOWN")
        .subStatus(null)
        .label("Status unavailable — data migration pending")
        .severity("WARNING")
        .actionableBy(null)
        .requiresComment(false)
        .pendingSince(null)
        .deadline(null)
        .workflowInstanceId(null)
        .build();
}
```

### Mapper Integration

In `TrustMapper.java` (MapStruct):
```java
@Mapping(target = "governanceStatus",
         expression = "java(governanceStatusResolver.resolve(WorkflowEntityType.TRUST, trust.getId()))")
TrustResponse toResponse(Trust trust);
```

**Or** (preferred for services that already load WorkflowInstance):
```java
// In GovernanceWorkflowServiceImpl or TrustServiceImpl:
GovernanceStatusPayload gsp = resolver.resolveFromInstance(workflowInstance);
return TrustResponse.builder()
    // ... domain fields ...
    .governanceStatus(gsp)
    .build();
```

### Unit Tests

```java
// GovernanceStatusResolverTest.java

@Test
void should_returnApprovedPayload_when_workflowInstanceIsApproved() {
    WorkflowInstance wi = buildInstance(WorkflowStatus.APPROVED);
    GovernanceStatusPayload result = resolver.resolveFromInstance(wi);
    assertThat(result.getStatus()).isEqualTo("APPROVED");
    assertThat(result.getSeverity()).isEqualTo("SUCCESS");
    assertThat(result.getActionableBy()).isNull();
}

@Test
void should_returnClarificationWarning_when_statusIsClarificationRequested() {
    WorkflowInstance wi = buildInstance(WorkflowStatus.CLARIFICATION_REQUESTED);
    GovernanceStatusPayload result = resolver.resolveFromInstance(wi);
    assertThat(result.getStatus()).isEqualTo("CLARIFICATION_REQUESTED");
    assertThat(result.getSeverity()).isEqualTo("WARNING");
    assertThat(result.getActionableBy()).isEqualTo("TA");
}

@Test
void should_returnUnknownPayload_when_noWorkflowInstanceExists() {
    when(instanceRepo.findByEntityTypeAndEntityId(any(), any())).thenReturn(Optional.empty());
    GovernanceStatusPayload result = resolver.resolve(WorkflowEntityType.TRUST, 99L);
    assertThat(result.getStatus()).isEqualTo("UNKNOWN");
    assertThat(result.getSeverity()).isEqualTo("WARNING");
}
```

---

## Section 5 — Frontend Status Refactor

### File-by-File Audit

#### `TaTrustPage.tsx` — `trustReviewStatus()` function [lines 54–68]
**VERDICT**: **FRONTEND STATUS SYNTHESIS — REMOVE**

```typescript
// CURRENT — lines 54–68: reads 5 fields, synthesizes from Gen1/Gen2/Gen3 simultaneously
function trustReviewStatus(trust: {
  submissionStatus?: string | null
  dcDecisionStatus?: string | null
  isVerifiedByDc?: boolean
  dcFlagReason?: string | null
  sendBackReason?: string | null
} | null) {
  if (!trust) return 'DRAFT'
  const submission = String(trust.submissionStatus ?? '').toUpperCase()
  if (submission === 'APPROVED') return 'APPROVED'
  if (submission === 'SUBMITTED') return 'UNDER_REVIEW'         // ← wrong label
  if (submission === 'SENT_BACK') return 'CLARIFICATION_REQUIRED'
  if (submission === 'REJECTED') return 'REJECTED'
  if (trust.isVerifiedByDc) return 'APPROVED'
  if (trust.dcFlagReason || trust.sendBackReason || trust.dcDecisionStatus === 'REJECTED_BY_DC') {
    return 'CLARIFICATION_REQUIRED'
  }
  return 'DRAFT'
}
```

**TARGET — Phase 2**: Remove entirely. Replace all call sites with:
```typescript
// After Phase 2: trust.governanceStatus is populated by GovernanceStatusResolver
const reviewStatus = trust?.governanceStatus?.status ?? 'DRAFT'
const statusLabel = trust?.governanceStatus?.label ?? 'Draft'
const severity = trust?.governanceStatus?.severity ?? 'INFO'
```

**Existing call site** [line ~120]:
```typescript
// Current
const reviewStatus = useMemo(() => trustReviewStatus(trust), [trust])

// Phase 2 replacement
const reviewStatus = trust?.governanceStatus?.status ?? 'DRAFT'
const statusLabel = trust?.governanceStatus?.label ?? 'Draft'
```

#### `dcApi.ts` — `verifyTrust` optimistic update [lines ~205–218]
**VERDICT**: **FRONTEND STATUS SYNTHESIS — REPLACE**

```typescript
// CURRENT — optimistically writes non-canonical fields to DC cache
onQueryStarted: async ({ id: trustId, templeId }, { dispatch, queryFulfilled }) => {
  const patchResult = dispatch(
    dcApi.util.updateQueryData('getDcTempleProfile', templeId, (draft) => {
      if (draft?.data?.trust && draft.data.trust.id === trustId) {
        draft.data.trust.isVerifiedByDc = true           // ← Gen1 field, being retired
        draft.data.trust.dcFlagReason = null             // ← Gen1 field, being retired
        draft.data.trust.reviewStatus = 'APPROVED'       // ← NOT in TrustResponse type
      }
    })
  )
```

**PROBLEM**: `reviewStatus` does not exist in `TrustResponse.java`. The optimistic update writes to a field that the backend never sends. It is writing to the Immer draft using a non-existent key — this is silently a no-op in terms of display, but could cause TypeScript type errors if types are strict.

**TARGET — Phase 2**: Update optimistic writes to use `governanceStatus`:
```typescript
onQueryStarted: async ({ id: trustId, templeId }, { dispatch, queryFulfilled }) => {
  const patchResult = dispatch(
    dcApi.util.updateQueryData('getDcTempleProfile', templeId, (draft) => {
      if (draft?.data?.trust && draft.data.trust.id === trustId) {
        draft.data.trust.governanceStatus = {
          status: 'APPROVED',
          label: 'Approved',
          severity: 'SUCCESS',
          actionableBy: null,
        }
      }
    })
  )
```

#### `dcApi.ts` — `flagTrust` optimistic update [lines ~230–243]
**VERDICT**: **FRONTEND STATUS SYNTHESIS — REPLACE** (same issue as above)

```typescript
// CURRENT — writes non-canonical reviewStatus to cache
draft.data.trust.isVerifiedByDc = false
draft.data.trust.dcFlagReason = body.reason
draft.data.trust.reviewStatus = 'FLAGGED'       // ← non-canonical field
```

**TARGET**: Write to `draft.data.trust.governanceStatus` with `status: 'CLARIFICATION_REQUESTED'`.

#### `trustApi.ts` — Tag structure
**VERDICT**: **KEEP** — `Trust` and `BoardMember` tags are correct. The gap is cross-role invalidation (see Section 6), not the tags themselves.

#### `governanceApi.ts` — GovernanceDeclaration, GovernanceTrust tags
**VERDICT**: **KEEP** — Correct, canonical tags. Only gap is insufficient cross-role propagation.

#### `StatusBadge` component
**VERDICT**: **KEEP** — Accepts `status: string` and renders per value. Once `GovernanceStatusPayload.status` replaces the synthesized string, this component works unchanged.

#### `declarationPermissions.ts`
**NOT VERIFIED IN CODE** — File not read during this analysis. Verify it does not perform local status synthesis from non-WorkflowInstance fields.

### Frontend Refactor Summary

| Location | Action | Risk |
|---|---|---|
| `TaTrustPage.tsx:trustReviewStatus()` | **REMOVE** | Medium — requires `governanceStatus` in API response first |
| `dcApi.ts:verifyTrust` optimistic update | **REPLACE** fields | Low — correctness improvement |
| `dcApi.ts:flagTrust` optimistic update | **REPLACE** fields | Low |
| Any `trust.submissionStatus` read | **REMOVE** | Medium — must migrate API consumers |
| Any `trust.dcDecisionStatus` read | **REMOVE** | Medium |
| `TrustTab.deriveModuleStatus()` | **REMOVE** | Medium — requires `governanceStatus` in DC temple profile response |
| `WorkflowGovernancePanel` | **KEEP** | Already canonical |

---

## Section 6 — Cache / Consistency Analysis

### RTK Query Cache Tag Map (verified from source)

| API | Tags Provided | Tags Invalidated By Mutations |
|---|---|---|
| `trustApi` | `Trust:{templeId}`, `BoardMember:{trustId}`, `TrustFinancial:{trustId}`, `BoardMeeting:{trustId}` | `approveTrust` → `GovernanceTrust:{trustId}` (wrong tag) |
| `governanceApi` | `GovernanceTrust:{trustId}`, `GovernanceDeclaration:{id}`, `PhysicalVerificationHistory` | Correct |
| `dcApi` | `DcTempleProfile:{id}`, `DcProfileStaging:{templeId}`, `DcDeclaration:{id}` | `verifyTrust` → `DcTempleProfile:{templeId}` |

### Active Stale State Windows

**Gap 1: DC flags/verifies trust via compliance path — TA sees stale state**

```
DC calls: flagTrust (dcApi) → invalidates DcTempleProfile:{templeId}
TA is viewing: TaTrustPage → subscribed to Trust:{templeId} tag (trustApi)
Result: TA's Trust:{templeId} cache is NOT invalidated.
TA sees: old submissionStatus = SUBMITTED (→ "Under Review") when DC has set SENT_BACK.
Stale window: until Trust tag expires (RTK default: no expiry) or until TA navigates away and back.
VERIFIED: trustApi provides Trust:{templeId}. dcApi.flagTrust only invalidates DcTempleProfile.
```

**Fix**: After DC `flagTrust` mutation completes, also invalidate the `Trust` tag using cross-API tag invalidation via `dispatch(trustApi.util.invalidateTags([...]))`:
```typescript
// In dcApi.ts flagTrust mutation, after successful queryFulfilled:
onQueryStarted: async ({ id, templeId, body }, { dispatch, queryFulfilled }) => {
  try {
    await queryFulfilled
    // Cross-API invalidation: force TA-side trust cache to refresh
    dispatch(trustApi.util.invalidateTags([{ type: 'Trust', id: templeId }]))
  } catch {}
}
```

**Gap 2: TA submits trust via governanceApi — DC sees stale dashboard**

```
TA calls: submitTrust (governanceApi) → invalidates GovernanceTrust:{trustId}
DC dashboard: subscribed to DcDashboard tag (dcApi, refetchOnMountOrArgChange: 300)
DC temple search: subscribed to DcTempleSearch tag
Result: DC dashboard does NOT immediately show the new pending item.
Stale window: up to 5 minutes (300s refetchOnMountOrArgChange setting).
```

**Fix**: `governanceApi.submitTrust` should also invalidate `DcDashboard` and `DcTempleSearch`:
```typescript
submitTrust: builder.mutation<ApiResponse<void>, number>({
  query: (trustId) => ({ url: `/governance/trusts/${trustId}/submit`, method: 'POST' }),
  invalidatesTags: (_r, _e, trustId) => [
    { type: 'GovernanceTrust', id: trustId },
    'DcDashboard',         // ← ADD: DC sees new pending item immediately
    'DcTempleSearch',      // ← ADD: DC search counts update
  ],
}),
```

**Gap 3: DC approves declaration via governanceApi — TA checklist stale**

```
DC calls: approveDeclaration (governanceApi) → invalidates GovernanceDeclaration:{id}
TA dashboard: subscribed to TaDashboard tag (taApi)
Result: TA's checklist still shows declaration as SUBMITTED, not APPROVED.
Stale window: until TA dashboard component remounts or TTL.
```

**Gap 4: Concurrent user viewing same entity — real-time state mismatch**

```
DC is reviewing declaration. TA responds to clarification simultaneously.
DC's UI shows CLARIFICATION_REQUESTED.
After TA response, DC's DcDeclaration:{id} cache is NOT invalidated (TA action happens on taApi/declarationApi).
DC sees stale state until manual refresh.
Fix: governanceApi.submitDeclaration / respondClarification should invalidate DcDeclaration:{id}.
```

**Gap 5: Optimistic updates write stale fields that get replaced by server refetch**

After `dcApi.verifyTrust` completes and invalidates `DcTempleProfile:{templeId}`, RTK Query refetches from the server. If the server still returns `submissionStatus = APPROVED` (Phase A dual-write), the refetched data replaces the optimistic update. Net effect: optimistic update is immediately overwritten. This is currently harmless because both agree. But once Phase B removes `submissionStatus` from the response, the optimistic update fields won't exist in the refetched data — they'd disappear, causing visual flicker.

**Fix**: Tie optimistic update fields to `governanceStatus` (from Phase 2 frontend refactor) to ensure the optimistic state matches the server's canonical response shape.

### Polling / TTL Audit

| Location | TTL / Polling | Issue |
|---|---|---|
| `useDcDashboard` | `refetchOnMountOrArgChange: 300` (5 min) | Max 5 min stale for pending count |
| `useGetTrustByTempleQuery` | Default RTK (no TTL, subscribe) | Stale until invalidated or remount |
| `WorkflowGovernancePanel` | NOT VERIFIED — likely polls or subscribes to `workflowInstanceId` | VERIFY |
| No SSE or WebSocket | — | Real-time updates not possible without polling |

**Recommended addition** for real-time governance feel without SSE complexity:
```typescript
// In WorkflowGovernancePanel — add polling when waiting for counter-party action:
const { data } = useGetWorkflowStateQuery(workflowInstanceId, {
  pollingInterval: instance.isPendingCounterPartyAction ? 30_000 : 0,
  // Poll every 30s when waiting for other party's action
})
```

---

## Section 7 — Transaction / Concurrency Analysis

### Transaction Boundary (verified from WorkflowEngineImpl and GovernanceWorkflowServiceImpl)

```
GovernanceWorkflowServiceImpl.approveTrust()
  @Transactional (isolation = DEFAULT = READ_COMMITTED, propagation = REQUIRED)
  │
  ├─ workflowEngineAdaptor.adaptApprove()
  │    @Transactional (REQUIRED) ← participates in OUTER TX — same connection
  │    │
  │    └─ workflowEngine.execute()
  │         @Transactional(isolation = READ_COMMITTED) ← STILL participates in outer TX
  │         │                                            (REQUIRED = join if exists)
  │         ├─ instanceRepo.save()     ← same TX
  │         ├─ transitionRepo.save()   ← same TX
  │         ├─ writeToOutbox()         ← same TX
  │         │    └─ catch (Exception e) { log.error(...) }  ← SILENT FAILURE — outbox not saved
  │         │                                                   but TX still commits ← RISK
  │         └─ eventPublisher.publishEvent(domainEvent) ← synchronous, same TX
  │
  ├─ trust.setSubmissionStatus(APPROVED)
  │    trustRepository.save() ← same TX
  │
  └─ assertEntityStatusConsistency() ← same TX — throws IllegalStateException on mismatch
       └─ workflowEngineAdaptor.findState() ← same TX (reads via Hibernate L1 cache — sees pending save)
```

**VERIFIED**: All operations share one transaction boundary. Both `workflowEngine.execute()` and `trustRepository.save()` participate in the caller's `@Transactional`. On rollback, all writes roll back atomically. Partial commit is not possible within this path.

### Outbox Silent Failure — VERIFIED RISK

```java
// WorkflowEngineImpl.java writeToOutbox()
private void writeToOutbox(GovernanceDomainEvent event) {
    try {
        // ... build and save outbox row ...
        outboxRepo.save(outbox);
    } catch (Exception e) {
        log.error("[WorkflowEngine] Failed to write outbox event", e);
        // Do NOT rethrow — outbox failure must not roll back the workflow transition
    }
}
```

**Impact**: WorkflowInstance.status transitions to APPROVED + WorkflowTransition is written, but the notification outbox row is never inserted. The DC approval succeeds, the TA gets no notification. The state is correct; the notification is lost silently.

**Mitigation** (currently absent): No dead-letter queue. No retry for the missed outbox write. No monitoring alert on outbox write failure. 

**Recommended fix** (non-blocking): Add a `@Scheduled` reconciliation job that compares `workflow_transitions.performed_at` with `notification_outbox.created_at_instant` for the same `workflow_instance_id` — if a transition exists without a corresponding outbox row (within 1-minute window), create the outbox row retroactively.

### Idempotency Key Gap

**VERIFIED**: `WorkflowEngineAdaptor.effectiveIdempotencyKey()`:
```java
private String effectiveIdempotencyKey(String clientProvidedKey) {
    return StringUtils.hasText(clientProvidedKey)
        ? clientProvidedKey
        : UUID.randomUUID().toString();  // ← NEW UUID on every call if client doesn't provide one
}
```

If the client provides no `Idempotency-Key` header, every call gets a fresh UUID. A network retry from the client (e.g., RTK Query auto-retry on 503) generates a different UUID on the next call — the idempotency record from the first call is not found, and the operation executes again. **The WorkflowEngine will throw** because the transition rule won't match (e.g., APPROVED → APPROVE has no rule), so the double-execute produces an error rather than a double-approval. This is correct behavior but produces a confusing 500 response to the retry instead of a 200.

**Declaration and Trust canonical paths** pass `idempotencyKey` parameter through:
- `approveDeclaration(id, request, claims, idempotencyKey)` — if client provides the header, idempotent ✅
- `rejectDeclaration(id, request, claims, idempotencyKey)` — same ✅
- `submitTrust()`, `approveTrust()`, `sendBackTrust()`, `rejectTrust()` — NO idempotency key parameter — always generates new UUID on each call — PARTIAL GAP

**Trust submit/approve/sendBack/reject paths** are not idempotent at the HTTP level even though the WorkflowEngine would naturally reject a duplicate transition.

### Concurrent Modification (Optimistic Lock)

```
Thread A (DC approves Trust 42):
  - Load WorkflowInstance (lockVersion=5)
  - execute(): instanceRepo.save() → lockVersion bumped to 6
  - trustRepository.save() → Trust.lockVersion bumped

Thread B (concurrent DC approval of same Trust 42):
  - Load WorkflowInstance (lockVersion=5) — sees same version as Thread A loaded
  - execute(): instanceRepo.save() → JPA @Version check: expected=5, actual=6 (Thread A committed)
  - → OptimisticLockException thrown
  - → WorkflowException propagated
  - → 409 Conflict returned to client ✅
```

**VERIFIED**: The `@Version` on `WorkflowInstance` provides correct optimistic locking. Concurrent approval attempts produce a 409, not a silent double-approval. This is correct.

**GAP**: `Trust.lockVersion` is a separate `@Version` column on the entity. When `trustRepository.save()` runs in the same TX as `instanceRepo.save()`, if a concurrent request loaded a stale `Trust` (before Thread A's TX committed), the Trust entity save will also throw `OptimisticLockException`. Both locks must pass for the TX to commit. This is stricter than necessary but safe.

### REQUIRES_NEW Usage

**NOT VERIFIED IN CODE**: Whether any `@Scheduled` jobs (FLAG_OVERDUE scheduler) use `REQUIRES_NEW`. If the FLAG_OVERDUE job runs inside an existing transaction context (unlikely for `@Scheduled`), it would need `REQUIRES_NEW` to ensure the outbox write commits independently of any outer TX.

### Event Publishing — AFTER_COMMIT vs Synchronous

**VERIFIED**: `eventPublisher.publishEvent(domainEvent)` is called **synchronously within the TX** [WorkflowEngineImpl.java:~305]. If the listener is annotated `@TransactionalEventListener(phase = AFTER_COMMIT)`, it fires after the outer TX commits. If the listener is a plain `@EventListener`, it fires synchronously before commit.

**Impact**: If a listener queries the DB within the same TX, it sees the WorkflowInstance update (same TX = Hibernate L1 cache flush). If the listener uses a new connection (e.g., via `REQUIRES_NEW`), it reads the pre-commit state and sees the old status. The behavior depends entirely on which `@EventListener` annotations are applied to the handler — NOT VERIFIED IN CODE.

---

## Section 8 — Migration Plan (Production Safe)

### Phase 0 — Remove Employee Governance Violation

**Prerequisite**: None. Independent of all other phases.  
**Risk**: Low — columns exist but DTO excludes them.  
**Rollback**: Re-add deleted code; revert migration.

#### 0.1 — Remove DC approval endpoints from Employee
```
File: backend/src/main/java/com/templeregistry/controller/dc/DcEmployeeController.java
Action: Remove @PostMapping("/{id}/approve") and @PostMapping("/{id}/reject") endpoints.
        Remove @GetMapping("/pending") if it exists.

File: backend/src/main/java/com/templeregistry/service/employee/EmployeeService.java
Action: Remove approveEmployee(), rejectEmployee(), submitForReview(),
        withdrawSubmission(), listPendingReviews() from interface.

File: backend/src/main/java/com/templeregistry/service/impl/employee/EmployeeServiceImpl.java
Action: Remove all methods listed above.
        Remove ApproveEmployeeRequest import.
        Remove the "Auto-reset verifiedByDc on TA edit" block from update() method.
```

#### 0.2 — Remove Employee submission workflow
```
File: EmployeeServiceImpl.java
Action: Remove submitForReview(), withdrawSubmission() methods.
        Remove notificationService.notify() call for employee submission.
        Remove submitted_at, submitted_by field writes from remaining methods.

File: Employee.java
Action: Remove verifiedByDc, verifiedByDcAt, verifiedByDcUserId, dcFlagReason fields.
        Remove submittedAt, submittedBy, reviewedAt, reviewedBy, reviewRemarks fields.
        Remove @Transient submissionStatus field.
        Keep: status (EmployeeStatus), all domain data fields.

File: dto/request/dc/ApproveEmployeeRequest.java
Action: Delete file.

File: dto/request/dc/RejectEmployeeRequest.java (if exists)
Action: Delete file.
```

#### 0.3 — Flyway V78 (Employee governance columns)
See schema change in Section 2. Deploy AFTER code is removed.

**Test additions** (Section 9 references these):
- Confirm `DcEmployeeController` no longer has `/approve` or `/reject` endpoints (HTTP 404)
- Confirm `EmployeeResponse` does not expose any governance fields (test already exists in `StaffContractorNoApprovalTest.java`)

---

### Phase 1 — GovernanceStatusResolver + Fix OVERDUE Propagation

**Prerequisite**: Phase 0 complete.  
**Risk**: Low — additive only.  
**Rollback**: Remove new service; remove `governanceStatus` from DTOs.

#### 1.1 — Implement GovernanceStatusResolver
See Section 4 design. Files:
```
NEW: service/governance/GovernanceStatusResolver.java (interface)
NEW: service/governance/impl/GovernanceStatusResolverImpl.java
NEW: dto/response/governance/GovernanceStatusPayload.java (record)
MOD: dto/response/trust/TrustResponse.java — add governanceStatus field (@Deprecated old fields)
MOD: dto/response/declaration/DeclarationResponse.java — add governanceStatus field
MOD: dto/response/temple/TempleProfileStagingResponse.java — add governanceStatus field
MOD: service/impl/governance/GovernanceWorkflowServiceImpl.java — inject GovernanceStatusResolver,
     populate governanceStatus when building responses
```

#### 1.2 — Fix OVERDUE state propagation
```
File: Find the @Scheduled job or event listener that calls workflowEngine.executeSystem(FLAG_OVERDUE)
      (file path NOT VERIFIED — search for FLAG_OVERDUE or OVERDUE in @Scheduled classes)

Action: After executeSystem(FLAG_OVERDUE, instanceId):
  if entityType == DECLARATION:
    declaration.setStatus(DeclarationStatus.OVERDUE)
    declaration.setOverdue(true)
    declaration.setOverdueFlaggedAt(LocalDateTime.now())
    declarationRepository.save(declaration)
  if entityType == TRUST:
    trust.setSubmissionStatus(SubmissionStatus.SUBMITTED)  // stays SUBMITTED — no OVERDUE in SubmissionStatus
    // trust.isOverdue flag — add if needed, or rely on WorkflowInstance.status = OVERDUE
    // NOTE: Trust has no isOverdue boolean column. Consider adding or relying on WF status only.
    trustRepository.save(trust)
```

**Add index for V79** (Section 2 migration).

---

### Phase 2 — Frontend Canonical Status

**Prerequisite**: Phase 1 complete and deployed. `governanceStatus` is present in all Trust/Declaration/TempleProfile API responses.  
**Risk**: Medium — UI changes.  
**Rollback**: Revert frontend PR; backend `governanceStatus` field is additive.

#### 2.1 — Remove `trustReviewStatus()` from TaTrustPage
```
File: frontend/src/features/trust/pages/TaTrustPage/TaTrustPage.tsx
Action: Delete trustReviewStatus() function [lines 54–68].
        Replace reviewStatus usage with trust?.governanceStatus?.status ?? 'DRAFT'.
        Replace status label rendering with trust?.governanceStatus?.label.
```

#### 2.2 — Fix dcApi optimistic updates
```
File: frontend/src/features/dc/dcApi.ts
Action: verifyTrust optimistic update — write governanceStatus.status = 'APPROVED'
        flagTrust optimistic update — write governanceStatus.status = 'CLARIFICATION_REQUESTED'
        Remove writes to isVerifiedByDc, dcFlagReason, reviewStatus (non-canonical fields)
```

#### 2.3 — Fix cross-role cache invalidation gaps
```
File: frontend/src/features/governance/governanceApi.ts
Action: submitTrust → also invalidate 'DcDashboard', 'DcTempleSearch'
        approveTrust → also invalidate 'Trust' tag (for TA side)
        sendBackTrust → also invalidate 'Trust' tag
        rejectTrust → also invalidate 'Trust' tag
        approveDeclaration → also invalidate TaDashboard if tag exists
        
File: frontend/src/features/dc/dcApi.ts
Action: verifyTrust / flagTrust → after queryFulfilled, dispatch trustApi.util.invalidateTags([{ type: 'Trust', id: templeId }])
```

#### 2.4 — Remove TrustTab.deriveModuleStatus()
```
File: frontend/src/features/dc/pages/DcTempleProfilePage/tabs/TrustTab.tsx
Action: Replace deriveModuleStatus(trust.isVerifiedByDc, trust.dcFlagReason)
        with trust?.governanceStatus?.status
        Remove deriveModuleStatus function.
```

---

### Phase 3 — Kill Parallel Write Paths

**Prerequisite**: Phase 2 verified in staging.  
**Risk**: Low-medium — removes one of two paths for Trust.  
**Rollback**: Re-enable DcComplianceService trust methods (no schema change).

#### 3.1 — Consolidate Trust write paths

**Current state**: Two paths for Trust DC actions:
- PATH A: `GovernanceWorkflowController` → `GovernanceWorkflowServiceImpl` (approveTrust, sendBackTrust, rejectTrust)
- PATH B: `DcComplianceController` → `DcComplianceServiceImpl` (verifyTrust, flagTrust)

**Target**: Retire PATH B for Trust. Route all Trust DC actions through PATH A.

```
File: DcComplianceServiceImpl.java
Action: Remove verifyTrust() and flagTrust() methods.
        Keep: verifyTemple(), flagTemple(), unflagTemple() (Temple verification is NOT in GovernanceWorkflowService)

File: DcComplianceService.java (interface)
Action: Remove verifyTrust() and flagTrust() from interface.

File: DcComplianceController.java (or DcTempleController.java — find the compliance endpoint)
Action: Remove /dc/compliance/trusts/{id}/verify and /dc/compliance/trusts/{id}/flag endpoints.

File: frontend/src/features/dc/dcApi.ts
Action: Remove verifyTrust and flagTrust mutations from dcApi.
        All trust DC actions now go through governanceApi.approveTrust / sendBackTrust.
```

**IMPORTANT**: Before removing, verify that `GovernanceWorkflowServiceImpl.approveTrust()` includes `trust.setDcDecisionStatus(DcDecisionStatus.APPROVED_BY_DC)`. Currently it does NOT set dcDecisionStatus [verified at line ~131]. Add this before retiring PATH B to maintain field parity during Phase A:
```java
// In GovernanceWorkflowServiceImpl.approveTrust() — add before Phase B column removal:
trust.setDcDecisionStatus(com.templeregistry.entity.governance.DcDecisionStatus.APPROVED_BY_DC);
// In sendBackTrust() — add:
trust.setDcDecisionStatus(com.templeregistry.entity.governance.DcDecisionStatus.REJECTED_BY_DC);
```

---

### Phase 4 — Retire Legacy Columns

**Prerequisite**: Phase 3 complete. Frontend no longer reads `submissionStatus`, `dcDecisionStatus`, `status` from Trust/Declaration/TempleProfileStaging responses. Verified via API consumer audit.  
**Risk**: HIGH — irreversible schema changes. Coordinate with 2-week production monitoring window.  
**Rollback**: DB backup required before each migration. Cannot be undone without restore.

**Release sequencing**:
1. Deploy backend with `@JsonIgnore` on deprecated fields (soft deprecation — omit from JSON but keep in DB)
2. Monitor for 1 week — verify no client is reading deprecated fields (check API logs / `null` deserialization errors)
3. Run Flyway V80 (board_members.dc_flag_reason) — lowest risk
4. Run Flyway V81 (trusts: submission_status, dc_decision_status, dc_flag_reason) — verify trust governance intact
5. Run Flyway V82 (asset_declarations: status, is_overdue) — verify declaration governance intact
6. Run Flyway V83 (temple_profile_staging: status) — verify temple profile governance intact

**Feature flag** (recommended for Phase 4):
```java
// SystemConfig entry: PHASE_B_LEGACY_COLUMNS_REMOVED = false/true
// GovernanceStatusResolverImpl checks this flag.
// When false: fall back to entity status fields if workflowInstanceId is null (migration safety net)
// When true: throw on missing WorkflowInstance (all entities should be migrated)
```

---

## Section 9 — Final Recommendation

### Decision: **Option C — Hybrid Resolver Migration → WorkflowInstance Authoritative End-State**

This is not a choice. This is the architecture the codebase has already committed to.

**Evidence**:
1. `WorkflowInstance.java` Javadoc explicitly declares itself the "single source of truth" and names the 4 legacy fields it replaces.
2. V52 migration created the canonical engine tables with that stated goal.
3. V56 backfilled `workflow_instances` for all existing entities.
4. V58 has Phase B column-drop statements ready but commented out pending "frontend cutover."
5. `assertEntityStatusConsistency()` exists and runs in every mutation — this is a migration safety net, not intended as a permanent pattern.
6. `WorkflowEngineAdaptor.java` Javadoc explicitly defines Phase A and Phase B.

The codebase designed and implemented Option C. The task is to complete Phase B correctly, not to redesign.

### Why Option A (WorkflowInstance directly, immediate) Fails

Option A means removing legacy dual-writes immediately, before frontend is migrated. This would:
- Break `TaTrustPage.trustReviewStatus()` which reads `submissionStatus` — it would return `'DRAFT'` for all trusts
- Break `TrustTab.deriveModuleStatus()` which reads `isVerifiedByDc`
- Break `dcApi.ts` optimistic updates which write to `isVerifiedByDc`
- Break any direct reads of `declaration.status` in the frontend outside `WorkflowGovernancePanel`

**Option A would break production immediately.**

### Why Option B (Domain status authoritative) Fails

Option B means making `AssetDeclaration.status`, `Trust.submissionStatus` authoritative and removing WorkflowInstance from the query path. This would:
- Discard the audit trail in `workflow_transitions` (immutable, legally important)
- Discard idempotency records (preventing duplicate approvals)
- Discard SLA tracking (`deadlineAt`, `submittedAt` on WorkflowInstance)
- Discard policy evaluation engine (SiteVisitBlocksApprovalPolicy etc.)
- Discard the `subStatus` mechanism
- Require rebuilding all 13 WorkflowStatus states as per-entity enums
- Require rebuilding role-based transition guards

**Option B would require rewriting the governance engine from scratch.**

### Why Option C Is Correct For This Codebase

| Factor | Why Option C Wins |
|---|---|
| **Migration safety** | Phase A dual-writes are protected by `assertEntityStatusConsistency()` — divergence throws immediately |
| **Zero regression** | `GovernanceStatusPayload` is additive to DTOs — no existing consumer breaks |
| **Frontend migration** | Frontend can migrate screen by screen, not all-at-once |
| **Audit trail** | `workflow_transitions` is untouched — legally complete |
| **Idempotency** | Already built into WorkflowEngine |
| **Rollback** | Each phase is independently reversible |
| **Code evidence** | The architecture is already designed and 70% implemented |

### Critical Gaps Not in Previous Blueprint

The previous `STATUS_CONSISTENCY_BLUEPRINT.md` identified 6 bugs. This analysis identified two additional categories not previously documented:

1. **Employee governance violation** — An entire DC approval state machine exists for Employee (controller, service, entity columns, DB indexes). This is a hard constraint violation. Remove entirely. The DTO is correct (excludes governance fields), so this is a service/entity/migration fix only.

2. **OVERDUE state propagation** — `FLAG_OVERDUE` transitions `WorkflowInstance.status → OVERDUE` but never updates the domain entity's `status` or `is_overdue` fields. After a declaration goes overdue, the TA sees "Submitted" not "Overdue." Fix: add domain entity update in the FLAG_OVERDUE handler/scheduler.

3. **Idempotency gap on Trust submit/approve/sendBack/reject** — Unlike Declaration operations (which pass `idempotencyKey` through to WorkflowEngine), Trust operations always generate new UUIDs. Client retries are not idempotent.

4. **Cross-role cache invalidation** — DC actions on `dcApi` (compliance path) do not invalidate TA-side `Trust` tags. TA can see stale status for minutes after DC action.

5. **Optimistic update field mismatch** — `dcApi.verifyTrust` optimistic update writes to `draft.data.trust.reviewStatus` — a field that does not exist in `TrustResponse`. The update is silently a no-op. Replace with `governanceStatus` writes.

### Prioritized Execution Order

| Phase | Description | Blocking Bugs Fixed | DB Breaking | API Breaking |
|---|---|---|---|---|
| **Phase 0** | Remove Employee DC governance | 1 constraint violation | Yes (V78) — reversible | Yes (remove approve/reject endpoints) |
| **Phase 1** | GovernanceStatusResolver + OVERDUE fix | OVERDUE drift, no trustReviewStatus() errors | No | No (additive) |
| **Phase 2** | Frontend canonical status + cache fixes | Stale TA/DC views after cross-role actions | No | No |
| **Phase 3** | Kill DcCompliance trust parallel write | Eliminates dual entry point for Trust | No | Yes (remove compliance trust endpoints) |
| **Phase 4** | Retire legacy columns | Permanently eliminates drift possibility | Yes (irreversible) | Yes (remove deprecated DTO fields) |

### Minimum Viable Production Safety

If only one thing can ship before the next production incident, it is:

> **Phase 0.1 + Phase 1.2**: Remove Employee DC approval endpoints (already broken by design intent), and fix OVERDUE state propagation to domain entities. Both are surgical changes with zero API contract impact and no frontend changes required.

The `assertEntityStatusConsistency()` guard in place means that the existing Declaration and Trust dual-write paths are already safe from silent divergence in the canonical paths — they throw loudly if they diverge. The remaining risk is the compliance PATH B for Trust (which bypasses `assertEntityStatusConsistency()`) — addressed completely by Phase 3.
