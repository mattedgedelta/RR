/**
 * construction.ts — advance building foundations toward completion.
 *
 * A foundation progresses while assigned builders (order = build, in range)
 * stand on it; more builders build faster. HP ramps from the 10% foundation
 * value to full as progress climbs. On completion the building flips to
 * `complete`, grants its population cap, and its builders are freed to idle.
 * Builders whose target has vanished are released.
 */
import { BUILDINGS } from '../../data/buildings'
import { TICK_HZ, type World } from '../world'
import type { Building, Unit } from '../entities'

/** Padding beyond a building's half-footprint within which a builder works. */
const BUILD_PAD = 1.4

export function runConstruction(world: World): void {
  for (const b of world.buildings.values()) {
    if (b.state === 'complete' || !b.construction) continue

    let workers = 0
    for (const id of b.construction.builders) {
      const u = world.units.get(id)
      if (!u || u.buildTargetId !== b.id || u.order !== 'build') continue
      if (inRange(u, b)) workers++
    }
    if (workers === 0) continue

    if (b.state === 'foundation') b.state = 'constructing'
    const def = BUILDINGS[b.kind]
    b.construction.progress = Math.min(1, b.construction.progress + workers / (def.buildTime * TICK_HZ))
    b.hp = Math.min(b.maxHp, Math.round(b.maxHp * (0.1 + 0.9 * b.construction.progress)))
    if (b.construction.progress >= 1) complete(world, b)
  }

  // Free builders whose foundation was destroyed/removed mid-build.
  for (const u of world.units.values()) {
    if (u.order === 'build' && u.buildTargetId != null && !world.buildings.has(u.buildTargetId)) {
      idle(u)
    }
  }
}

function complete(world: World, b: Building): void {
  b.state = 'complete'
  b.hp = b.maxHp
  b.construction = null
  world.players[b.owner].popCap += BUILDINGS[b.kind].popProvided
  for (const u of world.units.values()) {
    if (u.buildTargetId === b.id) idle(u)
  }
}

function inRange(u: Unit, b: Building): boolean {
  const cx = b.x + b.w / 2
  const cy = b.y + b.h / 2
  return Math.hypot(u.x - cx, u.y - cy) <= Math.max(b.w, b.h) / 2 + BUILD_PAD
}

function idle(u: Unit): void {
  u.order = 'idle'
  u.buildTargetId = null
  u.moveGoal = null
  u.path = null
}
