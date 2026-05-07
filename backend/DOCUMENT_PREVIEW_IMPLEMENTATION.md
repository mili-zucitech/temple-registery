# Document Preview vs Download Implementation

## Problem
When clicking "Preview" on contractor documents, the file was being downloaded instead of opening in the browser for preview.

## Root Cause
The `/{id}/download` endpoint was using `Content-Disposition: attachment` header, which forces the browser to download the file instead of displaying it inline.

## Solution

### Backend Changes

Added a new `/preview` endpoint that uses `Content-Disposition: inline` instead of `attachment`:

**DocumentController.java:**
```java
@GetMapping("/{id}/preview")
@Operation(summary = "Preview a document by its ID (opens in browser instead of downloading)")
public ResponseEntity<Resource> preview(@PathVariable Long id) {
    Resource resource = documentService.download(id);
    DocumentResponse doc = documentService.getById(id);
    return buildPreviewResponse(resource, doc.getOriginalFilename(), doc.getMimeType());
}

private ResponseEntity<Resource> buildPreviewResponse(Resource resource, String filename, String mimeType) {
    return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(mimeType))
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
            .body(resource);
}
```

### Frontend Changes

Updated all preview handlers to use the `/preview` endpoint directly:

**Before:**
```typescript
const handlePreviewDocument = async (docId: number) => {
  const response = await getDocumentUrl(docId).unwrap()
  window.open(response.data.url, '_blank')
}
```

**After:**
```typescript
const handlePreviewDocument = (docId: number) => {
  const previewUrl = `/api/v1/documents/${docId}/preview`
  window.open(previewUrl, '_blank')
}
```

Updated download handlers to use the `/download` endpoint directly:

```typescript
const handleDownloadDocument = (docId: number, filename: string) => {
  const downloadUrl = `/api/v1/documents/${docId}/download`
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
```

## Files Changed

### Backend
- `backend/src/main/java/com/templeregistry/controller/document/DocumentController.java`
  - Added `/{id}/preview` endpoint
  - Added `buildPreviewResponse()` helper method

### Frontend
- `frontend/src/features/contractor/pages/ContractorFormPage/ContractorFormPage.tsx`
- `frontend/src/features/contractor/pages/ContractorDetailPage/ContractorDetailPage.tsx`
- `frontend/src/features/dc/pages/DcTempleProfilePage/tabs/ContractorsTab.tsx`

All three files updated to:
- Use `/preview` endpoint for preview functionality
- Use `/download` endpoint for download functionality
- Removed unnecessary API calls and toast notifications
- Cleaned up unused imports

## How It Works

### Preview Flow
1. User clicks "Preview" button
2. Frontend opens `/api/v1/documents/{id}/preview` in new tab
3. Backend returns document with `Content-Disposition: inline`
4. Browser displays PDF/image inline in the new tab

### Download Flow
1. User clicks "Download" button
2. Frontend creates a temporary `<a>` element with `/api/v1/documents/{id}/download`
3. Backend returns document with `Content-Disposition: attachment`
4. Browser downloads the file to user's downloads folder

## Benefits
- ✅ Preview opens documents in browser (no download)
- ✅ Download properly saves files to downloads folder
- ✅ Simpler code (no unnecessary API calls)
- ✅ Better UX (instant preview, no loading states)
- ✅ Works for both TA and DC users

## Testing
After restarting the backend:
1. Login as Temple Authority user
2. Upload contractor documents
3. Click "Preview" → Document opens in new browser tab
4. Click "Download" → Document downloads to downloads folder
5. Verify same behavior in DC contractor detail view

## Next Steps
**IMPORTANT**: Restart the backend for changes to take effect:

```bash
cd backend
./mvnw spring-boot:run
```
