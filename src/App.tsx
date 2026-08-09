import { useCallback, useEffect, useState } from 'react'
import { DrawingEditor } from './components/DrawingEditor'
import { DrawingToolbar } from './components/DrawingToolbar'
import { IndicatorSettingsPanel } from './components/IndicatorSettingsPanel'
import { PriceChart, type ProfileMode } from './components/PriceChart'
import { SymbolPicker } from './components/SymbolPicker'
import {
  loadDrawings,
  removeDrawing,
  saveDrawings,
  updateDrawing,
  type Drawing,
  type DrawingTool,
} from './lib/drawings'
import {
  loadFavorites,
  saveFavorites,
  toggleFavorite,
} from './lib/favorites'
import { formatPrice } from './lib/format'
import {
  DEFAULT_INDICATORS,
  loadIndicatorSettings,
  saveIndicatorSettings,
  type IndicatorFlags,
  type IndicatorSettings,
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
  const [settings, setSettings] = useState<IndicatorSettings>(() =>
    loadIndicatorSettings(),
  )
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites())
  const [drawTool, setDrawTool] = useState<DrawingTool>('cursor')
  const [drawColor, setDrawColor] = useState('#f5d76e')
  const [drawings, setDrawings] = useState<Drawing[]>(() =>
    loadDrawings('GGAL.BA'),
  )
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(
    null,
  )

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

  useEffect(() => {
    setDrawings(loadDrawings(symbol))
    setSelectedDrawingId(null)
  }, [symbol])

  useEffect(() => {
    saveIndicatorSettings(settings)
  }, [settings])

  useEffect(() => {
    saveFavorites(favorites)
  }, [favorites])

  const handleDrawingsChange = (next: Drawing[]) => {
    setDrawings(next)
    saveDrawings(symbol, next)
    if (
      selectedDrawingId &&
      !next.some((d) => d.id === selectedDrawingId)
    ) {
      setSelectedDrawingId(null)
    }
  }

  const selectedDrawing =
    drawings.find((d) => d.id === selectedDrawingId) ?? null

  const toggleIndicator = (key: keyof IndicatorFlags) => {
    setIndicators((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const isFavorite = favorites.includes(symbol)
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

        <SymbolPicker value={symbol} loading={loading} onSelect={setSymbol} />
      </header>

      <section className="favorites-bar" aria-label="Favoritos">
        <span className="controls-label">Favoritos</span>
        {favorites.length === 0 && (
          <em className="fav-empty">Agregá activos con ★</em>
        )}
        {favorites.map((fav) => (
          <button
            key={fav}
            type="button"
            className={fav === symbol ? 'active' : undefined}
            onClick={() => setSymbol(fav)}
          >
            {fav.replace('.BA', '')}
          </button>
        ))}
      </section>

      <section className="toolbar">
        <div className="quote">
          <button
            type="button"
            className={`star-btn ${isFavorite ? 'on' : ''}`}
            title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            onClick={() => setFavorites((f) => toggleFavorite(f, symbol))}
          >
            {isFavorite ? '★' : '☆'}
          </button>
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

        <div className="toolbar-right">
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
          <button
            type="button"
            className="settings-btn"
            onClick={() => setSettingsOpen(true)}
          >
            Indicadores ⚙
          </button>
        </div>
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

      <main className="workspace">
        <DrawingToolbar
          tool={drawTool}
          onChange={(tool) => {
            setDrawTool(tool)
            if (tool !== 'cursor') setSelectedDrawingId(null)
          }}
          onClearAll={() => {
            handleDrawingsChange([])
            setSelectedDrawingId(null)
          }}
          onDeleteSelected={() => {
            if (!selectedDrawingId) return
            handleDrawingsChange(removeDrawing(drawings, selectedDrawingId))
            setSelectedDrawingId(null)
          }}
          hasSelection={Boolean(selectedDrawingId)}
          drawColor={drawColor}
          onColorChange={setDrawColor}
        />

        <div className="stage">
          <DrawingEditor
            drawing={selectedDrawing}
            onPatch={(id, patch) =>
              handleDrawingsChange(updateDrawing(drawings, id, patch))
            }
            onDelete={(id) => {
              handleDrawingsChange(removeDrawing(drawings, id))
              setSelectedDrawingId(null)
            }}
            onDeselect={() => setSelectedDrawingId(null)}
          />
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
              settings={settings}
              drawTool={drawTool}
              drawColor={drawColor}
              drawings={drawings}
              selectedDrawingId={selectedDrawingId}
              onDrawingsChange={handleDrawingsChange}
              onSelectDrawing={setSelectedDrawingId}
            />
          )}
          {!error && !loading && candles.length === 0 && (
            <div className="banner">Sin datos</div>
          )}
        </div>

        <IndicatorSettingsPanel
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          flags={indicators}
          settings={settings}
          onChange={setSettings}
          onToggle={toggleIndicator}
        />
      </main>

      <footer className="footnote">
        Paneles separados estilo Investing/TradingView. Dibujos e indicadores
        se guardan en este navegador. Favoritos con ★. Charts:{' '}
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noreferrer"
        >
          Lightweight Charts
        </a>
        .
      </footer>
    </div>
  )
}
