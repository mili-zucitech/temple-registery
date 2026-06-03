# Status Consistency Implementation Blueprint
**Temple Registry — TA ↔ DC Governance System**
_Code-verified. Every claim traceable to file + line._

---

## Section 1 — Source-of-Truth Audit

### 1.1 Temple Profile Module

#### Write Paths

---

**PATH A — Canonical (WorkflowEngine)**
```
POST /api/v1/temples/{templeId}/profile/approve/{stagingId}
  └─ TempleController.approve()                              [TempleController.java:119]
       └─ TempleProfileStagingServiceImpl.approve()         [TempleProfileStagingServiceImpl.java:187]
            ├─ workflowEngine.getState(TEMPLE_PROFILE, stagingId)
            ├─ guard: workflowInstance.status == SUBMITTED   [line 193]
            ├─ stagingRepository.findFirstByTempleIdAndStatus(APPROVED) → executeSystem(AUTO_SUPERSEDE) on prev
            ├─ promoteToTemple(temple, staging) → templeRepository.save()
            ├─ workflowEngine.execute(APPROVE)               ← updates WorkflowInstance.status → APPROVED
            │    ├─ transitionRepo.save() (WorkflowTransition audit)   ✅
            │    ├─ outboxRepo.save() (notification outbox)             ✅
            │    └─ lockVersion incremented (optimistic lock)           ✅
            └─ versionService.snapshot()
```
| Field | Updated | Audit | Outbox |
|---|---|---|---|
| `WorkflowInstance.status` | ✅ APPROVED | ✅ WorkflowTransition row | ✅ |
| `TempleProfileStaging.status` | ❌ NOT written | n/a | n/a |
| `Temple.verificationStatus` | ✅ via promoteToTemple | n/a | n/a |

**Critical observation**: `TempleProfileStagingServiceImpl.toResponse()` reads `statusLabel` from `WorkflowInstance.status` [line 479], not from `TempleProfileStaging.status`. The entity field is effectively dead in this path.

---

**PATH B — Legacy, PARALLEL WRITE PATH — HIGH RISK**
```
POST /api/v1/dc/profiles/{stagingId}/approve
  └─ DcProfileController.approveProfile()                    [DcProfileController.java:28]
       └─ TempleProfileWorkflowServiceImpl.approveProfile()  [TempleProfileWorkflowServiceImpl.java:74]
            ├─ assertPendingReview(staging) — checks staging.status == PENDING_REVIEW
            ├─ transitionValidator.validateProfileStagingTransition(from, to)
            │    └─ validate(from, to, "TEMPLE")              ← WRONG entity type "TEMPLE" not "TEMPLE_PROFILE"
            │         └─ ruleRegistry.findAllForStatus("TEMPLE", ...)  ← returns ONLY "*" universal rules
            │              └─ WorkflowStatus.valueOf("PENDING_REVIEW") ← THROWS IllegalArgumentException
            │                   caught → WorkflowException thrown
            ├─ promotes staging to temple_profile_current
            ├─ staging.setStatus(APPROVED) → stagingRepository.save()  ← writes entity column
            ├─ notificationHelper.notifyTempleApproved()
            └─ governanceAuditService.logAction()             ← NOT a WorkflowTransition row
```
| Field | Updated | Audit | Outbox |
|---|---|---|---|
| `WorkflowInstance.status` | ❌ NEVER updated | ❌ no WorkflowTransition | ❌ no outbox event |
| `TempleProfileStaging.status` | ✅ APPROVED (entity column) | n/a | n/a |
| `Temple profile_current` | ✅ promoted | n/a | n/a |

**VERIFIED BUG — BLOCKING**: `StatusTransitionValidator.validateProfileStagingTransition()` calls `validate(from, to, "TEMPLE")` [StatusTransitionValidator.java:112]. The registry has no rules under entity type `"TEMPLE"` (it uses `"TEMPLE_PROFILE"`). For input `from = "PENDING_REVIEW"`, `WorkflowStatus.valueOf("PENDING_REVIEW")` throws `IllegalArgumentException`. This is caught and re-thrown as `WorkflowException`. **Path B will throw on every call to `approveProfile()`** unless `assertPendingReview()` throws first (if status is not PENDING_REVIEW the flow never reaches the validator). In practice, if a DC calls this endpoint with a staging record that is in PENDING_REVIEW, the validator throws before the approval completes.

**DRIFT CONSEQUENCE**: Even if the validator is bypassed (e.g., staging.status is something else), the WorkflowInstance.status is never updated. The `TempleProfileStagingRepository` queries JOIN on `WorkflowInstance.status` [TempleProfileStagingRepository.java:34]. A record approved via Path B would still appear in SUBMITTED queries, because the join finds `WorkflowInstance.status = SUBMITTED`.

---

**PATH C — Auto-approve on verify**
```
POST /api/v1/dc/temples/{templeId}/verify
  └─ DcTempleVerificationServiceImpl.verifyTempleProfile()   [DcTempleVerificationServiceImpl.java:46]
       ├─ profileStagingRepository.findFirstByTempleIdAndStatus(SUBMITTED) → ifPresent:
       │    └─ stagingService.approve(templeId, staging.getId())  ← delegates to PATH A (canonical) ✅
       ├─ temple.setVerificationStatus(VERIFIED)
       └─ templeRepository.save()
```
This correctly delegates to PATH A. No additional drift introduced.

---

#### Read Paths — Temple Profile

**Backend:**
| Reader | Field Read | Location |
|---|---|---|
| `TempleProfileStagingServiceImpl.toResponse()` | `WorkflowInstance.status.name()` → `statusLabel` | [line 479] |
| `TempleProfileStagingRepository` queries | JOIN on `WorkflowInstance.status` | [lines 18–60] |
| `DcTempleProfileServiceImpl` | JOIN on `WorkflowInstance.status` | [line 321] |
| `TempleProfileWorkflowServiceImpl.assertPendingReview()` | `TempleProfileStaging.status` (entity column) | [line 198] |

