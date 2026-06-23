/** grid — the 26px tactical grid and the map boundary. */
import { FC, TILE } from '@/theme/palette'
import type { DrawLayer } from '../types'

export const drawGrid: DrawLayer = ({ ctx, cam, map }) => {
  const { x0, y0, x1, y1 } = cam.visibleTiles()
  const cx0 = Math.max(0, x0)
  const cy0 = Math.max(0, y0)
  const cx1 = Math.min(map.width, x1)
  const cy1 = Math.min(map.height, y1)

  ctx.lineWidth = 1 / cam.zoom
  ctx.strokeStyle = FC.grid
  ctx.beginPath()
  for (let x = cx0; x <= cx1; x++) {
    ctx.moveTo(x * TILE, cy0 * TILE)
    ctx.lineTo(x * TILE, cy1 * TILE)
  }
  for (let y = cy0; y <= cy1; y++) {
    ctx.moveTo(cx0 * TILE, y * TILE)
    ctx.lineTo(cx1 * TILE, y * TILE)
  }
  ctx.stroke()

  ctx.lineWidth = 2 / cam.zoom
  ctx.strokeStyle = FC.borderSoft
  ctx.strokeRect(0, 0, map.width * TILE, map.height * TILE)
}
