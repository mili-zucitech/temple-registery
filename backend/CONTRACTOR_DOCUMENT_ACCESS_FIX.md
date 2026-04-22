# Contractor Document Access Fix

## Problem
When Temple Authority users tried to preview or download contractor documents, they received an `ACCESS_DENIED` error.

## Root Causes

### Issue 1: Missing CONTRACTOR Case in resolveTempleId()
The `DocumentServiceImpl.assertAccess()` method's `resolveTempleId()` helper didn't have a case for `ownerType = "CONTRACTOR"`. 

When contractor documents are uploaded:
- `ownerType` is set to `"CONTRACTOR"`
- `ownerId` is set to the `templeId` (not contractorId, because the contractor doesn't exist yet during document upload)

The `resolveTempleId()` method was falling through to the default case, which just returned `doc.getOwnerId()`. However, the access control logic expected this to work correctly for all owner types.

### Issue 2: Controller-Level Authorization Blocking Temple Authority (MAIN ISSUE)
The `DocumentController.download()` endpoint had `@PreAuthorize(RoleConstants.CAN_READ_ALL)` which only allows:
- SUPER_ADMIN
- DISTRICT_COLLECTOR
- DC_STAFF
- AUDITOR

**Temple Authority users were blocked at the controller level** before the service-level access control could even run!

## Solution

### Fix 1: Added explicit cases for CONTRACTOR and EMPLOYEE
Added explicit cases in the `resolveTempleId()` method:

```java
case "CONTRACTOR" -> doc.getOwnerId(); // For contractors, ownerId is the templeId
case "EMPLOYEE" -> doc.getOwnerId(); // For employees, ownerId is the templeId
```

### Fix 2: Removed restrictive @PreAuthorize from download endpoint
Changed the `/{id}/download` endpoint to rely on service-level access control:

**Before:**
```java
@PreAuthorize(RoleConstants.CAN_READ_ALL) // Only DC, DC_STAFF, AUDITOR, SUPER_ADMIN
public ResponseEntity<Resource> download(@PathVariable Long id)
```

**After:**
```java
// No @PreAuthorize - let service-level assertAccess() handle authorization
public ResponseEntity<Resource> download(@PathVariable Long id)
```

The service-level `assertAccess()` method already has proper logic to:
- Allow SUPER_ADMIN full access
- Allow TEMPLE_AUTHORITY to access their own temple's documents
- Allow DC/DC_STAFF to access documents in their district
- Deny DC_STAFF from downloading (they can only view metadata)

## Why This Design?
Documents are uploaded BEFORE the contractor/employee entity is created (during the form submission process). Therefore:
1. We can't use the contractor/employee ID as `ownerId` (it doesn't exist yet)
2. We use `templeId` as `ownerId` to establish ownership
3. The documents are later linked to the contractor/employee via the `documentIds` field

## Files Changed
- `backend/src/main/java/com/templeregistry/service/impl/document/DocumentServiceImpl.java` - Added CONTRACTOR/EMPLOYEE cases
- `backend/src/main/java/com/templeregistry/controller/document/DocumentController.java` - Removed restrictive @PreAuthorize
- `frontend/src/features/contractor/pages/ContractorFormPage/ContractorFormPage.tsx` - Cleanup unused imports

## Testing
After restarting the backend:
1. Login as Temple Authority user
2. Navigate to Contractors page
3. Add a new contractor with document uploads
4. Click Preview or Download on uploaded documents
5. Verify documents open/download successfully without ACCESS_DENIED error

## Next Steps
**IMPORTANT**: The backend must be restarted for these changes to take effect.

```bash
cd backend
./mvnw spring-boot:run
```