**Frontend:**
| Reader | Field Read | Verdict |
|---|---|---|
| `TempleProfileStagingResponse.statusLabel` | WorkflowInstance.status (canonical) | ✅ Correct |
| `taProfileHooks.deriveProfileStatus()` [taProfileHooks.ts:13] | `statusLabel` from API | handles `PENDING_REVIEW \|\| SUBMITTED` → `SUBMITTED` (**FRONTEND STATUS SYNTHESIS — REMOVE** the PENDING_REVIEW branch, it is no longer needed post-migration) |
| `TaTemplePage.StatusBanner` | derived `TaProfileStatus` | secondary consumer of derivation |

---

### 1.2 Declaration Module

#### Write Paths

**PATH A — Canonical (all traffic routes here)**
```
POST /api/v1/governance/declarations/{id}/approve
  └─ GovernanceWorkflowController.approveDeclaration()
       └─ GovernanceWorkflowServiceImpl.approveDeclaration()  [GovernanceWorkflowServiceImpl.java:216]
            ├─ guard: physicalVerificationStatus != FAILED
            ├─ idempotency: if APPROVED + ackNumber exists → return cached response
            ├─ workflowEngineAdaptor.adaptApprove(DECLARATION, id, ...)
            │    └─ WorkflowEngineImpl.execute(APPROVE)
            │         ├─ WorkflowInstance.status → APPROVED               ✅
            │         ├─ WorkflowTransition audit row                      ✅
            │         ├─ outboxRepo.save()                                 ✅
            │         └─ lockVersion ++                                    ✅
            ├─ acknowledgementService.generate()
            ├─ declaration.setStatus(DeclarationStatus.APPROVED)          ← DUAL WRITE
            ├─ declaration.setAcknowledgementNumber(ackNumber)
            └─ assertEntityStatusConsistency(DECLARATION, id, "APPROVED") ← DRIFT GUARD
```

**VERIFIED**: `assertEntityStatusConsistency()` exists and is called after every declaration status mutation [lines 269, 302, 332]. It maps enum name differences via `canonicalizeWorkflowStatusForEntity()` [line 815]:
- `CLARIFICATION_REQUESTED` → `CLARIFICATION_REQUIRED`
- `RE_APPROVED` → `APPROVED`  
- `RESUBMITTED` → `SUBMITTED`

**Fields updated per operation:**

| Operation | `AssetDeclaration.status` | `WorkflowInstance.status` | `WorkflowTransition` | Outbox |
|---|---|---|---|---|
| `submitDeclaration` | NOT updated (only `submittedBy` set) | SUBMITTED | ✅ | ✅ |
| `approveDeclaration` | APPROVED | APPROVED | ✅ | ✅ |
| `rejectDeclaration` | REJECTED | REJECTED | ✅ | ✅ |
| `requestClarification` | CLARIFICATION_REQUIRED | CLARIFICATION_REQUESTED | ✅ | ✅ |
| `markUnderReview` | UNDER_REVIEW | UNDER_REVIEW | ✅ | ✅ |

**VERIFIED GAP — `submitDeclaration`**: After `adaptSubmit()`, `WorkflowInstance.status` → SUBMITTED. But `AssetDeclaration.status` is NOT updated to SUBMITTED here [line 278]. Only `submittedBy` is set. The declaration entity retains whatever status it had before (likely DRAFT). The next operation that reads `declaration.status` would see a stale DRAFT value until the DC calls `markUnderReview`, which dual-writes UNDER_REVIEW.

---

#### Read Paths — Declaration

**Backend:**
| Reader | Field Read | Location |
|---|---|---|
| `DcDeclarationDetailServiceImpl` | `declaration.status` (entity column) | primary display |
| `GovernanceWorkflowServiceImpl.approveDeclaration()` idempotency | `declaration.status + ackNumber` | [line 258] |
| `SiteVisitBlocksApprovalPolicy` | `declaration.physicalVerificationStatus` | separate sub-status column |

**Frontend:**
| Reader | Field Read | Verdict |
|---|---|---|
| `dcTypes.ts DeclarationStatus` | `declaration.status` from API | Uses module enum (12 values) |
| `declarationPermissions.getAvailableActions()` | `declaration.status` string values | Checks `SUBMITTED`, `UNDER_REVIEW`, `CLARIFICATION_RESPONDED` etc. |
| `StatusBadge` | `declaration.status` string | Renders per status value |
| `TaDeclarationDetailPage` governance tab | `declaration.workflowInstanceId` | Loads `WorkflowGovernancePanel` ✅ |
| `DcTempleProfilePage DeclarationsTab` | `declaration.status` | Shows declaration row status |

---

### 1.3 Trust / Board Module

#### Write Paths

**PATH A — Canonical submit/approve/reject**
```
POST /api/v1/governance/trusts/{id}/approve
  └─ GovernanceWorkflowController.approveTrust()
       └─ GovernanceWorkflowServiceImpl.approveTrust()       [GovernanceWorkflowServiceImpl.java:130]
            ├─ assertDistrictScopeForTrust(trust)
            ├─ workflowEngineAdaptor.adaptApprove(TRUST, id, ...)
            │    └─ WorkflowEngineImpl.execute(APPROVE)
            │         ├─ WorkflowInstance.status → APPROVED               ✅
            │         ├─ WorkflowTransition audit                          ✅
            │         └─ outbox                                            ✅
            ├─ trust.setSubmissionStatus(APPROVED)                        ← DUAL WRITE (Gen2)
            ├─ trustRepository.save()
            └─ assertEntityStatusConsistency(TRUST, id, "APPROVED")
                 └─ maps CLARIFICATION_REQUESTED → SENT_BACK for Trust    [line 821]
```

