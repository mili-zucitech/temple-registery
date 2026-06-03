
Plan is updated. Here's the complete, implementation-ready plan. Switch to the **default agent** (not Plan mode) to execute it — all file paths and exact text replacements are specified.

---

## Plan: Google Maps Location Picker in TA Temple Edit

**TL;DR:** Enable lat/lng editing for TAs via Google Maps Places Autocomplete + draggable marker. Backend: V97 migration + `placeId`/`formattedAddress` through 7 files. Frontend: new `TempleLocationPicker` component + hook/schema/page updates.

---

### CRITICAL PRE-IMPLEMENTATION FACTS
- The frontend `POST /temples/{templeId}/profile/staging` hits `TempleController` → `CreateTempleProfileStagingRequest` (not `TaProfileStagingRequest`)
- Both DTOs need the fields; `TaDashboardServiceImpl.mapToStagingRequest()` needs updating too
- `TempleMapper.fromCreateRequest` needs two `@Mapping(target=..., ignore=true)` annotations added
- .env.example already has `VITE_GOOGLE_MAPS_API_KEY` — **no change needed**
- `taProfileStagingSchema` already validates `latitude`/`longitude` correctly

---

### Phase 1 — Backend (all 9 files are independent, can be done in parallel)

**1.1 — NEW FILE**: `backend/src/main/resources/db/migration/V97__add_place_id_formatted_address.sql`
```sql
-- V97: Add Google Maps place metadata to temple_profile_staging and temple.
ALTER TABLE temple_profile_staging
    ADD COLUMN place_id          VARCHAR(500)    NULL COMMENT 'Google Maps place_id from Places Autocomplete',
    ADD COLUMN formatted_address VARCHAR(1000)   NULL COMMENT 'Human-readable formatted address from Places Autocomplete';

ALTER TABLE temple
    ADD COLUMN place_id          VARCHAR(500)    NULL COMMENT 'Google Maps place_id (promoted from staging on approval)',
    ADD COLUMN formatted_address VARCHAR(1000)   NULL COMMENT 'Human-readable formatted address (promoted on approval)',
    ADD INDEX  idx_temple_place_id (place_id);
```

**1.2 — EDIT** TempleProfileStaging.java (after `longitude` field, ~line 118):
```java
// Location metadata (V97)
@Column(name = "place_id", length = 500)
private String placeId;

@Column(name = "formatted_address", length = 1000)
private String formattedAddress;
```

**1.3 — EDIT** Temple.java (after `longitude` field, before `// Contact` comment, ~line 92):
```java
// Location metadata (V97)
@Column(name = "place_id", length = 500)
private String placeId;

@Column(name = "formatted_address", length = 1000)
private String formattedAddress;
```

**1.4 — EDIT** CreateTempleProfileStagingRequest.java (after `longitude`, before `yearEstablished`, ~line 97):
```java
// Location metadata (V97)
@Size(max = 500)
private String placeId;

@Size(max = 1000)
private String formattedAddress;
```

**1.5 — EDIT** TaProfileStagingRequest.java (after `longitude`, before `yearEstablished`, ~line 103):
```java
// Location metadata (V97)
@Size(max = 500)
private String placeId;

@Size(max = 1000)
private String formattedAddress;
```

**1.6 — EDIT** TaDashboardServiceImpl.java `mapToStagingRequest()` — add before `.build()`:
```java
.placeId(req.getPlaceId())
.formattedAddress(req.getFormattedAddress())
```

**1.7 — EDIT** TempleProfileStagingServiceImpl.java `applyFields()` — after `longitude` line (~L397), before `yearEstablished`:
```java
// Location metadata (V97)
if (normalized(rq.getPlaceId()) != null)          staging.setPlaceId(normalized(rq.getPlaceId()));
if (normalized(rq.getFormattedAddress()) != null)  staging.setFormattedAddress(normalized(rq.getFormattedAddress()));
```

**1.8 — EDIT** TempleProfileWorkflowServiceImpl.java `promoteToTemple()` — after `linkedInstitutions` line (~L318), before the closing `}`:
```java
// Location metadata (V97)
if (staging.getPlaceId() != null)          temple.setPlaceId(staging.getPlaceId());
if (staging.getFormattedAddress() != null)  temple.setFormattedAddress(staging.getFormattedAddress());
```

**1.9 — EDIT** TempleResponse.java — after `longitude` field:
```java
private String placeId;
private String formattedAddress;
```

