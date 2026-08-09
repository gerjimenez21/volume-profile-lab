import {
  ArrowPathRoundedSquareIcon,
  ArrowsPointingOutIcon,
  CursorArrowRaysIcon,
  MinusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
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

const TOOLS: Array<{
  id: DrawingTool
  title: string
  Icon: typeof CursorArrowRaysIcon
}> = [
  { id: 'cursor', title: 'Seleccionar / mover', Icon: CursorArrowRaysIcon },
  { id: 'hline', title: 'Línea horizontal', Icon: MinusIcon },
  {
    id: 'trend',
    title: 'Línea de tendencia',
    Icon: ArrowPathRoundedSquareIcon,
  },
  { id: 'rect', title: 'Rectángulo', Icon: ArrowsPointingOutIcon },
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
      {TOOLS.map(({ id, title, Icon }) => (
        <button
          key={id}
          type="button"
          title={title}
          className={tool === id ? 'active' : undefined}
          onClick={() => onChange(id)}
        >
          <Icon />
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
        <TrashIcon />
      </button>
    </aside>
  )
}
