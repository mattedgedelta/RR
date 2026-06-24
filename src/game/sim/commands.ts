/**
 * commands.ts — the single mutation channel.
 *
 * Both the UI and the AI affect the world ONLY by dispatching typed Commands.
 * `dispatch` enqueues; `applyCommands` drains the queue at the top of each tick,
 * validates ownership/affordability/age-gates, charges resources, and writes
 * intents onto entities (orders, move goals, gather/attack targets, queues).
 * The per-system stubs then act on those intents in later phases.
 */
import type { UnitKind } from '../data/units'
import type { BuildingKind } from '../data/buildings'
import type { PlayerId } from '../data/players'
import type { Cost, ResourceKind } from '../data/resources'
import { UNITS } from '../data/units'
import { BUILDINGS } from '../data/buildings'
import { canAfford, addCost } from '../data/resources'
import { AGES, ageAtLeast } from '../data/ages'
import { HOUSES } from '../data/houses'
import { footprintBuildable } from './map'
import { placeBuilding, type EntityId, type Building, type Unit, type Vec2, type UnitStance } from './entities'
import {
  type World,
  type Player,
  getBuilding,
  getResource,
  getEntity,
  areAllied,
  secToTicks,
} from './world'

export type Command =
  | { type: 'move'; player: PlayerId; unitIds: EntityId[]; x: number; y: number; attackMove?: boolean }
  | { type: 'stop'; player: PlayerId; unitIds: EntityId[] }
  | { type: 'gather'; player: PlayerId; unitIds: EntityId[]; nodeId: EntityId }
  | { type: 'attack'; player: PlayerId; unitIds: EntityId[]; targetId: EntityId }
  | { type: 'build'; player: PlayerId; builderIds: EntityId[]; building: BuildingKind; x: number; y: number }
  | { type: 'train'; player: PlayerId; buildingId: EntityId; unit: UnitKind; count?: number }
  | { type: 'cancelTrain'; player: PlayerId; buildingId: EntityId; index: number }
  | { type: 'setRally'; player: PlayerId; buildingId: EntityId; x: number; y: number }
  | { type: 'setStance'; player: PlayerId; unitIds: EntityId[]; stance: UnitStance }
  | { type: 'delete'; player: PlayerId; ids: EntityId[] }
  | { type: 'advanceAge'; player: PlayerId }

/** Enqueue a command for application at the next tick. */
export function dispatch(world: World, cmd: Command): void {
  world.commandQueue.push(cmd)
}

// ── cost helpers ──────────────────────────────────────────────────────────

const charge = (p: Player, cost: Cost): void => void addCost(p.resources, cost, -1)
const refund = (p: Player, cost: Cost): void => void addCost(p.resources, cost, +1)

/** Building cost after House cost modifiers (e.g. Mars citadels −25%). */
function buildingCost(p: Player, kind: BuildingKind): Cost {
  const base = BUILDINGS[kind].cost
  const mul = HOUSES[p.house].modifiers.buildingCostMul[kind] ?? 1
  if (mul === 1) return base
  const out: Cost = {}
  for (const k of Object.keys(base) as (keyof Cost)[]) {
    out[k] = Math.round((base[k] as number) * mul)
  }
  return out
}

/** Population already promised to un-produced queue items for a player. */
function pendingPop(world: World, player: PlayerId): number {
  let n = 0
  for (const b of world.buildings.values()) {
    if (b.owner !== player) continue
    for (const item of b.queue) n += UNITS[item.unit].pop
  }
  return n
}

// ── intent writers ────────────────────────────────────────────────────────

/** Owned, alive units for this player from an id list. */
function ownedUnits(world: World, player: PlayerId, ids: EntityId[]): Unit[] {
  const out: Unit[] = []
  for (const id of ids) {
    const u = world.units.get(id)
    if (u && u.owner === player) out.push(u)
  }
  return out
}

function clearJob(u: Unit): void {
  u.gather = null
  u.buildTargetId = null
  u.attackTargetId = null
}

function center(b: Building): Vec2 {
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 }
}

// ── application ─────────────────────────────────────────────────────────────

/** Drain and apply every queued command for this tick. */
export function applyCommands(world: World): void {
  const queue = world.commandQueue
  if (queue.length === 0) return
  world.commandQueue = []
  for (const cmd of queue) apply(world, cmd)
}

