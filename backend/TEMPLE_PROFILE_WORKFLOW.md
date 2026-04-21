# Temple Profile End-to-End Workflow

## Overview
This document describes the complete temple profile workflow from creation by Temple Authority (TA) to verification by District Collector (DC).

## Database Schema Changes (V33 Migration)

### New Fields Added to `temples` Table:
- `is_verified_by_dc` (TINYINT): Boolean flag indicating DC verification
- `verified_by_dc_at` (DATETIME): Timestamp of verification
- `verified_by_dc_user_id` (BIGINT): User ID of DC who verified
- `is_flagged_by_dc` (TINYINT): Boolean flag indicating DC flagging
- `flagged_by_dc_at` (DATETIME): Timestamp of flagging
- `flagged_by_dc_user_id` (BIGINT): User ID of DC who flagged
- `dc_rejection_reason` (TEXT): Reason for rejection or flagging

## Workflow States

### Temple Profile Staging States (Existing)
1. **DRAFT** - TA is editing the profile
2. **PENDING_REVIEW** (displayed as "SUBMITTED") - Awaiting DC review
3. **APPROVED** - DC approved the staging submission
4. **REJECTED** - DC rejected the staging submission
5. **SUPERSEDED** - Previous approved version replaced by new approval

### Temple Verification States (New)
- **Unverified** - Default state, not yet verified by DC
- **Verified** - DC has verified the temple profile (`is_verified_by_dc = true`)
- **Flagged** - DC has flagged the temple for issues (`is_flagged_by_dc = true`)

## End-to-End Workflow

### Phase 1: Temple Authority Creates/Edits Profile

#### 1.1 Create or Update Draft
**Endpoint:** `POST /api/v1/temples/{templeId}/profile/staging`

**Request Body:** `CreateTempleProfileStagingRequest`
```json
{
  "phone": "9876543210",
  "email": "temple@example.com",
  "website": "https://temple.example.com",
  "contactPersonName": "John Doe",
  "contactPersonDesignation": "Manager",
  "photoFilePath": "/uploads/temple-photo.jpg",
  "bankAccountNumber": "1234567890",
  "bankName": "State Bank",
  "bankIfsc": "SBIN0001234",
  "languagesOfWorship": "Kannada, Sanskrit",
  "linkedInstitutions": "[\"Mutt A\", \"Sub-temple B\"]",
  "description": "Ancient temple...",
  "annualFestivals": "Ugadi, Dasara",
  "landmark": "Near City Center",
  "historicalSignificance": "Built in 12th century..."
}
```

**Business Rules:**
- Creates new DRAFT or updates existing DRAFT
- Throws error if PENDING_REVIEW record exists (EC-04)
- Throws error if temple is SUSPENDED (EC-03)
- All fields are optional (patch semantics)

#### 1.2 Submit for DC Review
**Endpoint:** `POST /api/v1/temples/{templeId}/profile/submit`

**Actions:**
1. Validates DRAFT exists
2. Promotes staging fields to Temple entity (main table)
3. Transitions status: DRAFT → PENDING_REVIEW
4. Records `submitted_at` and `submitted_by`
5. Refreshes search summary
6. Publishes notification to DC

### Phase 2: District Collector Reviews Profile

#### 2.1 View Pending Profile
**Endpoint:** `GET /api/v1/dc/temples/{templeId}/profile/pending`

**Response:** `ProfileStagingResponse` with all staging fields and status

#### 2.2 View Full Temple Profile
**Endpoint:** `GET /api/v1/dc/temples/{id}`

**Response:** `TempleFullProfileResponse` including:
- Temple core details with DC verification fields
- Trust information
- Board members
- Financial records
- Employees
- Contractors
- Declarations
- Current approved profile

### Phase 3: DC Approves or Rejects Staging Submission

#### 3.1 Approve Profile Staging
**Endpoint:** `POST /api/v1/dc/profiles/{stagingId}/approve`

