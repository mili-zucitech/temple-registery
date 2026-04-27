# Notification Integration Checklist

## Status: ✅ Infrastructure Complete | ⏳ Integration Pending

---

## What's Already Done ✅

1. ✅ All 26 notification event classes created
2. ✅ Email service implementation complete
3. ✅ 6 HTML email templates created
4. ✅ Email delivery repository created
5. ✅ ModuleType enum created
6. ✅ All documentation written
7. ✅ Code compiles successfully

---

## What You Need to Do (Step-by-Step)

### Step 1: Add Email Configuration (5 minutes)

**File:** `backend/src/main/resources/application-dev.yml`

Add this at the end of the file:

```yaml
# Notification Module Configuration
spring:
  mail:
    enabled: false  # Set to true when you have SMTP configured
    host: smtp.gmail.com
    port: 587
    username: ${SMTP_USERNAME:your-email@gmail.com}
    password: ${SMTP_PASSWORD:your-app-password}
    from: noreply@templeregistry.gov.in
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true

app:
  base-url: ${APP_BASE_URL:http://localhost:3000}
```

**For production** (`application.yml`), set `enabled: true` and use environment variables.

---

### Step 2: Integrate Events into Services (30-60 minutes)

You need to modify these service implementation files:

#### A. Temple Authority Services (TA → DC notifications)

**Files to modify:**

1. **`backend/src/main/java/com/templeregistry/service/impl/temple/TempleServiceImpl.java`**
   - Add: `private final NotificationEventPublisher notificationPublisher;`
   - In `createTemple()`: Publish `TempleProfileCreatedEvent`
   - In `updateTemple()`: Publish `TempleProfileUpdatedEvent`

2. **`backend/src/main/java/com/templeregistry/service/impl/trust/TrustServiceImpl.java`**
   - Add: `private final NotificationEventPublisher notificationPublisher;`
   - In `submitTrust()`: Publish `TrustDataSubmittedEvent`
   - In `updateTrust()`: Publish `TrustDataUpdatedEvent`

3. **`backend/src/main/java/com/templeregistry/service/impl/employee/EmployeeServiceImpl.java`**
   - Add: `private final NotificationEventPublisher notificationPublisher;`
   - In `createEmployee()`: Publish `EmployeeCreatedEvent`
   - In `updateEmployee()`: Publish `EmployeeUpdatedEvent`
   - In `deleteEmployee()`: Publish `EmployeeDeletedEvent`

4. **`backend/src/main/java/com/templeregistry/service/impl/contractor/ContractorServiceImpl.java`**
   - Add: `private final NotificationEventPublisher notificationPublisher;`
   - In `createContractor()`: Publish `ContractorCreatedEvent`
   - In `updateContractor()`: Publish `ContractorUpdatedEvent`
   - In `deleteContractor()`: Publish `ContractorDeletedEvent`

5. **`backend/src/main/java/com/templeregistry/service/impl/declaration/DeclarationServiceImpl.java`**
   - Add: `private final NotificationEventPublisher notificationPublisher;`
   - In `submitDeclaration()`: Publish `DeclarationSubmittedEvent`
   - In `updateDeclaration()`: Publish `DeclarationUpdatedEvent`

6. **`backend/src/main/java/com/templeregistry/service/impl/document/DocumentServiceImpl.java`**
   - Add: `private final NotificationEventPublisher notificationPublisher;`
   - In `uploadDocument()`: Publish `DocumentUploadedEvent`
   - In `updateDocument()`: Publish `DocumentUpdatedEvent`
   - In `deleteDocument()`: Publish `DocumentDeletedEvent`

#### B. District Collector Services (DC → TA notifications)

**Files to modify:**

1. **`backend/src/main/java/com/templeregistry/service/impl/dc/DcTempleVerificationServiceImpl.java`**
   - Add: `private final NotificationEventPublisher notificationPublisher;`
   - In `approveTemple()`: Publish `TempleProfileApprovedEvent`
   - In `rejectTemple()`: Publish `TempleProfileRejectedEvent`
   - In `flagTemple()`: Publish `TempleProfileFlaggedEvent`

2. **`backend/src/main/java/com/templeregistry/service/impl/dc/TempleProfileWorkflowServiceImpl.java`**
   - Check if this handles approvals/rejections
   - Add notification events if needed

