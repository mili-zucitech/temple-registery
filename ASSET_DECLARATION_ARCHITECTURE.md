# 🏗️ Asset Declaration Module - Architecture & Workflow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React + TypeScript)                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────┐        ┌──────────────────────────────┐  │
│  │  Temple Authority Portal │        │   District Collector Portal   │  │
│  ├──────────────────────────┤        ├──────────────────────────────┤  │
│  │                          │        │                               │  │
│  │  • Declaration Dashboard │        │  • Review Dashboard           │  │
│  │  • Multi-Step Wizard     │        │  • Declaration List (Filters) │  │
│  │  • Asset Item Manager    │        │  • Review Detail Page         │  │
│  │  • History Timeline      │        │  • Approval/Rejection Panel   │  │
│  │  • Status Tracking       │        │  • Clarification Thread       │  │
│  │                          │        │  • Version Comparison         │  │
│  └──────────────────────────┘        └──────────────────────────────┘  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              RTK Query API Layer (declarationApi.ts)             │   │
│  │  • Declaration CRUD  • Asset Item CRUD  • Workflow Actions       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS / REST API
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│                       BACKEND (Spring Boot + Java 21)                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                         CONTROLLERS                               │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  DeclarationController    │  AssetItemController                  │  │
│  │  • /api/v1/temples/{id}/declarations                              │  │
│  │  • /api/v1/declarations/{id}                                      │  │
│  │  • /api/v1/declarations/{id}/submit                               │  │
│  │  • /api/v1/declarations/{id}/assets/{type}                        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                          SERVICES                                 │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  DeclarationService       │  AssetItemService                     │  │
│  │  • CRUD operations        │  • Add/Update/Delete asset items      │  │
│  │  • Workflow (submit,      │  • Validate declaration status        │  │
│  │    approve, reject)       │  • Calculate totals                   │  │
│  │  • Version management     │  • Ownership validation               │  │
│  │  • Snapshot creation      │                                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        REPOSITORIES                               │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  DeclarationRepository                                            │  │
│  │  DeclImmovAgriLandRepository    │  DeclMovPreciousMetalRepository │  │
│  │  DeclImmovBuildingRepository    │  DeclMovArtifactRepository      │  │
│  │  DeclImmovLeasedRepository      │  DeclMovVehicleRepository       │  │
│  │  DeclImmovOtherRepository       │  DeclMovEquipmentRepository     │  │
│  │  DeclMovFinancialRepository                                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ JPA / Hibernate
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│                            DATABASE (MySQL)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      MAIN TABLES                                  │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  asset_declarations (main declaration record)                     │  │
│  │  • id, temple_id, district_id, status, financial_year            │  │
│  │  • submitted_at, reviewed_at, reviewed_by                         │  │
│  │  • acknowledgement_number, version_number                         │  │
│  │  • snapshot_json (frozen at submission)                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   IMMOVABLE ASSET TABLES                          │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  decl_immov_agri_land      │  decl_immov_building                │  │
│  │  decl_immov_leased         │  decl_immov_other                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    MOVABLE ASSET TABLES                           │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  decl_mov_precious_metal   │  decl_mov_artifact                  │  │
│  │  decl_mov_vehicle          │  decl_mov_equipment                 │  │
│  │  decl_mov_financial                                               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    SUPPORTING TABLES                              │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  asset_declaration_versions (version history)                     │  │
│  │  declaration_clarifications (DC ↔ Temple communication)          │  │
│  │  documents (uploaded supporting documents)                        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Temple Authority: Create Declaration Flow

