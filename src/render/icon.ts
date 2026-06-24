/**
 * icon.ts — draw a theme Icon glyph onto the canvas via Path2D.
 *
 * The icons are 24×24 stroked Lucide paths (shared with the React `<Icon>`).
 * Path2D objects are cached per icon name. Stroke width is compensated for the
 * camera zoom and the glyph scale so it stays ~constant on screen.
 */
import { ICON_PATHS, type IconName } from '@/theme/icons'

const cache = new Map<IconName, Path2D[]>()

function pathsFor(name: IconName): Path2D[] {
  let ps = cache.get(name)
  if (!ps) {
    ps = ICON_PATHS[name].map((d) => new Path2D(d))
    cache.set(name, ps)
  }
  return ps
}

/** Stroke `name` centred at (cx,cy) in world px, fitting a `size`-px box. */
export function drawIcon(
  ctx: CanvasRenderingContext2D,
  name: IconName,
  cx: number,
  cy: number,
  size: number,
  color: string,
  zoom: number,
): void {
  const sc = size / 24
  ctx.save()
  ctx.translate(cx - size / 2, cy - size / 2)
  ctx.scale(sc, sc)
  ctx.strokeStyle = color
  ctx.lineWidth = 1.4 / zoom / sc // ~1.4 screen px regardless of zoom/size
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const p of pathsFor(name)) ctx.stroke(p)
  ctx.restore()
}
