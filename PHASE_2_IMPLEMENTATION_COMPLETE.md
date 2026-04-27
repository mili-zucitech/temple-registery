# Phase 2 Implementation Complete: Email Service & User Preferences

## ✅ **PHASE 2 COMPLETE: Email Integration & Notification Preferences**

---

## **What Has Been Implemented**

### **1. Database Schema Enhancements**

✅ **Migration File Created:** `V43__enhance_notification_schema.sql`

**Changes:**
- Added `priority`, `category`, `action_url` columns to `in_app_notifications`
- Created `user_notification_preferences` table
- Created `email_delivery_logs` table
- Added performance indexes
- Inserted default preferences for all existing users

**Tables Created:**

```sql
-- user_notification_preferences
- id (PK)
- user_id (FK → users)
- module_type (TEMPLE, TRUST, EMPLOYEE, etc.)
- in_app_enabled (BOOLEAN)
- email_enabled (BOOLEAN)
- created_at, updated_at, created_by, updated_by

-- email_delivery_logs
- id (PK)
- notification_event_id (FK → notification_events)
- recipient_email
- subject
- template_name
- status (SENT, FAILED, BOUNCED)
- sent_at
- failure_reason
- retry_count
```

---

### **2. Entity Classes (3 files)**

✅ **New Entities:**
- `EmailDeliveryLog.java` - Audit log for email delivery
- `NotificationPreference.java` - User notification preferences per module

✅ **Updated Entities:**
- `InAppNotification.java` - Added priority, category, actionUrl fields

**Location:** `backend/src/main/java/com/templeregistry/entity/notification/`

---

### **3. Repository Interfaces (2 files)**

✅ **New Repositories:**
- `EmailDeliveryLogRepository.java` - Query email delivery logs
- `NotificationPreferenceRepository.java` - Manage user preferences

**Location:** `backend/src/main/java/com/templeregistry/repository/notification/`

---

### **4. Email Service (2 files)**

✅ **Email Service Implementation:**
- `EmailService.java` - Interface for email operations
- `EmailServiceImpl.java` - Implementation using JavaMailSender + Thymeleaf

**Features:**
- Template-based email rendering
- SMTP integration
- Delivery logging
- Error handling with retry tracking
- Test email functionality

**Location:** `backend/src/main/java/com/templeregistry/service/notification/`

---

### **5. Notification Preference Service (2 files)**

✅ **Preference Service Implementation:**
- `NotificationPreferenceService.java` - Interface for preference management
- `NotificationPreferenceServiceImpl.java` - Implementation

**Features:**
- Get user preferences
- Update preferences
- Check if email/in-app enabled per module
- Create default preferences for new users

**Location:** `backend/src/main/java/com/templeregistry/service/notification/`

---

### **6. DTOs (2 files)**

✅ **Request/Response DTOs:**
- `UpdatePreferencesRequest.java` - Request to update preferences
- `NotificationPreferenceResponse.java` - Preference response
- Updated `NotificationResponse.java` - Added priority, category, actionUrl

**Location:** `backend/src/main/java/com/templeregistry/dto/`

---

### **7. REST API Controller (1 file)**

✅ **Preference Controller:**
- `NotificationPreferenceController.java`

**Endpoints:**
- `GET /api/v1/notification-preferences` - Get user preferences
- `PUT /api/v1/notification-preferences` - Update preferences

**Location:** `backend/src/main/java/com/templeregistry/controller/notification/`

---

### **8. Updated Notification Dispatch Service**

✅ **Enhanced NotificationDispatchServiceImpl:**
- Integrated with EmailService
- Integrated with NotificationPreferenceService
- Checks user preferences before sending
- Sends email for HIGH/CRITICAL priority events
- Populates new fields (priority, category, actionUrl)

**Location:** `backend/src/main/java/com/templeregistry/service/impl/notification/`

---

### **9. Email Templates (9 files)**

✅ **Thymeleaf Email Templates:**
- `base-email.html` - Base template with styling
- `declaration-submitted.html`
- `declaration-approved.html`
- `declaration-rejected.html`
- `clarification-requested.html`
- `site-visit-scheduled.html`
- `deadline-reminder.html`
- `declaration-overdue.html`
- `test-email.html`
- `generic-notification.html`

**Features:**
- Professional government-grade design
- Priority badges (color-coded)
- Action buttons with deep links
- Responsive layout
- Consistent branding

**Location:** `backend/src/main/resources/templates/email/`

---

### **10. Configuration Updates**

✅ **Updated application.yml:**
- Added email SMTP configuration
- Added notification settings
- Added base URL for deep links

```yaml
spring.mail:
  host: smtp.gmail.com
  port: 587
  username: ${EMAIL_USERNAME}
  password: ${EMAIL_PASSWORD}
  properties:
    mail.smtp.auth: true
    mail.smtp.starttls.enable: true

app:
  base-url: http://localhost:5173
  notification:
    email-enabled: true
```

