/** fog — deferred. The FOG % mask is implemented in Phase 11; this no-op keeps
 *  the layer in the pipeline so wiring it later is a one-line change. */
import type { DrawLayer } from '../types'

export const drawFog: DrawLayer = () => {
  /* intentionally empty until Phase 11 */
}