```
┌─────────────┐
│   Temple    │
│  Authority  │
└──────┬──────┘
       │
       │ 1. Navigate to "Create Declaration"
       ▼
┌─────────────────────────────────────────┐
│  Multi-Step Wizard - Step 1: Basic Info │
│  • Financial Year                        │
│  • Due Date                              │
│  • Annual Income/Expenditure             │
└──────┬──────────────────────────────────┘
       │ 2. Click "Save & Continue"
       │    POST /api/v1/temples/{id}/declarations
       ▼
┌─────────────────────────────────────────┐
│  Backend: DeclarationService.create()   │
│  • Validate temple ownership             │
│  • Create declaration with status=DRAFT  │
│  • Return declaration ID                 │
└──────┬──────────────────────────────────┘
       │ 3. Declaration created (ID: 123)
       ▼
┌─────────────────────────────────────────┐
│  Multi-Step Wizard - Step 2: Immovable  │
│  • Agricultural Land Manager             │
│  • Building Manager                      │
│  • Leased Property Manager               │
└──────┬──────────────────────────────────┘
       │ 4. Add Agricultural Land
       │    POST /api/v1/declarations/123/assets/agricultural-land
       ▼
┌─────────────────────────────────────────┐
│  Backend: AssetItemService.addAgriLand()│
│  • Validate declaration is DRAFT         │
│  • Validate ownership                    │
│  • Save to decl_immov_agri_land          │
└──────┬──────────────────────────────────┘
       │ 5. Asset item added
       ▼
┌─────────────────────────────────────────┐
│  UI: Display added item in list         │
│  • Show edit/delete buttons              │
│  • Update total count                    │
└──────┬──────────────────────────────────┘
       │ 6. Repeat for all asset types
       ▼
┌─────────────────────────────────────────┐
│  Multi-Step Wizard - Step 3: Movable    │
│  • Precious Metal Manager                │
│  • Artifact Manager                      │
│  • Vehicle Manager                       │
│  • Equipment Manager                     │
│  • Financial Asset Manager               │
└──────┬──────────────────────────────────┘
       │ 7. Add assets (same flow as step 4-5)
       ▼
┌─────────────────────────────────────────┐
│  Multi-Step Wizard - Step 4: Review     │
│  • Display all assets in summary cards   │
│  • Show calculated totals                │
│  • "Save as Draft" or "Submit" buttons   │
└──────┬──────────────────────────────────┘
       │ 8. Click "Submit for Review"
       │    POST /api/v1/declarations/123/submit
       ▼
┌─────────────────────────────────────────┐
│  Backend: DeclarationService.submit()   │
│  • Validate transition DRAFT → PENDING   │
│  • Create snapshot JSON                  │
│  • Save version to history table         │
│  • Update status to PENDING_REVIEW       │
│  • Set submitted_at timestamp            │
│  • Notify DC users                       │
└──────┬──────────────────────────────────┘
       │ 9. Submission successful
       ▼
┌─────────────────────────────────────────┐
│  UI: Show success message                │
│  • Display acknowledgement number        │
│  • Redirect to declaration list          │
│  • Show status badge: "Pending Review"   │
└─────────────────────────────────────────┘
```

---

### 2. District Collector: Review & Approve Flow

```
┌─────────────┐
│  District   │
│  Collector  │
└──────┬──────┘
       │
       │ 1. Navigate to "Declarations" dashboard
       ▼
┌─────────────────────────────────────────┐
│  DC Dashboard                            │
│  • KPI Cards (Pending, Approved, etc.)   │
│  • Filter by status, temple, date        │
│  • Card-based declaration list           │
└──────┬──────────────────────────────────┘
       │ 2. Click on a declaration card
       │    GET /api/v1/declarations/123
       ▼
┌─────────────────────────────────────────┐
│  Backend: DeclarationService.getById()  │
│  • Validate jurisdiction (same district) │
│  • Return declaration details            │
└──────┬──────────────────────────────────┘
       │ 3. Declaration data loaded
       ▼
┌─────────────────────────────────────────┐
│  DC Review Detail Page                   │
│  ┌─────────────────┬─────────────────┐  │
│  │  Main Content   │  Review Panel   │  │
│  │  (60%)          │  (40% sticky)   │  │
│  ├─────────────────┼─────────────────┤  │
│  │ • Temple Info   │ • Status Badge  │  │
│  │ • Tabs:         │ • Action Buttons│  │
│  │   - Immovable   │   - Approve     │  │
│  │   - Movable     │   - Reject      │  │
│  │   - History     │   - Clarify     │  │
│  │                 │   - Flag Verify │  │
│  │ • Asset Lists   │ • Remarks Field │  │
│  │   (expandable)  │ • Clarification │  │
│  │                 │   Thread        │  │
│  └─────────────────┴─────────────────┘  │
└──────┬──────────────────────────────────┘
       │ 4. DC reviews all assets
       │    GET /api/v1/declarations/123/assets
       ▼
┌─────────────────────────────────────────┐
│  Backend: AssetItemService.getAllAssets()│
│  • Fetch all 8 asset types               │
│  • Return grouped response               │
└──────┬──────────────────────────────────┘
       │ 5. All assets displayed
       ▼
┌─────────────────────────────────────────┐
│  DC Decision: Approve                    │
│  • Click "Approve" button                │
│  • Confirmation dialog                   │
└──────┬──────────────────────────────────┘
       │ 6. Confirm approval
       │    POST /api/v1/declarations/123/approve
       ▼
┌─────────────────────────────────────────┐
│  Backend: DeclarationService.approve()  │
│  • Validate transition → APPROVED        │
│  • Generate acknowledgement number       │
│  • Set reviewed_at, reviewed_by          │
│  • Update status to APPROVED             │
│  • Log audit trail                       │
│  • Notify temple authority               │
└──────┬──────────────────────────────────┘
       │ 7. Approval successful
       ▼
┌─────────────────────────────────────────┐
│  UI: Show success toast                  │
│  • "Declaration approved successfully"   │
│  • Display acknowledgement number        │
│  • Update status badge to "Approved"     │
│  • Redirect to dashboard                 │
└─────────────────────────────────────────┘
```

