# Temple Profile API Quick Reference

## Base URLs
- **TA Endpoints:** `/api/v1/temples`
- **DC Endpoints:** `/api/v1/dc/temples` and `/api/v1/dc/profiles`

---

## Temple Authority (TA) Endpoints

### 1. Create/Update Profile Draft
```http
POST /api/v1/temples/{templeId}/profile/staging
Content-Type: application/json
Authorization: Bearer <TA_TOKEN>

{
  "phone": "9876543210",
  "email": "temple@example.com",
  "website": "https://temple.example.com",
  "contactPersonName": "John Doe",
  "contactPersonDesignation": "Manager",
  "bankAccountNumber": "1234567890",
  "bankName": "State Bank",
  "bankIfsc": "SBIN0001234",
  "languagesOfWorship": "Kannada, Sanskrit",
  "annualFestivals": "Ugadi, Dasara",
  "landmark": "Near City Center"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile draft saved.",
  "data": {
    "id": 1,
    "templeId": 123,
    "versionNumber": 1,
    "statusLabel": "DRAFT",
    "phone": "9876543210",
    "email": "temple@example.com",
    ...
  }
}
```

### 2. Submit Profile for DC Review
```http
POST /api/v1/temples/{templeId}/profile/submit
Authorization: Bearer <TA_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "message": "Profile submitted for review.",
  "data": {
    "id": 1,
    "statusLabel": "SUBMITTED",
    "submittedAt": "2024-03-15T10:30:00",
    ...
  }
}
```

### 3. Get Active Profile Staging
```http
GET /api/v1/temples/{templeId}/profile/staging/active
Authorization: Bearer <TA_TOKEN>
```

### 4. Get Profile History
```http
GET /api/v1/temples/{templeId}/profile/history?page=0&size=10
Authorization: Bearer <TA_TOKEN>
```

---

## District Collector (DC) Endpoints

### Profile Staging Workflow

#### 1. Get Pending Profile Staging
```http
GET /api/v1/dc/temples/{templeId}/profile/pending
Authorization: Bearer <DC_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "message": "Pending profile staging retrieved.",
  "data": {
    "id": 1,
    "templeId": 123,
    "statusLabel": "SUBMITTED",
    "phone": "9876543210",
    "email": "temple@example.com",
    ...
  }
}
```

#### 2. Approve Profile Staging
```http
POST /api/v1/dc/profiles/{stagingId}/approve
Content-Type: application/json
Authorization: Bearer <DC_TOKEN>

{
  "remarks": "Profile looks good. Approved."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile approved.",
  "data": {
    "declarationId": 1,
    "newStatus": "APPROVED",
    "message": "Profile approved successfully."
  }
}
```

#### 3. Reject Profile Staging
```http
POST /api/v1/dc/profiles/{stagingId}/reject
Content-Type: application/json
Authorization: Bearer <DC_TOKEN>

{
  "reason": "Bank account details are incorrect. Please verify and resubmit."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile rejected.",
  "data": {
    "declarationId": 1,
    "newStatus": "REJECTED",
    "message": "Profile rejected successfully."
  }
}
```

---

### Temple Verification Workflow (New)

#### 1. Verify Temple Profile
```http
POST /api/v1/dc/temples/{templeId}/verify
Content-Type: application/json
Authorization: Bearer <DC_TOKEN>

{
  "remarks": "All details verified on-site. Documents are in order."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Temple profile verified.",
  "data": {
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
    "message": "Temple profile verified successfully."
  }
}
```

**Business Rules:**
- Sets `isVerifiedByDc = true`
- Records timestamp and DC user ID
- **Automatically removes any existing flag**
- Publishes notification to TA

