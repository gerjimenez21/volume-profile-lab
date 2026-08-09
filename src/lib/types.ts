export type Timeframe = '1m' | '5m' | '15m' | '1h' | '1d' | '1wk'

export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface VolumeProfileBin {
  priceLow: number
  priceHigh: number
  priceMid: number
  volume: number
  buyVolume: number
  sellVolume: number
}

export interface VolumeProfileResult {
  bins: VolumeProfileBin[]
  poc: number
  vah: number
  val: number
  totalVolume: number
  maxBinVolume: number
}

export interface ChartDataResponse {
  symbol: string
  candles: Candle[]
  currency?: string
  shortName?: string
}