---

### 3. Clarification Request Flow

```
┌─────────────┐                    ┌─────────────┐
│  District   │                    │   Temple    │
│  Collector  │                    │  Authority  │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ 1. Request Clarification         │
       │    POST /declarations/123/clarification
       │    { message: "Please provide..." }
       ▼                                  │
┌─────────────────────────────────┐      │
│  Backend: requestClarification() │      │
│  • Status → CLARIFICATION_REQ    │      │
│  • Save clarification message    │      │
│  • Notify temple authority       │      │
└──────┬──────────────────────────┘      │
       │                                  │
       │ 2. Notification sent ────────────▶
       │                                  │
       │                                  ▼
       │                    ┌─────────────────────────┐
       │                    │  Temple sees notification│
       │                    │  • Opens declaration     │
       │                    │  • Reads clarification   │
       │                    └──────┬──────────────────┘
       │                           │
       │                           │ 3. Update assets
       │                           │    PUT /declarations/123/assets/...
       │                           ▼
       │                    ┌─────────────────────────┐
       │                    │  Backend: Update assets  │
       │                    │  • Validate status       │
       │                    │  • Update asset items    │
       │                    └──────┬──────────────────┘
       │                           │
       │                           │ 4. Resubmit
       │                           │    POST /declarations/123/resubmit
       │                           │    { correctionNotes: "..." }
       │                           ▼
       │                    ┌─────────────────────────┐
       │                    │  Backend: resubmit()     │
       │                    │  • Status → RESUBMITTED  │
       │                    │  • Increment version     │
       │                    │  • Create new snapshot   │
       │                    │  • Notify DC             │
       │                    └──────┬──────────────────┘
       │                           │
       │ 5. Notification received ◀─────────────────────
       ▼                           │
┌─────────────────────────────────┐
│  DC reviews resubmission         │
│  • Compare versions              │
│  • Approve or request more info  │
└─────────────────────────────────┘
```

---

## State Machine: Declaration Status

```
                    ┌─────────┐
                    │  DRAFT  │ ◀─── Initial state
                    └────┬────┘
                         │
                         │ submit()
                         ▼
                ┌────────────────┐
                │ PENDING_REVIEW │
                └────┬───────────┘
                     │
         ┌───────────┼───────────┬──────────────┐
         │           │           │              │
         │ approve() │ reject()  │ requestClarification()
         │           │           │              │
         ▼           ▼           ▼              ▼
    ┌─────────┐ ┌──────────┐ ┌──────────────────────┐
    │APPROVED │ │ REJECTED │ │ CLARIFICATION_REQUESTED│
    └─────────┘ └──────────┘ └──────┬───────────────┘
                                     │
                                     │ resubmit()
                                     ▼
                              ┌──────────────┐
                              │ RESUBMITTED  │
                              └──────┬───────┘
                                     │
                                     │ (back to review)
                                     ▼
                              ┌────────────────┐
                              │ PENDING_REVIEW │
                              └────────────────┘

Special States:
┌─────────────────────────────────┐
│ PHYSICAL_VERIFICATION_REQUESTED │ ◀─── flagPhysicalVerification()
└─────────────────────────────────┘

┌──────────┐
│ OVERDUE  │ ◀─── Automatic (scheduled job)
└──────────┘

┌────────────┐
│ SUPERSEDED │ ◀─── When newer version approved
└────────────┘
```

