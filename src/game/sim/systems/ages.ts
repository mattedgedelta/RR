/**
 * ages.ts — advances any in-progress age research and applies its effects on
 * completion (raise pop cap, unlock the next tech column, stat bumps).
 *
 * Stub: implemented in Phase 11 (Ages / tech / houses). The advance is started
 * by the `advanceAge` command in commands.ts; this system ticks the timer.
 */
import type { World } from '../world'

export function runAges(_world: World): void {
  // Phase 11: decrement ageProgress, complete advance, apply effects
}
