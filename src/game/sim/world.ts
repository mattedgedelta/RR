/**
 * world.ts — the World: all sim state, the players, the command queue, and the
 * deterministic `createWorld` that seeds a balanced start for 2–8 players.
 *
 * The World is the single mutable state container the tick pipeline operates on.
 * Entity pools are kept as separate typed Maps (units / buildings / resources)
 * for cheap typed iteration; ids are unique across all pools so a single id can
 * be resolved via `getEntity`.
 */
import type { ResourceBag, ResourceKind } from '../data/resources'
import type { AgeId } from '../data/ages'
import type { HouseId } from '../data/houses'
import type { BuildingKind } from '../data/buildings'
import {
  type MatchConfig,
  type PlayerId,
  type Difficulty,
  DIFFICULTY_TIERS,
} from '../data/players'
import { AGES } from '../data/ages'
import { startingResources } from '../data/resources'
import { Rng, mulberry32 } from './rng'
import {
  generateMap,
  isBuildable,
  footprintBuildable,
  findNearestTile,
  type GameMap,
} from './map'
import {
  spawnUnit,
  placeBuilding,
  createResourceNode,
  type EntityId,
  type Entity,
  type Unit,
  type Building,
  type ResourceNode,
} from './entities'

/** Simulation tick rate. */
export const TICK_HZ = 10
export const TICK_MS = 1000 / TICK_HZ
/** Convert seconds to a whole number of ticks (min 1). */
export const secToTicks = (s: number): number => Math.max(1, Math.round(s * TICK_HZ))

/** In-progress age advancement. */
export interface AgeProgress {
  to: AgeId
  /** Ticks remaining until the advance completes. */
  remaining: number
  total: number
}

/** Per-CPU-player AI controller handle (staggered think scheduling). */
export interface AiState {
  /** Next tick at which this controller should think. */
  nextThinkTick: number
}

export interface Player {
  id: PlayerId
  kind: 'human' | 'cpu'
  house: HouseId
  team: number
  color: string
  difficulty: Difficulty
  resources: ResourceBag
  pop: number
  popCap: number
  age: AgeId
  ageProgress: AgeProgress | null
  defeated: boolean
  /** Worker ids detected idle this tick (refreshed by the economy system). */
  idleUnitIds: EntityId[]
  /** AI handle (null for the human). */
  ai: AiState | null
}

/** Transient per-tick events (consumed by the HUD; cleared each tick). */
export type GameEvent =
  | { type: 'underAttack'; player: PlayerId; x: number; y: number; quadrant: string }
  | { type: 'buildingLost'; player: PlayerId; kind: BuildingKind }
  | { type: 'playerDefeated'; player: PlayerId }

/** Match result, from the human's point of view. */
export interface Outcome {
  victory: boolean
  winnerTeam: number
}

/** A queued command awaiting application at the next tick. */
import type { Command } from './commands'

export interface World {
  tick: number
  rng: Rng
  map: GameMap
  config: MatchConfig
  players: Player[]
  units: Map<EntityId, Unit>
  buildings: Map<EntityId, Building>
  resources: Map<EntityId, ResourceNode>
  nextEntityId: EntityId
  commandQueue: Command[]
  events: GameEvent[]
  /** null while the match is ongoing. */
  outcome: Outcome | null
}

// ── lookups & helpers ─────────────────────────────────────────────────────

export const getUnit = (w: World, id: EntityId): Unit | undefined => w.units.get(id)
export const getBuilding = (w: World, id: EntityId): Building | undefined =>
  w.buildings.get(id)
export const getResource = (w: World, id: EntityId): ResourceNode | undefined =>
  w.resources.get(id)

export function getEntity(w: World, id: EntityId): Entity | undefined {
  return w.units.get(id) ?? w.buildings.get(id) ?? w.resources.get(id)
}

/** Owner of an entity, or -1 for neutral resource nodes. */
export function ownerOf(e: Entity): PlayerId | -1 {
  return e.etype === 'resource' ? -1 : e.owner
}

/** True if the two players share a team (allies, including self). */
export const areAllied = (w: World, a: PlayerId, b: PlayerId): boolean =>
  w.players[a].team === w.players[b].team

