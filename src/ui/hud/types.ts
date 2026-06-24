/**
 * types.ts — view-models the HUD widgets render.
 *
 * Widgets are presentational: they take these structs as props. Phase 6 feeds
 * them from fixtures (the design frame); Phase 7 projects them from the live
 * Snapshot + selection. Keeping the widgets prop-driven lets the HUD be verified
 * for fidelity before the engine is wired in.
 */
import type { IconName } from '@/theme/icons'
import type { ResourceKind, Cost } from '@/game/data/resources'

export interface ResourceItem {
  kind: ResourceKind
  label: string
  icon: IconName
  color: string
  amount: number
  /** Per-minute trickle; 0 renders flat. */
  rate: number
}

export interface AgeView {
  /** UPPERCASE current age name, e.g. INITIATE. */
  name: string
  index: number
  segmentsFilled: number
  segmentsTotal: number
  /** Next-age advance, or null at the top age. */
  advance: { label: string; cost: Cost } | null
  inProgress: boolean
  progress01: number
}

export type StatTone = 'default' | 'accent' | 'warn' | 'error'

export interface SelectionStat {
  label: string
  value: string
  tone?: StatTone
}

export interface ProductionView {
  unit: string
  progress01: number
  queueLen: number
  etaSec: number
  /** Full queue (head first) as unit kinds, for the cancellable queue strip. */
  queue: string[]
}

export interface SelectionView {
  /** lowercase_snake entity label, e.g. spire. */
  name: string
  owner: number
  hp: number
  maxHp: number
  /** Label for the bar (default 'hp'; 'remaining' for resource nodes). */
  barLabel?: string
  /** House tag, e.g. MARS. */
  badge?: string
  stats: SelectionStat[]
  production?: ProductionView | null
  /** Multi-select breakdown (kind → count). */
  composition?: { kind: string; count: number }[]
  /** Active gather job for a selected worker (carry fill + phase). */
  gather?: { resource: string; progress01: number; phase: string }
}

export interface CommandSlot {
  hotkey: string
  label: string
  icon?: IconName
  variant?: 'default' | 'primary' | 'disabled'
  cost?: Cost
  /** False when the player can't currently afford `cost` (cost shown in red). */
  affordable?: boolean
}
