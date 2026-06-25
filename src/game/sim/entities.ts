/**
 * entities.ts — the entity model: typed discriminated-union records plus the
 * factories that create and register them.
 *
 * Three entity kinds, discriminated by `etype`:
 *   • Unit          — owned, mobile (pioneer / obsidian / howler)
 *   • Building       — owned, static, occupies a tile footprint
 *   • ResourceNode   — neutral, static, depletes by `amount`
 *
 * Positions are in TILE coordinates: units carry float centers; buildings and
 * resource nodes anchor to integer tiles (building `x,y` = top-left of its
 * footprint). Factories are pure of any RNG and only touch the World's pools,
 * id counter, and map occupancy — all sim-internal, all deterministic.
 */
import type { ResourceKind } from '../data/resources'
import type { UnitKind } from '../data/units'
import type { BuildingKind } from '../data/buildings'
import type { PlayerId } from '../data/players'
import { UNITS } from '../data/units'
import { BUILDINGS } from '../data/buildings'
import { HOUSES } from '../data/houses'
import { setOccupant, footprintTiles } from './map'
import type { World } from './world'

export type EntityId = number
export type EntityType = 'unit' | 'building' | 'resource'

export interface Vec2 {
  x: number
  y: number
}

/** Default resource a worker can carry before returning to drop-off. */
export const DEFAULT_CARRY_CAPACITY = 10

// ── unit ────────────────────────────────────────────────────────────────

export type UnitOrder =
  | 'idle'
  | 'move'
  | 'attackMove'
  | 'gather'
  | 'attack'
  | 'build'

/** Combat stance — how a unit reacts to nearby enemies when not under orders.
 *  aggressive: chase enemies in LOS · hold: attack only in range, never move ·
 *  passive: never auto-engage (attack only when explicitly ordered). */
export type UnitStance = 'aggressive' | 'hold' | 'passive'

export type GatherPhase = 'toNode' | 'gathering' | 'toDropOff' | 'depositing'

export interface GatherState {
  resource: ResourceKind
  nodeId: EntityId | null
  carrying: number
  capacity: number
  phase: GatherPhase
  dropOffId: EntityId | null
}

export interface Unit {
  etype: 'unit'
  id: EntityId
  owner: PlayerId
  kind: UnitKind
  x: number
  y: number
  hp: number
  maxHp: number
  order: UnitOrder
  /** Current movement goal in tile coords (null = stationary). */
  moveGoal: Vec2 | null
  /** Computed waypoint path (null = none / needs repath). */
  path: Vec2[] | null
  /** Index of the next waypoint in `path`. */
  pathStep: number
  /** Ticks until pathfinding may recompute (request budgeting). */
  repathCooldown: number
  /** Combat target entity id (unit or building), if attacking. */
  attackTargetId: EntityId | null
  /** Ticks until this unit may attack again. */
  cooldown: number
  /** Gather job state (workers only). */
  gather: GatherState | null
  /** Building under construction this worker is assigned to. */
  buildTargetId: EntityId | null
  /** Combat stance (military units; workers default passive). */
  stance: UnitStance
  /** Population slots this unit consumes. */
  pop: number
}

// ── building ──────────────────────────────────────────────────────────────

export type BuildingState = 'foundation' | 'constructing' | 'complete'

export interface ProductionItem {
  unit: UnitKind
  /** Ticks remaining to produce this item. */
  remaining: number
  /** Total ticks for this item (for progress bars). */
  total: number
}

export interface ConstructionState {
  /** Build progress 0..1. */
  progress: number
  /** Worker ids currently building. */
  builders: EntityId[]
}

export interface Building {
  etype: 'building'
  id: EntityId
  owner: PlayerId
  kind: BuildingKind
  /** Top-left tile of the footprint. */
  x: number
  y: number
  hp: number
  maxHp: number
  state: BuildingState
  /** Footprint in tiles (cached from def). */
  w: number
  h: number
  construction: ConstructionState | null
  /** Train queue (head is in progress). */
  queue: ProductionItem[]
  /** Rally point for produced units (null = spawn edge). */
  rally: Vec2 | null
  /** Garrisoned unit ids. */
  garrison: EntityId[]
}

// ── resource node ───────────────────────────────────────────────────────

export interface ResourceNode {
  etype: 'resource'
  id: EntityId
  resource: ResourceKind
  x: number
  y: number
  /** Remaining harvestable amount. */
  amount: number
  /** Original amount (for depletion display). */
  maxAmount: number
}

export type Entity = Unit | Building | ResourceNode

// ── factories ─────────────────────────────────────────────────────────────

function nextId(world: World): EntityId {
  return world.nextEntityId++
}

/** Spawn a unit for `owner` at tile-center (x, y); applies House HP modifiers. */
export function spawnUnit(
  world: World,
  kind: UnitKind,
  owner: PlayerId,
  x: number,
  y: number,
): Unit {
  const def = UNITS[kind]
  const hpMul = HOUSES[world.players[owner].house].modifiers.unitHpMul[kind] ?? 1
  const maxHp = Math.round(def.hp * hpMul)
  const unit: Unit = {
    etype: 'unit',
    id: nextId(world),
    owner,
    kind,
    x,
    y,
    hp: maxHp,
    maxHp,
    order: 'idle',
    moveGoal: null,
    path: null,
    pathStep: 0,
    repathCooldown: 0,
    attackTargetId: null,
    cooldown: 0,
    gather: null,
    buildTargetId: null,
    stance: !def.canFight ? 'passive' : def.canGather ? 'hold' : 'aggressive',
    pop: def.pop,
  }
  world.units.set(unit.id, unit)
  world.players[owner].pop += def.pop
  world.players[owner].popCap += def.commandProvided // Golds raise the command cap
  return unit
}

/**
 * Place a building for `owner`. `complete` buildings start at full HP and grant
 * their population cap immediately; otherwise a foundation is laid (low HP) that
 * the construction system ramps to completion. Occupies the footprint tiles.
 */
export function placeBuilding(
  world: World,
  kind: BuildingKind,
  owner: PlayerId,
  x: number,
  y: number,
  complete = false,
): Building {
  const def = BUILDINGS[kind]
  const maxHp = def.hp
  const building: Building = {
    etype: 'building',
    id: nextId(world),
    owner,
    kind,
    x,
    y,
    hp: complete ? maxHp : Math.max(1, Math.round(maxHp * 0.1)),
    maxHp,
    state: complete ? 'complete' : 'foundation',
    w: def.footprint.w,
    h: def.footprint.h,
    construction: complete ? null : { progress: 0, builders: [] },
    queue: [],
    rally: null,
    garrison: [],
  }
  world.buildings.set(building.id, building)
  // Farms are walkable — units path over them and drop grain off through them.
  const walkable = kind === 'farm'
  for (const t of footprintTiles(x, y, def.footprint.w, def.footprint.h)) {
    setOccupant(world.map, t.x, t.y, building.id, walkable)
  }
  if (complete) world.players[owner].popCap += def.popProvided
  return building
}

/** Create a neutral resource node at tile (x, y). */
export function createResourceNode(
  world: World,
  resource: ResourceKind,
  x: number,
  y: number,
  amount: number,
): ResourceNode {
  const node: ResourceNode = {
    etype: 'resource',
    id: nextId(world),
    resource,
    x,
    y,
    amount,
    maxAmount: amount,
  }
  world.resources.set(node.id, node)
  setOccupant(world.map, x, y, node.id)
  return node
}
