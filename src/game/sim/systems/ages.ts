/**
 * ages.ts — advance any in-progress age research and apply its effects.
 *
 * The `advanceAge` command charges the cost and starts an `ageProgress` timer;
 * this system ticks it down and, on completion, promotes the player's age and
 * raises the population cap. Age gating elsewhere (build/train/tech checks via
 * `ageAtLeast`) then automatically unlocks the new column — e.g. reaching
 * Initiate makes obsidians trainable and the Forge/Exchange/Kennel buildable.
 */
import { AGES } from '../../data/ages'
import type { World } from '../world'

export function runAges(world: World): void {
  for (const p of world.players) {
    const prog = p.ageProgress
    if (!prog) continue
    prog.remaining--
    if (prog.remaining <= 0) {
      p.age = prog.to
      p.popCap += AGES[prog.to].popCapBonus
      p.ageProgress = null
    }
  }
}
