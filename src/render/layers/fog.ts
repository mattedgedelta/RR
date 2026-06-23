/** fog — darkens tiles player 0 can't currently see: opaque black for unseen,
 *  a translucent veil for explored-but-not-visible. Visible tiles are untouched. */
import { TILE } from '@/theme/palette'
import type { DrawLayer } from '../types'

export const drawFog: DrawLayer = ({ ctx, cam, map, snap }) => {
  const fog = snap.fog
  if (fog.length === 0) return
  const { x0, y0, x1, y1 } = cam.visibleTiles()
  const cx0 = Math.max(0, x0)
  const cy0 = Math.max(0, y0)
  const cx1 = Math.min(map.width, x1)
  const cy1 = Math.min(map.height, y1)

  for (let y = cy0; y < cy1; y++) {
    for (let x = cx0; x < cx1; x++) {
      const v = fog[y * map.width + x]
      if (v === 2) continue // visible — no veil
      ctx.fillStyle = v === 1 ? 'rgba(6,6,6,0.6)' : '#060606'
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE)
    }
  }
}
