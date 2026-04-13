import { MapPin } from 'lucide-react'

interface GpsMapProps {
  latitude: number
  longitude: number
  templeName: string
}

export function GpsMap({ latitude, longitude, templeName }: GpsMapProps) {
  const src = `https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`

  return (
    <iframe
      title={`Map — ${templeName}`}
      src={src}
      className="h-56 w-full rounded-xl border-0"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      style={{ height: '224px', borderRadius: '0.75rem' }}
    />
  )
}

export function GpsMapPlaceholder() {
  return (
    <div className="flex h-56 w-full flex-col items-center justify-center rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-dashed border-border/60 gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/80 shadow-sm">
        <MapPin size={22} className="text-muted-foreground/50" />
      </div>
      <div className="text-center px-4">
        <p className="text-xs font-medium text-muted-foreground">No GPS coordinates recorded</p>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5">Set coordinates during registration to view a map</p>
      </div>
    </div>
  )
}
