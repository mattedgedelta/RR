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
import { findNearestTile, isPassable, tileAt } from '../map'
import { spawnUnit, DEFAULT_CARRY_CAPACITY, type Building, type Unit } from '../entities'
import type { ResourceKind } from '../../data/resources'
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
    if (b.rally) rallyUnit(world, u, b)
  }
}

/** Send a freshly spawned unit to its building's rally point — and if the rally
 *  sits on a resource (or own Farm) and the unit can gather, put it to work. */
function rallyUnit(world: World, u: Unit, b: Building): void {
  const rally = b.rally!
  const target = UNITS[u.kind].canGather ? gatherTargetAt(world, b.owner, rally.x, rally.y) : null
  if (target) {
    u.order = 'gather'
    u.gather = {
      resource: target.resource,
      nodeId: target.id,
      carrying: 0,
      capacity: DEFAULT_CARRY_CAPACITY,
      phase: 'toNode',
      dropOffId: null,
    }
    u.moveGoal = { x: target.cx, y: target.cy }
  } else {
    u.order = 'move'
    u.moveGoal = { x: rally.x, y: rally.y }
  }
  u.path = null
}

/** A gatherable at tile (x,y): a resource node, or one of the owner's Farms. */
function gatherTargetAt(
  world: World,
  owner: number,
  x: number,
  y: number,
): { id: number; resource: ResourceKind; cx: number; cy: number } | null {
  const t = tileAt(world.map, Math.floor(x), Math.floor(y))
  if (!t || t.occupantId == null) return null
  const node = world.resources.get(t.occupantId)
  if (node && node.amount > 0) return { id: node.id, resource: node.resource, cx: node.x + 0.5, cy: node.y + 0.5 }
  const farm = world.buildings.get(t.occupantId)
  if (farm && farm.kind === 'farm' && farm.owner === owner) {
    return { id: farm.id, resource: 'grain', cx: farm.x + farm.w / 2, cy: farm.y + farm.h / 2 }
  }
  return null
}

/** Nearest passable tile to the building's centre (units don't occupy tiles). */
function spawnSpot(world: World, b: Building): { x: number; y: number } | null {
  const cx = Math.floor(b.x + b.w / 2)
  const cy = Math.floor(b.y + b.h / 2)
  return findNearestTile(world.map, cx, cy, (x, y) => isPassable(world.map, x, y), 5)
}
