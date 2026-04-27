# Complete Notification Module Implementation

## ✅ What Has Been Implemented

### 1. Database Schema
- ✅ `in_app_notifications` table with priority, category, action_url
- ✅ `notification_events` table for event tracking
- ✅ `user_notification_preferences` table
- ✅ `email_delivery_logs` table
- ✅ All necessary indexes

### 2. Entity Classes
- ✅ InAppNotification
- ✅ NotificationEvent
- ✅ NotificationPreference
- ✅ EmailDeliveryLog

### 3. Event System
- ✅ BaseNotificationEvent (base class)
- ✅ NotificationEventListener (async listener)
- ✅ NotificationEventPublisher (event publisher)
- ✅ NotificationDispatchServiceImpl (complete implementation)

### 4. All Event Classes Created

#### Temple Events ✅
- TempleProfileCreatedEvent
- TempleProfileApprovedEvent
- TempleProfileRejectedEvent
- TempleProfileFlaggedEvent
- TempleProfileUpdatedEvent

#### Trust Events ✅
- TrustDataSubmittedEvent
- TrustDataApprovedEvent
- TrustDataRejectedEvent
- TrustDataFlaggedEvent
- TrustDataUpdatedEvent

#### Declaration Events ✅
- DeclarationSubmittedEvent
- DeclarationApprovedEvent
- DeclarationRejectedEvent
- DeclarationFlaggedEvent
- DeclarationUpdatedEvent
- ClarificationRequestedEvent
- ClarificationRespondedEvent
- DeclarationMarkedForPhysicalVisitEvent
- SiteVisitScheduledEvent
- DeadlineApproachingEvent
- DeclarationOverdueEvent

#### Board Member Events ✅ (NEWLY CREATED)
- BoardMemberAddedEvent
- BoardMemberUpdatedEvent
- BoardMemberApprovedEvent
- BoardMemberRejectedEvent
- BoardMemberRemovedEvent

#### Employee Events ✅
- EmployeeCreatedEvent
- EmployeeUpdatedEvent
- EmployeeDeletedEvent

#### Contractor Events ✅
- ContractorCreatedEvent
- ContractorUpdatedEvent
- ContractorDeletedEvent

#### Document Events ✅
- DocumentUploadedEvent
- DocumentUpdatedEvent
- DocumentDeletedEvent

### 5. Services
- ✅ NotificationService (query, mark as read, delete)
- ✅ NotificationPreferenceService (user preferences)
- ✅ NotificationDispatchServiceImpl (complete with email integration)
- ✅ NotificationRecipientResolver (find DC/TA users)
- ✅ NotificationHelper
- ✅ EmailService

### 6. Controllers
- ✅ NotificationController
- ✅ NotificationPreferenceController

---

## 🔨 Service Integration Required

The following services need to publish notification events. Below is the exact integration code for each service.

### Integration Pattern

For each service method that should trigger notifications:

1. **Add dependency injection:**
   ```java
   private final com.templeregistry.service.notification.NotificationEventPublisher eventPublisher;
   ```

2. **After state change, publish event:**
   ```java
   eventPublisher.publish(new SomeEvent(...));
   ```

3. **Use NotificationRecipientResolver to find recipients:**
   ```java
   private final NotificationRecipientResolver recipientResolver;
   
   Long[] dcIds = recipientResolver.getDistrictCollectorsForTemple(templeId);
   Long[] taIds = recipientResolver.getTempleAuthorityIds(templeId);
   ```

---

## Service Integration Code

### 1. TempleServiceImpl

**File:** `backend/src/main/java/com/templeregistry/service/impl/temple/TempleServiceImpl.java`

**Add to constructor:**
```java
private final com.templeregistry.service.notification.NotificationEventPublisher notificationEventPublisher;
private final NotificationRecipientResolver recipientResolver;
```

**In `create()` method, after temple is saved:**
```java
// Publish notification event
Long[] dcIds = recipientResolver.getDistrictCollectorsForTemple(temple.getId());
if (dcIds.length > 0) {
    notificationEventPublisher.publish(new TempleProfileCreatedEvent(
            this,
            temple.getId(),
            temple.getName(),
            claims.userId(),
            dcIds[0]  // Primary DC
    ));
}
```

