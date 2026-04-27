# Notification System - Quick Start Guide

## 🚀 Quick Integration

### 1. Add to Your Service

```java
@Service
@RequiredArgsConstructor
public class YourService {
    
    private final NotificationEventPublisher notificationPublisher;
    
    public void yourMethod() {
        // Your business logic here
        
        // Publish notification event
        notificationPublisher.publish(new YourEvent(
            this,
            entityId,
            entityName,
            actorUserId,
            recipientUserId
        ));
    }
}
```

### 2. Available Events by Module

#### Temple Profile
```java
// TA → DC
new TempleProfileCreatedEvent(this, templeId, templeName, taUserId, dcUserId)
new TempleProfileUpdatedEvent(this, templeId, templeName, taUserId, dcUserId)

// DC → TA
new TempleProfileApprovedEvent(this, templeId, templeName, dcUserId, dcName, taUserId)
new TempleProfileRejectedEvent(this, templeId, templeName, dcUserId, dcName, taUserId, reason)
new TempleProfileFlaggedEvent(this, templeId, templeName, dcUserId, dcName, taUserId, message)
```

#### Trust & Board
```java
// TA → DC
new TrustDataSubmittedEvent(this, trustId, templeName, trustName, taUserId, dcUserId)
new TrustDataUpdatedEvent(this, trustId, templeName, trustName, taUserId, dcUserId)

// DC → TA
new TrustDataApprovedEvent(this, trustId, templeName, trustName, dcUserId, dcName, taUserId)
new TrustDataRejectedEvent(this, trustId, templeName, trustName, dcUserId, dcName, taUserId, reason)
new TrustDataFlaggedEvent(this, trustId, templeName, trustName, dcUserId, dcName, taUserId, message)
```

#### Employees
```java
// TA → DC (All LOW priority)
new EmployeeCreatedEvent(this, empId, templeName, empName, designation, taUserId, dcUserId)
new EmployeeUpdatedEvent(this, empId, templeName, empName, designation, taUserId, dcUserId)
new EmployeeDeletedEvent(this, empId, templeName, empName, designation, taUserId, dcUserId)
```

#### Contractors
```java
// TA → DC (All LOW priority)
new ContractorCreatedEvent(this, contractorId, templeName, contractorName, serviceType, taUserId, dcUserId)
new ContractorUpdatedEvent(this, contractorId, templeName, contractorName, serviceType, taUserId, dcUserId)
new ContractorDeletedEvent(this, contractorId, templeName, contractorName, serviceType, taUserId, dcUserId)
```

#### Declarations
```java
// TA → DC
new DeclarationSubmittedEvent(this, declId, templeName, taUserId, dcUserId, financialYear)
new DeclarationUpdatedEvent(this, declId, templeName, taUserId, dcUserId, financialYear)

// DC → TA
new DeclarationApprovedEvent(this, declId, templeName, dcUserId, dcName, taUserId, financialYear)
new DeclarationRejectedEvent(this, declId, templeName, dcUserId, dcName, taUserId, reason, financialYear)
new DeclarationFlaggedEvent(this, declId, templeName, dcUserId, dcName, taUserId, message, financialYear)
new DeclarationMarkedForPhysicalVisitEvent(this, declId, templeName, dcUserId, dcName, taUserId, scheduledDate, financialYear)
```

#### Documents
```java
// TA → DC (All LOW priority)
new DocumentUploadedEvent(this, docId, templeName, docType, docName, taUserId, dcUserId)
new DocumentUpdatedEvent(this, docId, templeName, docType, docName, taUserId, dcUserId)
new DocumentDeletedEvent(this, docId, templeName, docType, docName, taUserId, dcUserId)
```

### 3. Priority Levels

| Priority | Email Sent? | Use Case |
|----------|-------------|----------|
| LOW | ❌ No | Informational updates (employees, contractors, documents) |
| MEDIUM | ❌ No | Standard submissions and updates |
| HIGH | ✅ Yes | Approvals, clarifications, important submissions |
| CRITICAL | ✅ Yes | Rejections, urgent actions required |

### 4. Email Configuration

Add to `application.yml`:

```yaml
spring:
  mail:
    enabled: true
    host: smtp.gmail.com
    port: 587
    username: ${SMTP_USERNAME}
    password: ${SMTP_PASSWORD}
    from: noreply@templeregistry.gov.in

app:
  base-url: ${APP_BASE_URL:http://localhost:3000}
```

### 5. Common Patterns

#### Get District Collector for Temple
```java
Temple temple = templeRepository.findById(templeId).orElseThrow();
User dc = userRepository.findDistrictCollectorByDistrictId(temple.getDistrictId())
        .orElse(null);

if (dc != null) {
    notificationPublisher.publish(new YourEvent(..., dc.getId()));
}
```

#### Get Temple Authority (Creator)
```java
Temple temple = templeRepository.findById(templeId).orElseThrow();
Long taUserId = temple.getCreatedBy();

notificationPublisher.publish(new YourEvent(..., taUserId));
```

#### Get Current User Name
```java
User currentUser = userRepository.findById(userId).orElseThrow();
String userName = currentUser.getFullName();

notificationPublisher.publish(new YourEvent(..., userName, ...));
```

### 6. Testing

#### Test Email
```bash
curl -X POST "http://localhost:8080/api/admin/email/test?email=test@example.com" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Check Notifications
```bash
curl -X GET "http://localhost:8080/api/notifications" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. Checklist for Integration

