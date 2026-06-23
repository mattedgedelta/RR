/** terrain — subtle region tints; only non-plain tiles paint (plain = board). */
import { TILE } from '@/theme/palette'
import type { TerrainKind } from '@/game/sim/map'
import type { DrawLayer } from '../types'

const FILL: Partial<Record<TerrainKind, string>> = {
  dust: '#0E0C0A',
  ridge: '#131313',
  crater: '#070707',
  rock: '#1C1C1C', // impassable — reads as a solid block
}

export const drawTerrain: DrawLayer = ({ ctx, cam, map }) => {
  const { x0, y0, x1, y1 } = cam.visibleTiles()
  const cx0 = Math.max(0, x0)
  const cy0 = Math.max(0, y0)
  const cx1 = Math.min(map.width, x1)
  const cy1 = Math.min(map.height, y1)

  for (let y = cy0; y < cy1; y++) {
    for (let x = cx0; x < cx1; x++) {
      const fill = FILL[map.tiles[y * map.width + x].terrain]
      if (!fill) continue
      ctx.fillStyle = fill
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE)
    }
  }
}
