/** selection — green ring around selected units, L-bracket corners on buildings. */
import { FC, TILE, UNIT_PX } from '@/theme/palette'
import type { DrawLayer } from '../types'

export const drawSelection: DrawLayer = ({ ctx, cam, snap, selected }) => {
  if (selected.size === 0) return
  ctx.save()
  ctx.strokeStyle = FC.accent
  ctx.lineWidth = 1.5 / cam.zoom

  for (const e of snap.entities) {
    if (!selected.has(e.id)) continue
    if (e.etype === 'unit') {
      ctx.beginPath()
      ctx.arc(e.x * TILE, e.y * TILE, UNIT_PX * 0.95, 0, Math.PI * 2)
      ctx.stroke()
    } else if (e.etype === 'building') {
      const x = e.x * TILE
      const y = e.y * TILE
      const w = e.w * TILE
      const h = e.h * TILE
      const len = Math.min(w, h) * 0.28
      bracket(ctx, x, y, len, len) // TL
      bracket(ctx, x + w, y, -len, len) // TR
      bracket(ctx, x, y + h, len, -len) // BL
      bracket(ctx, x + w, y + h, -len, -len) // BR
    }
  }
  ctx.restore()
}

/** One L-corner anchored at (x,y) extending by (dx,dy). */
function bracket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + dx, y)
  ctx.lineTo(x, y)
  ctx.lineTo(x, y + dy)
  ctx.stroke()
}
