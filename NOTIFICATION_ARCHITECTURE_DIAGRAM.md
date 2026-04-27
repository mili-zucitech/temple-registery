# Notification System - Architecture Diagrams

## **System Overview**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TEMPLE REGISTRY SYSTEM                               │
│                                                                               │
│  ┌─────────────────┐         ┌─────────────────┐         ┌────────────────┐ │
│  │  Temple         │         │  District       │         │  System        │ │
│  │  Authority      │         │  Collector      │         │  Scheduler     │ │
│  │  Portal         │         │  Portal         │         │  (Cron Jobs)   │ │
│  └────────┬────────┘         └────────┬────────┘         └────────┬───────┘ │
│           │                           │                           │         │
│           │ Submit/Update             │ Approve/Reject            │ Reminders│
│           ▼                           ▼                           ▼         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      SERVICE LAYER                                     │  │
│  │  DeclarationService | EmployeeService | TrustService | etc.           │  │
│  └────────────────────────────┬──────────────────────────────────────────┘  │
│                                │                                             │
│                                │ 1. Execute business logic                   │
│                                │ 2. Save to database                         │
│                                │ 3. eventPublisher.publish(event)            │
│                                ▼                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │              NotificationEventPublisher                                │  │
│  │         (Spring ApplicationEventPublisher wrapper)                     │  │
│  └────────────────────────────┬──────────────────────────────────────────┘  │
│                                │                                             │
│                                │ Spring Event Bus                            │
│                                ▼                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │              NotificationEventListener                                 │  │
│  │         (@EventListener, @Async("taskExecutor"))                       │  │
│  │         Listens to all BaseNotificationEvent subclasses                │  │
│  └────────────────────────────┬──────────────────────────────────────────┘  │
│                                │                                             │
│                                │ Async processing (separate thread)          │
│                                ▼                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │           NotificationDispatchServiceImpl                              │  │
│  │  - Creates InAppNotification records                                   │  │
│  │  - Logs NotificationEvent audit records                                │  │
│  │  - TODO Phase 2: Send emails for HIGH/CRITICAL priority                │  │
│  └────────────────────────────┬──────────────────────────────────────────┘  │
│                                │                                             │
│                                ▼                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      DATABASE                                          │  │
│  │  - in_app_notifications (user inbox)                                   │  │
│  │  - notification_events (audit log)                                     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## **Event Flow Diagram**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         EVENT FLOW SEQUENCE                                   │
└──────────────────────────────────────────────────────────────────────────────┘

Temple Authority                Service Layer              Event System           Database
      │                              │                          │                    │
      │ 1. Submit Declaration        │                          │                    │
      ├─────────────────────────────>│                          │                    │
      │                              │                          │                    │
      │                              │ 2. Update Status         │                    │
      │                              ├─────────────────────────────────────────────>│
      │                              │                          │                    │
      │                              │ 3. Publish Event         │                    │
      │                              ├─────────────────────────>│                    │
      │                              │                          │                    │
      │ 4. Return Success            │                          │                    │
      │<─────────────────────────────┤                          │                    │
      │                              │                          │                    │
      │                              │                          │ 5. Process Event   │
      │                              │                          │    (Async)         │
      │                              │                          │                    │
      │                              │                          │ 6. Create          │
      │                              │                          │    Notification    │
      │                              │                          ├───────────────────>│
      │                              │                          │                    │
      │                              │                          │ 7. Log Event       │
      │                              │                          ├───────────────────>│
      │                              │                          │                    │

District Collector
      │
      │ 8. Check Notifications
      ├─────────────────────────────────────────────────────────────────────────>│
      │                                                                            │
      │ 9. Return Notifications                                                    │
      │<───────────────────────────────────────────────────────────────────────────┤
      │
```

---

## **Event Class Hierarchy**

```
BaseNotificationEvent (Abstract)
│
├── Declaration Events
│   ├── DeclarationSubmittedEvent
│   ├── DeclarationApprovedEvent
│   ├── DeclarationRejectedEvent
│   ├── ClarificationRequestedEvent
│   ├── ClarificationRespondedEvent
│   ├── SiteVisitScheduledEvent
│   ├── DeadlineApproachingEvent
│   └── DeclarationOverdueEvent
│
├── Temple Events
│   ├── TempleProfileCreatedEvent
│   └── TempleProfileUpdatedEvent
│
├── Trust Events
│   └── TrustDataSubmittedEvent
│
├── Employee Events
│   ├── EmployeeCreatedEvent
│   └── EmployeeUpdatedEvent
│
├── Contractor Events
│   ├── ContractorCreatedEvent
│   └── ContractorUpdatedEvent
│
└── Document Events
    └── DocumentUploadedEvent
