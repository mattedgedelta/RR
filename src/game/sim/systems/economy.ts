/**
 * economy.ts — the Pioneer gather loop, resource accrual, rate tracking, and
 * idle detection.
 *
 * Gather is a four-phase state machine driven by proximity (not exact arrival,
 * since workers stand *next to* a node/drop-off, never on it):
 *   toNode → gathering → toDropOff → depositing → toNode …
 * Accrual applies the owner House's gather modifier (Mars Reds +25%). Banked
 * resources are credited to the trailing-window RateTracker so the HUD's ▲rate
 * reflects real income. Idle workers (order = idle) are listed per player for
 * the IdleBadge. Population is maintained by the spawn/cleanup paths, not here.
 */
import { UNITS } from '../../data/units'
import { BUILDINGS, acceptsDropOff } from '../../data/buildings'
import { HOUSES } from '../../data/houses'
import type { Unit, GatherState, Building, ResourceNode } from '../entities'
import type { World } from '../world'

/** Reach to a node centre at which a worker can harvest (tiles). */
const GATHER_RANGE = 1.8
/** Resource units harvested per tick before House modifiers (≈1.5/sec). */
const GATHER_PER_TICK = 0.15
/** Padding added to a building's half-footprint for the deposit reach. */
const DROPOFF_PAD = 1.4

export function runEconomy(world: World): void {
  for (const p of world.players) p.idleUnitIds.length = 0

  for (const u of world.units.values()) {
    if (!UNITS[u.kind].canGather) continue
    if (u.order === 'gather' && u.gather) {
      runGather(world, u, u.gather)
    } else if (u.order === 'idle') {
      world.players[u.owner].idleUnitIds.push(u.id)
    }
  }

  for (const p of world.players) p.rateTracker.tick()
}

/** A harvest source: a depleting resource node, or a renewable Farm building.
 *  `take` returns how much is actually harvested (and depletes a node). */
interface GatherSource {
  cx: number
  cy: number
  take: (want: number) => number
}

function sourceOf(world: World, id: number | null, owner: number): GatherSource | undefined {
  if (id == null) return undefined
  const node = world.resources.get(id)
  if (node && node.amount > 0) {
    return {
      cx: node.x + 0.5,
      cy: node.y + 0.5,
      take: (want) => {
        const t = Math.min(want, node.amount)
        node.amount -= t
        return t
      },
    }
  }
  const b = world.buildings.get(id)
  if (b && b.kind === 'farm' && b.owner === owner && b.state === 'complete') {
    return { cx: b.x + b.w / 2, cy: b.y + b.h / 2, take: (want) => want } // renewable
  }
  return undefined
}

function runGather(world: World, u: Unit, g: GatherState): void {
  const player = world.players[u.owner]
  switch (g.phase) {
    case 'toNode': {
      const src = sourceOf(world, g.nodeId, u.owner)
      if (!src) {
        retargetNode(world, u, g)
        return
      }
      if (distTo(u, src.cx, src.cy) <= GATHER_RANGE) {
        g.phase = 'gathering'
        u.moveGoal = null
        u.path = null
      } else if (!u.moveGoal) {
        sendTo(u, src.cx, src.cy)
      }
      break
    }

    case 'gathering': {
      const src = sourceOf(world, g.nodeId, u.owner)
      if (!src) {
        if (g.carrying > 0 && !startDropOff(world, u, g)) retargetNode(world, u, g)
        else if (g.carrying === 0) retargetNode(world, u, g)
        return
      }
      const mul = HOUSES[player.house].modifiers.gatherRate ?? 1
      const got = src.take(Math.min(GATHER_PER_TICK * mul, g.capacity - g.carrying))
      g.carrying += got
      if (g.carrying >= g.capacity - 1e-6 || got <= 0) {
        if (!startDropOff(world, u, g)) goIdle(u)
      }
      break
    }

    case 'toDropOff': {
      const b = buildingOf(world, g.dropOffId, u.owner)
      if (!b) {
        if (!startDropOff(world, u, g)) goIdle(u)
        return
      }
      if (nearBuilding(u, b)) {
        g.phase = 'depositing'
        u.moveGoal = null
        u.path = null
      } else if (!u.moveGoal) {
        sendTo(u, b.x + b.w / 2, b.y + b.h / 2)
      }
      break
    }

    case 'depositing': {
      if (g.carrying > 0) {
        player.resources[g.resource] += g.carrying
        player.rateTracker.record(g.resource, g.carrying)
        g.carrying = 0
      }
      const src = sourceOf(world, g.nodeId, u.owner)
      if (src) {
        g.phase = 'toNode'
        sendTo(u, src.cx, src.cy)
      } else {
        retargetNode(world, u, g)
      }
      break
    }
  }
}

// ── helpers ─────────────────────────────────────────────────────────────

function buildingOf(world: World, id: number | null, owner: number): Building | undefined {
  if (id == null) return undefined
  const b = world.buildings.get(id)
  return b && b.owner === owner && b.state === 'complete' ? b : undefined
}

/** Begin returning to the nearest valid drop-off; false if none exists. */
function startDropOff(world: World, u: Unit, g: GatherState): boolean {
  const b = nearestDropOff(world, u.owner, g.resource, u.x, u.y)
  if (!b) {
    g.dropOffId = null
    return false
  }
  g.dropOffId = b.id
  g.phase = 'toDropOff'
  sendTo(u, b.x + b.w / 2, b.y + b.h / 2)
  return true
}

/** Find another node of the same resource, else deposit / idle. */
function retargetNode(world: World, u: Unit, g: GatherState): void {
  const alt = nearestNode(world, u.x, u.y, g.resource)
  if (alt) {
    g.nodeId = alt.id
    g.phase = 'toNode'
    sendTo(u, alt.x + 0.5, alt.y + 0.5)
  } else if (g.carrying > 0 && startDropOff(world, u, g)) {
    // heading to drop off what we have
  } else {
    goIdle(u)
  }
}

function sendTo(u: Unit, x: number, y: number): void {
  u.moveGoal = { x, y }
  u.path = null
}

function goIdle(u: Unit): void {
  u.order = 'idle'
  u.gather = null
  u.moveGoal = null
  u.path = null
}

function distTo(u: Unit, x: number, y: number): number {
  return Math.hypot(u.x - x, u.y - y)
}

function nearBuilding(u: Unit, b: Building): boolean {
  const cx = b.x + b.w / 2
  const cy = b.y + b.h / 2
  return distTo(u, cx, cy) <= Math.max(b.w, b.h) / 2 + DROPOFF_PAD
}

function nearestNode(world: World, x: number, y: number, resource: string): ResourceNode | undefined {
  let best: ResourceNode | undefined
  let bestD = Infinity
  for (const n of world.resources.values()) {
    if (n.resource !== resource || n.amount <= 0) continue
    const d = (n.x - x) ** 2 + (n.y - y) ** 2
    if (d < bestD) {
      bestD = d
      best = n
    }
  }
  return best
}

function nearestDropOff(
  world: World,
  owner: number,
  resource: GatherState['resource'],
  x: number,
  y: number,
): Building | undefined {
  let best: Building | undefined
  let bestD = Infinity
  for (const b of world.buildings.values()) {
    if (b.owner !== owner || b.state !== 'complete') continue
    if (!acceptsDropOff(BUILDINGS[b.kind], resource)) continue
    const cx = b.x + b.w / 2
    const cy = b.y + b.h / 2
    const d = (cx - x) ** 2 + (cy - y) ** 2
    if (d < bestD) {
      bestD = d
      best = b
    }
  }
  return best
}
