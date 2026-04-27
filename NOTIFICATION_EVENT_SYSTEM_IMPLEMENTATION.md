# Notification & Alerts Module - Backend Event System Implementation

## ✅ PHASE 1 COMPLETE: Event-Driven Notification System

### **What Has Been Implemented**

#### **1. Event Infrastructure**

**Base Classes & Enums:**
- `BaseNotificationEvent` - Abstract base for all notification events
- `NotificationPriority` - LOW, MEDIUM, HIGH, CRITICAL
- `NotificationCategory` - SUBMISSION, APPROVAL, REJECTION, CLARIFICATION, SITE_VISIT, REMINDER, OVERDUE, DOCUMENT, SYSTEM
- `ModuleType` - TEMPLE, TRUST, EMPLOYEE, CONTRACTOR, DECLARATION, DOCUMENT, SYSTEM

**Location:** `backend/src/main/java/com/templeregistry/event/base/`

#### **2. Domain Events (15 Events Created)**

**Declaration Module Events:**
- `DeclarationSubmittedEvent` - TA submits → notifies DC
- `DeclarationApprovedEvent` - DC approves → notifies TA
- `DeclarationRejectedEvent` - DC rejects → notifies TA (CRITICAL)
- `ClarificationRequestedEvent` - DC requests clarification → notifies TA
- `ClarificationRespondedEvent` - TA responds → notifies DC
- `SiteVisitScheduledEvent` - DC schedules visit → notifies TA
- `DeadlineApproachingEvent` - System reminder → notifies TA (priority escalates)
- `DeclarationOverdueEvent` - System alert → notifies TA + DC (CRITICAL)

**Temple Module Events:**
- `TempleProfileCreatedEvent` - TA creates temple → notifies DC
- `TempleProfileUpdatedEvent` - TA updates temple → notifies DC

**Trust Module Events:**
- `TrustDataSubmittedEvent` - TA submits trust data → notifies DC

**Employee Module Events:**
- `EmployeeCreatedEvent` - TA creates employee → notifies DC
- `EmployeeUpdatedEvent` - TA updates employee → notifies DC

**Contractor Module Events:**
- `ContractorCreatedEvent` - TA creates contractor → notifies DC
- `ContractorUpdatedEvent` - TA updates contractor → notifies DC

**Document Module Events:**
- `DocumentUploadedEvent` - TA uploads document → notifies DC

**Location:** `backend/src/main/java/com/templeregistry/event/{module}/`

#### **3. Event Listener & Dispatcher**

- `NotificationEventListener` - Centralized @EventListener for all BaseNotificationEvent subclasses
- `NotificationDispatchService` - Interface for notification dispatch logic
- `NotificationDispatchServiceImpl` - Implementation handling in-app notifications + audit logging
- `NotificationEventPublisher` - Helper service for publishing events from business logic

**Location:** 
- `backend/src/main/java/com/templeregistry/event/listener/`
- `backend/src/main/java/com/templeregistry/service/notification/`

---

## **How to Use the Event System**

### **Step 1: Inject NotificationEventPublisher**

In any service where you want to trigger notifications:

```java
@Service
@RequiredArgsConstructor
public class DeclarationServiceImpl implements DeclarationService {
    
    private final NotificationEventPublisher eventPublisher;
    private final AssetDeclarationRepository declarationRepository;
    // ... other dependencies
    
    // Your service methods here
}
```

### **Step 2: Publish Events After State Changes**

**Example: Declaration Submission**

```java
@Override
@Transactional
@PreAuthorize("hasRole('TEMPLE_AUTHORITY')")
public void submit(Long declarationId) {
    AssetDeclaration declaration = declarationRepository.findById(declarationId)
            .orElseThrow(() -> new EntityNotFoundException("Declaration", declarationId));
    
    // Validate and update status
    declaration.setStatus(DeclarationStatus.SUBMITTED);
    declaration.setSubmittedAt(LocalDateTime.now());
    declarationRepository.save(declaration);
    
    // Publish notification event
    eventPublisher.publish(new DeclarationSubmittedEvent(
            this,
            declaration.getId(),
            declaration.getTemple().getName(),
            getCurrentUserId(),
            getDcIdForDistrict(declaration.getTemple().getDistrictId()),
            declaration.getFinancialYear()
    ));
}
```

