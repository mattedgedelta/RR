/**
 * Minimap.ts — pure draw fn for the minimap canvas.
 *
 * Scales the whole map into a small square: board fill, impassable rock blocks,
 * then entity dots in owner colour (buildings as small squares, units as pixels,
 * resources dim), and finally the current viewport rectangle. Click-to-pan is
 * handled by the hosting panel via `minimapToTile`.
 */
import { FC } from '@/theme/palette'
import type { GameMap } from '@/game/sim/map'
import type { Snapshot } from '@/game/sim/snapshot'

/** Visible viewport expressed as a tile-space rectangle. */
export interface MinimapView {
  x0: number
  y0: number
  x1: number
  y1: number
}

export function renderMinimap(
  ctx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
  dpr: number,
  map: GameMap,
  snap: Snapshot,
  view?: MinimapView,
): void {
  const sx = cssW / map.width
  const sy = cssH / map.height

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = FC.board
  ctx.fillRect(0, 0, cssW, cssH)

  // Impassable rock as faint blocks (the only terrain that reads at this scale).
  ctx.fillStyle = '#161616'
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.tiles[y * map.width + x].terrain === 'rock') {
        ctx.fillRect(x * sx, y * sy, Math.ceil(sx), Math.ceil(sy))
      }
    }
  }

  // Entity dots.
  for (const e of snap.entities) {
    if (e.etype === 'resource') {
      ctx.globalAlpha = 0.5
      ctx.fillStyle = e.color
      ctx.fillRect(e.x * sx, e.y * sy, Math.max(1, sx), Math.max(1, sy))
      ctx.globalAlpha = 1
    } else if (e.etype === 'building') {
      ctx.fillStyle = e.color
      ctx.fillRect(e.x * sx, e.y * sy, Math.max(2, e.w * sx), Math.max(2, e.h * sy))
    } else {
      ctx.fillStyle = e.color
      const s = Math.max(2, sx)
      ctx.fillRect(e.x * sx - s / 2, e.y * sy - s / 2, s, s)
    }
  }

  // Viewport rectangle.
  if (view) {
    ctx.strokeStyle = FC.text2
    ctx.lineWidth = 1
    const x = view.x0 * sx
    const y = view.y0 * sy
    ctx.strokeRect(x, y, (view.x1 - view.x0) * sx, (view.y1 - view.y0) * sy)
  }
}

/** Map a click at CSS px (cx,cy) on a (cssW×cssH) minimap to a tile coordinate. */
export function minimapToTile(
  map: GameMap,
  cssW: number,
  cssH: number,
  cx: number,
  cy: number,
): { x: number; y: number } {
  return { x: (cx / cssW) * map.width, y: (cy / cssH) * map.height }
}
