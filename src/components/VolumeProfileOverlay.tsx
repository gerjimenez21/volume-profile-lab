import { useEffect, useRef } from 'react'
import type { IChartApi, ISeriesApi } from 'lightweight-charts'
import type { VolumeProfileResult } from '../lib/types'
import { formatPrice, formatVolume } from '../lib/format'

interface Props {
  chart: IChartApi | null
  series: ISeriesApi<'Candlestick'> | null
  profile: VolumeProfileResult | null
  widthPct?: number
  showValueArea?: boolean
  showDelta?: boolean
  enabled?: boolean
  buyColor?: string
  sellColor?: string
  pocColor?: string
}

function fade(color: string, amount: number): string {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i)
  if (!m) return color
  const a = Number(m[4] ?? 1) * amount
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${a})`
}

export function VolumeProfileOverlay({
  chart,
  series,
  profile,
  widthPct = 0.28,
  showValueArea = true,
  showDelta = true,
  enabled = true,
  buyColor = 'rgba(38, 166, 154, 0.55)',
  sellColor = 'rgba(239, 83, 80, 0.55)',
  pocColor = 'rgba(255, 193, 7, 0.95)',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!chart || !series || !profile || !canvasRef.current || !enabled) {
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
      const paneWidth = paneRect.width
      const paneHeight = paneRect.height

      canvas.style.top = `${offsetTop}px`
      canvas.style.left = '0px'
      canvas.style.width = `${paneWidth}px`
      canvas.style.height = `${paneHeight}px`

      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.floor(paneWidth * dpr)
      canvas.height = Math.floor(paneHeight * dpr)

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, paneWidth, paneHeight)

      const maxVol = profile.maxBinVolume
      if (maxVol <= 0) return

      const profileWidth = paneWidth * widthPct
      const left = paneWidth - profileWidth - 8

      for (const bin of profile.bins) {
        const yTop = series.priceToCoordinate(bin.priceHigh)
        const yBot = series.priceToCoordinate(bin.priceLow)
        if (yTop == null || yBot == null) continue

        const top = Math.min(yTop, yBot)
        const height = Math.max(1, Math.abs(yBot - yTop) - 0.5)
        const barW = (bin.volume / maxVol) * (profileWidth - 4)

        const inValueArea =
          showValueArea &&
          bin.priceMid >= profile.val &&
          bin.priceMid <= profile.vah
        const isPoc = Math.abs(bin.priceMid - profile.poc) < 1e-9

        if (showDelta && bin.volume > 0) {
          const buyW = (bin.buyVolume / bin.volume) * barW
          const sellW = barW - buyW
          ctx.fillStyle = inValueArea ? buyColor : fade(buyColor, 0.5)
          ctx.fillRect(left, top, buyW, height)
          ctx.fillStyle = inValueArea ? sellColor : fade(sellColor, 0.5)
          ctx.fillRect(left + buyW, top, sellW, height)
        } else {
          ctx.fillStyle = inValueArea
            ? 'rgba(41, 98, 255, 0.45)'
            : 'rgba(41, 98, 255, 0.22)'
          ctx.fillRect(left, top, barW, height)
        }

        if (isPoc) {
          ctx.fillStyle = pocColor
          ctx.fillRect(left, top, Math.max(barW, 2), height)
        }
      }

      const markers: Array<{ price: number; label: string; color: string }> = [
        { price: profile.poc, label: 'POC', color: pocColor },
      ]
      if (showValueArea) {
        markers.push(
          { price: profile.vah, label: 'VAH', color: '#90caf9' },
          { price: profile.val, label: 'VAL', color: '#90caf9' },
        )
      }

      for (const m of markers) {
        const y = series.priceToCoordinate(m.price)
        if (y == null) continue
        ctx.strokeStyle = m.color
        ctx.lineWidth = 1
        ctx.setLineDash([4, 3])
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(paneWidth, y)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = m.color
        ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace'
        ctx.fillText(`${m.label} ${formatPrice(m.price)}`, 10, y - 4)
      }

      ctx.fillStyle = 'rgba(15, 23, 32, 0.72)'
      ctx.fillRect(left - 4, 8, profileWidth + 4, 36)
      ctx.fillStyle = '#d1d4dc'
      ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
      ctx.fillText('Volume Profile', left, 22)
      ctx.fillStyle = '#787b86'
      ctx.fillText(`Vol ${formatVolume(profile.totalVolume)}`, left, 38)
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
  }, [
    chart,
    series,
    profile,
    widthPct,
    showValueArea,
    showDelta,
    enabled,
    buyColor,
    sellColor,
    pocColor,
  ])

  return <canvas ref={canvasRef} className="vp-overlay" aria-hidden />
}
