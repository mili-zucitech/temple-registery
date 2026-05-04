# Temple Registry: Unified Governance Workflow

This document provides a visual representation of the scalable workflow architecture for the Temple Registry & Management Portal, as derived from the requirements specification.

## 1. High-Level Governance Architecture

The system uses a **3-Layer Governance Model** to ensure data integrity and jurisdiction-based oversight.

```mermaid
graph TD
    subgraph "Layer 1: Temple Authority (Data Provider)"
        TA_Start((Login / MFA)) --> TA_Entry[Data Entry / Update]
        TA_Entry --> TA_Draft[Save as Draft]
        TA_Draft --> TA_Submit{Submit for Review?}
        TA_Submit -- Yes --> Sys_Val[System Validation]
        TA_Submit -- No --> TA_Draft
    end

    subgraph "Layer 2: System & DC Office (Verification)"
        Sys_Val --> Sys_Check{Automated Checks}
        Sys_Check -- Fail --> TA_Draft
        Sys_Check -- Pass --> DC_Queue[DC Review Queue]
        DC_Queue --> DC_Staff[DC Staff Pre-Screening]
        DC_Staff --> DC_Decision{DC Decision}
    end

    subgraph "Layer 3: Outcome & Master Registry"
        DC_Decision -- Approve --> Promote[Promote to Master Registry]
        Promote --> Ack[Issue Digital Acknowledgement]
        DC_Decision -- Reject --> Notify_R[Notify Rejection]
        DC_Decision -- Query --> Notify_Q[Request Clarification]
        DC_Decision -- Verify --> Phys_V[Order Physical Verification]
        
        Notify_R --> TA_Draft
        Notify_Q --> TA_Draft
        Phys_V --> DC_Decision
    end

    classDef ta fill:#e1f5fe,stroke:#01579b
    classDef dc fill:#fff3e0,stroke:#e65100
    classDef sys fill:#f3e5f5,stroke:#4a148c
    
    class TA_Start,TA_Entry,TA_Draft,TA_Submit ta
    class DC_Queue,DC_Staff,DC_Decision dc
    class Sys_Val,Sys_Check,Promote,Ack sys
```

---

## 2. Detailed Module Workflows

### A. Asset Declaration Workflow (Deep Dive)
Asset declarations are subject to the most rigorous oversight, including physical inspection and deadline tracking.

```mermaid
sequenceDiagram
    participant TA as Temple Authority
    participant Sys as System / Scheduler
    participant DC as District Collector
    
    Note over TA, DC: Annual Financial Year Cycle
    
    Sys->>TA: Notify: Declaration Due
    TA->>TA: Prepare Asset List (Movable/Immovable)
    TA->>Sys: Submit Declaration
    Sys->>Sys: Snapshot Current State
    
    alt Standard Review
        DC->>Sys: Approve
        Sys->>TA: Issue Ack # and PDF
    else Clarification Required
        DC->>TA: Request Clarification (Round 1/2)
        TA->>Sys: Resubmit Corrected Data
    else Escalation (Round 3)
        DC->>TA: Request Clarification (Round 3)
        Sys->>DC: Notify Super Admin (Escalation)
    else Physical Inspection
        DC->>Sys: Schedule Site Visit
        Sys->>TA: Notify Site Visit Date
        DC->>Sys: Log Physical Verification Results
        Sys->>DC: Verification Pass/Fail
    end
    
    loop Overdue Tracking
        Sys->>Sys: Check Due Date
        Sys-->>DC: Flag Overdue Declarations
    end
```

### B. Temple Profile & Trust Staging Workflow
To prevent data corruption, changes to the Temple Master or Trust details are "staged" and only "promoted" upon approval.

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Pending_Review: Submit
    
    state Pending_Review {
        [*] --> Under_Review
        Under_Review --> Clarification_Requested: Query
        Clarification_Requested --> Under_Review: Resubmit
    }
    
    Pending_Review --> Approved: DC Approve
    Pending_Review --> Rejected: DC Reject
    
    Approved --> Promotion_Logic
    state Promotion_Logic {
        Update_Master: Update Live Temple Table
        Issue_Notif: Send Success Notification
    }
    
    Promotion_Logic --> [*]
    Rejected --> Draft: Allow Correction
```

---

## 3. Scalability Features of the Workflow

1.  **State Snapshotting**: Before any review, the system captures a JSON snapshot of the data. This ensures the DC reviews the *exact* data submitted, even if the TA continues editing a new draft.
2.  **Jurisdiction Scoping**: The Workflow Engine automatically routes tasks based on the `District_ID` and `Taluk_ID`, ensuring a DC only sees temples within their legal jurisdiction.
3.  **Optimistic Locking**: Every state transition uses a `governance_version` counter to prevent "double-approval" or race conditions in high-concurrency environments.
4.  **Asynchronous Summary Refreshes**: Upon approval, the system triggers background updates to the search indexes and dashboards, keeping the UI responsive.
5.  **Blind Indexing for Encryption**: Sensitive fields (PAN, Aadhaar) are encrypted at rest, but the workflow allows "Masked View" for DC Staff while maintaining full legal compliance.