```

---

## **Notification Routing Matrix**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      NOTIFICATION ROUTING                                    │
└─────────────────────────────────────────────────────────────────────────────┘

Event Type                    Actor       Recipient(s)    Priority    Channel
─────────────────────────────────────────────────────────────────────────────
DeclarationSubmittedEvent     TA    →     DC              HIGH        In-app + Email*
DeclarationApprovedEvent      DC    →     TA              HIGH        In-app + Email*
DeclarationRejectedEvent      DC    →     TA              CRITICAL    In-app + Email*
ClarificationRequestedEvent   DC    →     TA              HIGH        In-app + Email*
ClarificationRespondedEvent   TA    →     DC              MEDIUM      In-app
SiteVisitScheduledEvent       DC    →     TA              HIGH        In-app + Email*
DeadlineApproachingEvent      System →    TA              MEDIUM/     In-app + Email*
                                                          HIGH/
                                                          CRITICAL
DeclarationOverdueEvent       System →    TA + DC         CRITICAL    In-app + Email*

TempleProfileCreatedEvent     TA    →     DC              MEDIUM      In-app
TempleProfileUpdatedEvent     TA    →     DC              LOW         In-app

TrustDataSubmittedEvent       TA    →     DC              HIGH        In-app

EmployeeCreatedEvent          TA    →     DC              LOW         In-app
EmployeeUpdatedEvent          TA    →     DC              LOW         In-app

ContractorCreatedEvent        TA    →     DC              LOW         In-app
ContractorUpdatedEvent        TA    →     DC              LOW         In-app

DocumentUploadedEvent         TA    →     DC              LOW         In-app

*Email in Phase 2
```

---

## **Database Schema**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐
│   in_app_notifications       │
├──────────────────────────────┤
│ id (PK)                      │
│ user_id (FK → users)         │
│ title                        │
│ body (TEXT)                  │
│ reference_id                 │
│ reference_type               │
│ is_read                      │
│ read_at                      │
│ created_at                   │
│                              │
│ Indexes:                     │
│ - (user_id, is_read)         │
│ - (created_at DESC)          │
└──────────────────────────────┘

┌──────────────────────────────┐
│   notification_events        │
├──────────────────────────────┤
│ id (PK)                      │
│ recipient_id (FK → users)    │
│ event_type                   │
│ reference_id                 │
│ reference_type               │
│ channel (IN_APP/EMAIL)       │
│ status (SENT/FAILED)         │
│ failure_reason               │
│ dispatched_at                │
│                              │
│ Indexes:                     │
│ - (recipient_id)             │
│ - (event_type)               │
└──────────────────────────────┘

┌──────────────────────────────┐  (Phase 2)
│ user_notification_prefs      │
├──────────────────────────────┤
│ id (PK)                      │
│ user_id (FK → users)         │
│ module_type                  │
│ in_app_enabled               │
│ email_enabled                │
│ created_at                   │
│ updated_at                   │
│                              │
│ Unique:                      │
│ - (user_id, module_type)     │
└──────────────────────────────┘

┌──────────────────────────────┐  (Phase 2)
│   email_delivery_logs        │
├──────────────────────────────┤
│ id (PK)                      │
│ notification_event_id (FK)   │
│ recipient_email              │
│ subject                      │
│ status (SENT/FAILED/BOUNCED) │
│ sent_at                      │
│ failure_reason               │
└──────────────────────────────┘
```

---

## **Component Interaction Diagram**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPONENT INTERACTION                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + TypeScript)                        │
│                                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │ Notification │    │ Notification │    │ Notification │                  │
│  │    Bell      │    │   Dropdown   │    │  Inbox Page  │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                           │
│         └───────────────────┴───────────────────┘                           │
│                             │                                                │
│                             │ RTK Query API                                  │
│                             ▼                                                │
│                    ┌─────────────────┐                                       │
│                    │ notificationApi │                                       │
│                    └────────┬────────┘                                       │
│                             │                                                │
└─────────────────────────────┼────────────────────────────────────────────────┘
                              │
                              │ HTTP REST API
                              │
┌─────────────────────────────┼────────────────────────────────────────────────┐
│                             ▼                                                 │
│                    ┌─────────────────────┐                                   │
│                    │ NotificationController                                  │
│                    │ /api/v1/notifications                                   │
│                    └────────┬────────────┘                                   │
│                             │                                                 │
│                             ▼                                                 │
│                    ┌─────────────────────┐                                   │
│                    │ NotificationService  │                                  │
│                    └────────┬────────────┘                                   │
│                             │                                                 │
│                             ▼                                                 │
│                    ┌─────────────────────┐                                   │
│                    │ InAppNotification   │                                   │
│                    │    Repository       │                                   │
│                    └─────────────────────┘                                   │
│                                                                               │
│                         BACKEND (Spring Boot + Java 21)                      │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## **Async Processing Flow**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ASYNC PROCESSING FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

Main Thread                          Async Thread Pool (taskExecutor)
    │                                           │
    │ 1. Business Logic                        │
    │    (Submit Declaration)                  │
    │                                           │
    │ 2. Save to Database                      │
    │    (Transaction Commit)                  │
    │                                           │
    │ 3. Publish Event                         │
    │    eventPublisher.publish(event)         │
    ├──────────────────────────────────────────>│
    │                                           │
    │ 4. Return to Client                      │ 5. Process Event
    │    (HTTP 200 OK)                         │    (Separate Transaction)
    │                                           │
    │                                           │ 6. Create Notification
    │                                           │    (Insert into DB)
    │                                           │
    │                                           │ 7. Log Event
    │                                           │    (Insert into DB)
    │                                           │
    │                                           │ 8. Send Email (Phase 2)
    │                                           │    (If HIGH/CRITICAL)
    │                                           │
    │                                           ▼
    │                                      Complete
    │
    ▼
Client receives response
(Notification processing continues in background)
```