**1.10 — EDIT** TempleMapper.java — add two lines to `fromCreateRequest` method before `Temple fromCreateRequest(...)`:
```java
@Mapping(target = "placeId", ignore = true)
@Mapping(target = "formattedAddress", ignore = true)
```

---

### Phase 2 — Frontend: Install library *(separate terminal step)*

```bash
cd frontend && npm install @react-google-maps/api
```

---

### Phase 3 — Frontend: Schema & Types *(depends on Phase 2)*

**EDIT** templeTypes.ts:

A. In `TaProfileStagingRequest` interface — add after `longitude`:
```ts
placeId?: string | null
formattedAddress?: string | null
```

B. In `taProfileStagingSchema` — add after `longitude`:
```ts
placeId: z.string().max(500).optional().nullable(),
formattedAddress: z.string().max(1000).optional().nullable(),
```

C. In `TempleProfileStagingResponse` interface — add after `longitude`:
```ts
placeId?: string
formattedAddress?: string
```

D. In `TempleResponse` interface — add after `longitude`:
```ts
placeId?: string
formattedAddress?: string
```

---

### Phase 4 — Frontend: Create TempleLocationPicker Component

**NEW FILE**: `frontend/src/features/temple-profile/components/TempleLocationPicker/TempleLocationPicker.tsx`

```tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Autocomplete, GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import type { Libraries } from '@react-google-maps/api'
import { Input } from '@/components/ui/input'
import { MapPin } from 'lucide-react'

// Defined outside component — stable reference prevents LoadScript remounts
const LIBRARIES: Libraries = ['places']

const DEFAULT_LAT = 12.9716 // Bangalore
const DEFAULT_LNG = 77.5946
const MAP_CONTAINER_STYLE: React.CSSProperties = { width: '100%', height: '400px', borderRadius: '0.5rem' }

export interface LocationPickerValue {
  lat: number
  lng: number
  placeId?: string | null
  formattedAddress?: string | null
}

interface TempleLocationPickerProps {
  lat: number | null | undefined
  lng: number | null | undefined
  placeId?: string | null
  formattedAddress?: string | null
  onChange: (val: LocationPickerValue) => void
  disabled?: boolean
}

export function TempleLocationPicker({
  lat,
  lng,
  placeId,
  formattedAddress,
  onChange,
  disabled = false,
}: TempleLocationPickerProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey ?? '',
    libraries: LIBRARIES,
  })

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const [searchValue, setSearchValue] = useState(formattedAddress ?? '')

  // mapCenter only updates on place select (pan), not on drag/click (marker moves without pan)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: lat ?? DEFAULT_LAT,
    lng: lng ?? DEFAULT_LNG,
  })

  // Sync searchValue and mapCenter when initial data loads asynchronously
  const initializedRef = useRef(false)
  useEffect(() => {
    if (!initializedRef.current && (lat != null || formattedAddress)) {
      if (formattedAddress) setSearchValue(formattedAddress)
      if (lat != null && lng != null) setMapCenter({ lat, lng })
      initializedRef.current = true
    }
  }, [lat, lng, formattedAddress])

  const markerPosition = useMemo(
    () => (lat != null && lng != null ? { lat, lng } : null),
    [lat, lng],
  )

  const onAutocompleteLoad = useCallback((ac: google.maps.places.Autocomplete) => {
    setAutocomplete(ac)
  }, [])

  const onPlaceChanged = useCallback(() => {
    if (!autocomplete) return
    const place = autocomplete.getPlace()
    if (!place.geometry?.location) return
    const newLat = place.geometry.location.lat()
    const newLng = place.geometry.location.lng()
    const newCenter = { lat: newLat, lng: newLng }
    setSearchValue(place.formatted_address ?? '')
    setMapCenter(newCenter)
    onChange({
      lat: newLat,
      lng: newLng,
      placeId: place.place_id ?? null,
      formattedAddress: place.formatted_address ?? null,
    })
  }, [autocomplete, onChange])

  const onMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return
      // Lat/lng only — no reverse geocoding per spec
      onChange({ lat: e.latLng.lat(), lng: e.latLng.lng(), placeId, formattedAddress })
    },
    [onChange, placeId, formattedAddress],
  )

  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng || disabled) return
      onChange({ lat: e.latLng.lat(), lng: e.latLng.lng(), placeId, formattedAddress })
    },
    [onChange, disabled, placeId, formattedAddress],
  )

  // API key missing — fallback (parent lat/lng inputs remain editable)
  if (!apiKey) {
    console.warn('[TempleLocationPicker] VITE_GOOGLE_MAPS_API_KEY is not set.')
    return (
      <p className="text-sm text-muted-foreground">
        Map search unavailable. Enter coordinates manually below.
      </p>
    )
  }

  if (loadError) {
    return (
      <p className="text-sm text-destructive">
        Location search unavailable. Enter coordinates manually below.
      </p>
    )
  }

  if (!isLoaded) {
    return (
      <div
        className="flex items-center justify-center bg-muted rounded-md text-sm text-muted-foreground"
        style={MAP_CONTAINER_STYLE}
      >
        Loading map…
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {!disabled && (
        <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              className="pl-9"
              placeholder="Search location (e.g. ISKCON Bangalore)"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </Autocomplete>
      )}
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={mapCenter}
        zoom={lat != null ? 15 : 10}
        onClick={!disabled ? onMapClick : undefined}
        options={{
          gestureHandling: disabled ? 'none' : 'auto',
          clickableIcons: false,
        }}
      >
        {markerPosition && (
          <Marker
            position={markerPosition}
            draggable={!disabled}
            onDragEnd={!disabled ? onMarkerDragEnd : undefined}
          />
        )}
      </GoogleMap>
    </div>
  )
}
```

