import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, Navigation } from 'lucide-react'
import { toast } from 'sonner'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { GeoHierarchySelect } from '@/features/geo/components/GeoHierarchySelect/GeoHierarchySelect'
import type { GeoSelection } from '@/features/geo/geoTypes'
import { useWizard } from '../RegisterContext'
import {
  step4Schema,
  type Step4Data,
  TEMPLE_GRADE_OPTIONS,
  TRADITION_OPTIONS,
} from '../registerTypes'

const TRADITION_LABELS: Record<typeof TRADITION_OPTIONS[number], string> = {
  SHAIVITE: 'Shaivite',
  VAISHNAVITE: 'Vaishnavite',
  SHAKTA: 'Shakta',
  JAIN: 'Jain',
  BUDDHIST: 'Buddhist',
  OTHER: 'Other',
}

// India bounds for soft GPS warning
const INDIA_BOUNDS = { latMin: 8.0, latMax: 37.0, lonMin: 68.0, lonMax: 97.0 }

function isOutsideIndia(lat: number, lon: number): boolean {
  return lat < INDIA_BOUNDS.latMin || lat > INDIA_BOUNDS.latMax ||
    lon < INDIA_BOUNDS.lonMin || lon > INDIA_BOUNDS.lonMax
}

export function Step4TempleDetails() {
  const { state, saveStep4, nextStep, prevStep } = useWizard()
  const [geoSelection, setGeoSelection] = useState<GeoSelection>({})
  const [isDetectingGps, setIsDetectingGps] = useState(false)
  const [gpsWarning, setGpsWarning] = useState<string | null>(null)

  const form = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      templeName: state.step4?.templeName ?? '',
      aliasName: state.step4?.aliasName ?? '',
      deityName: state.step4?.deityName ?? '',
      grade: state.step4?.grade ?? undefined,
      religiousTradition: state.step4?.religiousTradition ?? undefined,
      hobliId: state.step4?.hobliId ?? undefined,
      addressLine1: state.step4?.addressLine1 ?? '',
      pincode: state.step4?.pincode ?? '',
      gpsLatitude: state.step4?.gpsLatitude ?? null,
      gpsLongitude: state.step4?.gpsLongitude ?? null,
    },
    mode: 'onBlur',
  })

  const handleGeoChange = (sel: GeoSelection) => {
    setGeoSelection(sel)
    if (sel.hobliId) {
      form.setValue('hobliId', sel.hobliId, { shouldValidate: true })
    }
  }

  const handleGpsDetect = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.')
      return
    }
    setIsDetectingGps(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6))
        const lon = parseFloat(position.coords.longitude.toFixed(6))
        form.setValue('gpsLatitude', lat, { shouldDirty: true })
        form.setValue('gpsLongitude', lon, { shouldDirty: true })
        if (isOutsideIndia(lat, lon)) {
          setGpsWarning('Detected coordinates appear to be outside India. Please verify.')
        } else {
          setGpsWarning(null)
          toast.success('GPS location detected.')
        }
        setIsDetectingGps(false)
      },
      (_err) => {
        toast.error('Could not detect location. Please enter coordinates manually.')
        setIsDetectingGps(false)
      },
      { timeout: 10000, maximumAge: 60000 },
    )
  }

  const watchLat = form.watch('gpsLatitude')
  const watchLon = form.watch('gpsLongitude')
  useEffect(() => {
    if (watchLat != null && watchLon != null && watchLat !== 0 && watchLon !== 0) {
      if (isOutsideIndia(watchLat, watchLon)) {
        setGpsWarning('These coordinates appear to be outside India. Please verify before submitting.')
      } else {
        setGpsWarning(null)
      }
    }
  }, [watchLat, watchLon])

  const onSubmit = (values: Step4Data) => {
    saveStep4(values)
    nextStep()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold font-display">Temple Details</h2>
        <p className="text-sm text-muted-foreground">
          Provide information about the temple you are registering as authority for.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>

          {/* Section: Temple Identity */}
          <fieldset className="space-y-4 rounded-lg border border-border p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Temple Identity
            </legend>

            <FormField
              control={form.control}
              name="templeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temple Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Sri Chamundeshwari Temple" autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aliasName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alias / Local Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Optional alternate name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deityName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Deity *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Chamundeshwari Devi" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temple Grade *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TEMPLE_GRADE_OPTIONS.map((g) => (
                          <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="religiousTradition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Religious Tradition *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tradition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TRADITION_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>{TRADITION_LABELS[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </fieldset>

          {/* Section: Location */}
          <fieldset className="space-y-4 rounded-lg border border-border p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Location
            </legend>

            <div>
              <p className="text-xs text-muted-foreground mb-3">
                Select the administrative hierarchy for the temple's location.
              </p>
              <GeoHierarchySelect value={geoSelection} onChange={handleGeoChange} />
              {form.formState.errors.hobliId && (
                <p className="mt-1.5 text-sm text-destructive">
                  {form.formState.errors.hobliId.message}
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1 *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Door No., Street Name, Village/Town" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PIN Code *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="560001"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </fieldset>

          {/* Section: GPS Coordinates (optional) */}
          <fieldset className="space-y-4 rounded-lg border border-border p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              GPS Coordinates <span className="normal-case font-normal">(Optional)</span>
            </legend>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Helps locate this temple on the map.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGpsDetect}
                disabled={isDetectingGps}
                className="flex items-center gap-1.5 text-xs"
              >
                <Navigation className="h-3.5 w-3.5" />
                {isDetectingGps ? 'Detecting…' : 'Auto-detect'}
              </Button>
            </div>

            {gpsWarning && (
              <div className="flex items-start gap-2 rounded-md bg-warning/10 border border-warning/30 px-3 py-2">
                <span className="text-warning-foreground text-xs mt-0.5">⚠</span>
                <p className="text-xs text-warning-foreground">{gpsWarning}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gpsLatitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          type="number"
                          step="any"
                          placeholder="e.g. 12.3456"
                          className="pl-8"
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gpsLongitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          type="number"
                          step="any"
                          placeholder="e.g. 76.6543"
                          className="pl-8"
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </fieldset>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={prevStep} className="w-1/3">
              ← Back
            </Button>
            <Button type="submit" className="flex-1">
              Continue →
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
