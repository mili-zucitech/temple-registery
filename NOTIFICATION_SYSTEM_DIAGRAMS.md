# Notification System - Visual Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NOTIFICATION SYSTEM                              │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ Temple   │ │  Trust   │ │Declaration│ │ Employee │ │Contractor│     │
│  │ Service  │ │ Service  │ │  Service  │ │ Service  │ │ Service  │     │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘     │
└───────┼────────────┼────────────┼────────────┼────────────┼────────────┘
        │            │            │            │            │
        │ publish    │ publish    │ publish    │ publish    │ publish
        │ event      │ event      │ event      │ event      │ event
        ↓            ↓            ↓            ↓            ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION EVENT PUBLISHER                          │
│                  (Spring ApplicationEventPublisher)                      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ Spring Event Bus
                                 ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION EVENT LISTENER                           │
│                         (@Async Processing)                              │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ dispatch(event)
                                 ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                  NOTIFICATION DISPATCH SERVICE                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 1. Resolve Recipients (NotificationRecipientResolver)            │  │
│  │ 2. Check User Preferences (NotificationPreferenceService)        │  │
│  │ 3. Create Notifications                                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────┬──────────────────────────┬─────────────────────────┘
                     │                          │
         ┌───────────┴──────────┐   ┌──────────┴──────────┐
         │                      │   │                     │
         ↓                      ↓   ↓                     ↓
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  In-App Notif.  │   │ Notification    │   │  Email Service  │
│   Repository    │   │ Event Repository│   │   (SMTP)        │
└─────────────────┘   └─────────────────┘   └─────────────────┘
         │                      │                     │
         ↓                      ↓                     ↓
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ in_app_         │   │ notification_   │   │ email_delivery_ │
│ notifications   │   │ events          │   │ logs            │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

---

## Notification Flow - Temple Authority Submits Declaration

```
┌─────────────┐
│   Temple    │
│  Authority  │
│   (User)    │
└──────┬──────┘
       │
       │ 1. POST /api/v1/declarations/{id}/submit
       ↓
┌─────────────────────────────────────────────────────────┐
│         DeclarationService.submit()                     │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 1. declaration.setStatus(SUBMITTED)               │ │
│  │ 2. declarationRepository.save(declaration)        │ │
│  │ 3. eventPublisher.publish(                        │ │
│  │      new DeclarationSubmittedEvent(...))          │ │
│  └───────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ Event Published
                         ↓
┌─────────────────────────────────────────────────────────┐
│      NotificationEventListener (@Async)                 │
│  ┌───────────────────────────────────────────────────┐ │
│  │ @EventListener                                    │ │
│  │ handleNotificationEvent(BaseNotificationEvent)    │ │
│  └───────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ dispatch(event)
                         ↓
┌─────────────────────────────────────────────────────────┐
│      NotificationDispatchService.dispatch()             │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 1. Get recipients from event.getRecipientIds()   │ │
│  │    → [DC User ID: 100]                           │ │
│  │                                                   │ │
│  │ 2. Check preferences for DC User 100             │ │
│  │    → DECLARATION module: in-app=true, email=true │ │
│  │                                                   │ │
│  │ 3. Create in-app notification                    │ │
│  │    → Save to in_app_notifications table          │ │
│  │                                                   │ │
│  │ 4. Check priority: HIGH                          │ │
│  │    → Send email (HIGH priority + email enabled)  │ │
│  │                                                   │ │
│  │ 5. Log notification event                        │ │
│  │    → Save to notification_events table           │ │
│  └───────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ↓                               ↓
┌─────────────────┐           ┌─────────────────┐
│  Database       │           │  Email Service  │
│  ┌───────────┐  │           │  ┌───────────┐  │
│  │ in_app_   │  │           │  │ Send SMTP │  │
│  │ notif.    │  │           │  │ email to  │  │
│  │ created   │  │           │  │ DC        │  │
│  └───────────┘  │           │  └───────────┘  │
└─────────────────┘           └─────────────────┘
         │                               │
         │                               │
         ↓                               ↓
┌─────────────┐               ┌─────────────┐
│  District   │               │  District   │
│  Collector  │◄──────────────┤  Collector  │
│  (UI)       │  Sees notif.  │  (Email)    │
└─────────────┘               └─────────────┘
```

