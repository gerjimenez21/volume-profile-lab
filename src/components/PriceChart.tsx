import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts'
import type { Drawing, DrawingTool } from '../lib/drawings'
import type { IndicatorFlags, IndicatorSettings } from '../lib/indicatorTypes'
import { bollingerBands, macdSeries, rsiSeries } from '../lib/indicators'
import type { Candle, VolumeProfileResult } from '../lib/types'
import { computeVolumeProfile } from '../lib/volumeProfile'
import { DrawingOverlay } from './DrawingOverlay'
import { PaneLabels } from './PaneLabels'
import { VolumeProfileOverlay } from './VolumeProfileOverlay'

export type ProfileMode = 'visible' | 'all'

interface Props {
  candles: Candle[]
  rowCount: number
  profileMode: ProfileMode
  showValueArea: boolean
  showDelta: boolean
  profileWidthPct: number
  indicators: IndicatorFlags
  settings: IndicatorSettings
  drawTool: DrawingTool
  drawColor: string
  drawings: Drawing[]
  selectedDrawingId: string | null
  onDrawingsChange: (next: Drawing[]) => void
  onSelectDrawing: (id: string | null) => void
}

type SeriesBag = {
  candle: ISeriesApi<'Candlestick'>
  volume: ISeriesApi<'Histogram'>
  bbMid: ISeriesApi<'Line'>
  bbUpper: ISeriesApi<'Line'>
  bbLower: ISeriesApi<'Line'>
  rsi: ISeriesApi<'Line'>
  macdLine: ISeriesApi<'Line'>
  macdSignal: ISeriesApi<'Line'>
  macdHist: ISeriesApi<'Histogram'>
}

function toLineData(points: { time: number; value: number }[]) {
  return points.map((p) => ({
    time: p.time as UTCTimestamp,
    value: p.value,
  }))
}

