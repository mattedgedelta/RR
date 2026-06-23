/**
 * rates.ts — per-player trailing-window income tracker.
 *
 * The HUD's `▲rate` is the *measured* per-minute income, not a static figure:
 * deposits are credited per tick into a fixed-length ring buffer; the windowed
 * sum is scaled to a per-minute figure. A trailing window (not an instantaneous
 * reading) smooths the lumpy "deposit 10 on arrival" cadence into a steady rate.
 */
import { RESOURCE_KINDS, type ResourceKind, type ResourceBag, emptyBag } from '../../data/resources'
import { TICK_HZ } from '../world'

/** Window length in ticks (≈12s at 10 Hz). */
const WINDOW = 120

const RES_INDEX: Record<ResourceKind, number> = { grain: 0, helium3: 1, gold: 2, ore: 3 }

export class RateTracker {
  /** Per-tick gains, laid out [tick*4 + resourceIndex]. */
  private readonly ring = new Float64Array(WINDOW * 4)
  private readonly sum = new Float64Array(4)
  private readonly pending = new Float64Array(4)
  private idx = 0
  /** Smoothed income per minute, read by the snapshot. */
  readonly perMin: ResourceBag = emptyBag()

  /** Credit a deposit toward this tick's income. */
  record(resource: ResourceKind, amount: number): void {
    this.pending[RES_INDEX[resource]] += amount
  }

  /** Advance the window by one tick and recompute `perMin`. Call once per tick. */
  tick(): void {
    const base = this.idx * 4
    for (let i = 0; i < 4; i++) {
      this.sum[i] += this.pending[i] - this.ring[base + i]
      this.ring[base + i] = this.pending[i]
      this.pending[i] = 0
    }
    this.idx = (this.idx + 1) % WINDOW
    const ticksPerMin = 60 * TICK_HZ
    for (let i = 0; i < 4; i++) {
      this.perMin[RESOURCE_KINDS[i]] = (this.sum[i] * ticksPerMin) / WINDOW
    }
  }
}
