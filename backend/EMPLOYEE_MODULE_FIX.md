# Employee Module - TEMPLE_AUTHORITY Access Fix

## Problem

When TEMPLE_AUTHORITY users tried to access the employee list endpoint:
```
GET /api/v1/temples/{templeId}/employees
```

They received a 422 error:
```json
{
  "success": false,
  "message": "Non-SUPER_ADMIN principal [role=TEMPLE_AUTHORITY] has null districtId — corrupted JWT or missing claim.",
  "errorCode": "ILLEGAL_STATE"
}
```

## Root Cause

The `EmployeeServiceImpl.listByTemple()` method was calling:
1. `ownershipGuard.assertOwnsTemple(templeId)` ✓ Correct for TEMPLE_AUTHORITY
2. `jurisdictionGuard.assertDistrictScope(temple, currentClaims())` ✗ Incorrect for TEMPLE_AUTHORITY

The `assertDistrictScope` method was designed for DC roles (DISTRICT_COLLECTOR, DC_STAFF) and requires a `districtId` in the JWT claims. However, TEMPLE_AUTHORITY users:
- Have a `templeId` in their JWT (not `districtId`)
- Should only be validated for temple ownership, not district jurisdiction
- Are already properly validated by `OwnershipGuard.assertOwnsTemple()`

## Solution

Modified `JurisdictionGuard.assertDistrictScope()` to skip district scope validation for TEMPLE_AUTHORITY users.

### File Changed
**`backend/src/main/java/com/templeregistry/security/JurisdictionGuard.java`**

### Change Made

**Before:**
```java
public void assertDistrictScope(Temple temple, ScopeHelper.Claims claims) {
    String role = claims.role();

    // SUPER_ADMIN is never jurisdiction-scoped
    if (RoleConstants.SUPER_ADMIN.equals(role)) return;

    // R4 — null districtId on non-SA is always a programming error or corrupted JWT
    Long principalDistrictId = claims.districtId();
    if (principalDistrictId == null) {
        throw new IllegalStateException(
            "Non-SUPER_ADMIN principal [role=" + role + "] has null districtId — corrupted JWT or missing claim.");
    }
    // ... rest of validation
}
```

**After:**
```java
public void assertDistrictScope(Temple temple, ScopeHelper.Claims claims) {
    String role = claims.role();

    // SUPER_ADMIN and TEMPLE_AUTHORITY are never jurisdiction-scoped
    // TEMPLE_AUTHORITY ownership is checked separately via OwnershipGuard
    if (RoleConstants.SUPER_ADMIN.equals(role) || RoleConstants.TEMPLE_AUTHORITY.equals(role)) {
        return;
    }

    // R4 — null districtId on non-SA/non-TA is always a programming error or corrupted JWT
    Long principalDistrictId = claims.districtId();
    if (principalDistrictId == null) {
        throw new IllegalStateException(
            "Non-SUPER_ADMIN principal [role=" + role + "] has null districtId — corrupted JWT or missing claim.");
    }
    // ... rest of validation
}
```

## How It Works Now

### For TEMPLE_AUTHORITY Users:
1. Request comes in: `GET /api/v1/temples/120001/employees`
2. JWT contains: `{ userId: X, role: "TEMPLE_AUTHORITY", templeId: 120001 }`
3. `ownershipGuard.assertOwnsTemple(120001)` ✓ Validates templeId matches JWT
4. `jurisdictionGuard.assertDistrictScope(temple, claims)` ✓ Returns immediately (skips check)
5. Request proceeds successfully

### For DC Users (DISTRICT_COLLECTOR, DC_STAFF):
1. Request comes in: `GET /api/v1/temples/120001/employees`
2. JWT contains: `{ userId: Y, role: "DISTRICT_COLLECTOR", districtId: 5 }`
3. `ownershipGuard.assertOwnsTemple(120001)` ✓ No-op for DC roles
4. `jurisdictionGuard.assertDistrictScope(temple, claims)` ✓ Validates temple's district matches JWT districtId
5. Request proceeds if district matches, otherwise 404

