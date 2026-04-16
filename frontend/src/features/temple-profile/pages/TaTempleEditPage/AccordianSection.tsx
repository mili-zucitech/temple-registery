// ── Collapsible section wrapper ────────────────────────────────────────────────

import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

interface AccordionSectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export function AccordionSection({ title, defaultOpen = true, children }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-3.5 border-b border-border hover:bg-muted/30 transition-colors"
      >
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="px-5 py-5 space-y-4">{children}</div>}
    </div>
  )
}