3. **`backend/src/main/java/com/templeregistry/service/impl/dc/DeclarationWorkflowServiceImpl.java`**
   - Add: `private final NotificationEventPublisher notificationPublisher;`
   - In `approveDeclaration()`: Publish `DeclarationApprovedEvent`
   - In `rejectDeclaration()`: Publish `DeclarationRejectedEvent`
   - In `flagDeclaration()`: Publish `DeclarationFlaggedEvent`
   - In `markForPhysicalVisit()`: Publish `DeclarationMarkedForPhysicalVisitEvent`

4. **Trust workflow service** (if exists)
   - In `approveTrust()`: Publish `TrustDataApprovedEvent`
   - In `rejectTrust()`: Publish `TrustDataRejectedEvent`
   - In `flagTrust()`: Publish `TrustDataFlaggedEvent`

---

### Step 3: Integration Pattern (Copy-Paste Template)

Here's the exact pattern to follow for each service:

#### Pattern 1: TA Service (Create/Update)

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class YourServiceImpl implements YourService {
    
    // ADD THIS LINE
    private final NotificationEventPublisher notificationPublisher;
    
    private final YourRepository yourRepository;
    private final TempleRepository templeRepository;
    private final UserRepository userRepository;
    
    @Override
    @Transactional
    public YourDTO createYourEntity(CreateRequest request, Long userId) {
        // Your existing code...
        YourEntity saved = yourRepository.save(entity);
        
        // ADD THIS BLOCK
        Temple temple = templeRepository.findById(saved.getTempleId()).orElse(null);
        if (temple != null) {
            User dc = userRepository.findDistrictCollectorByDistrictId(temple.getDistrictId())
                    .orElse(null);
            
            if (dc != null) {
                notificationPublisher.publish(new YourCreatedEvent(
                    this,
                    saved.getId(),
                    temple.getName(),
                    // ... other parameters
                    userId,
                    dc.getId()
                ));
                log.info("Published YourCreatedEvent for entity: {}", saved.getId());
            }
        }
        
        return mapToDTO(saved);
    }
}
```

#### Pattern 2: DC Service (Approve/Reject/Flag)

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class DcYourServiceImpl implements DcYourService {
    
    // ADD THIS LINE
    private final NotificationEventPublisher notificationPublisher;
    
    private final YourRepository yourRepository;
    private final TempleRepository templeRepository;
    private final UserRepository userRepository;
    
    @Override
    @Transactional
    public YourDTO approveYourEntity(Long entityId, ApproveRequest request, Long dcUserId) {
        // Your existing code...
        YourEntity saved = yourRepository.save(entity);
        
        // ADD THIS BLOCK
        User dc = userRepository.findById(dcUserId).orElseThrow();
        Temple temple = templeRepository.findById(saved.getTempleId()).orElseThrow();
        
        notificationPublisher.publish(new YourEntityApprovedEvent(
            this,
            saved.getId(),
            temple.getName(),
            dcUserId,
            dc.getFullName(),
            temple.getCreatedBy()  // This is the TA user ID
        ));
        log.info("Published YourEntityApprovedEvent for entity: {}", saved.getId());
        
        return mapToDTO(saved);
    }
}
```

---

### Step 4: Test the Integration (15 minutes)

1. **Start the application**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. **Test in-app notifications** (works even without SMTP):
   - Create a temple as TA
   - Check DC's notifications: `GET /api/notifications`
   - You should see a notification

3. **Test email** (requires SMTP):
   - Set `spring.mail.enabled=true`
   - Configure SMTP credentials
   - Approve/reject something as DC
   - Check TA's email

---

## Quick Reference: Which Event to Use Where

### Temple Authority Actions → DC Notifications

