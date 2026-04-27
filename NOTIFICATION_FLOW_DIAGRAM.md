# 🔔 Notification System - Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NOTIFICATION SYSTEM                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   Service Layer  │────────▶│ NotificationHelper│────────▶│ RecipientResolver│
│  (TA/DC Actions) │         │  (One-line API)   │         │ (Dynamic Lookup) │
└──────────────────┘         └──────────────────┘         └──────────────────┘
                                      │                             │
                                      │                             │
                                      ▼                             ▼
                             ┌──────────────────┐         ┌──────────────────┐
                             │  Event Publisher │         │  User Repository │
                             │  (Spring Events) │         │  Temple Repo     │
                             └──────────────────┘         └──────────────────┘
                                      │
                                      │
                                      ▼
                             ┌──────────────────┐
                             │  Event Listener  │
                             │  (@EventListener)│
                             └──────────────────┘
                                      │
                        ┌─────────────┴─────────────┐
                        │                           │
                        ▼                           ▼
              ┌──────────────────┐        ┌──────────────────┐
              │ In-App Notif DB  │        │  Email Service   │
              │  (notifications) │        │  (SMTP/Gmail)    │
              └──────────────────┘        └──────────────────┘
                        │                           │
                        │                           │
                        ▼                           ▼
              ┌──────────────────┐        ┌──────────────────┐
              │   User's Inbox   │        │   User's Email   │
              │  (GET /api/...)  │        │   (Gmail/etc)    │
              └──────────────────┘        └──────────────────┘
```

---

## Flow 1: Temple Authority Creates Temple

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TEMPLE CREATION FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

1. Temple Authority (TA)
   │
   │ POST /api/temples
   │ { name: "Shiva Temple", districtId: 5, ... }
   │
   ▼
2. TempleServiceImpl.createTemple()
   │
   │ temple = templeRepository.save(temple)
   │
   ▼
3. notificationHelper.notifyTempleCreated(templeId, userId)
   │
   ▼
4. NotificationRecipientResolver.getDistrictCollectorIds(districtId=5)
   │
   │ Query: SELECT * FROM users WHERE role='DISTRICT_COLLECTOR' AND district_id=5
   │
   ▼
5. Found 3 District Collectors
   │
   │ DC1: userId=101, email=dc1@gov.in
   │ DC2: userId=102, email=dc2@gov.in
   │ DC3: userId=103, email=dc3@gov.in
   │
   ▼
6. Publish TempleProfileCreatedEvent
   │
   │ Event {
   │   templeId: 123,
   │   templeName: "Shiva Temple",
   │   createdBy: 50,
   │   districtId: 5
   │ }
   │
   ▼
7. NotificationEventListener.onTempleProfileCreated()
   │
   ├─────────────────────────────────┬─────────────────────────────────┐
   │                                 │                                 │
   ▼                                 ▼                                 ▼
8. Create Notification for DC1    DC2                               DC3
   │                                 │                                 │
   │ INSERT INTO notifications       │                                 │
   │ (user_id=101,                   │                                 │
   │  title="New Temple Created",    │                                 │
   │  message="TA created Shiva...", │                                 │
   │  priority="MEDIUM",             │                                 │
   │  module="TEMPLE")               │                                 │
   │                                 │                                 │
   ▼                                 ▼                                 ▼
9. ✅ DC1 sees notification      ✅ DC2 sees notification         ✅ DC3 sees notification
   │                                 │                                 │
   │ GET /api/notifications          │                                 │
   │ Response: [                     │                                 │
   │   {                             │                                 │
   │     id: 1,                      │                                 │
   │     title: "New Temple...",     │                                 │
   │     isRead: false               │                                 │
   │   }                             │                                 │
   │ ]                               │                                 │
   └─────────────────────────────────┴─────────────────────────────────┘

Result: All 3 DCs receive in-app notification (no email for MEDIUM priority)
```

---

