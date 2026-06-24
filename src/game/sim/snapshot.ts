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
import { BUILDINGS } from '../data/buildings'
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
  /** Building only: queued unit kinds (head first), for the queue strip. */
  queue?: UnitKind[]
  /** Unit only. */
  order?: UnitOrder
  /** Unit only: the owner's current age index (0..3), for age-tier visuals. */
  ageIndex?: number
  /** Resource node only: remaining fraction + raw amounts. */
  amount01?: number
  amount?: number
  maxAmount?: number
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
  /** Idle worker ids for player 0 (for IdleBadge cycle-select). */
  idleUnitIds: number[]
  age: AgeId
  ageName: string
  ageIndex: number
  ageAdvance: AgeAdvanceView | null
  defeated: boolean
  /** An `underAttack` alert for player 0 this tick (toast + map ping), else null. */
  alert: { text: string; x: number; y: number } | null
  /** Per-tile vision for player 0: 0 unseen · 1 explored · 2 visible (row-major). */
  fog: Uint8Array
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
    idleUnitIds: [],
    age: 'bondsman',
    ageName: AGES.bondsman.name,
    ageIndex: AGES.bondsman.index,
    ageAdvance: null,
    defeated: false,
    alert: null,
    fog: new Uint8Array(0),
    entities: [],
    outcome: null,
  }
}

/** Player 0 enemy? (neutral resources are owner -1; allies share a team). */
const isEnemyOf0 = (world: World, owner: number): boolean =>
  owner >= 0 && world.players[owner].team !== world.players[0].team

/**
 * Refresh player 0's vision in place: demote visible→explored, then reveal the
 * LOS circle of every friendly unit/building. Persisted on the World so explored
 * tiles stay remembered between ticks.
 */
function updateFog(world: World): void {
  const W = world.map.width
  const H = world.map.height
  const fog = world.fog
  for (let i = 0; i < fog.length; i++) if (fog[i] === 2) fog[i] = 1

  const reveal = (cx: number, cy: number, r: number): void => {
    const r2 = r * r
    const minX = Math.max(0, Math.floor(cx - r))
    const maxX = Math.min(W - 1, Math.ceil(cx + r))
    const minY = Math.max(0, Math.floor(cy - r))
    const maxY = Math.min(H - 1, Math.ceil(cy + r))
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x + 0.5 - cx
        const dy = y + 0.5 - cy
        if (dx * dx + dy * dy <= r2) fog[y * W + x] = 2
      }
    }
  }

  for (const u of world.units.values()) {
    if (!isEnemyOf0(world, u.owner)) reveal(u.x, u.y, UNITS[u.kind].los)
  }
  for (const b of world.buildings.values()) {
    if (!isEnemyOf0(world, b.owner)) reveal(b.x + b.w / 2, b.y + b.h / 2, BUILDINGS[b.kind].los)
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
  updateFog(world)
  const W = world.map.width
  const fog = world.fog

  for (const b of world.buildings.values()) {
    // Hide enemy buildings until their tile has been explored.
    if (isEnemyOf0(world, b.owner) && fog[b.y * W + b.x] < 1) continue
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
      queue: b.queue.map((q) => q.unit),
    })
  }

  for (const u of world.units.values()) {
    // Hide enemy units unless their tile is currently visible.
    if (isEnemyOf0(world, u.owner) && fog[Math.floor(u.y) * W + Math.floor(u.x)] !== 2) continue
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
      ageIndex: AGES[world.players[u.owner].age].index,
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
      amount: n.amount,
      maxAmount: n.maxAmount,
    })
  }

  return {
    tick: world.tick,
    clock: formatClock(world.tick),
    mapW: world.map.width,
    mapH: world.map.height,
    resources: { ...human.resources },
    rates: { ...human.rateTracker.perMin },
    pop: human.pop,
    popCap: human.popCap,
    idleCount: human.idleUnitIds.length,
    idleUnitIds: [...human.idleUnitIds],
    age: human.age,
    ageName: AGES[human.age].name,
    ageIndex: AGES[human.age].index,
    ageAdvance: ageAdvanceView(world, 0),
    defeated: human.defeated,
    alert: humanAlert(world),
    fog: world.fog,
    entities,
    outcome: world.outcome,
  }
}

/** The most recent `underAttack` event for player 0 this tick, as HUD alert. */
function humanAlert(world: World): Snapshot['alert'] {
  for (const e of world.events) {
    if (e.type === 'underAttack' && e.player === 0) {
      return { text: `UNDER_ATTACK · ${e.quadrant}`, x: e.x, y: e.y }
    }
  }
  return null
}
