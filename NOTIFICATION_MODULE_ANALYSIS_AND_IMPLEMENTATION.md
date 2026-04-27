# Notification Module - Complete Analysis & Implementation Plan

## Current State Analysis

### What Already Exists ✅

#### 1. Database Schema (V43__enhance_notification_schema.sql)
- ✅ `in_app_notifications` table with priority, category, action_url
- ✅ `notification_events` table for event tracking
- ✅ `user_notification_preferences` table
- ✅ `email_delivery_logs` table
- ✅ Proper indexes for performance

#### 2. Entity Classes
- ✅ `InAppNotification.java`
- ✅ `NotificationEvent.java`
- ✅ `NotificationPreference.java`
- ✅ `EmailDeliveryLog.java`

#### 3. Event System (New Async System)
- ✅ Base event class: `BaseNotificationEvent`
- ✅ Event listener: `NotificationEventListener`
- ✅ Event publisher: `service.notification.NotificationEventPublisher`
- ✅ Dispatch service: `NotificationDispatchService`

#### 4. Existing Events
**Temple Events:**
- ✅ TempleProfileCreatedEvent
- ✅ TempleProfileApprovedEvent
- ✅ TempleProfileRejectedEvent
- ✅ TempleProfileFlaggedEvent
- ✅ TempleProfileUpdatedEvent

**Trust Events:**
- ✅ TrustDataSubmittedEvent
- ✅ TrustDataApprovedEvent
- ✅ TrustDataRejectedEvent
- ✅ TrustDataFlaggedEvent
- ✅ TrustDataUpdatedEvent

**Declaration Events:**
- ✅ DeclarationSubmittedEvent
- ✅ DeclarationApprovedEvent
- ✅ DeclarationRejectedEvent
- ✅ DeclarationFlaggedEvent
- ✅ DeclarationUpdatedEvent
- ✅ ClarificationRequestedEvent
- ✅ ClarificationRespondedEvent
- ✅ DeclarationMarkedForPhysicalVisitEvent
- ✅ SiteVisitScheduledEvent
- ✅ DeadlineApproachingEvent
- ✅ DeclarationOverdueEvent

#### 5. Services
- ✅ NotificationService (query notifications)
- ✅ NotificationPreferenceService
- ✅ EmailService
- ✅ NotificationHelper
- ✅ NotificationRecipientResolver

#### 6. Controllers
- ✅ NotificationController (GET, mark as read, delete)
- ✅ NotificationPreferenceController

#### 7. Old System (Being Replaced)
- ⚠️ `service.dc.NotificationEventPublisher` - synchronous, database-based
- ⚠️ Used in some services but should be migrated to new event system

---

## What Needs to Be Built 🔨

### 1. Missing Events

#### Board Member Events (NEW)
- ❌ BoardMemberAddedEvent
- ❌ BoardMemberUpdatedEvent
- ❌ BoardMemberRemovedEvent
- ❌ BoardMemberApprovedEvent
- ❌ BoardMemberRejectedEvent

#### Employee Events (NEW)
- ❌ EmployeeCreatedEvent
- ❌ EmployeeUpdatedEvent
- ❌ EmployeeStatusChangedEvent

#### Contractor Events (NEW)
- ❌ ContractorCreatedEvent
- ❌ ContractorUpdatedEvent
- ❌ ContractorStatusChangedEvent

#### Document Events (NEW)
- ❌ DocumentUploadedEvent
- ❌ DocumentVerifiedEvent
- ❌ DocumentRejectedEvent

### 2. Service Integration

#### Services That Need Event Integration:
1. ❌ **TempleServiceImpl** - Temple profile submission
2. ❌ **TrustServiceImpl** - Trust submission (partially done)
3. ❌ **DeclarationServiceImpl** - Declaration submission (partially done)
4. ❌ **GovernanceWorkflowServiceImpl** - Approval/rejection workflows (uses old system)
5. ❌ **EmployeeServiceImpl** - Employee CRUD operations
6. ❌ **ContractorServiceImpl** - Contractor CRUD operations
7. ❌ **DocumentServiceImpl** - Document upload/verification
8. ❌ **DcTempleVerificationServiceImpl** - Temple verification by DC
9. ❌ **DeclarationWorkflowServiceImpl** - Declaration workflow actions

### 3. Notification Dispatch Implementation

#### NotificationDispatchServiceImpl needs:
- ❌ Complete event-to-notification mapping
- ❌ User preference checking
- ❌ Email template rendering
- ❌ Retry logic for failed emails

