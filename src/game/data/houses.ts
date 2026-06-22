/**
 * houses.ts — the twelve playable Houses.
 *
 * House Mars (the default) is fully specified per the design frame:
 *   • Obsidians +20% HP   • Reds +25% gather   • Citadels −25% cost
 *   • uniques: Howler (unit), Iron Rain (Kennels +40% production)
 * The other eleven carry a specialty + display name but neutral modifiers
 * (stubs) — the data shape is complete so they can be filled in later without
 * touching consumers.
 */
import type { UnitKind } from './units'
import type { BuildingKind } from './buildings'
import type { TechId } from './tech'

export type HouseId =
  | 'mars'
  | 'diana'
  | 'minerva'
  | 'mercury'
  | 'pluto'
  | 'neptune'
  | 'vulcan'
  | 'jupiter'
  | 'apollo'
  | 'juno'
  | 'ceres'
  | 'saturn'

export type HouseSpecialty =
  | 'cavalry'
  | 'archers'
  | 'cavalry-archers'
  | 'infantry'
  | 'defense'
  | 'balanced'

/** Multiplicative bonuses applied at their computation sites in the sim. */
export interface HouseModifiers {
  /** Resource gather-rate multiplier (1 = neutral). */
  gatherRate: number
  /** Per-unit HP multipliers. */
  unitHpMul: Partial<Record<UnitKind, number>>
  /** Per-building cost multipliers. */
  buildingCostMul: Partial<Record<BuildingKind, number>>
  /** Per-building production-speed multipliers. */
  productionRateMul: Partial<Record<BuildingKind, number>>
}

export interface HouseUniques {
  units: UnitKind[]
  techs: TechId[]
}

export interface HouseDef {
  id: HouseId
  /** UPPERCASE badge name (e.g. on the selection panel). */
  name: string
  /** lowercase_snake list label. */
  label: string
  specialty: HouseSpecialty
  /** One-line flavor for the house-detail panel. */
  blurb: string
  /** Human-readable bonus lines for the detail panel. */
  bonuses: string[]
  modifiers: HouseModifiers
  uniques: HouseUniques
}

const NEUTRAL: HouseModifiers = {
  gatherRate: 1,
  unitHpMul: {},
  buildingCostMul: {},
  productionRateMul: {},
}

/** A stub House: specialty + name, neutral modifiers, no uniques. */
const stub = (
  id: HouseId,
  name: string,
  specialty: HouseSpecialty,
  blurb: string,
): HouseDef => ({
  id,
  name,
  label: `house_${id}`,
  specialty,
  blurb,
  bonuses: [],
  modifiers: { ...NEUTRAL, unitHpMul: {}, buildingCostMul: {}, productionRateMul: {} },
  uniques: { units: [], techs: [] },
})

export const HOUSES: Record<HouseId, HouseDef> = {
  mars: {
    id: 'mars',
    name: 'MARS',
    label: 'house_mars',
    specialty: 'cavalry',
    blurb: 'the war house — obsidian cavalry and the howler horde.',
    bonuses: ['obsidians +20% hp', 'reds +25% gather', 'citadels −25% cost'],
    modifiers: {
      gatherRate: 1.25,
      unitHpMul: { obsidian: 1.2 },
      buildingCostMul: { citadel: 0.75 },
      productionRateMul: { kennel: 1.4 },
    },
    uniques: { units: ['howler'], techs: ['ironRain'] },
  },
  diana: stub('diana', 'DIANA', 'archers', 'the hunt — masters of ranged warfare.'),
  minerva: stub('minerva', 'MINERVA', 'defense', 'the bulwark — fortress and garrison.'),
  mercury: stub(
    'mercury',
    'MERCURY',
    'cavalry-archers',
    'the swift — mounted skirmishers.',
  ),
  pluto: stub('pluto', 'PLUTO', 'infantry', 'the deep — relentless heavy infantry.'),
  neptune: stub('neptune', 'NEPTUNE', 'infantry', 'the tide — disciplined legions.'),
  vulcan: stub('vulcan', 'VULCAN', 'infantry', 'the forge — armored shock troops.'),
  jupiter: stub('jupiter', 'JUPITER', 'defense', 'the throne — towering citadels.'),
  apollo: stub('apollo', 'APOLLO', 'balanced', 'the radiant — versatile and bright.'),
  juno: stub('juno', 'JUNO', 'balanced', 'the matron — steady on all fronts.'),
  ceres: stub('ceres', 'CERES', 'balanced', 'the harvest — abundant economy.'),
  saturn: stub('saturn', 'SATURN', 'balanced', 'the elder — patient and enduring.'),
}

/** Default House for new matches (per the design). */
export const DEFAULT_HOUSE: HouseId = 'mars'

/** All houses in display order. */
export const HOUSE_ORDER: readonly HouseId[] = [
  'mars',
  'diana',
  'minerva',
  'mercury',
  'pluto',
  'neptune',
  'vulcan',
  'jupiter',
  'apollo',
  'juno',
  'ceres',
  'saturn',
]

export const houseDef = (id: HouseId): HouseDef => HOUSES[id]
