# Declaration Rejection → Edit → Resubmit Flow Analysis

**Date:** 2026-05-08  
**Status:** Analysis complete — ready for implementation

---

## 1. Current Flow

```
TA Draft → Submit → SUBMITTED → DC Review → APPROVED ✅
                                           → REJECTED ❌ (TA must create a brand-new declaration)
```

**Problem:** After rejection, TA is forced to call `POST /temples/{templeId}/declarations` to create a new
declaration record, losing the original record's audit trail and history linkage.

---

## 2. Root Cause (Single Bug)

`WorkflowEngineAdaptor.adaptSubmit()` handles three source states:

| Workflow Instance Status | Action Executed |
|---|---|
| `DRAFT` | `SUBMIT` → `SUBMITTED` |
| `UPDATED_AFTER_APPROVAL` | `RESUBMIT` → `RESUBMITTED` |
| `CLARIFICATION_REQUESTED` | `RESPOND_CLARIFICATION` → `CLARIFICATION_RESPONDED` |
| **`REJECTED`** | **Nothing — returns `false` silently** ❌ |

When TA calls `POST /governance/declarations/{id}/submit` on a REJECTED declaration:
1. `adaptSubmit()` finds the workflow instance in `REJECTED` state
2. No matching branch — logs debug, returns `false`
3. `submitDeclaration()` checks: `if (transitioned && declaration.getStatus() == DeclarationStatus.DRAFT)` — neither condition holds
4. **Entity status remains `REJECTED`, declaration is NOT visible to DC**

---

## 3. Why the Backend Already Supports REJECTED Edits

`DeclarationServiceImpl.update()` already permits editing:

```java
if (declaration.getStatus() != DeclarationStatus.DRAFT &&
    declaration.getStatus() != DeclarationStatus.REJECTED) {
    throw new DeclarationImmutableException(id);
}
```

`TransitionRuleRegistry` already defines the two-step path:

```
REJECTED → EDIT_APPROVED → UPDATED_AFTER_APPROVAL
UPDATED_AFTER_APPROVAL → RESUBMIT → RESUBMITTED
```

And `WorkflowEngineAdaptor.adaptEditApproved()` already handles `REJECTED → EDIT_APPROVED`.
And `adaptSubmit()` already handles `UPDATED_AFTER_APPROVAL → RESUBMIT`.

**The only missing piece is wiring these together inside `adaptSubmit()` when source status is `REJECTED`.**

---

## 4. Desired Flow (Post-Fix)

```
TA Draft → Submit → SUBMITTED → DC Review → APPROVED ✅

                                           → REJECTED
                                               ↓
                                         TA opens same record (id unchanged)
                                         TA edits fields (PUT /declarations/{id})
                                         TA clicks "Submit for Review"
                                         POST /governance/declarations/{id}/submit
                                               ↓
                                         Workflow: REJECTED → EDIT_APPROVED → UPDATED_AFTER_APPROVAL
                                                   → RESUBMIT → RESUBMITTED
                                         Entity status: SUBMITTED (DC listing query sees it)
                                               ↓
                                         DC reviews same record → APPROVED / REJECTED (loop continues)
```

---

## 5. Impacted Files

### Backend (2 files, ~5 lines total)

| File | Change |
|---|---|
| `service/workflow/WorkflowEngineAdaptor.java` | Add `REJECTED` branch in `adaptSubmit()`: execute `EDIT_APPROVED` then `RESUBMIT` |
| `service/impl/governance/GovernanceWorkflowServiceImpl.java` | Add `REJECTED` to the entity-status sync condition in `submitDeclaration()` |

### Frontend (0 files)

The frontend already does the correct thing:
- `declarationPermissions.ts`: `canEdit: status === 'DRAFT' || status === 'REJECTED'` ✅
- `DeclarationCreatePage.handleSubmitForReview()`: calls `updateDeclaration` then `submitDeclaration(id)` ✅
- `RejectionAlert.tsx` / `DeclarationHeader.tsx`: "Update & Resubmit" button routes to edit page ✅
- `declarationApi.ts`: `submitDeclaration` targets `/governance/declarations/{id}/submit` ✅

