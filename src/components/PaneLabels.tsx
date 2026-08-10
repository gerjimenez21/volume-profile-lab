import { useEffect, useState } from 'react'
import type { IChartApi } from 'lightweight-charts'
import { formatVolume } from '../lib/format'
import type { IndicatorFlags, IndicatorSettings } from '../lib/indicatorTypes'

export interface VolumeHoverInfo {
  volume: number
  avg: number | null
}

interface Props {
  chart: IChartApi | null
  flags: IndicatorFlags
  settings: IndicatorSettings
  volumeHover: VolumeHoverInfo | null
}

interface Label {
  key: string
  text: string
  top: number
}

function formatVolumeLabel(
  hover: VolumeHoverInfo | null,
  avgPeriod: number,
): string {
  if (!hover) return 'Volumen'
  const vol = formatVolume(hover.volume)
  if (hover.avg == null || hover.avg <= 0) return `Vol ${vol}`
  const avg = formatVolume(hover.avg)
  const pct = ((hover.volume / hover.avg) - 1) * 100
  const sign = pct >= 0 ? '+' : ''
  return `Vol ${vol} · Prom(${avgPeriod}) ${avg} (${sign}${pct.toFixed(0)}%)`
}

export function PaneLabels({ chart, flags, settings, volumeHover }: Props) {
  const [labels, setLabels] = useState<Label[]>([])

  useEffect(() => {
    if (!chart) {
      setLabels([])
      return
    }

    const update = () => {
      const shell = chart.chartElement().parentElement
      if (!shell) return
      const shellTop = shell.getBoundingClientRect().top
      const panes = chart.panes()
      const next: Label[] = []

      const push = (paneIndex: number, key: string, text: string, enabled: boolean) => {
        if (!enabled) return
        const pane = panes[paneIndex]
        const el = pane?.getHTMLElement()
        if (!el) return
        const top = el.getBoundingClientRect().top - shellTop + 8
        if (el.getBoundingClientRect().height < 24) return
        next.push({ key, text, top })
      }

      push(
        0,
        'bb',
        flags.bollinger
          ? `BB (${settings.bollinger.period}, ${settings.bollinger.mult})`
          : 'Precio',
        true,
      )
      push(
        1,
        'vol',
        formatVolumeLabel(volumeHover, settings.volume.avgPeriod),
        flags.volume,
      )
      push(2, 'rsi', `RSI (${settings.rsi.period})`, flags.rsi)
      push(
        3,
        'macd',
        `MACD (${settings.macd.fast}, ${settings.macd.slow}, ${settings.macd.signal})`,
        flags.macd,
      )
      setLabels(next)
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(chart.chartElement())
    chart.timeScale().subscribeVisibleLogicalRangeChange(update)

    return () => {
      ro.disconnect()
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(update)
    }
  }, [chart, flags, settings, volumeHover])

  return (
    <>
      {labels.map((l) => (
        <div
          key={l.key}
          className={`pane-label${l.key === 'vol' ? ' pane-label-vol' : ''}`}
          style={{ top: l.top }}
        >
          {l.text}
        </div>
      ))}
    </>
  )
}