**Request Body:** `ApproveProfileRequest`
```json
{
  "remarks": "Profile looks good"
}
```

**Actions:**
1. Validates status is PENDING_REVIEW
2. Asserts district scope
3. Archives existing `temple_profile_current` → `temple_profile_history`
4. Creates new `temple_profile_current` row
5. Marks previous APPROVED staging as SUPERSEDED
6. Sets staging status = APPROVED
7. Records `reviewed_at` and `reviewed_by`
8. Publishes notification to TA
9. Refreshes search summary

#### 3.2 Reject Profile Staging
**Endpoint:** `POST /api/v1/dc/profiles/{stagingId}/reject`

**Request Body:** `RejectProfileRequest`
```json
{
  "reason": "Bank account details are incorrect. Please verify and resubmit."
}
```

**Actions:**
1. Validates status is PENDING_REVIEW
2. Asserts district scope
3. Sets staging status = REJECTED
4. Stores `review_comment` with rejection reason
5. Records `reviewed_at` and `reviewed_by`
6. Publishes notification to TA with reason
7. Refreshes search summary
8. TA can create new DRAFT (version increments)

### Phase 4: DC Verifies or Flags Temple Profile (New)

#### 4.1 Verify Temple Profile
**Endpoint:** `POST /api/v1/dc/temples/{templeId}/verify`

**Request Body:** `VerifyTempleProfileRequest`
```json
{
  "remarks": "All details verified on-site"
}
```

**Actions:**
1. Asserts district scope
2. Sets `is_verified_by_dc = true`
3. Records `verified_by_dc_at = NOW()`
4. Records `verified_by_dc_user_id = DC user ID`
5. **Automatically removes any existing flag**:
   - Sets `is_flagged_by_dc = false`
   - Clears `flagged_by_dc_at`, `flagged_by_dc_user_id`, `dc_rejection_reason`
6. Saves temple entity
7. Refreshes search summary
8. Publishes notification to TA

**Response:** `TempleVerificationResponse` with complete verification status

#### 4.2 Flag Temple Profile
**Endpoint:** `POST /api/v1/dc/temples/{templeId}/flag`

**Request Body:** `FlagTempleProfileRequest`
```json
{
  "reason": "Discrepancies found in trust registration documents. Physical verification required."
}
```

**Actions:**
1. Asserts district scope
2. Sets `is_flagged_by_dc = true`
3. Records `flagged_by_dc_at = NOW()`
4. Records `flagged_by_dc_user_id = DC user ID`
5. Stores `dc_rejection_reason = reason`
6. **Automatically removes verification if previously verified**:
   - Sets `is_verified_by_dc = false`
   - Clears `verified_by_dc_at`, `verified_by_dc_user_id`
7. Saves temple entity
8. Refreshes search summary
9. Publishes notification to TA with reason

**Response:** `TempleVerificationResponse` with complete verification status

#### 4.3 Remove Flag (Unflag)
**Endpoint:** `POST /api/v1/dc/temples/{templeId}/unflag`

**Request Body:** `UnflagTempleProfileRequest`
```json
{
  "remarks": "Issues resolved after document resubmission"
}
```

**Actions:**
1. Asserts district scope
2. Validates temple is currently flagged
3. Sets `is_flagged_by_dc = false`
4. Clears `flagged_by_dc_at`, `flagged_by_dc_user_id`, `dc_rejection_reason`
5. **Does NOT automatically verify** (DC must explicitly verify if needed)
6. Saves temple entity
7. Refreshes search summary
8. Publishes notification to TA

**Response:** `TempleVerificationResponse` with complete verification status

#### 4.4 Get Verification Status
**Endpoint:** `GET /api/v1/dc/temples/{templeId}/verification-status`