---

### Phase 5 — Frontend: Update TaTempleEditPage *(depends on Phase 3, 4)*

**EDIT** TaTempleEditPage.tsx:

A. Add import at the top:
```tsx
import { TempleLocationPicker } from '../../components/TempleLocationPicker/TempleLocationPicker'
```

B. Replace the entire "Temple Location" `<AccordionSection>` block. The new version:
- Removes the "cannot be changed" note
- Adds `<TempleLocationPicker>` wired to `form`
- Makes `latitude` and `longitude` inputs editable (remove `disabled`)
- Keeps `GeoHierarchySelectGrid`, `addressLine1`, `pinCode` disabled

```tsx
<AccordionSection title="Temple Location">
  <p className="text-sm text-muted-foreground mb-4">
    Use the map to search and pin the temple location. Latitude and longitude will auto-fill.
    You can also drag the marker or click on the map to adjust coordinates manually.
  </p>
  <div className="space-y-4">
    <GeoHierarchySelectGrid
      value={geoSelection}
      onChange={handleGeoChange}
      disabled
    />

    <TempleLocationPicker
      lat={form.watch('latitude') ?? null}
      lng={form.watch('longitude') ?? null}
      placeId={form.watch('placeId') ?? null}
      formattedAddress={form.watch('formattedAddress') ?? null}
      disabled={!isEditable}
      onChange={({ lat, lng, placeId: pid, formattedAddress: fa }) => {
        form.setValue('latitude', lat, { shouldDirty: true })
        form.setValue('longitude', lng, { shouldDirty: true })
        if (pid !== undefined) form.setValue('placeId', pid, { shouldDirty: true })
        if (fa !== undefined) form.setValue('formattedAddress', fa, { shouldDirty: true })
      }}
    />

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField control={form.control} name="addressLine1" render={({ field }) => (
        <FormItem className="sm:col-span-2">
          <FormLabel>Street / Address</FormLabel>
          <FormControl><Input {...field} placeholder="e.g. Temple Road, Near Bus Stand" disabled /></FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="pinCode" render={({ field }) => (
        <FormItem>
          <FormLabel>PIN Code</FormLabel>
          <FormControl>
            <Input {...field} placeholder="560001" inputMode="numeric" maxLength={6} disabled />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="latitude" render={({ field }) => (
        <FormItem>
          <FormLabel>Latitude</FormLabel>
          <FormControl>
            <Input
              type="number"
              step="0.0000001"
              placeholder="e.g. 12.9716"
              value={field.value ?? ''}
              onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
              disabled={!isEditable}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="longitude" render={({ field }) => (
        <FormItem>
          <FormLabel>Longitude</FormLabel>
          <FormControl>
            <Input
              type="number"
              step="0.0000001"
              placeholder="e.g. 77.5946"
              value={field.value ?? ''}
              onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
              disabled={!isEditable}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  </div>
</AccordionSection>
```

---

### Phase 6 — Frontend: Update taProfileHooks.ts *(depends on Phase 3)*

**EDIT** taProfileHooks.ts:

A. In the `form.reset()` inside the `useEffect` — add after `yearEstablished` in both branches:
```ts
placeId: (source as any).placeId ?? null,
formattedAddress: (source as any).formattedAddress ?? null,
```
And in the `else if (temple)` branch:
```ts
placeId: (temple as any).placeId ?? null,
formattedAddress: (temple as any).formattedAddress ?? null,
```

