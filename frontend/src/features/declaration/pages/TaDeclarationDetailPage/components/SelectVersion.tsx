import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DeclarationVersionResponse } from '../../../declarationTypes'

interface SelectVersionProps {
  versions: DeclarationVersionResponse[]
  value?: number
  onChange: (value: number | undefined) => void
}

export function SelectVersion({ versions, value, onChange }: SelectVersionProps) {
  return (
    <Select
      value={value ? String(value) : 'current'}
      onValueChange={(next) => onChange(next === 'current' ? undefined : Number(next))}
    >
      <SelectTrigger>
        <SelectValue placeholder="Compare version" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="current">Current version</SelectItem>
        {versions.map((version) => (
          <SelectItem key={version.id} value={String(version.versionNumber)}>
            Version {version.versionNumber}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