---

## Security & Authorization

### Role-Based Access Control

| Action | Temple Authority | DC Staff | District Collector | Super Admin |
|--------|------------------|----------|-------------------|-------------|
| Create Declaration | ✅ (own temple) | ❌ | ❌ | ✅ |
| Edit DRAFT | ✅ (own temple) | ❌ | ❌ | ✅ |
| Submit | ✅ (own temple) | ❌ | ❌ | ✅ |
| View | ✅ (own temple) | ✅ (own district) | ✅ (own district) | ✅ (all) |
| Approve | ❌ | ✅ (own district) | ✅ (own district) | ✅ |
| Reject | ❌ | ✅ (own district) | ✅ (own district) | ✅ |
| Request Clarification | ❌ | ✅ (own district) | ✅ (own district) | ✅ |
| Resubmit | ✅ (own temple) | ❌ | ❌ | ✅ |
| Force Draft | ❌ | ❌ | ❌ | ✅ |

### Validation Rules

1. **Ownership Validation**
   - Temple Authority can only access declarations for temples they manage
   - Enforced via `OwnershipGuard.assertOwnsTemple()`

2. **Jurisdiction Validation**
   - DC can only access declarations in their district
   - Enforced via `JurisdictionGuard.assertSameDistrict()`

3. **Status Validation**
   - Asset items can only be added/edited when declaration is DRAFT
   - Status transitions validated via `StatusTransitionValidator`

4. **Optimistic Locking**
   - `@Version` field prevents concurrent edit conflicts
   - Returns 409 Conflict if version mismatch

---

## Performance Considerations

### Database Optimization

1. **Indexes**
   - `idx_ad_temple_id` on `asset_declarations(temple_id)`
   - `idx_ad_district_id` on `asset_declarations(district_id)`
   - `idx_ad_status` on `asset_declarations(status)`
   - `idx_diag_decl` on `decl_immov_agri_land(declaration_id)`
   - Similar indexes on all asset sub-tables

2. **N+1 Query Prevention**
   - Use `@EntityGraph` or `JOIN FETCH` when loading declarations with assets
   - Batch fetch temple names in list views

3. **Pagination**
   - All list endpoints paginated (default 10, max 100)
   - Enforced in service layer

### Caching Strategy

1. **Frontend (RTK Query)**
   - Cache declarations for 60 seconds
   - Invalidate on mutations
   - Optimistic updates for better UX

2. **Backend**
   - Consider Redis cache for frequently accessed declarations
   - Cache district/temple metadata

---

## Monitoring & Observability

### Metrics to Track

1. **Business Metrics**
   - Declarations submitted per day
   - Average review time (submitted_at → reviewed_at)
   - Approval rate
   - Clarification request rate
   - Overdue declaration count

2. **Technical Metrics**
   - API response times (p50, p95, p99)
   - Error rates by endpoint
   - Database query performance
   - Cache hit rates

### Logging

```java
// Service layer logging
log.info("Declaration [{}] submitted by user [{}]", declarationId, userId);
log.info("Declaration [{}] approved by DC [{}]", declarationId, dcUserId);
log.warn("Declaration [{}] marked as OVERDUE", declarationId);
log.error("Failed to create snapshot for declaration [{}]", declarationId, exception);
```

### Audit Trail

All state changes logged to `governance_audit_log`:
- Who performed the action
- What action was performed
- When it was performed
- Before/after state

---

## Disaster Recovery

### Backup Strategy

1. **Database Backups**
   - Daily full backups
   - Hourly incremental backups
   - 30-day retention

2. **Document Storage**
   - S3 versioning enabled
   - Cross-region replication
   - Lifecycle policies

### Recovery Procedures

1. **Declaration Corruption**
   - Restore from snapshot JSON
   - Revert to previous version

2. **Accidental Approval**
   - Super Admin can force status change
   - Audit log preserves history

---

**This architecture supports a scalable, secure, and maintainable Asset Declaration Module that meets all government compliance requirements.**
