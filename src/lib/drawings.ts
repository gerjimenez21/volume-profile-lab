export type DrawingTool =
  | 'cursor'
  | 'hline'
  | 'trend'
  | 'rect'
  | 'trash'

export type Drawing =
  | {
      id: string
      type: 'hline'
      price: number
      color: string
      lineWidth: number
    }
  | {
      id: string
      type: 'trend'
      t1: number
      p1: number
      t2: number
      p2: number
      color: string
      lineWidth: number
    }
  | {
      id: string
      type: 'rect'
      t1: number
      p1: number
      t2: number
      p2: number
      color: string
      lineWidth: number
    }

export type ScreenPoint = { x: number; y: number }

export type ProjectedDrawing =
  | { drawing: Drawing; kind: 'hline'; y: number; width: number }
  | {
      drawing: Drawing
      kind: 'trend'
      x1: number
      y1: number
      x2: number
      y2: number
    }
  | {
      drawing: Drawing
      kind: 'rect'
      x1: number
      y1: number
      x2: number
      y2: number
    }

export function newDrawingId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const drawingsKey = (symbol: string) => `vplab.drawings.${symbol}`

export function loadDrawings(symbol: string): Drawing[] {
  try {
    const raw = localStorage.getItem(drawingsKey(symbol))
    if (!raw) return []
    const parsed = JSON.parse(raw) as Drawing[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveDrawings(symbol: string, drawings: Drawing[]) {
  localStorage.setItem(drawingsKey(symbol), JSON.stringify(drawings))
}

function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1
  const dy = y2 - y1
  if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1)
  const t = Math.max(
    0,
    Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)),
  )
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

/** Hit-test in screen space. Returns topmost match within threshold. */
export function hitTestDrawing(
  projected: ProjectedDrawing[],
  point: ScreenPoint,
  threshold = 8,
): Drawing | null {
  // Reverse so later drawings win.
  for (let i = projected.length - 1; i >= 0; i--) {
    const item = projected[i]
    if (item.kind === 'hline') {
      if (Math.abs(point.y - item.y) <= threshold) return item.drawing
    } else if (item.kind === 'trend') {
      if (
        distToSegment(point.x, point.y, item.x1, item.y1, item.x2, item.y2) <=
        threshold
      ) {
        return item.drawing
      }
    } else {
      const left = Math.min(item.x1, item.x2)
      const right = Math.max(item.x1, item.x2)
      const top = Math.min(item.y1, item.y2)
      const bottom = Math.max(item.y1, item.y2)
      const nearBorder =
        point.x >= left - threshold &&
        point.x <= right + threshold &&
        point.y >= top - threshold &&
        point.y <= bottom + threshold &&
        (Math.abs(point.x - left) <= threshold ||
          Math.abs(point.x - right) <= threshold ||
          Math.abs(point.y - top) <= threshold ||
          Math.abs(point.y - bottom) <= threshold ||
          (point.x >= left &&
            point.x <= right &&
            point.y >= top &&
            point.y <= bottom))
      if (nearBorder) return item.drawing
    }
  }
  return null
}

export function updateDrawing(
  drawings: Drawing[],
  id: string,
  patch: Partial<Drawing>,
): Drawing[] {
  return drawings.map((d) => {
    if (d.id !== id) return d
    return { ...d, ...patch } as Drawing
  })
}

export function removeDrawing(drawings: Drawing[], id: string): Drawing[] {
  return drawings.filter((d) => d.id !== id)
}

export function moveDrawing(
  drawing: Drawing,
  deltaTime: number,
  deltaPrice: number,
): Drawing {
  if (drawing.type === 'hline') {
    return { ...drawing, price: drawing.price + deltaPrice }
  }
  return {
    ...drawing,
    t1: drawing.t1 + deltaTime,
    t2: drawing.t2 + deltaTime,
    p1: drawing.p1 + deltaPrice,
    p2: drawing.p2 + deltaPrice,
  }
}

export function drawingLabel(d: Drawing): string {
  if (d.type === 'hline') return 'Línea horizontal'
  if (d.type === 'trend') return 'Tendencia'
  return 'Rectángulo'
}
