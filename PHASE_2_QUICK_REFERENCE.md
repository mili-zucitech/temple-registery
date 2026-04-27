# Phase 2 Quick Reference: Email & Preferences

## 🚀 **Quick Setup (5 Minutes)**

### **1. Configure Email (Required)**

```bash
# Set environment variables
export EMAIL_USERNAME=your-email@gmail.com
export EMAIL_PASSWORD=your-app-password
```

Or update `application.yml`:
```yaml
spring.mail:
  username: your-email@gmail.com
  password: your-app-password
```

### **2. Start Application**

```bash
mvn spring-boot:run
# Migration V43 runs automatically
```

### **3. Test Email**

```bash
curl -X POST http://localhost:8080/api/v1/test-email \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

---

## 📧 **Email Configuration**

### **Gmail Setup**

1. Enable 2FA on Gmail account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use app password (not account password)

### **Other SMTP Providers**

```yaml
spring.mail:
  host: smtp.office365.com  # or smtp.sendgrid.net, etc.
  port: 587
  username: your-email
  password: your-password
```

---

## 🔔 **How Notifications Work**

### **Decision Flow**

```
Event Published
    ↓
Check User Preferences
    ↓
┌─────────────────────────────────┐
│ In-App Enabled?                 │
│ ✓ Yes → Create in-app notification
│ ✗ No  → Skip
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ Email Enabled?                  │
│ ✓ Yes → Check Priority          │
│   ├─ HIGH/CRITICAL → Send Email │
│   └─ LOW/MEDIUM → Skip Email    │
│ ✗ No  → Skip Email              │
└─────────────────────────────────┘
```

---

## 🎯 **API Endpoints**

### **Get Preferences**

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
      "emailEnabled": false
    }
  ]
}
```

---

## 📊 **Database Tables**

### **user_notification_preferences**

```sql
SELECT * FROM user_notification_preferences WHERE user_id = 1;
```

| Column | Type | Description |
|--------|------|-------------|
| user_id | BIGINT | User ID |
| module_type | VARCHAR(30) | TEMPLE, TRUST, EMPLOYEE, etc. |
| in_app_enabled | BOOLEAN | Show in notification center |
| email_enabled | BOOLEAN | Send email |

### **email_delivery_logs**

```sql
SELECT * FROM email_delivery_logs 
WHERE status = 'FAILED' 
ORDER BY sent_at DESC 
LIMIT 10;
```

| Column | Type | Description |
|--------|------|-------------|
| recipient_email | VARCHAR(255) | Email address |
| subject | VARCHAR(500) | Email subject |
| status | VARCHAR(20) | SENT, FAILED, BOUNCED |
| failure_reason | VARCHAR(1000) | Error message |

---

## 🎨 **Email Templates**

### **Available Templates**

- `declaration-submitted.html`
- `declaration-approved.html`
- `declaration-rejected.html`
- `clarification-requested.html`
- `site-visit-scheduled.html`
- `deadline-reminder.html`
- `declaration-overdue.html`
- `generic-notification.html`

### **Template Variables**

All templates receive:
- `title` - Notification title
- `body` - Notification body
- `priority` - LOW, MEDIUM, HIGH, CRITICAL
- `category` - SUBMISSION, APPROVAL, etc.
- `actionUrl` - Deep link URL
- `timestamp` - Formatted timestamp

### **Customize Template**

Edit `backend/src/main/resources/templates/email/base-email.html`

---

## 🔧 **Troubleshooting**

### **Email Not Sending**

**Check 1: SMTP Configuration**
```bash
# Verify credentials
echo $EMAIL_USERNAME
echo $EMAIL_PASSWORD
```

**Check 2: Email Enabled**
```sql
SELECT email_enabled FROM user_notification_preferences 
WHERE user_id = <user_id> AND module_type = 'DECLARATION';
```

**Check 3: Event Priority**
```java
// Only HIGH and CRITICAL send emails
event.getPriority() == NotificationPriority.HIGH
event.getPriority() == NotificationPriority.CRITICAL
```

**Check 4: User Email**
```sql
SELECT email FROM users WHERE id = <user_id>;
```

**Check 5: Application Config**
```yaml
app:
  notification:
    email-enabled: true  # Must be true
```

### **Check Logs**

```bash
# Search for email-related logs
grep -i "email" backend/log.txt

# Check for errors
grep -i "failed to send email" backend/log.txt
```

