export interface IndicatorFlags {
  volumeProfile: boolean
  bollinger: boolean
  volume: boolean
  rsi: boolean
  macd: boolean
}

export const DEFAULT_INDICATORS: IndicatorFlags = {
  volumeProfile: true,
  bollinger: true,
  volume: true,
  rsi: true,
  macd: true,
}
