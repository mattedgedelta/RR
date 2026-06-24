/**
 * units.ts — the Color-caste unit roster.
 *
 * Each Color is a unit locked to its caste's role (Red Rising's Society):
 *   red      — labor: gathers + builds, the backbone
 *   gray     — line infantry
 *   obsidian — heavy shock troops
 *   gold     — command + elite fighter (provides command capacity)
 *   yellow   — medicus: heals nearby units (and eases famine)
 *   blue     — pilot/scout: fast, fragile, long line-of-sight (peels back fog)
 *   howler   — House Mars unique raider (from the Kennel)
 *
 * Capability flags (`canGather/canBuild/canFight/canHeal`) define the role lock.
 * Caste economy: `pop` is the **command capacity consumed**, `commandProvided`
 * is what a Gold adds to it, and `upkeep` is grain eaten per minute.
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
  /** One-line caste flavor (Codex copy). */
  blurb: string
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
  /** Command capacity consumed (the caste "population" cost). */
  pop: number
  producedBy: BuildingKind
  requiredAge: AgeId
  // ── caste role lock ──
  canGather: boolean
  canBuild: boolean
  canFight: boolean
  canHeal: boolean
  // ── caste economy ──
  /** Grain consumed per minute while alive. */
  upkeep: number
  /** Command capacity this unit provides (Gold only). */
  commandProvided: number
  unique: boolean
}

export const UNITS: Record<UnitKind, UnitDef> = {
  red: {
    kind: 'red',
    label: 'red',
    blurb: 'the labor caste — mines the helium and raises the spires. the backbone of the pyramid; lose your Reds and the whole Society starves.',
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
    canFight: true, // weak — really only retaliates when attacked
    canHeal: false,
    upkeep: 2,
    commandProvided: 0,
    unique: false,
  },
  gray: {
    kind: 'gray',
    label: 'gray',
    blurb: 'the standing legion — disciplined line infantry bred to hold a line and obey. cheap, steady, and expendable.',
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
    upkeep: 4,
    commandProvided: 0,
    unique: false,
  },
  obsidian: {
    kind: 'obsidian',
    label: 'obsidian',
    blurb: 'giants of the far pole — heavy shock troops that break a line by walking through it. costly to field and hungrier still to feed.',
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
    pop: 2,
    producedBy: 'legionHall',
    requiredAge: 'initiate',
    canGather: false,
    canBuild: false,
    canFight: true,
    canHeal: false,
    upkeep: 6,
    commandProvided: 0,
    unique: false,
  },
  gold: {
    kind: 'gold',
    label: 'gold',
    blurb: 'the ruling caste — peerless commanders whose very presence is the chain of command. each Gold widens the force you can field, and fights like ten.',
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
    pop: 0, // a Gold consumes no command — it *is* command
    producedBy: 'spire',
    requiredAge: 'peerless',
    canGather: false,
    canBuild: false,
    canFight: true,
    canHeal: false,
    upkeep: 12,
    commandProvided: 10,
    unique: false,
  },
  yellow: {
    kind: 'yellow',
    label: 'yellow',
    blurb: 'the medicus caste — keeps the wounded breathing and the starving on their feet. carries no blade; priceless behind a line.',
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
    upkeep: 5,
    commandProvided: 0,
    unique: false,
  },
  blue: {
    kind: 'blue',
    label: 'blue',
    blurb: 'pilots and helmsmen — fast eyes that range far ahead and peel back the fog of war. no use in a fight, indispensable before one.',
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
    upkeep: 3,
    commandProvided: 0,
    unique: false,
  },
  howler: {
    kind: 'howler',
    label: 'howler',
    blurb: "Mars' wolves — masked raiders of the Iron Rain, fast and savage. the war house's own, and no other's to command.",
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
    pop: 2,
    producedBy: 'kennel',
    requiredAge: 'peerless',
    canGather: false,
    canBuild: false,
    canFight: true,
    canHeal: false,
    upkeep: 5,
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
