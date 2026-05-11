

## Plan: Temple Profile Workflow — Complete Architectural Analysis

---

### TL;DR

After tracing all code paths — 87 Flyway migrations, 7 controllers, 5 service classes, 14 repositories, 6 frontend tabs, and 18 RTK Query endpoints — the root cause of all field-population, staleness, and overview inconsistency issues is **three tables holding the same 14 profile fields simultaneously** with no enforced single source of truth, compounded by a **3-layer frontend fallback chain** that silently degrades to stale data. The architecture is structurally sound (we cannot collapse to one table safely), but the ownership rules, field naming, and read paths need to be tightened. Below is the full analysis.

---

## Section 1 — Current Architecture Analysis

### 1.1 Table Inventory & Responsibilities (as-built)

| Table | Rows | Purpose | Write Path | Status Authority |
|---|---|---|---|---|
| `temples` | 1 per temple | Core identity + admin lifecycle + **display copy** of approved profile | TempleService (admin), promoteToTemple (on approve) | `status`, `verification_status` columns |
| `temple_profile_staging` | N per temple (versioned) | TA draft / submit buffer | TempleProfileStagingServiceImpl | `workflow_instances` (canonical), `staging.status` (legacy projection) |
| `temple_profile_current` | 0–1 per temple | Single approved profile snapshot | TempleProfileWorkflowServiceImpl.approveProfile | No status field — exists = approved |
| `temple_profile_history` | N per temple | Immutable archive of superseded approved profiles | On every approve (archives previous current) | N/A (append-only) |
| `workflow_instances` | 1 per staging row | Canonical workflow state machine | WorkflowEngine | `status` column |
| `workflow_transitions` | N per instance | Audit log of every state change | WorkflowEngine | N/A |
| `temple_search_summary` | 1 per temple | Denormalized search/KPI read model | TempleSearchSummaryServiceImpl (post-commit async) | Derived |

### 1.2 The Core Field Duplication Problem

The same 14 profile fields are stored in **three places simultaneously**:

```
Profile Fields (14 columns):
  phone / email / website
  contactPersonName / contactPersonDesignation
  photoFilePath / photoUrl
  bankName / bankIfsc / bankAccountNumberEncrypted
  languagesOfWorship / linkedInstitutions
  description / annualFestivals / landmark / historicalSignificance

Stored in:
  temple_profile_staging   — TA-submitted, per-version
  temple_profile_current   — Last-approved snapshot + bank account number
  temples                  — Display copy (different column names, no bank account number)
```

**Field name mismatch between `temples` vs `staging/current`:**

| Staging/Current column | Temple column | Mapped by |
|---|---|---|
| `contact_person_name` | `contact_name` | `promoteToTemple()` |
| `contact_person_designation` | `contact_designation` | `promoteToTemple()` |
| `phone` | `contact_mobile` | `promoteToTemple()` |
| `email` | `contact_email` | `promoteToTemple()` |
| `photo_file_path` | `photo_url` | `promoteToTemple()` |
| `description` | `history` (as fallback) | `promoteToTemple()` |
| `bank_account_number_encrypted` | **MISSING** | Not on temples at all |

`temples` does NOT store `bank_account_number_encrypted`. This is the single most important structural constraint that prevents simplification to a single table.

### 1.3 Migration Drift

V13 created `temple_profile_staging` and `temple_profile_current` with the **original field set** (9 content columns). The entities currently have **14 content columns** — specifically `phone`, `email`, `website`, `bank_name`, `bank_ifsc`, `description` are NOT in V13. These were added by a later migration (V32 adds these to `temples`; a corresponding migration must exist for staging/current — likely V58 "phase_b_consolidation" or similar). The application runs, confirming the columns exist, but the V13 DDL in the repository does not reflect the current schema. This creates documentation debt and risk for new-environment deployments.

### 1.4 Dual Approval Service Paths

**Path A — `TempleController → TempleProfileStagingServiceImpl.approve()`**
- Updates: `temples` (promote), `workflow_instances` (APPROVE), `entity_versions`
- Missing: NO `temple_profile_current` write, NO audit log, NO notification, NO search summary refresh
- Used by: `POST /api/v1/temples/{templeId}/profile/approve/{stagingId}`

