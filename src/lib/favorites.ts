const KEY = 'vplab.favorites'

const DEFAULT_FAVORITES = [
  'GGAL.BA',
  'YPFD.BA',
  'PAMP.BA',
  'TXAR.BA',
  'ALUA.BA',
  'BBAR.BA',
]

export function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_FAVORITES
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return DEFAULT_FAVORITES
    return parsed.filter((x): x is string => typeof x === 'string')
  } catch {
    return DEFAULT_FAVORITES
  }
}

export function saveFavorites(symbols: string[]) {
  localStorage.setItem(KEY, JSON.stringify(symbols))
}

export function toggleFavorite(
  favorites: string[],
  symbol: string,
): string[] {
  const normalized = symbol.toUpperCase()
  if (favorites.includes(normalized)) {
    return favorites.filter((s) => s !== normalized)
  }
  return [...favorites, normalized]
}