export function PriceChart({
  candles,
  rowCount,
  profileMode,
  showValueArea,
  showDelta,
  profileWidthPct,
  indicators,
  settings,
  drawTool,
  drawColor,
  drawings,
  selectedDrawingId,
  onDrawingsChange,
  onSelectDrawing,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<SeriesBag | null>(null)
  const rsiLinesRef = useRef<IPriceLine[]>([])
  const candlesRef = useRef(candles)
  candlesRef.current = candles

  const [chart, setChart] = useState<IChartApi | null>(null)
  const [candleSeries, setCandleSeries] =
    useState<ISeriesApi<'Candlestick'> | null>(null)
  const [visibleSlice, setVisibleSlice] = useState<Candle[]>(candles)

  useEffect(() => {
    if (!containerRef.current) return

    const chartApi = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#d1d4dc',
        fontFamily: 'IBM Plex Sans, ui-sans-serif, system-ui, sans-serif',
        attributionLogo: false,
        panes: {
          separatorColor: '#000000',
          separatorHoverColor: 'rgba(61, 139, 253, 0.55)',
          enableResize: true,
        },
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.45)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.45)' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(224, 227, 235, 0.25)', width: 1 },
        horzLine: { color: 'rgba(224, 227, 235, 0.25)', width: 1 },
      },
      rightPriceScale: {
        borderColor: 'rgba(42, 46, 57, 0.8)',
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      timeScale: {
        borderColor: 'rgba(42, 46, 57, 0.8)',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    const candle = chartApi.addSeries(CandlestickSeries, {
      upColor: '#089981',
      downColor: '#f23645',
      borderVisible: false,
      wickUpColor: '#089981',
      wickDownColor: '#f23645',
    })

    const bbUpper = chartApi.addSeries(LineSeries, {
      color: '#2196f3',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })
    const bbMid = chartApi.addSeries(LineSeries, {
      color: '#ffc107',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })
    const bbLower = chartApi.addSeries(LineSeries, {
      color: '#2196f3',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    const volume = chartApi.addSeries(
      HistogramSeries,
      {
        priceFormat: { type: 'volume' },
        priceLineVisible: false,
        lastValueVisible: false,
      },
      1,
    )

    const rsi = chartApi.addSeries(
      LineSeries,
      {
        color: '#ab47bc',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        autoscaleInfoProvider: () => ({
          priceRange: { minValue: 0, maxValue: 100 },
        }),
      },
      2,
    )

    const macdHist = chartApi.addSeries(
      HistogramSeries,
      {
        priceLineVisible: false,
        lastValueVisible: false,
      },
      3,
    )
    const macdLine = chartApi.addSeries(
      LineSeries,
      {
        color: '#42a5f5',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      },
      3,
    )
    const macdSignal = chartApi.addSeries(
      LineSeries,
      {
        color: '#ff7043',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      },
      3,
    )

    seriesRef.current = {
      candle,
      volume,
      bbMid,
      bbUpper,
      bbLower,
      rsi,
      macdLine,
      macdSignal,
      macdHist,
    }
    chartRef.current = chartApi
    setChart(chartApi)
    setCandleSeries(candle)

    // Investing-like proportions: big price pane, roomy oscillators.
    const panes = chartApi.panes()
    panes[0]?.setStretchFactor(3.2)
    panes[1]?.setStretchFactor(1)
    panes[2]?.setStretchFactor(1.15)
    panes[3]?.setStretchFactor(1.25)

    const syncVisible = () => {
      const range = chartApi.timeScale().getVisibleLogicalRange()
      const all = candlesRef.current
      if (!range || all.length === 0) {
        setVisibleSlice(all)
        return
      }
      const from = Math.max(0, Math.floor(range.from))
      const to = Math.min(all.length - 1, Math.ceil(range.to))
      setVisibleSlice(all.slice(from, to + 1))
    }

    chartApi.timeScale().subscribeVisibleLogicalRangeChange(syncVisible)
    requestAnimationFrame(syncVisible)

    return () => {
      chartApi.timeScale().unsubscribeVisibleLogicalRangeChange(syncVisible)
      chartApi.remove()
      chartRef.current = null
      seriesRef.current = null
      rsiLinesRef.current = []
      setChart(null)
      setCandleSeries(null)
    }
  }, [])

  useEffect(() => {
    const chartApi = chartRef.current
    const s = seriesRef.current
    if (!chartApi || !s) return

    s.candle.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    )

    s.volume.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color:
          c.close >= c.open
            ? settings.volume.upColor
            : settings.volume.downColor,
      })),
    )

    const bb = bollingerBands(
      candles,
      settings.bollinger.period,
      settings.bollinger.mult,
    )
    s.bbMid.setData(toLineData(bb.middle))
    s.bbUpper.setData(toLineData(bb.upper))
    s.bbLower.setData(toLineData(bb.lower))

    s.rsi.setData(toLineData(rsiSeries(candles, settings.rsi.period)))

    const macd = macdSeries(
      candles,
      settings.macd.fast,
      settings.macd.slow,
      settings.macd.signal,
    )
    s.macdLine.setData(toLineData(macd.macd))
    s.macdSignal.setData(toLineData(macd.signal))
    s.macdHist.setData(
      macd.histogram.map((p) => ({
        time: p.time as UTCTimestamp,
        value: p.value,
        color:
          p.value >= 0
            ? settings.macd.histUpColor
            : settings.macd.histDownColor,
      })),
    )

    setVisibleSlice(candles)
  }, [candles, settings])

  useEffect(() => {
    const chartApi = chartRef.current
    if (!chartApi || candles.length === 0) return
    chartApi.timeScale().fitContent()
  }, [candles])

  useEffect(() => {
    const s = seriesRef.current
    if (!s) return

    s.bbUpper.applyOptions({
      color: settings.bollinger.upperColor,
      lineWidth: settings.bollinger.lineWidth,
      visible: indicators.bollinger,
    })
    s.bbMid.applyOptions({
      color: settings.bollinger.midColor,
      lineWidth: settings.bollinger.lineWidth,
      visible: indicators.bollinger,
    })
    s.bbLower.applyOptions({
      color: settings.bollinger.lowerColor,
      lineWidth: settings.bollinger.lineWidth,
      visible: indicators.bollinger,
    })

    s.volume.applyOptions({ visible: indicators.volume })
    s.rsi.applyOptions({
      visible: indicators.rsi,
      color: settings.rsi.color,
      lineWidth: settings.rsi.lineWidth,
    })
    s.macdLine.applyOptions({
      visible: indicators.macd,
      color: settings.macd.macdColor,
      lineWidth: settings.macd.lineWidth,
    })
    s.macdSignal.applyOptions({
      visible: indicators.macd,
      color: settings.macd.signalColor,
      lineWidth: settings.macd.lineWidth,
    })
    s.macdHist.applyOptions({ visible: indicators.macd })

    for (const line of rsiLinesRef.current) s.rsi.removePriceLine(line)
    rsiLinesRef.current = []
    if (indicators.rsi) {
      rsiLinesRef.current = [
        s.rsi.createPriceLine({
          price: settings.rsi.overbought,
          color: 'rgba(239, 83, 80, 0.55)',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: '',
        }),
        s.rsi.createPriceLine({
          price: settings.rsi.oversold,
          color: 'rgba(38, 166, 154, 0.55)',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: '',
        }),
        s.rsi.createPriceLine({
          price: 50,
          color: 'rgba(120, 123, 134, 0.4)',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: false,
          title: '',
        }),
      ]
    }

    const chartApi = chartRef.current
    if (!chartApi) return
    const panes = chartApi.panes()
    panes[0]?.setStretchFactor(3.2)
    panes[1]?.setStretchFactor(indicators.volume ? 1 : 0.0001)
    panes[2]?.setStretchFactor(indicators.rsi ? 1.15 : 0.0001)
    panes[3]?.setStretchFactor(indicators.macd ? 1.25 : 0.0001)
    if (panes[1]) panes[1].setHeight(indicators.volume ? 130 : 0)
    if (panes[2]) panes[2].setHeight(indicators.rsi ? 140 : 0)
    if (panes[3]) panes[3].setHeight(indicators.macd ? 150 : 0)
  }, [indicators, settings])

  const profile: VolumeProfileResult | null = useMemo(() => {
    if (!indicators.volumeProfile) return null
    const source = profileMode === 'visible' ? visibleSlice : candles
    return computeVolumeProfile(source, { rowCount, valueAreaPct: 0.7 })
  }, [
    candles,
    visibleSlice,
    profileMode,
    rowCount,
    indicators.volumeProfile,
  ])

  return (
    <div className="chart-shell">
      <div ref={containerRef} className="chart-canvas" />
      <PaneLabels chart={chart} flags={indicators} settings={settings} />
      <VolumeProfileOverlay
        chart={chart}
        series={candleSeries}
        profile={profile}
        widthPct={profileWidthPct}
        showValueArea={showValueArea}
        showDelta={showDelta}
        enabled={indicators.volumeProfile}
        buyColor={settings.volumeProfile.buyColor}
        sellColor={settings.volumeProfile.sellColor}
        pocColor={settings.volumeProfile.pocColor}
      />
      <DrawingOverlay
        chart={chart}
        series={candleSeries}
        tool={drawTool}
        color={drawColor}
        drawings={drawings}
        selectedId={selectedDrawingId}
        onChange={onDrawingsChange}
        onSelect={onSelectDrawing}
      />
    </div>
  )
}
