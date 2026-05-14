# Temple Profile Workflow Diagrams

## 1. Complete End-to-End Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TEMPLE AUTHORITY (TA) SIDE                          │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  START   │
    └────┬─────┘
         │
         ▼
    ┌─────────────────────┐
    │ Create/Update DRAFT │ ◄──────────────┐
    │  Profile Staging    │                │
    └────┬────────────────┘                │
         │                                 │
         │ POST /temples/{id}/profile/staging
         │                                 │
         ▼                                 │
    ┌─────────────────────┐                │
    │   Status: DRAFT     │                │
    │  (TA can edit)      │                │
    └────┬────────────────┘                │
         │                                 │
         │ POST /temples/{id}/profile/submit
         │                                 │
         ▼                                 │
    ┌─────────────────────┐                │
    │ Status: SUBMITTED   │                │
    │ (Editing locked)    │                │
    └────┬────────────────┘                │
         │                                 │
         │ Notification sent to DC         │
         │                                 │
         ▼                                 │

┌─────────────────────────────────────────────────────────────────────────────┐
│                      DISTRICT COLLECTOR (DC) SIDE                           │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────┐
    │  DC Reviews Profile │
    │ GET /dc/temples/{id}│
    └────┬────────────────┘
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
    ┌─────────┐      ┌──────────┐      ┌──────────┐
    │ APPROVE │      │  REJECT  │      │   FLAG   │
    └────┬────┘      └────┬─────┘      └────┬─────┘
         │                │                  │
         │ POST /dc/profiles/{stagingId}/approve
         │                │                  │
         │                │ POST /dc/profiles/{stagingId}/reject
         │                │                  │
         │                │                  │ POST /dc/temples/{id}/flag
         │                │                  │
         ▼                ▼                  ▼
    ┌─────────┐      ┌──────────┐      ┌──────────┐
    │Promoted │      │ Rejected │      │ Flagged  │
    │to Main  │      │TA can    │      │TA must   │
    │Table    │      │resubmit  │      │fix issues│
    └────┬────┘      └────┬─────┘      └────┬─────┘
         │                │                  │
         │                └──────────────────┘
         │                         │
         │                         └──────────────────┘
         │
         ▼
    ┌─────────────────────┐
    │  Profile Published  │
    │   TA Notified       │
    └─────────────────────┘
```

---

## 2. Temple Verification States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TEMPLE VERIFICATION LIFECYCLE                            │
└─────────────────────────────────────────────────────────────────────────────┘

                        ┌──────────────┐
                        │  UNVERIFIED  │ ◄─────────┐
                        │  (Default)   │           │
                        └──┬────────┬──┘           │
                           │        │              │
              POST /verify │        │ POST /flag   │
                           │        │              │
                           ▼        ▼              │
                    ┌──────────┐  ┌──────────┐    │
                    │ VERIFIED │  │ FLAGGED  │    │
                    │          │  │          │    │
                    └──────┬───┘  └───┬──────┘    │
                           │          │           │
                           │          │           │
              POST /flag   │          │ POST /unflag
                           │          │           │
                           │          └───────────┘
                           │
                           │ POST /verify
                           │
                           ▼
                    ┌──────────────┐
                    │   VERIFIED   │
                    │ (flag removed)│
                    └──────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         MUTUAL EXCLUSIVITY RULES                            │
└─────────────────────────────────────────────────────────────────────────────┘

    ✓ A temple can be VERIFIED
    ✓ A temple can be FLAGGED
    ✗ A temple CANNOT be both VERIFIED and FLAGGED simultaneously

    When VERIFIED → POST /flag → Becomes FLAGGED (verification removed)
    When FLAGGED → POST /verify → Becomes VERIFIED (flag removed)
    When FLAGGED → POST /unflag → Becomes UNVERIFIED (flag removed, NOT verified)
```

---

