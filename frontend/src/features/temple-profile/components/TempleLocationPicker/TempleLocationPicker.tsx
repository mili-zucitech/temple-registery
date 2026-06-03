import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Autocomplete, GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import type { Libraries } from '@react-google-maps/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Locate, Loader2, MapPin } from 'lucide-react'

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
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return
    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: curLat, longitude: curLng } = position.coords
        setMapCenter({ lat: curLat, lng: curLng })
        onChange({ lat: curLat, lng: curLng, placeId: null, formattedAddress: null })
        setIsGettingLocation(false)
      },
      () => { setIsGettingLocation(false) },
    )
  }, [onChange])

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
        <div className="flex gap-2">
          <div className="flex-1">
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
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="Use my current location"
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Locate className="h-4 w-4" />}
          </Button>
        </div>
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