- [ ] Inject `NotificationEventPublisher` in your service
- [ ] Identify all events that should trigger notifications
- [ ] Get recipient user ID (DC or TA)
- [ ] Publish event after successful operation
- [ ] Use `@Transactional` to ensure atomicity
- [ ] Handle null recipients gracefully
- [ ] Test with both in-app and email notifications
- [ ] Verify notification appears in user's inbox
- [ ] Check email delivery logs for errors

### 8. Module-Specific Notes

#### Temple Profile
- Always notify DC when TA creates/updates
- Always notify TA when DC approves/rejects/flags
- Include temple name in all notifications

#### Trust & Board
- Similar to Temple Profile
- Include both temple name and trust name
- High priority for submissions (requires review)

#### Employees & Contractors
- Low priority (informational only)
- No email notifications
- Notify DC of all changes

#### Declarations
- High priority for submissions and updates
- Critical priority for rejections
- Special event for physical site visits
- Include financial year in all notifications

#### Documents
- Low priority (informational only)
- Notify DC of uploads, updates, and deletions
- Include document type and name

### 9. Common Mistakes to Avoid

❌ **Don't** publish events before saving to database
```java
notificationPublisher.publish(event);  // ❌ Entity not saved yet
entityRepository.save(entity);
```

✅ **Do** publish events after successful save
```java
Entity saved = entityRepository.save(entity);
notificationPublisher.publish(event);  // ✅ Entity saved
```

❌ **Don't** ignore null recipients
```java
notificationPublisher.publish(new Event(..., null));  // ❌ Will log warning
```

✅ **Do** check for null before publishing
```java
if (dc != null) {
    notificationPublisher.publish(new Event(..., dc.getId()));  // ✅ Safe
}
```

❌ **Don't** use wrong priority
```java
new EmployeeCreatedEvent(..., NotificationPriority.CRITICAL);  // ❌ Too high
```

✅ **Do** use appropriate priority
```java
new EmployeeCreatedEvent(...);  // ✅ Uses LOW priority by default
```

### 10. Support

For issues or questions:
1. Check `NOTIFICATION_MODULE_IMPLEMENTATION.md` for detailed documentation
2. Review email delivery logs: `SELECT * FROM email_delivery_logs WHERE status = 'FAILED'`
3. Check notification events: `SELECT * FROM notification_events ORDER BY dispatched_at DESC`
4. Verify user preferences: `SELECT * FROM user_notification_preferences WHERE user_id = ?`

## 📊 Notification Flow Diagram

```
┌─────────────────┐
│  Service Layer  │
│  (Your Code)    │
└────────┬────────┘
         │ publish(event)
         ↓
┌─────────────────────┐
│ NotificationEvent   │
│ Publisher           │
└────────┬────────────┘
         │
         ↓
┌─────────────────────┐
│ NotificationEvent   │
│ Listener (Async)    │
└────────┬────────────┘
         │
         ↓
┌─────────────────────┐
│ NotificationDispatch│
│ Service             │
└────────┬────────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌──────────┐
│In-App  │ │  Email   │
│Notif.  │ │  Service │
└────────┘ └──────────┘
```

## 🎯 Quick Examples

### Example 1: Temple Creation
```java
@Transactional
public TempleDTO createTemple(CreateTempleRequest request, Long userId) {
    Temple temple = mapToEntity(request);
    Temple saved = templeRepository.save(temple);
    
    User dc = userRepository.findDistrictCollectorByDistrictId(saved.getDistrictId())
            .orElse(null);
    
    if (dc != null) {
        notificationPublisher.publish(new TempleProfileCreatedEvent(
            this, saved.getId(), saved.getName(), userId, dc.getId()
        ));
    }
    
    return mapToDTO(saved);
}
```

### Example 2: Declaration Approval
```java
@Transactional
public DeclarationDTO approveDeclaration(Long declarationId, Long dcUserId) {
    Declaration declaration = declarationRepository.findById(declarationId)
            .orElseThrow(() -> new EntityNotFoundException("Declaration not found"));
    
    declaration.setStatus(DeclarationStatus.APPROVED);
    Declaration saved = declarationRepository.save(declaration);
    
    User dc = userRepository.findById(dcUserId).orElseThrow();
    Temple temple = saved.getTemple();
    
    notificationPublisher.publish(new DeclarationApprovedEvent(
        this,
        saved.getId(),
        temple.getName(),
        dcUserId,
        dc.getFullName(),
        temple.getCreatedBy(),
        saved.getFinancialYear()
    ));
    
    return mapToDTO(saved);
}
```

### Example 3: Document Upload
```java
@Transactional
public DocumentDTO uploadDocument(MultipartFile file, UploadDocumentRequest request, Long userId) {
    // Upload file to S3
    String s3Key = s3Service.uploadFile(file);
    
    Document document = Document.builder()
            .templeId(request.getTempleId())
            .documentType(request.getDocumentType())
            .fileName(file.getOriginalFilename())
            .s3Key(s3Key)
            .build();
    
    Document saved = documentRepository.save(document);
    
    Temple temple = templeRepository.findById(request.getTempleId()).orElseThrow();
    User dc = userRepository.findDistrictCollectorByDistrictId(temple.getDistrictId())
            .orElse(null);
    
    if (dc != null) {
        notificationPublisher.publish(new DocumentUploadedEvent(
            this,
            saved.getId(),
            temple.getName(),
            saved.getDocumentType(),
            saved.getFileName(),
            userId,
            dc.getId()
        ));
    }
    
    return mapToDTO(saved);
}
```

---

**That's it!** You're ready to integrate notifications into your module. 🎉