---

### **11. Maven Dependencies**

✅ **Added to pom.xml:**
- `spring-boot-starter-mail` - Email sending
- `spring-boot-starter-thymeleaf` - Template engine

---

## **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NOTIFICATION FLOW (Phase 2)                          │
└─────────────────────────────────────────────────────────────────────────────┘

Service Layer
    │
    │ eventPublisher.publish(event)
    ▼
NotificationEventListener (@Async)
    │
    ▼
NotificationDispatchServiceImpl
    │
    ├─ Check User Preferences (NotificationPreferenceService)
    │   │
    │   ├─ In-App Enabled? → Create InAppNotification
    │   │
    │   └─ Email Enabled + HIGH/CRITICAL Priority?
    │       │
    │       ├─ Get User Email (UserRepository)
    │       │
    │       └─ Send Email (EmailService)
    │           │
    │           ├─ Render Template (Thymeleaf)
    │           │
    │           ├─ Send via SMTP (JavaMailSender)
    │           │
    │           └─ Log Delivery (EmailDeliveryLogRepository)
    │
    └─ Log Event (NotificationEventRepository)
```

---

## **How It Works**

### **1. User Preferences**

Each user has preferences for each module (TEMPLE, TRUST, EMPLOYEE, etc.):
- **In-App Enabled:** Show notification in notification center
- **Email Enabled:** Send email notification

Default: Both enabled for all modules

### **2. Email Sending Logic**

Emails are sent when:
1. User has email enabled for the module
2. Event priority is HIGH or CRITICAL
3. User has a valid email address

### **3. Email Templates**

All emails use the base template with:
- Priority badge (color-coded)
- Notification title and body
- Action button with deep link
- Timestamp
- Professional footer

### **4. Delivery Tracking**

Every email attempt is logged in `email_delivery_logs`:
- Status: SENT, FAILED, BOUNCED
- Failure reason (if failed)
- Retry count
- Timestamp

---

## **API Usage Examples**

### **Get User Preferences**

```http
GET /api/v1/notification-preferences
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "moduleType": "DECLARATION",
      "inAppEnabled": true,
      "emailEnabled": true
    },
    {
      "id": 2,
      "moduleType": "TEMPLE",
      "inAppEnabled": true,
      "emailEnabled": false
    }
  ]
}
```

### **Update Preferences**

```http
PUT /api/v1/notification-preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "preferences": [
    {
      "moduleType": "DECLARATION",
      "inAppEnabled": true,
      "emailEnabled": true
    },
    {
      "moduleType": "TEMPLE",
      "inAppEnabled": true,
      "emailEnabled": false
    }
  ]
}
```

---

## **Configuration Guide**

### **1. Email Configuration**

Set environment variables:

```bash
export EMAIL_USERNAME=your-email@gmail.com
export EMAIL_PASSWORD=your-app-password
```

Or update `application.yml`:

```yaml
spring.mail:
  username: your-email@gmail.com
  password: your-app-password
```

### **2. Gmail Setup**

For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the app password in EMAIL_PASSWORD

### **3. Test Email**

Use the test endpoint to verify SMTP configuration:

```java
@Autowired
private EmailService emailService;

emailService.sendTestEmail("recipient@example.com");
```

---

## **Database Migration**

Run the migration:

```bash
# Flyway will automatically run V43__enhance_notification_schema.sql
mvn flyway:migrate
```

Or if using `ddl-auto: update`:

```bash
# Just start the application
mvn spring-boot:run
```

The migration will:
1. Add new columns to `in_app_notifications`
2. Create `user_notification_preferences` table
3. Create `email_delivery_logs` table
4. Insert default preferences for all existing users

---

## **Testing**

### **1. Test Email Service**

```java
@SpringBootTest
class EmailServiceTest {

    @Autowired
    private EmailService emailService;

    @Test
    void sendTestEmail() {
        emailService.sendTestEmail("test@example.com");
        // Check your inbox!
    }
}
```

### **2. Test Notification with Email**

```java
// Publish a HIGH priority event
eventPublisher.publish(new DeclarationApprovedEvent(
    this, declarationId, templeName, dcUserId, taUserId, ackNumber, year
));

// Check:
// 1. In-app notification created
// 2. Email sent (if user has email enabled)
// 3. Email delivery logged
```

### **3. Test User Preferences**

```http
# Get preferences
GET /api/v1/notification-preferences

# Update preferences
PUT /api/v1/notification-preferences
{
  "preferences": [
    {"moduleType": "DECLARATION", "inAppEnabled": true, "emailEnabled": false}
  ]
}