### 4. Email Templates
- ❌ Temple profile approved/rejected templates
- ❌ Trust data approved/rejected templates
- ❌ Declaration approved/rejected templates
- ❌ Clarification request templates
- ❌ Board member notification templates
- ❌ Employee/Contractor notification templates

### 5. Helper Services
- ❌ **NotificationRecipientResolver** - Find DC/TA user IDs
- ❌ **NotificationTemplateService** - Render email templates

### 6. Migration Tasks
- ❌ Replace old `service.dc.NotificationEventPublisher` with new event system
- ❌ Update all services using old publisher

---

## Implementation Plan

### Phase 1: Create Missing Events (Priority: HIGH)
1. Create board member events
2. Create employee events
3. Create contractor events
4. Create document events

### Phase 2: Implement NotificationRecipientResolver (Priority: HIGH)
- Method to find DC user ID for a district
- Method to find TA user ID for a temple
- Method to find all admins

### Phase 3: Integrate Events into Services (Priority: HIGH)
1. TempleServiceImpl - submit temple profile
2. TrustServiceImpl - submit trust data
3. DeclarationServiceImpl - submit declaration
4. GovernanceWorkflowServiceImpl - approve/reject workflows
5. EmployeeServiceImpl - CRUD operations
6. ContractorServiceImpl - CRUD operations
7. DocumentServiceImpl - upload/verify documents

### Phase 4: Complete NotificationDispatchServiceImpl (Priority: MEDIUM)
- Implement event-to-notification mapping
- Add user preference checking
- Integrate email service

### Phase 5: Create Email Templates (Priority: MEDIUM)
- Thymeleaf templates for all notification types
- Test email rendering

### Phase 6: Migration (Priority: LOW)
- Replace old notification publisher usage
- Remove deprecated code

---

## Notification Flow Summary

### Temple Authority → DC Notifications

| Action | Event | Recipient | Notification |
|--------|-------|-----------|--------------|
| TA submits temple profile | TempleProfileCreatedEvent | DC | "New temple profile submitted: {templeName}" |
| TA submits trust data | TrustDataSubmittedEvent | DC | "Trust data submitted for {templeName}: {trustName}" |
| TA submits declaration | DeclarationSubmittedEvent | DC | "New declaration submitted for {templeName} (FY {year})" |
| TA adds board member | BoardMemberAddedEvent | DC | "New board member added to {trustName}" |
| TA adds employee | EmployeeCreatedEvent | DC | "New employee added: {employeeName}" |
| TA adds contractor | ContractorCreatedEvent | DC | "New contractor added: {contractorName}" |
| TA uploads document | DocumentUploadedEvent | DC | "New document uploaded for {templeName}" |
| TA responds to clarification | ClarificationRespondedEvent | DC | "Clarification response received for declaration" |

### DC → Temple Authority Notifications

| Action | Event | Recipient | Notification |
|--------|-------|-----------|--------------|
| DC approves temple profile | TempleProfileApprovedEvent | TA | "Your temple profile '{templeName}' has been approved" |
| DC rejects temple profile | TempleProfileRejectedEvent | TA | "Your temple profile '{templeName}' has been rejected" |
| DC flags temple profile | TempleProfileFlaggedEvent | TA | "Your temple profile '{templeName}' has been flagged" |
| DC approves trust data | TrustDataApprovedEvent | TA | "Trust data approved for {trustName}" |
| DC rejects trust data | TrustDataRejectedEvent | TA | "Trust data rejected for {trustName}" |
| DC approves declaration | DeclarationApprovedEvent | TA | "Declaration approved for FY {year}. Ack: {ackNumber}" |
| DC rejects declaration | DeclarationRejectedEvent | TA | "Declaration rejected for FY {year}" |
| DC requests clarification | ClarificationRequestedEvent | TA | "Clarification required for your declaration" |
| DC schedules site visit | SiteVisitScheduledEvent | TA | "Site visit scheduled for {templeName}" |
| DC approves board member | BoardMemberApprovedEvent | TA | "Board member approved: {memberName}" |
| DC rejects board member | BoardMemberRejectedEvent | TA | "Board member rejected: {memberName}" |

---

## Next Steps

1. ✅ Create this analysis document
2. 🔨 Implement NotificationRecipientResolver
3. 🔨 Create missing event classes
4. 🔨 Integrate events into all services
5. 🔨 Complete NotificationDispatchServiceImpl
6. 🔨 Create email templates
7. 🔨 Test end-to-end notification flow
8. 🔨 Migrate from old notification system

