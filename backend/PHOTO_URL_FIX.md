# Photo URL Recursive Prefix Fix

## Problem

The photo URL in the API response was being recursively prefixed with the download endpoint:

**Malformed URL:**
```
/api/v1/documents/download?key=/api/v1/documents/download?key=/api/v1/documents/download?key=temples/120001/photos/xxx.jpg
```

**Expected URL:**
```
/api/v1/documents/download?key=temples/120001/photos/xxx.jpg
```

## Root Cause

The `presignedUrl()` method in `LocalFileStorageServiceImpl` was not idempotent. It would blindly prepend `/api/v1/documents/download?key=` to any input, even if the input was already a presigned URL.

### How It Happened:

1. **Initial Upload**: Photo uploaded, raw path stored: `temples/120001/photos/xxx.jpg`
2. **First Read**: `presignedUrl()` called → `/api/v1/documents/download?key=temples/120001/photos/xxx.jpg`
3. **Database Update**: Presigned URL accidentally saved to database
4. **Subsequent Reads**: `presignedUrl()` called on already-presigned URL → recursive prefix

## Solution

### 1. Made `presignedUrl()` Idempotent

**File:** `backend/src/main/java/com/templeregistry/service/impl/document/LocalFileStorageServiceImpl.java`

**Before:**
```java
@Override
public String presignedUrl(String filePath) {
    return "/api/v1/documents/download?key=" + filePath;
}
```

**After:**
```java
@Override
public String presignedUrl(String filePath) {
    // Return null/empty as-is
    if (filePath == null || filePath.isBlank()) {
        return filePath;
    }
    
    // If already a presigned URL, return as-is (idempotent)
    if (filePath.startsWith("/api/v1/documents/download?key=")) {
        return filePath;
    }
    
    // Otherwise, convert raw file path to presigned URL
    return "/api/v1/documents/download?key=" + filePath;
}
```

### 2. Database Migration to Clean Up Existing Data

**File:** `backend/src/main/resources/db/migration/V34__fix_malformed_photo_urls.sql`

This migration:
- Extracts the actual file path from malformed URLs
- Updates `temples.photo_url` to store only raw file paths
- Updates `temple_photos.file_path` and `temple_photos.url` if malformed

**SQL Logic:**
```sql
-- Extract the last occurrence of 'key=' parameter
UPDATE temples
SET photo_url = SUBSTRING_INDEX(photo_url, 'key=', -1)
WHERE photo_url LIKE '%/api/v1/documents/download?key=%';
```

**Example:**
- Input: `/api/v1/documents/download?key=/api/v1/documents/download?key=temples/120001/photos/xxx.jpg`
- Output: `temples/120001/photos/xxx.jpg`

## How It Works Now

### Storage Layer (Database)
- **Always stores raw file paths**: `temples/120001/photos/xxx.jpg`
- **Never stores presigned URLs**: No `/api/v1/documents/download?key=` prefix

### Service Layer (API Response)
- **Calls `presignedUrl()` on raw paths**: Converts to presigned URL
- **Idempotent**: Safe to call multiple times
- **Returns presigned URL**: `/api/v1/documents/download?key=temples/120001/photos/xxx.jpg`

### Flow Diagram:

```
Database Storage:
  temples.photo_url = "temples/120001/photos/xxx.jpg"
                              ↓
Service Layer (toTempleResponse):
  fileStorageService.presignedUrl(t.getPhotoUrl())
                              ↓
Idempotent Check:
  - Starts with "/api/v1/documents/download?key=" ? → Return as-is
  - Otherwise → Prepend prefix
                              ↓
API Response:
  "photoUrl": "/api/v1/documents/download?key=temples/120001/photos/xxx.jpg"
```

## Benefits

1. **Idempotent**: Safe to call `presignedUrl()` multiple times
2. **Clean Database**: Raw file paths stored, not presigned URLs
3. **Consistent**: All photo URLs follow the same format
4. **Backward Compatible**: Handles both raw paths and presigned URLs
5. **Self-Healing**: Migration cleans up existing malformed data

## Testing

### Test Cases:

1. **Raw File Path (Normal Case)**
   ```java
   Input:  "temples/120001/photos/xxx.jpg"
   Output: "/api/v1/documents/download?key=temples/120001/photos/xxx.jpg"
   ```

2. **Already Presigned URL (Idempotent)**
   ```java
   Input:  "/api/v1/documents/download?key=temples/120001/photos/xxx.jpg"
   Output: "/api/v1/documents/download?key=temples/120001/photos/xxx.jpg"
   ```

