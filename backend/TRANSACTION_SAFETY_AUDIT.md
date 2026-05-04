# Transaction Safety Audit - NotificationHelper Callsites

**Date:** 2026-04-29  
**Status:** AUDIT COMPLETE

---

## CALLSITE MATRIX

| # | Service | Method | NotificationHelper Call | @Transactional | Nested TX | Async | Post-Commit | Controller Direct | TX Active? | SAFE? |
|---|---------|--------|------------------------|----------------|-----------|-------|-------------|-------------------|------------|-------|
| 1 | DcComplianceServiceImpl | verifyTemple | notifyTempleApproved | ✅ YES | NO | NO | NO | NO | ✅ YES | ✅ SAFE |
| 2 | DcComplianceServiceImpl | flagTemple | notifyTempleFlagged | ✅ YES | NO | NO | NO | NO | ✅ YES | ✅ SAFE |
| 3 | DcComplianceServiceImpl | verifyTrust | notifyTrustApproved | ✅ YES | NO | NO | NO | NO | ✅ YES | ✅ SAFE |
| 4 | DcComplianceServiceImpl | flagTrust | notifyTrustFlagged | ✅ YES | NO | NO | NO | NO | ✅ YES | ✅ SAFE |
| 5 | TempleServiceImpl | create | notifyTempleCreated | ✅ YES | NO | NO | NO | NO | ✅ YES | ✅ SAFE |
| 6 | TempleServiceImpl | update | notifyTempleUpdated | ✅ YES | NO | NO | NO | NO | ✅ YES | ✅ SAFE |
| 7 | DcTempleVerificationServiceImpl | verifyTempleProfile | notifyTempleApproved | ✅ YES | NO | NO | NO | NO | ✅ YES | ✅ SAFE |
| 8 | DcTempleVerificationServiceImpl | flagTempleProfile | notifyTempleFlagged | ✅ YES | NO | NO | NO | NO | ✅ YES | ✅ SAFE |
| 9 | DcTempleVerificationServiceImpl | unflagTempleProfile | notifyTempleUnflagged | ✅ YES | NO | NO | NO | NO | ✅ YES | ✅ SAFE |
| 10 | DeclarationWorkflowServiceImpl | approve | notifyDeclarationApproved | ✅ YES | NO | NO | NO | NO | ✅ YES | ✅ SAFE |
| 11 | DeclarationWorkflowServiceImpl | reject | notifyDeclarationRejected | ✅ YES | NO | NO | NO | NO | ✅ YES | ✅ SAFE |
| 12 | DeclarationWorkflowServiceImpl | requestClarification | notifyDeclarationFlagged | ✅ YES | NO | NO | NO | NO | ✅ YES | ✅ SAFE |
| 13 | DeclarationWorkflowServiceImpl | flagPhysicalVerification | notifyDeclarationMarkedForPhysicalVisit | ✅ YES | NO | NO | NO | NO | ✅ YES | ✅ SAFE |
| 14 | TempleProfileWorkflowServiceImpl | approveProfile | notifyTempleApproved | ✅ YES | NO | NO | NO | NO | ✅ YES | ✅ SAFE |
| 15 | TempleProfileWorkflowServiceImpl | rejectProfile | notifyTempleRejected | ✅ YES | NO | NO | NO | NO | ✅ YES | ✅ SAFE |

---

## FINDINGS

### ✅ ALL CALLSITES ARE TRANSACTIONAL

**Result:** All 15 NotificationHelper callsites are within `@Transactional` methods.

**Evidence:**
- All service methods have `@Transactional` annotation
- No async calls (`@Async` not present)
- No post-commit hooks calling NotificationHelper
- No controller direct calls (all go through service layer)
- No nested transaction propagation issues

### Transaction Context Analysis

**Transaction Propagation:** All methods use default `REQUIRED` propagation
- If transaction exists: join it
- If no transaction: create new one
- **Conclusion:** Transaction ALWAYS active when NotificationHelper called