**Response:** `TempleVerificationResponse`
```json
{
  "templeId": 123,
  "registrationNumber": "TMP-2024-001",
  "templeName": "Sri Krishna Temple",
  "isVerifiedByDc": true,
  "verifiedByDcAt": "2024-03-15T10:30:00",
  "verifiedByDcUserId": 456,
  "isFlaggedByDc": false,
  "flaggedByDcAt": null,
  "flaggedByDcUserId": null,
  "dcRejectionReason": null,
  "message": "Verification status retrieved successfully."
}
```

## Verification vs Flagging Rules

### Mutual Exclusivity
- A temple **CANNOT** be both verified and flagged simultaneously
- Verifying a temple automatically removes any existing flag
- Flagging a temple automatically removes verification

### State Transitions
```
Unverified → Verified (via verify endpoint)
Unverified → Flagged (via flag endpoint)
Verified → Flagged (via flag endpoint, removes verification)
Flagged → Unverified (via unflag endpoint)
Flagged → Verified (via verify endpoint, removes flag)
```

### Independent from Staging Workflow
- DC can verify/flag a temple **at any time**, independent of staging submissions
- Staging workflow (DRAFT → PENDING_REVIEW → APPROVED/REJECTED) is for profile content updates
- Verification/flagging is for overall temple profile validation

## API Endpoints Summary

### Temple Authority (TA) Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/temples/{templeId}/profile/staging` | Create/update DRAFT |
| POST | `/api/v1/temples/{templeId}/profile/submit` | Submit DRAFT for review |
| GET | `/api/v1/temples/{templeId}/profile/staging/active` | Get active DRAFT or PENDING_REVIEW |
| GET | `/api/v1/temples/{templeId}/profile/history` | Get version history |
| GET | `/api/v1/temples/{templeId}/profile/current` | Get current approved profile |

### District Collector (DC) Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dc/temples` | Search temples (district-scoped) |
| GET | `/api/v1/dc/temples/{id}` | Get full temple profile |
| GET | `/api/v1/dc/temples/{templeId}/profile/pending` | Get pending staging submission |
| POST | `/api/v1/dc/profiles/{stagingId}/approve` | Approve staging submission |
| POST | `/api/v1/dc/profiles/{stagingId}/reject` | Reject staging submission |
| POST | `/api/v1/dc/temples/{templeId}/verify` | Verify temple profile |
| POST | `/api/v1/dc/temples/{templeId}/flag` | Flag temple profile |
| POST | `/api/v1/dc/temples/{templeId}/unflag` | Remove flag from temple |
| GET | `/api/v1/dc/temples/{templeId}/verification-status` | Get verification status |

## Security & Authorization

### Role Requirements
- **Temple Authority (TA)**: Can create/edit/submit profiles for their temple only
- **District Collector (DC)**: Can review/approve/reject/verify/flag temples in their district only
- **Super Admin (SA)**: Can perform all operations across all districts

### Scope Validation
- **Ownership Guard**: Ensures TA can only modify their own temple
- **Jurisdiction Guard**: Ensures DC can only act on temples in their district
- All DC actions validate district scope via `JurisdictionGuard.assertDistrictScope()`

## Notifications

### Notification Events
1. **TEMPLE_PROFILE_SUBMITTED** - TA submits profile → DC notified
2. **TEMPLE_PROFILE_APPROVED** - DC approves staging → TA notified
3. **TEMPLE_PROFILE_REJECTED** - DC rejects staging → TA notified with reason
4. **TEMPLE_PROFILE_VERIFIED** - DC verifies temple → TA notified
5. **TEMPLE_PROFILE_FLAGGED** - DC flags temple → TA notified with reason
6. **TEMPLE_PROFILE_UNFLAGGED** - DC removes flag → TA notified

### Notification Channels
- **IN_APP**: All notifications delivered via in-app notification system
- Future: EMAIL, SMS (when configured)

## Data Consistency

### Transactional Guarantees
- All workflow actions are `@Transactional`
- Search summary refresh happens in same transaction
- Notification events inserted in same transaction (rollback-safe)

