/** health — thin HP bar above any damaged unit/building (hp01 < 1). */
import { TILE, UNIT_PX } from '@/theme/palette'
import type { DrawLayer } from '../types'

const barColor = (f: number): string =>
  f > 0.5 ? '#00DA63' : f > 0.25 ? '#F1C900' : '#FE5F4D'

export const drawHealth: DrawLayer = ({ ctx, cam, snap }) => {
  const bh = 3 / cam.zoom
  for (const e of snap.entities) {
    if (e.etype === 'resource' || e.hp01 >= 1) continue

    let cx: number
    let top: number
    let bw: number
    if (e.etype === 'unit') {
      cx = e.x * TILE
      top = e.y * TILE - UNIT_PX
      bw = UNIT_PX * 1.6
    } else {
      cx = (e.x + e.w / 2) * TILE
      top = e.y * TILE - 6 / cam.zoom
      bw = e.w * TILE * 0.9
    }
    const x = cx - bw / 2
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(x, top, bw, bh)
    ctx.fillStyle = barColor(e.hp01)
    ctx.fillRect(x, top, bw * e.hp01, bh)
  }
}
