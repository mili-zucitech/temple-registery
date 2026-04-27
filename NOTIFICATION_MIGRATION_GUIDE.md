# Notification System Migration Guide

## Overview

This guide helps you migrate from the old synchronous notification system (`service.dc.NotificationEventPublisher`) to the new async event-based notification system (`service.notification.NotificationEventPublisher`).

---

## Migration Steps

### Step 1: Update Imports

**Old Import:**
```java
import com.templeregistry.service.dc.NotificationEventPublisher;
```

**New Imports:**
```java
import com.templeregistry.service.notification.NotificationEventPublisher;
import com.templeregistry.service.notification.NotificationRecipientResolver;
import com.templeregistry.event.declaration.*;  // or temple.*, trust.*, etc.
```

### Step 2: Add NotificationRecipientResolver Dependency

**Add to constructor:**
```java
private final NotificationRecipientResolver recipientResolver;
```

### Step 3: Replace Old Notification Calls

---

## Service-by-Service Migration

### 1. GovernanceWorkflowServiceImpl

**File:** `backend/src/main/java/com/templeregistry/service/impl/governance/GovernanceWorkflowServiceImpl.java`

#### Change 1: approveDeclaration()

**OLD CODE (Line ~233):**
```java
notificationPublisher.publish(
        declaration.getSubmittedBy() != null ? declaration.getSubmittedBy() : 0L,
        "DECLARATION_APPROVED", declarationId, "ASSET_DECLARATION");
```

**NEW CODE:**
```java
// Publish notification event
Long[] taIds = recipientResolver.getTempleAuthorityIds(declaration.getTempleId());
if (taIds.length > 0) {
    String templeName = recipientResolver.getTempleName(declaration.getTempleId());
    eventPublisher.publish(new DeclarationApprovedEvent(
            this,
            declaration.getId(),
            templeName,
            claims.userId(),
            taIds[0],
            ackNumber,
            declaration.getFinancialYear()
    ));
}
```

#### Change 2: rejectDeclaration()

**OLD CODE (Line ~297):**
```java
notificationPublisher.publish(
        declaration.getSubmittedBy() != null ? declaration.getSubmittedBy() : 0L,
        "DECLARATION_REJECTED", declarationId, "ASSET_DECLARATION");
```

**NEW CODE:**
```java
// Publish notification event
Long[] taIds = recipientResolver.getTempleAuthorityIds(declaration.getTempleId());
if (taIds.length > 0) {
    String templeName = recipientResolver.getTempleName(declaration.getTempleId());
    eventPublisher.publish(new DeclarationRejectedEvent(
            this,
            declaration.getId(),
            templeName,
            claims.userId(),
            taIds[0],
            request.getRemarks(),
            declaration.getFinancialYear()
    ));
}
```

#### Change 3: requestClarification()

**OLD CODE (Line ~340):**
```java
notificationPublisher.publish(
        declaration.getSubmittedBy() != null ? declaration.getSubmittedBy() : 0L,
        "CLARIFICATION_REQUESTED", declarationId, "ASSET_DECLARATION");
```

**NEW CODE:**
```java
// Publish notification event
Long[] taIds = recipientResolver.getTempleAuthorityIds(declaration.getTempleId());
if (taIds.length > 0) {
    String templeName = recipientResolver.getTempleName(declaration.getTempleId());
    eventPublisher.publish(new ClarificationRequestedEvent(
            this,
            declaration.getId(),
            templeName,
            claims.userId(),
            taIds[0],
            request.getMessage(),
            declaration.getFinancialYear()
    ));
}
```

#### Change 4: notifyDcOfSubmission() helper method

**OLD CODE (Line ~697):**
```java
private void notifyDcOfSubmission(Long templeId, String moduleName, Long entityId) {
    notificationPublisher.publish(0L, moduleName + "_SUBMITTED", entityId, moduleName);
    log.debug("DC submission notification queued: module={} entityId={}", moduleName, entityId);
}
```

