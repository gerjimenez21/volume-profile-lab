import type { Candle, ChartDataResponse, Timeframe } from './types'

const INTERVAL_RANGE: Record<
  Timeframe,
  { interval: string; range: string }
> = {
  '1m': { interval: '1m', range: '1d' },
  '5m': { interval: '5m', range: '5d' },
  '15m': { interval: '15m', range: '1mo' },
  '1h': { interval: '60m', range: '3mo' },
  '1d': { interval: '1d', range: '1y' },
  '1wk': { interval: '1wk', range: '5y' },
}

interface YahooChartResponse {
  chart: {
    result: Array<{
      meta: {
        symbol: string
        currency?: string
        shortName?: string
      }
      timestamp?: number[]
      indicators: {
        quote: Array<{
          open: Array<number | null>
          high: Array<number | null>
          low: Array<number | null>
          close: Array<number | null>
          volume: Array<number | null>
        }>
      }
    }> | null
    error: { description?: string } | null
  }
}

export async function fetchYahooChart(
  symbol: string,
  timeframe: Timeframe,
): Promise<ChartDataResponse> {
  const { interval, range } = INTERVAL_RANGE[timeframe]
  const ticker = encodeURIComponent(symbol.trim().toUpperCase())
  const url = `/api/yahoo/chart/${ticker}?interval=${interval}&range=${range}&includePrePost=false`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`No se pudo cargar ${symbol} (${res.status})`)
  }

  const data = (await res.json()) as YahooChartResponse
  if (data.chart.error || !data.chart.result?.[0]) {
    throw new Error(
      data.chart.error?.description ?? `Sin datos para ${symbol}`,
    )
  }

  const result = data.chart.result[0]
  const quote = result.indicators.quote[0]
  const timestamps = result.timestamp ?? []

  const candles: Candle[] = []
  for (let i = 0; i < timestamps.length; i++) {
    const open = quote.open[i]
    const high = quote.high[i]
    const low = quote.low[i]
    const close = quote.close[i]
    const volume = quote.volume[i]
    if (
      open == null ||
      high == null ||
      low == null ||
      close == null ||
      !Number.isFinite(open) ||
      !Number.isFinite(high) ||
      !Number.isFinite(low) ||
      !Number.isFinite(close)
    ) {
      continue
    }
    candles.push({
      time: timestamps[i],
      open,
      high,
      low,
      close,
      volume: Math.max(0, volume ?? 0),
    })
  }

  if (candles.length === 0) {
    throw new Error(`Sin velas válidas para ${symbol}`)
  }

  return {
    symbol: result.meta.symbol,
    candles,
    currency: result.meta.currency,
    shortName: result.meta.shortName,
  }
}
