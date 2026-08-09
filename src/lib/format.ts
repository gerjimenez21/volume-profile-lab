export function formatPrice(value: number, currency?: string): string {
  const fractionDigits = value >= 1000 ? 2 : value >= 1 ? 2 : 4
  try {
    return new Intl.NumberFormat('es-CL', {
      style: currency ? 'currency' : 'decimal',
      currency: currency || 'USD',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value)
  } catch {
    return value.toFixed(fractionDigits)
  }
}

export function formatVolume(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return Math.round(value).toString()
}
