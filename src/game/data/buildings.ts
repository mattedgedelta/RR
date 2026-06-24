/**
 * buildings.ts — the nine building types (the tech-DAG columns).
 *
 *   Bondsman: spire · legionHall · granary
 *   Initiate: exchange · forge · kennel
 *   Peerless: citadel · institute
 *   Sovereign: olympus
 *
 * The Spire matches the design selection frame: HP 2400, ARMOR 8/7, GARRISON
 * 15, LOS 8, produces pioneer. Footprints are in tiles (TILE=26px, BUILDING_PX
 * ≈ 50px → ~2×2). Costs are partial resource bags.
 */
import type { Cost, ResourceKind } from './resources'
import type { AgeId } from './ages'
import type { UnitKind } from './units'
import type { IconName } from '@/theme/icons'

export type BuildingKind =
  | 'spire'
  | 'legionHall'
  | 'granary'
  | 'farm'
  | 'exchange'
  | 'forge'
  | 'kennel'
  | 'citadel'
  | 'institute'
  | 'olympus'

export interface BuildingDef {
  kind: BuildingKind
  label: string
  hp: number
  /** Footprint in tiles. */
  footprint: { w: number; h: number }
  meleeArmor: number
  pierceArmor: number
  los: number
  cost: Cost
  /** Construction time in seconds. */
  buildTime: number
  /** Units this building can train (in train-menu order). */
  produces: UnitKind[]
  /** Max garrisoned units (0 = cannot garrison). */
  garrisonCap: number
  /** Resources that can be dropped off here ('all' = every kind). */
  dropOff: ResourceKind[] | 'all'
  /** Population cap contributed when complete. */
  popProvided: number
  requiredAge: AgeId
  /** Defensive building that attacks nearby enemies. */
  defensive: boolean
  unique: boolean
}

export const BUILDINGS: Record<BuildingKind, BuildingDef> = {
  spire: {
    kind: 'spire',
    label: 'spire',
    hp: 2400,
    footprint: { w: 2, h: 2 },
    meleeArmor: 8,
    pierceArmor: 7,
    los: 8,
    cost: { grain: 400, ore: 100 },
    buildTime: 60,
    produces: ['pioneer'],
    garrisonCap: 15,
    dropOff: 'all',
    popProvided: 15,
    requiredAge: 'bondsman',
    defensive: false,
    unique: false,
  },
  legionHall: {
    kind: 'legionHall',
    label: 'legion_hall',
    hp: 1500,
    footprint: { w: 2, h: 2 },
    meleeArmor: 2,
    pierceArmor: 2,
    los: 6,
    cost: { grain: 150, ore: 50 },
    buildTime: 30,
    produces: ['obsidian'],
    garrisonCap: 0,
    dropOff: [],
    popProvided: 0,
    requiredAge: 'bondsman',
    defensive: false,
    unique: false,
  },
  granary: {
    kind: 'granary',
    label: 'granary',
    hp: 1000,
    footprint: { w: 2, h: 2 },
    meleeArmor: 1,
    pierceArmor: 1,
    los: 4,
    cost: { grain: 100 },
    buildTime: 20,
    produces: [],
    garrisonCap: 0,
    dropOff: ['grain', 'ore'],
    popProvided: 10,
    requiredAge: 'bondsman',
    defensive: false,
    unique: false,
  },
  farm: {
    kind: 'farm',
    label: 'farm',
    hp: 300,
    // A small (1×1) plot a Pioneer works: a renewable grain source the worker
    // harvests and carries back to a drop-off (Spire / Granary).
    footprint: { w: 1, h: 1 },
    meleeArmor: 0,
    pierceArmor: 0,
    los: 2,
    cost: { grain: 60 },
    buildTime: 18,
    produces: [],
    garrisonCap: 0,
    dropOff: [],
    popProvided: 0,
    requiredAge: 'initiate',
    defensive: false,
    unique: false,
  },
  exchange: {
    kind: 'exchange',
    label: 'exchange',
    hp: 1200,
    footprint: { w: 2, h: 2 },
    meleeArmor: 1,
    pierceArmor: 1,
    los: 5,
    cost: { grain: 150, ore: 50 },
    buildTime: 28,
    produces: [],
    garrisonCap: 0,
    dropOff: ['gold', 'helium3'],
    popProvided: 0,
    requiredAge: 'initiate',
    defensive: false,
    unique: false,
  },
  forge: {
    kind: 'forge',
    label: 'forge',
    hp: 1200,
    footprint: { w: 2, h: 2 },
    meleeArmor: 2,
    pierceArmor: 2,
    los: 5,
    cost: { grain: 120, ore: 80 },
    buildTime: 28,
    produces: [],
    garrisonCap: 0,
    dropOff: [],
    popProvided: 0,
    requiredAge: 'initiate',
    defensive: false,
    unique: false,
  },
  kennel: {
    kind: 'kennel',
    label: 'kennel',
    hp: 1200,
    footprint: { w: 2, h: 2 },
    meleeArmor: 1,
    pierceArmor: 1,
    los: 5,
    cost: { grain: 150, ore: 50 },
    buildTime: 30,
    // Howler unlocks at Peerless; the Kennel itself is available at Initiate.
    produces: ['howler'],
    garrisonCap: 0,
    dropOff: [],
    popProvided: 0,
    requiredAge: 'initiate',
    defensive: false,
    unique: false,
  },
  citadel: {
    kind: 'citadel',
    label: 'citadel',
    hp: 2400,
    footprint: { w: 2, h: 2 },
    meleeArmor: 10,
    pierceArmor: 10,
    los: 8,
    // House Mars: citadels −25% cost (applied at the computation site).
    cost: { grain: 200, ore: 200 },
    buildTime: 40,
    produces: [],
    garrisonCap: 10,
    dropOff: [],
    popProvided: 0,
    requiredAge: 'peerless',
    defensive: true,
    unique: false,
  },
  institute: {
    kind: 'institute',
    label: 'institute',
    hp: 1500,
    footprint: { w: 2, h: 2 },
    meleeArmor: 2,
    pierceArmor: 2,
    los: 6,
    cost: { grain: 200, ore: 100 },
    buildTime: 36,
    produces: [],
    garrisonCap: 0,
    dropOff: [],
    popProvided: 0,
    requiredAge: 'peerless',
    defensive: false,
    unique: false,
  },
  olympus: {
    kind: 'olympus',
    label: 'olympus',
    hp: 4000,
    footprint: { w: 3, h: 3 },
    meleeArmor: 6,
    pierceArmor: 6,
    los: 10,
    cost: { grain: 1000, helium3: 500, gold: 400, ore: 400 },
    buildTime: 90,
    produces: [],
    garrisonCap: 0,
    dropOff: [],
    popProvided: 20,
    requiredAge: 'sovereign',
    defensive: false,
    unique: true,
  },
}

export const buildingDef = (kind: BuildingKind): BuildingDef => BUILDINGS[kind]

/** Distinct command/tech icon per building. */
export const BUILDING_ICON: Record<BuildingKind, IconName> = {
  spire: 'home',
  legionHall: 'swords',
  granary: 'leaf',
  farm: 'leaf',
  exchange: 'coins',
  forge: 'hammer',
  kennel: 'crosshair',
  citadel: 'shield',
  institute: 'zap',
  olympus: 'gem',
}

/** Buildings that act as a drop-off point for `res`. */
export function acceptsDropOff(def: BuildingDef, res: ResourceKind): boolean {
  return def.dropOff === 'all' || def.dropOff.includes(res)
}