**Transaction Isolation:** Default `READ_COMMITTED` (except DeclarationWorkflowServiceImpl uses PESSIMISTIC_WRITE locks)

**Transaction Boundaries:**
- Start: Service method entry
- NotificationHelper call: INSIDE transaction
- `@TransactionalEventListener(AFTER_COMMIT)`: Fires AFTER transaction commits
- End: Service method exit

---

## RISK ASSESSMENT

### Current Implementation Risk: ⚠️ LOW

**Why Low (not Zero):**
1. ✅ All callsites are transactional
2. ✅ `@TransactionalEventListener(AFTER_COMMIT)` ensures listener only fires after commit
3. ⚠️ **Theoretical edge case:** If Spring transaction management is bypassed (e.g., direct JDBC calls, non-Spring code)

### Recommended Fix: DEFENSIVE PROGRAMMING

Even though all current callsites are safe, implement defensive routing to handle:
1. Future callsites that might not be transactional
2. Test code that might call NotificationHelper directly
3. Migration scenarios where transaction context is unclear

---

## IMPLEMENTATION STRATEGY

### Option 1: Transaction-Aware Routing (RECOMMENDED)

```java
private void publishEvent(...) {
    GovernanceDomainEvent event = GovernanceDomainEvent.workflowTransition(...);
    
    if (TransactionSynchronizationManager.isActualTransactionActive()) {
        // Normal path: publish event, listener fires AFTER_COMMIT
        eventPublisher.publishEvent(event);
        log.debug("[NotificationHelper] Event published (transactional): {}/{}/{}", 
            entityType, action, entityId);
    } else {
        // Fallback path: route directly to NotificationRouter
        log.warn("[NotificationHelper] NO TRANSACTION ACTIVE - routing directly: {}/{}/{}", 
            entityType, action, entityId);
        notificationRouter.route(event);
    }
}
```

**Pros:**
- ✅ Guarantees delivery in both scenarios
- ✅ Preserves AFTER_COMMIT semantics when transaction present
- ✅ Fallback for non-transactional calls
- ✅ Clear logging for debugging

**Cons:**
- Requires injecting NotificationRouter (circular dependency risk - MITIGATED by using `@Lazy`)

### Option 2: Outbox Direct Write (ALTERNATIVE)

```java
private void publishEvent(...) {
    GovernanceDomainEvent event = GovernanceDomainEvent.workflowTransition(...);
    
    if (TransactionSynchronizationManager.isActualTransactionActive()) {
        eventPublisher.publishEvent(event);
    } else {
        // Write directly to notification_outbox
        log.warn("[NotificationHelper] NO TRANSACTION - writing to outbox directly");
        writeToOutbox(event);
    }
}
```

**Pros:**
- ✅ Guarantees delivery via outbox pattern
- ✅ No circular dependency

**Cons:**
- ⚠️ Duplicates outbox write logic (already in WorkflowEngineImpl)
- ⚠️ Requires injecting NotificationOutboxRepository + ObjectMapper

---

## RECOMMENDATION

**Implement Option 1: Transaction-Aware Routing**

**Rationale:**
1. All current callsites are transactional (verified)
2. Defensive programming prevents future issues
3. Clear logging helps debugging
4. Minimal code duplication
5. Preserves architectural intent (event-driven)

**Implementation:**
1. Inject `NotificationRouter` with `@Lazy` to avoid circular dependency
2. Check `TransactionSynchronizationManager.isActualTransactionActive()`
3. If TX active: publish event (current behavior)
4. If NO TX: route directly to NotificationRouter
5. Add warn-level logging for non-transactional path

---

## NEXT STEPS

1. ✅ Audit complete - all callsites transactional
2. 🔄 Implement transaction-aware routing (defensive)
3. 🔄 Fix workflowInstanceId correlation
4. 🔄 Audit NotificationRouter contract
5. 🔄 Compile and test