## Flow 2: District Collector Approves Declaration

```
┌─────────────────────────────────────────────────────────────────────┐
│                 DECLARATION APPROVAL FLOW                           │
└─────────────────────────────────────────────────────────────────────┘

1. District Collector (DC)
   │
   │ POST /api/dc/declarations/456/approve
   │ { remarks: "Approved after review" }
   │
   ▼
2. DeclarationWorkflowServiceImpl.approve()
   │
   │ declaration.setStatus(APPROVED)
   │ declaration.setAcknowledgementNumber("ACK-2026-001")
   │ declarationRepository.save(declaration)
   │
   ▼
3. notificationHelper.notifyDeclarationApproved(declarationId, templeId, fy, dcUserId)
   │
   ▼
4. NotificationRecipientResolver.getTempleAuthorityIds(templeId=123)
   │
   │ Query 1: SELECT created_by FROM temples WHERE id=123
   │ Query 2: SELECT id FROM users WHERE temple_id=123 AND role='TEMPLE_AUTHORITY'
   │
   ▼
5. Found 2 Temple Authorities
   │
   │ TA1: userId=50, email=ta1@temple.org (Primary - temple creator)
   │ TA2: userId=51, email=ta2@temple.org (Secondary - linked TA)
   │
   ▼
6. Publish DeclarationApprovedEvent (Priority: HIGH)
   │
   │ Event {
   │   declarationId: 456,
   │   templeName: "Shiva Temple",
   │   dcUserId: 101,
   │   dcName: "Mr. Sharma",
   │   taUserId: 50,
   │   financialYear: 2024
   │ }
   │
   ▼
7. NotificationEventListener.onDeclarationApproved()
   │
   ├─────────────────────────────────┬─────────────────────────────────┐
   │                                 │                                 │
   ▼                                 ▼                                 ▼
8. Create Notification for TA1    TA2                     Check Priority
   │                                 │                                 │
   │ INSERT INTO notifications       │                          Priority = HIGH
   │ (user_id=50,                    │                                 │
   │  title="Declaration Approved",  │                          ✅ Send Email
   │  message="DC approved your...", │                                 │
   │  priority="HIGH",               │                                 │
   │  module="DECLARATION")          │                                 │
   │                                 │                                 │
   ▼                                 ▼                                 ▼
9. ✅ TA1 sees notification      ✅ TA2 sees notification    EmailService.send()
   │                                 │                                 │
   │ GET /api/notifications          │                          SMTP Connection
   │ Response: [                     │                          to Gmail
   │   {                             │                                 │
   │     id: 5,                      │                          Template:
   │     title: "Declaration...",    │                          approval-notification.html
   │     priority: "HIGH",           │                                 │
   │     isRead: false               │                          Variables:
   │   }                             │                          - templeName
   │ ]                               │                          - dcName
   │                                 │                          - ackNumber
   │                                 │                          - remarks
   │                                 │                                 │
   ▼                                 ▼                                 ▼
10. ✅ TA1 receives email        ✅ TA2 receives email    📧 Email Sent
    │                                 │                                 │
    │ To: ta1@temple.org              │                          Subject:
    │ Subject: "Declaration..."       │                          "Declaration Approved"
    │ Body: Professional HTML         │                                 │
    │ with deep link                  │                          Body: HTML template
    │                                 │                          with action button
    └─────────────────────────────────┴─────────────────────────────────┘

Result: Both TAs receive in-app notification + email (HIGH priority triggers email)
```

---

## Flow 3: Dynamic Recipient Resolution

