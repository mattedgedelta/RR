/** buildings — footprint cell with an owner-colour border and the building's
 *  own icon glyph (so each building type reads distinctly). In-construction
 *  buildings render dimmed with a dashed border. */
import { FC, TILE } from '@/theme/palette'
import { BUILDING_ICON, type BuildingKind } from '@/game/data/buildings'
import { drawIcon } from '../icon'
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
    // Border (owner colour; dashed while building).
    ctx.lineWidth = 2 / cam.zoom
    ctx.strokeStyle = e.color
    if (constructing) ctx.setLineDash([6 / cam.zoom, 4 / cam.zoom])
    ctx.strokeRect(x, y, w, h)
    ctx.setLineDash([])
    // The building's own glyph, centred.
    ctx.globalAlpha = constructing ? 0.4 : 1
    drawIcon(ctx, BUILDING_ICON[e.kind as BuildingKind], x + w / 2, y + h / 2, Math.min(w, h) * 0.62, e.color, cam.zoom)
    ctx.restore()
  }
}
