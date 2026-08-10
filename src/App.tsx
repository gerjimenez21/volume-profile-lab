import { useCallback, useEffect, useState } from 'react'
import { ChartBarIcon } from '@heroicons/react/24/outline'
import { ChartLegend } from './components/ChartLegend'
import { DrawingEditor } from './components/DrawingEditor'
import { DrawingToolbar } from './components/DrawingToolbar'
import { IndicatorEditorDrawer } from './components/IndicatorEditorDrawer'
import { IndicatorsBrowserDrawer } from './components/IndicatorsBrowserDrawer'
import { PriceChart, type ProfileMode } from './components/PriceChart'
import { SymbolPicker } from './components/SymbolPicker'
import type { IndicatorId } from './lib/indicatorCatalog'
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
import {
  formatClock,
  getTimeZoneMeta,
  loadTimeZone,
  saveTimeZone,
  TIMEZONES,
} from './lib/timezones'
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
  const [hiddenIndicators, setHiddenIndicators] = useState<
    Partial<Record<IndicatorId, boolean>>
  >({})
  const [settings, setSettings] = useState<IndicatorSettings>(() =>
    loadIndicatorSettings(),
  )
  const [browserOpen, setBrowserOpen] = useState(false)
  const [editingId, setEditingId] = useState<IndicatorId | null>(null)
  const [selectedIndicatorId, setSelectedIndicatorId] =
    useState<IndicatorId | null>(null)

  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites())
  const [drawTool, setDrawTool] = useState<DrawingTool>('cursor')
  const [drawColor, setDrawColor] = useState('#f5d76e')
  const [drawings, setDrawings] = useState<Drawing[]>(() =>
    loadDrawings('GGAL.BA'),
  )
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(
    null,
  )
  const [timeZone, setTimeZone] = useState(() => loadTimeZone())
  const [clock, setClock] = useState(() => formatClock(loadTimeZone()))

  useEffect(() => {
    saveTimeZone(timeZone)
    setClock(formatClock(timeZone))
    const id = window.setInterval(() => setClock(formatClock(timeZone)), 1000)
    return () => window.clearInterval(id)
  }, [timeZone])

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

  const setIndicator = (id: IndicatorId, value: boolean) => {
    setIndicators((prev) => ({ ...prev, [id]: value }))
    if (value) {
      setHiddenIndicators((prev) => ({ ...prev, [id]: false }))
    }
  }

  const toggleIndicator = (id: IndicatorId) => {
    setIndicator(id, !indicators[id])
  }

  const removeIndicator = (id: IndicatorId) => {
    setIndicator(id, false)
    setHiddenIndicators((prev) => ({ ...prev, [id]: false }))
    if (editingId === id) setEditingId(null)
    if (selectedIndicatorId === id) setSelectedIndicatorId(null)
  }

  const openEditor = (id: IndicatorId) => {
    setBrowserOpen(false)
    setSelectedIndicatorId(id)
    setSelectedDrawingId(null)
    setEditingId(id)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return
      }
      if (e.key === 'Escape') {
        setSelectedIndicatorId(null)
        return
      }
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedIndicatorId &&
        !selectedDrawingId
      ) {
        e.preventDefault()
        removeIndicator(selectedIndicatorId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedIndicatorId, selectedDrawingId])

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
          <label className="tz-picker" title="Huso horario del gráfico">
            <span>Huso</span>
            <select
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              aria-label="Huso horario"
            >
              {TIMEZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.label}
                </option>
              ))}
            </select>
            <em className="tz-clock">
              {clock} · {getTimeZoneMeta(timeZone).short}
            </em>
          </label>
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
            className="settings-btn indicators-launch"
            onClick={() => {
              setEditingId(null)
              setBrowserOpen(true)
            }}
          >
            <ChartBarIcon />
            Indicadores
          </button>
        </div>
      </section>

      {indicators.volumeProfile && !hiddenIndicators.volumeProfile && (
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
          <ChartLegend
            flags={indicators}
            hidden={hiddenIndicators}
            settings={settings}
            selectedId={selectedIndicatorId}
            onSelect={(id) => {
              setSelectedDrawingId(null)
              setSelectedIndicatorId(id)
            }}
            onToggleHidden={(id) =>
              setHiddenIndicators((prev) => ({
                ...prev,
                [id]: !prev[id],
              }))
            }
            onEdit={openEditor}
            onRemove={removeIndicator}
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
              hiddenIndicators={hiddenIndicators}
              settings={settings}
              drawTool={drawTool}
              drawColor={drawColor}
              drawings={drawings}
              selectedDrawingId={selectedDrawingId}
              onDrawingsChange={handleDrawingsChange}
              onSelectDrawing={(id) => {
                setSelectedDrawingId(id)
                if (id) setSelectedIndicatorId(null)
              }}
              selectedIndicatorId={selectedIndicatorId}
              onSelectIndicator={setSelectedIndicatorId}
              onEditIndicator={openEditor}
              timeZone={timeZone}
            />
          )}
          {!error && !loading && candles.length === 0 && (
            <div className="banner">Sin datos</div>
          )}
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
        </div>
      </main>

      <IndicatorsBrowserDrawer
        open={browserOpen}
        onClose={() => setBrowserOpen(false)}
        flags={indicators}
        onToggle={toggleIndicator}
        onOpenSettings={(id) => {
          setIndicator(id, true)
          openEditor(id)
        }}
      />

      <IndicatorEditorDrawer
        open={Boolean(editingId)}
        indicatorId={editingId}
        flags={indicators}
        settings={settings}
        onClose={() => setEditingId(null)}
        onChange={setSettings}
        onToggle={toggleIndicator}
        onRemove={removeIndicator}
      />

      <footer className="footnote">
        Menús de indicadores al estilo TradingView (drawers). Leyenda con ojo /
        engranaje / quitar. Charts:{' '}
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