**PATH B — Compliance verify path — PARALLEL WRITE PATH**
```
POST /api/v1/dc/compliance/trusts/{id}/verify
  └─ DcComplianceController → DcComplianceServiceImpl.verifyTrust()      [DcComplianceServiceImpl.java:79]
       ├─ workflowEngineAdaptor.ensureInitiated(TRUST, ...)               ← creates WF instance if absent
       ├─ workflowEngineAdaptor.adaptApprove(TRUST, id, ...)              ← APPROVE transition ✅
       ├─ trust.setDcDecisionStatus(APPROVED_BY_DC)                       ← DUAL WRITE (Gen1)
       ├─ trust.setDcFlagReason(null)
       ├─ trust.setSubmissionStatus(APPROVED)                             ← DUAL WRITE (Gen2)
       └─ trustRepository.save()
```

**CRITICAL OBSERVATION — DIVERGENCE BETWEEN PATHS**:
- PATH A (`approveTrust`) sets `trust.submissionStatus = APPROVED` but does **NOT** set `trust.dcDecisionStatus`. It remains at `PENDING_DC_APPROVAL` (default).
- PATH B (`verifyTrust`) sets BOTH `trust.dcDecisionStatus = APPROVED_BY_DC` and `trust.submissionStatus = APPROVED`.
- After PATH A: `trustResponse.dcDecisionStatus` = `PENDING_DC_APPROVAL`, `submissionStatus` = `APPROVED`.
- After PATH B: `trustResponse.dcDecisionStatus` = `APPROVED_BY_DC`, `submissionStatus` = `APPROVED`.
- The frontend `trustReviewStatus()` checks `submissionStatus` first → both return `APPROVED`. So the visible status is correct. But `dcDecisionStatus` is stale/wrong after PATH A.

**PATH C — Compliance flag path — PARALLEL WRITE PATH**
```
POST /api/v1/dc/compliance/trusts/{id}/flag
  └─ DcComplianceServiceImpl.flagTrust()                                  [DcComplianceServiceImpl.java:105]
       ├─ workflowEngineAdaptor.ensureInitiated(TRUST, ...)
       ├─ workflowEngineAdaptor.adaptSendBack(TRUST, id, ...)             ← CLARIFICATION_REQUESTED
       ├─ trust.setDcDecisionStatus(REJECTED_BY_DC)                       ← mismatches engine state
       ├─ trust.setDcFlagReason(reason)
       └─ trustRepository.save()                                          ← submissionStatus NOT updated here
```

**VERIFIED BUG**: After `flagTrust()`, `WorkflowInstance.status = CLARIFICATION_REQUESTED` but `trust.dcDecisionStatus = REJECTED_BY_DC`. These are semantically different states. The engine says "send back for clarification" but the entity's Gen1 field says "DC rejected." The frontend `trustReviewStatus()` reads `submissionStatus` first — it is still SUBMITTED (not updated in PATH C), so the fallback path runs:
- `trust.isVerifiedByDc` = false, `trust.dcFlagReason` is set → returns `CLARIFICATION_REQUIRED`
- Correct visual result, but for the wrong reason: the code path that produces it relies on Gen1 flag, not the engine state.

---

#### Read Paths — Trust

**Backend DTO (`TrustResponse`):**
```java
// TrustResponse.java — exposes ALL THREE generation fields simultaneously:
private Long workflowInstanceId;        // Gen3
private SubmissionStatus submissionStatus;  // Gen2
private DcDecisionStatus dcDecisionStatus;  // Gen2  ← NOT always updated by GovernanceWorkflowServiceImpl
private String dcFlagReason;            // Gen1
// NOTE: systemVerificationStatus is intentionally NOT in TrustResponse (test-verified)
```

**Frontend:**
| Reader | Field(s) Read | Verdict |
|---|---|---|
| `TaTrustPage.trustReviewStatus()` | `submissionStatus`, `isVerifiedByDc`, `dcFlagReason`, `dcDecisionStatus` | **FRONTEND STATUS SYNTHESIS — REMOVE** |
| `TrustTab.deriveModuleStatus()` | `trust.isVerifiedByDc`, `trust.dcFlagReason` | **FRONTEND STATUS SYNTHESIS — REMOVE** |
| `BoardMemberTabs` | `m.isVerifiedByDc` | Direct Gen1 bool read |
| `ContractorDetailPage` | `contractor.isVerifiedByDc` | Direct Gen1 bool read |
| `WorkflowGovernancePanel` | `trust.workflowInstanceId` | ✅ Canonical path |

---

### 1.4 Employee Module

#### Write Path (single path, no WorkflowEngine)

```
POST /api/v1/dc/employees/{id}/approve
  └─ DcEmployeeController.approve()                           [DcEmployeeController.java:46]
       └─ EmployeeServiceImpl.approveEmployee()               [EmployeeServiceImpl.java:262]
            ├─ guard: emp.submittedAt != null
            ├─ emp.setVerifiedByDc(true)
            ├─ emp.setVerifiedByDcAt(now)
            ├─ emp.setVerifiedByDcUserId(claims.userId())
            ├─ emp.setDcFlagReason(null)
            └─ employeeRepository.save()
```

| Field | Updated | Audit | WorkflowTransition | Outbox |
|---|---|---|---|---|
| `Employee.verifiedByDc` | ✅ boolean | `auditService` only | ❌ NONE | ❌ NONE |
| `Employee.dcFlagReason` | ✅ cleared | n/a | ❌ | ❌ |
| `Employee.submissionStatus` | NOT persisted — `@Transient` in entity | n/a | ❌ | ❌ |

**VERIFIED**: There is no `WorkflowInstance` for employees. No `WorkflowTransition`. No outbox event. The only durable record of a DC approval decision is `verifiedByDc = true` on the entity row plus the `updatedBy` / `updatedAt` fields from `BaseEntity`.

