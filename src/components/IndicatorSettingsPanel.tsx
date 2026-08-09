import type { ReactNode } from 'react'
import type { IndicatorFlags, IndicatorSettings } from '../lib/indicatorTypes'

type Tab = keyof IndicatorSettings

interface Props {
  open: boolean
  onClose: () => void
  flags: IndicatorFlags
  settings: IndicatorSettings
  onChange: (next: IndicatorSettings) => void
  onToggle: (key: keyof IndicatorFlags) => void
}

const TABS: Array<{ id: Tab; label: string; flag: keyof IndicatorFlags }> = [
  { id: 'bollinger', label: 'Bollinger', flag: 'bollinger' },
  { id: 'volume', label: 'Volumen', flag: 'volume' },
  { id: 'rsi', label: 'RSI', flag: 'rsi' },
  { id: 'macd', label: 'MACD', flag: 'macd' },
  { id: 'volumeProfile', label: 'Vol. Profile', flag: 'volumeProfile' },
]

export function IndicatorSettingsPanel({
  open,
  onClose,
  flags,
  settings,
  onChange,
  onToggle,
}: Props) {
  if (!open) return null

  return (
    <div className="settings-drawer" role="dialog" aria-label="Ajustes de indicadores">
      <header>
        <h2>Indicadores</h2>
        <button type="button" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
      </header>

      <div className="settings-body">
        {TABS.map(({ id, label, flag }) => (
          <section key={id} className="settings-block">
            <div className="settings-block-head">
              <label className="check">
                <input
                  type="checkbox"
                  checked={flags[flag]}
                  onChange={() => onToggle(flag)}
                />
                <strong>{label}</strong>
              </label>
            </div>

            {id === 'bollinger' && (
              <div className="settings-grid">
                <Field label="Periodo">
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={settings.bollinger.period}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        bollinger: {
                          ...settings.bollinger,
                          period: Number(e.target.value),
                        },
                      })
                    }
                  />
                </Field>
                <Field label="Desvíos">
                  <input
                    type="number"
                    min={0.5}
                    max={5}
                    step={0.1}
                    value={settings.bollinger.mult}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        bollinger: {
                          ...settings.bollinger,
                          mult: Number(e.target.value),
                        },
                      })
                    }
                  />
                </Field>
                <Field label="Grosor">
                  <select
                    value={settings.bollinger.lineWidth}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        bollinger: {
                          ...settings.bollinger,
                          lineWidth: Number(e.target.value) as 1 | 2 | 3 | 4,
                        },
                      })
                    }
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </Field>
                <ColorField
                  label="Superior"
                  value={settings.bollinger.upperColor}
                  onChange={(upperColor) =>
                    onChange({
                      ...settings,
                      bollinger: { ...settings.bollinger, upperColor },
                    })
                  }
                />
                <ColorField
                  label="Media"
                  value={settings.bollinger.midColor}
                  onChange={(midColor) =>
                    onChange({
                      ...settings,
                      bollinger: { ...settings.bollinger, midColor },
                    })
                  }
                />
                <ColorField
                  label="Inferior"
                  value={settings.bollinger.lowerColor}
                  onChange={(lowerColor) =>
                    onChange({
                      ...settings,
                      bollinger: { ...settings.bollinger, lowerColor },
                    })
                  }
                />
              </div>
            )}

            {id === 'volume' && (
              <div className="settings-grid">
                <ColorField
                  label="Alcista"
                  value={toHex(settings.volume.upColor, '#26a69a')}
                  onChange={(upColor) =>
                    onChange({
                      ...settings,
                      volume: {
                        ...settings.volume,
                        upColor: withAlpha(upColor, 0.55),
                      },
                    })
                  }
                />
                <ColorField
                  label="Bajista"
                  value={toHex(settings.volume.downColor, '#ef5350')}
                  onChange={(downColor) =>
                    onChange({
                      ...settings,
                      volume: {
                        ...settings.volume,
                        downColor: withAlpha(downColor, 0.55),
                      },
                    })
                  }
                />
              </div>
            )}

            {id === 'rsi' && (
              <div className="settings-grid">
                <Field label="Periodo">
                  <input
                    type="number"
                    min={2}
                    max={50}
                    value={settings.rsi.period}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        rsi: {
                          ...settings.rsi,
                          period: Number(e.target.value),
                        },
                      })
                    }
                  />
                </Field>
                <Field label="Sobrecompra">
                  <input
                    type="number"
                    min={50}
                    max={95}
                    value={settings.rsi.overbought}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        rsi: {
                          ...settings.rsi,
                          overbought: Number(e.target.value),
                        },
                      })
                    }
                  />
                </Field>
                <Field label="Sobreventa">
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={settings.rsi.oversold}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        rsi: {
                          ...settings.rsi,
                          oversold: Number(e.target.value),
                        },
                      })
                    }
                  />
                </Field>
                <Field label="Grosor">
                  <select
                    value={settings.rsi.lineWidth}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        rsi: {
                          ...settings.rsi,
                          lineWidth: Number(e.target.value) as 1 | 2 | 3 | 4,
                        },
                      })
                    }
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </Field>
                <ColorField
                  label="Color"
                  value={settings.rsi.color}
                  onChange={(color) =>
                    onChange({
                      ...settings,
                      rsi: { ...settings.rsi, color },
                    })
                  }
                />
              </div>
            )}

            {id === 'macd' && (
              <div className="settings-grid">
                <Field label="Rápida">
                  <input
                    type="number"
                    min={2}
                    max={50}
                    value={settings.macd.fast}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        macd: {
                          ...settings.macd,
                          fast: Number(e.target.value),
                        },
                      })
                    }
                  />
                </Field>
                <Field label="Lenta">
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={settings.macd.slow}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        macd: {
                          ...settings.macd,
                          slow: Number(e.target.value),
                        },
                      })
                    }
                  />
                </Field>
                <Field label="Señal">
                  <input
                    type="number"
                    min={2}
                    max={50}
                    value={settings.macd.signal}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        macd: {
                          ...settings.macd,
                          signal: Number(e.target.value),
                        },
                      })
                    }
                  />
                </Field>
                <Field label="Grosor">
                  <select
                    value={settings.macd.lineWidth}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        macd: {
                          ...settings.macd,
                          lineWidth: Number(e.target.value) as 1 | 2 | 3 | 4,
                        },
                      })
                    }
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </Field>
                <ColorField
                  label="MACD"
                  value={settings.macd.macdColor}
                  onChange={(macdColor) =>
                    onChange({
                      ...settings,
                      macd: { ...settings.macd, macdColor },
                    })
                  }
                />
                <ColorField
                  label="Señal"
                  value={settings.macd.signalColor}
                  onChange={(signalColor) =>
                    onChange({
                      ...settings,
                      macd: { ...settings.macd, signalColor },
                    })
                  }
                />
                <ColorField
                  label="Hist +"
                  value={toHex(settings.macd.histUpColor, '#26a69a')}
                  onChange={(c) =>
                    onChange({
                      ...settings,
                      macd: {
                        ...settings.macd,
                        histUpColor: withAlpha(c, 0.7),
                      },
                    })
                  }
                />
                <ColorField
                  label="Hist −"
                  value={toHex(settings.macd.histDownColor, '#ef5350')}
                  onChange={(c) =>
                    onChange({
                      ...settings,
                      macd: {
                        ...settings.macd,
                        histDownColor: withAlpha(c, 0.7),
                      },
                    })
                  }
                />
              </div>
            )}

            {id === 'volumeProfile' && (
              <div className="settings-grid">
                <ColorField
                  label="Compra"
                  value={toHex(settings.volumeProfile.buyColor, '#26a69a')}
                  onChange={(c) =>
                    onChange({
                      ...settings,
                      volumeProfile: {
                        ...settings.volumeProfile,
                        buyColor: withAlpha(c, 0.55),
                      },
                    })
                  }
                />
                <ColorField
                  label="Venta"
                  value={toHex(settings.volumeProfile.sellColor, '#ef5350')}
                  onChange={(c) =>
                    onChange({
                      ...settings,
                      volumeProfile: {
                        ...settings.volumeProfile,
                        sellColor: withAlpha(c, 0.55),
                      },
                    })
                  }
                />
                <ColorField
                  label="POC"
                  value={toHex(settings.volumeProfile.pocColor, '#ffc107')}
                  onChange={(c) =>
                    onChange({
                      ...settings,
                      volumeProfile: {
                        ...settings.volumeProfile,
                        pocColor: withAlpha(c, 0.95),
                      },
                    })
                  }
                />
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      <input
        type="color"
        value={value.startsWith('#') ? value.slice(0, 7) : value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
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

function toHex(color: string, fallback: string): string {
  if (color.startsWith('#') && color.length >= 7) return color.slice(0, 7)
  const m = color.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)/i,
  )
  if (!m) return fallback
  const hex = (n: string) => Number(n).toString(16).padStart(2, '0')
  return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`
}