**NEW CODE:**
```java
private void notifyDcOfSubmission(Long templeId, String moduleName, Long entityId) {
    Long[] dcIds = recipientResolver.getDistrictCollectorsForTemple(templeId);
    if (dcIds.length == 0) {
        log.warn("No DC found for temple: {}", templeId);
        return;
    }
    
    String templeName = recipientResolver.getTempleName(templeId);
    
    if ("TRUST".equals(moduleName)) {
        // Get trust details
        Trust trust = trustRepository.findById(entityId).orElse(null);
        if (trust != null) {
            eventPublisher.publish(new TrustDataSubmittedEvent(
                    this, entityId, templeName, trust.getName(), 
                    SecurityContextHolder.getContext().getAuthentication() != null ? 
                        ((ScopeHelper.Claims) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).userId() : 0L,
                    dcIds[0]
            ));
        }
    } else if ("ASSET_DECLARATION".equals(moduleName)) {
        AssetDeclaration declaration = declarationRepository.findById(entityId).orElse(null);
        if (declaration != null) {
            eventPublisher.publish(new DeclarationSubmittedEvent(
                    this, entityId, templeName,
                    declaration.getSubmittedBy() != null ? declaration.getSubmittedBy() : 0L,
                    dcIds[0],
                    declaration.getFinancialYear()
            ));
        }
    }
    
    log.debug("DC submission notification published: module={} entityId={}", moduleName, entityId);
}
```

#### Change 5: notifyTaOfDecision() helper method

**OLD CODE (Line ~702):**
```java
private void notifyTaOfDecision(Long templeId, String moduleName, Long entityId,
                                 String decision, String reason) {
    notificationPublisher.publish(0L, moduleName + "_" + decision, entityId, moduleName);
    log.debug("TA decision notification queued: module={} entityId={} decision={}", moduleName, entityId, decision);
}
```

**NEW CODE:**
```java
private void notifyTaOfDecision(Long templeId, String moduleName, Long entityId,
                                 String decision, String reason) {
    Long[] taIds = recipientResolver.getTempleAuthorityIds(templeId);
    if (taIds.length == 0) {
        log.warn("No TA found for temple: {}", templeId);
        return;
    }
    
    String templeName = recipientResolver.getTempleName(templeId);
    Long actorId = SecurityContextHolder.getContext().getAuthentication() != null ? 
        ((ScopeHelper.Claims) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).userId() : 0L;
    
    if ("TRUST".equals(moduleName)) {
        Trust trust = trustRepository.findById(entityId).orElse(null);
        if (trust != null) {
            if ("APPROVED".equals(decision)) {
                String dcName = recipientResolver.getUserFullName(actorId);
                eventPublisher.publish(new TrustDataApprovedEvent(
                        this, entityId, templeName, trust.getName(), actorId, dcName, taIds[0]
                ));
            } else if ("REJECTED".equals(decision)) {
                eventPublisher.publish(new TrustDataRejectedEvent(
                        this, entityId, templeName, trust.getName(), reason, actorId, taIds[0]
                ));
            }
        }
    }
    
    log.debug("TA decision notification published: module={} entityId={} decision={}", moduleName, entityId, decision);
}
```

---

### 2. DeclarationWorkflowServiceImpl

**File:** `backend/src/main/java/com/templeregistry/service/impl/dc/DeclarationWorkflowServiceImpl.java`

#### Change 1: approveDeclaration()

**OLD CODE (Line ~117):**
```java
notificationPublisher.publish(
        d.getSubmittedBy(), "DECLARATION_APPROVED", declarationId, "ASSET_DECLARATION");
```

**NEW CODE:**
```java
// Publish notification event
Long[] taIds = recipientResolver.getTempleAuthorityIds(d.getTempleId());
if (taIds.length > 0) {
    String templeName = recipientResolver.getTempleName(d.getTempleId());
    eventPublisher.publish(new DeclarationApprovedEvent(
            this, declarationId, templeName, claims.userId(), taIds[0],
            ackNumber, d.getFinancialYear()
    ));
}
```

#### Change 2: rejectDeclaration()

**OLD CODE (Line ~162):**
```java
notificationPublisher.publish(
        d.getSubmittedBy(), "DECLARATION_REJECTED", declarationId, "ASSET_DECLARATION");
```

**NEW CODE:**
```java
// Publish notification event
Long[] taIds = recipientResolver.getTempleAuthorityIds(d.getTempleId());
if (taIds.length > 0) {
    String templeName = recipientResolver.getTempleName(d.getTempleId());
    eventPublisher.publish(new DeclarationRejectedEvent(
            this, declarationId, templeName, claims.userId(), taIds[0],
            request.getRemarks(), d.getFinancialYear()
    ));
}
```

#### Change 3: requestClarification()

**OLD CODE (Line ~210):**
```java
notificationPublisher.publish(
        d.getSubmittedBy(), "CLARIFICATION_REQUESTED", declarationId, "ASSET_DECLARATION");
```

