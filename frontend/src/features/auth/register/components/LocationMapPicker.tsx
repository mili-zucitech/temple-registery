import { useState, useCallback } from 'react'
import { MapPin, Navigation } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface LocationMapPickerProps {
  latitude: number | null
  longitude: number | null
  onLocationChange: (lat: number, lon: number) => void
}

export function LocationMapPicker({ 
  latitude, 
  longitude, 
  onLocationChange
}: LocationMapPickerProps) {
  const [isDetecting, setIsDetecting] = useState(false)
  const [localLat, setLocalLat] = useState<string>(latitude?.toString() ?? '')
  const [localLng, setLocalLng] = useState<string>(longitude?.toString() ?? '')

  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.')
      return
    }

    setIsDetecting(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6))
        const lng = parseFloat(position.coords.longitude.toFixed(6))
        setLocalLat(lat.toString())
        setLocalLng(lng.toString())
        onLocationChange(lat, lng)
        toast.success('Current location detected!')
        setIsDetecting(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        toast.error('Could not detect location. Please enable location access.')
        setIsDetecting(false)
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    )
  }, [onLocationChange])

  const handleLatChange = (value: string) => {
    setLocalLat(value)
    const lat = parseFloat(value)
    const lng = parseFloat(localLng)
    if (!isNaN(lat) && !isNaN(lng)) {
      onLocationChange(lat, lng)
    }
  }

  const handleLngChange = (value: string) => {
    setLocalLng(value)
    const lat = parseFloat(localLat)
    const lng = parseFloat(value)
    if (!isNaN(lat) && !isNaN(lng)) {
      onLocationChange(lat, lng)
    }
  }

  return (
    <div className="space-y-4">
      {/* GPS Detection Button */}
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={handleDetectLocation}
          disabled={isDetecting}
          className="flex items-center gap-2"
        >
          <Navigation className="h-4 w-4" />
          {isDetecting ? 'Detecting Location...' : 'Detect My Current Location'}
        </Button>
      </div>

      {/* Manual Coordinate Entry */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Latitude
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="number"
              step="any"
              placeholder="e.g. 12.3456"
              className="pl-8"
              value={localLat}
              onChange={(e) => handleLatChange(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Longitude
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="number"
              step="any"
              placeholder="e.g. 76.6543"
              className="pl-8"
              value={localLng}
              onChange={(e) => handleLngChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Current Coordinates Display */}
      {latitude !== null && longitude !== null && (
        <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border">
          <div className="flex items-center gap-2 text-xs">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">
              Current: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 rounded-lg p-3">
        <p className="font-medium text-foreground">How to set location:</p>
        <ul className="list-disc list-inside space-y-0.5 ml-1">
          <li>Click "Detect My Current Location" to use GPS (recommended)</li>
          <li>Or manually enter latitude and longitude coordinates</li>
          <li>Coordinates should be in decimal degrees format</li>
        </ul>
      </div>
    </div>
  )
}