**In `update()` method, after temple is saved:**
```java
// Publish notification event
Long[] dcIds = recipientResolver.getDistrictCollectorsForTemple(temple.getId());
if (dcIds.length > 0) {
    notificationEventPublisher.publish(new TempleProfileUpdatedEvent(
            this,
            temple.getId(),
            temple.getName(),
            claims.userId(),
            dcIds[0]
    ));
}
```

---

### 2. TrustServiceImpl

**File:** `backend/src/main/java/com/templeregistry/service/impl/trust/TrustServiceImpl.java`

**Add to constructor:**
```java
private final com.templeregistry.service.notification.NotificationEventPublisher notificationEventPublisher;
private final NotificationRecipientResolver recipientResolver;
```

**In `create()` method, after trust is saved:**
```java
// Publish notification event
Long[] dcIds = recipientResolver.getDistrictCollectorsForTemple(trust.getTempleId());
if (dcIds.length > 0) {
    String templeName = recipientResolver.getTempleName(trust.getTempleId());
    notificationEventPublisher.publish(new TrustDataSubmittedEvent(
            this,
            trust.getId(),
            templeName,
            trust.getName(),
            claims.userId(),
            dcIds[0]
    ));
}
```

**In `update()` method, after trust is saved:**
```java
// Publish notification event
Long[] dcIds = recipientResolver.getDistrictCollectorsForTemple(trust.getTempleId());
if (dcIds.length > 0) {
    String templeName = recipientResolver.getTempleName(trust.getTempleId());
    notificationEventPublisher.publish(new TrustDataUpdatedEvent(
            this,
            trust.getId(),
            templeName,
            trust.getName(),
            claims.userId(),
            dcIds[0]
    ));
}
```

---

### 3. DeclarationServiceImpl

**File:** `backend/src/main/java/com/templeregistry/service/impl/declaration/DeclarationServiceImpl.java`

**Add to constructor:**
```java
private final com.templeregistry.service.notification.NotificationEventPublisher notificationEventPublisher;
private final NotificationRecipientResolver recipientResolver;
```

**In `submit()` method, after declaration status is updated:**
```java
// Publish notification event
Long[] dcIds = recipientResolver.getDistrictCollectorsForTemple(declaration.getTempleId());
if (dcIds.length > 0) {
    String templeName = recipientResolver.getTempleName(declaration.getTempleId());
    notificationEventPublisher.publish(new DeclarationSubmittedEvent(
            this,
            declaration.getId(),
            templeName,
            claims.userId(),
            dcIds[0],
            declaration.getFinancialYear()
    ));
}
```

---

### 4. GovernanceWorkflowServiceImpl

**File:** `backend/src/main/java/com/templeregistry/service/impl/governance/GovernanceWorkflowServiceImpl.java`

**Replace old notification publisher with new one:**

**Change import from:**
```java
import com.templeregistry.service.dc.NotificationEventPublisher;
```

**To:**
```java
import com.templeregistry.service.notification.NotificationEventPublisher;
import com.templeregistry.event.trust.*;
import com.templeregistry.event.declaration.*;
```

**Add to constructor:**
```java
private final NotificationRecipientResolver recipientResolver;
```

**In `approveTrust()` method, replace old notification with:**
```java
// Publish notification event
Long[] taIds = recipientResolver.getTempleAuthorityIds(trust.getTempleId());
if (taIds.length > 0) {
    String templeName = recipientResolver.getTempleName(trust.getTempleId());
    String dcName = recipientResolver.getUserFullName(claims.userId());
    notificationEventPublisher.publish(new TrustDataApprovedEvent(
            this,
            trust.getId(),
            templeName,
            trust.getName(),
            claims.userId(),
            dcName,
            taIds[0]
    ));
}
```

**In `rejectTrust()` method, replace old notification with:**
```java
// Publish notification event
Long[] taIds = recipientResolver.getTempleAuthorityIds(trust.getTempleId());
if (taIds.length > 0) {
    String templeName = recipientResolver.getTempleName(trust.getTempleId());
    notificationEventPublisher.publish(new TrustDataRejectedEvent(
            this,
            trust.getId(),
            templeName,
            trust.getName(),
            request.getReason(),
            claims.userId(),
            taIds[0]
    ));
}
```