---

## Notification Flow - DC Approves Declaration

```
┌─────────────┐
│  District   │
│  Collector  │
│   (User)    │
└──────┬──────┘
       │
       │ 1. POST /api/v1/dc/declarations/{id}/approve
       ↓
┌─────────────────────────────────────────────────────────┐
│    GovernanceWorkflowService.approveDeclaration()       │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 1. declaration.setStatus(APPROVED)                │ │
│  │ 2. Generate acknowledgement number                │ │
│  │ 3. declarationRepository.save(declaration)        │ │
│  │ 4. eventPublisher.publish(                        │ │
│  │      new DeclarationApprovedEvent(...))           │ │
│  └───────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ Event Published
                         ↓
┌─────────────────────────────────────────────────────────┐
│      NotificationEventListener (@Async)                 │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ dispatch(event)
                         ↓
┌─────────────────────────────────────────────────────────┐
│      NotificationDispatchService.dispatch()             │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 1. Get recipients from event.getRecipientIds()   │ │
│  │    → [TA User ID: 50]                            │ │
│  │                                                   │ │
│  │ 2. Check preferences for TA User 50              │ │
│  │    → DECLARATION module: in-app=true, email=true │ │
│  │                                                   │ │
│  │ 3. Create in-app notification                    │ │
│  │    Title: "Declaration Approved"                 │ │
│  │    Body: "Your declaration for FY 2024 has been  │ │
│  │           approved. Ack: ACK-2024-001"           │ │
│  │                                                   │ │
│  │ 4. Send email (HIGH priority)                    │ │
│  └───────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ↓                               ↓
┌─────────────────┐           ┌─────────────────┐
│  Database       │           │  Email Service  │
└─────────────────┘           └─────────────────┘
         │                               │
         ↓                               ↓
┌─────────────┐               ┌─────────────┐
│   Temple    │               │   Temple    │
│  Authority  │◄──────────────┤  Authority  │
│    (UI)     │  Sees notif.  │   (Email)   │
└─────────────┘               └─────────────┘
```

---

## Database Schema

```
┌─────────────────────────────────────────────────────────┐
│              in_app_notifications                       │
├─────────────────────────────────────────────────────────┤
│ id                BIGINT (PK)                           │
│ user_id           BIGINT (FK → users.id)               │
│ title             VARCHAR(255)                          │
│ body              TEXT                                  │
│ priority          VARCHAR(20) [LOW, MEDIUM, HIGH, ...]│
│ category          VARCHAR(30) [SUBMISSION, APPROVAL, ...]│
│ action_url        VARCHAR(255)                          │
│ reference_type    VARCHAR(50) [TEMPLE, DECLARATION, ...]│
│ reference_id      BIGINT                                │
│ is_read           BOOLEAN                               │
│ created_at        DATETIME(6)                           │
│ updated_at        DATETIME(6)                           │
└─────────────────────────────────────────────────────────┘
                    │
                    │ FK
                    ↓
┌─────────────────────────────────────────────────────────┐
│                    users                                │
├─────────────────────────────────────────────────────────┤
│ id                BIGINT (PK)                           │
│ email             VARCHAR(255)                          │
│ full_name         VARCHAR(255)                          │
│ role              VARCHAR(50)                           │
│ district_id       BIGINT                                │
│ temple_id         BIGINT                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│           user_notification_preferences                 │
├─────────────────────────────────────────────────────────┤
│ id                BIGINT (PK)                           │
│ user_id           BIGINT (FK → users.id)               │
│ module_type       VARCHAR(30) [TEMPLE, TRUST, ...]    │
│ in_app_enabled    BOOLEAN                              │
│ email_enabled     BOOLEAN                              │
│ created_at        DATETIME(6)                           │
│ updated_at        DATETIME(6)                           │
│ UNIQUE(user_id, module_type)                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              notification_events                        │
├─────────────────────────────────────────────────────────┤
│ id                BIGINT (PK)                           │
│ recipient_id      BIGINT                                │
│ event_type        VARCHAR(100)                          │
│ reference_id      BIGINT                                │
│ reference_type    VARCHAR(50)                           │
│ channel           VARCHAR(20) [IN_APP, EMAIL]          │
│ status            VARCHAR(20) [SENT, FAILED, ...]      │
│ failure_reason    TEXT                                  │
│ created_at        DATETIME(6)                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│             email_delivery_logs                         │
├─────────────────────────────────────────────────────────┤
│ id                BIGINT (PK)                           │
│ notification_event_id  BIGINT (FK)                     │
│ recipient_email   VARCHAR(255)                          │
│ subject           VARCHAR(500)                          │
│ template_name     VARCHAR(100)                          │
│ status            VARCHAR(20) [SENT, FAILED, BOUNCED]  │
│ sent_at           DATETIME(6)                           │
│ failure_reason    VARCHAR(1000)                         │
│ retry_count       INT                                   │
└─────────────────────────────────────────────────────────┘
```