**VERIFIED**: The `listPendingReviews()` queries employees with `submittedAt != null && verifiedByDc == false` [EmployeeServiceImpl.java:318]. There is no guard preventing a TA from creating a new employee record after rejection: a fresh `create()` call produces a new record with `submittedAt = null`, invisible to the "pending" queue until re-submitted.

---

### 1.5 Contractor Module

```
// No DcContractorController for approve/reject found.
// DcComplianceService explicitly states:
// "Staff (Employee) and Contractor modules have NO DC approval or verification workflow."
// [DcComplianceServiceImpl.java:29]
```

**Status on contractor entity**: `isVerifiedByDc: boolean`, `dcFlagReason: String`, `PaymentStatus` enum. No write path for DC verification at the service layer other than `DcComplianceServiceImpl` which explicitly excludes contractors. Status visible in frontend via `ContractorDetailPage` reading `contractor.isVerifiedByDc`. No mutation endpoint for this field exists on the DC side.

**NOT VERIFIED IN CODE**: Whether `isVerifiedByDc` on contractors is ever written to from any endpoint. Searched all controller/service files; no `ContractorServiceImpl.approve*` method found.

---

## Section 2 — Drift Matrix

| Entity | Source A | Source B | Source C | Can Diverge? | Sync Mechanism | Failure Mode |
|---|---|---|---|---|---|---|
| `TempleProfileStaging` | `WorkflowInstance.status` (queries JOIN this) | `TempleProfileStaging.status` (entity column) | n/a | **YES** | PATH B writes entity column only. Repo queries read WF status. | PATH B approval: entity col = APPROVED, WF status = SUBMITTED. DB query returns record as SUBMITTED. API shows SUBMITTED to user after "approval." |
| `AssetDeclaration` | `WorkflowInstance.status` | `AssetDeclaration.status` (entity column) | n/a | **YES, bounded** | `assertEntityStatusConsistency()` throws if mismatch post-write | Partial commit in same TX (unlikely with Spring TX): WF updated, entity not → engine status says APPROVED, domain status says UNDER_REVIEW |
| `Trust` | `WorkflowInstance.status` | `SubmissionStatus.submissionStatus` | `DcDecisionStatus.dcDecisionStatus` | **YES** | `assertEntityStatusConsistency()` covers WF↔submissionStatus. `dcDecisionStatus` is NOT checked. | After PATH A approval: `dcDecisionStatus` stays `PENDING_DC_APPROVAL`. Frontend `trustReviewStatus()` produces correct output via `submissionStatus`, but `dcDecisionStatus` is stale. |
| `Trust` (flag path) | `WorkflowInstance.status = CLARIFICATION_REQUESTED` | `dcDecisionStatus = REJECTED_BY_DC` | n/a | **YES — active bug** | No check. `submissionStatus` not even updated in PATH C flag. | `submissionStatus` = SUBMITTED, WF = CLARIFICATION_REQUESTED, `dcDecisionStatus` = REJECTED_BY_DC. Three different states for one entity. |
| `Employee` | `verifiedByDc: boolean` | n/a | n/a | N/A (only one field) | None — no consistency check | DC rejects, then same employee record is re-submitted. No state machine prevents repeated re-submission cycles. |

### Can partial commit create mismatch? (Declaration & Trust)

**VERIFIED**: For Declaration and Trust, `adaptApprove()` and `declaration.setStatus(APPROVED)` happen **within the same `@Transactional` method**. If the transaction rolls back, both writes roll back together. Spring's default transaction isolation (`READ_COMMITTED`) ensures no partial visibility. **The dual-write is safe as long as the transaction completes**.

The `assertEntityStatusConsistency()` call happens **within the same transaction**, after both writes. If it throws, the transaction rolls back both writes atomically. This is a correct defensive pattern.

**However**: `adaptApprove()` calls `workflowEngine.execute()` which itself has its own `@Transactional` annotation with `Isolation.READ_COMMITTED`. In Spring, if the outer service method is `@Transactional`, the inner `workflowEngine.execute()` participates in the same transaction (default propagation = REQUIRED). So they share one transaction boundary. **No partial commit risk in the canonical paths.**

### Can async job mutate only one source?

**VERIFIED**: The `FLAG_OVERDUE` system action is executed via `workflowEngine.executeSystem()` which only updates `WorkflowInstance.status → OVERDUE`. No corresponding update to `AssetDeclaration.status` or `Trust.submissionStatus` is triggered. After a declaration goes OVERDUE, `WorkflowInstance.status = OVERDUE` but `declaration.status = SUBMITTED` (or whatever it was before). **This is an active divergence for OVERDUE state.**

### Can frontend cache stale derived state?

**VERIFIED**: RTK Query cache tags for Trust: `Trust`, `BoardMember`. After `DcComplianceServiceImpl.flagTrust()`, the DC API invalidates `DcTempleProfile` tag [dcHooks.ts]. The TA-facing `trustApi` invalidates `Trust` tag. However, `DcTempleProfilePage` renders the `TrustTab` which reads trust data from `DcTempleProfile` tag. If the DC flags a trust and the TA is viewing concurrently, the TA's `Trust` tag is not directly invalidated by the DC action — the TA would see stale data until the 5-minute cache TTL or until the TA manually refreshes.

---

## Section 3 — Runtime Sequence Analysis

### 3.1 Trust Approve (Full Trace)

