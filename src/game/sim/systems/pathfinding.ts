/**
 * pathfinding.ts — A* (octile, 8-dir) over the tile grid with a per-tick
 * request budget and a path cache. Resolves `repathCooldown` and assigns
 * `path` to units that have a `moveGoal` but no current path.
 *
 * Stub: implemented in Phase 8 (Economy / movement).
 */
import type { World } from '../world'

export function runPathfinding(_world: World): void {
  // Phase 8: budgeted A* + cache → unit.path
}