---

## Event Class Hierarchy

```
BaseNotificationEvent (Abstract)
│
├── Temple Events
│   ├── TempleProfileCreatedEvent
│   ├── TempleProfileApprovedEvent
│   ├── TempleProfileRejectedEvent
│   ├── TempleProfileFlaggedEvent
│   └── TempleProfileUpdatedEvent
│
├── Trust Events
│   ├── TrustDataSubmittedEvent
│   ├── TrustDataApprovedEvent
│   ├── TrustDataRejectedEvent
│   ├── TrustDataFlaggedEvent
│   └── TrustDataUpdatedEvent
│
├── Declaration Events
│   ├── DeclarationSubmittedEvent
│   ├── DeclarationApprovedEvent
│   ├── DeclarationRejectedEvent
│   ├── DeclarationFlaggedEvent
│   ├── DeclarationUpdatedEvent
│   ├── ClarificationRequestedEvent
│   ├── ClarificationRespondedEvent
│   ├── DeclarationMarkedForPhysicalVisitEvent
│   ├── SiteVisitScheduledEvent
│   ├── DeadlineApproachingEvent
│   └── DeclarationOverdueEvent
│
├── Board Member Events
│   ├── BoardMemberAddedEvent
│   ├── BoardMemberUpdatedEvent
│   ├── BoardMemberApprovedEvent
│   ├── BoardMemberRejectedEvent
│   └── BoardMemberRemovedEvent
│
├── Employee Events
│   ├── EmployeeCreatedEvent
│   ├── EmployeeUpdatedEvent
│   └── EmployeeDeletedEvent
│
├── Contractor Events
│   ├── ContractorCreatedEvent
│   ├── ContractorUpdatedEvent
│   └── ContractorDeletedEvent
│
└── Document Events
    ├── DocumentUploadedEvent
    ├── DocumentUpdatedEvent
    └── DocumentDeletedEvent
```

---

## Notification Priority & Email Behavior

```
┌─────────────┬──────────────┬─────────────┬──────────────┐
│  Priority   │  In-App      │   Email     │  Use Case    │
├─────────────┼──────────────┼─────────────┼──────────────┤
│  LOW        │  ✓ Always    │  ✗ Never    │ Informational│
│             │              │             │ updates      │
├─────────────┼──────────────┼─────────────┼──────────────┤
│  MEDIUM     │  ✓ Always    │  ✗ Never    │ Important    │
│             │              │             │ updates      │
├─────────────┼──────────────┼─────────────┼──────────────┤
│  HIGH       │  ✓ Always    │  ✓ If       │ Requires     │
│             │              │  enabled    │ attention    │
├─────────────┼──────────────┼─────────────┼──────────────┤
│  CRITICAL   │  ✓ Always    │  ✓ If       │ Urgent       │
│             │              │  enabled    │ action needed│
└─────────────┴──────────────┴─────────────┴──────────────┘
```