**Example: Declaration Approval**

```java
@Override
@Transactional
@PreAuthorize("hasRole('DISTRICT_COLLECTOR')")
public void approveDeclaration(Long declarationId, WorkflowApproveRequest request, Claims claims) {
    AssetDeclaration declaration = declarationRepository.findById(declarationId)
            .orElseThrow(() -> new EntityNotFoundException("Declaration", declarationId));
    
    // Validate and update status
    declaration.setStatus(DeclarationStatus.APPROVED);
    declaration.setApprovedAt(LocalDateTime.now());
    declaration.setAcknowledgementNumber(generateAckNumber());
    declarationRepository.save(declaration);
    
    // Publish notification event
    eventPublisher.publish(new DeclarationApprovedEvent(
            this,
            declaration.getId(),
            declaration.getTemple().getName(),
            claims.userId(),
            declaration.getTemple().getCreatedBy(), // Temple Authority user ID
            declaration.getAcknowledgementNumber(),
            declaration.getFinancialYear()
    ));
}
```

**Example: Clarification Request**

```java
@Override
@Transactional
@PreAuthorize("hasRole('DISTRICT_COLLECTOR')")
public void requestClarification(Long declarationId, ClarificationRequest request, Claims claims) {
    AssetDeclaration declaration = declarationRepository.findById(declarationId)
            .orElseThrow(() -> new EntityNotFoundException("Declaration", declarationId));
    
    // Create clarification record
    DeclarationClarification clarification = new DeclarationClarification();
    clarification.setDeclaration(declaration);
    clarification.setMessage(request.getMessage());
    clarification.setDirection(ClarificationDirection.DC_TO_TA);
    clarificationRepository.save(clarification);
    
    // Update declaration status
    declaration.setStatus(DeclarationStatus.CLARIFICATION_REQUIRED);
    declarationRepository.save(declaration);
    
    // Publish notification event
    eventPublisher.publish(new ClarificationRequestedEvent(
            this,
            declaration.getId(),
            declaration.getTemple().getName(),
            claims.userId(),
            declaration.getTemple().getCreatedBy(),
            request.getMessage(),
            declaration.getFinancialYear()
    ));
}
```

**Example: Employee Creation**

```java
@Override
@Transactional
@PreAuthorize("hasRole('TEMPLE_AUTHORITY')")
public EmployeeResponse create(CreateEmployeeRequest request, Claims claims) {
    Employee employee = new Employee();
    // ... map request to entity
    employee = employeeRepository.save(employee);
    
    // Publish notification event
    eventPublisher.publish(new EmployeeCreatedEvent(
            this,
            employee.getId(),
            employee.getTemple().getName(),
            employee.getFullName(),
            claims.userId(),
            getDcIdForDistrict(employee.getTemple().getDistrictId())
    ));
    
    return mapper.toResponse(employee);
}
```

### **Step 3: Scheduled Deadline Reminders**

