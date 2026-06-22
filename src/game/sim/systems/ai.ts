/**
 * ai.ts — one controller per CPU player (1–7). Keeps workers gathering, runs a
 * timed/age-gated build order, and forms raid groups, all via the same command
 * queue (no cheating beyond difficulty tuning). Uses a staggered think cadence
 * (`AiState.nextThinkTick`) so many opponents don't spike a single frame, and
 * respects team alliances.
 *
 * Stub: implemented in Phase 10 (Combat / AI / win).
 */
import type { World } from '../world'

export function runAi(_world: World): void {
  // Phase 10: per-CPU staggered thinking → dispatch commands
}
