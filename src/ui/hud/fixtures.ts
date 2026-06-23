/**
 * fixtures.ts — the design-frame HUD state, used to verify chrome fidelity
 * before the engine is wired (Phase 7). Values mirror plan.md §2 exactly:
 * grain 480 ▲12 · helium-3 325 ▲8 · gold 140 0 · ore 75 ▲4 · pop 64/75 ·
 * 2 IDLE · 42:18 · INITIATE (2/4) · advance Peerless 800 grain·200 helium-3 ·
 * Spire HP 2100/2400 · ARMOR 8/7 · GARRISON 3/15 · LOS 8 · producing pioneer 46%.
 */
import { RESOURCE_KINDS, RESOURCE_META } from '@/game/data/resources'
import type { ResourceItem, AgeView, SelectionView, CommandSlot } from './types'

export const FIXTURE_RESOURCES: ResourceItem[] = RESOURCE_KINDS.map((k) => ({
  kind: k,
  label: RESOURCE_META[k].label,
  icon: RESOURCE_META[k].icon,
  color: RESOURCE_META[k].color,
  amount: RESOURCE_META[k].startAmount,
  rate: RESOURCE_META[k].baseRatePerMin,
}))

export const FIXTURE_POP = { pop: 64, popCap: 75, idle: 2, clock: '42:18' }

export const FIXTURE_AGE: AgeView = {
  name: 'INITIATE',
  index: 1,
  segmentsFilled: 2,
  segmentsTotal: 4,
  advance: { label: 'advance_peerless', cost: { grain: 800, helium3: 200 } },
  inProgress: false,
  progress01: 0,
}

export const FIXTURE_SELECTION: SelectionView = {
  name: 'spire',
  owner: 0,
  hp: 2100,
  maxHp: 2400,
  badge: 'MARS',
  stats: [
    { label: 'armor', value: '8/7' },
    { label: 'garrison', value: '3/15' },
    { label: 'los', value: '8' },
  ],
  production: { unit: 'pioneer', progress01: 0.46, queueLen: 3, etaSec: 12 },
}

export const FIXTURE_COMMANDS: (CommandSlot | null)[] = [
  { hotkey: 'Q', label: 'train_pioneer', icon: 'users', cost: { grain: 50 } },
  { hotkey: 'W', label: 'set_rally', icon: 'crosshair' },
  null,
  { hotkey: 'R', label: 'advance_peerless', icon: 'chevronRight', variant: 'primary' },
  null,
  null,
  null,
  null,
]