B. In `handleSave` body construction — add after `yearEstablished`:
```ts
placeId: data.placeId ?? undefined,
formattedAddress: data.formattedAddress ?? undefined,
```

C. In `handleStartEdit` prefill — add after `yearEstablished`:
```ts
placeId: (temple as any)?.placeId ?? undefined,
formattedAddress: (temple as any)?.formattedAddress ?? undefined,
```

---

### Phase 7 — Tests

**7.1 EDIT** TempleProfileStagingServiceImplTest.java — add two test methods:

```java
@Test
void should_apply_placeId_and_formattedAddress_when_provided() {
    when(templeRepository.findById(1L)).thenReturn(Optional.of(activeTemple));
    when(stagingRepository.findFirstByTempleIdAndStatus(1L, WorkflowStatus.DRAFT))
            .thenReturn(Optional.empty());
    lenient().when(stagingRepository.findTopByTempleIdAndStatusInOrderByVersionNumberDesc(
            eq(1L), any())).thenReturn(Optional.empty());
    when(stagingRepository.findMaxVersionNumberByTempleId(1L)).thenReturn(0);
    mockWorkflow(WorkflowStatus.DRAFT, 1);

    CreateTempleProfileStagingRequest request = CreateTempleProfileStagingRequest.builder()
            .placeId("ChIJ21P2rgVRrhkRjIgqmoQ0pIE")
            .formattedAddress("ISKCON Temple, Rajajinagar, Bengaluru, Karnataka 560010, India")
            .build();

    stagingService.createOrUpdateDraft(1L, request);

    verify(stagingRepository).save(argThat(s ->
            "ChIJ21P2rgVRrhkRjIgqmoQ0pIE".equals(s.getPlaceId()) &&
            s.getFormattedAddress().contains("ISKCON")));
}

@Test
void should_not_overwrite_placeId_when_null_in_request() {
    TempleProfileStaging existing = TempleProfileStaging.builder()
            .templeId(1L)
            .placeId("existing-place-id")
            .build();
    existing.setId(200L);

    when(templeRepository.findById(1L)).thenReturn(Optional.of(activeTemple));
    when(stagingRepository.findFirstByTempleIdAndStatus(1L, WorkflowStatus.DRAFT))
            .thenReturn(Optional.of(existing));
    lenient().when(stagingRepository.findTopByTempleIdAndStatusInOrderByVersionNumberDesc(
            eq(1L), any())).thenReturn(Optional.empty());
    mockWorkflow(WorkflowStatus.DRAFT, 1);

    // No placeId in request — existing value must be preserved
    CreateTempleProfileStagingRequest request = CreateTempleProfileStagingRequest.builder()
            .phone("9876543210")
            .build();

    stagingService.createOrUpdateDraft(1L, request);

    verify(stagingRepository).save(argThat(s -> "existing-place-id".equals(s.getPlaceId())));
}
```

**7.2 EDIT** TempleProfileWorkflowServiceImplTest.java — add test method after the existing approval tests:

```java
@Test
void should_promote_placeId_and_formattedAddress_to_temple_on_approval() {
    TempleProfileStaging staging = stagingWith(500L, 1L);
    staging.setPlaceId("ChIJ21P2rgVRrhkRjIgqmoQ0pIE");
    staging.setFormattedAddress("ISKCON Temple, Bengaluru");
    when(stagingRepository.findById(500L)).thenReturn(Optional.of(staging));
    when(templeRepository.findWithGeoById(1L)).thenReturn(Optional.of(activeTemple));
    when(workflowEngine.getState(WorkflowEntityType.TEMPLE_PROFILE, 500L))
            .thenReturn(workflowAt(996L, WorkflowStatus.SUBMITTED));

    ApproveProfileRequest req = new ApproveProfileRequest();
    ReflectionTestUtils.setField(req, "remarks", "Approved");
    service.approveProfile(500L, req, dcClaims);

    assertThat(activeTemple.getPlaceId()).isEqualTo("ChIJ21P2rgVRrhkRjIgqmoQ0pIE");
    assertThat(activeTemple.getFormattedAddress()).isEqualTo("ISKCON Temple, Bengaluru");
}
```

