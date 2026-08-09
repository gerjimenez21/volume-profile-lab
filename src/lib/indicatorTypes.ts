export interface IndicatorFlags {
  volumeProfile: boolean
  bollinger: boolean
  volume: boolean
  rsi: boolean
  macd: boolean
}

export interface IndicatorSettings {
  bollinger: {
    period: number
    mult: number
    upperColor: string
    midColor: string
    lowerColor: string
    lineWidth: 1 | 2 | 3 | 4
  }
  volume: {
    upColor: string
    downColor: string
  }
  rsi: {
    period: number
    color: string
    lineWidth: 1 | 2 | 3 | 4
    overbought: number
    oversold: number
  }
  macd: {
    fast: number
    slow: number
    signal: number
    macdColor: string
    signalColor: string
    histUpColor: string
    histDownColor: string
    lineWidth: 1 | 2 | 3 | 4
  }
  volumeProfile: {
    buyColor: string
    sellColor: string
    pocColor: string
  }
}

export const DEFAULT_INDICATORS: IndicatorFlags = {
  volumeProfile: true,
  bollinger: true,
  volume: true,
  rsi: true,
  macd: true,
}

export const DEFAULT_INDICATOR_SETTINGS: IndicatorSettings = {
  bollinger: {
    period: 20,
    mult: 2,
    upperColor: '#2196f3',
    midColor: '#ffc107',
    lowerColor: '#2196f3',
    lineWidth: 1,
  },
  volume: {
    upColor: 'rgba(38, 166, 154, 0.55)',
    downColor: 'rgba(239, 83, 80, 0.55)',
  },
  rsi: {
    period: 14,
    color: '#ab47bc',
    lineWidth: 2,
    overbought: 70,
    oversold: 30,
  },
  macd: {
    fast: 12,
    slow: 26,
    signal: 9,
    macdColor: '#42a5f5',
    signalColor: '#ff7043',
    histUpColor: 'rgba(38, 166, 154, 0.7)',
    histDownColor: 'rgba(239, 83, 80, 0.7)',
    lineWidth: 1,
  },
  volumeProfile: {
    buyColor: 'rgba(38, 166, 154, 0.55)',
    sellColor: 'rgba(239, 83, 80, 0.55)',
    pocColor: 'rgba(255, 193, 7, 0.95)',
  },
}

const SETTINGS_KEY = 'vplab.indicatorSettings'

export function loadIndicatorSettings(): IndicatorSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_INDICATOR_SETTINGS
    return {
      ...DEFAULT_INDICATOR_SETTINGS,
      ...JSON.parse(raw),
      bollinger: {
        ...DEFAULT_INDICATOR_SETTINGS.bollinger,
        ...JSON.parse(raw).bollinger,
      },
      volume: {
        ...DEFAULT_INDICATOR_SETTINGS.volume,
        ...JSON.parse(raw).volume,
      },
      rsi: { ...DEFAULT_INDICATOR_SETTINGS.rsi, ...JSON.parse(raw).rsi },
      macd: { ...DEFAULT_INDICATOR_SETTINGS.macd, ...JSON.parse(raw).macd },
      volumeProfile: {
        ...DEFAULT_INDICATOR_SETTINGS.volumeProfile,
        ...JSON.parse(raw).volumeProfile,
      },
    }
  } catch {
    return DEFAULT_INDICATOR_SETTINGS
  }
}

export function saveIndicatorSettings(settings: IndicatorSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
