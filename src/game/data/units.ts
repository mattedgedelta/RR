/**
 * units.ts — base stats for the MVP unit roster.
 *
 *   pioneer  — worker (gathers, builds); House Reds gather bonus applies here
 *   obsidian — Mars line cavalry/heavy melee (+20% HP House bonus)
 *   howler   — Mars unique raider (from the Kennel)
 *
 * Armor is melee/pierce ("8/7"-style). Distances are in tiles, speed in
 * tiles/second, times in seconds — the sim converts to its 10 Hz tick clock.
 */
import type { Cost } from './resources'
import type { AgeId } from './ages'
import type { BuildingKind } from './buildings'

export type UnitKind = 'pioneer' | 'obsidian' | 'howler'

export type UnitRole = 'worker' | 'cavalry' | 'infantry' | 'archer'

export interface UnitDef {
  kind: UnitKind
  label: string
  role: UnitRole
  hp: number
  /** Movement speed in tiles per second. */
  speed: number
  meleeArmor: number
  pierceArmor: number
  attack: number
  /** Attack range in tiles (0 = melee/adjacent). */
  range: number
  /** Seconds between attacks. */
  attackCooldown: number
  /** Line of sight in tiles. */
  los: number
  cost: Cost
  /** Train time in seconds. */
  buildTime: number
  /** Population slots consumed. */
  pop: number
  producedBy: BuildingKind
  requiredAge: AgeId
  canGather: boolean
  unique: boolean
}

export const UNITS: Record<UnitKind, UnitDef> = {
  pioneer: {
    kind: 'pioneer',
    label: 'pioneer',
    role: 'worker',
    hp: 40,
    speed: 1.1,
    meleeArmor: 0,
    pierceArmor: 0,
    attack: 3,
    range: 0,
    attackCooldown: 1.5,
    los: 4,
    cost: { grain: 50 },
    buildTime: 12,
    pop: 1,
    producedBy: 'spire',
    requiredAge: 'bondsman',
    canGather: true,
    unique: false,
  },
  obsidian: {
    kind: 'obsidian',
    label: 'obsidian',
    role: 'cavalry',
    hp: 100,
    speed: 1.3,
    meleeArmor: 1,
    pierceArmor: 0,
    attack: 12,
    range: 0,
    attackCooldown: 1.2,
    los: 5,
    cost: { grain: 60, gold: 20 },
    buildTime: 18,
    pop: 1,
    producedBy: 'legionHall',
    requiredAge: 'initiate',
    canGather: false,
    unique: false,
  },
  howler: {
    kind: 'howler',
    label: 'howler',
    role: 'cavalry',
    hp: 80,
    speed: 1.7,
    meleeArmor: 0,
    pierceArmor: 1,
    attack: 14,
    range: 0,
    attackCooldown: 1.0,
    los: 6,
    cost: { grain: 50, helium3: 30 },
    buildTime: 16,
    pop: 1,
    producedBy: 'kennel',
    requiredAge: 'peerless',
    canGather: false,
    unique: true,
  },
}

export const unitDef = (kind: UnitKind): UnitDef => UNITS[kind]
