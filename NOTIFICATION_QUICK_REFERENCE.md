# Notification System - Quick Reference Card

## 🚀 Quick Start

### Add to Any Service

```java
@Service
@RequiredArgsConstructor
public class YourServiceImpl {
    private final com.templeregistry.service.notification.NotificationEventPublisher eventPublisher;
    private final NotificationRecipientResolver recipientResolver;
}
```

### Publish Notification

```java
// After updating entity state
Long[] dcIds = recipientResolver.getDistrictCollectorsForTemple(templeId);
if (dcIds.length > 0) {
    eventPublisher.publish(new SomeEvent(...));
}
```

---

## 📦 Available Events

### Temple Events
```java
new TempleProfileCreatedEvent(this, templeId, templeName, taUserId, dcUserId)
new TempleProfileApprovedEvent(this, templeId, templeName, dcUserId, dcName, taUserId)
new TempleProfileRejectedEvent(this, templeId, templeName, reason, dcUserId, taUserId)
new TempleProfileFlaggedEvent(this, templeId, templeName, reason, dcUserId, taUserId)
new TempleProfileUpdatedEvent(this, templeId, templeName, taUserId, dcUserId)
```

### Trust Events
```java
new TrustDataSubmittedEvent(this, trustId, templeName, trustName, taUserId, dcUserId)
new TrustDataApprovedEvent(this, trustId, templeName, trustName, dcUserId, dcName, taUserId)
new TrustDataRejectedEvent(this, trustId, templeName, trustName, reason, dcUserId, taUserId)
new TrustDataFlaggedEvent(this, trustId, templeName, trustName, reason, dcUserId, taUserId)
new TrustDataUpdatedEvent(this, trustId, templeName, trustName, taUserId, dcUserId)
```

### Declaration Events
```java
new DeclarationSubmittedEvent(this, declId, templeName, taUserId, dcUserId, financialYear)
new DeclarationApprovedEvent(this, declId, templeName, dcUserId, taUserId, ackNumber, financialYear)
new DeclarationRejectedEvent(this, declId, templeName, dcUserId, taUserId, reason, financialYear)
new ClarificationRequestedEvent(this, declId, templeName, dcUserId, taUserId, message, financialYear)
new ClarificationRespondedEvent(this, declId, templeName, taUserId, dcUserId, financialYear)
new DeclarationOverdueEvent(this, declId, templeName, taUserId, dcUserId, dueDate, financialYear)
```

### Board Member Events
```java
new BoardMemberAddedEvent(this, memberId, trustName, memberName, designation, taUserId, dcUserId)
new BoardMemberUpdatedEvent(this, memberId, trustName, memberName, taUserId, dcUserId)
new BoardMemberApprovedEvent(this, memberId, trustName, memberName, dcUserId, taUserId)
new BoardMemberRejectedEvent(this, memberId, trustName, memberName, reason, dcUserId, taUserId)
new BoardMemberRemovedEvent(this, memberId, trustName, memberName, taUserId, dcUserId)
```

### Employee Events
```java
new EmployeeCreatedEvent(this, empId, templeName, empName, designation, taUserId, dcUserId)
new EmployeeUpdatedEvent(this, empId, templeName, empName, taUserId, dcUserId)
new EmployeeDeletedEvent(this, empId, templeName, empName, taUserId, dcUserId)
```

### Contractor Events
```java
new ContractorCreatedEvent(this, contractorId, templeName, contractorName, serviceType, taUserId, dcUserId)
new ContractorUpdatedEvent(this, contractorId, templeName, contractorName, taUserId, dcUserId)
new ContractorDeletedEvent(this, contractorId, templeName, contractorName, taUserId, dcUserId)
```

### Document Events
```java
new DocumentUploadedEvent(this, docId, templeName, docType, taUserId, dcUserId)
new DocumentUpdatedEvent(this, docId, templeName, docType, taUserId, dcUserId)
new DocumentDeletedEvent(this, docId, templeName, docType, taUserId, dcUserId)
```

---

## 🔍 Recipient Resolver Methods

```java
// Get DC user IDs for a district
Long[] dcIds = recipientResolver.getDistrictCollectorIds(districtId);

// Get TA user IDs for a temple
Long[] taIds = recipientResolver.getTempleAuthorityIds(templeId);

// Get DC user IDs for a temple's district
Long[] dcIds = recipientResolver.getDistrictCollectorsForTemple(templeId);

// Get temple name
String templeName = recipientResolver.getTempleName(templeId);

// Get user's full name
String userName = recipientResolver.getUserFullName(userId);

// Get district ID for a temple
Long districtId = recipientResolver.getDistrictIdForTemple(templeId);
```

---

## 📝 Common Patterns

### Pattern 1: TA Action → Notify DC

```java
@Transactional
public void submitSomething(Long entityId, ScopeHelper.Claims claims) {
    // 1. Update entity
    entity.setStatus(Status.SUBMITTED);
    repository.save(entity);
    
    // 2. Notify DC
    Long[] dcIds = recipientResolver.getDistrictCollectorsForTemple(entity.getTempleId());
    if (dcIds.length > 0) {
        String templeName = recipientResolver.getTempleName(entity.getTempleId());
        eventPublisher.publish(new SomethingSubmittedEvent(
                this, entityId, templeName, claims.userId(), dcIds[0], ...
        ));
    }
}
```

### Pattern 2: DC Action → Notify TA

