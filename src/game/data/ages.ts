/**
 * ages.ts — the four ages and their advance costs/times.
 *
 *   Bondsman → Initiate → Peerless → Sovereign
 *
 * `advance` on an age describes the cost/time to advance OUT of it into the
 * next (null on the final age). The design frame shows advancing TO Peerless
 * costs 800 grain · 200 helium-3, i.e. it lives on Initiate.advance.
 */
import type { Cost } from './resources'

export type AgeId = 'bondsman' | 'initiate' | 'peerless' | 'sovereign'

/** Canonical ascending order. `index` of each age matches its position here. */
export const AGE_ORDER: readonly AgeId[] = ['bondsman', 'initiate', 'peerless', 'sovereign']

export interface AgeAdvance {
  to: AgeId
  cost: Cost
  /** Research time in seconds. */
  time: number
}

export interface AgeDef {
  id: AgeId
  index: number
  /** UPPERCASE display name as shown on the age bar. */
  name: string
  /** lowercase_snake label. */
  label: string
  /** Population-cap delta granted on reaching this age. */
  popCapBonus: number
  advance: AgeAdvance | null
}

export const AGES: Record<AgeId, AgeDef> = {
  bondsman: {
    id: 'bondsman',
    index: 0,
    name: 'BONDSMAN',
    label: 'bondsman',
    popCapBonus: 0,
    advance: { to: 'initiate', cost: { grain: 500 }, time: 30 },
  },
  initiate: {
    id: 'initiate',
    index: 1,
    name: 'INITIATE',
    label: 'initiate',
    popCapBonus: 20,
    // Design frame: [R] ADVANCE_PEERLESS — 800 grain · 200 helium-3
    advance: { to: 'peerless', cost: { grain: 800, helium3: 200 }, time: 40 },
  },
  peerless: {
    id: 'peerless',
    index: 2,
    name: 'PEERLESS',
    label: 'peerless',
    popCapBonus: 25,
    advance: { to: 'sovereign', cost: { grain: 1000, helium3: 500, gold: 200 }, time: 50 },
  },
  sovereign: {
    id: 'sovereign',
    index: 3,
    name: 'SOVEREIGN',
    label: 'sovereign',
    popCapBonus: 30,
    advance: null,
  },
}

export const ageDef = (id: AgeId): AgeDef => AGES[id]

/** The age immediately after `id`, or null at the top. */
export const nextAge = (id: AgeId): AgeId | null => AGES[id].advance?.to ?? null

/** True if age `a` is reached at or before age `b` (b is at least a). */
export const ageAtLeast = (have: AgeId, need: AgeId): boolean =>
  AGES[have].index >= AGES[need].index