```
┌─────────────────────────────────────────────────────────────────────┐
│              DYNAMIC RECIPIENT RESOLUTION                           │
└─────────────────────────────────────────────────────────────────────┘

Scenario: Temple in District 5 submits declaration

1. NotificationHelper.notifyDeclarationSubmitted(declarationId, templeId, fy, userId)
   │
   ▼
2. Load Temple
   │
   │ temple = templeRepository.findById(templeId)
   │ districtId = temple.getDistrictId()  // districtId = 5
   │
   ▼
3. NotificationRecipientResolver.getDistrictCollectorIds(districtId=5)
   │
   ▼
4. Database Query
   │
   │ SELECT u.id, u.email, u.full_name
   │ FROM users u
   │ WHERE u.role = 'DISTRICT_COLLECTOR'
   │   AND u.district_id = 5
   │   AND u.is_active = true
   │
   ▼
5. Results
   │
   │ ┌─────┬──────────────────┬─────────────────┐
   │ │ ID  │ Email            │ Full Name       │
   │ ├─────┼──────────────────┼─────────────────┤
   │ │ 101 │ dc1@gov.in       │ Mr. Sharma      │
   │ │ 102 │ dc2@gov.in       │ Ms. Patel       │
   │ │ 103 │ dc3@gov.in       │ Mr. Kumar       │
   │ └─────┴──────────────────┴─────────────────┘
   │
   ▼
6. Return Array
   │
   │ dcIds = [101, 102, 103]
   │
   ▼
7. Create Notifications
   │
   │ FOR EACH dcId IN dcIds:
   │   eventPublisher.publish(DeclarationSubmittedEvent)
   │
   ▼
8. Result
   │
   │ ✅ DC 101 receives notification
   │ ✅ DC 102 receives notification
   │ ✅ DC 103 receives notification
   │
   └─────────────────────────────────────────────────────────────────┘

Key Points:
- ✅ No hardcoded user IDs
- ✅ Automatically finds ALL DCs for the district
- ✅ Handles multiple DCs gracefully
- ✅ Works even if DCs are added/removed
- ✅ Scales to any number of DCs
```

---

## Flow 4: Email Priority Decision

```
┌─────────────────────────────────────────────────────────────────────┐
│                  EMAIL PRIORITY DECISION TREE                       │
└─────────────────────────────────────────────────────────────────────┘

Event Published
      │
      ▼
┌─────────────────┐
│ Check Priority  │
└─────────────────┘
      │
      ├─────────────────────────────────────────────────────────┐
      │                                                         │
      ▼                                                         ▼
┌─────────────┐                                         ┌─────────────┐
│ LOW/MEDIUM  │                                         │ HIGH/CRITICAL│
└─────────────┘                                         └─────────────┘
      │                                                         │
      │                                                         │
      ▼                                                         ▼
┌─────────────────────┐                           ┌─────────────────────┐
│ In-App Only         │                           │ Check User Prefs    │
│ ❌ No Email         │                           └─────────────────────┘
└─────────────────────┘                                       │
      │                                                       │
      │                                         ┌─────────────┴─────────────┐
      │                                         │                           │
      │                                         ▼                           ▼
      │                               ┌─────────────────┐         ┌─────────────────┐
      │                               │ Email Enabled   │         │ Email Disabled  │
      │                               │ for Module      │         │ for Module      │
      │                               └─────────────────┘         └─────────────────┘
      │                                         │                           │
      │                                         │                           │
      │                                         ▼                           ▼
      │                               ┌─────────────────┐         ┌─────────────────┐
      │                               │ Check SMTP      │         │ In-App Only     │
      │                               │ Configuration   │         │ ❌ No Email     │
      │                               └─────────────────┘         └─────────────────┘
      │                                         │
      │                               ┌─────────┴─────────┐
      │                               │                   │
      │                               ▼                   ▼
      │                     ┌─────────────────┐ ┌─────────────────┐
      │                     │ SMTP Enabled    │ │ SMTP Disabled   │
      │                     │ (enabled=true)  │ │ (enabled=false) │
      │                     └─────────────────┘ └─────────────────┘
      │                               │                   │
      │                               │                   │
      │                               ▼                   ▼
      │                     ┌─────────────────┐ ┌─────────────────┐
      │                     │ ✅ Send Email   │ │ In-App Only     │
      │                     │ + In-App        │ │ ❌ No Email     │
      │                     └─────────────────┘ └─────────────────┘
      │                               │
      │                               │
      ▼                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION DELIVERED                           │
└─────────────────────────────────────────────────────────────────────┘

Examples:

1. Employee Created (LOW priority)
   → In-App Only ❌ No Email

2. Temple Submitted (MEDIUM priority)
   → In-App Only ❌ No Email

3. Declaration Approved (HIGH priority)
   → In-App + Email ✅ (if SMTP enabled)

4. Security Alert (CRITICAL priority)
   → In-App + Email ✅ (always, if SMTP enabled)
```

