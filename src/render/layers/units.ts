/** units — owner-coloured markers with a distinct shape per kind (pioneer =
 *  square · obsidian = triangle · howler = diamond) and a border that escalates
 *  with the owner's age (bondsman dark · initiate silver · peerless bright ·
 *  sovereign gold), so unit type and veterancy both read at a glance. */
import { TILE, UNIT_PX } from '@/theme/palette'
import type { UnitKind } from '@/game/data/units'
import type { DrawLayer } from '../types'

/** Border colour by age index (0..3). */
const AGE_BORDER = ['rgba(0,0,0,0.55)', '#9B9B9B', '#D6D6D6', '#F1C900']

type Shape = 'square' | 'triangle' | 'diamond'
const UNIT_SHAPE: Record<UnitKind, Shape> = {
  pioneer: 'square',
  obsidian: 'triangle',
  howler: 'diamond',
}

function shapePath(ctx: CanvasRenderingContext2D, shape: Shape, cx: number, cy: number, r: number): void {
  ctx.beginPath()
  if (shape === 'square') {
    ctx.rect(cx - r, cy - r, r * 2, r * 2)
  } else if (shape === 'diamond') {
    ctx.moveTo(cx, cy - r)
    ctx.lineTo(cx + r, cy)
    ctx.lineTo(cx, cy + r)
    ctx.lineTo(cx - r, cy)
    ctx.closePath()
  } else {
    // up-pointing triangle
    ctx.moveTo(cx, cy - r)
    ctx.lineTo(cx + r, cy + r)
    ctx.lineTo(cx - r, cy + r)
    ctx.closePath()
  }
}

export const drawUnits: DrawLayer = ({ ctx, cam, snap }) => {
  const r = UNIT_PX / 2
  for (const e of snap.entities) {
    if (e.etype !== 'unit') continue
    const cx = e.x * TILE
    const cy = e.y * TILE
    const tier = e.ageIndex ?? 0
    shapePath(ctx, UNIT_SHAPE[e.kind as UnitKind] ?? 'square', cx, cy, r)
    ctx.fillStyle = e.color
    ctx.fill()
    ctx.lineWidth = (tier > 0 ? 1.5 : 1) / cam.zoom
    ctx.strokeStyle = AGE_BORDER[tier] ?? AGE_BORDER[0]
    ctx.stroke()
  }
}
