import {
  drawingLabel,
  type Drawing,
} from '../lib/drawings'

interface Props {
  drawing: Drawing | null
  onPatch: (id: string, patch: Partial<Drawing>) => void
  onDelete: (id: string) => void
  onDeselect: () => void
}

export function DrawingEditor({
  drawing,
  onPatch,
  onDelete,
  onDeselect,
}: Props) {
  if (!drawing) return null

  const hex = drawing.color.startsWith('#')
    ? drawing.color.slice(0, 7)
    : '#f5d76e'

  return (
    <div className="drawing-editor" role="region" aria-label="Editar dibujo">
      <strong>{drawingLabel(drawing)}</strong>
      <label title="Color">
        <input
          type="color"
          value={hex}
          onChange={(e) => onPatch(drawing.id, { color: e.target.value })}
        />
      </label>
      <label title="Grosor">
        Grosor
        <select
          value={Math.round(drawing.lineWidth)}
          onChange={(e) =>
            onPatch(drawing.id, { lineWidth: Number(e.target.value) })
          }
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
      </label>
      <button
        type="button"
        className="danger"
        onClick={() => onDelete(drawing.id)}
      >
        Borrar
      </button>
      <button type="button" onClick={onDeselect}>
        Listo
      </button>
    </div>
  )
}