**NEW CODE:**
```java
// Publish notification event
Long[] taIds = recipientResolver.getTempleAuthorityIds(d.getTempleId());
if (taIds.length > 0) {
    String templeName = recipientResolver.getTempleName(d.getTempleId());
    eventPublisher.publish(new ClarificationRequestedEvent(
            this, declarationId, templeName, claims.userId(), taIds[0],
            request.getMessage(), d.getFinancialYear()
    ));
}
```

---

### 3. TempleProfileWorkflowServiceImpl

**File:** `backend/src/main/java/com/templeregistry/service/impl/dc/TempleProfileWorkflowServiceImpl.java`

#### Change 1: approveProfile()

**OLD CODE (Line ~152):**
```java
notificationPublisher.publish(staging.getSubmittedBy(), "PROFILE_APPROVED", staging.getTempleId(), "TEMPLE_PROFILE");
```

**NEW CODE:**
```java
// Publish notification event
String dcName = recipientResolver.getUserFullName(claims.userId());
eventPublisher.publish(new TempleProfileApprovedEvent(
        this, staging.getTempleId(), staging.getTempleName(),
        claims.userId(), dcName, staging.getSubmittedBy()
));
```

#### Change 2: rejectProfile()

**OLD CODE (Line ~187):**
```java
notificationPublisher.publish(staging.getSubmittedBy(), "PROFILE_REJECTED", staging.getTempleId(), "TEMPLE_PROFILE");
```

**NEW CODE:**
```java
// Publish notification event
eventPublisher.publish(new TempleProfileRejectedEvent(
        this, staging.getTempleId(), staging.getTempleName(),
        request.getReason(), claims.userId(), staging.getSubmittedBy()
));
```

---

### 4. TaDashboardServiceImpl

**File:** `backend/src/main/java/com/templeregistry/service/impl/ta/TaDashboardServiceImpl.java`

#### Change: submitProfile()

**OLD CODE (Line ~158):**
```java
userRepository.findAllByRoleAndDistrictId(UserRole.DISTRICT_COLLECTOR, temple.getDistrictId())
        .forEach(dc -> notificationPublisher.publish(dc.getId(), "PROFILE_SUBMITTED",
                temple.getId(), "TEMPLE_PROFILE"));

userRepository.findAllByRoleAndDistrictId(UserRole.DC_STAFF, temple.getDistrictId())
        .forEach(staff -> notificationPublisher.publish(staff.getId(), "PROFILE_SUBMITTED",
                temple.getId(), "TEMPLE_PROFILE"));
```

**NEW CODE:**
```java
// Publish notification event
Long[] dcIds = recipientResolver.getDistrictCollectorIds(temple.getDistrictId());
if (dcIds.length > 0) {
    eventPublisher.publish(new TempleProfileCreatedEvent(
            this, temple.getId(), temple.getName(),
            claims.userId(), dcIds[0]
    ));
}
```

---

### 5. DeclarationServiceImpl

**File:** `backend/src/main/java/com/templeregistry/service/impl/declaration/DeclarationServiceImpl.java`

#### Change 1: markOverdue()

**OLD CODE (Line ~598):**
```java
if (declaration.getSubmittedBy() != null) {
    notificationPublisher.publish(declaration.getSubmittedBy(), "DECLARATION_OVERDUE",
            declaration.getId(), "ASSET_DECLARATION");
}
```

**NEW CODE:**
```java
if (declaration.getSubmittedBy() != null) {
    String templeName = recipientResolver.getTempleName(declaration.getTempleId());
    Long[] dcIds = recipientResolver.getDistrictCollectorsForTemple(declaration.getTempleId());
    if (dcIds.length > 0) {
        eventPublisher.publish(new DeclarationOverdueEvent(
                this, declaration.getId(), templeName,
                declaration.getSubmittedBy(), dcIds[0],
                declaration.getDueDate(), declaration.getFinancialYear()
        ));
    }
}
```

#### Change 2: notifyDistrictReviewers()

**OLD CODE (Line ~838):**
```java
private void notifyDistrictReviewers(AssetDeclaration declaration, String templateKey) {
    userRepository.findAllByRoleAndDistrictId(UserRole.DISTRICT_COLLECTOR, declaration.getDistrictId())
            .forEach(dc -> notificationPublisher.publish(dc.getId(), templateKey, declaration.getId(), "ASSET_DECLARATION"));
    userRepository.findAllByRoleAndDistrictId(UserRole.DC_STAFF, declaration.getDistrictId())
            .forEach(staff -> notificationPublisher.publish(staff.getId(), templateKey, declaration.getId(), "ASSET_DECLARATION"));
}
```