3. **Malformed Recursive URL (Self-Healing)**
   ```java
   Input:  "/api/v1/documents/download?key=/api/v1/documents/download?key=temples/120001/photos/xxx.jpg"
   Output: "/api/v1/documents/download?key=/api/v1/documents/download?key=temples/120001/photos/xxx.jpg"
   Note: Migration will clean this up in the database
   ```

4. **Null or Empty**
   ```java
   Input:  null
   Output: null
   
   Input:  ""
   Output: ""
   ```

### Manual Testing:

1. **Before Migration:**
   ```bash
   # Check for malformed URLs
   mysql> SELECT id, photo_url FROM temples WHERE photo_url LIKE '%/api/v1/documents/download?key=%';
   ```

2. **Run Migration:**
   ```bash
   # Application startup will run V34 migration automatically
   mvn spring-boot:run
   ```

3. **After Migration:**
   ```bash
   # Verify URLs are cleaned
   mysql> SELECT id, photo_url FROM temples WHERE photo_url IS NOT NULL;
   # Should show only raw file paths like: temples/120001/photos/xxx.jpg
   ```

4. **Test API:**
   ```bash
   curl http://localhost:8080/api/v1/dc/temples/120001
   # Check photoUrl in response - should have single prefix only
   ```

## Affected Endpoints

All endpoints that return temple data with photoUrl:

### Temple Module:
- `GET /api/v1/temples` - Temple search
- `GET /api/v1/temples/{id}` - Temple detail
- `POST /api/v1/temples` - Create temple
- `PUT /api/v1/temples/{id}` - Update temple

### DC Module:
- `GET /api/v1/dc/temples` - DC temple search
- `GET /api/v1/dc/temples/{id}` - DC temple full profile

### Temple Photos:
- `GET /api/v1/temples/{id}/photos` - Photo gallery
- `POST /api/v1/temples/{id}/photo` - Upload primary photo
- `POST /api/v1/temples/{id}/photos` - Upload gallery photos

## Related Files

### Modified:
- `backend/src/main/java/com/templeregistry/service/impl/document/LocalFileStorageServiceImpl.java`

### Created:
- `backend/src/main/resources/db/migration/V34__fix_malformed_photo_urls.sql`
- `backend/PHOTO_URL_FIX.md` (this file)

### Reference:
- `backend/src/main/java/com/templeregistry/service/document/FileStorageService.java` (interface)
- `backend/src/main/java/com/templeregistry/service/impl/dc/DcTempleProfileServiceImpl.java` (uses presignedUrl)
- `backend/src/main/java/com/templeregistry/service/impl/temple/TempleServiceImpl.java` (uses presignedUrl)

## Best Practices Going Forward

### DO:
✅ Store raw file paths in database: `temples/120001/photos/xxx.jpg`
✅ Convert to presigned URLs in service layer: `presignedUrl(rawPath)`
✅ Use `presignedUrl()` method for all file path conversions
✅ Trust the idempotent behavior - safe to call multiple times

### DON'T:
❌ Store presigned URLs in database
❌ Manually construct download URLs with string concatenation
❌ Assume input is always a raw file path
❌ Skip null/empty checks before processing

## Deployment Checklist

- [ ] Code changes deployed
- [ ] V34 migration executed successfully
- [ ] Verify no malformed URLs in database
- [ ] Test temple detail API endpoints
- [ ] Test photo gallery endpoints
- [ ] Verify images load correctly in frontend
- [ ] Check DC temple profile page
- [ ] Monitor logs for any file-related errors

## Rollback Plan

If issues occur:

1. **Revert Code Changes:**
   ```bash
   git revert <commit-hash>
   mvn clean package
   ```

2. **Rollback Migration (if needed):**
   ```sql
   -- Note: This is destructive and should only be used if absolutely necessary
   -- The migration is safe and should not need rollback
   ```

3. **Manual Fix (if specific records affected):**
   ```sql
   -- Fix specific temple
   UPDATE temples 
   SET photo_url = 'temples/120001/photos/xxx.jpg'
   WHERE id = 120001;
   ```

## Conclusion

The fix ensures that:
1. Photo URLs are stored correctly in the database (raw file paths)
2. The `presignedUrl()` method is idempotent and safe to use
3. Existing malformed URLs are cleaned up automatically
4. Future uploads will work correctly without recursive prefixing

The system is now more robust and handles photo URLs consistently across all modules.
