import { useCallback, useEffect, useState } from 'react'
import { PriceChart, type ProfileMode } from './components/PriceChart'
import { SymbolPicker } from './components/SymbolPicker'
import { formatPrice } from './lib/format'
import {
  DEFAULT_INDICATORS,
  type IndicatorFlags,
} from './lib/indicatorTypes'
import type { Candle, Timeframe } from './lib/types'
import { fetchYahooChart } from './lib/yahoo'
import './App.css'

const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: '1m', label: '1m' },
  { id: '5m', label: '5m' },
  { id: '15m', label: '15m' },
  { id: '1h', label: '1H' },
  { id: '1d', label: '1D' },
  { id: '1wk', label: '1W' },
]

export default function App() {
  const [symbol, setSymbol] = useState('GGAL.BA')
  const [timeframe, setTimeframe] = useState<Timeframe>('1d')
  const [candles, setCandles] = useState<Candle[]>([])
  const [meta, setMeta] = useState<{ shortName?: string; currency?: string }>(
    {},
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [rowCount, setRowCount] = useState(48)
  const [profileMode, setProfileMode] = useState<ProfileMode>('visible')
  const [showValueArea, setShowValueArea] = useState(true)
  const [showDelta, setShowDelta] = useState(true)
  const [profileWidthPct, setProfileWidthPct] = useState(0.28)
  const [indicators, setIndicators] =
    useState<IndicatorFlags>(DEFAULT_INDICATORS)

  const load = useCallback(async (ticker: string, tf: Timeframe) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchYahooChart(ticker, tf)
      setCandles(data.candles)
      setSymbol(data.symbol)
      setMeta({ shortName: data.shortName, currency: data.currency })
    } catch (err) {
      setCandles([])
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(symbol, timeframe)
  }, [symbol, timeframe, load])

  const toggleIndicator = (key: keyof IndicatorFlags) => {
    setIndicators((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const last = candles[candles.length - 1]
  const prev = candles[candles.length - 2]
  const change =
    last && prev ? ((last.close - prev.close) / prev.close) * 100 : null

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">VP</span>
          <div>
            <h1>Volume Profile Lab</h1>
            <p>Acciones argentinas · indicadores sin paywall</p>
          </div>
        </div>

        <SymbolPicker
          value={symbol}
          loading={loading}
          onSelect={setSymbol}
        />
      </header>

      <section className="toolbar">
        <div className="quote">
          <strong>{symbol}</strong>
          {meta.shortName && <span>{meta.shortName}</span>}
          {last && (
            <span className="price">
              {formatPrice(last.close, meta.currency)}
              {change != null && (
                <em className={change >= 0 ? 'up' : 'down'}>
                  {change >= 0 ? '+' : ''}
                  {change.toFixed(2)}%
                </em>
              )}
            </span>
          )}
        </div>

        <div className="tf-group" role="group" aria-label="Timeframe">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              type="button"
              className={tf.id === timeframe ? 'active' : undefined}
              onClick={() => setTimeframe(tf.id)}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </section>

      <section className="controls indicators-row">
        <span className="controls-label">Indicadores</span>
        {(
          [
            ['volumeProfile', 'Vol. Profile'],
            ['bollinger', 'Bollinger'],
            ['volume', 'Volumen'],
            ['rsi', 'RSI'],
            ['macd', 'MACD'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="check">
            <input
              type="checkbox"
              checked={indicators[key]}
              onChange={() => toggleIndicator(key)}
            />
            {label}
          </label>
        ))}
      </section>

      {indicators.volumeProfile && (
        <section className="controls">
          <label>
            Modo perfil
            <select
              value={profileMode}
              onChange={(e) => setProfileMode(e.target.value as ProfileMode)}
            >
              <option value="visible">Rango visible (VPVR)</option>
              <option value="all">Todo el historial cargado</option>
            </select>
          </label>

          <label>
            Filas VP
            <input
              type="range"
              min={20}
              max={100}
              value={rowCount}
              onChange={(e) => setRowCount(Number(e.target.value))}
            />
            <span>{rowCount}</span>
          </label>

          <label>
            Ancho
            <input
              type="range"
              min={15}
              max={45}
              value={Math.round(profileWidthPct * 100)}
              onChange={(e) =>
                setProfileWidthPct(Number(e.target.value) / 100)
              }
            />
            <span>{Math.round(profileWidthPct * 100)}%</span>
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={showValueArea}
              onChange={(e) => setShowValueArea(e.target.checked)}
            />
            Value Area (70%)
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={showDelta}
              onChange={(e) => setShowDelta(e.target.checked)}
            />
            Delta compra/venta*
          </label>
        </section>
      )}

      <main className="stage">
        {error && <div className="banner error">{error}</div>}
        {!error && candles.length > 0 && (
          <PriceChart
            candles={candles}
            rowCount={rowCount}
            profileMode={profileMode}
            showValueArea={showValueArea}
            showDelta={showDelta}
            profileWidthPct={profileWidthPct}
            indicators={indicators}
          />
        )}
        {!error && !loading && candles.length === 0 && (
          <div className="banner">Sin datos</div>
        )}
      </main>

      <footer className="footnote">
        Mercado por defecto: BYMA (Yahoo <code>.BA</code>). Escribí{' '}
        <code>GGAL</code> y se carga como <code>GGAL.BA</code>. Bollinger
        (20,2), RSI (14), MACD (12,26,9). Volume Profile estimado desde OHLCV
        gratis — no es footprint tick-a-tick. Charts:{' '}
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noreferrer"
        >
          Lightweight Charts de TradingView
        </a>
        .
      </footer>
    </div>
  )
}
