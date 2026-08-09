/**
 * Normaliza tickers para BYMA: GGAL → GGAL.BA.
 * Respeta sufijos ya presentes (.BA, .NYSE vía Yahoo, etc.).
 */
export function normalizeSymbol(raw: string, preferByma = true): string {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, '')
  if (!cleaned) return cleaned

  if (!preferByma) return cleaned

  // Already has an exchange / asset suffix Yahoo understands.
  if (
    cleaned.includes('.') ||
    cleaned.includes('=') ||
    cleaned.includes('-') ||
    cleaned.includes('^')
  ) {
    return cleaned
  }

  return `${cleaned}.BA`
}