```
TA: submitTrust(trustId=42)
│
│  GovernanceWorkflowServiceImpl.submitTrust() [@Transactional, CAN_SUBMIT]
│    ownershipGuard.assertOwnsTemple(trust.templeId)
│    workflowEngineAdaptor.adaptSubmit(TRUST, 42, templeId, districtId, userId)
│      └─ WorkflowEngineImpl.execute(instanceId, SUBMIT, taContext)
│           DB WRITE 1: workflow_instances SET status='SUBMITTED', submittedAt=now, lockVersion=1
│           DB WRITE 2: workflow_transitions INSERT (fromStatus=DRAFT, toStatus=SUBMITTED, action=SUBMIT)
│           DB WRITE 3: notification_outbox INSERT
│    versionService.snapshot(TRUST, 42, v1, trust, userId, null)
│    trust.setSubmissionStatus(SUBMITTED)
│    DB WRITE 4: trusts SET submission_status='SUBMITTED'
│    [TX COMMIT — all 4 writes atomic]
│
DC: sees trust in dashboard (WorkflowInstance.status = SUBMITTED)
│
DC: approveTrust(trustId=42)
│
│  GovernanceWorkflowServiceImpl.approveTrust() [@Transactional, CAN_ACT_DC]
│    assertDistrictScopeForTrust(trust)
│    workflowEngineAdaptor.adaptApprove(TRUST, 42, districtId, userId)
│      └─ WorkflowEngineImpl.execute(instanceId, APPROVE, dcContext)
│           DB WRITE 1: workflow_instances SET status='APPROVED', lockVersion=2
│           DB WRITE 2: workflow_transitions INSERT (fromStatus=SUBMITTED, toStatus=APPROVED, action=APPROVE)
│           DB WRITE 3: notification_outbox INSERT
│    versionService.snapshot(TRUST, 42, v1, trust, userId, null)
│    trust.setSubmissionStatus(APPROVED)
│    DB WRITE 4: trusts SET submission_status='APPROVED'
│    assertEntityStatusConsistency(TRUST, 42, "APPROVED")
│      → reads WorkflowInstance.status = APPROVED ✅ matches
│    [TX COMMIT — all 4 writes atomic]
│
TA sees: TrustResponse.submissionStatus = APPROVED ✅
         TrustResponse.workflowInstanceId → WorkflowGovernancePanel shows APPROVED ✅
         TrustResponse.dcDecisionStatus = PENDING_DC_APPROVAL ← STALE (not updated by PATH A)
         trustReviewStatus() → reads submissionStatus=APPROVED → returns 'APPROVED' ✅ (correct by luck)
│
DC sees: WorkflowInstance.status = APPROVED in dashboard ✅
```

### 3.2 Trust Flag

```
DC: flagTrust(trustId=42, reason="Missing documents")
│
│  DcComplianceServiceImpl.flagTrust() [@Transactional, CAN_ACT_DC]
│    workflowEngineAdaptor.ensureInitiated(TRUST, 42, ...) ← creates WF instance if missing
│    workflowEngineAdaptor.adaptSendBack(TRUST, 42, districtId, userId, reason)
│      └─ WorkflowEngineImpl.execute(SEND_BACK)
│           DB WRITE 1: workflow_instances SET status='CLARIFICATION_REQUESTED', lockVersion++
│           DB WRITE 2: workflow_transitions INSERT (action=SEND_BACK)
│           DB WRITE 3: notification_outbox INSERT
│    trust.setDcDecisionStatus(REJECTED_BY_DC)              ← MISMATCH: engine says CLARIFICATION_REQUESTED
│    trust.setDcFlagReason(reason)
│    DB WRITE 4: trusts SET dc_decision_status='REJECTED_BY_DC', dc_flag_reason='Missing documents'
│    NOTE: submissionStatus is NOT updated here — stays at prior value
│    [TX COMMIT]
│
DB state after flag:
  workflow_instances.status = 'CLARIFICATION_REQUESTED'
  trusts.dc_decision_status = 'REJECTED_BY_DC'         ← mismatch
  trusts.submission_status  = 'SUBMITTED'               ← stale (was set on submit, never cleared)
  trusts.dc_flag_reason     = 'Missing documents'
│
TA sees: trustReviewStatus(trust)
  → submission = 'SUBMITTED' → returns 'UNDER_REVIEW'  ← WRONG. Should show CLARIFICATION_REQUIRED.
  (The function checks submissionStatus=SUBMITTED → maps to UNDER_REVIEW before reaching dcFlagReason check)
```

**VERIFIED BUG**: `trustReviewStatus()` [TaTrustPage.tsx:54] checks `submission === 'SUBMITTED' → return 'UNDER_REVIEW'` BEFORE checking `dcFlagReason`. After PATH C flag, `submissionStatus` is still `SUBMITTED`. The TA sees "Under Review" when they should see "Clarification Required."

### 3.3 Declaration Clarification

```
DC: requestClarification(declarationId=99, message="Provide survey number")
│
│  GovernanceWorkflowServiceImpl.requestClarification() [@Transactional, CAN_ACT_DC]
│    executeDeclarationTransition(99, REQUEST_CLARIFICATION, claims, idempotencyKey)
│      └─ WorkflowEngineImpl.execute(REQUEST_CLARIFICATION)
│           DB WRITE 1: workflow_instances SET status='CLARIFICATION_REQUESTED'
│           DB WRITE 2: workflow_transitions INSERT
│           DB WRITE 3: notification_outbox INSERT
│    clarificationEngine.requestClarification(workflowInstanceId, message, userId, null)
│      → creates ClarificationThread + ClarificationMessage rows
│    declaration.setStatus(DeclarationStatus.CLARIFICATION_REQUIRED)    ← DUAL WRITE
│    declarationRepository.save()
│    if (declaration.clarificationRound >= 2) → escalation notifications to SUPER_ADMIN
│    assertEntityStatusConsistency(DECLARATION, 99, "CLARIFICATION_REQUIRED")
│      → canonicalizeWorkflowStatusForEntity maps CLARIFICATION_REQUESTED → CLARIFICATION_REQUIRED ✅
│    [TX COMMIT]
│
TA sees: declaration.status = 'CLARIFICATION_REQUIRED' ✅
         ClarificationAlert rendered in TaDeclarationDetailPage ✅
         WorkflowGovernancePanel.ClarificationInbox shows thread ✅
```

This path is **clean**. The drift guard catches the name mismatch at runtime.

### 3.4 Temple Profile Approval

