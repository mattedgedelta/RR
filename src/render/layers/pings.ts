/** pings — deferred. Expanding UNDER_ATTACK rings are driven by combat events in
 *  Phase 10; this no-op holds the pipeline slot until then. */
import type { DrawLayer } from '../types'

export const drawPings: DrawLayer = () => {
  /* intentionally empty until Phase 10 */
}
