# Rejected Declaration Update Fix

## Problem
When a declaration was rejected by the temple authority (DC), the temple authority could not update the declaration to make corrections before resubmitting it. The update option was not available for rejected declarations.

## Root Cause
The `update` method in `DeclarationServiceImpl` only allowed updates when the declaration status was `DRAFT`:

```java
if (declaration.getStatus() != DeclarationStatus.DRAFT) {
    throw new com.templeregistry.exception.DeclarationImmutableException(id);
}
```

Additionally, there was no controller endpoint for the `resubmit` method that was already implemented in the service layer.

## Solution

### 1. Updated `DeclarationServiceImpl.update()` Method
Modified the update method to allow updates for both `DRAFT` and `REJECTED` declarations:

```java
// Allow updates for DRAFT and REJECTED declarations
if (declaration.getStatus() != DeclarationStatus.DRAFT && 
    declaration.getStatus() != DeclarationStatus.REJECTED) {
    throw new com.templeregistry.exception.DeclarationImmutableException(id);
}
```

Also added proper audit logging to distinguish between updating a draft vs updating a rejected declaration.

### 2. Added Resubmit Endpoint
Added a new endpoint in `DeclarationController` to expose the existing resubmit functionality:

```java
@PostMapping("/api/v1/declarations/{id}/resubmit")
@Operation(summary = "Resubmit a REJECTED or CLARIFICATION_REQUIRED declaration (creates new version)")
public ResponseEntity<ApiResponse<CompleteDeclarationResponse>> resubmit(
        @PathVariable Long id, @Valid @RequestBody ResubmitDeclarationRequest rq) {
    return ResponseEntity.ok(ApiResponse.success("Declaration resubmitted.", 
            declarationService.resubmit(id, rq)));
}
```

### 3. Updated State Transition Validator
Added the `REJECTED->SUBMITTED` transition to the permitted state transitions in `StateTransitionValidator`:

```java
"REJECTED->SUBMITTED",
```

This allows rejected declarations to be resubmitted after updates.

## Workflow After Fix

1. **Declaration is Rejected**: DC rejects a declaration with a reason
2. **Temple Authority Updates**: Temple authority can now use `PUT /api/v1/declarations/{id}` to update the rejected declaration
3. **Temple Authority Resubmits**: Temple authority can either:
   - Use `POST /api/v1/declarations/{id}/submit` to resubmit the same declaration (REJECTED → SUBMITTED)
   - Use `POST /api/v1/declarations/{id}/resubmit` to create a new version with updates

## Files Modified

1. `backend/src/main/java/com/templeregistry/service/impl/declaration/DeclarationServiceImpl.java`
   - Updated `update()` method to allow REJECTED status
   - Added proper audit logging for rejected declaration updates

2. `backend/src/main/java/com/templeregistry/controller/declaration/DeclarationController.java`
   - Updated API documentation for update endpoint
   - Added new `/resubmit` endpoint

3. `backend/src/main/java/com/templeregistry/service/declaration/StateTransitionValidator.java`
   - Added `REJECTED->SUBMITTED` transition

## Testing Recommendations

1. Test updating a rejected declaration via `PUT /api/v1/declarations/{id}`
2. Test resubmitting a rejected declaration via `POST /api/v1/declarations/{id}/submit`
3. Test creating a new version via `POST /api/v1/declarations/{id}/resubmit`
4. Verify audit logs are properly created for rejected declaration updates
5. Verify that declarations in other statuses (APPROVED, UNDER_REVIEW, etc.) still cannot be updated

## API Endpoints

### Update Declaration
```
PUT /api/v1/declarations/{id}
```
- **Allowed Statuses**: DRAFT, REJECTED
- **Body**: `CreateDeclarationRequest`
- **Response**: Updated declaration

### Resubmit Declaration
```
POST /api/v1/declarations/{id}/resubmit
```
- **Allowed Statuses**: REJECTED, CLARIFICATION_REQUIRED, SITE_VISIT_SCHEDULED
- **Body**: `ResubmitDeclarationRequest`
- **Response**: New declaration version with SUBMITTED status
