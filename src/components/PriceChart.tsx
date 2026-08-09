import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts'
import type { IndicatorFlags } from '../lib/indicatorTypes'
import { bollingerBands, macdSeries, rsiSeries } from '../lib/indicators'
import type { Candle, VolumeProfileResult } from '../lib/types'
import { computeVolumeProfile } from '../lib/volumeProfile'
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
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<SeriesBag | null>(null)
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
        background: { type: ColorType.Solid, color: '#0f1720' },
        textColor: '#d1d4dc',
        fontFamily: 'IBM Plex Sans, ui-sans-serif, system-ui, sans-serif',
        // Logo on-chart is optional; licence attribution stays in the app footer.
        attributionLogo: false,
        panes: {
          separatorColor: 'rgba(42, 46, 57, 0.95)',
          separatorHoverColor: 'rgba(61, 139, 253, 0.45)',
        },
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.55)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.55)' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(224, 227, 235, 0.25)', width: 1 },
        horzLine: { color: 'rgba(224, 227, 235, 0.25)', width: 1 },
      },
      rightPriceScale: {
        borderColor: 'rgba(42, 46, 57, 0.8)',
        scaleMargins: { top: 0.06, bottom: 0.08 },
      },
      timeScale: {
        borderColor: 'rgba(42, 46, 57, 0.8)',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    const candle = chartApi.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })

    const bbUpper = chartApi.addSeries(LineSeries, {
      color: 'rgba(33, 150, 243, 0.85)',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })
    const bbMid = chartApi.addSeries(LineSeries, {
      color: 'rgba(255, 193, 7, 0.9)',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })
    const bbLower = chartApi.addSeries(LineSeries, {
      color: 'rgba(33, 150, 243, 0.85)',
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
    rsi.createPriceLine({
      price: 70,
      color: 'rgba(239, 83, 80, 0.55)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: '',
    })
    rsi.createPriceLine({
      price: 30,
      color: 'rgba(38, 166, 154, 0.55)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: '',
    })
    rsi.createPriceLine({
      price: 50,
      color: 'rgba(120, 123, 134, 0.45)',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: false,
      title: '',
    })

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

    const bag: SeriesBag = {
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
    seriesRef.current = bag
    chartRef.current = chartApi
    setChart(chartApi)
    setCandleSeries(candle)

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
            ? 'rgba(38, 166, 154, 0.45)'
            : 'rgba(239, 83, 80, 0.45)',
      })),
    )

    const bb = bollingerBands(candles, 20, 2)
    s.bbMid.setData(toLineData(bb.middle))
    s.bbUpper.setData(toLineData(bb.upper))
    s.bbLower.setData(toLineData(bb.lower))

    s.rsi.setData(toLineData(rsiSeries(candles, 14)))

    const macd = macdSeries(candles, 12, 26, 9)
    s.macdLine.setData(toLineData(macd.macd))
    s.macdSignal.setData(toLineData(macd.signal))
    s.macdHist.setData(
      macd.histogram.map((p) => ({
        time: p.time as UTCTimestamp,
        value: p.value,
        color: p.color,
      })),
    )

    chartApi.timeScale().fitContent()
    setVisibleSlice(candles)
  }, [candles])

  useEffect(() => {
    const chartApi = chartRef.current
    const s = seriesRef.current
    if (!chartApi || !s) return

    s.bbMid.applyOptions({ visible: indicators.bollinger })
    s.bbUpper.applyOptions({ visible: indicators.bollinger })
    s.bbLower.applyOptions({ visible: indicators.bollinger })

    s.volume.applyOptions({ visible: indicators.volume })
    s.rsi.applyOptions({ visible: indicators.rsi })
    s.macdLine.applyOptions({ visible: indicators.macd })
    s.macdSignal.applyOptions({ visible: indicators.macd })
    s.macdHist.applyOptions({ visible: indicators.macd })

    const panes = chartApi.panes()
    // pane 0 = price; 1 = volume; 2 = RSI; 3 = MACD
    if (panes[1]) panes[1].setHeight(indicators.volume ? 88 : 0)
    if (panes[2]) panes[2].setHeight(indicators.rsi ? 96 : 0)
    if (panes[3]) panes[3].setHeight(indicators.macd ? 110 : 0)
  }, [indicators])

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
      <VolumeProfileOverlay
        chart={chart}
        series={candleSeries}
        profile={profile}
        widthPct={profileWidthPct}
        showValueArea={showValueArea}
        showDelta={showDelta}
        enabled={indicators.volumeProfile}
      />
    </div>
  )
}
