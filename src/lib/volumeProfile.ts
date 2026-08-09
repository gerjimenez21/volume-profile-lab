import type { Candle, VolumeProfileBin, VolumeProfileResult } from './types'

export interface VolumeProfileOptions {
  /** Number of price rows in the histogram */
  rowCount?: number
  /** Share of total volume that defines the value area (default 0.7) */
  valueAreaPct?: number
}

/**
 * Builds a Volume Profile from OHLCV bars.
 *
 * Free data rarely includes true tick prints, so each bar's volume is
 * distributed across the price levels it traded through (high→low),
 * with a light bias toward the close (common retail approximation).
 */
export function computeVolumeProfile(
  candles: Candle[],
  options: VolumeProfileOptions = {},
): VolumeProfileResult | null {
  const rowCount = Math.max(10, options.rowCount ?? 50)
  const valueAreaPct = options.valueAreaPct ?? 0.7

  if (candles.length === 0) return null

  let minPrice = Infinity
  let maxPrice = -Infinity
  for (const c of candles) {
    minPrice = Math.min(minPrice, c.low)
    maxPrice = Math.max(maxPrice, c.high)
  }

  if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice) || maxPrice <= minPrice) {
    return null
  }

  // Tiny padding so edge prints don't collapse into one bin.
  const pad = (maxPrice - minPrice) * 0.001
  minPrice -= pad
  maxPrice += pad

  const step = (maxPrice - minPrice) / rowCount
  const bins: VolumeProfileBin[] = Array.from({ length: rowCount }, (_, i) => {
    const priceLow = minPrice + i * step
    const priceHigh = priceLow + step
    return {
      priceLow,
      priceHigh,
      priceMid: (priceLow + priceHigh) / 2,
      volume: 0,
      buyVolume: 0,
      sellVolume: 0,
    }
  })

  for (const candle of candles) {
    const { high, low, close, open, volume } = candle
    if (volume <= 0 || high <= low) {
      // Flat bar: dump all volume into the closest bin.
      const idx = clampIndex(Math.floor((close - minPrice) / step), rowCount)
      bins[idx].volume += volume
      if (close >= open) bins[idx].buyVolume += volume
      else bins[idx].sellVolume += volume
      continue
    }

    const first = clampIndex(Math.floor((low - minPrice) / step), rowCount)
    const last = clampIndex(Math.floor((high - minPrice) / step), rowCount)
    const span = last - first + 1

    // Weights: uniform across traded range + extra weight near close.
    const weights = new Array<number>(span).fill(1)
    const closeIdx = clampIndex(Math.floor((close - minPrice) / step), rowCount)
    const localClose = closeIdx - first
    if (localClose >= 0 && localClose < span) {
      weights[localClose] += 1.5
    }

    const weightSum = weights.reduce((a, b) => a + b, 0)
    const isBuy = close >= open

    for (let i = 0; i < span; i++) {
      const share = (volume * weights[i]) / weightSum
      const bin = bins[first + i]
      bin.volume += share
      if (isBuy) bin.buyVolume += share
      else bin.sellVolume += share
    }
  }

  let totalVolume = 0
  let maxBinVolume = 0
  let pocIndex = 0
  for (let i = 0; i < bins.length; i++) {
    totalVolume += bins[i].volume
    if (bins[i].volume > maxBinVolume) {
      maxBinVolume = bins[i].volume
      pocIndex = i
    }
  }

  if (totalVolume <= 0) return null

  // Expand value area from POC until we cover ~70% of volume.
  let lo = pocIndex
  let hi = pocIndex
  let covered = bins[pocIndex].volume
  const target = totalVolume * valueAreaPct

  while (covered < target && (lo > 0 || hi < bins.length - 1)) {
    const upVol = hi < bins.length - 1 ? bins[hi + 1].volume : -1
    const downVol = lo > 0 ? bins[lo - 1].volume : -1

    if (upVol >= downVol && hi < bins.length - 1) {
      hi += 1
      covered += bins[hi].volume
    } else if (lo > 0) {
      lo -= 1
      covered += bins[lo].volume
    } else if (hi < bins.length - 1) {
      hi += 1
      covered += bins[hi].volume
    } else {
      break
    }
  }

  return {
    bins,
    poc: bins[pocIndex].priceMid,
    vah: bins[hi].priceHigh,
    val: bins[lo].priceLow,
    totalVolume,
    maxBinVolume,
  }
}

function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(length - 1, index))
}
