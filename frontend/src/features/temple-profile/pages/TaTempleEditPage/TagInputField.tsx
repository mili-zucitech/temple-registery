
// ── TagInputField ──────────────────────────────────────────────────────────────
// Lightweight inline tag-chip input: stores value as comma-separated string

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface TagInputFieldProps {
  value: string | string[] | null
  onChange: (v: string) => void
  placeholder?: string
}

export function TagInputField({ value, onChange, placeholder }: TagInputFieldProps) {
  const [draft, setDraft] = useState('')
  const tags = Array.isArray(value)
    ? value.filter(Boolean)
    : value
    ? value.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  const addTag = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    if (!tags.includes(trimmed)) {
      onChange([...tags, trimmed].join(', '))
    }
    setDraft('')
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag).join(', '))
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              addTag()
            }
          }}
          placeholder={placeholder ?? 'Type and press Enter'}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={addTag}>
          Add
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs font-medium text-foreground"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-muted-foreground hover:text-destructive transition-colors ml-0.5 text-xs"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}