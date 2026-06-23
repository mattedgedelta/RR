/**
 * combat.ts — target acquisition, approach, and attacks.
 *
 * A unit fights when ordered (attack / attackMove) or, if it's a military unit
 * sitting idle, when an enemy wanders into its line of sight (defensive stance);
 * workers only fight when explicitly ordered. Only non-allied players are valid
 * targets (resource nodes never are). In range: attack on cooldown for
 * `max(1, attack − armor)` (pierce armor vs. ranged, melee armor vs. melee).
 * Out of range: chase by repointing `moveGoal` (throttled so we don't repath
 * every tick). Damage to a player's entity raises a throttled `underAttack`
 * event (one per player per tick) carrying the map quadrant for the HUD.
 *
 * Death/destruction is handled by `cleanup` in tick.ts once hp hits 0.
 */
import { UNITS, type UnitDef } from '../../data/units'
import { BUILDINGS } from '../../data/buildings'
import { getEntity, areAllied, quadrantOf, TICK_HZ, type World } from '../world'
import type { Entity, Unit } from '../entities'

export function runCombat(world: World): void {
  const alerted = new Set<number>() // players that already got an event this tick
  for (const u of world.units.values()) {
    if (u.cooldown > 0) u.cooldown--
    fight(world, u, alerted)
  }
}

function fight(world: World, u: Unit, alerted: Set<number>): void {
  const def = UNITS[u.kind]

  // Resolve / validate the current target.
  let target = u.attackTargetId != null ? getEntity(world, u.attackTargetId) : undefined
  if (target && (target.etype === 'resource' || areAllied(world, u.owner, target.owner))) {
    target = undefined
  }

  const military = def.role !== 'worker'

  // Acquire if we have none and we're allowed to engage.
  if (!target) {
    if (u.order === 'attack' || u.order === 'attackMove' || (u.order === 'idle' && military)) {
      target = acquire(world, u, def.los) // ordered units / idle soldiers scan full LOS
      u.attackTargetId = target ? target.id : null
    } else if (u.order === 'idle') {
      target = acquire(world, u, WORKER_DEFEND_RANGE) // idle workers retaliate only at arm's length
      u.attackTargetId = target ? target.id : null
    }
  }

  if (!target) {
    // Lost our target mid-attack → fall idle (attackMove keeps moving via movement).
    if (u.order === 'attack') {
      u.order = 'idle'
      u.moveGoal = null
      u.path = null
    }
    return
  }

  const reach = def.range + 1.0
  if (distToTarget(u, target) <= reach) {
    u.moveGoal = null // in range — stop and fight
    u.path = null
    if (u.cooldown <= 0) {
      strike(world, def, target, alerted)
      u.cooldown = Math.max(1, Math.round(def.attackCooldown * TICK_HZ))
    }
  } else if (u.order === 'idle' && !military) {
    // A worker won't leave its post to chase — drop the target and stay put.
    u.attackTargetId = null
  } else {
    // Chase: repoint toward the target, but only repath when it has drifted.
    const tp = targetPos(target)
    if (!u.path || !u.moveGoal || dist2(u.moveGoal.x, u.moveGoal.y, tp.x, tp.y) > 1) {
      u.moveGoal = tp
      u.path = null
    }
    if (u.order === 'idle') u.order = 'attack'
  }
}

/** How close an enemy must be for an idle worker to swing back (tiles). */
const WORKER_DEFEND_RANGE = 1.6

function strike(world: World, def: UnitDef, target: Entity, alerted: Set<number>): void {
  if (target.etype === 'resource') return
  const armorDef = target.etype === 'building' ? BUILDINGS[target.kind] : UNITS[target.kind]
  const armor = def.range > 0 ? armorDef.pierceArmor : armorDef.meleeArmor
  target.hp -= Math.max(1, def.attack - armor)

  const owner = target.owner
  if (!alerted.has(owner)) {
    alerted.add(owner)
    const p = targetPos(target)
    world.events.push({ type: 'underAttack', player: owner, x: p.x, y: p.y, quadrant: quadrantOf(world, p.x, p.y) })
  }
}

/** Nearest non-allied unit/building within `los` tiles, or undefined. */
function acquire(world: World, u: Unit, los: number): Entity | undefined {
  let best: Entity | undefined
  let bestD = los * los
  for (const e of world.units.values()) {
    if (e.owner === u.owner || areAllied(world, u.owner, e.owner)) continue
    const d = (e.x - u.x) ** 2 + (e.y - u.y) ** 2
    if (d < bestD) {
      bestD = d
      best = e
    }
  }
  for (const b of world.buildings.values()) {
    if (areAllied(world, u.owner, b.owner)) continue
    const d = (b.x + b.w / 2 - u.x) ** 2 + (b.y + b.h / 2 - u.y) ** 2
    if (d < bestD) {
      bestD = d
      best = b
    }
  }
  return best
}

function distToTarget(u: Unit, target: Entity): number {
  if (target.etype === 'building') {
    const nx = Math.max(target.x, Math.min(target.x + target.w, u.x))
    const ny = Math.max(target.y, Math.min(target.y + target.h, u.y))
    return Math.hypot(u.x - nx, u.y - ny)
  }
  return Math.hypot(u.x - target.x, u.y - target.y)
}

function targetPos(target: Entity): { x: number; y: number } {
  if (target.etype === 'building') return { x: target.x + target.w / 2, y: target.y + target.h / 2 }
  return { x: target.x, y: target.y }
}

const dist2 = (ax: number, ay: number, bx: number, by: number): number =>
  (ax - bx) ** 2 + (ay - by) ** 2