### **Test Email Service**

```java
@Autowired
private EmailService emailService;

@Test
void testEmail() {
    emailService.sendTestEmail("test@example.com");
}
```

---

## 📈 **Monitoring Queries**

### **Email Delivery Rate**

```sql
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM email_delivery_logs
WHERE sent_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY status;
```

### **Failed Emails**

```sql
SELECT 
    recipient_email,
    subject,
    failure_reason,
    sent_at
FROM email_delivery_logs
WHERE status = 'FAILED'
ORDER BY sent_at DESC
LIMIT 20;
```

### **User Preferences Summary**

```sql
SELECT 
    module_type,
    SUM(CASE WHEN email_enabled THEN 1 ELSE 0 END) as email_enabled_count,
    SUM(CASE WHEN in_app_enabled THEN 1 ELSE 0 END) as in_app_enabled_count,
    COUNT(*) as total_users
FROM user_notification_preferences
GROUP BY module_type;
```

---

## 🎯 **Priority Levels**

| Priority | Email Sent? | Use Case |
|----------|-------------|----------|
| LOW | ❌ No | Informational updates |
| MEDIUM | ❌ No | Standard workflow |
| HIGH | ✅ Yes | Requires attention |
| CRITICAL | ✅ Yes | Urgent action required |

---

## 🔐 **Security Checklist**

- [ ] SMTP credentials in environment variables (not in code)
- [ ] Using app password (not account password)
- [ ] Email content contains minimal PII
- [ ] Deep links require authentication
- [ ] User can only update own preferences
- [ ] Email delivery logs are audit-ready

---

## 📝 **Common Tasks**

### **Disable Email for All Users**

```sql
UPDATE user_notification_preferences 
SET email_enabled = FALSE 
WHERE module_type = 'DECLARATION';
```

### **Enable Email for Specific User**

```sql
UPDATE user_notification_preferences 
SET email_enabled = TRUE 
WHERE user_id = <user_id> AND module_type = 'DECLARATION';
```

### **Reset User Preferences to Default**

```sql
DELETE FROM user_notification_preferences WHERE user_id = <user_id>;
-- Preferences will be recreated on next access
```

### **Check Email Delivery for User**

```sql
SELECT 
    edl.*,
    ne.event_type
FROM email_delivery_logs edl
JOIN notification_events ne ON edl.notification_event_id = ne.id
WHERE ne.recipient_id = <user_id>
ORDER BY edl.sent_at DESC;
```

---

## 🚀 **Performance Tips**

### **Email Sending**

- Emails sent asynchronously (doesn't block main thread)
- Separate transaction (failures don't affect business logic)
- Connection pooling enabled by default

### **Database Queries**

All necessary indexes created:
- `idx_unp_user_id` - Fast preference lookup
- `idx_edl_status` - Query failed emails
- `idx_edl_sent_at` - Time-based queries

### **SMTP Rate Limits**

Gmail limits:
- 500 emails/day (free account)
- 2000 emails/day (Google Workspace)

Consider:
- Using dedicated SMTP service (SendGrid, AWS SES)
- Implementing email batching
- Adding rate limiting

---

## 📚 **Related Documentation**

- **Full Implementation:** `PHASE_2_IMPLEMENTATION_COMPLETE.md`
- **Phase 1 (Events):** `NOTIFICATION_EVENT_SYSTEM_IMPLEMENTATION.md`
- **Integration Guide:** `NOTIFICATION_INTEGRATION_EXAMPLE.md`
- **Architecture:** `NOTIFICATION_ARCHITECTURE_DIAGRAM.md`

---

## ✅ **Verification Checklist**

After setup, verify:

- [ ] Migration V43 ran successfully
- [ ] Email test sends successfully
- [ ] User preferences API works
- [ ] In-app notifications created
- [ ] Emails sent for HIGH/CRITICAL events
- [ ] Email delivery logged
- [ ] User can update preferences
- [ ] Preferences respected by system

---

**Quick Help:**

```bash
# Test email configuration
curl -X POST http://localhost:8080/api/v1/test-email

# Get user preferences
curl http://localhost:8080/api/v1/notification-preferences \
  -H "Authorization: Bearer <token>"

# Check email logs
mysql> SELECT * FROM email_delivery_logs ORDER BY sent_at DESC LIMIT 5;
```

---

**Phase 2 Status:** ✅ Complete  
**Last Updated:** April 24, 2026
