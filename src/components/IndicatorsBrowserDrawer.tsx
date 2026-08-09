import { useMemo, useState } from 'react'
import {
  ChartBarIcon,
  ChartPieIcon,
  MagnifyingGlassIcon,
  PresentationChartLineIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {
  CATEGORY_LABELS,
  searchIndicators,
  type IndicatorCatalogItem,
  type IndicatorId,
} from '../lib/indicatorCatalog'
import type { IndicatorFlags } from '../lib/indicatorTypes'
import { Drawer } from './ui/Drawer'

interface Props {
  open: boolean
  onClose: () => void
  flags: IndicatorFlags
  onToggle: (id: IndicatorId) => void
  onOpenSettings: (id: IndicatorId) => void
}

type SidebarId = 'todos' | 'tecnicos' | 'volumen' | 'osciladores' | 'activos'

const SIDEBAR: Array<{
  id: SidebarId
  label: string
  icon: typeof ChartBarIcon
}> = [
  { id: 'todos', label: 'Datos técnicos', icon: ChartBarIcon },
  { id: 'volumen', label: 'Volumen', icon: ChartPieIcon },
  { id: 'osciladores', label: 'Osciladores', icon: PresentationChartLineIcon },
  { id: 'activos', label: 'En el gráfico', icon: ChartBarIcon },
]

function highlight(text: string, query: string) {
  if (!query.trim()) return text
  const q = query.trim()
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx < 0) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  )
}

export function IndicatorsBrowserDrawer({
  open,
  onClose,
  flags,
  onToggle,
  onOpenSettings,
}: Props) {
  const [query, setQuery] = useState('')
  const [sidebar, setSidebar] = useState<SidebarId>('todos')

  const results = useMemo(() => {
    let items = searchIndicators(query)
    if (sidebar === 'activos') {
      items = items.filter((i) => flags[i.id])
    } else if (sidebar !== 'todos') {
      items = items.filter((i) => i.category === sidebar)
    }
    return items
  }, [query, sidebar, flags])

  const grouped = useMemo(() => {
    const map = new Map<string, IndicatorCatalogItem[]>()
    for (const item of results) {
      const key = CATEGORY_LABELS[item.category]
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    return [...map.entries()]
  }, [results])

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Indicadores"
      ariaLabel="Indicadores, métricas y estrategias"
      width={520}
    >
      <div className="ind-browser">
        <div className="ind-search">
          <MagnifyingGlassIcon className="ind-search-icon" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar"
            autoFocus
          />
          {query && (
            <button
              type="button"
              className="tv-icon-btn"
              onClick={() => setQuery('')}
              aria-label="Limpiar búsqueda"
            >
              <XMarkIcon />
            </button>
          )}
        </div>

        <div className="ind-browser-layout">
          <nav className="ind-sidebar" aria-label="Categorías">
            {SIDEBAR.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  className={sidebar === item.id ? 'active' : undefined}
                  onClick={() => setSidebar(item.id)}
                >
                  <Icon />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="ind-results">
            {grouped.length === 0 && (
              <p className="ind-empty">Sin resultados para “{query}”</p>
            )}
            {grouped.map(([category, items]) => (
              <section key={category}>
                <h3>{category}</h3>
                <ul>
                  {items.map((item) => {
                    const active = flags[item.id]
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={active ? 'active' : undefined}
                          onClick={() => {
                            if (!active) onToggle(item.id)
                            onOpenSettings(item.id)
                          }}
                          onDoubleClick={() => onToggle(item.id)}
                          title={item.description}
                        >
                          <span className="ind-name">
                            {highlight(item.name, query)}
                          </span>
                          <span className="ind-short">{item.shortName}</span>
                          {active && <em className="ind-badge">Activo</em>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  )
}
