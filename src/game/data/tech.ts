/**
 * tech.ts — the tech DAG shown on the Field Console tech tree.
 *
 *   Bondsman: spire · legion_hall · granary
 *   Initiate: exchange · forge · kennel
 *   Peerless: citadel · institute · howler ★
 *   Sovereign: olympus · olympic_knight · iron_rain ★
 *
 * Runtime states (built / available / locked / unique) are derived per-player
 * in the sim from `age`, `prereqs`, and what's already built — this table only
 * declares the static shape. Buildings/units are paid for when placed/trained;
 * upgrade nodes carry their own research `cost`/`time`.
 */
import type { Cost } from './resources'
import type { AgeId } from './ages'
import type { UnitKind } from './units'
import type { BuildingKind } from './buildings'

export type TechKind = 'building' | 'unit' | 'upgrade'

export type TechId =
  | 'spire'
  | 'legionHall'
  | 'granary'
  | 'exchange'
  | 'forge'
  | 'kennel'
  | 'citadel'
  | 'institute'
  | 'howler'
  | 'olympus'
  | 'olympicKnight'
  | 'ironRain'

export interface TechNode {
  id: TechId
  /** lowercase_snake label as rendered on the node card. */
  label: string
  age: AgeId
  kind: TechKind
  /** Other tech that must be built/researched first. */
  prereqs: TechId[]
  /** Research cost (upgrades); buildings/units are paid at placement/train. */
  cost: Cost
  /** Research time in seconds (upgrades only). */
  time: number
  /** Gold ★ node (House unique). */
  unique: boolean
  unlocksBuilding?: BuildingKind
  unlocksUnit?: UnitKind
  /** Declared in the design but outside the MVP roster (display-only). */
  stub?: boolean
}

export const TECH_NODES: Record<TechId, TechNode> = {
  // ── Bondsman ──
  spire: {
    id: 'spire',
    label: 'spire',
    age: 'bondsman',
    kind: 'building',
    prereqs: [],
    cost: {},
    time: 0,
    unique: false,
    unlocksBuilding: 'spire',
  },
  legionHall: {
    id: 'legionHall',
    label: 'legion_hall',
    age: 'bondsman',
    kind: 'building',
    prereqs: [],
    cost: {},
    time: 0,
    unique: false,
    unlocksBuilding: 'legionHall',
  },
  granary: {
    id: 'granary',
    label: 'granary',
    age: 'bondsman',
    kind: 'building',
    prereqs: [],
    cost: {},
    time: 0,
    unique: false,
    unlocksBuilding: 'granary',
  },
  // ── Initiate ──
  exchange: {
    id: 'exchange',
    label: 'exchange',
    age: 'initiate',
    kind: 'building',
    prereqs: ['spire'],
    cost: {},
    time: 0,
    unique: false,
    unlocksBuilding: 'exchange',
  },
  forge: {
    id: 'forge',
    label: 'forge',
    age: 'initiate',
    kind: 'building',
    prereqs: ['spire'],
    cost: {},
    time: 0,
    unique: false,
    unlocksBuilding: 'forge',
  },
  kennel: {
    id: 'kennel',
    label: 'kennel',
    age: 'initiate',
    kind: 'building',
    prereqs: ['legionHall'],
    cost: {},
    time: 0,
    unique: false,
    unlocksBuilding: 'kennel',
  },
  // ── Peerless ──
  citadel: {
    id: 'citadel',
    label: 'citadel',
    age: 'peerless',
    kind: 'building',
    prereqs: ['forge'],
    cost: {},
    time: 0,
    unique: false,
    unlocksBuilding: 'citadel',
  },
  institute: {
    id: 'institute',
    label: 'institute',
    age: 'peerless',
    kind: 'building',
    prereqs: ['forge'],
    cost: {},
    time: 0,
    unique: false,
    unlocksBuilding: 'institute',
  },
  howler: {
    id: 'howler',
    label: 'howler',
    age: 'peerless',
    kind: 'unit',
    prereqs: ['kennel'],
    cost: {},
    time: 0,
    unique: true,
    unlocksUnit: 'howler',
  },
  // ── Sovereign ──
  olympus: {
    id: 'olympus',
    label: 'olympus',
    age: 'sovereign',
    kind: 'building',
    prereqs: ['institute'],
    cost: {},
    time: 0,
    unique: false,
    unlocksBuilding: 'olympus',
  },
  olympicKnight: {
    id: 'olympicKnight',
    label: 'olympic_knight',
    age: 'sovereign',
    kind: 'unit',
    prereqs: ['institute'],
    cost: {},
    time: 0,
    unique: false,
    stub: true,
  },
  ironRain: {
    id: 'ironRain',
    label: 'iron_rain',
    age: 'sovereign',
    kind: 'upgrade',
    prereqs: ['kennel'],
    // House Mars unique: Kennels +40% production (applied at the modifier site).
    cost: { grain: 600, helium3: 300 },
    time: 60,
    unique: true,
  },
}

/** Tech ids grouped by age, in declared order — the tech-tree columns. */
export const TECH_BY_AGE: Record<AgeId, TechId[]> = {
  bondsman: ['spire', 'legionHall', 'granary'],
  initiate: ['exchange', 'forge', 'kennel'],
  peerless: ['citadel', 'institute', 'howler'],
  sovereign: ['olympus', 'olympicKnight', 'ironRain'],
}

export const techNode = (id: TechId): TechNode => TECH_NODES[id]
