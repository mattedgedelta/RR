/** units — owner-coloured squares centred on the unit's tile position. */
import { TILE, UNIT_PX } from '@/theme/palette'
import type { DrawLayer } from '../types'

export const drawUnits: DrawLayer = ({ ctx, cam, snap }) => {
  const s = UNIT_PX
  ctx.lineWidth = 1 / cam.zoom
  for (const e of snap.entities) {
    if (e.etype !== 'unit') continue
    const x = e.x * TILE - s / 2
    const y = e.y * TILE - s / 2
    ctx.fillStyle = e.color
    ctx.fillRect(x, y, s, s)
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'
    ctx.strokeRect(x, y, s, s)
  }
}
