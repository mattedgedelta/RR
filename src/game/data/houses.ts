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

/** Build a House from its thematic modifiers + signature tech. Each modifier
 *  lever feeds a real computation site in the sim (gather, unit HP, building
 *  cost, production speed), so picking a House measurably changes play. */
function house(
  id: HouseId,
  name: string,
  specialty: HouseSpecialty,
  blurb: string,
  bonuses: string[],
  mods: Partial<HouseModifiers>,
  signature: TechId,
): HouseDef {
  return {
    id,
    name,
    label: `house_${id}`,
    specialty,
    blurb,
    bonuses,
    modifiers: { gatherRate: 1, unitHpMul: {}, buildingCostMul: {}, productionRateMul: {}, ...mods },
    uniques: { units: [], techs: [signature] },
  }
}

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
  diana: house(
    'diana', 'DIANA', 'archers', 'the hunt — masters of ranged warfare.',
    ['legion_hall +30% production', 'forge −20% cost'],
    { productionRateMul: { legionHall: 1.3 }, buildingCostMul: { forge: 0.8 } },
    'moonfallVolley',
  ),
  minerva: house(
    'minerva', 'MINERVA', 'defense', 'the bulwark — fortress and garrison.',
    ['citadels −30% cost', 'granary −20% cost'],
    { buildingCostMul: { citadel: 0.7, granary: 0.8 } },
    'aegisProtocol',
  ),
  mercury: house(
    'mercury', 'MERCURY', 'cavalry-archers', 'the swift — mounted skirmishers.',
    ['reds +15% gather', 'legion_hall +20% production'],
    { gatherRate: 1.15, productionRateMul: { legionHall: 1.2 } },
    'swiftStrike',
  ),
  pluto: house(
    'pluto', 'PLUTO', 'infantry', 'the deep — relentless heavy infantry.',
    ['obsidians +25% hp', 'legion_hall −15% cost'],
    { unitHpMul: { obsidian: 1.25 }, buildingCostMul: { legionHall: 0.85 } },
    'deepLegion',
  ),
  neptune: house(
    'neptune', 'NEPTUNE', 'infantry', 'the tide — disciplined legions.',
    ['obsidians +12% hp', 'reds +12% gather'],
    { unitHpMul: { obsidian: 1.12 }, gatherRate: 1.12 },
    'tidalDiscipline',
  ),
  vulcan: house(
    'vulcan', 'VULCAN', 'infantry', 'the forge — armored shock troops.',
    ['forge −30% cost', 'obsidians +15% hp', 'legion_hall +20% production'],
    { buildingCostMul: { forge: 0.7 }, unitHpMul: { obsidian: 1.15 }, productionRateMul: { legionHall: 1.2 } },
    'forgeTemper',
  ),
  jupiter: house(
    'jupiter', 'JUPITER', 'defense', 'the throne — towering citadels.',
    ['citadels −40% cost', 'spire −15% cost'],
    { buildingCostMul: { citadel: 0.6, spire: 0.85 } },
    'throneBulwark',
  ),
  apollo: house(
    'apollo', 'APOLLO', 'balanced', 'the radiant — versatile and bright.',
    ['reds +10% gather', 'obsidians +8% hp', 'legion_hall +10% production'],
    { gatherRate: 1.1, unitHpMul: { obsidian: 1.08 }, productionRateMul: { legionHall: 1.1 } },
    'radiantBalance',
  ),
  juno: house(
    'juno', 'JUNO', 'balanced', 'the matron — steady on all fronts.',
    ['reds +10% gather', 'spire & legion_hall +10% production'],
    { gatherRate: 1.1, productionRateMul: { spire: 1.1, legionHall: 1.1 } },
    'matronLogistics',
  ),
  ceres: house(
    'ceres', 'CERES', 'balanced', 'the harvest — abundant economy.',
    ['reds +35% gather', 'granary −25% cost', 'exchange −25% cost'],
    { gatherRate: 1.35, buildingCostMul: { granary: 0.75, exchange: 0.75 } },
    'harvestAbundance',
  ),
  saturn: house(
    'saturn', 'SATURN', 'balanced', 'the elder — patient and enduring.',
    ['reds +10% gather', 'obsidians +10% hp', 'spire −10% cost'],
    { gatherRate: 1.1, unitHpMul: { obsidian: 1.1 }, buildingCostMul: { spire: 0.9 } },
    'elderPatience',
  ),
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