### For SUPER_ADMIN:
1. Request comes in: `GET /api/v1/temples/120001/employees`
2. JWT contains: `{ userId: Z, role: "SUPER_ADMIN" }`
3. `ownershipGuard.assertOwnsTemple(120001)` ✓ No-op for SUPER_ADMIN
4. `jurisdictionGuard.assertDistrictScope(temple, claims)` ✓ Returns immediately (skips check)
5. Request proceeds successfully (full access)

## Security Implications

### No Security Regression
- TEMPLE_AUTHORITY users are still validated via `OwnershipGuard.assertOwnsTemple()`
- They can only access employees for their own temple (templeId in JWT)
- DC users still have district-level jurisdiction enforced
- SUPER_ADMIN still has full access

### Separation of Concerns
- **Ownership validation** (TEMPLE_AUTHORITY) → `OwnershipGuard`
- **District jurisdiction** (DC roles) → `JurisdictionGuard`
- **Full access** (SUPER_ADMIN) → No restrictions

## Affected Endpoints

This fix applies to all endpoints that call `jurisdictionGuard.assertDistrictScope()`:

### Employee Module:
- `GET /api/v1/temples/{templeId}/employees` ✓ Fixed
- `POST /api/v1/temples/{templeId}/employees` ✓ Fixed
- `GET /api/v1/employees/{id}` ✓ Fixed
- `PUT /api/v1/employees/{id}` ✓ Fixed
- `DELETE /api/v1/employees/{id}` ✓ Fixed

### Other Modules (if they use assertDistrictScope):
- Contractor module
- Declaration module
- Trust module
- Any other module that validates temple access

## Testing

### Test Cases:

1. **TEMPLE_AUTHORITY - Own Temple**
   - User: TA with templeId=120001
   - Request: `GET /api/v1/temples/120001/employees`
   - Expected: ✓ 200 OK with employee list

2. **TEMPLE_AUTHORITY - Other Temple**
   - User: TA with templeId=120001
   - Request: `GET /api/v1/temples/120002/employees`
   - Expected: ✗ 403 Forbidden (ownership violation)

3. **DISTRICT_COLLECTOR - Own District**
   - User: DC with districtId=5
   - Request: `GET /api/v1/temples/120001/employees` (temple in district 5)
   - Expected: ✓ 200 OK with employee list

4. **DISTRICT_COLLECTOR - Other District**
   - User: DC with districtId=5
   - Request: `GET /api/v1/temples/120002/employees` (temple in district 6)
   - Expected: ✗ 404 Not Found (district scope violation)

5. **SUPER_ADMIN - Any Temple**
   - User: SA
   - Request: `GET /api/v1/temples/{any}/employees`
   - Expected: ✓ 200 OK with employee list

## JWT Structure Reference

### TEMPLE_AUTHORITY JWT:
```json
{
  "userId": 123,
  "role": "TEMPLE_AUTHORITY",
  "templeId": 120001,
  "districtId": null,  // Not needed for TA
  "username": "ta_user@example.com"
}
```

### DISTRICT_COLLECTOR JWT:
```json
{
  "userId": 456,
  "role": "DISTRICT_COLLECTOR",
  "templeId": null,  // Not needed for DC
  "districtId": 5,
  "username": "dc_user@example.com"
}
```

### SUPER_ADMIN JWT:
```json
{
  "userId": 789,
  "role": "SUPER_ADMIN",
  "templeId": null,
  "districtId": null,
  "username": "admin@example.com"
}
```

## Deployment Notes

1. **No Database Changes**: This is a code-only fix
2. **No Migration Required**: No schema changes
3. **Backward Compatible**: Existing functionality preserved
4. **Immediate Effect**: Takes effect on application restart

## Related Files

- `backend/src/main/java/com/templeregistry/security/JurisdictionGuard.java` (Modified)
- `backend/src/main/java/com/templeregistry/security/OwnershipGuard.java` (Reference)
- `backend/src/main/java/com/templeregistry/security/RoleConstants.java` (Reference)
- `backend/src/main/java/com/templeregistry/service/impl/employee/EmployeeServiceImpl.java` (Uses both guards)

## Conclusion

The fix properly separates ownership validation (for TEMPLE_AUTHORITY) from district jurisdiction validation (for DC roles), allowing TEMPLE_AUTHORITY users to access their temple's employee data without requiring a districtId in their JWT claims.
