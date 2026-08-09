import { useEffect, useRef, useState } from 'react'
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts'
import {
  hitTestDrawing,
  moveDrawing,
  newDrawingId,
  type Drawing,
  type DrawingTool,
  type ProjectedDrawing,
} from '../lib/drawings'

interface Props {
  chart: IChartApi | null
  series: ISeriesApi<'Candlestick'> | null
  tool: DrawingTool
  color: string
  drawings: Drawing[]
  selectedId: string | null
  onChange: (next: Drawing[]) => void
  onSelect: (id: string | null) => void
}

type Draft =
  | { type: 'trend'; t1: number; p1: number; x2: number; y2: number }
  | { type: 'rect'; t1: number; p1: number; x2: number; y2: number }
  | null

type DragState = {
  id: string
  startX: number
  startY: number
  origin: Drawing
}

function timeToCoord(chart: IChartApi, time: number): number | null {
  return chart.timeScale().timeToCoordinate(time as Time)
}

function fillFromHex(color: string): string {
  if (color.startsWith('#') && color.length >= 7) return `${color.slice(0, 7)}33`
  return 'rgba(245, 215, 110, 0.2)'
}

export function DrawingOverlay({
  chart,
  series,
  tool,
  color,
  drawings,
  selectedId,
  onChange,
  onSelect,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [draft, setDraft] = useState<Draft>(null)
  const draftRef = useRef<Draft>(null)
  const drawingsRef = useRef(drawings)
  const selectedRef = useRef(selectedId)
  const dragRef = useRef<DragState | null>(null)
  const projectedRef = useRef<ProjectedDrawing[]>([])
  draftRef.current = draft
  drawingsRef.current = drawings
  selectedRef.current = selectedId

  useEffect(() => {
    if (!chart || !series || !canvasRef.current) return
    const canvas = canvasRef.current
    const shell = canvas.parentElement
    if (!shell) return

    const project = (list: Drawing[], w: number): ProjectedDrawing[] => {
      const out: ProjectedDrawing[] = []
      for (const d of list) {
        if (d.type === 'hline') {
          const y = series.priceToCoordinate(d.price)
          if (y == null) continue
          out.push({ drawing: d, kind: 'hline', y, width: w })
        } else if (d.type === 'trend') {
          const x1 = timeToCoord(chart, d.t1)
          const y1 = series.priceToCoordinate(d.p1)
          const x2 = timeToCoord(chart, d.t2)
          const y2 = series.priceToCoordinate(d.p2)
          if (x1 == null || y1 == null || x2 == null || y2 == null) continue
          out.push({ drawing: d, kind: 'trend', x1, y1, x2, y2 })
        } else {
          const x1 = timeToCoord(chart, d.t1)
          const y1 = series.priceToCoordinate(d.p1)
          const x2 = timeToCoord(chart, d.t2)
          const y2 = series.priceToCoordinate(d.p2)
          if (x1 == null || y1 == null || x2 == null || y2 == null) continue
          out.push({ drawing: d, kind: 'rect', x1, y1, x2, y2 })
        }
      }
      return out
    }

    const drawHandle = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
    ) => {
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#3d8bfd'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.rect(x - 4, y - 4, 8, 8)
      ctx.fill()
      ctx.stroke()
    }

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

      const projected = project(drawingsRef.current, w)
      projectedRef.current = projected

      for (const item of projected) {
        const d = item.drawing
        const selected = d.id === selectedRef.current
        ctx.strokeStyle = d.color
        ctx.lineWidth = selected ? d.lineWidth + 1.5 : d.lineWidth
        ctx.setLineDash(selected ? [6, 4] : [])

        if (item.kind === 'hline') {
          ctx.beginPath()
          ctx.moveTo(0, item.y)
          ctx.lineTo(w, item.y)
          ctx.stroke()
          if (selected) {
            ctx.setLineDash([])
            drawHandle(ctx, 24, item.y)
            drawHandle(ctx, w - 24, item.y)
          }
        } else if (item.kind === 'trend') {
          ctx.beginPath()
          ctx.moveTo(item.x1, item.y1)
          ctx.lineTo(item.x2, item.y2)
          ctx.stroke()
          if (selected) {
            ctx.setLineDash([])
            drawHandle(ctx, item.x1, item.y1)
            drawHandle(ctx, item.x2, item.y2)
          }
        } else {
          const left = Math.min(item.x1, item.x2)
          const top = Math.min(item.y1, item.y2)
          const rw = Math.abs(item.x2 - item.x1)
          const rh = Math.abs(item.y2 - item.y1)
          ctx.strokeRect(left, top, rw, rh)
          ctx.fillStyle = fillFromHex(d.color)
          ctx.fillRect(left, top, rw, rh)
          if (selected) {
            ctx.setLineDash([])
            drawHandle(ctx, left, top)
            drawHandle(ctx, left + rw, top)
            drawHandle(ctx, left, top + rh)
            drawHandle(ctx, left + rw, top + rh)
          }
        }
        ctx.setLineDash([])
      }

      const dft = draftRef.current
      if (dft) {
        const x1 = timeToCoord(chart, dft.t1)
        const y1 = series.priceToCoordinate(dft.p1)
        if (x1 != null && y1 != null) {
          ctx.strokeStyle = color
          ctx.lineWidth = 1.5
          ctx.setLineDash([5, 4])
          if (dft.type === 'trend') {
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(dft.x2, dft.y2)
            ctx.stroke()
          } else {
            ctx.strokeRect(
              Math.min(x1, dft.x2),
              Math.min(y1, dft.y2),
              Math.abs(dft.x2 - x1),
              Math.abs(dft.y2 - y1),
            )
          }
          ctx.setLineDash([])
        }
      }
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
  }, [chart, series, color, drawings, selectedId, draft])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !chart || !series) return

    const creating = tool === 'hline' || tool === 'trend' || tool === 'rect'
    const syncPointerMode = (overDrawing: boolean) => {
      // Never keep the canvas "always on" just because something is selected —
      // that blocks pan/zoom and indicator clicks across the whole chart.
      if (creating || dragRef.current || overDrawing) {
        canvas.style.pointerEvents = 'auto'
        canvas.style.cursor = creating
          ? 'crosshair'
          : overDrawing || dragRef.current
            ? 'pointer'
            : 'default'
      } else {
        canvas.style.pointerEvents = 'none'
        canvas.style.cursor = 'default'
      }
    }
    syncPointerMode(false)

    const localPoint = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const toMarket = (e: MouseEvent) => {
      const { x, y } = localPoint(e)
      const time = chart.timeScale().coordinateToTime(x)
      const price = series.coordinateToPrice(y)
      if (time == null || price == null) return null
      const t = typeof time === 'number' ? time : null
      if (t == null) return null
      return { t, price, x, y }
    }

    const onChartMouseMove = (e: MouseEvent) => {
      if (creating || dragRef.current) return
      const rect = canvas.getBoundingClientRect()
      const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      if (
        pt.x < 0 ||
        pt.y < 0 ||
        pt.x > rect.width ||
        pt.y > rect.height
      ) {
        syncPointerMode(false)
        return
      }
      const hit = hitTestDrawing(projectedRef.current, pt)
      syncPointerMode(Boolean(hit))
    }

    const onPointerDown = (e: MouseEvent) => {
      const pt = localPoint(e)

      if (tool === 'cursor') {
        const hit = hitTestDrawing(projectedRef.current, pt)
        if (hit) {
          onSelect(hit.id)
          dragRef.current = {
            id: hit.id,
            startX: pt.x,
            startY: pt.y,
            origin: structuredClone(hit),
          }
          canvas.style.pointerEvents = 'auto'
          canvas.style.cursor = 'move'
          e.preventDefault()
          e.stopPropagation()
        } else {
          onSelect(null)
          syncPointerMode(false)
        }
        return
      }

      const market = toMarket(e)
      if (!market) return

      if (tool === 'hline') {
        const created: Drawing = {
          id: newDrawingId(),
          type: 'hline',
          price: market.price,
          color,
          lineWidth: 2,
        }
        onChange([...drawingsRef.current, created])
        onSelect(created.id)
        return
      }

      if (tool === 'trend' || tool === 'rect') {
        const current = draftRef.current
        if (!current || current.type !== tool) {
          setDraft({
            type: tool,
            t1: market.t,
            p1: market.price,
            x2: market.x,
            y2: market.y,
          })
          return
        }

        const created: Drawing = {
          id: newDrawingId(),
          type: tool,
          t1: current.t1,
          p1: current.p1,
          t2: market.t,
          p2: market.price,
          color,
          lineWidth: 2,
        }
        onChange([...drawingsRef.current, created])
        onSelect(created.id)
        setDraft(null)
      }
    }

    const onPointerMove = (e: MouseEvent) => {
      const pt = localPoint(e)

      const drag = dragRef.current
      if (drag && tool === 'cursor') {
        const startMarketTime = chart.timeScale().coordinateToTime(drag.startX)
        const startMarketPrice = series.coordinateToPrice(drag.startY)
        const nowTime = chart.timeScale().coordinateToTime(pt.x)
        const nowPrice = series.coordinateToPrice(pt.y)
        if (
          startMarketTime == null ||
          startMarketPrice == null ||
          nowTime == null ||
          nowPrice == null ||
          typeof startMarketTime !== 'number' ||
          typeof nowTime !== 'number'
        ) {
          return
        }
        const moved = moveDrawing(
          drag.origin,
          nowTime - startMarketTime,
          nowPrice - startMarketPrice,
        )
        onChange(
          drawingsRef.current.map((d) => (d.id === drag.id ? moved : d)),
        )
        return
      }

      if (tool === 'cursor') {
        const hit = hitTestDrawing(projectedRef.current, pt)
        syncPointerMode(Boolean(hit))
      }

      const current = draftRef.current
      if (!current) return
      setDraft({
        ...current,
        x2: pt.x,
        y2: pt.y,
      })
    }

    const onPointerUp = () => {
      dragRef.current = null
      if (tool === 'cursor') {
        syncPointerMode(false)
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDraft(null)
        dragRef.current = null
        onSelect(null)
        return
      }
      if (
        (e.key === 'Backspace' || e.key === 'Delete') &&
        selectedRef.current
      ) {
        const target = e.target as HTMLElement | null
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT')
        ) {
          return
        }
        e.preventDefault()
        onChange(drawingsRef.current.filter((d) => d.id !== selectedRef.current))
        onSelect(null)
      }
    }

    const chartEl = chart.chartElement()
    chartEl.addEventListener('mousemove', onChartMouseMove)
    canvas.addEventListener('mousedown', onPointerDown)
    window.addEventListener('mousemove', onPointerMove)
    window.addEventListener('mouseup', onPointerUp)
    window.addEventListener('keydown', onKey)
    return () => {
      chartEl.removeEventListener('mousemove', onChartMouseMove)
      canvas.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('mousemove', onPointerMove)
      window.removeEventListener('mouseup', onPointerUp)
      window.removeEventListener('keydown', onKey)
    }
  }, [chart, series, tool, color, onChange, onSelect, selectedId])

  useEffect(() => {
    setDraft(null)
    dragRef.current = null
  }, [tool])

  return <canvas ref={canvasRef} className="draw-overlay" aria-hidden />
}
