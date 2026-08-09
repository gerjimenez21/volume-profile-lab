import { useEffect, useState } from 'react'
import type { IChartApi } from 'lightweight-charts'
import type { IndicatorFlags, IndicatorSettings } from '../lib/indicatorTypes'

interface Props {
  chart: IChartApi | null
  flags: IndicatorFlags
  settings: IndicatorSettings
}

interface Label {
  key: string
  text: string
  top: number
}

export function PaneLabels({ chart, flags, settings }: Props) {
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
      push(1, 'vol', 'Volumen', flags.volume)
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
    const id = window.setInterval(update, 400)

    return () => {
      ro.disconnect()
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(update)
      window.clearInterval(id)
    }
  }, [chart, flags, settings])

  return (
    <>
      {labels.map((l) => (
        <div
          key={l.key}
          className="pane-label"
          style={{ top: l.top }}
        >
          {l.text}
        </div>
      ))}
    </>
  )
}