## 3. Profile Staging Workflow Detail

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PROFILE STAGING STATE MACHINE                          │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────┐
    │  DRAFT  │ ◄──────────────────────────────────┐
    └────┬────┘                                     │
         │                                          │
         │ TA submits                               │
         │                                          │
         ▼                                          │
    ┌──────────────┐                                │
    │   SUBMITTED  │                                │
    │(PENDING_REVIEW)                               │
    └──┬────────┬──┘                                │
       │        │                                   │
       │        │                                   │
  DC   │        │   DC                              │
approve│        │ rejects                           │
       │        │                                   │
       ▼        ▼                                   │
  ┌─────────┐ ┌──────────┐                         │
  │APPROVED │ │ REJECTED │                         │
  └────┬────┘ └────┬─────┘                         │
       │           │                                │
       │           │ TA creates new DRAFT           │
       │           │ (version increments)           │
       │           └────────────────────────────────┘
       │
       │ Next submission approved
       │
       ▼
  ┌────────────┐
  │ SUPERSEDED │
  │ (archived) │
  └────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         VERSION MANAGEMENT                                  │
└─────────────────────────────────────────────────────────────────────────────┘

    Version 1: DRAFT → SUBMITTED → APPROVED
                                      │
                                      ▼
    Version 2: DRAFT → SUBMITTED → REJECTED
                                      │
                                      ▼
    Version 3: DRAFT → SUBMITTED → APPROVED
                                      │
                                      ▼
                            Version 1 becomes SUPERSEDED
```

---

## 4. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW ON SUBMISSION                             │
└─────────────────────────────────────────────────────────────────────────────┘

    TA submits profile
         │
         ▼
    ┌─────────────────────────┐
    │ temple_profile_staging  │
    │ status = PENDING_REVIEW │
    └────────┬────────────────┘
             │
             │ Fields promoted to main table
             │
             ▼
    ┌─────────────────────────┐
    │      temples table      │
    │  (live/current data)    │
    └────────┬────────────────┘
             │
             │ DC approves
             │
             ▼
    ┌─────────────────────────┐
    │ temple_profile_current  │
    │  (approved snapshot)    │
    └────────┬────────────────┘
             │
             │ Previous current archived
             │
             ▼
    ┌─────────────────────────┐
    │ temple_profile_history  │
    │   (audit trail)         │
    └─────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    VERIFICATION DATA STORAGE                                │
└─────────────────────────────────────────────────────────────────────────────┘

    DC verifies/flags temple
         │
         ▼
    ┌─────────────────────────────────────┐
    │         temples table               │
    │                                     │
    │  is_verified_by_dc = true/false    │
    │  verified_by_dc_at = timestamp     │
    │  verified_by_dc_user_id = DC ID    │
    │                                     │
    │  is_flagged_by_dc = true/false     │
    │  flagged_by_dc_at = timestamp      │
    │  flagged_by_dc_user_id = DC ID     │
    │  dc_rejection_reason = text        │
    └─────────────────────────────────────┘
```

---

## 5. Notification Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NOTIFICATION EVENTS                                 │
└─────────────────────────────────────────────────────────────────────────────┘

    TA Action                    DC Notified
    ─────────────────────────────────────────
    Submit Profile      ────────►  "New profile submission"


    DC Action                    TA Notified
    ─────────────────────────────────────────
    Approve Staging     ────────►  "Profile approved"
    Reject Staging      ────────►  "Profile rejected: [reason]"
    Verify Temple       ────────►  "Temple verified"
    Flag Temple         ────────►  "Temple flagged: [reason]"
    Unflag Temple       ────────►  "Flag removed"

┌─────────────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION IMPLEMENTATION                              │
└─────────────────────────────────────────────────────────────────────────────┘

    Workflow Action
         │
         ▼
    ┌─────────────────────────┐
    │ NotificationEventPublisher
    │  .publish()             │
    └────────┬────────────────┘
             │
             │ Same transaction
             │
             ▼
    ┌─────────────────────────┐
    │  notification_events    │
    │  status = PENDING       │
    └────────┬────────────────┘
             │
             │ Async poller
             │
             ▼
    ┌─────────────────────────┐
    │ in_app_notifications    │
    │  (user inbox)           │
    └─────────────────────────┘
