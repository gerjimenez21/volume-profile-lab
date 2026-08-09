import type { DrawingTool } from '../lib/drawings'

interface Props {
  tool: DrawingTool
  onChange: (tool: DrawingTool) => void
  onClearAll: () => void
  onDeleteSelected: () => void
  hasSelection: boolean
  drawColor: string
  onColorChange: (color: string) => void
}

const TOOLS: Array<{ id: DrawingTool; label: string; title: string }> = [
  { id: 'cursor', label: '↖', title: 'Seleccionar / mover' },
  { id: 'hline', label: '―', title: 'Línea horizontal' },
  { id: 'trend', label: '/', title: 'Línea de tendencia' },
  { id: 'rect', label: '▭', title: 'Rectángulo' },
]

export function DrawingToolbar({
  tool,
  onChange,
  onClearAll,
  onDeleteSelected,
  hasSelection,
  drawColor,
  onColorChange,
}: Props) {
  return (
    <aside className="draw-toolbar" aria-label="Herramientas de dibujo">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          type="button"
          title={t.title}
          className={tool === t.id ? 'active' : undefined}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
      <label className="draw-color" title="Color de dibujo nuevo">
        <input
          type="color"
          value={drawColor}
          onChange={(e) => onColorChange(e.target.value)}
        />
      </label>
      <button
        type="button"
        title={
          hasSelection
            ? 'Borrar seleccionado (Delete)'
            : 'Borrar todos los dibujos'
        }
        className="danger"
        onClick={() => {
          if (hasSelection) onDeleteSelected()
          else onClearAll()
        }}
      >
        ⌫
      </button>
    </aside>
  )
}
