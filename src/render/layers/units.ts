/** units — owner-coloured markers with a distinct silhouette per Color (red =
 *  square · gray = triangle · obsidian/howler = diamond · gold = circle ·
 *  yellow = cross · blue = inverted triangle) and a border that escalates with
 *  the owner's age (bondsman dark · initiate silver · peerless bright ·
 *  sovereign gold), so caste and veterancy both read at a glance. */
import { TILE, UNIT_PX } from '@/theme/palette'
import type { UnitKind } from '@/game/data/units'
import type { DrawLayer } from '../types'

/** Border colour by age index (0..3). */
const AGE_BORDER = ['rgba(0,0,0,0.55)', '#9B9B9B', '#D6D6D6', '#F1C900']

type Shape = 'square' | 'triangle' | 'invtriangle' | 'diamond' | 'circle' | 'cross'
const UNIT_SHAPE: Record<UnitKind, Shape> = {
  red: 'square',
  gray: 'triangle',
  obsidian: 'diamond',
  gold: 'circle',
  yellow: 'cross',
  blue: 'invtriangle',
  howler: 'diamond',
}

function shapePath(ctx: CanvasRenderingContext2D, shape: Shape, cx: number, cy: number, r: number): void {
  ctx.beginPath()
  switch (shape) {
    case 'square':
      ctx.rect(cx - r, cy - r, r * 2, r * 2)
      break
    case 'diamond':
      ctx.moveTo(cx, cy - r)
      ctx.lineTo(cx + r, cy)
      ctx.lineTo(cx, cy + r)
      ctx.lineTo(cx - r, cy)
      ctx.closePath()
      break
    case 'triangle':
      ctx.moveTo(cx, cy - r)
      ctx.lineTo(cx + r, cy + r)
      ctx.lineTo(cx - r, cy + r)
      ctx.closePath()
      break
    case 'invtriangle':
      ctx.moveTo(cx, cy + r)
      ctx.lineTo(cx + r, cy - r)
      ctx.lineTo(cx - r, cy - r)
      ctx.closePath()
      break
    case 'circle':
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      break
    case 'cross': {
      const t = r / 2.4
      ctx.rect(cx - r, cy - t, r * 2, t * 2)
      ctx.rect(cx - t, cy - r, t * 2, r * 2)
      break
    }
  }
}

export const drawUnits: DrawLayer = ({ ctx, cam, snap }) => {
  const r = UNIT_PX / 2
  for (const e of snap.entities) {
    if (e.etype !== 'unit') continue
    const tier = e.ageIndex ?? 0
    shapePath(ctx, UNIT_SHAPE[e.kind as UnitKind] ?? 'square', e.x * TILE, e.y * TILE, r)
    ctx.fillStyle = e.color
    ctx.fill()
    ctx.lineWidth = (tier > 0 ? 1.5 : 1) / cam.zoom
    ctx.strokeStyle = AGE_BORDER[tier] ?? AGE_BORDER[0]
    ctx.stroke()
  }
}
