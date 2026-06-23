/**
 * snapshot.ts — projects the live World into a read-only Snapshot.
 *
 * The Snapshot is the only thing React/Canvas see: HUD-relevant scalars for the
 * human (player 0) plus a flat render list of every entity. Keeping this a pure
 * projection means the renderer/HUD never reach into mutable sim state.
 */
import type { ResourceBag } from '../data/resources'
import type { AgeId } from '../data/ages'
import type { UnitKind } from '../data/units'
import type { Cost } from '../data/resources'
import { AGES } from '../data/ages'
import { RESOURCE_META, emptyBag } from '../data/resources'
import { UNITS } from '../data/units'
import type { EntityType, BuildingState, UnitOrder } from './entities'
import { type World, TICK_HZ } from './world'

export interface RenderEntity {
  id: number
  etype: EntityType
  owner: number
  color: string
  /** Tile-coord position (unit center / building top-left / node tile). */
  x: number
  y: number
  /** Unit kind, building kind, or resource kind. */
  kind: string
  /** Footprint in tiles (1 for units/resources). */
  w: number
  h: number
  /** HP fraction 0..1 (1 for resource nodes). */
  hp01: number
  /** Building only. */
  state?: BuildingState
  producing?: UnitKind | null
  produceProgress01?: number
  queueLen?: number
  /** Unit only. */
  order?: UnitOrder
  /** Resource node only: remaining fraction. */
  amount01?: number
}

export interface AgeAdvanceView {
  to: AgeId
  toName: string
  cost: Cost
  /** 0..1 (0 = available but not started, climbs while advancing). */
  progress01: number
  inProgress: boolean
}

export interface Snapshot {
  tick: number
  /** mm:ss elapsed. */
  clock: string
  mapW: number
  mapH: number
  // Human (player 0) HUD state.
  resources: ResourceBag
  /** Per-minute gather rates (filled by the economy system; 0 until then). */
  rates: ResourceBag
  pop: number
  popCap: number
  idleCount: number
  age: AgeId
  ageName: string
  ageIndex: number
  ageAdvance: AgeAdvanceView | null
  defeated: boolean
  entities: RenderEntity[]
  outcome: World['outcome']
}

/** Snapshot for a not-yet-started match — the store's initial value. */
export function emptySnapshot(): Snapshot {
  return {
    tick: 0,
    clock: '00:00',
    mapW: 0,
    mapH: 0,
    resources: emptyBag(),
    rates: emptyBag(),
    pop: 0,
    popCap: 0,
    idleCount: 0,
    age: 'bondsman',
    ageName: AGES.bondsman.name,
    ageIndex: AGES.bondsman.index,
    ageAdvance: null,
    defeated: false,
    entities: [],
    outcome: null,
  }
}

function formatClock(tick: number): string {
  const total = Math.floor(tick / TICK_HZ)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function ageAdvanceView(world: World, playerIdx: number): AgeAdvanceView | null {
  const p = world.players[playerIdx]
  if (p.ageProgress) {
    const ap = p.ageProgress
    return {
      to: ap.to,
      toName: AGES[ap.to].name,
      cost: AGES[p.age].advance?.cost ?? {},
      progress01: ap.total > 0 ? 1 - ap.remaining / ap.total : 1,
      inProgress: true,
    }
  }
  const advance = AGES[p.age].advance
  if (!advance) return null
  return {
    to: advance.to,
    toName: AGES[advance.to].name,
    cost: advance.cost,
    progress01: 0,
    inProgress: false,
  }
}

/** Project the world into a fresh Snapshot. Always reads the human as player 0. */
export function buildSnapshot(world: World): Snapshot {
  const human = world.players[0]
  const entities: RenderEntity[] = []

  for (const b of world.buildings.values()) {
    const head = b.queue[0]
    entities.push({
      id: b.id,
      etype: 'building',
      owner: b.owner,
      color: world.players[b.owner].color,
      x: b.x,
      y: b.y,
      kind: b.kind,
      w: b.w,
      h: b.h,
      hp01: b.maxHp > 0 ? b.hp / b.maxHp : 0,
      state: b.state,
      producing: head ? head.unit : null,
      produceProgress01: head ? 1 - head.remaining / head.total : 0,
      queueLen: b.queue.length,
    })
  }

  let idleCount = 0
  for (const u of world.units.values()) {
    if (u.owner === 0 && u.order === 'idle' && UNITS[u.kind].canGather) idleCount++
    entities.push({
      id: u.id,
      etype: 'unit',
      owner: u.owner,
      color: world.players[u.owner].color,
      x: u.x,
      y: u.y,
      kind: u.kind,
      w: 1,
      h: 1,
      hp01: u.maxHp > 0 ? u.hp / u.maxHp : 0,
      order: u.order,
    })
  }

  for (const n of world.resources.values()) {
    entities.push({
      id: n.id,
      etype: 'resource',
      owner: -1,
      color: RESOURCE_META[n.resource].color,
      x: n.x,
      y: n.y,
      kind: n.resource,
      w: 1,
      h: 1,
      hp01: 1,
      amount01: n.maxAmount > 0 ? n.amount / n.maxAmount : 0,
    })
  }

  return {
    tick: world.tick,
    clock: formatClock(world.tick),
    mapW: world.map.width,
    mapH: world.map.height,
    resources: { ...human.resources },
    rates: emptyBag(),
    pop: human.pop,
    popCap: human.popCap,
    idleCount,
    age: human.age,
    ageName: AGES[human.age].name,
    ageIndex: AGES[human.age].index,
    ageAdvance: ageAdvanceView(world, 0),
    defeated: human.defeated,
    entities,
    outcome: world.outcome,
  }
}
