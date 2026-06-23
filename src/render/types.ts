/**
 * types.ts — the rendering contract shared by the MapRenderer and every draw
 * layer.
 *
 * World coordinates are in **tiles** (a unit center is e.g. `{5.5, 3.5}`, a
 * building's `x,y` is its top-left tile, a resource node sits on one tile). The
 * MapRenderer installs a canvas transform so layers draw in **world-pixel**
 * space — multiply a tile coordinate by `TILE` and draw. Screen-space overlays
 * (the drag-select rectangle) are drawn separately with the transform reset.
 */
import type { Snapshot } from '@/game/sim/snapshot'
import type { GameMap } from '@/game/sim/map'
import type { EntityId } from '@/game/sim/entities'
import type { BuildingKind } from '@/game/data/buildings'
import type { Camera } from './Camera'

/** A building being placed: its kind and footprint, drawn as a cursor ghost. */
export interface PlacementState {
  kind: BuildingKind
  w: number
  h: number
}

export interface ScreenRect {
  x: number
  y: number
  w: number
  h: number
}

/** UI-owned, per-frame view state the renderer reads (mutated by the Viewport). */
export interface ViewState {
  /** Currently selected entity ids (own units/buildings). */
  selected: Set<EntityId>
  /** Entity under the cursor, or null. */
  hover: EntityId | null
  /** Active drag-select rectangle in CSS screen px, or null. */
  dragRect: ScreenRect | null
  /** Last cursor position (CSS px) and whether it's over the viewport. */
  mouse: { x: number; y: number; inside: boolean }
  /** Held pan directions: any of 'up' | 'down' | 'left' | 'right'. */
  panKeys: Set<string>
  /** Building placement in progress (cursor ghost), or null. */
  placement: PlacementState | null
}

export function createViewState(): ViewState {
  return {
    selected: new Set(),
    hover: null,
    dragRect: null,
    mouse: { x: 0, y: 0, inside: false },
    panKeys: new Set(),
    placement: null,
  }
}

/** Everything a draw layer needs. Layers are pure `(lc) => void` functions. */
export interface LayerCtx {
  ctx: CanvasRenderingContext2D
  cam: Camera
  /** Static terrain grid (immutable for the match). */
  map: GameMap
  /** Latest sim snapshot (entity render list + scalars). */
  snap: Snapshot
  /** Interpolation fraction into the current tick (0..1). */
  alpha: number
  selected: ReadonlySet<EntityId>
  hover: EntityId | null
  /** Wall-clock ms for animations (pings); never read by the sim. */
  now: number
}

export type DrawLayer = (lc: LayerCtx) => void