### Database / Flyway

No migration needed. All status values used (`DRAFT`, `SUBMITTED`, `REJECTED`, `APPROVED`) exist.
No new columns or tables required.

---

## 6. DB Impact

None. The fix is pure Java service logic. The `asset_declarations.status` column already stores `SUBMITTED`
after our sync, same as a first submission.

---

## 7. API Impact

No new endpoints. No contract changes. Existing `POST /governance/declarations/{id}/submit` now correctly
handles REJECTED declarations in addition to DRAFT ones.

---

## 8. UI Impact

**TA side:** No changes. "Update & Resubmit" button was already wired correctly in both
`RejectionAlert.tsx` and `DeclarationHeader.tsx`. The edit form prefill already works.

**DC side:** No changes. After resubmission from REJECTED, entity status = `SUBMITTED`, which is already
in DC's `actionable` list:
```
['SUBMITTED', 'UNDER_REVIEW', 'CLARIFICATION_RESPONDED', 'SITE_VISIT_COMPLETED', 'VERIFIED']
```

---

## 9. Audit Trail Preservation

The two-step workflow transition (`EDIT_APPROVED` + `RESUBMIT`) is already logged by the `WorkflowEngine`
internally via the `WorkflowTransitionHistory` table. The existing `DeclarationAuditLogService` and
`GovernanceAuditService` are not affected. The original rejection remark is preserved in
`declaration.reviewComment`. The version snapshot written on first submission is preserved in
`AssetDeclarationVersion`.

---

## 10. Safe Implementation Plan

**Step 1 — `WorkflowEngineAdaptor.adaptSubmit()` (+4 lines):**

Add after the existing `UPDATED_AFTER_APPROVAL` branch:
```java
} else if (instance.getStatus() == WorkflowStatus.REJECTED) {
    // REJECTED → UPDATED_AFTER_APPROVAL → RESUBMITTED (canonical two-step per TransitionRuleRegistry)
    execute(instance.getId(), WorkflowAction.EDIT_APPROVED, actorId, templeId, null, null, null);
    execute(instance.getId(), WorkflowAction.RESUBMIT, actorId, templeId, null, null, null);
    return true;
}
```

**Step 2 — `GovernanceWorkflowServiceImpl.submitDeclaration()` (+1 line):**

Change:
```java
if (transitioned && declaration.getStatus() == DeclarationStatus.DRAFT) {
    declaration.setStatus(DeclarationStatus.SUBMITTED);
}
```
To:
```java
if (transitioned && (declaration.getStatus() == DeclarationStatus.DRAFT
                     || declaration.getStatus() == DeclarationStatus.REJECTED)) {
    declaration.setStatus(DeclarationStatus.SUBMITTED);
}
```

---

## 11. Post-Fix DC Workflow Compatibility

After TA resubmits from REJECTED:
- Workflow instance is in `RESUBMITTED` state
- Entity status is `SUBMITTED`
- `adaptApprove()` already handles `RESUBMITTED → RE_APPROVE → RE_APPROVED` ✅
- `adaptReject()` already handles any state → `REJECT → REJECTED` ✅
- `approveDeclaration()` hardcodes `setStatus(APPROVED)` ✅
- `rejectDeclaration()` hardcodes `setStatus(REJECTED)` ✅

The loop `REJECTED → edit → resubmit → DC review → REJECTED → ...` works indefinitely.

---

## 12. What Does NOT Change

- First-time submit flow (DRAFT → SUBMITTED) — unchanged
- Approval flow — unchanged  
- Clarification flow — unchanged
- Site visit flow — unchanged
- TempleAuthority / DC permission checks — unchanged
- All existing tests remain valid
- No new DB migrations
- No new API endpoints
- No frontend code changes