**In `approveDeclaration()` method, replace old notification with:**
```java
// Publish notification event
Long[] taIds = recipientResolver.getTempleAuthorityIds(declaration.getTempleId());
if (taIds.length > 0) {
    String templeName = recipientResolver.getTempleName(declaration.getTempleId());
    notificationEventPublisher.publish(new DeclarationApprovedEvent(
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

**In `rejectDeclaration()` method, replace old notification with:**
```java
// Publish notification event
Long[] taIds = recipientResolver.getTempleAuthorityIds(declaration.getTempleId());
if (taIds.length > 0) {
    String templeName = recipientResolver.getTempleName(declaration.getTempleId());
    notificationEventPublisher.publish(new DeclarationRejectedEvent(
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

**In `requestClarification()` method, replace old notification with:**
```java
// Publish notification event
Long[] taIds = recipientResolver.getTempleAuthorityIds(declaration.getTempleId());
if (taIds.length > 0) {
    String templeName = recipientResolver.getTempleName(declaration.getTempleId());
    notificationEventPublisher.publish(new ClarificationRequestedEvent(
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

---

### 5. EmployeeServiceImpl

**File:** `backend/src/main/java/com/templeregistry/service/impl/employee/EmployeeServiceImpl.java`

**Add to constructor:**
```java
private final com.templeregistry.service.notification.NotificationEventPublisher notificationEventPublisher;
private final NotificationRecipientResolver recipientResolver;
```

**In `create()` method, after employee is saved:**
```java
// Publish notification event
Long[] dcIds = recipientResolver.getDistrictCollectorsForTemple(employee.getTemple().getId());
if (dcIds.length > 0) {
    String templeName = employee.getTemple().getName();
    notificationEventPublisher.publish(new EmployeeCreatedEvent(
            this,
            employee.getId(),
            templeName,
            employee.getFullName(),
            employee.getDesignation(),
            claims.userId(),
            dcIds[0]
    ));
}
```

**In `update()` method, after employee is saved:**
```java
// Publish notification event
Long[] dcIds = recipientResolver.getDistrictCollectorsForTemple(employee.getTemple().getId());
if (dcIds.length > 0) {
    String templeName = employee.getTemple().getName();
    notificationEventPublisher.publish(new EmployeeUpdatedEvent(
            this,
            employee.getId(),
            templeName,
            employee.getFullName(),
            claims.userId(),
            dcIds[0]
    ));
}
```

---

### 6. ContractorServiceImpl

**File:** `backend/src/main/java/com/templeregistry/service/impl/contractor/ContractorServiceImpl.java`

**Add to constructor:**
```java
private final com.templeregistry.service.notification.NotificationEventPublisher notificationEventPublisher;
private final NotificationRecipientResolver recipientResolver;
```

**In `create()` method, after contractor is saved:**
```java
// Publish notification event
Long[] dcIds = recipientResolver.getDistrictCollectorsForTemple(contractor.getTemple().getId());
if (dcIds.length > 0) {
    String templeName = contractor.getTemple().getName();
    notificationEventPublisher.publish(new ContractorCreatedEvent(
            this,
            contractor.getId(),
            templeName,
            contractor.getName(),
            contractor.getServiceType(),
            claims.userId(),
            dcIds[0]
    ));
}
```

**In `update()` method, after contractor is saved:**
```java
// Publish notification event
Long[] dcIds = recipientResolver.getDistrictCollectorsForTemple(contractor.getTemple().getId());
if (dcIds.length > 0) {
    String templeName = contractor.getTemple().getName();
    notificationEventPublisher.publish(new ContractorUpdatedEvent(
            this,
            contractor.getId(),
            templeName,
            contractor.getName(),
            claims.userId(),
            dcIds[0]
    ));
}
```

---

### 7. DcTempleVerificationServiceImpl

**File:** `backend/src/main/java/com/templeregistry/service/impl/dc/DcTempleVerificationServiceImpl.java`

**Replace old notification publisher with new one:**

**Change import and add:**
```java
import com.templeregistry.service.notification.NotificationEventPublisher;
import com.templeregistry.event.temple.*;
```

**Add to constructor:**
```java
private final NotificationRecipientResolver recipientResolver;
```

**In `verifyTemple()` method, replace old notification with:**
```java
// Publish notification event
Long[] taIds = recipientResolver.getTempleAuthorityIds(temple.getId());
if (taIds.length > 0) {
    String dcName = recipientResolver.getUserFullName(claims.userId());
    notificationEventPublisher.publish(new TempleProfileApprovedEvent(
            this,
            temple.getId(),
            temple.getName(),
            claims.userId(),
            dcName,
            taIds[0]
    ));
}
```

**In `flagTemple()` method, replace old notification with:**
```java
// Publish notification event
Long[] taIds = recipientResolver.getTempleAuthorityIds(temple.getId());
if (taIds.length > 0) {
    notificationEventPublisher.publish(new TempleProfileFlaggedEvent(
            this,
            temple.getId(),
            temple.getName(),
            request.getReason(),
            claims.userId(),
            taIds[0]
    ));
}
```

**In `rejectTemple()` method (if exists), add:**
```java
// Publish notification event
Long[] taIds = recipientResolver.getTempleAuthorityIds(temple.getId());
if (taIds.length > 0) {
    notificationEventPublisher.publish(new TempleProfileRejectedEvent(
            this,
            temple.getId(),
            temple.getName(),
            reason,
            claims.userId(),
            taIds[0]
    ));
}
```

---

## Testing the Notification Module

### 1. Manual Testing

**Test Temple Profile Submission:**
```bash
# As Temple Authority
POST /api/v1/ta/temples
{
  "name": "Test Temple",
  "districtId": 1,
  ...
}

# As District Collector
GET /api/v1/notifications
# Should see: "New temple profile submitted: Test Temple"
```

**Test Declaration Approval:**
```bash
# As District Collector
POST /api/v1/dc/declarations/{id}/approve
{
  "remarks": "Approved"
}

# As Temple Authority
GET /api/v1/notifications
# Should see: "Declaration approved for FY 2024. Ack: ACK-2024-001"
```

### 2. Check Notification Preferences

```bash
# Get user preferences
GET /api/v1/notification-preferences

# Update preferences
PUT /api/v1/notification-preferences
{
  "moduleType": "DECLARATION",
  "inAppEnabled": true,
  "emailEnabled": true
}
```

### 3. Mark Notifications as Read

```bash
# Mark single notification as read
PUT /api/v1/notifications/{id}/read

# Mark all as read
PUT /api/v1/notifications/read-all
```

---

## Configuration

### Application Configuration

Add to `application.yml` or `application-dev.yml`:

```yaml
app:
  notification:
    in-app-enabled: true
    email-enabled: false  # Set to true in production
    email-mode: ASYNC
    email-retry-enabled: true
    email-max-retries: 3

spring:
  mail:
    enabled: false  # Set to true in production
    host: smtp.gmail.com
    port: 587
    username: ${SMTP_USERNAME}
    password: ${SMTP_PASSWORD}
    from: ${SMTP_FROM:noreply@templeregistry.gov.in}
```

---

## Summary

### ✅ Completed
1. All event classes created (Temple, Trust, Declaration, Board, Employee, Contractor, Document)
2. NotificationDispatchServiceImpl fully implemented
3. NotificationRecipientResolver fully implemented
4. Email service integration ready
5. Controllers for querying and managing notifications
6. User preference management

### 🔨 Next Steps
1. Integrate notification events into all services (code provided above)
2. Test end-to-end notification flow
3. Configure email settings for production
4. Create email templates (optional, for Phase 2)
5. Remove old notification system (`service.dc.NotificationEventPublisher`)

### 📊 Notification Flow

```
TA Action (Submit) → Event Published → Async Listener → Dispatch Service
                                                              ↓
                                                    Check User Preferences
                                                              ↓
                                                    ┌─────────┴─────────┐
                                                    ↓                   ↓
                                            In-App Notification    Email (if HIGH/CRITICAL)
                                                    ↓                   ↓
                                            Save to DB          Send via SMTP
                                                    ↓                   ↓
                                            DC sees notification  DC receives email
```

---

## API Endpoints

### Notification Endpoints
- `GET /api/v1/notifications` - Get user's notifications (paginated)
- `GET /api/v1/notifications/unread-count` - Get unread count
- `PUT /api/v1/notifications/{id}/read` - Mark as read
- `PUT /api/v1/notifications/read-all` - Mark all as read
- `DELETE /api/v1/notifications/{id}` - Delete notification

### Preference Endpoints
- `GET /api/v1/notification-preferences` - Get user preferences
- `PUT /api/v1/notification-preferences` - Update preferences

---

## Complete! 🎉

The notification module is now fully implemented and ready for integration into your services. Follow the service integration code above to enable notifications for all TA ↔ DC interactions.