function apply(world: World, cmd: Command): void {
  switch (cmd.type) {
    case 'move': {
      for (const u of ownedUnits(world, cmd.player, cmd.unitIds)) {
        clearJob(u)
        u.order = cmd.attackMove ? 'attackMove' : 'move'
        u.moveGoal = { x: cmd.x, y: cmd.y }
        u.path = null
      }
      break
    }
    case 'stop': {
      for (const u of ownedUnits(world, cmd.player, cmd.unitIds)) {
        clearJob(u)
        u.order = 'idle'
        u.moveGoal = null
        u.path = null
      }
      break
    }
    case 'gather': {
      // Target may be a resource node OR one of the player's own Farms (a
      // renewable grain source the worker harvests and carries to a drop-off).
      const node = getResource(world, cmd.nodeId)
      let resource: ResourceKind | null = null
      let gx = 0
      let gy = 0
      if (node) {
        resource = node.resource
        gx = node.x + 0.5
        gy = node.y + 0.5
      } else {
        const farm = getBuilding(world, cmd.nodeId)
        if (farm && farm.kind === 'farm' && farm.owner === cmd.player) {
          resource = 'grain'
          gx = farm.x + farm.w / 2
          gy = farm.y + farm.h / 2
        }
      }
      if (resource == null) break
      for (const u of ownedUnits(world, cmd.player, cmd.unitIds)) {
        if (!UNITS[u.kind].canGather) continue
        clearJob(u)
        u.order = 'gather'
        u.gather = {
          resource,
          nodeId: cmd.nodeId,
          carrying: 0,
          capacity: 10,
          phase: 'toNode',
          dropOffId: null,
        }
        u.moveGoal = { x: gx, y: gy }
        u.path = null
      }
      break
    }
    case 'attack': {
      const target = getEntity(world, cmd.targetId)
      if (!target || target.etype === 'resource') break
      if (areAllied(world, cmd.player, target.owner)) break
      for (const u of ownedUnits(world, cmd.player, cmd.unitIds)) {
        clearJob(u)
        u.order = 'attack'
        u.attackTargetId = target.id
        u.moveGoal = null
        u.path = null
      }
      break
    }
    case 'build': {
      const def = BUILDINGS[cmd.building]
      const p = world.players[cmd.player]
      if (!ageAtLeast(p.age, def.requiredAge)) break
      if (!footprintBuildable(world.map, cmd.x, cmd.y, def.footprint.w, def.footprint.h)) break
      const cost = buildingCost(p, cmd.building)
      if (!canAfford(p.resources, cost)) break
      charge(p, cost)
      const b = placeBuilding(world, cmd.building, cmd.player, cmd.x, cmd.y, false)
      const goal = center(b)
      for (const u of ownedUnits(world, cmd.player, cmd.builderIds)) {
        if (!UNITS[u.kind].canGather) continue // only workers build
        clearJob(u)
        u.order = 'build'
        u.buildTargetId = b.id
        u.moveGoal = goal
        u.path = null
        b.construction?.builders.push(u.id)
      }
      break
    }
    case 'train': {
      const b = getBuilding(world, cmd.buildingId)
      if (!b || b.owner !== cmd.player || b.state !== 'complete') break
      const def = BUILDINGS[b.kind]
      if (!def.produces.includes(cmd.unit)) break
      const udef = UNITS[cmd.unit]
      const p = world.players[cmd.player]
      if (!ageAtLeast(p.age, udef.requiredAge)) break
      // Unique units (e.g. the Howler) only for the House that owns them.
      if (udef.unique && !HOUSES[p.house].uniques.units.includes(cmd.unit)) break
      const count = Math.max(1, cmd.count ?? 1)
      for (let i = 0; i < count; i++) {
        if (!canAfford(p.resources, udef.cost)) break
        if (p.pop + pendingPop(world, cmd.player) + udef.pop > p.popCap) break
        charge(p, udef.cost)
        const ticks = secToTicks(udef.buildTime)
        b.queue.push({ unit: cmd.unit, remaining: ticks, total: ticks })
      }
      break
    }
    case 'cancelTrain': {
      const b = getBuilding(world, cmd.buildingId)
      if (!b || b.owner !== cmd.player) break
      const item = b.queue[cmd.index]
      if (!item) break
      refund(world.players[cmd.player], UNITS[item.unit].cost)
      b.queue.splice(cmd.index, 1)
      break
    }
    case 'setRally': {
      const b = getBuilding(world, cmd.buildingId)
      if (!b || b.owner !== cmd.player) break
      b.rally = { x: cmd.x, y: cmd.y }
      break
    }
    case 'setStance': {
      for (const u of ownedUnits(world, cmd.player, cmd.unitIds)) u.stance = cmd.stance
      break
    }
    case 'delete': {
      // Self-destruct owned units/buildings; cleanup() reclaims pop/cap/tiles.
      for (const id of cmd.ids) {
        const u = world.units.get(id)
        if (u && u.owner === cmd.player) {
          u.hp = 0
          continue
        }
        const b = world.buildings.get(id)
        if (b && b.owner === cmd.player) b.hp = 0
      }
      break
    }
    case 'advanceAge': {
      const p = world.players[cmd.player]
      if (p.ageProgress) break
      const advance = AGES[p.age].advance
      if (!advance) break
      if (!canAfford(p.resources, advance.cost)) break
      charge(p, advance.cost)
      const total = secToTicks(advance.time)
      p.ageProgress = { to: advance.to, remaining: total, total }
      break
    }
  }
}
