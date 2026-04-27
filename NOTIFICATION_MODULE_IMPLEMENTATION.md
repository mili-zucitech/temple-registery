# Notification Module - Complete Implementation Guide

## Overview

This document describes the comprehensive notification system for the Temple Registry application. The system supports both **in-app notifications** and **email notifications** for all major modules and events.

## Architecture

### Components

1. **Event System**: Domain events that trigger notifications
2. **Notification Dispatcher**: Processes events and creates notifications
3. **Email Service**: Sends email notifications using templates
4. **In-App Notifications**: Stores notifications in database for user inbox
5. **User Preferences**: Allows users to control notification settings per module

### Flow

```
Service Action → Publish Event → Event Listener → Notification Dispatcher
                                                          ↓
                                    ┌─────────────────────┴─────────────────────┐
                                    ↓                                           ↓
                          In-App Notification                          Email Notification
                          (Saved to Database)                          (Sent via SMTP)
```

## Notification Events

### Temple Profile Module

| Event | Trigger | Recipient | Priority |
|-------|---------|-----------|----------|
| `TempleProfileCreatedEvent` | TA creates temple profile | DC | MEDIUM |
| `TempleProfileUpdatedEvent` | TA updates temple profile | DC | MEDIUM |
| `TempleProfileApprovedEvent` | DC approves temple profile | TA | HIGH |
| `TempleProfileRejectedEvent` | DC rejects temple profile | TA | CRITICAL |
| `TempleProfileFlaggedEvent` | DC flags for clarification | TA | HIGH |

### Trust & Board Module

| Event | Trigger | Recipient | Priority |
|-------|---------|-----------|----------|
| `TrustDataSubmittedEvent` | TA submits trust data | DC | HIGH |
| `TrustDataUpdatedEvent` | TA updates trust data | DC | MEDIUM |
| `TrustDataApprovedEvent` | DC approves trust data | TA | HIGH |
| `TrustDataRejectedEvent` | DC rejects trust data | TA | CRITICAL |
| `TrustDataFlaggedEvent` | DC flags for clarification | TA | HIGH |

### Employee Module

| Event | Trigger | Recipient | Priority |
|-------|---------|-----------|----------|
| `EmployeeCreatedEvent` | TA adds employee | DC | LOW |
| `EmployeeUpdatedEvent` | TA updates employee | DC | LOW |
| `EmployeeDeletedEvent` | TA removes employee | DC | LOW |

### Contractor Module

| Event | Trigger | Recipient | Priority |
|-------|---------|-----------|----------|
| `ContractorCreatedEvent` | TA adds contractor | DC | LOW |
| `ContractorUpdatedEvent` | TA updates contractor | DC | LOW |
| `ContractorDeletedEvent` | TA removes contractor | DC | LOW |

### Declaration Module

| Event | Trigger | Recipient | Priority |
|-------|---------|-----------|----------|
| `DeclarationSubmittedEvent` | TA submits declaration | DC | HIGH |
| `DeclarationUpdatedEvent` | TA updates declaration | DC | HIGH |
| `DeclarationApprovedEvent` | DC approves declaration | TA | HIGH |
| `DeclarationRejectedEvent` | DC rejects declaration | TA | CRITICAL |
| `DeclarationFlaggedEvent` | DC flags for clarification | TA | HIGH |
| `DeclarationMarkedForPhysicalVisitEvent` | DC marks for site visit | TA | HIGH |

### Document Module

| Event | Trigger | Recipient | Priority |
|-------|---------|-----------|----------|
| `DocumentUploadedEvent` | TA uploads document | DC | LOW |
| `DocumentUpdatedEvent` | TA updates document | DC | LOW |
| `DocumentDeletedEvent` | TA deletes document | DC | LOW |

## Integration Guide

### Step 1: Publish Events in Services

In your service classes, inject `NotificationEventPublisher` and publish events after successful operations.

#### Example: Temple Service