---

## **Priority Escalation Logic**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DEADLINE REMINDER PRIORITY                                │
└─────────────────────────────────────────────────────────────────────────────┘

Days Remaining          Priority        Channels            Frequency
──────────────────────────────────────────────────────────────────────────────
7 days                  MEDIUM          In-app + Email*     Once
3 days                  HIGH            In-app + Email*     Once
1 day                   CRITICAL        In-app + Email*     Once
0 days (overdue)        CRITICAL        In-app + Email*     Daily until resolved

*Email in Phase 2

┌─────────────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION PRIORITY COLORS                              │
└─────────────────────────────────────────────────────────────────────────────┘

Priority        Badge Color     Icon        Use Case
──────────────────────────────────────────────────────────────────────────────
LOW             Gray            ℹ️          Informational updates
MEDIUM          Blue            📋          Standard workflow notifications
HIGH            Orange          ⚠️          Requires attention
CRITICAL        Red             🚨          Urgent action required
```

---

## **Error Handling Flow**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ERROR HANDLING FLOW                                     │
└─────────────────────────────────────────────────────────────────────────────┘

Event Published
    │
    ▼
NotificationEventListener
    │
    ├─ Try: Process Event
    │   │
    │   ▼
    │  NotificationDispatchService
    │   │
    │   ├─ Try: Create Notification
    │   │   │
    │   │   ├─ Success → Log as SENT
    │   │   │
    │   │   └─ Failure → Catch Exception
    │   │               │
    │   │               ├─ Log Error
    │   │               │
    │   │               └─ Log as FAILED (with reason)
    │   │
    │   └─ Return (don't rethrow)
    │
    └─ Catch: Any Exception
        │
        ├─ Log Error
        │
        └─ Don't Rethrow (fire-and-forget)

Main Transaction: ✅ Committed (unaffected by notification failure)
```

---

## **Phase 2: Email Integration**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EMAIL INTEGRATION (Phase 2)                             │
└─────────────────────────────────────────────────────────────────────────────┘

NotificationDispatchService
    │
    ├─ 1. Create In-App Notification
    │
    ├─ 2. Check Priority (HIGH or CRITICAL?)
    │   │
    │   ├─ Yes → Check User Preferences
    │   │   │
    │   │   ├─ Email Enabled?
    │   │   │   │
    │   │   │   ├─ Yes → Send Email
    │   │   │   │   │
    │   │   │   │   ├─ Load Template
    │   │   │   │   │
    │   │   │   │   ├─ Populate Data
    │   │   │   │   │
    │   │   │   │   ├─ Send via SMTP
    │   │   │   │   │
    │   │   │   │   └─ Log Delivery
    │   │   │   │
    │   │   │   └─ No → Skip Email
    │   │   │
    │   │   └─ Log Event
    │   │
    │   └─ No → Skip Email
    │
    └─ 3. Return
```

---

## **Frontend Notification Center (Phase 3)**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND NOTIFICATION CENTER                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Header                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Logo    Navigation    Search    [🔔 5]  Profile                       │ │
│  │                                    │                                    │ │
│  │                                    ▼                                    │ │
│  │                          ┌──────────────────┐                          │ │
│  │                          │ Notification     │                          │ │
│  │                          │ Dropdown         │                          │ │
│  │                          ├──────────────────┤                          │ │
│  │                          │ 🚨 Declaration   │                          │ │
│  │                          │    Rejected      │                          │ │
│  │                          ├──────────────────┤                          │ │
│  │                          │ ⚠️  Clarification│                          │ │
│  │                          │    Required      │                          │ │
│  │                          ├──────────────────┤                          │ │
│  │                          │ 📋 New Employee  │                          │ │
│  │                          │    Created       │                          │ │
│  │                          ├──────────────────┤                          │ │
│  │                          │ View All →       │                          │ │
│  │                          └──────────────────┘                          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Notification Inbox Page                                                     │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Notifications                                    [Mark All Read]      │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │  [All] [Approvals] [Reminders] [Actions Required]                     │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │  Search: [_____________]  Filter: [Module ▼] [Priority ▼] [Date ▼]   │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                         │ │
│  │  🚨 Declaration Rejected                              2 hours ago      │ │
│  │  Your asset declaration for FY 2024 has been rejected...              │ │
│  │  [View Details]                                                        │ │
│  │                                                                         │ │
│  │  ⚠️  Clarification Required                           5 hours ago      │ │
│  │  The District Collector has requested clarification...                │ │
│  │  [Respond]                                                             │ │
│  │                                                                         │ │
│  │  📋 New Employee Created                              1 day ago        │ │
│  │  New employee record created for Test Temple...                       │ │
│  │  [View]                                                                │ │
│  │                                                                         │ │
│  │  [Load More]                                                           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

**End of Architecture Diagrams**
