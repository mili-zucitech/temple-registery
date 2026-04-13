import { useGeoHierarchy } from '../../geoHooks'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import type { GeoSelection } from '../../geoTypes'

interface GeoHierarchySelectProps {
  value: GeoSelection
  onChange: (selection: GeoSelection) => void
  disabled?: boolean
}

export function GeoHierarchySelect({ value, onChange, disabled }: GeoHierarchySelectProps) {
  // Hook returns { states: { data, isLoading }, cities: { data, isLoading }, ... }
  const { states, cities, districts, taluks, hoblis } = useGeoHierarchy(value)

  const handleChange = (level: keyof GeoSelection, id: string) => {
    const numericId = Number(id)
    // Clear all child levels when a parent changes
    const updated: GeoSelection = { ...value }
    switch (level) {
      case 'stateId':
        updated.stateId = numericId
        delete updated.cityId
        delete updated.districtId
        delete updated.talukId
        delete updated.hobliId
        break
      case 'cityId':
        updated.cityId = numericId
        delete updated.districtId
        delete updated.talukId
        delete updated.hobliId
        break
      case 'districtId':
        updated.districtId = numericId
        delete updated.talukId
        delete updated.hobliId
        break
      case 'talukId':
        updated.talukId = numericId
        delete updated.hobliId
        break
      case 'hobliId':
        updated.hobliId = numericId
        break
    }
    onChange(updated)
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">State</label>
        <Select
          disabled={disabled || states.isLoading}
          value={value.stateId?.toString() ?? ''}
          onValueChange={(v) => handleChange('stateId', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            {states.data.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">City</label>
        <Select
          disabled={disabled || !value.stateId || cities.isLoading}
          value={value.cityId?.toString() ?? ''}
          onValueChange={(v) => handleChange('cityId', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            {cities.data.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">District</label>
        <Select
          disabled={disabled || !value.cityId || districts.isLoading}
          value={value.districtId?.toString() ?? ''}
          onValueChange={(v) => handleChange('districtId', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="District" />
          </SelectTrigger>
          <SelectContent>
            {districts.data.map((d) => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Taluk</label>
        <Select
          disabled={disabled || !value.districtId || taluks.isLoading}
          value={value.talukId?.toString() ?? ''}
          onValueChange={(v) => handleChange('talukId', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Taluk" />
          </SelectTrigger>
          <SelectContent>
            {taluks.data.map((t) => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Hobli</label>
        <Select
          disabled={disabled || !value.talukId || hoblis.isLoading}
          value={value.hobliId?.toString() ?? ''}
          onValueChange={(v) => handleChange('hobliId', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Hobli" />
          </SelectTrigger>
          <SelectContent>
            {hoblis.data.map((h) => <SelectItem key={h.id} value={h.id.toString()}>{h.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
