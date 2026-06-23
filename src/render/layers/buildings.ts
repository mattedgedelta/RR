/** buildings — footprint cell with an owner-colour border + inner accent block.
 *  In-construction buildings render dimmed with a dashed border. */
import { FC, TILE } from '@/theme/palette'
import type { DrawLayer } from '../types'

export const drawBuildings: DrawLayer = ({ ctx, cam, snap }) => {
  const inset = 3 / cam.zoom
  for (const e of snap.entities) {
    if (e.etype !== 'building') continue
    const constructing = e.state !== undefined && e.state !== 'complete'
    const x = e.x * TILE + inset
    const y = e.y * TILE + inset
    const w = e.w * TILE - inset * 2
    const h = e.h * TILE - inset * 2

    ctx.save()
    // Body.
    ctx.globalAlpha = constructing ? 0.45 : 1
    ctx.fillStyle = FC.card
    ctx.fillRect(x, y, w, h)
    // Owner-colour inner block.
    ctx.globalAlpha = constructing ? 0.18 : 0.34
    ctx.fillStyle = e.color
    const pad = Math.min(w, h) * 0.26
    ctx.fillRect(x + pad, y + pad, w - pad * 2, h - pad * 2)
    // Border.
    ctx.globalAlpha = 1
    ctx.lineWidth = 2 / cam.zoom
    ctx.strokeStyle = e.color
    if (constructing) ctx.setLineDash([6 / cam.zoom, 4 / cam.zoom])
    ctx.strokeRect(x, y, w, h)
    ctx.restore()
  }
}
