/**
 * production.ts — advance train queues and spawn finished units.
 *
 * Each complete building with a queue ticks its head item down (House
 * production-speed modifiers, e.g. Mars Kennel +40%, make it faster). When an
 * item finishes it spawns on a free tile beside the building — gated on the
 * population cap (the slot was reserved at enqueue, but a lost pop-provider can
 * still leave no room, so we hold rather than overflow) and on there being a
 * free spawn tile. A rally point sends the new unit on its way.
 */
import { UNITS } from '../../data/units'
import { HOUSES } from '../../data/houses'
import { findNearestTile, isPassable } from '../map'
import { spawnUnit, type Building } from '../entities'
import type { World } from '../world'

export function runProduction(world: World): void {
  for (const b of world.buildings.values()) {
    if (b.state !== 'complete' || b.queue.length === 0) continue

    const head = b.queue[0]
    const rate = HOUSES[world.players[b.owner].house].modifiers.productionRateMul[b.kind] ?? 1
    if (head.remaining > 0) head.remaining -= rate
    if (head.remaining > 0) continue

    const def = UNITS[head.unit]
    const player = world.players[b.owner]
    if (player.pop + def.pop > player.popCap) continue // pop full → hold

    const spot = spawnSpot(world, b)
    if (!spot) continue // no free tile → hold

    const u = spawnUnit(world, head.unit, b.owner, spot.x + 0.5, spot.y + 0.5)
    b.queue.shift()
    if (b.rally) {
      u.order = 'move'
      u.moveGoal = { x: b.rally.x, y: b.rally.y }
      u.path = null
    }
  }
}

/** Nearest passable tile to the building's centre (units don't occupy tiles). */
function spawnSpot(world: World, b: Building): { x: number; y: number } | null {
  const cx = Math.floor(b.x + b.w / 2)
  const cy = Math.floor(b.y + b.h / 2)
  return findNearestTile(world.map, cx, cy, (x, y) => isPassable(world.map, x, y), 5)
}