```

---

## 6. Security & Authorization Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AUTHORIZATION CHECKS                                   │
└─────────────────────────────────────────────────────────────────────────────┘

    HTTP Request
         │
         ▼
    ┌─────────────────────────┐
    │  JWT Token Validation   │
    │  Extract Claims         │
    └────────┬────────────────┘
             │
             ├─────────────────┬─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ TEMPLE_AUTH  │  │ DISTRICT_DC  │  │ SUPER_ADMIN  │
    └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
           │                 │                 │
           │                 │                 │
           ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │OwnershipGuard│  │Jurisdiction  │  │  Full Access │
    │assertOwns    │  │Guard.assert  │  │  (bypass)    │
    │Temple()      │  │DistrictScope()│  │              │
    └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
           │                 │                 │
           │                 │                 │
           └─────────────────┴─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Execute Action  │
                    └─────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      SCOPE VALIDATION EXAMPLE                               │
└─────────────────────────────────────────────────────────────────────────────┘

    DC User (District ID: 5) attempts to verify Temple (District ID: 5)
         │
         ▼
    ┌─────────────────────────┐
    │ JurisdictionGuard       │
    │ .assertDistrictScope()  │
    └────────┬────────────────┘
             │
             │ Load temple with geo chain
             │ temple.hobli.taluk.district.id
             │
             ├─────────────────┬─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ District = 5 │  │ District ≠ 5 │  │ SUPER_ADMIN  │
    │   ✓ ALLOW    │  │   ✗ DENY     │  │   ✓ ALLOW    │
    └──────────────┘  └──────────────┘  └──────────────┘
```

---

## 7. Transaction Boundaries

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TRANSACTIONAL WORKFLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

    @Transactional
    ┌─────────────────────────────────────────────────────────────┐
    │                                                             │
    │  1. Validate request                                        │
    │  2. Load temple with geo                                    │
    │  3. Assert district scope                                   │
    │  4. Update temple entity                                    │
    │     - Set is_verified_by_dc = true                          │
    │     - Set verified_by_dc_at = NOW()                         │
    │     - Set verified_by_dc_user_id = DC ID                    │
    │     - Clear flag fields if flagged                          │
    │  5. Save temple                                             │
    │  6. Refresh search summary (same transaction)               │
    │  7. Publish notification event (same transaction)           │
    │                                                             │
    │  ✓ All succeed → COMMIT                                     │
    │  ✗ Any fails → ROLLBACK (including notification)            │
    │                                                             │
    └─────────────────────────────────────────────────────────────┘

    Benefits:
    - Atomicity: All or nothing
    - Consistency: Search summary always in sync
    - No silent notification loss
    - Rollback-safe
```

---

## 8. Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ERROR SCENARIOS                                     │
└─────────────────────────────────────────────────────────────────────────────┘

    Request
         │
         ├──────────────────┬──────────────────┬──────────────────┐
         │                  │                  │                  │
         ▼                  ▼                  ▼                  ▼
    ┌─────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
    │Validation│      │Not Found │      │Forbidden │      │ Conflict │
    │  Error   │      │  Error   │      │  Error   │      │  Error   │
    └────┬────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
         │                │                  │                  │
         ▼                ▼                  ▼                  ▼
    ┌─────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
    │400 Bad  │      │404 Not   │      │403       │      │409       │
    │Request  │      │Found     │      │Forbidden │      │Conflict  │
    └─────────┘      └──────────┘      └──────────┘      └──────────┘

    Examples:
    - 400: "Flagging reason is required"
    - 404: "Temple not found with id: 123"
    - 403: "You do not have permission to access temples outside your district"
    - 409: "Temple profile is not currently flagged"
```

---

## Legend

```
┌─────────┐
│  Box    │  = State or Action
└─────────┘

    │
    ▼         = Flow direction

    ├──       = Decision point / Branch

    ◄──       = Return / Loop back

    ✓         = Success / Allowed
    ✗         = Failure / Denied
```