**Path B — `DcProfileController → TempleProfileWorkflowServiceImpl.approveProfile()`**
- Updates: `temple_profile_current` (UPSERT), `temple_profile_history` (archive), `temples` (promote + verificationStatus=VERIFIED), `temple_profile_staging` (status=APPROVED), `workflow_instances`, `audit_events`, `governance_audit_events`, `temple_search_summary`
- Missing: Nothing — full path
- Used by: `POST /api/v1/dc/profiles/{stagingId}/approve`

**Path A is a partial implementation** of Path B. Any code using Path A produces inconsistent state (no `temple_profile_current` row, no audit, `verificationStatus` stays UNVERIFIED).

### 1.5 Frontend Priority Chain (OverviewTab)

```
effectiveContactName = actionablePendingStaging?.contactPersonName
                    || currentProfile?.contactPersonName
                    || temple.contactName

effectiveBankAccountMasked = actionablePendingStaging?.bankAccountNumberMasked
                           || currentProfile?.bankAccountMasked
                           // *** NO temple fallback — temples has no bank account ***
```

**`actionablePendingStaging` is gated by:**
```typescript
const hasDcProfileAction = pendingAllowedActions.includes('APPROVE')
  || pendingAllowedActions.includes('RE_APPROVE')
  || pendingAllowedActions.includes('REJECT')
const actionablePendingStaging = hasDcProfileAction ? pendingStaging : null
```

