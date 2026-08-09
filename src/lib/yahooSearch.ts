export interface SymbolSuggestion {
  symbol: string
  shortname?: string
  exchDisp?: string
  typeDisp?: string
}

interface YahooSearchResponse {
  quotes?: Array<{
    symbol?: string
    shortname?: string
    longname?: string
    exchDisp?: string
    typeDisp?: string
    quoteType?: string
    exchange?: string
  }>
}

/** Busca símbolos en Yahoo; prioriza resultados .BA si askByma. */
export async function searchSymbols(
  query: string,
  opts: { bymaOnly?: boolean } = {},
): Promise<SymbolSuggestion[]> {
  const q = query.trim()
  if (q.length < 1) return []

  const params = new URLSearchParams({
    q,
    quotesCount: '12',
    newsCount: '0',
    listsCount: '0',
  })
  const res = await fetch(`/api/yahoo/search?${params}`)
  if (!res.ok) return []

  const data = (await res.json()) as YahooSearchResponse
  let quotes = data.quotes ?? []

  if (opts.bymaOnly) {
    const ba = quotes.filter(
      (x) =>
        x.symbol?.endsWith('.BA') ||
        x.exchange === 'BUE' ||
        x.exchDisp?.toLowerCase().includes('buenos'),
    )
    if (ba.length > 0) quotes = ba
  }

  return quotes
    .filter((x) => x.symbol)
    .map((x) => ({
      symbol: x.symbol as string,
      shortname: x.shortname ?? x.longname,
      exchDisp: x.exchDisp,
      typeDisp: x.typeDisp ?? x.quoteType,
    }))
}
