/**
 * HitTest.ts — turn pointer input into entity selections.
 *
 * Built fresh from a Snapshot each interaction (cheap — pointer events are rare
 * relative to frames). A coarse spatial hash buckets entities by tile cell so
 * box-select scales past hundreds of units without scanning the whole list.
 * `pickAt` prefers units over the building/resource beneath them, matching RTS
 * expectation; `selectInRect` returns only the requested owner's units (you box
 * your own army, not the enemy's).
 */
import type { PlayerId } from '@/game/data/players'
import type { EntityId } from '@/game/sim/entities'
import type { RenderEntity, Snapshot } from '@/game/sim/snapshot'
import type { Camera } from './Camera'
import type { ScreenRect } from './types'

/** Cell size (tiles) for the spatial hash bucketing. */
const CELL = 4
/** Click pick radius for units, in tiles. */
const UNIT_PICK_R = 0.45

export class HitTest {
  private readonly buckets = new Map<number, RenderEntity[]>()
  private readonly cols: number

  constructor(private readonly snap: Snapshot) {
    this.cols = Math.max(1, Math.ceil(snap.mapW / CELL))
    for (const e of snap.entities) {
      const key = this.cellKey(e.x, e.y)
      const arr = this.buckets.get(key)
      if (arr) arr.push(e)
      else this.buckets.set(key, [e])
    }
  }

  private cellKey(tileX: number, tileY: number): number {
    const cx = Math.floor(tileX / CELL)
    const cy = Math.floor(tileY / CELL)
    return cy * this.cols + cx
  }

  /** Pick the topmost entity at a screen point (units > buildings > resources). */
  pickAt(cam: Camera, sx: number, sy: number): RenderEntity | null {
    const { x, y } = cam.screenToTile(sx, sy)

    let bestUnit: RenderEntity | null = null
    let bestUnitD = UNIT_PICK_R * UNIT_PICK_R
    let building: RenderEntity | null = null
    let resource: RenderEntity | null = null

    // Scan the 3×3 block of cells around the cursor.
    const cx = Math.floor(x / CELL)
    const cy = Math.floor(y / CELL)
    for (let gy = cy - 1; gy <= cy + 1; gy++) {
      for (let gx = cx - 1; gx <= cx + 1; gx++) {
        const arr = this.buckets.get(gy * this.cols + gx)
        if (!arr) continue
        for (const e of arr) {
          if (e.etype === 'unit') {
            const dx = e.x - x
            const dy = e.y - y
            const d = dx * dx + dy * dy
            if (d <= bestUnitD) {
              bestUnitD = d
              bestUnit = e
            }
          } else if (e.etype === 'building') {
            if (x >= e.x && x < e.x + e.w && y >= e.y && y < e.y + e.h) building = e
          } else if (Math.floor(x) === e.x && Math.floor(y) === e.y) {
            resource = e
          }
        }
      }
    }
    return bestUnit ?? building ?? resource
  }

  /** Own units whose centre falls inside a screen-space rectangle. */
  selectInRect(cam: Camera, rect: ScreenRect, owner: PlayerId): EntityId[] {
    const tl = cam.screenToTile(rect.x, rect.y)
    const br = cam.screenToTile(rect.x + rect.w, rect.y + rect.h)
    const x0 = Math.min(tl.x, br.x)
    const x1 = Math.max(tl.x, br.x)
    const y0 = Math.min(tl.y, br.y)
    const y1 = Math.max(tl.y, br.y)

    const ids: EntityId[] = []
    for (const e of this.snap.entities) {
      if (e.etype !== 'unit' || e.owner !== owner) continue
      if (e.x >= x0 && e.x <= x1 && e.y >= y0 && e.y <= y1) ids.push(e.id)
    }
    return ids
  }
}

/** Pixel distance between two screen points (drag threshold helper). */
export const dist2 = (ax: number, ay: number, bx: number, by: number): number =>
  (ax - bx) * (ax - bx) + (ay - by) * (ay - by)

/** Normalise two screen points into a positive-area rectangle. */
export function rectFromPoints(ax: number, ay: number, bx: number, by: number): ScreenRect {
  return {
    x: Math.min(ax, bx),
    y: Math.min(ay, by),
    w: Math.abs(ax - bx),
    h: Math.abs(ay - by),
  }
}