Create a scheduled job to check for approaching deadlines:

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class DeadlineReminderScheduler {

    private final AssetDeclarationRepository declarationRepository;
    private final NotificationEventPublisher eventPublisher;

    /**
     * Runs daily at 9 AM to check for approaching deadlines.
     */
    @Scheduled(cron = "0 0 9 * * *")
    @Transactional(readOnly = true)
    public void sendDeadlineReminders() {
        LocalDate today = LocalDate.now();
        LocalDate sevenDaysOut = today.plusDays(7);
        LocalDate threeDaysOut = today.plusDays(3);
        LocalDate oneDayOut = today.plusDays(1);

        // Find declarations with approaching deadlines
        List<AssetDeclaration> declarations = declarationRepository
                .findByStatusInAndDueDateBetween(
                        List.of(DeclarationStatus.DRAFT, DeclarationStatus.SUBMITTED),
                        today,
                        sevenDaysOut
                );

        for (AssetDeclaration declaration : declarations) {
            LocalDate dueDate = declaration.getDueDate();
            int daysRemaining = (int) ChronoUnit.DAYS.between(today, dueDate);

            // Only send reminders at 7, 3, and 1 day marks
            if (daysRemaining == 7 || daysRemaining == 3 || daysRemaining == 1) {
                eventPublisher.publish(new DeadlineApproachingEvent(
                        this,
                        declaration.getId(),
                        declaration.getTemple().getName(),
                        declaration.getTemple().getCreatedBy(),
                        dueDate,
                        daysRemaining,
                        declaration.getFinancialYear()
                ));
            }
        }

        log.info("Deadline reminder check completed: {} declarations processed", declarations.size());
    }
}
```

### **Step 4: Overdue Declaration Flagging**

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class OverdueDeclarationScheduler {

    private final AssetDeclarationRepository declarationRepository;
    private final NotificationEventPublisher eventPublisher;

    /**
     * Runs daily at 10 AM to flag overdue declarations.
     */
    @Scheduled(cron = "0 0 10 * * *")
    @Transactional
    public void flagOverdueDeclarations() {
        LocalDate today = LocalDate.now();

        List<AssetDeclaration> overdueDeclarations = declarationRepository
                .findByStatusInAndDueDateBeforeAndIsOverdueFalse(
                        List.of(DeclarationStatus.DRAFT, DeclarationStatus.SUBMITTED,
                                DeclarationStatus.UNDER_REVIEW, DeclarationStatus.CLARIFICATION_REQUIRED),
                        today
                );

        for (AssetDeclaration declaration : overdueDeclarations) {
            declaration.setOverdue(true);
            declaration.setOverdueFlaggedAt(LocalDateTime.now());
            declarationRepository.save(declaration);

            // Publish overdue event (notifies both TA and DC)
            eventPublisher.publish(new DeclarationOverdueEvent(
                    this,
                    declaration.getId(),
                    declaration.getTemple().getName(),
                    declaration.getTemple().getCreatedBy(),
                    getDcIdForDistrict(declaration.getTemple().getDistrictId()),
                    declaration.getDueDate(),
                    declaration.getFinancialYear()
                ));
        }

        log.info("Overdue flagging completed: {} declarations flagged", overdueDeclarations.size());
    }
}
```

---

## **Event Flow Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                                │
│  (DeclarationService, EmployeeService, TrustService, etc.)      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ 1. Business logic executes
                         │ 2. State change committed
                         │ 3. eventPublisher.publish(event)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              NotificationEventPublisher                          │
│         (publishes to Spring ApplicationEventPublisher)          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Spring Event Bus
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              NotificationEventListener                           │
│         (@EventListener, @Async("taskExecutor"))                 │
│         Listens to all BaseNotificationEvent subclasses          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Async processing
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           NotificationDispatchServiceImpl                        │
│  - Creates InAppNotification records                             │
│  - Logs NotificationEvent audit records                          │
│  - TODO Phase 2: Send emails for HIGH/CRITICAL priority          │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE                                    │
│  - in_app_notifications (user inbox)                             │
│  - notification_events (audit log)                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## **Notification Trigger Matrix**

| Module | Event | Triggered By | Notifies | Channel | Priority |
|--------|-------|--------------|----------|---------|----------|
| Temple | Profile Created | TA | DC | In-app | MEDIUM |
| Temple | Profile Updated | TA | DC | In-app | LOW |
| Trust | Data Submitted | TA | DC | In-app | HIGH |
| Employee | Created | TA | DC | In-app | LOW |
| Employee | Updated | TA | DC | In-app | LOW |
| Contractor | Created | TA | DC | In-app | LOW |
| Contractor | Updated | TA | DC | In-app | LOW |
| Document | Uploaded | TA | DC | In-app | LOW |
| Declaration | Submitted | TA | DC | In-app + Email* | HIGH |
| Declaration | Approved | DC | TA | In-app + Email* | HIGH |
| Declaration | Rejected | DC | TA | In-app + Email* | CRITICAL |
| Declaration | Clarification Required | DC | TA | In-app + Email* | HIGH |
| Declaration | Clarification Responded | TA | DC | In-app | MEDIUM |
| Declaration | Site Visit Scheduled | DC | TA | In-app + Email* | HIGH |
| Declaration | Deadline Approaching (7d) | System | TA | In-app + Email* | MEDIUM |
| Declaration | Deadline Approaching (3d) | System | TA | In-app + Email* | HIGH |
| Declaration | Deadline Approaching (1d) | System | TA | In-app + Email* | CRITICAL |
| Declaration | Overdue | System | TA + DC | In-app + Email* | CRITICAL |