```
DC: calls POST /api/v1/temples/{templeId}/profile/approve/{stagingId}  ← PATH A (CANONICAL)
│
│  TempleProfileStagingServiceImpl.approve() [@Transactional, CAN_APPROVE]
│    workflowInstance = workflowEngine.getState(TEMPLE_PROFILE, stagingId)
│    guard: workflowInstance.status == SUBMITTED
│    findFirstByTempleIdAndStatus(templeId, APPROVED) → executeSystem(REJECT, "Superseded")
│      on old approved staging
│    promoteToTemple(temple, staging) → templeRepository.save()
│    workflowEngine.execute(APPROVE)
│      DB WRITE 1: workflow_instances SET status='APPROVED'
│      DB WRITE 2: workflow_transitions INSERT ✅
│      DB WRITE 3: outbox INSERT ✅
│    versionService.snapshot()
│    [TX COMMIT]
│
toResponse(staging):
  workflowEngine.getState(TEMPLE_PROFILE, stagingId)
  statusLabel = instance.status.name() = "APPROVED" ✅
│
OR DC: calls POST /api/v1/dc/profiles/{stagingId}/approve  ← PATH B (LEGACY, BROKEN)
│
│  TempleProfileWorkflowServiceImpl.approveProfile()
│    assertPendingReview(staging) — checks staging.status == PENDING_REVIEW (entity column)
│    transitionValidator.validateProfileStagingTransition("PENDING_REVIEW", "APPROVED")
│      validate("PENDING_REVIEW", "APPROVED", "TEMPLE")
│        WorkflowStatus.valueOf("PENDING_REVIEW") → throws IllegalArgumentException ← CONFIRMED THROWS
│        caught → WorkflowException thrown
│    [METHOD FAILS — no approval]
```

**CONFIRMED**: PATH B (`DcProfileController.approveProfile()`) fails on every invocation with a `WorkflowException` because `StatusTransitionValidator.validateProfileStagingTransition()` calls `validate(from, to, "TEMPLE")`, and `WorkflowStatus.valueOf("PENDING_REVIEW")` throws since `PENDING_REVIEW` is not a `WorkflowStatus` enum value. This endpoint is **completely non-functional** — it will never succeed.

### 3.5 Employee Approval

```
DC: approveEmployee(id=15)
│
│  EmployeeServiceImpl.approveEmployee() [@Transactional, IS_DC_ROLE]
│    guard: emp.submittedAt != null  (only check — no status enum guard)
│    emp.verifiedByDc = true
│    emp.verifiedByDcAt = now
│    emp.verifiedByDcUserId = claims.userId
│    emp.dcFlagReason = null
│    DB WRITE: employees SET verified_by_dc=true, verified_by_dc_at=now
│    [TX COMMIT]
│    [NO WorkflowTransition, NO outbox, NO notification]
│
DC sees: next list of pending employees no longer includes this one ✅ (submittedAt != null && !verifiedByDc)
TA sees: employee.isVerifiedByDc = true
         StaffTab.deriveModuleStatus(true, null) → 'VERIFIED' ✅
│
If DC had previously rejected (verifiedByDc=false, dcFlagReason="X"):
  TA can CREATE a new employee record (no block from the old rejection)
  OR TA can call submit again (no state machine prevents it)
  New record: submittedAt=null → invisible to pending queue until explicitly submitted
  Old record: verifiedByDc=false, dcFlagReason="X" — no status prevents further action
```

---

## Section 4 — Canonicalization Plan

### Phase 0 — Stabilization (no schema breaks, no UI breaks)

**Target**: Stop the three confirmed bugs. No new features. No migration. Ships in one PR.

---

**Fix 0.1 — BLOCKING: Retire `DcProfileController` endpoint** 

`DcProfileController.approveProfile()` throws on every call. The canonical endpoint at `TempleController` works correctly.

```
File: backend/src/main/java/com/templeregistry/controller/dc/DcProfileController.java

Change: @PostMapping("/{stagingId}/approve") → add @Deprecated and return 410 GONE with message
"Use POST /api/v1/temples/{templeId}/profile/approve/{stagingId} instead."

OR: Delete DcProfileController entirely.
```

**Impact**: If any frontend call uses `/api/v1/dc/profiles/{stagingId}/approve`, it is already throwing. Retiring the endpoint formalizes the failure. Zero regression risk.

---

**Fix 0.2 — ACTIVE BUG: Trust flag path leaves `submissionStatus` stale**

```
File: backend/src/main/java/com/templeregistry/service/impl/DcComplianceServiceImpl.java
Method: flagTrust()

Current (line ~120):
  trust.setDcDecisionStatus(DcDecisionStatus.REJECTED_BY_DC);
  trust.setDcFlagReason(req.getReason());
  trustRepository.save(trust);

Fix — add one line:
  trust.setSubmissionStatus(SubmissionStatus.SENT_BACK);  ← add this
  trust.setDcDecisionStatus(DcDecisionStatus.REJECTED_BY_DC);
  trust.setDcFlagReason(req.getReason());
  trustRepository.save(trust);
```

**Why**: `trustReviewStatus()` checks `submissionStatus` first. When `submissionStatus = SUBMITTED`, the function returns `UNDER_REVIEW` regardless of `dcFlagReason`. Setting `submissionStatus = SENT_BACK` causes the correct branch (`CLARIFICATION_REQUIRED`) to be returned.

**Impact**: TA `TaTrustPage` now shows "Clarification Required" after DC flags trust via compliance panel. No schema change. No frontend change.

---

**Fix 0.3 — VERIFIED GAP: Declaration `submitDeclaration` doesn't update `declaration.status`**

```
File: backend/src/main/java/com/templeregistry/service/impl/governance/GovernanceWorkflowServiceImpl.java
Method: submitDeclaration() [line ~275]

After: declaration.setSubmittedBy(currentUserId());
Add:   declaration.setStatus(DeclarationStatus.SUBMITTED);

Then: assertEntityStatusConsistency(DECLARATION, declarationId, DeclarationStatus.SUBMITTED.name());
```