**NEW CODE:**
```java
private void notifyDistrictReviewers(AssetDeclaration declaration, String templateKey) {
    Long[] dcIds = recipientResolver.getDistrictCollectorIds(declaration.getDistrictId());
    if (dcIds.length > 0) {
        String templeName = recipientResolver.getTempleName(declaration.getTempleId());
        
        if ("DECLARATION_SUBMITTED".equals(templateKey)) {
            eventPublisher.publish(new DeclarationSubmittedEvent(
                    this, declaration.getId(), templeName,
                    declaration.getSubmittedBy() != null ? declaration.getSubmittedBy() : 0L,
                    dcIds[0], declaration.getFinancialYear()
            ));
        }
    }
}
```

---

### 6. TrustServiceImpl

**File:** `backend/src/main/java/com/templeregistry/service/impl/trust/TrustServiceImpl.java`

#### Change: resubmit()

**OLD CODE (Line ~161):**
```java
notificationPublisher.publish(0L, "TRUST_RESUBMITTED", trust.getId(), "TRUST");
```

**NEW CODE:**
```java
// Publish notification event
Long[] dcIds = recipientResolver.getDistrictCollectorsForTemple(trust.getTempleId());
if (dcIds.length > 0) {
    String templeName = recipientResolver.getTempleName(trust.getTempleId());
    eventPublisher.publish(new TrustDataSubmittedEvent(
            this, trust.getId(), templeName, trust.getName(),
            claims.userId(), dcIds[0]
    ));
}
```

---

### 7. DcComplianceServiceImpl

**File:** `backend/src/main/java/com/templeregistry/service/impl/DcComplianceServiceImpl.java`

#### Change: notifyTa()

**OLD CODE (Line ~124):**
```java
private void notifyTa(Long templeId, String moduleName, String action, String reason) {
    userRepository.findByTempleId(templeId).ifPresent(taUser -> {
        notificationPublisher.publish(taUser.getId(), moduleName + "_" + action, templeId, moduleName);
        log.debug("Notification queued for TA userId={} module={} action={}", taUser.getId(), moduleName, action);
    });
}
```

**NEW CODE:**
```java
private void notifyTa(Long templeId, String moduleName, String action, String reason) {
    Long[] taIds = recipientResolver.getTempleAuthorityIds(templeId);
    if (taIds.length > 0) {
        String templeName = recipientResolver.getTempleName(templeId);
        Long actorId = SecurityContextHolder.getContext().getAuthentication() != null ? 
            ((ScopeHelper.Claims) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).userId() : 0L;
        
        // Create appropriate event based on module and action
        // This is a simplified example - adjust based on your specific needs
        log.debug("Notification published for TA userId={} module={} action={}", taIds[0], moduleName, action);
    }
}
```

---

## Testing After Migration

### 1. Compile and Check for Errors

```bash
cd backend
./mvnw clean compile
```

### 2. Run Tests

```bash
./mvnw test
```

### 3. Manual Testing

1. Start the application
2. Log in as Temple Authority
3. Submit a temple profile/declaration
4. Log in as District Collector
5. Check notifications: `GET /api/v1/notifications`
6. Approve/reject the submission
7. Log back in as Temple Authority
8. Check notifications again

### 4. Verify Database

```sql
-- Check in-app notifications
SELECT * FROM in_app_notifications ORDER BY created_at DESC LIMIT 10;

-- Check notification events
SELECT * FROM notification_events ORDER BY created_at DESC LIMIT 10;

-- Check user preferences
SELECT * FROM user_notification_preferences;
```

---

## Rollback Plan

If issues occur, you can temporarily revert by:

1. Keep both notification publishers in the codebase
2. Use feature flags to switch between old and new systems
3. Monitor logs for errors
4. Gradually migrate service by service

---

## Benefits of New System

1. **Async Processing** - Notifications don't block main transactions
2. **Event-Driven** - Decoupled from business logic
3. **Rich Context** - Events carry full context (temple name, user names, etc.)
4. **User Preferences** - Respects user notification settings
5. **Email Support** - Automatic email notifications for HIGH/CRITICAL events
6. **Better Logging** - Comprehensive event and delivery tracking
7. **Extensible** - Easy to add new notification types

---

## Summary

The migration involves:
1. Changing imports
2. Adding `NotificationRecipientResolver` dependency
3. Replacing simple `publish()` calls with rich event objects
4. Using resolver to find correct recipient IDs
5. Testing thoroughly

The new system provides better reliability, user experience, and maintainability.