*Email notifications will be implemented in Phase 2

---

## **Testing the Event System**

### **Manual Testing**

1. **Start the application**
2. **Submit a declaration** (as Temple Authority)
3. **Check the DC's notification inbox** at `/api/v1/notifications`
4. **Approve/Reject the declaration** (as DC)
5. **Check the TA's notification inbox**

### **Integration Test Example**

```java
@SpringBootTest
@Transactional
class NotificationEventIntegrationTest {

    @Autowired
    private NotificationEventPublisher eventPublisher;
    
    @Autowired
    private InAppNotificationRepository notificationRepository;
    
    @Test
    void declarationSubmittedEvent_createsNotificationForDC() {
        // Given
        Long dcUserId = 100L;
        DeclarationSubmittedEvent event = new DeclarationSubmittedEvent(
                this, 1L, "Test Temple", 200L, dcUserId, 2024
        );
        
        // When
        eventPublisher.publish(event);
        
        // Wait for async processing
        await().atMost(5, TimeUnit.SECONDS).until(() -> 
            notificationRepository.countByUserIdAndIsRead(dcUserId, false) > 0
        );
        
        // Then
        List<InAppNotification> notifications = notificationRepository
                .findAllByUserIdOrderByCreatedAtDesc(dcUserId, PageRequest.of(0, 10))
                .getContent();
        
        assertThat(notifications).hasSize(1);
        assertThat(notifications.get(0).getTitle()).isEqualTo("New Declaration Submitted");
        assertThat(notifications.get(0).getReferenceType()).isEqualTo("DECLARATION");
        assertThat(notifications.get(0).getReferenceId()).isEqualTo(1L);
    }
}
```

---

## **Next Steps: Phase 2**

### **1. Email Service Integration**

- Add Spring Boot Mail dependency to `pom.xml`
- Create `EmailService` interface and implementation
- Create email templates (HTML + plain text)
- Integrate with `NotificationDispatchServiceImpl`

### **2. User Notification Preferences**

- Create `user_notification_preferences` table
- Allow users to configure:
  - Email enabled/disabled per module
  - In-app enabled/disabled per module
  - Digest email frequency (daily/weekly)
- Update `NotificationDispatchServiceImpl` to respect preferences

### **3. Enhanced Database Schema**

```sql
-- Add priority and category to in_app_notifications
ALTER TABLE in_app_notifications 
ADD COLUMN priority VARCHAR(20) DEFAULT 'MEDIUM',
ADD COLUMN category VARCHAR(30) DEFAULT 'SYSTEM',
ADD COLUMN action_url VARCHAR(255);

-- Create user preferences table
CREATE TABLE user_notification_preferences (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    module_type VARCHAR(30) NOT NULL,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    UNIQUE KEY uk_user_module (user_id, module_type)
);

-- Create email delivery log
CREATE TABLE email_delivery_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    notification_event_id BIGINT UNSIGNED NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL, -- SENT, FAILED, BOUNCED
    sent_at DATETIME(6),
    failure_reason VARCHAR(1000),
    FOREIGN KEY (notification_event_id) REFERENCES notification_events(id)
);
```

### **4. Frontend Notification Center**

- Build notification bell component with unread badge
- Build notification dropdown with recent notifications
- Build full notification inbox page with filters
- Implement real-time updates (polling or WebSocket)

---

## **Summary**

✅ **Completed:**
- 15 domain events covering all major workflows
- Centralized event listener with async processing
- Notification dispatch service with audit logging
- Clean integration API via `NotificationEventPublisher`
- Comprehensive documentation and examples

🚧 **Next Phase:**
- Email service integration
- User notification preferences
- Enhanced database schema
- Frontend notification center

The event system is **production-ready** for in-app notifications and can be integrated into existing services immediately.
