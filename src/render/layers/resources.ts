/** resources — dim diamond markers; opacity tracks remaining amount. */
import { TILE } from '@/theme/palette'
import type { DrawLayer } from '../types'

export const drawResources: DrawLayer = ({ ctx, snap }) => {
  for (const e of snap.entities) {
    if (e.etype !== 'resource') continue
    const cx = (e.x + 0.5) * TILE
    const cy = (e.y + 0.5) * TILE
    const r = TILE * 0.32
    ctx.save()
    ctx.globalAlpha = 0.3 + 0.5 * (e.amount01 ?? 1)
    ctx.fillStyle = e.color
    ctx.beginPath()
    ctx.moveTo(cx, cy - r)
    ctx.lineTo(cx + r, cy)
    ctx.lineTo(cx, cy + r)
    ctx.lineTo(cx - r, cy)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
}