---

## User Preference Flow

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ 1. GET /api/v1/notification-preferences
       ↓
┌─────────────────────────────────────────────────────────┐
│    NotificationPreferenceController.getPreferences()    │
└────────────────────────┬────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│    NotificationPreferenceService.getPreferences()       │
└────────────────────────┬────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│         user_notification_preferences table             │
│  ┌───────────────────────────────────────────────────┐ │
│  │ user_id=50, module=TEMPLE, in_app=true, email=true│ │
│  │ user_id=50, module=TRUST, in_app=true, email=false│ │
│  │ user_id=50, module=DECLARATION, in_app=true, ...  │ │
│  └───────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
                         ↓
┌─────────────┐
│    User     │ Sees preferences
└─────────────┘

User updates preference:
PUT /api/v1/notification-preferences
{
  "moduleType": "DECLARATION",
  "inAppEnabled": true,
  "emailEnabled": false
}

Result: User will receive in-app notifications for declarations
        but NOT email notifications
```

---

## Complete Notification Lifecycle

```
1. USER ACTION
   TA submits declaration
   ↓

2. SERVICE LAYER
   DeclarationService.submit()
   - Update entity state
   - Publish event
   ↓

3. EVENT PUBLISHER
   NotificationEventPublisher.publish()
   - Wrap event in Spring event
   ↓

4. EVENT BUS
   Spring ApplicationEventPublisher
   - Async delivery to listeners
   ↓

5. EVENT LISTENER
   NotificationEventListener.handleNotificationEvent()
   - Receive event asynchronously
   - Call dispatch service
   ↓

6. DISPATCH SERVICE
   NotificationDispatchService.dispatch()
   - Resolve recipients
   - Check preferences
   - Create notifications
   ↓

7. PERSISTENCE
   - Save to in_app_notifications
   - Save to notification_events
   - Send email (if applicable)
   ↓

8. USER SEES NOTIFICATION
   - In-app: GET /api/v1/notifications
   - Email: Inbox
   ↓

9. USER INTERACTS
   - Mark as read
   - Click action URL
   - Delete notification
```

---

## Recipient Resolution Flow

```
┌─────────────────────────────────────────────────────────┐
│         NotificationRecipientResolver                   │
└─────────────────────────────────────────────────────────┘

TA Action → Notify DC:
┌─────────────┐
│ Temple ID   │
└──────┬──────┘
       │
       │ getDistrictCollectorsForTemple(templeId)
       ↓
┌─────────────────────────────────────────────────────────┐
│ 1. Find temple by ID                                    │
│ 2. Get temple.districtId                                │
│ 3. Find all users with role=DISTRICT_COLLECTOR          │
│    and districtId=temple.districtId                     │
│ 4. Return array of DC user IDs                          │
└────────────────────────┬────────────────────────────────┘
                         │
                         ↓
                   [DC User IDs]

DC Action → Notify TA:
┌─────────────┐
│ Temple ID   │
└──────┬──────┘
       │
       │ getTempleAuthorityIds(templeId)
       ↓
┌─────────────────────────────────────────────────────────┐
│ 1. Find temple by ID                                    │
│ 2. Get temple.createdBy (primary TA)                    │
│ 3. Find any linked TA users for this temple            │
│ 4. Return array of TA user IDs                          │
└────────────────────────┬────────────────────────────────┘
                         │
                         ↓
                   [TA User IDs]
```

---

## Summary

These diagrams show:
1. **System Architecture** - How components interact
2. **Notification Flows** - Step-by-step process
3. **Database Schema** - Data structure
4. **Event Hierarchy** - All available events
5. **Priority & Email** - When emails are sent
6. **User Preferences** - How preferences work
7. **Complete Lifecycle** - End-to-end flow
8. **Recipient Resolution** - How recipients are found

Use these diagrams to understand the notification system architecture and flow!

