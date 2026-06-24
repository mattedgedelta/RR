/** units — owner-coloured squares; the border escalates with the owner's age
 *  (bondsman = dark · initiate = silver · peerless = bright · sovereign = gold)
 *  so veteran-age armies read at a glance. */
import { TILE, UNIT_PX } from '@/theme/palette'
import type { DrawLayer } from '../types'

/** Border colour by age index (0..3). */
const AGE_BORDER = ['rgba(0,0,0,0.55)', '#9B9B9B', '#D6D6D6', '#F1C900']

export const drawUnits: DrawLayer = ({ ctx, cam, snap }) => {
  const s = UNIT_PX
  for (const e of snap.entities) {
    if (e.etype !== 'unit') continue
    const x = e.x * TILE - s / 2
    const y = e.y * TILE - s / 2
    const tier = e.ageIndex ?? 0
    ctx.fillStyle = e.color
    ctx.fillRect(x, y, s, s)
    ctx.lineWidth = (tier > 0 ? 1.5 : 1) / cam.zoom
    ctx.strokeStyle = AGE_BORDER[tier] ?? AGE_BORDER[0]
    ctx.strokeRect(x, y, s, s)
  }
}
