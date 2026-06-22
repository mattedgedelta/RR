/**
 * map.ts — the tile grid: terrain, occupancy, passability, and N balanced
 * radial start positions.
 *
 * The grid is square and its size scales with player count (≈26 for a 1v1 up to
 * ≈72 for 8) unless an explicit map size is chosen. Only `rock` terrain is
 * impassable; everything else is cosmetic. A tile is passable when its terrain
 * is passable AND it has no occupant (buildings / resource nodes occupy tiles;
 * units do not — crowding is handled by separation, not occupancy).
 */
import type { Rng } from './rng'
import { mapDim, type MapSizeId } from '../data/players'
import type { EntityId, Vec2 } from './entities'

export type TerrainKind = 'plain' | 'dust' | 'ridge' | 'crater' | 'rock'

const IMPASSABLE: ReadonlySet<TerrainKind> = new Set<TerrainKind>(['rock'])

export interface Tile {
  terrain: TerrainKind
  /** Entity occupying this tile (building/resource), or null. */
  occupantId: EntityId | null
}

export interface GameMap {
  width: number
  height: number
  /** Row-major tiles, length width*height. */
  tiles: Tile[]
  /** One balanced start position per player (tile coords). */
  startPositions: Vec2[]
  centerX: number
  centerY: number
}

export const tileIndex = (map: GameMap, x: number, y: number): number =>
  y * map.width + x

export const inBounds = (map: GameMap, x: number, y: number): boolean =>
  x >= 0 && y >= 0 && x < map.width && y < map.height

export function tileAt(map: GameMap, x: number, y: number): Tile | null {
  if (!inBounds(map, x, y)) return null
  return map.tiles[tileIndex(map, x, y)]
}

/** Terrain-only passability (ignores occupancy). */
export function terrainPassable(map: GameMap, x: number, y: number): boolean {
  const t = tileAt(map, x, y)
  return t != null && !IMPASSABLE.has(t.terrain)
}

/** Passable for movement: in bounds, passable terrain, no occupant. */
export function isPassable(map: GameMap, x: number, y: number): boolean {
  const t = tileAt(map, x, y)
  return t != null && !IMPASSABLE.has(t.terrain) && t.occupantId === null
}

/** Buildable: same rule as passable (footprint must be all-clear). */
export const isBuildable = isPassable

export function setOccupant(map: GameMap, x: number, y: number, id: EntityId): void {
  const t = tileAt(map, x, y)
  if (t) t.occupantId = id
}

export function clearOccupant(map: GameMap, x: number, y: number): void {
  const t = tileAt(map, x, y)
  if (t) t.occupantId = null
}

/** Tiles covered by a footprint anchored at top-left (x, y). */
export function footprintTiles(x: number, y: number, w: number, h: number): Vec2[] {
  const out: Vec2[] = []
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) out.push({ x: x + dx, y: y + dy })
  }
  return out
}

/** True if a w×h footprint anchored at (x, y) is entirely buildable. */
export function footprintBuildable(
  map: GameMap,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  for (const t of footprintTiles(x, y, w, h)) {
    if (!isBuildable(map, t.x, t.y)) return false
  }
  return true
}

/**
 * Spiral-search outward from (x, y) for the nearest tile passing `ok`.
 * Returns null if none found within `maxRadius`.
 */
export function findNearestTile(
  map: GameMap,
  x: number,
  y: number,
  ok: (tx: number, ty: number) => boolean,
  maxRadius = 8,
): Vec2 | null {
  if (ok(x, y)) return { x, y }
  for (let r = 1; r <= maxRadius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
        const tx = x + dx
        const ty = y + dy
        if (inBounds(map, tx, ty) && ok(tx, ty)) return { x: tx, y: ty }
      }
    }
  }
  return null
}

/** Balanced radial start positions for `n` players around the map center. */
function radialStarts(rng: Rng, dim: number, n: number): Vec2[] {
  const cx = dim / 2
  const cy = dim / 2
  const radius = dim * 0.34
  const base = rng.range(0, Math.PI * 2)
  const lo = 2
  const hi = dim - 3
  const clamp = (v: number) => Math.max(lo, Math.min(hi, Math.round(v)))
  const starts: Vec2[] = []
  for (let i = 0; i < n; i++) {
    const a = base + (i * Math.PI * 2) / n
    starts.push({ x: clamp(cx + radius * Math.cos(a)), y: clamp(cy + radius * Math.sin(a)) })
  }
  return starts
}

/**
 * Generate a deterministic map for `playerCount` players. Lays mostly-plain
 * terrain with cosmetic dust/ridge patches and a few impassable rock clusters,
 * keeping a clear radius around each start position.
 */
export function generateMap(
  rng: Rng,
  playerCount: number,
  size: MapSizeId,
): GameMap {
  const dim = mapDim(size, playerCount)
  const tiles: Tile[] = new Array(dim * dim)
  for (let i = 0; i < tiles.length; i++) tiles[i] = { terrain: 'plain', occupantId: null }

  const map: GameMap = {
    width: dim,
    height: dim,
    tiles,
    startPositions: [],
    centerX: dim / 2,
    centerY: dim / 2,
  }
  map.startPositions = radialStarts(rng, dim, playerCount)

  const clearRadius = 5
  const nearStartOrCenter = (x: number, y: number): boolean => {
    if (Math.hypot(x - map.centerX, y - map.centerY) < clearRadius) return true
    for (const s of map.startPositions) {
      if (Math.hypot(x - s.x, y - s.y) < clearRadius) return true
    }
    return false
  }

  // Cosmetic terrain patches (passable).
  const patches = Math.floor(dim * dim * 0.05)
  for (let i = 0; i < patches; i++) {
    const x = rng.int(dim)
    const y = rng.int(dim)
    if (nearStartOrCenter(x, y)) continue
    tiles[tileIndex(map, x, y)].terrain = rng.chance(0.6) ? 'dust' : 'ridge'
  }

  // Impassable rock clusters, away from starts/center.
  const clusters = Math.max(2, Math.floor(dim / 8))
  for (let c = 0; c < clusters; c++) {
    const cx = rng.irange(2, dim - 3)
    const cy = rng.irange(2, dim - 3)
    const blobs = rng.irange(1, 4)
    for (let b = 0; b < blobs; b++) {
      const x = cx + rng.irange(-1, 1)
      const y = cy + rng.irange(-1, 1)
      if (!inBounds(map, x, y) || nearStartOrCenter(x, y)) continue
      tiles[tileIndex(map, x, y)].terrain = 'rock'
    }
  }

  return map
}