/** Compass quadrant of a world point relative to the map center. */
export function quadrantOf(w: World, x: number, y: number): string {
  const ns = y < w.map.centerY ? 'N' : 'S'
  const ew = x < w.map.centerX ? 'W' : 'E'
  return ns + ew
}

// ── world creation ──────────────────────────────────────────────────────

/** Resource cluster laid around each player's start. */
const STARTING_NODES: { dx: number; dy: number; resource: ResourceKind; amount: number }[] = [
  { dx: -3, dy: 0, resource: 'grain', amount: 300 },
  { dx: -3, dy: 2, resource: 'grain', amount: 300 },
  { dx: 0, dy: -3, resource: 'grain', amount: 250 },
  { dx: 3, dy: -2, resource: 'helium3', amount: 200 },
  { dx: 4, dy: 1, resource: 'helium3', amount: 200 },
  { dx: -2, dy: 3, resource: 'gold', amount: 150 },
  { dx: 3, dy: 3, resource: 'ore', amount: 200 },
  { dx: 1, dy: 4, resource: 'ore', amount: 200 },
]

/** Pioneer spawn offsets (tile-center, relative to the Spire top-left). */
const PIONEER_OFFSETS: { dx: number; dy: number }[] = [
  { dx: -0.5, dy: 0.5 },
  { dx: -0.5, dy: 1.5 },
  { dx: 2.5, dy: 1.0 },
]

/**
 * Create a fully-seeded world from a match config: a deterministic map plus, for
 * each player, a completed Spire, three Pioneers, and a nearby resource cluster
 * at a balanced radial start.
 */
export function createWorld(seed: number, config: MatchConfig): World {
  const rng = mulberry32(seed)
  const map = generateMap(rng, config.players.length, config.mapSize)

  const players: Player[] = config.players.map((p, i) => ({
    id: p.id,
    kind: p.kind,
    house: p.house,
    team: p.team,
    color: p.color,
    difficulty: p.difficulty,
    resources: startingResources(),
    pop: 0,
    popCap: 0,
    age: 'bondsman' as AgeId,
    ageProgress: null,
    defeated: false,
    idleUnitIds: [],
    ai: p.kind === 'cpu' ? { nextThinkTick: i * 3 } : null,
  }))

  const world: World = {
    tick: 0,
    rng,
    map,
    config,
    players,
    units: new Map(),
    buildings: new Map(),
    resources: new Map(),
    nextEntityId: 1,
    commandQueue: [],
    events: [],
    outcome: null,
  }

  // Seed each player's base at its start position.
  for (let i = 0; i < config.players.length; i++) {
    const player = config.players[i]
    const start = map.startPositions[i]

    // Spire (2×2) anchored so its footprint fits; nudge inward if needed.
    let sx = Math.min(start.x, map.width - 2)
    let sy = Math.min(start.y, map.height - 2)
    if (!footprintBuildable(map, sx, sy, 2, 2)) {
      const free = findNearestTile(
        map,
        sx,
        sy,
        (tx, ty) => footprintBuildable(map, tx, ty, 2, 2),
        6,
      )
      if (free) {
        sx = free.x
        sy = free.y
      }
    }
    placeBuilding(world, 'spire', player.id, sx, sy, true)

    // Pioneers around the Spire.
    for (const off of PIONEER_OFFSETS) {
      const px = Math.max(0.5, Math.min(map.width - 0.5, sx + off.dx))
      const py = Math.max(0.5, Math.min(map.height - 0.5, sy + off.dy))
      spawnUnit(world, 'pioneer', player.id, px, py)
    }

    // Resource cluster.
    for (const n of STARTING_NODES) {
      const spot = findNearestTile(
        map,
        Math.round(sx + n.dx),
        Math.round(sy + n.dy),
        (tx, ty) => isBuildable(map, tx, ty),
        6,
      )
      if (spot) createResourceNode(world, n.resource, spot.x, spot.y, n.amount)
    }
  }

  return world
}

/** Difficulty tuning for a CPU player (think cadence, aggression, economy). */
export const difficultyOf = (w: World, id: PlayerId) =>
  DIFFICULTY_TIERS[w.players[id].difficulty]

/** Convenience: the age definition for a player's current age. */
export const ageOf = (w: World, id: PlayerId) => AGES[w.players[id].age]
