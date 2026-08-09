import type { Candle } from './types'

export interface LinePoint {
  time: number
  value: number
}

export interface HistPoint {
  time: number
  value: number
  color?: string
}

export interface BollingerResult {
  middle: LinePoint[]
  upper: LinePoint[]
  lower: LinePoint[]
}

export interface MacdResult {
  macd: LinePoint[]
  signal: LinePoint[]
  histogram: HistPoint[]
}

function closesOf(candles: Candle[]): number[] {
  return candles.map((c) => c.close)
}

export function smaSeries(
  candles: Candle[],
  period: number,
): LinePoint[] {
  const closes = closesOf(candles)
  const out: LinePoint[] = []
  let sum = 0
  for (let i = 0; i < closes.length; i++) {
    sum += closes[i]
    if (i >= period) sum -= closes[i - period]
    if (i >= period - 1) {
      out.push({ time: candles[i].time, value: sum / period })
    }
  }
  return out
}

export function emaArray(values: number[], period: number): Array<number | null> {
  const out: Array<number | null> = Array(values.length).fill(null)
  if (values.length < period) return out

  const k = 2 / (period + 1)
  let sum = 0
  for (let i = 0; i < period; i++) sum += values[i]
  let prev = sum / period
  out[period - 1] = prev

  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k)
    out[i] = prev
  }
  return out
}

export function bollingerBands(
  candles: Candle[],
  period = 20,
  mult = 2,
): BollingerResult {
  const closes = closesOf(candles)
  const middle: LinePoint[] = []
  const upper: LinePoint[] = []
  const lower: LinePoint[] = []

  for (let i = period - 1; i < closes.length; i++) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += closes[j]
    const mean = sum / period
    let variance = 0
    for (let j = i - period + 1; j <= i; j++) {
      const d = closes[j] - mean
      variance += d * d
    }
    const std = Math.sqrt(variance / period)
    const t = candles[i].time
    middle.push({ time: t, value: mean })
    upper.push({ time: t, value: mean + mult * std })
    lower.push({ time: t, value: mean - mult * std })
  }

  return { middle, upper, lower }
}

/** Wilder RSI */
export function rsiSeries(candles: Candle[], period = 14): LinePoint[] {
  const closes = closesOf(candles)
  if (closes.length <= period) return []

  const out: LinePoint[] = []
  let avgGain = 0
  let avgLoss = 0

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1]
    if (change >= 0) avgGain += change
    else avgLoss -= change
  }
  avgGain /= period
  avgLoss /= period

  const firstRs = avgLoss === 0 ? 100 : avgGain / avgLoss
  out.push({
    time: candles[period].time,
    value: avgLoss === 0 ? 100 : 100 - 100 / (1 + firstRs),
  })

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1]
    const gain = change > 0 ? change : 0
    const loss = change < 0 ? -change : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    out.push({
      time: candles[i].time,
      value: avgLoss === 0 ? 100 : 100 - 100 / (1 + rs),
    })
  }

  return out
}

export function macdSeries(
  candles: Candle[],
  fast = 12,
  slow = 26,
  signalPeriod = 9,
): MacdResult {
  const closes = closesOf(candles)
  const fastEma = emaArray(closes, fast)
  const slowEma = emaArray(closes, slow)

  const macdRaw: Array<number | null> = closes.map((_, i) => {
    if (fastEma[i] == null || slowEma[i] == null) return null
    return (fastEma[i] as number) - (slowEma[i] as number)
  })

  // EMA of MACD line — seed from first non-null streak
  const macdValues: number[] = []
  const macdIndex: number[] = []
  for (let i = 0; i < macdRaw.length; i++) {
    if (macdRaw[i] != null) {
      macdValues.push(macdRaw[i] as number)
      macdIndex.push(i)
    }
  }

  const signalEma = emaArray(macdValues, signalPeriod)
  const macd: LinePoint[] = []
  const signal: LinePoint[] = []
  const histogram: HistPoint[] = []

  for (let j = 0; j < macdValues.length; j++) {
    const i = macdIndex[j]
    const m = macdValues[j]
    macd.push({ time: candles[i].time, value: m })
    const s = signalEma[j]
    if (s != null) {
      signal.push({ time: candles[i].time, value: s })
      const h = m - s
      histogram.push({
        time: candles[i].time,
        value: h,
        color:
          h >= 0 ? 'rgba(38, 166, 154, 0.65)' : 'rgba(239, 83, 80, 0.65)',
      })
    }
  }

  return { macd, signal, histogram }
}