If a staging row exists with status `UNDER_REVIEW` and `allowedActions = []` (workflow state is `UNDER_REVIEW` but DC hasn't clicked APPROVE yet), DC sees the **old** currentProfile/temple values even though TA has submitted newer data.

---

## Section 2 — Root Cause Analysis

### RC-01: Three tables, no enforced source-of-truth boundary
The same profile fields exist in `temple_profile_staging`, `temple_profile_current`, and `temples`. There is no explicit rule about which one to read for which context. Frontend resolves this with a fallback chain that silently hides inconsistencies.

### RC-02: `temple_profile_current` is partially redundant with `temples` post-approval
After `approveProfile()`, both `temple_profile_current` and `temples` hold identical contact/bank values (except bank account number). DC queries read `currentProfile` from the main profile API but `temple.*` for identity fields — DC-side components must always consult two sources.

### RC-03: Dual approval paths produce divergent state
Path A (`TempleController.approve`) does not write `temple_profile_current`, so any temple approved via Path A has:
- `verificationStatus = UNVERIFIED` (not set to VERIFIED)
- No `currentProfile` row
- No audit trail
- No search summary refresh
- DC Overview shows blank contact/bank under `currentProfile`

### RC-04: `effectiveBankAccountMasked` has no temple fallback
`temples` never stored `bank_account_number_encrypted`. If `currentProfile` is null (temple approved via Path A or no approved profile yet) and `pendingStaging` is non-actionable, `effectiveBankAccountMasked` resolves to `undefined`. The UI renders `—` or crashes.

### RC-05: Staging visibility gated by `allowedActions`
OverviewTab only shows pending staging data if `allowedActions` includes APPROVE/RE_APPROVE/REJECT. But when DC calls `BEGIN_REVIEW` and the status becomes `UNDER_REVIEW`, the allowed actions change. If `APPROVE` is still in `allowedActions` at `UNDER_REVIEW`, this is fine. If not, DC sees stale data while reviewing.

### RC-06: Migration drift on staging/current tables
TempleProfileStaging.java and TempleProfileCurrent.java define `phone`, `email`, `website`, `bank_name`, `bank_ifsc`, `description`, `version_number` columns that are absent from V13. This creates a documentation–reality gap, making it impossible to reproduce the current DB schema from migrations alone.

### RC-07: Search summary reads `WorkflowStatus.SUBMITTED` but `existsByTempleIdAndStatus` takes WorkflowStatus
The `pending_profile_review` flag in `temple_search_summary` is computed via `stagingRepository.existsByTempleIdAndStatus(SUBMITTED)`. The repository method maps WorkflowStatus to TempleProfileStagingStatus via a compatibility layer. This indirection is fragile — if the mapping changes, `pending_profile_review` silently returns wrong values.

### RC-08: `temple_profile_history` lacks phone/email/website fields
The V13 `temple_profile_history` table was created with only 9 content columns. If the entity now has 14, the history table may also be missing the newer columns. This means archived approved profiles lose phone/email/website/bankName/bankIfsc/description data.

### RC-09: `TempleProfileHistory.java` entity may drift same as staging/current
Same migration drift risk applies to history table.

### RC-10: `TrustTabProps.trust` typed as `any`
TypeScript cannot catch field access errors in TrustTab. All `trust.*` access is unprotected at compile time.

### RC-11: DocumentsTab swallows query errors
`useListDocumentsQuery` error state is not handled — DC sees "No documents uploaded" on network failure, unable to distinguish empty vs error.

---

## Section 3 — Dependency Mapping

### 3.1 Backend Consumers of `temple_profile_current`

| Consumer | Method | Purpose |
|---|---|---|
| `DcTempleProfileServiceImpl.getFullProfile` | `profileCurrentRepository.findByTempleId` | Embed in `TempleFullProfileResponse.currentProfile` |
| `TempleProfileWorkflowServiceImpl.approveProfile` | `currentRepository.findByTempleId` + `save` | UPSERT on approve |
| `TempleProfileWorkflowServiceImpl.approveProfile` | `historyRepository.save` | Archive previous current to history |

### 3.2 Backend Consumers of `temple_profile_staging`

| Consumer | Method | Purpose |
|---|---|---|
| `TempleProfileStagingServiceImpl.createOrUpdateDraft` | find DRAFT/UPDATED_AFTER_APPROVAL | Create or update draft |
| `TempleProfileStagingServiceImpl.submitForReview` | find DRAFT or UPDATED_AFTER_APPROVAL | Submit for review |
| `DcTempleProfileServiceImpl.getPendingProfileStaging` | `findTopByTempleIdAndStatusInOrderByVersionNumberDesc` | DC review view |
| `TempleProfileWorkflowServiceImpl.approveProfile` | load by stagingId | Approve specific version |
| `TempleProfileWorkflowServiceImpl.approveProfile` | `findFirstByTempleIdAndStatus(APPROVED)` | Supersede previous |
| `TempleProfileWorkflowServiceImpl.rejectProfile` | load by stagingId | Reject specific version |
| `TempleSearchSummaryServiceImpl` | `existsByTempleIdAndStatus(SUBMITTED)` | Compute `pending_profile_review` |

### 3.3 Frontend Consumers

| Component | Data Source | Fields Used |
|---|---|---|
| `OverviewTab` — identity | `profile.temple` | name, grade, registrationNumber, primaryDeity, tradition, yearEstablished, address |
| `OverviewTab` — contact/bank | `actionablePendingStaging → currentProfile → temple` | phone, email, contactName, designation, bankName, bankIfsc, bankAccountMasked |
| `OverviewTab` — status | `profile.temple.verificationStatus` | verificationStatus, dcRejectionReason |
| `OverviewTab` — KPIs | `profile.declarations[]`, `profile.trustFinancials`, `profile.trust` | declaration counts, financial count |
| `DeclarationsTab` | `profile.declarations[]` (summary) + lazy `useDcDeclarationDetail` | status, governance payload |
| `TrustTab` | `profile.trust`, `profile.boardMembers`, etc. | All trust governance fields |
| `StaffTab` | `profile.employees` | Employee list |
| `ContractorsTab` | `profile.contractors` | Contractor list |
| `DocumentsTab` | Own RTK Query via `templeId` | Document list |

### 3.4 Modules NOT Affected by Temple Profile Changes

- `Trust` module — own staging/workflow tables, own approval path (UNAFFECTED by profile changes)
- `Declaration` module — `asset_declarations` table, own workflow path (UNAFFECTED)
- `Employee` / `Contractor` modules — no profile staging dependency
- `Auth` / `Geo` / `Notification` modules — no dependency
- `Export` / `Admin` modules — read-only against temples; not affected by profile field changes

---

## Section 4 — Source-of-Truth Decision

### Can we simplify to a single `temples` table?

**Decision: NO — hybrid architecture is required.**

**Reasons we cannot eliminate `temple_profile_staging`:**
- The staging workflow requires a versioned, mutable buffer per submission
- Workflow state machine (`workflow_instances`) links to `staging.id` (entity_id)
- Each rejection creates a new version, which requires a new row
- Draft autosave requires a non-published record

**Reasons we cannot eliminate `temple_profile_current`:**
- `temples` does NOT store `bank_account_number_encrypted` — this is the only AES-encrypted column outside of staging
- `temple_profile_current` provides `publishedAt` / `publishedBy` — audit metadata not on temples
- `temple_profile_history` archives superseded `currentProfile` rows — removing current would break history provenance

**Reasons we cannot eliminate `temple_profile_history`:**
- Immutable audit record of every approved profile version
- Required for regulatory compliance and dispute resolution

**Verdict:** Hybrid architecture with three storage tables is correct. The problems are in **ownership rules, synchronization discipline, and field naming** — not in the number of tables.

---

## Section 5 — Ideal Final Architecture

### 5.1 Clear Table Ownership

| Table | Owns | Does NOT own |
|---|---|---|
| `temples` | Core identity (name, grade, deity, tradition, address, geo, yearEstablished, history), admin lifecycle (status), verification status, display copy of last-approved contact/bank (for TA-facing view), bank_name + bank_ifsc | bank_account_number_encrypted, publishedAt/By |
| `temple_profile_staging` | All 14 profile fields per submitted version, workflow linkage, reviewComment | Canonical status (delegated to workflow_instances) |
| `temple_profile_current` | Currently-approved 14 profile fields + bank_account_number_encrypted + publishedAt + publishedBy | Core identity (name, grade, etc.) |
| `temple_profile_history` | Immutable archive of superseded current rows | Nothing — append-only |
| `workflow_instances` | Canonical workflow status for TEMPLE_PROFILE entity | Profile field data |
| `temple_search_summary` | Denormalized read model for search/KPIs | No writes from business logic |

### 5.2 Canonical Read Rules (post-fix)

**For DC portal — profile fields (contact, bank, photo, languages):**
```
IF actionable pendingStaging (workflow status SUBMITTED/UNDER_REVIEW/RESUBMITTED) EXISTS
  → Read from pendingStaging (show "Pending Review" badge)
ELSE IF currentProfile EXISTS
  → Read from currentProfile (approved data)
ELSE
  → Show "Not yet submitted" placeholder
```
**Never fall back to `temples` for profile-managed fields** — temples is the TA-facing display copy, not the DC-facing canonical source.

**For DC portal — identity fields (name, grade, deity, address, geo, yearEstablished):**
```
→ Always read from temples (immutable registration data)
```

**For TA portal — all fields:**
```
→ Always read from temples (temples is the TA-facing read model; updated on every approve)
```

### 5.3 Write Ownership Rules

| Trigger | Writes To | Does NOT write to |
|---|---|---|
| TA creates/updates draft | `temple_profile_staging` (DRAFT) | `temples`, `temple_profile_current` |
| TA submits for review | `workflow_instances` (SUBMITTED), `temple_profile_staging.status=PENDING_REVIEW` (legacy) | `temples`, `temple_profile_current` |
| DC approves via Path B | `temple_profile_current` (UPSERT), `temple_profile_history` (archive), `temples` (promoteToTemple + VERIFIED), `workflow_instances` (APPROVED), audit tables | Anything not listed |
| DC rejects | `temple_profile_staging.reviewComment`, `workflow_instances` (REJECTED) | `temples`, `temple_profile_current` |
| Admin suspend/freeze/etc. | `temples.status` | `temple_profile_staging`, `temple_profile_current` |

**Path A (`TempleController.approve`) must be removed or delegated to Path B service.**

### 5.4 Status Lifecycle (canonical)

```
                [TA action]              [TA action]
  ┌──────────────────────────────────────────────────────────────────┐
  │                      TEMPLE_PROFILE WORKFLOW                      │
  │                                                                    │
  │  [No record] ──DRAFT──► SUBMITTED ──────────────────► APPROVED   │
  │                   ▲         │ DC rejects                 │        │
  │                   │         ▼                         DC re-     │
  │            TA edits     REJECTED                     approves    │
  │            (REJECTED      │ TA edits, re-submits       │        │
  │            is editable)   ▼                    RE_APPROVED       │
  │                   UPDATED_AFTER_APPROVAL → RESUBMITTED           │
  │                                                                    │
  │  On approve: prior APPROVED/RE_APPROVED → SUPERSEDED             │
  └──────────────────────────────────────────────────────────────────┘
```

### 5.5 Synchronization Rules

| Event | `temples` sync | `temple_profile_current` sync | `temple_search_summary` sync |
|---|---|---|---|
| Approve | Update all 13 fields + verificationStatus=VERIFIED via `promoteToTemple` | UPSERT all 14 fields + publishedAt/By | scheduleRefresh (post-commit) |
| Reject | No change | No change | scheduleRefresh |
| Admin status change | Update `status` | No change | scheduleRefresh |
| TA draft save | No change | No change | No change |
| TA submit | No change | No change | scheduleRefresh (for pending_profile_review flag) |

---

## Section 6 — Edge Case Handling

| Scenario | Current Behavior | Required Behavior |
|---|---|---|
| **First-time submission, no prior approval** | `currentProfile = null`, fallback chain hits `temple` | `currentProfile = null` → Show placeholder "Profile not yet approved" for profile fields |
| **Rejection on first submission** | `currentProfile` remains null, DC sees temple fields | DC sees "No approved profile" state — do NOT fall back to temple for contact/bank |
| **Edit after approval** | Creates UPDATED_AFTER_APPROVAL staging, temple still has old approved data | Correct — temple holds last-approved display copy; TA sees old data until re-approve |
| **Resubmit after rejection** | Creates new version, UPDATED_AFTER_APPROVAL or new DRAFT | Correct — staging version increments |
| **Concurrent DC approval + TA edit** | `createOrUpdateDraft` blocked by SUBMITTED check (EC-04) | Correctly blocked — IllegalStateException thrown |
| **Concurrent two DC users approve same staging** | Second approval hits optimistic lock (`@Version` on WorkflowInstance) | WorkflowEngine throws concurrency exception — correct |
| **Transaction failure on approve** | Whole transaction rolls back — `temple_profile_current` + `temples` + `workflow_instances` all revert | Correct — @Transactional |
| **Stale SUBMITTED staging when temple already VERIFIED** | Auto-resolved via `executeSystem(REJECT)` in `createOrUpdateDraft` | Correct |
| **Partial draft (no bank account)** | `bank_account_number_encrypted = null` in staging | Allowed — profile fields are all optional in staging |
| **DC approves, then TA submits new draft** | New UPDATED_AFTER_APPROVAL staging row created | Correct — APPROVED staging stays APPROVED, new row for new edit |
| **temple_profile_history orphan on approve failure** | Transaction rolls back, no orphan | Correct |
| **network interruption during TA submit** | Idempotency key on WorkflowEngine.execute | Submit is safe to retry |
| **Deleted temple (soft-delete)** | `@SQLRestriction("is_deleted = false")` filters all queries | Correct — soft-delete propagates |
| **Orphan staging after temple soft-delete** | `@SQLRestriction` filters staging too (it has is_deleted) | Correct — staging also soft-deleted |
| **DC reviews temple in different district** | `jurisdictionGuard.assertDistrictScope` blocks | Correct |
| **UNDER_REVIEW status and `allowedActions`** | Frontend gates staging visibility on allowedActions including APPROVE — if UNDER_REVIEW doesn't include APPROVE, DC sees stale data | Fix: gate on `workflow_status IN (SUBMITTED, UNDER_REVIEW, RESUBMITTED)` rather than allowedActions for data visibility; keep allowedActions gating for action buttons only |
| **`temple_profile_history` missing phone/email columns** | Schema drift — archived profiles lose these fields | Add migration to add columns to history table |

---

## Section 7 — Migration Strategy

### Phase 0 — Schema Audit (zero-downtime, no code change)
1. Run a schema comparison against running DB to identify all columns in `temple_profile_staging`, `temple_profile_current`, `temple_profile_history` that are NOT in V13 but ARE in entity classes.
2. Identify the migration that added them (likely V58 or similar).
3. If no migration exists, create V88 to add the missing columns explicitly.

### Phase 1 — Schema Hardening (additive, backward-compatible)
**V88: Add missing columns to history table (if absent)**
```sql
ALTER TABLE temple_profile_history
  ADD COLUMN IF NOT EXISTS phone VARCHAR(15) NULL,
  ADD COLUMN IF NOT EXISTS email VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS website VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(11) NULL,
  ADD COLUMN IF NOT EXISTS description TEXT NULL;
```

**V89: Add composite index on staging for pending-query performance**
```sql
ALTER TABLE temple_profile_staging
  ADD INDEX IF NOT EXISTS idx_staging_temple_wf_status (temple_id, status, version_number DESC);
```

### Phase 2 — Service Consolidation (no schema change)
1. Remove or redirect `TempleController → TempleProfileStagingServiceImpl.approve()` to call `TempleProfileWorkflowServiceImpl.approveProfile()` (or deprecate the endpoint)
2. Remove or redirect `TempleController → TempleProfileStagingServiceImpl.reject()` similarly

### Phase 3 — Frontend Fix (no schema change)
1. Fix OverviewTab priority chain (2 layers, not 3)
2. Fix `effectiveBankAccountMasked` null handling
3. Fix staging visibility gate (data vs action separation)
4. Fix `TrustTabProps` typing
5. Fix DocumentsTab error state

### Phase 4 — Search Summary Hardening (no schema change)
1. Add explicit `@Query` for `existsByTempleIdAndWorkflowStatus` to avoid the compatibility layer brittleness

### Rollback Plan
- All schema changes are additive (ADD COLUMN IF NOT EXISTS) — rollback = no action (extra columns are harmless)
- Service/frontend changes are pure code — rollback = git revert
- No table drops, no renames, no NOT NULL constraint additions without defaults

---

## Section 8 — Detailed Implementation Plan

### Phase 0 — Verify Schema (prerequisite)

1. Run `SHOW COLUMNS FROM temple_profile_staging` against running DB
2. Verify `phone`, `email`, `website`, `bank_name`, `bank_ifsc`, `description`, `version_number` columns exist
3. Run same for `temple_profile_current` and `temple_profile_history`
4. If `temple_profile_history` is missing the newer columns → create V88 migration before any code changes

### Phase 1 — Backend: Eliminate Dual Approval Path

**Step 1.1** — In TempleController.java: Remove `POST /{templeId}/profile/approve/{stagingId}` and `POST /{templeId}/profile/reject/{stagingId}` endpoints (or mark `@Deprecated` and have them delegate to `TempleProfileWorkflowServiceImpl`)

**Step 1.2** — In TempleProfileStagingServiceImpl.java: Remove `approve()` and `reject()` methods (they are now dead code)

**Dependency check**: Search all call sites of `TempleProfileStagingService.approve/reject` — if only called from TempleController, safe to remove. If called from tests, update tests.

### Phase 2 — Backend: Fix `getPendingProfileStaging` Staging Visibility

**Step 2.1** — Current implementation is already correct (filters SUBMITTED/UNDER_REVIEW/RESUBMITTED). Verify `UNDER_REVIEW` is included. It is. **No change needed here.**

### Phase 3 — Backend: Fix `temple_profile_history` Schema (if needed)

**Step 3.1** — Check if V88 migration is needed via schema audit
**Step 3.2** — Update `TempleProfileWorkflowServiceImpl.approveProfile()` history-archive block to also copy `phone`, `email`, `website`, `bankName`, `bankIfsc`, `description` to `TempleProfileHistory`
**Step 3.3** — Update `TempleProfileHistory.java` entity to include the new fields

Files: TempleProfileHistory.java, TempleProfileWorkflowServiceImpl.java

### Phase 4 — Frontend: Fix OverviewTab Priority Chain

**Step 4.1** — OverviewTab.tsx: Change effective field logic:
```
// BEFORE: 3-layer (profile-managed fields fall back to temple)
effectiveContactName = actionablePendingStaging?.contactPersonName
                    || currentProfile?.contactPersonName
                    || temple.contactName

// AFTER: 2-layer (profile-managed fields use currentProfile, not temple)
effectiveContactName = actionablePendingStaging?.contactPersonName
                    || currentProfile?.contactPersonName
                    || null  // explicit null — show "—" or "Not yet approved"
```
Apply to: phone, email, website, contactName, designation, bankName, bankIfsc

**Step 4.2** — Fix `effectiveBankAccountMasked` null handling:
```typescript
const effectiveBankAccountMasked = actionablePendingStaging?.bankAccountNumberMasked
                                 || currentProfile?.bankAccountMasked
                                 // already no temple fallback — just ensure explicit fallback text
```
Add explicit null display: `effectiveBankAccountMasked || 'Not provided'`

**Step 4.3** — Separate data visibility from action visibility:
```typescript
// Data visibility: show pending staging data if workflow is in DC-review states
const hasPendingData = pendingStaging !== null
  && ['SUBMITTED', 'UNDER_REVIEW', 'RESUBMITTED'].includes(pendingStaging.status)

// Action visibility: show approve/reject buttons only if allowedActions includes them
const hasDcProfileAction = pendingAllowedActions.includes('APPROVE')
  || pendingAllowedActions.includes('RE_APPROVE')
  || pendingAllowedActions.includes('REJECT')

const displayPendingStaging = hasPendingData ? pendingStaging : null
const actionablePendingStaging = hasDcProfileAction ? pendingStaging : null
```
Use `displayPendingStaging` for field resolution, `actionablePendingStaging` for button visibility.

**Step 4.4** — Fields that stay on `temple` (identity fields — no change):
`name`, `grade`, `registrationNumber`, `primaryDeity`, `tradition`, `yearEstablished`, `history`, `aliasName`, address fields, geo, `verificationStatus`, `dcRejectionReason` — always read from `temple.*` (unchanged).

### Phase 5 — Frontend: Fix Type Safety

**Step 5.1** — TrustTab.tsx: Change `trust: any` prop type to `trust: DcTrustSummary | null` in `TrustTabProps`
**Step 5.2** — DocumentsTab.tsx: Add error state handling for `useListDocumentsQuery` error case

### Phase 6 — Backend: Harden Search Summary Computation

**Step 6.1** — TempleProfileStagingRepository.java: Replace compatibility-layer `existsByTempleIdAndStatus(WorkflowStatus)` with a direct `@Query` that checks `workflow_instances` by entity_type and status, OR simply use the existing `existsByTempleIdAndStatus` with `SUBMITTED` WorkflowStatus — but add a comment documenting the mapping

**Step 6.2** — Consider adding `UNDER_REVIEW` and `RESUBMITTED` to the `pending_profile_review` computation — currently only SUBMITTED sets the flag, but DC may be actively reviewing (UNDER_REVIEW) and the search summary shows 0 pending

---

## Section 9 — Testing Matrix

| Test ID | Type | Scenario | Expected |
|---|---|---|---|
| TPW-01 | Unit | `approveProfile` — first-time approval (no currentProfile) | Creates new currentProfile, temples gets VERIFIED, workflow APPROVED |
| TPW-02 | Unit | `approveProfile` — re-approval (existing currentProfile) | Old current archived to history, new current written, workflow RE_APPROVED |
| TPW-03 | Unit | `approveProfile` — supersedes previous APPROVED staging | Previous staging transitions to SUPERSEDED |
| TPW-04 | Unit | `rejectProfile` | staging.reviewComment set, workflow REJECTED, currentProfile unchanged |
| TPW-05 | Unit | `createOrUpdateDraft` while SUBMITTED staging exists and temple is VERIFIED | Auto-resolves stale staging, allows new DRAFT |
| TPW-06 | Unit | `createOrUpdateDraft` while SUBMITTED staging exists and temple is UNVERIFIED | Throws IllegalStateException (EC-04) |
| TPW-07 | Unit | `getPendingProfileStaging` returns SUBMITTED/UNDER_REVIEW/RESUBMITTED | Correct — returns the top-version actionable staging |
| TPW-08 | Unit | `getPendingProfileStaging` when only REJECTED staging exists | Returns null (no actionable staging) |
| TPW-09 | Unit | `getPendingProfileStaging` when only APPROVED staging exists | Returns null |
| TPW-10 | Unit | `promoteToTemple` field mapping | All 13 fields correctly copied with name mapping |
| TPW-11 | Unit | Dual path disabled — `TempleController.approve` endpoint removed | Returns 404 or delegates to correct service |
| TPW-12 | Unit | History archive includes phone/email/website fields | Verify after Phase 3 fix |
| TPW-13 | Integration | Full submit→approve cycle | currentProfile created, temples promoted, verificationStatus=VERIFIED, search summary refreshed |
| TPW-14 | Integration | Full submit→reject→edit→resubmit→approve | Version increments, old version REJECTED, new version APPROVED, prior APPROVED superseded |
| TPW-15 | Integration | Concurrent approval attempt (optimistic lock) | Second attempt throws OptimisticLockingFailureException |
| TPW-16 | Frontend | OverviewTab with pending staging (SUBMITTED) | Shows pending data with "Pending Review" badge |
| TPW-17 | Frontend | OverviewTab with UNDER_REVIEW staging | Shows pending data (data visibility), NOT action buttons |
| TPW-18 | Frontend | OverviewTab with no currentProfile and no pending staging | Shows "—" / "Not yet approved" for profile fields |
| TPW-19 | Frontend | OverviewTab after approve | Pending staging section gone, currentProfile data shown, badge removed |
| TPW-20 | Frontend | OverviewTab `effectiveBankAccountMasked` when currentProfile is null | Shows "Not provided" — no crash |
| TPW-21 | Frontend | Cache invalidation after approve | `DcTempleProfile[id]` and `DcProfileStaging[id]` both invalidated |
| TPW-22 | Frontend | DocumentsTab network error | Shows error state, not "No documents uploaded" |
| TPW-23 | UI | TrustTab TypeScript — `DcTrustSummary` type enforced | No `any` type errors at compile time |
| TPW-24 | State | `pending_profile_review` in search summary for UNDER_REVIEW staging | Should be 1 (fix in Phase 6) |
| TPW-25 | State | `pending_profile_review` after approve | Should be 0 |

---

## Section 10 — Final Recommendation

### Recommended Architecture: Hybrid (temples + staging + current) with Clear Ownership

**Keep:** `temples`, `temple_profile_staging`, `temple_profile_current`, `temple_profile_history`, `workflow_instances`

**Fix:** ownership rules, field naming awareness, dual approval path, frontend priority chain

**Why this is the safest approach:**
- Zero data loss risk — all changes are additive or clarifying
- No destructive schema changes — no table drops, no column renames
- Workflow safety maintained — staging versioning and WorkflowEngine state machine unchanged
- Audit safety maintained — history table preserved and hardened
- Search indexing safe — `temple_search_summary` refresh path unchanged
- Trust/Declaration/Employee/Contractor modules completely unaffected

**Why single-table (`temples`) is NOT safe:**
1. `temples` has no `bank_account_number_encrypted` — would require adding sensitive column to the most-read entity
2. `publishedAt/publishedBy` audit fields would need to be added to temples with nullable constraints (migration risk)
3. The staging workflow by definition requires a buffer table — you cannot put pending drafts in the main table
4. `temple_profile_history` is an audit requirement — requires an archivable "approved snapshot" source

**Risks of the proposed approach:**
- Phase 1 (eliminating dual approval path) may break integrations that use the `TempleController` approve endpoint — audit before removing
- Phase 3 (history schema) requires a data migration to backfill `phone`/`email` for existing history rows (backfill with NULL is safe)

**Future maintenance benefit:**
- DC components read only from `currentProfile` (for profile fields) — one source, no surprise fallbacks
- TA components read only from `temples` — already the current design
- Staging is purely the "in-flight" buffer — never a display source for approved data

---

**Relevant Files**

- TempleProfileWorkflowServiceImpl.java — primary approve/reject service; add history field fixes here
- DcTempleProfileServiceImpl.java — `getFullProfile` and `getPendingProfileStaging`; `toProfileStagingResponse` mapper
- TempleProfileStagingServiceImpl.java — remove `approve()`/`reject()` after consolidation
- TempleController.java — remove/deprecate dual-path endpoints
- TempleProfileHistory.java — add phone/email/website/bankName/bankIfsc/description fields
- OverviewTab.tsx — fix 3→2 layer priority chain; separate data visibility from action visibility
- TrustTab.tsx — fix `trust: any` typing
- DocumentsTab.tsx — add error state
- V13 migration (V13__dc_module_profile_tables.sql) — original schema; document drift vs entities

**Verification Steps**
1. Run `SHOW COLUMNS FROM temple_profile_staging / temple_profile_current / temple_profile_history` on dev DB to confirm drift and determine if V88 is needed
2. Run `grep -r "profile/approve\|profile/reject" --include="*.java"` to find all callers of Path A before removing it
3. After Phase 4: manually step through submit→approve on staging DB, verify OverviewTab shows correct data at each state
4. Run the full test suite (`mvn test` + `pnpm test`) after each phase

**Decisions**
- Hybrid architecture retained — single-table consolidation ruled out (bank account constraint)
- `temples` remains TA-facing display copy; `temple_profile_current` is DC-facing canonical source for profile fields
- Path A (`TempleController.approve`) to be removed after confirming no active consumers
- Frontend: 2-layer priority chain (remove temple fallback for profile-managed fields)
- No breaking API changes — all changes are internal implementation fixes

**Further Considerations**
1. **Bank account in temples** — If a future requirement needs TA to see their bank account number after approval without a separate `currentProfile` query, consider adding `bank_account_number_encrypted` to `temples`. This is optional and can be deferred. Recommendation: defer.
2. **UNDER_REVIEW → pending_profile_review** — Currently only SUBMITTED staging sets `pending_profile_review=1` in search summary. Should UNDER_REVIEW also set it? Recommendation: yes — add UNDER_REVIEW and RESUBMITTED to the `existsByTempleIdAndStatus` check in Phase 6.
3. **V13 migration documentation** — Create V88/V89 to bring the documented schema in sync with the live schema, even if columns already exist (`ADD COLUMN IF NOT EXISTS` is idempotent). This prevents new-environment setup failures.