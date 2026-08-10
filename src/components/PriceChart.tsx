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
  type TickMarkType,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts'
import type { Drawing, DrawingTool } from '../lib/drawings'
import type { IndicatorFlags, IndicatorSettings } from '../lib/indicatorTypes'
import type { IndicatorId } from '../lib/indicatorCatalog'
import {
  bollingerBands,
  macdSeries,
  rsiSeries,
  volumeSmaSeries,
} from '../lib/indicators'
import {
  formatCrosshairTime,
  formatTickMark,
} from '../lib/timezones'
import type { Candle, VolumeProfileResult } from '../lib/types'
import { computeVolumeProfile } from '../lib/volumeProfile'
import {
  BollingerFillOverlay,
  type BandPoint,
} from './BollingerFillOverlay'
import { DrawingOverlay } from './DrawingOverlay'
import { PaneLabels, type VolumeHoverInfo } from './PaneLabels'
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
  hiddenIndicators: Partial<Record<IndicatorId, boolean>>
  settings: IndicatorSettings
  drawTool: DrawingTool
  drawColor: string
  drawings: Drawing[]
  selectedDrawingId: string | null
  onDrawingsChange: (next: Drawing[]) => void
  onSelectDrawing: (id: string | null) => void
  selectedIndicatorId: IndicatorId | null
  onSelectIndicator: (id: IndicatorId | null) => void
  onEditIndicator: (id: IndicatorId) => void
  timeZone: string
}