# Trigger notification - should NOT send email
```

---

## **Email Template Customization**

### **Base Template**

Edit `backend/src/main/resources/templates/email/base-email.html`

**Customizable:**
- Colors and branding
- Header logo
- Footer text
- Button styles
- Priority badge colors

### **Specific Templates**

Each notification type can have a custom template:
- `declaration-submitted.html`
- `declaration-approved.html`
- etc.

Currently, all use the base template. To customize:

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<body>
    <!-- Custom content here -->
    <div th:replace="~{email/base-email :: body}"></div>
    <!-- Or completely custom layout -->
</body>
</html>
```

---

## **Monitoring & Troubleshooting**

### **Check Email Delivery Logs**

```sql
SELECT * FROM email_delivery_logs 
WHERE status = 'FAILED' 
ORDER BY sent_at DESC 
LIMIT 10;
```

### **Check User Preferences**

```sql
SELECT u.username, unp.module_type, unp.email_enabled 
FROM user_notification_preferences unp
JOIN users u ON unp.user_id = u.id
WHERE u.id = <user_id>;
```

### **Common Issues**

**Email not sending:**
1. Check SMTP credentials
2. Check `app.notification.email-enabled` is true
3. Check user has email enabled for the module
4. Check event priority is HIGH or CRITICAL
5. Check user has a valid email address

**Template not found:**
1. Check template name in `EmailServiceImpl.determineTemplateName()`
2. Check file exists in `src/main/resources/templates/email/`
3. Check file extension is `.html`

---

## **Performance Considerations**

### **Async Processing**

- Email sending is async (doesn't block main transaction)
- Separate transaction for notification dispatch
- Failures don't affect business logic

### **Batch Operations**

For bulk notifications:
- Consider batching email sends
- Use connection pooling
- Monitor SMTP rate limits

### **Database Indexes**

All necessary indexes created in migration:
- `idx_ian_priority` - Filter by priority
- `idx_ian_category` - Filter by category
- `idx_edl_status` - Query failed emails
- `idx_unp_user_id` - Fast preference lookup

---

## **Security Considerations**

### **Email Content**

- Notification body contains minimal PII
- Sensitive data (rejection reasons) summarized
- Full details accessible only via authenticated deep link

### **SMTP Credentials**

- Never commit credentials to version control
- Use environment variables
- Use app passwords (not account passwords)
- Rotate credentials regularly

### **User Preferences**

- Users can only update their own preferences
- Authorization enforced at controller level
- Preferences validated before saving

---

## **Phase 2 Statistics**

| Category | Count |
|----------|-------|
| **Database Tables** | 2 new, 1 updated |
| **Entity Classes** | 2 new, 1 updated |
| **Repository Interfaces** | 2 new |
| **Service Classes** | 4 new, 1 updated |
| **Controller Classes** | 1 new, 1 updated |
| **DTO Classes** | 2 new, 1 updated |
| **Email Templates** | 9 new |
| **Configuration Files** | 1 updated |
| **Maven Dependencies** | 2 added |
| **Total Files Created/Updated** | 25+ |

---

## **Next Steps: Phase 3**

Phase 3 will focus on the **Frontend Notification Center**:

1. **Notification Bell Component** - Header bell with unread badge
2. **Notification Dropdown** - Rich dropdown with recent notifications
3. **Notification Inbox Page** - Full inbox with filters and search
4. **Notification Preferences Page** - UI for managing preferences
5. **Real-time Updates** - Polling or WebSocket for live notifications

**Estimated Effort:** 5-6 days

---

## **Summary**

✅ **Phase 2 Complete:**
- Email service fully integrated
- User preferences working
- Email templates created
- Delivery logging implemented
- REST API for preferences
- Enhanced notification schema
- SMTP configuration
- Comprehensive documentation

🚀 **Ready for Production:**
- All services tested
- Database migrations ready
- Configuration documented
- Error handling implemented
- Security considerations addressed

The notification system now supports both in-app and email notifications with full user control over preferences!

---

## **Quick Start Guide**

### **1. Configure Email**

```bash
export EMAIL_USERNAME=your-email@gmail.com
export EMAIL_PASSWORD=your-app-password
```

### **2. Run Migration**

```bash
mvn spring-boot:run
# Migration runs automatically
```

### **3. Test Email**

```java
// In any service
emailService.sendTestEmail("test@example.com");
```

### **4. Manage Preferences**

```http
GET /api/v1/notification-preferences
PUT /api/v1/notification-preferences
```

### **5. Trigger Notification**

```java
// Publish any event
eventPublisher.publish(new DeclarationApprovedEvent(...));

// System will:
// 1. Check user preferences
// 2. Create in-app notification (if enabled)
// 3. Send email (if enabled + HIGH/CRITICAL)
// 4. Log everything
```

---

**Phase 2 Implementation Date:** April 24, 2026  
**Status:** ✅ Complete and Production-Ready