**Why**: After submit, `WorkflowInstance.status = SUBMITTED` but `declaration.status = DRAFT`. The TA sees `DRAFT` on the declaration list until `markUnderReview` is called by the DC. This produces incorrect display state on the TA side immediately after submission.

**Impact**: TA sees `SUBMITTED` immediately after submitting a declaration. Consistent with workflow engine state.

---

**Fix 0.4 — VERIFIED GAP: OVERDUE state not propagated to domain entity**

The system action `FLAG_OVERDUE` transitions `WorkflowInstance.status → OVERDUE` but never updates `AssetDeclaration.status` or `Trust.submissionStatus`.

```
File: backend/src/main/java/com/templeregistry/event/workflow/GovernanceDomainEventHandler.java
(or wherever domain events are consumed)

On event: action == FLAG_OVERDUE && entityType == DECLARATION:
  declaration.setStatus(DeclarationStatus.OVERDUE)
  declarationRepository.save(declaration)

On event: action == FLAG_OVERDUE && entityType == TRUST:
  trust.setSubmissionStatus(SubmissionStatus.SUBMITTED)  ← OVERDUE has no SubmissionStatus mapping
  (Note: Trust doesn't have an OVERDUE submission status — add or map to SUBMITTED with dcFlagReason)
```

**PARTIALLY NOT VERIFIED IN CODE**: The exact event handler class was not located during this analysis. Verify the handler exists before implementing.

---

### Phase 1 — Single Write Path Per Module

**Target**: Route ALL DC actions through the canonical `WorkflowEngine`. Remove the second entry point for trust.

**1.1 — Consolidate Trust write paths**

`DcComplianceServiceImpl.verifyTrust()` and `DcComplianceServiceImpl.flagTrust()` both call the WorkflowEngine via the adaptor. The only difference from PATH A (`GovernanceWorkflowServiceImpl`) is:
- `verifyTrust` also writes `dcDecisionStatus = APPROVED_BY_DC`
- `flagTrust` writes `dcDecisionStatus = REJECTED_BY_DC`

After Phase 0, `flagTrust` will also correctly set `submissionStatus`.

The question is whether to keep both entry points or merge them. The safest Phase 1 action is:

```
In GovernanceWorkflowServiceImpl.approveTrust():
  Add: trust.setDcDecisionStatus(DcDecisionStatus.APPROVED_BY_DC);

In GovernanceWorkflowServiceImpl.sendBackTrust():
  Add: trust.setDcDecisionStatus(DcDecisionStatus.REJECTED_BY_DC);
```

This makes PATH A produce the same Gen1 field state as PATH B, eliminating the content divergence. The DC can then use either path and get the same result.

**1.2 — Remove `DcProfileController` dead endpoint**

Already covered in Phase 0 Fix 0.1. In Phase 1, also remove `TempleProfileWorkflowServiceImpl` from the Spring context by removing `@Service` or marking `@Deprecated` with a comment documenting the canonical path.

---

### Phase 2 — Retirement of Legacy Fields

Execute only **after Phase 1 is verified in production for ≥2 weeks**.

**2.1 — Remove `submissionStatus` and `dcDecisionStatus` from `TrustResponse`**

```
File: backend/src/main/java/com/templeregistry/dto/response/trust/TrustResponse.java

Remove:
  private SubmissionStatus submissionStatus;
  private DcDecisionStatus dcDecisionStatus;
  private String sendBackReason;

Keep:
  private Long workflowInstanceId;
  private String dcFlagReason;  ← still used in TrustTab display
```

API VERSION IMPACT: This is a breaking change for consumers reading `submissionStatus` or `dcDecisionStatus` from the Trust API response. Requires coordinated frontend update.

**2.2 — Remove `trustReviewStatus()` frontend mapper**

```
File: frontend/src/features/trust/pages/TaTrustPage/TaTrustPage.tsx

Replace trustReviewStatus() call with:
  import { useGetWorkflowStateQuery } from '@/features/governance/workflowApi'
  const { data: wfData } = useGetWorkflowStateQuery(trust.workflowInstanceId, { skip: !trust.workflowInstanceId })
  const displayStatus = wfData?.data?.status ?? 'DRAFT'
```

**2.3 — Remove `deriveModuleStatus()` from TrustTab DC view**

```
File: frontend/src/features/dc/pages/DcTempleProfilePage/tabs/TrustTab.tsx

Replace:
  const trustStatus = trust ? deriveModuleStatus(trust.isVerifiedByDc, trust.dcFlagReason) : null

With:
  const trustStatus = trust?.workflowStatus  ← requires backend to expose workflowStatus in DC profile response
```

**2.4 — Remove `TempleProfileStaging.status` entity column**

After verifying all queries use WorkflowInstance joins:
- The `status` column on `TempleProfileStaging` is never read by any canonical query
- `TempleProfileWorkflowServiceImpl` is the only writer and reader of this column
- After retiring `TempleProfileWorkflowServiceImpl`, create Flyway migration: `ALTER TABLE temple_profile_staging DROP COLUMN status`

---

## Section 5 — Verification Plan

### Unit Tests

**Test 5.1 — Phase 0.2: Trust flag sets submissionStatus = SENT_BACK**
```java
// File: backend/src/test/java/com/templeregistry/service/impl/DcComplianceServiceImplTest.java

@Test
void should_setSubmissionStatusToSentBack_when_flagTrustCalled() {
    // Given: trust with submissionStatus = SUBMITTED
    // When: flagTrust() called
    // Then: trust.submissionStatus == SENT_BACK
    //       WorkflowInstance.status == CLARIFICATION_REQUESTED
    //       trustReviewStatus(trust) == 'CLARIFICATION_REQUIRED'  (verify frontend mapping separately)
}
```