| Action | Event | File |
|--------|-------|------|
| Create temple | `TempleProfileCreatedEvent` | `TempleServiceImpl.java` |
| Update temple | `TempleProfileUpdatedEvent` | `TempleServiceImpl.java` |
| Submit trust | `TrustDataSubmittedEvent` | `TrustServiceImpl.java` |
| Update trust | `TrustDataUpdatedEvent` | `TrustServiceImpl.java` |
| Add employee | `EmployeeCreatedEvent` | `EmployeeServiceImpl.java` |
| Update employee | `EmployeeUpdatedEvent` | `EmployeeServiceImpl.java` |
| Delete employee | `EmployeeDeletedEvent` | `EmployeeServiceImpl.java` |
| Add contractor | `ContractorCreatedEvent` | `ContractorServiceImpl.java` |
| Update contractor | `ContractorUpdatedEvent` | `ContractorServiceImpl.java` |
| Delete contractor | `ContractorDeletedEvent` | `ContractorServiceImpl.java` |
| Submit declaration | `DeclarationSubmittedEvent` | `DeclarationServiceImpl.java` |
| Update declaration | `DeclarationUpdatedEvent` | `DeclarationServiceImpl.java` |
| Upload document | `DocumentUploadedEvent` | `DocumentServiceImpl.java` |
| Update document | `DocumentUpdatedEvent` | `DocumentServiceImpl.java` |
| Delete document | `DocumentDeletedEvent` | `DocumentServiceImpl.java` |

### District Collector Actions → TA Notifications

| Action | Event | File |
|--------|-------|------|
| Approve temple | `TempleProfileApprovedEvent` | `DcTempleVerificationServiceImpl.java` |
| Reject temple | `TempleProfileRejectedEvent` | `DcTempleVerificationServiceImpl.java` |
| Flag temple | `TempleProfileFlaggedEvent` | `DcTempleVerificationServiceImpl.java` |
| Approve trust | `TrustDataApprovedEvent` | Trust workflow service |
| Reject trust | `TrustDataRejectedEvent` | Trust workflow service |
| Flag trust | `TrustDataFlaggedEvent` | Trust workflow service |
| Approve declaration | `DeclarationApprovedEvent` | `DeclarationWorkflowServiceImpl.java` |
| Reject declaration | `DeclarationRejectedEvent` | `DeclarationWorkflowServiceImpl.java` |
| Flag declaration | `DeclarationFlaggedEvent` | `DeclarationWorkflowServiceImpl.java` |
| Mark for site visit | `DeclarationMarkedForPhysicalVisitEvent` | `DeclarationWorkflowServiceImpl.java` |

---

## Imports You'll Need

Add these imports to your service files:

```java
import com.templeregistry.service.notification.NotificationEventPublisher;
import com.templeregistry.event.temple.*;  // For temple events
import com.templeregistry.event.trust.*;   // For trust events
import com.templeregistry.event.employee.*;  // For employee events
import com.templeregistry.event.contractor.*;  // For contractor events
import com.templeregistry.event.declaration.*;  // For declaration events
import com.templeregistry.event.document.*;  // For document events
```

---

## Troubleshooting

### Issue: "NotificationEventPublisher cannot be resolved"
**Solution:** Add the import:
```java
import com.templeregistry.service.notification.NotificationEventPublisher;
```

### Issue: "Event class not found"
**Solution:** Add the appropriate import:
```java
import com.templeregistry.event.temple.TempleProfileCreatedEvent;
```

### Issue: "No DC found for district"
**Solution:** This is normal if no DC is assigned. The code handles it gracefully with:
```java
if (dc != null) {
    // publish event
}
```

### Issue: Emails not sending
**Solution:** 
1. Check `spring.mail.enabled=true`
2. Verify SMTP credentials
3. Check logs for errors
4. Only HIGH/CRITICAL events send emails

---

## Summary

**What I did:**
- ✅ Created all infrastructure (events, services, templates)
- ✅ Everything compiles successfully
- ✅ Ready to use

**What you need to do:**
1. ⏳ Add configuration to `application-dev.yml` (5 min)
2. ⏳ Inject `NotificationEventPublisher` in services (5 min)
3. ⏳ Add event publishing calls (30-60 min)
4. ⏳ Test (15 min)

**Total time:** ~1 hour

**Need help?** Check:
- `NOTIFICATION_INTEGRATION_EXAMPLES.md` - Full code examples
- `NOTIFICATION_QUICK_START.md` - Quick reference
- `NOTIFICATION_MODULE_IMPLEMENTATION.md` - Complete guide

---

## Want Me to Do It?

If you want, I can:
1. ✅ Read your existing service files
2. ✅ Add the notification integration code
3. ✅ Add the configuration

Just say "integrate notifications automatically" and I'll do it for you! 🚀
