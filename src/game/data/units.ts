/**
 * units.ts — the Color-caste unit roster.
 *
 * Each Color is a unit locked to its caste's role (Red Rising's Society):
 *   red      — labor: gathers + builds, the backbone (was "pioneer")
 *   gray     — line infantry
 *   obsidian — heavy shock troops
 *   gold     — command + elite fighter (provides command capacity)
 *   yellow   — medicus: heals nearby units (and eases famine) — Phase B
 *   blue     — pilot/scout: fast, fragile, long line-of-sight (peels back fog)
 *   howler   — House Mars unique raider (from the Kennel)
 *
 * Capability flags (`canGather/canBuild/canFight/canHeal`) define the role lock;
 * `upkeep`/`commandCost`/`commandProvided` feed the caste economy (Phase B).
 * Armor is melee/pierce; distances in tiles, speed in tiles/sec, times in sec.
 */
import type { Cost } from './resources'
import type { AgeId } from './ages'
import type { BuildingKind } from './buildings'
import type { IconName } from '@/theme/icons'

export type UnitKind = 'red' | 'gray' | 'obsidian' | 'gold' | 'yellow' | 'blue' | 'howler'

export type UnitRole = 'worker' | 'cavalry' | 'infantry' | 'medicus' | 'scout' | 'command'

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
  // ── caste capability flags (role lock) ──
  canGather: boolean
  canBuild: boolean
  canFight: boolean
  canHeal: boolean
  // ── caste economy (Phase B) ──
  /** Grain consumed per minute while alive. */
  upkeep: number
  /** Command capacity this unit consumes. */
  commandCost: number
  /** Command capacity this unit provides (Gold). */
  commandProvided: number
  unique: boolean
}

export const UNITS: Record<UnitKind, UnitDef> = {
  red: {
    kind: 'red',
    label: 'red',
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
    canBuild: true,
    canFight: true, // weak — only really retaliates when attacked
    canHeal: false,
    upkeep: 3,
    commandCost: 1,
    commandProvided: 0,
    unique: false,
  },
  gray: {
    kind: 'gray',
    label: 'gray',
    role: 'infantry',
    hp: 70,
    speed: 1.2,
    meleeArmor: 1,
    pierceArmor: 1,
    attack: 8,
    range: 0,
    attackCooldown: 1.3,
    los: 5,
    cost: { grain: 60 },
    buildTime: 15,
    pop: 1,
    producedBy: 'legionHall',
    requiredAge: 'initiate',
    canGather: false,
    canBuild: false,
    canFight: true,
    canHeal: false,
    upkeep: 9,
    commandCost: 1,
    commandProvided: 0,
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
    canBuild: false,
    canFight: true,
    canHeal: false,
    upkeep: 15,
    commandCost: 2,
    commandProvided: 0,
    unique: false,
  },
  gold: {
    kind: 'gold',
    label: 'gold',
    role: 'command',
    hp: 200,
    speed: 1.3,
    meleeArmor: 3,
    pierceArmor: 3,
    attack: 20,
    range: 0,
    attackCooldown: 1.2,
    los: 7,
    cost: { grain: 100, gold: 150 },
    buildTime: 40,
    pop: 1,
    producedBy: 'spire',
    requiredAge: 'peerless',
    canGather: false,
    canBuild: false,
    canFight: true,
    canHeal: false,
    upkeep: 24,
    commandCost: 0,
    commandProvided: 10,
    unique: false,
  },
  yellow: {
    kind: 'yellow',
    label: 'yellow',
    role: 'medicus',
    hp: 50,
    speed: 1.2,
    meleeArmor: 0,
    pierceArmor: 0,
    attack: 0,
    range: 0,
    attackCooldown: 2,
    los: 5,
    cost: { grain: 80 },
    buildTime: 18,
    pop: 1,
    producedBy: 'institute',
    requiredAge: 'peerless',
    canGather: false,
    canBuild: false,
    canFight: false,
    canHeal: true,
    upkeep: 12,
    commandCost: 1,
    commandProvided: 0,
    unique: false,
  },
  blue: {
    kind: 'blue',
    label: 'blue',
    role: 'scout',
    hp: 45,
    speed: 2.2,
    meleeArmor: 0,
    pierceArmor: 0,
    attack: 0,
    range: 0,
    attackCooldown: 2,
    los: 9,
    cost: { grain: 50 },
    buildTime: 12,
    pop: 1,
    producedBy: 'spire',
    requiredAge: 'initiate',
    canGather: false,
    canBuild: false,
    canFight: false,
    canHeal: false,
    upkeep: 6,
    commandCost: 1,
    commandProvided: 0,
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
    canBuild: false,
    canFight: true,
    canHeal: false,
    upkeep: 15,
    commandCost: 2,
    commandProvided: 0,
    unique: true,
  },
}

export const unitDef = (kind: UnitKind): UnitDef => UNITS[kind]

/** Distinct command/tech icon per unit. */
export const UNIT_ICON: Record<UnitKind, IconName> = {
  red: 'users',
  gray: 'swords',
  obsidian: 'shield',
  gold: 'gem',
  yellow: 'zap',
  blue: 'play',
  howler: 'crosshair',
}