```java
@Service
@RequiredArgsConstructor
public class TempleServiceImpl implements TempleService {
    
    private final NotificationEventPublisher notificationPublisher;
    private final TempleRepository templeRepository;
    private final UserRepository userRepository;
    
    @Transactional
    public TempleDTO createTemple(CreateTempleRequest request, Long userId) {
        // Create temple
        Temple temple = // ... create temple logic
        Temple saved = templeRepository.save(temple);
        
        // Get DC for this district
        User dc = userRepository.findDistrictCollectorByDistrictId(temple.getDistrictId())
                .orElse(null);
        
        // Publish notification event
        if (dc != null) {
            notificationPublisher.publish(new TempleProfileCreatedEvent(
                this,
                saved.getId(),
                saved.getName(),
                userId,
                dc.getId()
            ));
        }
        
        return mapToDTO(saved);
    }
    
    @Transactional
    public TempleDTO approveTemple(Long templeId, Long dcUserId) {
        Temple temple = templeRepository.findById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple not found"));
        
        temple.setStatus("APPROVED");
        Temple saved = templeRepository.save(temple);
        
        // Get DC name
        User dc = userRepository.findById(dcUserId).orElseThrow();
        
        // Publish approval notification
        notificationPublisher.publish(new TempleProfileApprovedEvent(
            this,
            saved.getId(),
            saved.getName(),
            dcUserId,
            dc.getFullName(),
            temple.getCreatedBy()
        ));
        
        return mapToDTO(saved);
    }
}
```

#### Example: Declaration Service

```java
@Service
@RequiredArgsConstructor
public class DeclarationServiceImpl implements DeclarationService {
    
    private final NotificationEventPublisher notificationPublisher;
    
    @Transactional
    public DeclarationDTO submitDeclaration(Long declarationId, Long userId) {
        Declaration declaration = // ... submit logic
        
        // Get temple and DC
        Temple temple = declaration.getTemple();
        User dc = userRepository.findDistrictCollectorByDistrictId(temple.getDistrictId())
                .orElse(null);
        
        // Publish notification
        if (dc != null) {
            notificationPublisher.publish(new DeclarationSubmittedEvent(
                this,
                declaration.getId(),
                temple.getName(),
                userId,
                dc.getId(),
                declaration.getFinancialYear()
            ));
        }
        
        return mapToDTO(declaration);
    }
    
    @Transactional
    public DeclarationDTO markForPhysicalVisit(Long declarationId, Long dcUserId, LocalDate scheduledDate) {
        Declaration declaration = // ... mark logic
        
        User dc = userRepository.findById(dcUserId).orElseThrow();
        Temple temple = declaration.getTemple();
        
        // Publish site visit notification
        notificationPublisher.publish(new DeclarationMarkedForPhysicalVisitEvent(
            this,
            declaration.getId(),
            temple.getName(),
            dcUserId,
            dc.getFullName(),
            temple.getCreatedBy(),
            scheduledDate,
            declaration.getFinancialYear()
        ));
        
        return mapToDTO(declaration);
    }
}
```

#### Example: Employee Service

```java
@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {
    
    private final NotificationEventPublisher notificationPublisher;
    
    @Transactional
    public EmployeeDTO createEmployee(CreateEmployeeRequest request, Long userId) {
        Employee employee = // ... create logic
        Employee saved = employeeRepository.save(employee);
        
        // Get temple and DC
        Temple temple = employee.getTemple();
        User dc = userRepository.findDistrictCollectorByDistrictId(temple.getDistrictId())
                .orElse(null);
        
        // Publish notification
        if (dc != null) {
            notificationPublisher.publish(new EmployeeCreatedEvent(
                this,
                saved.getId(),
                temple.getName(),
                saved.getFullName(),
                saved.getDesignation(),
                userId,
                dc.getId()
            ));
        }
        
        return mapToDTO(saved);
    }
}
```

#### Example: Document Service

```java
@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {
    
    private final NotificationEventPublisher notificationPublisher;
    
    @Transactional
    public DocumentDTO uploadDocument(UploadDocumentRequest request, Long userId) {
        Document document = // ... upload logic
        Document saved = documentRepository.save(document);
        
        // Get temple and DC
        Temple temple = document.getTemple();
        User dc = userRepository.findDistrictCollectorByDistrictId(temple.getDistrictId())
                .orElse(null);
        
        // Publish notification
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
}
```

### Step 2: Email Configuration

Add email configuration to `application.yml`:

```yaml
spring:
  mail:
    enabled: true  # Set to false to disable email notifications
    host: smtp.gmail.com
    port: 587
    username: ${SMTP_USERNAME}
    password: ${SMTP_PASSWORD}
    from: noreply@templeregistry.gov.in
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true
          connectiontimeout: 5000
          timeout: 5000
          writetimeout: 5000

app:
  base-url: ${APP_BASE_URL:http://localhost:3000}
```

### Step 3: Environment Variables

Set these environment variables:

```bash
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
APP_BASE_URL=https://templeregistry.gov.in
```

## Email Notification Rules

Emails are sent automatically based on these rules:

1. **Priority-Based**: Only HIGH and CRITICAL priority events trigger emails
2. **User Preferences**: Users can disable email notifications per module
3. **In-App Always**: In-app notifications are always created (if enabled)