#### 2. Flag Temple Profile
```http
POST /api/v1/dc/temples/{templeId}/flag
Content-Type: application/json
Authorization: Bearer <DC_TOKEN>

{
  "reason": "Discrepancies found in trust registration documents. Physical verification required."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Temple profile flagged.",
  "data": {
    "templeId": 123,
    "registrationNumber": "TMP-2024-001",
    "templeName": "Sri Krishna Temple",
    "isVerifiedByDc": false,
    "verifiedByDcAt": null,
    "verifiedByDcUserId": null,
    "isFlaggedByDc": true,
    "flaggedByDcAt": "2024-03-15T11:00:00",
    "flaggedByDcUserId": 456,
    "dcRejectionReason": "Discrepancies found in trust registration documents. Physical verification required.",
    "message": "Temple profile flagged successfully."
  }
}
```

**Business Rules:**
- Sets `isFlaggedByDc = true`
- Records reason, timestamp, and DC user ID
- **Automatically removes verification if previously verified**
- Publishes notification to TA with reason

#### 3. Remove Flag (Unflag)
```http
POST /api/v1/dc/temples/{templeId}/unflag
Content-Type: application/json
Authorization: Bearer <DC_TOKEN>

{
  "remarks": "Issues resolved after document resubmission. Flag removed."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Temple profile flag removed.",
  "data": {
    "templeId": 123,
    "registrationNumber": "TMP-2024-001",
    "templeName": "Sri Krishna Temple",
    "isVerifiedByDc": false,
    "verifiedByDcAt": null,
    "verifiedByDcUserId": null,
    "isFlaggedByDc": false,
    "flaggedByDcAt": null,
    "flaggedByDcUserId": null,
    "dcRejectionReason": null,
    "message": "Temple profile flag removed successfully."
  }
}
```

**Business Rules:**
- Sets `isFlaggedByDc = false`
- Clears reason, timestamp, and user ID
- **Does NOT automatically verify** (DC must explicitly verify if needed)
- Publishes notification to TA

#### 4. Get Verification Status
```http
GET /api/v1/dc/temples/{templeId}/verification-status
Authorization: Bearer <DC_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "message": "Verification status retrieved.",
  "data": {
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
}
```

#### 5. Get Full Temple Profile
```http
GET /api/v1/dc/temples/{templeId}
Authorization: Bearer <DC_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "message": "Temple profile retrieved.",
  "data": {
    "temple": {
      "id": 123,
      "registrationNumber": "TMP-2024-001",
      "name": "Sri Krishna Temple",
      "grade": "A",
      "status": "ACTIVE",
      "verificationStatus": "VERIFIED",
      "isVerifiedByDc": true,
      "verifiedByDcAt": "2024-03-15T10:30:00",
      "verifiedByDcUserId": 456,
      "isFlaggedByDc": false,
      "dcRejectionReason": null,
      ...
    },
    "trust": { ... },
    "boardMembers": [ ... ],
    "financials": [ ... ],
    "employees": [ ... ],
    "contractors": [ ... ],
    "declarations": [ ... ],
    "currentProfile": { ... }
  }
}
```

#### 6. Search Temples (District-Scoped)
```http
GET /api/v1/dc/temples?page=0&size=20&grade=A&keyword=Krishna
Authorization: Bearer <DC_TOKEN>
```

---

## Validation Rules

### Phone Number
- Pattern: `^[0-9]{10}$`
- Exactly 10 digits, no country code

### Email
- RFC 5322 compliant
- Max 255 characters

### Bank IFSC
- Pattern: `^[A-Z]{4}0[A-Z0-9]{6}$`
- 4 letters + 0 + 6 alphanumeric

### Rejection/Flagging Reason
- Required for reject and flag operations
- Min: 10 characters
- Max: 2000 characters

### Remarks
- Optional for approve, verify, and unflag operations
- Max: 1000 characters

---

## Error Responses

### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "reason",
      "message": "Flagging reason is required."
    }
  ]
}
```

### 403 Forbidden - Jurisdiction Violation
```json
{
  "success": false,
  "message": "You do not have permission to access temples outside your district.",
  "errorCode": "JURISDICTION_VIOLATION"
}
```

### 404 Not Found - Temple Not Found
```json
{
  "success": false,
  "message": "Temple not found with id: 123",
  "errorCode": "TEMPLE_NOT_FOUND"
}
```

### 409 Conflict - Invalid State Transition
```json
{
  "success": false,
  "message": "Temple profile is not currently flagged.",
  "errorCode": "INVALID_STATE"
}
```

---

## State Transitions

### Verification States
```
Unverified → Verified (via /verify)
Unverified → Flagged (via /flag)
Verified → Flagged (via /flag, removes verification)
Flagged → Unverified (via /unflag)
Flagged → Verified (via /verify, removes flag)
```

### Mutual Exclusivity Rule
**A temple CANNOT be both verified and flagged simultaneously**
- Verifying removes flag
- Flagging removes verification
- Unflagging does NOT auto-verify

---

## Authorization Matrix

| Endpoint | TA | DC | SA |
|----------|----|----|-----|
| Create/Update Draft | ✓ (own temple) | ✗ | ✓ |
| Submit for Review | ✓ (own temple) | ✗ | ✓ |
| Approve Staging | ✗ | ✓ (district) | ✓ |
| Reject Staging | ✗ | ✓ (district) | ✓ |
| Verify Temple | ✗ | ✓ (district) | ✓ |
| Flag Temple | ✗ | ✓ (district) | ✓ |
| Unflag Temple | ✗ | ✓ (district) | ✓ |
| Get Verification Status | ✓ (read-only) | ✓ (district) | ✓ |

**Legend:**
- ✓ = Allowed
- ✗ = Not Allowed
- TA = Temple Authority
- DC = District Collector
- SA = Super Admin

---

## Common Workflows

### Workflow 1: TA Creates and Submits Profile
1. `POST /api/v1/temples/{templeId}/profile/staging` - Create DRAFT
2. `POST /api/v1/temples/{templeId}/profile/submit` - Submit for review
3. Wait for DC approval/rejection

### Workflow 2: DC Approves Profile
1. `GET /api/v1/dc/temples/{templeId}/profile/pending` - View pending
2. `POST /api/v1/dc/profiles/{stagingId}/approve` - Approve
3. TA receives notification

### Workflow 3: DC Verifies Temple
1. `GET /api/v1/dc/temples/{templeId}` - View full profile
2. `POST /api/v1/dc/temples/{templeId}/verify` - Verify temple
3. TA receives notification

### Workflow 4: DC Flags Temple
1. `GET /api/v1/dc/temples/{templeId}` - View full profile
2. `POST /api/v1/dc/temples/{templeId}/flag` - Flag with reason
3. TA receives notification with reason
4. TA addresses issues
5. `POST /api/v1/dc/temples/{templeId}/unflag` - DC removes flag
6. `POST /api/v1/dc/temples/{templeId}/verify` - DC verifies

---

## Testing with cURL

### Verify Temple
```bash
curl -X POST http://localhost:8080/api/v1/dc/temples/123/verify \
  -H "Authorization: Bearer <DC_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"remarks": "Verified on-site"}'
```

### Flag Temple
```bash
curl -X POST http://localhost:8080/api/v1/dc/temples/123/flag \
  -H "Authorization: Bearer <DC_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Documents need verification"}'
```

### Unflag Temple
```bash
curl -X POST http://localhost:8080/api/v1/dc/temples/123/unflag \
  -H "Authorization: Bearer <DC_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"remarks": "Issues resolved"}'
```

### Get Verification Status
```bash
curl -X GET http://localhost:8080/api/v1/dc/temples/123/verification-status \
  -H "Authorization: Bearer <DC_TOKEN>"
```

---

## Notes

1. **All DC endpoints are district-scoped** - DC can only act on temples in their district
2. **All operations are transactional** - Changes are atomic with search summary refresh
3. **Notifications are automatic** - TA receives in-app notifications for all DC actions
4. **Audit trail is maintained** - All actions recorded with timestamp and user ID
5. **Staging workflow is independent** - Verification/flagging can happen anytime, not tied to staging submissions
