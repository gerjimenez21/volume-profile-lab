import type { IndicatorFlags } from './indicatorTypes'

export type IndicatorId = keyof IndicatorFlags

export interface IndicatorCatalogItem {
  id: IndicatorId
  name: string
  shortName: string
  category: 'tecnicos' | 'volumen' | 'osciladores'
  keywords: string[]
  description: string
}

export const INDICATOR_CATALOG: IndicatorCatalogItem[] = [
  {
    id: 'bollinger',
    name: 'Bandas de Bollinger',
    shortName: 'BB',
    category: 'tecnicos',
    keywords: ['bollinger', 'bb', 'bandas', 'volatilidad'],
    description: 'Bandas de volatilidad sobre una media móvil',
  },
  {
    id: 'volume',
    name: 'Volumen',
    shortName: 'Vol',
    category: 'volumen',
    keywords: ['volumen', 'volume', 'vol'],
    description: 'Histograma de volumen + promedio SMA al hover',
  },
  {
    id: 'volumeProfile',
    name: 'Perfil de volumen',
    shortName: 'VP',
    category: 'volumen',
    keywords: ['perfil', 'volume profile', 'vp', 'poc', 'vah', 'val'],
    description: 'Distribución de volumen por precio (POC / VA)',
  },
  {
    id: 'rsi',
    name: 'Índice de fuerza relativa',
    shortName: 'RSI',
    category: 'osciladores',
    keywords: ['rsi', 'fuerza relativa', 'relative strength'],
    description: 'Oscilador de momentum 0–100',
  },
  {
    id: 'macd',
    name: 'MACD',
    shortName: 'MACD',
    category: 'osciladores',
    keywords: ['macd', 'convergencia', 'divergencia', 'media móvil'],
    description: 'Convergencia/divergencia de medias móviles',
  },
]

export const CATEGORY_LABELS: Record<
  IndicatorCatalogItem['category'],
  string
> = {
  tecnicos: 'Datos técnicos',
  volumen: 'Volumen',
  osciladores: 'Osciladores',
}

export function searchIndicators(query: string): IndicatorCatalogItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return INDICATOR_CATALOG
  return INDICATOR_CATALOG.filter((item) => {
    const hay = [item.name, item.shortName, ...item.keywords]
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
}

export function getIndicatorMeta(id: IndicatorId): IndicatorCatalogItem {
  return INDICATOR_CATALOG.find((i) => i.id === id)!
}

export function formatIndicatorLegend(
  id: IndicatorId,
  settings: {
    bollinger: { period: number; mult: number }
    rsi: { period: number }
    macd: { fast: number; slow: number; signal: number }
  },
): string {
  switch (id) {
    case 'bollinger':
      return `BB (${settings.bollinger.period}, ${settings.bollinger.mult})`
    case 'volume':
      return 'Vol'
    case 'volumeProfile':
      return 'Vol Profile'
    case 'rsi':
      return `RSI (${settings.rsi.period})`
    case 'macd':
      return `MACD (${settings.macd.fast}, ${settings.macd.slow}, ${settings.macd.signal})`
  }
}