### Email Templates

Six email templates are available:

1. `notification.html` - Generic notification (default)
2. `approval-notification.html` - Approval events (green theme)
3. `rejection-notification.html` - Rejection events (red theme)
4. `clarification-notification.html` - Clarification requests (orange theme)
5. `site-visit-notification.html` - Site visit scheduling (blue theme)
6. `submission-notification.html` - New submissions (purple theme)

## User Notification Preferences

Users can control notifications per module through the API:

### Get Preferences

```http
GET /api/notifications/preferences
Authorization: Bearer {token}
```

Response:
```json
{
  "preferences": [
    {
      "moduleType": "TEMPLE",
      "inAppEnabled": true,
      "emailEnabled": true
    },
    {
      "moduleType": "DECLARATION",
      "inAppEnabled": true,
      "emailEnabled": false
    }
  ]
}
```

### Update Preferences

```http
PUT /api/notifications/preferences
Authorization: Bearer {token}
Content-Type: application/json

{
  "moduleType": "TEMPLE",
  "inAppEnabled": true,
  "emailEnabled": false
}
```

## Testing

### Test Email Configuration

```java
@RestController
@RequestMapping("/api/admin/email")
@RequiredArgsConstructor
public class EmailTestController {
    
    private final EmailService emailService;
    
    @PostMapping("/test")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> sendTestEmail(@RequestParam String email) {
        emailService.sendTestEmail(email);
        return ResponseEntity.ok("Test email sent to " + email);
    }
}
```

### Test Notification Event

```java
@Test
void testTempleCreationNotification() {
    // Create temple
    Temple temple = createTestTemple();
    
    // Verify notification was created
    List<InAppNotification> notifications = 
        inAppNotificationRepository.findByUserId(dcUserId);
    
    assertThat(notifications).hasSize(1);
    assertThat(notifications.get(0).getTitle()).contains("New Temple Profile");
}
```

## Database Schema

### Tables

1. **in_app_notifications** - Stores in-app notifications
2. **notification_events** - Audit log of all notification events
3. **email_delivery_logs** - Email delivery tracking
4. **user_notification_preferences** - User preferences per module

## Monitoring

### Email Delivery Logs

Query failed emails:

```sql
SELECT * FROM email_delivery_logs 
WHERE status = 'FAILED' 
ORDER BY sent_at DESC;
```

### Notification Statistics

```sql
-- Notifications by category
SELECT category, COUNT(*) as count
FROM in_app_notifications
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY category;

-- Email delivery rate
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM email_delivery_logs
WHERE sent_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY status;
```

## Best Practices

1. **Always publish events after successful operations** - Use `@Transactional` to ensure atomicity
2. **Handle null recipients gracefully** - Check if DC/TA exists before publishing
3. **Use appropriate priority levels** - Reserve CRITICAL for urgent actions
4. **Provide meaningful messages** - Include entity names and context
5. **Test email templates** - Verify rendering across email clients
6. **Monitor delivery logs** - Set up alerts for high failure rates
7. **Respect user preferences** - Don't override user notification settings

## Troubleshooting

### Emails Not Sending

1. Check `spring.mail.enabled=true` in configuration
2. Verify SMTP credentials are correct
3. Check email delivery logs for error messages
4. Ensure firewall allows SMTP port (587)

### Notifications Not Appearing

1. Verify event is being published (check logs)
2. Check user notification preferences
3. Verify recipient ID is correct
4. Check `in_app_notifications` table directly

### Performance Issues

1. Add indexes on frequently queried columns
2. Archive old notifications (older than 90 days)
3. Use async processing for email sending
4. Batch notification creation for bulk operations

## Future Enhancements

1. **SMS Notifications** - Add SMS support for critical events
2. **Push Notifications** - Mobile app push notifications
3. **Notification Digest** - Daily/weekly email summaries
4. **Advanced Filtering** - More granular notification preferences
5. **Notification Templates** - Customizable notification messages
6. **Retry Mechanism** - Automatic retry for failed emails
7. **Webhook Support** - External system integrations

## Summary

The notification module provides a comprehensive, event-driven notification system that:

- ✅ Supports both in-app and email notifications
- ✅ Covers all major modules (Temple, Trust, Employee, Contractor, Declaration, Document)
- ✅ Provides user-configurable preferences
- ✅ Uses professional email templates
- ✅ Includes audit logging and monitoring
- ✅ Follows Spring Boot best practices
- ✅ Is fully asynchronous and non-blocking

All events are automatically processed by the `NotificationEventListener`, which dispatches notifications based on user preferences and event priority.