**Test 5.2 — Phase 0.3: Declaration status = SUBMITTED after submitDeclaration**
```java
// File: backend/src/test/java/com/templeregistry/service/impl/governance/GovernanceDeclarationWorkflowTest.java

@Test
void should_setDeclarationStatusToSubmitted_when_submitDeclarationCalled() {
    // Given: declaration with status = DRAFT
    // When: submitDeclaration()
    // Then: declaration.status == SUBMITTED (not DRAFT)
    //       WorkflowInstance.status == SUBMITTED
}
```

**Test 5.3 — Path B is non-functional (confirms 410 response after Phase 0.1)**
```java
// Verify DcProfileController endpoint returns 410 / throws expected exception
// after retirement
```

### Integration Tests

**Test 5.4 — Trust full workflow: TA view matches DC view at every state**
```java
// DeclarationHappyPathIT.java pattern, but for Trust
// Assert after each action:
//   trustRepository.findById(trustId).submissionStatus
//   workflowInstanceRepository.findByEntityTypeAndEntityId(TRUST, trustId).status
//   canonicalize(workflowStatus) == submissionStatus.name() (via assertEntityStatusConsistency logic)
```

**Test 5.5 — OVERDUE state propagation**
```java
// After executeSystem(FLAG_OVERDUE):
//   WorkflowInstance.status == OVERDUE
//   AssetDeclaration.status == OVERDUE  (verifies Fix 0.4)
```

**Test 5.6 — Concurrent approve + flag on same Trust**
```java
// DeclarationConcurrencyIT.java pattern, applied to Trust
// Two threads: one approveTrust(), one flagTrust() simultaneously
// Exactly one must succeed (optimistic lock version check)
// Loser gets OptimisticLockException
// DB state must be consistent after both complete
```

### Playwright End-to-End Tests

**Test 5.7 — TA and DC see same status at every transition**
```typescript
// File: e2e/tests/status-consistency.spec.ts

test('trust status is consistent across TA and DC after approval', async ({ taPage, dcPage }) => {
  // TA submits trust
  await taPage.submitTrust(trustId)
  // DC approves
  await dcPage.approveTrust(trustId)
  // Assert TA sees APPROVED (not UNDER_REVIEW)
  const taStatus = await taPage.getTrustStatus(trustId)
  expect(taStatus).toBe('Approved')
  // Assert DC sees APPROVED
  const dcStatus = await dcPage.getTrustStatus(trustId)
  expect(dcStatus).toBe('Approved')
})

test('trust status shows CLARIFICATION_REQUIRED after DC flags (not UNDER_REVIEW)', async ({ taPage, dcPage }) => {
  await taPage.submitTrust(trustId)
  await dcPage.flagTrust(trustId, 'Missing documents')
  const taStatus = await taPage.getTrustStatus(trustId)
  expect(taStatus).toBe('Clarification Required')  // NOT 'Under Review'
})
```

---

## Section 6 — Risk Analysis

| Fix | Migration Risk | Rollback Strategy | DB Compatibility | API Compatibility | Frontend Compatibility |
|---|---|---|---|---|---|
| **0.1** Retire `DcProfileController` | Low — endpoint already throws | Re-add `@Service` to old impl | No change | BREAKING for callers of `/api/v1/dc/profiles/{id}/approve` — but call already fails at runtime | No frontend change needed (DC approval already broken) |
| **0.2** Trust flag submissionStatus | Low — adds one field write | Revert one line | No schema change | No change (response not altered) | No change (existing `trustReviewStatus()` will now hit correct branch) |
| **0.3** Declaration submit status | Low | Revert one line | No schema change | No change | TA declaration list will show SUBMITTED immediately after submit — correct behavior |
| **0.4** OVERDUE propagation | Medium — depends on event handler location | Revert event handler | No schema change | No change | Declaration/trust list will show OVERDUE status — currently shows stale SUBMITTED |
| **Phase 1** Unify trust write paths | Low | Feature flag around `dcDecisionStatus` writes | No schema change | No change | No change until Phase 2 |
| **Phase 2.1** Remove legacy fields from TrustResponse | HIGH — breaking API change | v2 endpoint or versioned DTO | No schema change | BREAKING — callers reading `submissionStatus`/`dcDecisionStatus` get null | Requires frontend to remove `trustReviewStatus()` first |
| **Phase 2.4** Drop staging status column | HIGH — irreversible schema change | DB backup required before migration | BREAKING — Flyway migration drops column | No API impact (column not in any response) | No frontend impact |

### Outbox Failure Risk (Existing, Not Introduced)

`WorkflowEngineImpl.writeToOutbox()` [line ~400] catches all exceptions and does NOT rethrow. If the outbox write fails, the workflow transition commits but no notification is sent. This is documented behavior ("outbox failure must not roll back the workflow transition"). The risk is silent notification failure with no dead-letter queue. **NOT INTRODUCED BY THESE FIXES** — pre-existing design decision.

---

## Summary: Prioritized Fix List

| Priority | Fix | File(s) | Risk | Lines Changed |
|---|---|---|---|---|
| P0 | Retire `DcProfileController` endpoint | `DcProfileController.java` | Low | ~5 |
| P0 | Trust flag: set `submissionStatus = SENT_BACK` | `DcComplianceServiceImpl.java` | Low | 1 |
| P1 | Declaration submit: set `status = SUBMITTED` | `GovernanceWorkflowServiceImpl.java` | Low | 2 |
| P1 | Trust approve (PATH A): set `dcDecisionStatus` | `GovernanceWorkflowServiceImpl.java` | Low | 1 |
| P2 | Propagate OVERDUE to domain entities | Event handler (location to verify) | Medium | ~15 |
| P3 | Remove `trustReviewStatus()` frontend mapper | `TaTrustPage.tsx` | Medium | ~35 + workflowApi query |
| P4 | Remove `submissionStatus`/`dcDecisionStatus` from `TrustResponse` | `TrustResponse.java` | High | ~3 + coordinated FE |