### Audit Trail
- All staging records preserved with version history
- Approved profiles archived to `temple_profile_history`
- DC verification/flagging actions recorded with timestamp and user ID
- Rejection reasons stored for TA reference

## Error Handling

### Common Error Codes
- `TEMPLE_NOT_FOUND` - Temple ID does not exist
- `TEMPLE_PROFILE_STAGING_DRAFT_NOT_FOUND` - No DRAFT exists for submission
- `TEMPLE_SUSPENDED` - Cannot submit profile for suspended temple (EC-03)
- `PROFILE_SUBMISSION_LOCKED` - PENDING_REVIEW exists, editing locked (EC-04)
- `INVALID_STATUS_TRANSITION` - Cannot approve/reject non-PENDING_REVIEW record
- `JURISDICTION_VIOLATION` - DC attempting action outside their district
- `OWNERSHIP_VIOLATION` - TA attempting action on temple they don't own

## Best Practices

### For Temple Authority
1. Save DRAFT frequently (auto-save recommended)
2. Review all fields before submitting
3. Wait for DC response before creating new submission
4. Address rejection reasons in next submission
5. Monitor verification status and respond to flags promptly

### For District Collector
1. Review pending profiles regularly
2. Provide clear rejection reasons (mandatory, 10-2000 chars)
3. Use verify/flag independently from staging workflow
4. Unflag only after issues are resolved
5. Verify temple after confirming all details are accurate

## Testing Checklist

### TA Workflow
- [ ] Create new DRAFT profile
- [ ] Update existing DRAFT
- [ ] Submit DRAFT for review
- [ ] Verify cannot edit while PENDING_REVIEW
- [ ] View submission history
- [ ] Receive approval notification
- [ ] Receive rejection notification with reason
- [ ] Create new DRAFT after rejection

### DC Workflow
- [ ] Search temples in district
- [ ] View full temple profile
- [ ] View pending profile staging
- [ ] Approve staging submission
- [ ] Reject staging submission with reason
- [ ] Verify temple profile
- [ ] Flag temple profile with reason
- [ ] Unflag temple profile
- [ ] View verification status
- [ ] Verify mutual exclusivity (verify removes flag, flag removes verify)

### Security
- [ ] TA cannot access other temples
- [ ] DC cannot access temples outside district
- [ ] SA can access all temples
- [ ] Proper error messages for unauthorized access

## Migration Instructions

### Running the Migration
```bash
# The migration will run automatically on application startup via Flyway
# V33__add_dc_verification_fields_to_temples.sql

# To manually verify:
mysql> DESCRIBE temples;
# Should show new columns: is_verified_by_dc, verified_by_dc_at, etc.

mysql> SHOW INDEX FROM temples WHERE Key_name = 'idx_temples_dc_verification';
# Should show the new composite index
```

### Rollback (if needed)
```sql
-- Remove the new fields
ALTER TABLE temples
    DROP COLUMN dc_rejection_reason,
    DROP COLUMN flagged_by_dc_user_id,
    DROP COLUMN flagged_by_dc_at,
    DROP COLUMN is_flagged_by_dc,
    DROP COLUMN verified_by_dc_user_id,
    DROP COLUMN verified_by_dc_at,
    DROP COLUMN is_verified_by_dc;

-- Remove the index
DROP INDEX idx_temples_dc_verification ON temples;
```

## Future Enhancements

1. **Bulk Verification**: DC can verify multiple temples at once
2. **Verification Expiry**: Auto-flag temples after X years without re-verification
3. **Verification Checklist**: DC follows structured checklist during verification
4. **Photo Evidence**: DC can attach photos during verification/flagging
5. **Escalation**: TA can escalate flagged status to higher authority
6. **Analytics Dashboard**: Track verification rates, flagging reasons, approval times
7. **Email/SMS Notifications**: Multi-channel notification delivery
8. **Verification Certificate**: Generate PDF certificate for verified temples