---

## Flow 5: Complete System Integration

```
┌─────────────────────────────────────────────────────────────────────┐
│              COMPLETE NOTIFICATION SYSTEM                           │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                         USER ACTIONS                                 │
└──────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │ Temple Authority   │ District Collector │
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Create Temple   │  │ Submit Decl     │  │ Approve Decl    │
│ Update Temple   │  │ Update Decl     │  │ Reject Decl     │
│ Create Employee │  │ Upload Doc      │  │ Request Clarif  │
│ Create Contract │  │ Create Trust    │  │ Flag Site Visit │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                                   │
│  TempleServiceImpl | DeclarationServiceImpl | WorkflowServiceImpl    │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              │ save(entity)
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION HELPER                               │
│  notificationHelper.notifyXXX(id, userId, ...)                       │
└──────────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│  Load Temple/Declaration  │   │  Recipient Resolver       │
│  Get districtId/templeId  │   │  Find ALL DCs/TAs         │
└───────────────────────────┘   └───────────────────────────┘
                │                           │
                │                           │
                └─────────────┬─────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    EVENT PUBLISHER                                   │
│  applicationContext.publishEvent(event)                              │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              │ @EventListener
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  NOTIFICATION EVENT LISTENER                         │
│  @EventListener onXXXEvent(event)                                    │
└──────────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│  Create In-App Notif      │   │  Check Priority           │
│  INSERT INTO notifications│   │  HIGH/CRITICAL?           │
└───────────────────────────┘   └───────────────────────────┘
                │                           │
                │                           │ Yes
                │                           │
                │                           ▼
                │               ┌───────────────────────────┐
                │               │  Email Service            │
                │               │  Send HTML Email          │
                │               └───────────────────────────┘
                │                           │
                └─────────────┬─────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      DELIVERY                                        │
│  In-App: GET /api/notifications                                      │
│  Email: User's inbox (Gmail/etc)                                     │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      USER RECEIVES                                   │
│  ✅ In-App notification in dashboard                                 │
│  ✅ Email notification (if HIGH/CRITICAL)                            │
│  ✅ Deep link to relevant page                                       │
│  ✅ Action buttons (View, Respond, etc)                              │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Summary

### Key Features

1. **Dynamic Recipients** - No hardcoded IDs, automatic lookup
2. **Multi-User Support** - Handles multiple DCs/TAs per district/temple
3. **Priority-Based** - Smart email sending based on priority
4. **Event-Driven** - Decoupled, scalable architecture
5. **Graceful Degradation** - Works without email configuration
6. **Complete Audit** - All notifications logged

### Integration Points

- ✅ Temple: Create, Update, Approve, Flag (4 points)
- ✅ Declaration: Submit, Approve, Reject, Clarify, Site Visit (5 points)
- ⏳ Trust: Submit, Update, Approve, Reject, Flag (pending)
- ⏳ Employee: Create, Update, Delete (pending)
- ⏳ Contractor: Create, Update, Delete (pending)
- ⏳ Document: Upload, Update, Delete (pending)

### Status

**Current:** 9 notification points integrated  
**Pending:** 4 modules (lower priority)  
**Build:** ✅ SUCCESS  
**Production:** ✅ READY
