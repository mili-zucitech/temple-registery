# ✅ Notification Fix - Multiple Temple Authorities

## Issue Identified

**Problem:** Temple Authorities were not receiving notifications when DC approved/rejected/clarified declarations.

**Root Cause:** The `NotificationHelper` was finding ALL Temple Authorities for a temple, but only publishing ONE event with the first TA's ID (`taIds[0]`).

## What Was Wrong

### Before Fix

```java
// NotificationHelper.notifyDeclarationApproved()
Long[] taIds = recipientResolver.getTempleAuthorityIds(templeId);  // Found ALL TAs
// ...
eventPublisher.publish(new DeclarationApprovedEvent(
    applicationContext,
    declarationId,
    temple.getName(),
    dcUserId,
    dcName,
    taIds[0],  // ❌ Only first TA!
    parseFinancialYear(financialYear)
));
```

**Result:** Only the first TA received notifications. If a temple had 2 or 3 TAs, the others never got notified.

## What Was Fixed

### After Fix

```java
// NotificationHelper.notifyDeclarationApproved()
Long[] taIds = recipientResolver.getTempleAuthorityIds(templeId);  // Found ALL TAs
// ...
// Publish one event per TA to ensure all TAs receive notification
for (Long taId : taIds) {
    eventPublisher.publish(new DeclarationApprovedEvent(
        applicationContext,
        declarationId,
        temple.getName(),
        dcUserId,
        dcName,
        taId,  // ✅ Each TA gets their own event!
        parseFinancialYear(financialYear)
    ));
}
```

**Result:** ALL Temple Authorities receive notifications!

## Methods Fixed

Fixed 4 notification methods in `NotificationHelper.java`:

1. ✅ `notifyDeclarationApproved()` - DC approves declaration
2. ✅ `notifyDeclarationRejected()` - DC rejects declaration
3. ✅ `notifyDeclarationFlagged()` - DC requests clarification
4. ✅ `notifyDeclarationMarkedForPhysicalVisit()` - DC schedules site visit

## How It Works Now

### Scenario: Temple has 2 Temple Authorities

**Before Fix:**
```
DC approves declaration
  ↓
NotificationHelper finds 2 TAs: [TA1, TA2]
  ↓
Publishes 1 event with TA1's ID
  ↓
✅ TA1 receives notification
❌ TA2 receives nothing
```

**After Fix:**
```
DC approves declaration
  ↓
NotificationHelper finds 2 TAs: [TA1, TA2]
  ↓
Publishes 2 events:
  - Event 1 with TA1's ID
  - Event 2 with TA2's ID
  ↓
✅ TA1 receives notification
✅ TA2 receives notification
```

## Technical Details

### Event Publishing Loop

```java
for (Long taId : taIds) {
    eventPublisher.publish(new DeclarationApprovedEvent(
        applicationContext,
        declarationId,
        temple.getName(),
        dcUserId,
        dcName,
        taId,  // Each TA gets their own event
        parseFinancialYear(financialYear)
    ));
}
```

### Event Flow

1. **NotificationHelper** publishes N events (one per TA)
2. **NotificationEventListener** receives each event asynchronously
3. **NotificationDispatchService** processes each event:
   - Creates in-app notification for the TA
   - Sends email if priority is HIGH/CRITICAL
   - Logs the notification event
4. **Result:** Each TA sees the notification in their inbox

## Verification

### Build Status
```
[INFO] BUILD SUCCESS
[INFO] Total time:  47.567 s
```

✅ Code compiles successfully

### Test Scenario

1. **Setup:**
   - Temple has 2 TAs: TA1 (userId=50) and TA2 (userId=51)
   - TA submits declaration
   - DC approves declaration

2. **Expected Result:**
   - TA1 receives notification
   - TA2 receives notification
   - Both see "Declaration Approved" in their inbox

3. **Database Check:**
   ```sql
   SELECT * FROM in_app_notifications 
   WHERE reference_id = <declarationId> 
   AND reference_type = 'DECLARATION';
   
   -- Should return 2 rows (one for each TA)
   ```

## Files Modified

1. ✅ `backend/src/main/java/com/templeregistry/service/notification/NotificationHelper.java`
   - Modified 4 methods to publish one event per TA
   - Lines: ~565-695

## Impact

### Before Fix
- ❌ Only first TA received notifications
- ❌ Other TAs missed important updates
- ❌ Poor user experience

### After Fix
- ✅ ALL TAs receive notifications
- ✅ Complete notification coverage
- ✅ Better user experience
- ✅ Consistent with DC notifications (which already work for multiple DCs)

## Testing

### Manual Test

1. **Start application:**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. **Create declaration as TA:**
   ```bash
   POST /api/temples/{templeId}/declarations
   Authorization: Bearer TA_TOKEN
   ```

3. **Submit declaration:**
   ```bash
   POST /api/declarations/{declarationId}/submit
   Authorization: Bearer TA_TOKEN
   ```

4. **Approve as DC:**
   ```bash
   POST /api/dc/declarations/{declarationId}/approve
   Authorization: Bearer DC_TOKEN
   {
     "remarks": "Approved"
   }
   ```

5. **Check notifications for ALL TAs:**
   ```bash
   # Check TA1's notifications
   GET /api/notifications
   Authorization: Bearer TA1_TOKEN
   
   # Check TA2's notifications
   GET /api/notifications
   Authorization: Bearer TA2_TOKEN
   ```

6. **Expected:** Both TAs should see the "Declaration Approved" notification

### Database Verification

```sql
-- Check how many TAs are linked to a temple
SELECT u.id, u.full_name, u.email
FROM users u
WHERE u.role = 'TEMPLE_AUTHORITY'
  AND (u.temple_id = <templeId> 
       OR u.id = (SELECT created_by FROM temples WHERE id = <templeId>));

-- Check notifications created
SELECT ian.id, ian.user_id, ian.title, ian.body, ian.created_at
FROM in_app_notifications ian
WHERE ian.reference_id = <declarationId>
  AND ian.reference_type = 'DECLARATION'
ORDER BY ian.created_at DESC;

-- Should see one notification per TA
```

## Summary

**Issue:** Only first TA received notifications  
**Cause:** Publishing single event with `taIds[0]`  
**Fix:** Publish one event per TA in a loop  
**Result:** ALL TAs now receive notifications  
**Status:** ✅ FIXED & COMPILED  

---

**Fixed Date:** April 24, 2026  
**Build Status:** ✅ SUCCESS  
**Files Modified:** 1  
**Methods Fixed:** 4  
**Impact:** High - Critical bug fix for notification delivery  

🎉 **Temple Authorities will now receive all DC notifications!**
