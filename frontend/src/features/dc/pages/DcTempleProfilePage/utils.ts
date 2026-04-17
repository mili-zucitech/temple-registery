export function formatCurrency(value?: number | null): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  }).format(value)
}

export function formatList(value?: string | null): string {
  if (!value) return '—'
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.filter(Boolean).join(', ') || '—'
    }
  } catch (e) {
    // Not a JSON string, return as is
  }
  return value
}
