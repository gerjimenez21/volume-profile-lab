import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import type { IndicatorId } from '../lib/indicatorCatalog'
import { getIndicatorMeta } from '../lib/indicatorCatalog'
import type { IndicatorFlags, IndicatorSettings } from '../lib/indicatorTypes'
import { Drawer } from './ui/Drawer'

type EditorTab = 'inputs' | 'style' | 'visibility'

interface Props {
  open: boolean
  indicatorId: IndicatorId | null
  flags: IndicatorFlags
  settings: IndicatorSettings
  onClose: () => void
  onChange: (next: IndicatorSettings) => void
  onToggle: (id: IndicatorId) => void
  onRemove: (id: IndicatorId) => void
}

export function IndicatorEditorDrawer({
  open,
  indicatorId,
  flags,
  settings,
  onClose,
  onChange,
  onToggle,
  onRemove,
}: Props) {
  const [tab, setTab] = useState<EditorTab>('inputs')
  const [draft, setDraft] = useState(settings)

  useEffect(() => {
    if (open) {
      setDraft(settings)
      setTab('inputs')
    }
  }, [open, indicatorId, settings])

  if (!indicatorId) return null

  const meta = getIndicatorMeta(indicatorId)
  const visible = flags[indicatorId]

  const apply = () => {
    onChange(draft)
    onClose()
  }

  const cancel = () => {
    setDraft(settings)
    onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={cancel}
      title={meta.shortName}
      ariaLabel={`Ajustes de ${meta.name}`}
      width={400}
      footer={
        <>
          <button type="button" className="tv-btn ghost" onClick={cancel}>
            Cancelar
          </button>
          <button type="button" className="tv-btn primary" onClick={apply}>
            Aceptar
          </button>
        </>
      }
    >
      <div className="ind-editor">
        <div className="ind-editor-tabs" role="tablist">
          {(
            [
              ['inputs', 'Entradas de datos'],
              ['style', 'Estilo'],
              ['visibility', 'Visibilidad'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? 'active' : undefined}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="ind-editor-content">
          {tab === 'inputs' && (
            <InputsTab id={indicatorId} draft={draft} setDraft={setDraft} />
          )}
          {tab === 'style' && (
            <StyleTab id={indicatorId} draft={draft} setDraft={setDraft} />
          )}
          {tab === 'visibility' && (
            <div className="tv-form">
              <Row label="Visible en el gráfico">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={() => onToggle(indicatorId)}
                />
              </Row>
              <p className="tv-help">
                También podés ocultarlo o quitarlo desde la leyenda del chart.
              </p>
              <button
                type="button"
                className="tv-btn danger-outline"
                onClick={() => {
                  onRemove(indicatorId)
                  onClose()
                }}
              >
                Quitar indicador
              </button>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  )
}

function InputsTab({
  id,
  draft,
  setDraft,
}: {
  id: IndicatorId
  draft: IndicatorSettings
  setDraft: (next: IndicatorSettings) => void
}) {
  if (id === 'bollinger') {
    return (
      <div className="tv-form">
        <Row label="Longitud">
          <input
            type="number"
            min={5}
            max={100}
            value={draft.bollinger.period}
            onChange={(e) =>
              setDraft({
                ...draft,
                bollinger: {
                  ...draft.bollinger,
                  period: Number(e.target.value),
                },
              })
            }
          />
        </Row>
        <Row label="StdDev">
          <input
            type="number"
            min={0.5}
            max={5}
            step={0.1}
            value={draft.bollinger.mult}
            onChange={(e) =>
              setDraft({
                ...draft,
                bollinger: {
                  ...draft.bollinger,
                  mult: Number(e.target.value),
                },
              })
            }
          />
        </Row>
        <Row label="Fuente">
          <select disabled value="close">
            <option value="close">Cierre</option>
          </select>
        </Row>
      </div>
    )
  }

  if (id === 'rsi') {
    return (
      <div className="tv-form">
        <Row label="Longitud">
          <input
            type="number"
            min={2}
            max={50}
            value={draft.rsi.period}
            onChange={(e) =>
              setDraft({
                ...draft,
                rsi: { ...draft.rsi, period: Number(e.target.value) },
              })
            }
          />
        </Row>
        <Row label="Sobrecompra">
          <input
            type="number"
            min={50}
            max={95}
            value={draft.rsi.overbought}
            onChange={(e) =>
              setDraft({
                ...draft,
                rsi: { ...draft.rsi, overbought: Number(e.target.value) },
              })
            }
          />
        </Row>
        <Row label="Sobreventa">
          <input
            type="number"
            min={5}
            max={50}
            value={draft.rsi.oversold}
            onChange={(e) =>
              setDraft({
                ...draft,
                rsi: { ...draft.rsi, oversold: Number(e.target.value) },
              })
            }
          />
        </Row>
      </div>
    )
  }

  if (id === 'macd') {
    return (
      <div className="tv-form">
        <Row label="Rápida">
          <input
            type="number"
            min={2}
            max={50}
            value={draft.macd.fast}
            onChange={(e) =>
              setDraft({
                ...draft,
                macd: { ...draft.macd, fast: Number(e.target.value) },
              })
            }
          />
        </Row>
        <Row label="Lenta">
          <input
            type="number"
            min={5}
            max={100}
            value={draft.macd.slow}
            onChange={(e) =>
              setDraft({
                ...draft,
                macd: { ...draft.macd, slow: Number(e.target.value) },
              })
            }
          />
        </Row>
        <Row label="Señal">
          <input
            type="number"
            min={2}
            max={50}
            value={draft.macd.signal}
            onChange={(e) =>
              setDraft({
                ...draft,
                macd: { ...draft.macd, signal: Number(e.target.value) },
              })
            }
          />
        </Row>
      </div>
    )
  }

  if (id === 'volume' || id === 'volumeProfile') {
    return (
      <div className="tv-form">
        <p className="tv-help">
          Este indicador no tiene entradas numéricas adicionales. Ajustá colores
          en la pestaña Estilo.
        </p>
      </div>
    )
  }

  return null
}

function StyleTab({
  id,
  draft,
  setDraft,
}: {
  id: IndicatorId
  draft: IndicatorSettings
  setDraft: (next: IndicatorSettings) => void
}) {
  if (id === 'bollinger') {
    return (
      <div className="tv-form">
        <Row label="Banda superior">
          <ColorInput
            value={draft.bollinger.upperColor}
            onChange={(upperColor) =>
              setDraft({
                ...draft,
                bollinger: { ...draft.bollinger, upperColor },
              })
            }
          />
        </Row>
        <Row label="Media">
          <ColorInput
            value={draft.bollinger.midColor}
            onChange={(midColor) =>
              setDraft({
                ...draft,
                bollinger: { ...draft.bollinger, midColor },
              })
            }
          />
        </Row>
        <Row label="Banda inferior">
          <ColorInput
            value={draft.bollinger.lowerColor}
            onChange={(lowerColor) =>
              setDraft({
                ...draft,
                bollinger: { ...draft.bollinger, lowerColor },
              })
            }
          />
        </Row>
            <Row label="Grosor">
              <WidthSelect
                value={draft.bollinger.lineWidth}
                onChange={(lineWidth) =>
                  setDraft({
                    ...draft,
                    bollinger: { ...draft.bollinger, lineWidth },
                  })
                }
              />
            </Row>
            <Row label="Fondo">
              <input
                type="checkbox"
                checked={draft.bollinger.fillEnabled}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    bollinger: {
                      ...draft.bollinger,
                      fillEnabled: e.target.checked,
                    },
                  })
                }
              />
            </Row>
            <Row label="Color del fondo">
              <ColorInput
                value={draft.bollinger.fillColor}
                onChange={(fillColor) =>
                  setDraft({
                    ...draft,
                    bollinger: { ...draft.bollinger, fillColor },
                  })
                }
              />
            </Row>
            <Row label="Opacidad">
              <input
                type="number"
                min={0.02}
                max={0.6}
                step={0.02}
                value={draft.bollinger.fillOpacity}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    bollinger: {
                      ...draft.bollinger,
                      fillOpacity: Number(e.target.value),
                    },
                  })
                }
              />
            </Row>
          </div>
        )
  }

  if (id === 'volume') {
    return (
      <div className="tv-form">
        <Row label="Alcista">
          <ColorInput
            value={toHex(draft.volume.upColor)}
            onChange={(c) =>
              setDraft({
                ...draft,
                volume: { ...draft.volume, upColor: withAlpha(c, 0.55) },
              })
            }
          />
        </Row>
        <Row label="Bajista">
          <ColorInput
            value={toHex(draft.volume.downColor)}
            onChange={(c) =>
              setDraft({
                ...draft,
                volume: { ...draft.volume, downColor: withAlpha(c, 0.55) },
              })
            }
          />
        </Row>
      </div>
    )
  }

  if (id === 'rsi') {
    return (
      <div className="tv-form">
        <Row label="Línea RSI">
          <ColorInput
            value={draft.rsi.color}
            onChange={(color) =>
              setDraft({ ...draft, rsi: { ...draft.rsi, color } })
            }
          />
        </Row>
        <Row label="Grosor">
          <WidthSelect
            value={draft.rsi.lineWidth}
            onChange={(lineWidth) =>
              setDraft({ ...draft, rsi: { ...draft.rsi, lineWidth } })
            }
          />
        </Row>
      </div>
    )
  }

  if (id === 'macd') {
    return (
      <div className="tv-form">
        <Row label="MACD">
          <ColorInput
            value={draft.macd.macdColor}
            onChange={(macdColor) =>
              setDraft({ ...draft, macd: { ...draft.macd, macdColor } })
            }
          />
        </Row>
        <Row label="Señal">
          <ColorInput
            value={draft.macd.signalColor}
            onChange={(signalColor) =>
              setDraft({ ...draft, macd: { ...draft.macd, signalColor } })
            }
          />
        </Row>
        <Row label="Histograma +">
          <ColorInput
            value={toHex(draft.macd.histUpColor)}
            onChange={(c) =>
              setDraft({
                ...draft,
                macd: { ...draft.macd, histUpColor: withAlpha(c, 0.7) },
              })
            }
          />
        </Row>
        <Row label="Histograma −">
          <ColorInput
            value={toHex(draft.macd.histDownColor)}
            onChange={(c) =>
              setDraft({
                ...draft,
                macd: { ...draft.macd, histDownColor: withAlpha(c, 0.7) },
              })
            }
          />
        </Row>
        <Row label="Grosor">
          <WidthSelect
            value={draft.macd.lineWidth}
            onChange={(lineWidth) =>
              setDraft({ ...draft, macd: { ...draft.macd, lineWidth } })
            }
          />
        </Row>
      </div>
    )
  }

  if (id === 'volumeProfile') {
    return (
      <div className="tv-form">
        <Row label="Compra">
          <ColorInput
            value={toHex(draft.volumeProfile.buyColor)}
            onChange={(c) =>
              setDraft({
                ...draft,
                volumeProfile: {
                  ...draft.volumeProfile,
                  buyColor: withAlpha(c, 0.55),
                },
              })
            }
          />
        </Row>
        <Row label="Venta">
          <ColorInput
            value={toHex(draft.volumeProfile.sellColor)}
            onChange={(c) =>
              setDraft({
                ...draft,
                volumeProfile: {
                  ...draft.volumeProfile,
                  sellColor: withAlpha(c, 0.55),
                },
              })
            }
          />
        </Row>
        <Row label="POC">
          <ColorInput
            value={toHex(draft.volumeProfile.pocColor)}
            onChange={(c) =>
              setDraft({
                ...draft,
                volumeProfile: {
                  ...draft.volumeProfile,
                  pocColor: withAlpha(c, 0.95),
                },
              })
            }
          />
        </Row>
      </div>
    )
  }

  return null
}

function Row({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="tv-row">
      <span>{label}</span>
      <div>{children}</div>
    </label>
  )
}

function ColorInput({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <input
      type="color"
      value={value.startsWith('#') ? value.slice(0, 7) : value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function WidthSelect({
  value,
  onChange,
}: {
  value: 1 | 2 | 3 | 4
  onChange: (v: 1 | 2 | 3 | 4) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value) as 1 | 2 | 3 | 4)}
    >
      <option value={1}>1</option>
      <option value={2}>2</option>
      <option value={3}>3</option>
      <option value={4}>4</option>
    </select>
  )
}

function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function toHex(color: string): string {
  if (color.startsWith('#') && color.length >= 7) return color.slice(0, 7)
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (!m) return '#26a69a'
  const hex = (n: string) => Number(n).toString(16).padStart(2, '0')
  return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`
}
