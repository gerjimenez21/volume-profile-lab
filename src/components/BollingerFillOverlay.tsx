import { useEffect, useRef } from 'react'
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts'

export interface BandPoint {
  time: number
  upper: number
  lower: number
}

interface Props {
  chart: IChartApi | null
  series: ISeriesApi<'Candlestick'> | null
  points: BandPoint[]
  enabled: boolean
  color: string
  opacity: number
}

function toRgba(color: string, opacity: number): string {
  if (color.startsWith('#')) {
    const h = color.slice(1)
    const full =
      h.length === 3
        ? h
            .split('')
            .map((c) => c + c)
            .join('')
        : h.slice(0, 6)
    if (full.length !== 6) return `rgba(33, 150, 243, ${opacity})`
    const r = parseInt(full.slice(0, 2), 16)
    const g = parseInt(full.slice(2, 4), 16)
    const b = parseInt(full.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (!m) return `rgba(33, 150, 243, ${opacity})`
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${opacity})`
}

/** Semi-transparent fill between Bollinger upper & lower bands (TV-style). */
export function BollingerFillOverlay({
  chart,
  series,
  points,
  enabled,
  color,
  opacity,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!chart || !series || !canvasRef.current || !enabled || points.length < 2) {
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx && canvasRef.current) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
      return
    }

    const canvas = canvasRef.current
    const shell = canvas.parentElement
    if (!shell) return

    const draw = () => {
      const paneEl = series.getPane().getHTMLElement()
      if (!paneEl) return

      const shellRect = shell.getBoundingClientRect()
      const paneRect = paneEl.getBoundingClientRect()
      const offsetTop = paneRect.top - shellRect.top
      const w = paneRect.width
      const h = paneRect.height

      canvas.style.top = `${offsetTop}px`
      canvas.style.left = '0px'
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`

      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const coords: Array<{ x: number; yUpper: number; yLower: number }> = []
      for (const p of points) {
        const x = chart.timeScale().timeToCoordinate(p.time as Time)
        const yUpper = series.priceToCoordinate(p.upper)
        const yLower = series.priceToCoordinate(p.lower)
        if (x == null || yUpper == null || yLower == null) continue
        coords.push({ x, yUpper, yLower })
      }
      if (coords.length < 2) return

      ctx.beginPath()
      ctx.moveTo(coords[0].x, coords[0].yUpper)
      for (let i = 1; i < coords.length; i++) {
        ctx.lineTo(coords[i].x, coords[i].yUpper)
      }
      for (let i = coords.length - 1; i >= 0; i--) {
        ctx.lineTo(coords[i].x, coords[i].yLower)
      }
      ctx.closePath()
      ctx.fillStyle = toRgba(color, opacity)
      ctx.fill()
    }

    draw()
    const paneEl = series.getPane().getHTMLElement()
    const ro = new ResizeObserver(draw)
    ro.observe(shell)
    if (paneEl) ro.observe(paneEl)
    chart.timeScale().subscribeVisibleLogicalRangeChange(draw)
    series.subscribeDataChanged(draw)

    return () => {
      ro.disconnect()
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(draw)
      series.unsubscribeDataChanged(draw)
    }
  }, [chart, series, points, enabled, color, opacity])

  return <canvas ref={canvasRef} className="bb-fill-overlay" aria-hidden />
}