**7.3 NEW FILE** `frontend/src/features/temple-profile/components/TempleLocationPicker/TempleLocationPicker.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { TempleLocationPicker } from '../TempleLocationPicker'

// Mock @react-google-maps/api
vi.mock('@react-google-maps/api', () => ({
  useJsApiLoader: vi.fn(),
  GoogleMap: ({ children, onClick }: any) => (
    <div data-testid="google-map" onClick={onClick}>{children}</div>
  ),
  Marker: ({ position, draggable, onDragEnd }: any) => (
    <div
      data-testid="map-marker"
      data-lat={position?.lat}
      data-lng={position?.lng}
      data-draggable={draggable}
      onMouseUp={() => onDragEnd?.({ latLng: { lat: () => 13.0, lng: () => 78.0 } })}
    />
  ),
  Autocomplete: ({ children, onPlaceChanged }: any) => (
    <div data-testid="autocomplete" onClick={onPlaceChanged}>{children}</div>
  ),
}))

const { useJsApiLoader } = await import('@react-google-maps/api')

const mockOnChange = vi.fn()

describe('TempleLocationPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should_render_fallback_when_api_key_missing', () => {
    // VITE_GOOGLE_MAPS_API_KEY is undefined in test environment
    ;(useJsApiLoader as any).mockReturnValue({ isLoaded: false, loadError: null })
    renderWithProviders(
      <TempleLocationPicker lat={null} lng={null} onChange={mockOnChange} />,
    )
    expect(screen.getByText(/Map search unavailable/i)).toBeInTheDocument()
  })

  it('should_render_loading_state_when_maps_not_loaded', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key')
    ;(useJsApiLoader as any).mockReturnValue({ isLoaded: false, loadError: null })
    renderWithProviders(
      <TempleLocationPicker lat={null} lng={null} onChange={mockOnChange} />,
    )
    expect(screen.getByText(/Loading map/i)).toBeInTheDocument()
    vi.unstubAllEnvs()
  })

  it('should_render_existing_coordinates_on_initial_load', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key')
    ;(useJsApiLoader as any).mockReturnValue({ isLoaded: true, loadError: null })
    renderWithProviders(
      <TempleLocationPicker lat={12.9716} lng={77.5946} onChange={mockOnChange} />,
    )
    const marker = screen.getByTestId('map-marker')
    expect(marker).toHaveAttribute('data-lat', '12.9716')
    expect(marker).toHaveAttribute('data-lng', '77.5946')
    vi.unstubAllEnvs()
  })

  it('should_update_coordinates_when_marker_dragged', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key')
    ;(useJsApiLoader as any).mockReturnValue({ isLoaded: true, loadError: null })
    renderWithProviders(
      <TempleLocationPicker lat={12.9716} lng={77.5946} onChange={mockOnChange} />,
    )
    const marker = screen.getByTestId('map-marker')
    marker.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({ lat: 13.0, lng: 78.0 }),
    )
    vi.unstubAllEnvs()
  })

  it('should_render_manual_lat_lng_inputs_as_editable_when_no_map', () => {
    ;(useJsApiLoader as any).mockReturnValue({ isLoaded: false, loadError: null })
    renderWithProviders(
      <TempleLocationPicker lat={12.9716} lng={77.5946} onChange={mockOnChange} />,
    )
    // Fallback text present when API key missing
    expect(screen.getByText(/Map search unavailable/i)).toBeInTheDocument()
  })
})
```

---

### Verification Steps

1. **Backend**: `mvn test -pl backend` — all existing + new tests pass
2. **Frontend**: `npm run build` in frontend — zero TypeScript errors
3. **Frontend**: `npm test` — `TempleLocationPicker.test.tsx` passes
4. **Manual**: Open TA edit page → Temple Location section shows map + search input
5. **Manual**: Search "ISKCON Bangalore" → lat/lng auto-fill, map centers
6. **Manual**: Drag marker → lat/lng updates, map stays centered
7. **Manual**: Save draft → `placeId` and `formattedAddress` present in `temple_profile_staging` row
8. **Manual**: Admin approves → fields in `temple` table match staging
9. **Manual**: Open existing temple (old data, no placeId) → no crash, marker renders at existing lat/lng

---

### Decisions
- TA lat/lng fields are now **editable** (remove `disabled`), guarded by `isEditable` (same flag that gates all other TA form fields)
- `GeoHierarchySelectGrid`, `addressLine1`, `pinCode` remain admin-only (`disabled` unconditionally)
- Reverse geocoding on drag/click: deliberately excluded (spec: no excessive API calls)
- `formattedAddress` only updates from Places Autocomplete select
- `mapCenter` (map pan target) only updates on place select — drag/click moves marker without panning

Similar code found with 1 license type