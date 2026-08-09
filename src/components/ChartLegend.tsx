import {
  Cog6ToothIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {
  formatIndicatorLegend,
  type IndicatorId,
} from '../lib/indicatorCatalog'
import type { IndicatorFlags, IndicatorSettings } from '../lib/indicatorTypes'

interface Props {
  flags: IndicatorFlags
  hidden: Partial<Record<IndicatorId, boolean>>
  settings: IndicatorSettings
  selectedId: IndicatorId | null
  onSelect: (id: IndicatorId | null) => void
  onToggleHidden: (id: IndicatorId) => void
  onEdit: (id: IndicatorId) => void
  onRemove: (id: IndicatorId) => void
}

const ORDER: IndicatorId[] = [
  'bollinger',
  'volume',
  'volumeProfile',
  'rsi',
  'macd',
]

export function ChartLegend({
  flags,
  hidden,
  settings,
  selectedId,
  onSelect,
  onToggleHidden,
  onEdit,
  onRemove,
}: Props) {
  const active = ORDER.filter((id) => flags[id])
  if (active.length === 0) return null

  return (
    <div className="chart-legend" aria-label="Indicadores activos">
      {active.map((id) => {
        const isHidden = Boolean(hidden[id])
        const isSelected = selectedId === id
        return (
          <div
            key={id}
            role="button"
            tabIndex={0}
            className={`chart-legend-item ${isHidden ? 'is-hidden' : ''} ${isSelected ? 'is-selected' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(isSelected ? null : id)
            }}
            onDoubleClick={(e) => {
              e.stopPropagation()
              onSelect(id)
              onEdit(id)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(isSelected ? null : id)
              }
            }}
          >
            <span className="chart-legend-label">
              {formatIndicatorLegend(id, settings)}
            </span>
            <div
              className="chart-legend-actions"
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                title={isHidden ? 'Mostrar' : 'Ocultar'}
                onClick={() => onToggleHidden(id)}
              >
                {isHidden ? <EyeSlashIcon /> : <EyeIcon />}
              </button>
              <button
                type="button"
                title="Ajustes"
                onClick={() => {
                  onSelect(id)
                  onEdit(id)
                }}
              >
                <Cog6ToothIcon />
              </button>
              <button
                type="button"
                title="Quitar"
                onClick={() => onRemove(id)}
              >
                <XMarkIcon />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
