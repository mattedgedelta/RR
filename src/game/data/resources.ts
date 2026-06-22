/**
 * resources.ts — the four economy resources (the design's resource table).
 *
 * `ResourceKind` / `ResourceBag` are the shared currency types every other
 * data table builds on (unit/building costs, drop-off, age-advance costs).
 * Values mirror the confirmed design frame:
 *   grain 480 ▲12 (leaf) · helium-3 325 ▲8 (shard) · gold 140 0 (coin) · ore 75 ▲4 (gem)
 */
import type { IconName } from '@/theme/icons'
import { RESOURCE } from '@/theme/palette'

export type ResourceKind = 'grain' | 'helium3' | 'gold' | 'ore'

/** Stable iteration order (determinism: never iterate object keys for sim math). */
export const RESOURCE_KINDS: readonly ResourceKind[] = ['grain', 'helium3', 'gold', 'ore']

/** A full quantity-per-resource map. */
export type ResourceBag = Record<ResourceKind, number>

/** A partial bag, used for costs (only the resources that are charged). */
export type Cost = Partial<ResourceBag>

export const emptyBag = (): ResourceBag => ({ grain: 0, helium3: 0, gold: 0, ore: 0 })

/** Add a (partial) cost bag into a full bag, mutating and returning it. */
export function addCost(into: ResourceBag, cost: Cost, sign = 1): ResourceBag {
  for (const k of RESOURCE_KINDS) {
    const v = cost[k]
    if (v) into[k] += v * sign
  }
  return into
}

/** True if `have` covers every entry of `cost`. */
export function canAfford(have: ResourceBag, cost: Cost): boolean {
  for (const k of RESOURCE_KINDS) {
    if ((cost[k] ?? 0) > have[k]) return false
  }
  return true
}

export interface ResourceMeta {
  kind: ResourceKind
  /** lowercase_snake label per Field Console style. */
  label: string
  icon: IconName
  color: string
  /** Starting stockpile at match start (design frame values). */
  startAmount: number
  /** Reference per-minute trickle shown in the design (▲rate); 0 = none. */
  baseRatePerMin: number
}

export const RESOURCE_META: Record<ResourceKind, ResourceMeta> = {
  grain: {
    kind: 'grain',
    label: 'grain',
    icon: 'leaf',
    color: RESOURCE.grain,
    startAmount: 480,
    baseRatePerMin: 12,
  },
  helium3: {
    kind: 'helium3',
    label: 'helium-3',
    icon: 'zap',
    color: RESOURCE.helium3,
    startAmount: 325,
    baseRatePerMin: 8,
  },
  gold: {
    kind: 'gold',
    label: 'gold',
    icon: 'coins',
    color: RESOURCE.gold,
    startAmount: 140,
    baseRatePerMin: 0,
  },
  ore: {
    kind: 'ore',
    label: 'ore',
    icon: 'gem',
    color: RESOURCE.ore,
    startAmount: 75,
    baseRatePerMin: 4,
  },
}

/** A fresh starting stockpile (design frame values). */
export const startingResources = (): ResourceBag => ({
  grain: RESOURCE_META.grain.startAmount,
  helium3: RESOURCE_META.helium3.startAmount,
  gold: RESOURCE_META.gold.startAmount,
  ore: RESOURCE_META.ore.startAmount,
})