type SeriesBag = {
  candle: ISeriesApi<'Candlestick'>
  volume: ISeriesApi<'Histogram'>
  volumeAvg: ISeriesApi<'Line'>
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
  hiddenIndicators,
  settings,
  drawTool,
  drawColor,
  drawings,
  selectedDrawingId,
  onDrawingsChange,
  onSelectDrawing,
  selectedIndicatorId,
  onSelectIndicator,
  onEditIndicator,
  timeZone,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<SeriesBag | null>(null)
  const rsiLinesRef = useRef<IPriceLine[]>([])
  const candlesRef = useRef(candles)
  const seriesToIndicatorRef = useRef<Map<object, IndicatorId>>(new Map())
  const drawToolRef = useRef(drawTool)
  const indicatorsRef = useRef(indicators)
  const hiddenRef = useRef(hiddenIndicators)
  const timeZoneRef = useRef(timeZone)
  const onSelectDrawingRef = useRef(onSelectDrawing)
  const onSelectIndicatorRef = useRef(onSelectIndicator)
  const onEditIndicatorRef = useRef(onEditIndicator)
  candlesRef.current = candles
  drawToolRef.current = drawTool
  indicatorsRef.current = indicators
  hiddenRef.current = hiddenIndicators
  timeZoneRef.current = timeZone
  onSelectDrawingRef.current = onSelectDrawing
  onSelectIndicatorRef.current = onSelectIndicator
  onEditIndicatorRef.current = onEditIndicator

  const [chart, setChart] = useState<IChartApi | null>(null)
  const [candleSeries, setCandleSeries] =
    useState<ISeriesApi<'Candlestick'> | null>(null)
  const [visibleSlice, setVisibleSlice] = useState<Candle[]>(candles)
  const [volumeHover, setVolumeHover] = useState<VolumeHoverInfo | null>(null)
  const volumeAvgByTimeRef = useRef<Map<number, number>>(new Map())

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
        tickMarkFormatter: (time: Time, tickMarkType: TickMarkType) =>
          formatTickMark(time as number, tickMarkType, timeZoneRef.current),
      },
      localization: {
        locale: 'es-AR',
        timeFormatter: (time: Time) =>
          formatCrosshairTime(time as number, timeZoneRef.current),
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
    const volumeAvg = chartApi.addSeries(
      LineSeries,
      {
        color: 'rgba(224, 227, 235, 0.75)',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        priceFormat: { type: 'volume' },
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
      volumeAvg,
      bbMid,
      bbUpper,
      bbLower,
      rsi,
      macdLine,
      macdSignal,
      macdHist,
    }
    seriesToIndicatorRef.current = new Map<object, IndicatorId>()
    seriesToIndicatorRef.current.set(bbUpper, 'bollinger')
    seriesToIndicatorRef.current.set(bbMid, 'bollinger')
    seriesToIndicatorRef.current.set(bbLower, 'bollinger')
    seriesToIndicatorRef.current.set(volume, 'volume')
    seriesToIndicatorRef.current.set(volumeAvg, 'volume')
    seriesToIndicatorRef.current.set(rsi, 'rsi')
    seriesToIndicatorRef.current.set(macdLine, 'macd')
    seriesToIndicatorRef.current.set(macdSignal, 'macd')
    seriesToIndicatorRef.current.set(macdHist, 'macd')
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

    const resolveClick = (paneIndex?: number, hovered?: object | null) => {
      if (drawToolRef.current !== 'cursor') return null
      const show = (id: IndicatorId) =>
        Boolean(indicatorsRef.current[id] && !hiddenRef.current[id])

      if (hovered) {
        const mapped = seriesToIndicatorRef.current.get(hovered)
        if (mapped && show(mapped)) return mapped
      }
      if (paneIndex === 1 && show('volume')) return 'volume'
      if (paneIndex === 2 && show('rsi')) return 'rsi'
      if (paneIndex === 3 && show('macd')) return 'macd'
      return null
    }

    const onClick = (param: {
      paneIndex?: number
      hoveredSeries?: object
    }) => {
      if (drawToolRef.current !== 'cursor') return
      const id = resolveClick(param.paneIndex, param.hoveredSeries ?? null)
      onSelectDrawingRef.current(null)
      onSelectIndicatorRef.current(id)
    }

    const onDblClick = (param: {
      paneIndex?: number
      hoveredSeries?: object
    }) => {
      if (drawToolRef.current !== 'cursor') return
      const id = resolveClick(param.paneIndex, param.hoveredSeries ?? null)
      if (!id) return
      onSelectDrawingRef.current(null)
      onSelectIndicatorRef.current(id)
      onEditIndicatorRef.current(id)
    }

    chartApi.timeScale().subscribeVisibleLogicalRangeChange(syncVisible)
    chartApi.subscribeClick(onClick)
    chartApi.subscribeDblClick(onDblClick)
    requestAnimationFrame(syncVisible)

    const syncVolumeHover = (time: number | null) => {
      const all = candlesRef.current
      if (all.length === 0) {
        setVolumeHover(null)
        return
      }
      let candle: Candle | undefined
      if (time != null) {
        candle = all.find((c) => c.time === time)
      }
      if (!candle) candle = all[all.length - 1]
      setVolumeHover({
        volume: candle.volume,
        avg: volumeAvgByTimeRef.current.get(candle.time) ?? null,
      })
    }

    const onCrosshair = (param: { time?: Time }) => {
      const t =
        param.time !== undefined && typeof param.time === 'number'
          ? param.time
          : null
      syncVolumeHover(t)
    }

    chartApi.subscribeCrosshairMove(onCrosshair)

    return () => {
      chartApi.timeScale().unsubscribeVisibleLogicalRangeChange(syncVisible)
      chartApi.unsubscribeClick(onClick)
      chartApi.unsubscribeDblClick(onDblClick)
      chartApi.unsubscribeCrosshairMove(onCrosshair)
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
    if (!chartApi) return
    chartApi.applyOptions({
      localization: {
        locale: 'es-AR',
        timeFormatter: (time: Time) =>
          formatCrosshairTime(time as number, timeZone),
      },
      timeScale: {
        tickMarkFormatter: (time: Time, tickMarkType: TickMarkType) =>
          formatTickMark(time as number, tickMarkType, timeZone),
      },
    })
  }, [timeZone])

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

    const volAvg = volumeSmaSeries(candles, settings.volume.avgPeriod)
    const avgMap = new Map<number, number>()
    for (const p of volAvg) avgMap.set(p.time, p.value)
    volumeAvgByTimeRef.current = avgMap
    s.volumeAvg.setData(toLineData(volAvg))

    const last = candles[candles.length - 1]
    if (last) {
      setVolumeHover({
        volume: last.volume,
        avg: avgMap.get(last.time) ?? null,
      })
    } else {
      setVolumeHover(null)
    }

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

    const show = (id: IndicatorId) =>
      Boolean(indicators[id] && !hiddenIndicators[id])
    const selected = (id: IndicatorId) => selectedIndicatorId === id
    const widthBoost = (id: IndicatorId, base: 1 | 2 | 3 | 4): 1 | 2 | 3 | 4 => {
      if (!selected(id)) return base
      return Math.min(4, base + 1) as 1 | 2 | 3 | 4
    }

    s.bbUpper.applyOptions({
      color: settings.bollinger.upperColor,
      lineWidth: widthBoost('bollinger', settings.bollinger.lineWidth),
      visible: show('bollinger'),
      lastValueVisible: selected('bollinger'),
      crosshairMarkerVisible: selected('bollinger'),
    })
    s.bbMid.applyOptions({
      color: settings.bollinger.midColor,
      lineWidth: widthBoost('bollinger', settings.bollinger.lineWidth),
      visible: show('bollinger'),
      lastValueVisible: selected('bollinger'),
      crosshairMarkerVisible: selected('bollinger'),
    })
    s.bbLower.applyOptions({
      color: settings.bollinger.lowerColor,
      lineWidth: widthBoost('bollinger', settings.bollinger.lineWidth),
      visible: show('bollinger'),
      lastValueVisible: selected('bollinger'),
      crosshairMarkerVisible: selected('bollinger'),
    })

    s.volume.applyOptions({
      visible: show('volume'),
      lastValueVisible: selected('volume'),
    })
    s.volumeAvg.applyOptions({
      visible: show('volume'),
      color: settings.volume.avgColor,
      lastValueVisible: selected('volume'),
      crosshairMarkerVisible: selected('volume'),
    })
    s.rsi.applyOptions({
      visible: show('rsi'),
      color: settings.rsi.color,
      lineWidth: widthBoost('rsi', settings.rsi.lineWidth),
      lastValueVisible: true,
      crosshairMarkerVisible: selected('rsi'),
    })
    s.macdLine.applyOptions({
      visible: show('macd'),
      color: settings.macd.macdColor,
      lineWidth: widthBoost('macd', settings.macd.lineWidth),
      lastValueVisible: selected('macd'),
      crosshairMarkerVisible: selected('macd'),
    })
    s.macdSignal.applyOptions({
      visible: show('macd'),
      color: settings.macd.signalColor,
      lineWidth: widthBoost('macd', settings.macd.lineWidth),
      lastValueVisible: selected('macd'),
      crosshairMarkerVisible: selected('macd'),
    })
    s.macdHist.applyOptions({
      visible: show('macd'),
      lastValueVisible: selected('macd'),
    })

    for (const line of rsiLinesRef.current) s.rsi.removePriceLine(line)
    rsiLinesRef.current = []
    if (show('rsi')) {
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
    panes[1]?.setStretchFactor(show('volume') ? 1 : 0.0001)
    panes[2]?.setStretchFactor(show('rsi') ? 1.15 : 0.0001)
    panes[3]?.setStretchFactor(show('macd') ? 1.25 : 0.0001)
    if (panes[1]) panes[1].setHeight(show('volume') ? 130 : 0)
    if (panes[2]) panes[2].setHeight(show('rsi') ? 140 : 0)
    if (panes[3]) panes[3].setHeight(show('macd') ? 150 : 0)
  }, [indicators, hiddenIndicators, settings, selectedIndicatorId])

  const profile: VolumeProfileResult | null = useMemo(() => {
    if (!indicators.volumeProfile || hiddenIndicators.volumeProfile) return null
    const source = profileMode === 'visible' ? visibleSlice : candles
    return computeVolumeProfile(source, { rowCount, valueAreaPct: 0.7 })
  }, [
    candles,
    visibleSlice,
    profileMode,
    rowCount,
    indicators.volumeProfile,
    hiddenIndicators.volumeProfile,
  ])

  const labelFlags: IndicatorFlags = {
    bollinger: indicators.bollinger && !hiddenIndicators.bollinger,
    volume: indicators.volume && !hiddenIndicators.volume,
    volumeProfile:
      indicators.volumeProfile && !hiddenIndicators.volumeProfile,
    rsi: indicators.rsi && !hiddenIndicators.rsi,
    macd: indicators.macd && !hiddenIndicators.macd,
  }

  const bollingerFillPoints: BandPoint[] = useMemo(() => {
    if (!labelFlags.bollinger || !settings.bollinger.fillEnabled) return []
    const bb = bollingerBands(
      candles,
      settings.bollinger.period,
      settings.bollinger.mult,
    )
    const n = Math.min(bb.upper.length, bb.lower.length)
    const out: BandPoint[] = []
    for (let i = 0; i < n; i++) {
      out.push({
        time: bb.upper[i].time,
        upper: bb.upper[i].value,
        lower: bb.lower[i].value,
      })
    }
    return out
  }, [
    candles,
    labelFlags.bollinger,
    settings.bollinger.fillEnabled,
    settings.bollinger.period,
    settings.bollinger.mult,
  ])

  return (
    <div className="chart-shell">
      <div ref={containerRef} className="chart-canvas" />
      <BollingerFillOverlay
        chart={chart}
        series={candleSeries}
        points={bollingerFillPoints}
        enabled={labelFlags.bollinger && settings.bollinger.fillEnabled}
        color={settings.bollinger.fillColor}
        opacity={settings.bollinger.fillOpacity}
      />
      <PaneLabels
        chart={chart}
        flags={labelFlags}
        settings={settings}
        volumeHover={volumeHover}
      />
      <VolumeProfileOverlay
        chart={chart}
        series={candleSeries}
        profile={profile}
        widthPct={profileWidthPct}
        showValueArea={showValueArea}
        showDelta={showDelta}
        enabled={labelFlags.volumeProfile}
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