```java
@Transactional
public void approveSomething(Long entityId, ScopeHelper.Claims claims) {
    // 1. Update entity
    entity.setStatus(Status.APPROVED);
    repository.save(entity);
    
    // 2. Notify TA
    Long[] taIds = recipientResolver.getTempleAuthorityIds(entity.getTempleId());
    if (taIds.length > 0) {
        String templeName = recipientResolver.getTempleName(entity.getTempleId());
        String dcName = recipientResolver.getUserFullName(claims.userId());
        eventPublisher.publish(new SomethingApprovedEvent(
                this, entityId, templeName, claims.userId(), dcName, taIds[0], ...
        ));
    }
}
```

### Pattern 3: System Action → Notify Both

```java
@Scheduled(cron = "0 0 9 * * *")  // Daily at 9 AM
public void checkOverdue() {
    List<Declaration> overdue = findOverdueDeclarations();
    
    for (Declaration decl : overdue) {
        Long[] taIds = recipientResolver.getTempleAuthorityIds(decl.getTempleId());
        Long[] dcIds = recipientResolver.getDistrictCollectorsForTemple(decl.getTempleId());
        
        if (taIds.length > 0 && dcIds.length > 0) {
            String templeName = recipientResolver.getTempleName(decl.getTempleId());
            eventPublisher.publish(new DeclarationOverdueEvent(
                    this, decl.getId(), templeName, taIds[0], dcIds[0],
                    decl.getDueDate(), decl.getFinancialYear()
            ));
        }
    }
}
```

---

## 🎯 API Endpoints

### Get Notifications
```http
GET /api/v1/notifications?page=0&size=20
```

### Get Unread Count
```http
GET /api/v1/notifications/unread-count
```

### Mark as Read
```http
PUT /api/v1/notifications/{id}/read
```

### Mark All as Read
```http
PUT /api/v1/notifications/read-all
```

### Delete Notification
```http
DELETE /api/v1/notifications/{id}
```

### Get Preferences
```http
GET /api/v1/notification-preferences
```

### Update Preferences
```http
PUT /api/v1/notification-preferences
Content-Type: application/json

{
  "moduleType": "DECLARATION",
  "inAppEnabled": true,
  "emailEnabled": true
}
```

---

## 🐛 Debugging

### Check if Event is Published
```java
log.info("Publishing notification event: {}", event.getClass().getSimpleName());
eventPublisher.publish(event);
```

### Check if Event is Received
Look for logs from `NotificationEventListener`:
```
Processing notification event: type=[DeclarationSubmittedEvent] entityId=[123] priority=[HIGH]
```

### Check Database
```sql
-- Check in-app notifications
SELECT * FROM in_app_notifications 
WHERE user_id = ? 
ORDER BY created_at DESC 
LIMIT 10;

-- Check notification events
SELECT * FROM notification_events 
WHERE recipient_id = ? 
ORDER BY created_at DESC 
LIMIT 10;

-- Check user preferences
SELECT * FROM user_notification_preferences 
WHERE user_id = ?;
```

### Common Issues

**No notification appearing:**
- Check if event is published (add log)
- Check if recipient ID is correct
- Check user preferences (module enabled?)
- Check database for notification record

**Wrong recipient:**
- Verify temple-to-district mapping
- Check user role assignments
- Use recipientResolver methods correctly

**Email not sending:**
- Check SMTP configuration
- Verify email enabled in preferences
- Check priority (only HIGH/CRITICAL send emails)
- Check email service logs

---

## ⚙️ Configuration

### Development (Disable Email)
```yaml
# application-dev.yml
app:
  notification:
    in-app-enabled: true
    email-enabled: false

spring:
  mail:
    enabled: false
```

### Production (Enable Email)
```yaml
# application.yml
app:
  notification:
    in-app-enabled: true
    email-enabled: true
    email-mode: ASYNC

spring:
  mail:
    enabled: true
    host: ${SMTP_HOST}
    port: ${SMTP_PORT}
    username: ${SMTP_USERNAME}
    password: ${SMTP_PASSWORD}
    from: ${SMTP_FROM}
```

---

## 📊 Notification Priority

- **LOW** - Informational (e.g., employee added)
- **MEDIUM** - Important (e.g., board member added)
- **HIGH** - Requires attention (e.g., declaration submitted, approved, rejected)
- **CRITICAL** - Urgent (e.g., system alerts, security issues)

**Email Behavior:**
- LOW/MEDIUM: In-app only
- HIGH/CRITICAL: In-app + Email (if enabled)

---

## 📚 Full Documentation

- **NOTIFICATION_MODULE_FINAL_SUMMARY.md** - Complete overview
- **NOTIFICATION_MODULE_COMPLETE_IMPLEMENTATION.md** - Detailed integration guide
- **NOTIFICATION_MIGRATION_GUIDE.md** - Migrate from old system
- **NOTIFICATION_INTEGRATION_EXAMPLE.md** - Code examples

---

## ✅ Integration Checklist

- [ ] Add `NotificationEventPublisher` dependency
- [ ] Add `NotificationRecipientResolver` dependency
- [ ] Publish event after state change
- [ ] Use correct event class
- [ ] Resolve recipient IDs correctly
- [ ] Test notification appears
- [ ] Test email (if HIGH/CRITICAL)
- [ ] Test user preferences
- [ ] Add logging for debugging

---

## 🎉 You're Done!

The notification system is fully implemented. Just add the two dependencies and publish events after state changes. The system handles everything else automatically!

