/**
 * connect.ts — projections from live sim state into the HUD view-models.
 *
 * The skirmish screen feeds these into the presentational widgets built in
 * Phase 6. Selection-dependent panels are derived from the snapshot entity list
 * plus the static data tables (absolute HP/armor/LOS aren't carried per-frame).
 */
import { RESOURCE_KINDS, RESOURCE_META } from '@/game/data/resources'
import { BUILDINGS, BUILDING_ICON, type BuildingKind } from '@/game/data/buildings'
import { UNITS, UNIT_ICON, type UnitKind } from '@/game/data/units'
import { AGES, ageAtLeast, type AgeId } from '@/game/data/ages'
import { HOUSES, type HouseId } from '@/game/data/houses'
import type { Snapshot } from '@/game/sim/snapshot'
import type { ResourceItem, AgeView, SelectionView, SelectionStat, CommandSlot } from './types'

const HUMAN = 0

export function resourceItems(snap: Snapshot): ResourceItem[] {
  return RESOURCE_KINDS.map((k) => ({
    kind: k,
    label: RESOURCE_META[k].label,
    icon: RESOURCE_META[k].icon,
    color: RESOURCE_META[k].color,
    amount: Math.floor(snap.resources[k]),
    rate: Math.round(snap.rates[k]),
  }))
}

export function ageView(snap: Snapshot): AgeView {
  const adv = snap.ageAdvance
  return {
    name: snap.ageName,
    index: snap.ageIndex,
    segmentsTotal: 4,
    // Filled segments = ages reached so far (Bondsman=1 … Sovereign=4).
    segmentsFilled: snap.ageIndex + 1,
    advance: adv ? { label: `advance_${adv.toName.toLowerCase()}`, cost: adv.cost } : null,
    inProgress: adv?.inProgress ?? false,
    progress01: adv?.progress01 ?? 0,
  }
}

/** Build the selection card for the current selection (single = detailed). */
export function projectSelection(
  snap: Snapshot,
  ids: ReadonlySet<number>,
  houseBadge?: string,
): SelectionView | null {
  if (ids.size === 0) return null
  const ents = snap.entities.filter((e) => ids.has(e.id))
  if (ents.length === 0) return null

  if (ents.length > 1) {
    return {
      name: `${ents.length}_selected`,
      owner: ents[0].owner,
      hp: 0,
      maxHp: 0,
      stats: [],
      production: null,
    }
  }

  const e = ents[0]
  const badge = e.owner === HUMAN ? houseBadge : undefined

  if (e.etype === 'building') {
    const def = BUILDINGS[e.kind as BuildingKind]
    const stats: SelectionStat[] = [
      { label: 'armor', value: `${def.meleeArmor}/${def.pierceArmor}` },
      ...(def.garrisonCap > 0
        ? [{ label: 'garrison', value: `0/${def.garrisonCap}` } as SelectionStat]
        : []),
      { label: 'los', value: String(def.los) },
    ]
    let production = null
    if (e.producing) {
      const ud = UNITS[e.producing]
      const prog = e.produceProgress01 ?? 0
      production = {
        unit: e.producing,
        progress01: prog,
        queueLen: e.queueLen ?? 0,
        etaSec: Math.max(0, Math.round(ud.buildTime * (1 - prog))),
        queue: e.queue ?? [],
      }
    }
    return { name: def.label, owner: e.owner, hp: Math.round(e.hp01 * def.hp), maxHp: def.hp, badge, stats, production }
  }

  if (e.etype === 'unit') {
    const def = UNITS[e.kind as UnitKind]
    const stats: SelectionStat[] = [
      { label: 'armor', value: `${def.meleeArmor}/${def.pierceArmor}` },
      { label: 'attack', value: String(def.attack) },
      { label: 'los', value: String(def.los) },
    ]
    return { name: def.label, owner: e.owner, hp: Math.round(e.hp01 * def.hp), maxHp: def.hp, badge, stats, production: null }
  }

  if (e.etype === 'resource') {
    const amount = Math.round(e.amount ?? 0)
    const max = Math.round(e.maxAmount ?? 0)
    return {
      name: e.kind,
      owner: -1,
      hp: amount,
      maxHp: max,
      barLabel: 'remaining',
      stats: [{ label: 'left', value: `${amount}/${max}` }],
      production: null,
    }
  }

  return null
}

const SLOT_KEYS = ['Q', 'W', 'E', 'R', 'A', 'S', 'D', 'F']

/** Command grid for the selection: a building's train options + [R] advance, or
 *  a stop action for units. (Build-placement lands in Phase 9.) */
export function commandSlots(
  snap: Snapshot,
  ids: ReadonlySet<number>,
  age: AgeId,
  house: HouseId,
): (CommandSlot | null)[] {
  const slots: (CommandSlot | null)[] = Array(8).fill(null)
  const ents = snap.entities.filter((e) => ids.has(e.id) && e.owner === HUMAN)
  if (ents.length === 0) return slots

  const building = ents.find((e) => e.etype === 'building')
  if (building) {
    const def = BUILDINGS[building.kind as BuildingKind]
    def.produces.forEach((u, i) => {
      if (i > 2) return // top row Q/W/E for trainees; R reserved for advance
      const ud = UNITS[u]
      // Unique units (e.g. the Howler) are only trainable by the owning House.
      const lockedUnique = ud.unique && !HOUSES[house].uniques.units.includes(u)
      slots[i] = {
        hotkey: SLOT_KEYS[i],
        label: `train_${u}`,
        icon: UNIT_ICON[u],
        cost: ud.cost,
        variant: ageAtLeast(age, ud.requiredAge) && !lockedUnique ? 'default' : 'disabled',
      }
    })
    if (building.kind === 'spire') {
      const adv = AGES[age].advance
      if (adv) {
        slots[3] = { hotkey: 'R', label: `advance_${adv.to}`, icon: 'chevronRight', variant: 'primary' }
      }
    }
    return slots
  }

  // A selected worker → a build menu of the buildings unlocked at this age.
  if (ents.some((e) => e.etype === 'unit' && UNITS[e.kind as UnitKind].canGather)) {
    let i = 0
    for (const kind of BUILD_MENU) {
      if (i >= 7) break
      if (!ageAtLeast(age, BUILDINGS[kind].requiredAge)) continue
      slots[i] = {
        hotkey: SLOT_KEYS[i],
        label: `build_${kind}`,
        icon: BUILDING_ICON[kind],
        cost: BUILDINGS[kind].cost,
      }
      i++
    }
    slots[7] = { hotkey: SLOT_KEYS[7], label: 'stop', icon: 'x' }
    return slots
  }

  if (ents.some((e) => e.etype === 'unit')) {
    slots[0] = { hotkey: 'Q', label: 'stop', icon: 'x' }
  }
  return slots
}

/** Buildings offered in a worker's build menu, in grid order. */
const BUILD_MENU: BuildingKind[] = [
  'legionHall',
  'granary',
  'exchange',
  'forge',
  'kennel',
  'citadel',
  'institute',
  'olympus',
]
