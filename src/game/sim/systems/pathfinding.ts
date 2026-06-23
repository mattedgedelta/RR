/**
 * pathfinding.ts — budgeted A* (octile, 8-directional, no corner-cutting) over
 * the tile grid.
 *
 * Assigns `path` (a list of tile-centre waypoints) to any unit that has a
 * `moveGoal` but no path yet. A per-tick request budget bounds CPU when many
 * units repath at once; a per-tick cache dedupes identical (start→goal) tile
 * requests within the same tick (e.g. a group ordered to one spot). Goals that
 * land on an occupied/impassable tile (a resource node, a building footprint)
 * resolve to the nearest passable tile so workers route to a standing spot.
 */
import { isPassable, findNearestTile, type GameMap } from '../map'
import type { Vec2 } from '../entities'
import type { World } from '../world'

/** Max A* searches per tick; excess waits for a later tick. */
const MAX_PATHS_PER_TICK = 8
const SQRT2 = Math.SQRT2

export function runPathfinding(world: World): void {
  let budget = MAX_PATHS_PER_TICK
  const cache = new Map<string, Vec2[] | null>()

  // id-ordered for determinism (Map iteration is insertion = id order).
  for (const u of world.units.values()) {
    if (budget <= 0) break
    if (!u.moveGoal || u.path) continue

    const sx = Math.floor(u.x)
    const sy = Math.floor(u.y)
    const gx = Math.floor(u.moveGoal.x)
    const gy = Math.floor(u.moveGoal.y)
    const key = `${sx},${sy}>${gx},${gy}`

    let path = cache.get(key)
    if (path === undefined) {
      path = findPath(world.map, sx, sy, gx, gy)
      cache.set(key, path)
      budget--
    }

    if (path && path.length) {
      u.path = path
      u.pathStep = 0
    } else {
      // Unreachable: abandon the goal so we don't burn budget retrying.
      u.moveGoal = null
      u.path = null
      if (u.order === 'move' || u.order === 'attackMove') u.order = 'idle'
    }
  }
}

/** A* from tile (sx,sy) to (gx,gy); returns tile-centre waypoints or null. */
export function findPath(map: GameMap, sx: number, sy: number, gx: number, gy: number): Vec2[] | null {
  // Resolve a blocked goal to the nearest passable tile (node/building targets).
  if (!isPassable(map, gx, gy)) {
    const n = findNearestTile(map, gx, gy, (x, y) => isPassable(map, x, y), 8)
    if (!n) return null
    gx = n.x
    gy = n.y
  }
  if (!isPassable(map, sx, sy)) {
    const n = findNearestTile(map, sx, sy, (x, y) => isPassable(map, x, y), 4)
    if (n) {
      sx = n.x
      sy = n.y
    }
  }
  if (sx === gx && sy === gy) return [{ x: gx + 0.5, y: gy + 0.5 }]

  const W = map.width
  const H = map.height
  const N = W * H
  const gScore = new Float64Array(N).fill(Infinity)
  const came = new Int32Array(N).fill(-1)
  const closed = new Uint8Array(N)
  const heap = new MinHeap()

  const start = sy * W + sx
  const goal = gy * W + gx
  gScore[start] = 0
  heap.push(start, octile(sx, sy, gx, gy))

  while (!heap.empty()) {
    const cur = heap.pop()
    if (closed[cur]) continue
    closed[cur] = 1
    if (cur === goal) return reconstruct(came, goal, W)

    const cx = cur % W
    const cy = (cur - cx) / W
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue
        const nx = cx + dx
        const ny = cy + dy
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
        if (!isPassable(map, nx, ny)) continue
        // No corner-cutting: a diagonal needs both orthogonal cells open.
        if (dx !== 0 && dy !== 0) {
          if (!isPassable(map, cx + dx, cy) || !isPassable(map, cx, cy + dy)) continue
        }
        const ni = ny * W + nx
        if (closed[ni]) continue
        const t = gScore[cur] + (dx !== 0 && dy !== 0 ? SQRT2 : 1)
        if (t < gScore[ni]) {
          gScore[ni] = t
          came[ni] = cur
          heap.push(ni, t + octile(nx, ny, gx, gy))
        }
      }
    }
  }
  return null
}

function octile(x: number, y: number, gx: number, gy: number): number {
  const dx = Math.abs(x - gx)
  const dy = Math.abs(y - gy)
  return dx + dy + (SQRT2 - 2) * Math.min(dx, dy)
}

function reconstruct(came: Int32Array, goal: number, W: number): Vec2[] {
  const tiles: number[] = []
  for (let c = goal; c !== -1; c = came[c]) tiles.push(c)
  tiles.reverse()
  const path: Vec2[] = []
  // Skip tiles[0] — the unit already occupies the start tile.
  for (let i = 1; i < tiles.length; i++) {
    const x = tiles[i] % W
    const y = (tiles[i] - x) / W
    path.push({ x: x + 0.5, y: y + 0.5 })
  }
  return path
}

/** Binary min-heap over (nodeIndex, fScore) parallel arrays. */
class MinHeap {
  private ids: number[] = []
  private fs: number[] = []

  empty(): boolean {
    return this.ids.length === 0
  }

  push(id: number, f: number): void {
    this.ids.push(id)
    this.fs.push(f)
    this.up(this.ids.length - 1)
  }

  pop(): number {
    const topId = this.ids[0]
    const lastId = this.ids.pop() as number
    const lastF = this.fs.pop() as number
    if (this.ids.length) {
      this.ids[0] = lastId
      this.fs[0] = lastF
      this.down(0)
    }
    return topId
  }

  private up(i: number): void {
    while (i > 0) {
      const p = (i - 1) >> 1
      if (this.fs[p] <= this.fs[i]) break
      this.swap(i, p)
      i = p
    }
  }

  private down(i: number): void {
    const n = this.ids.length
    for (;;) {
      const l = 2 * i + 1
      const r = l + 1
      let s = i
      if (l < n && this.fs[l] < this.fs[s]) s = l
      if (r < n && this.fs[r] < this.fs[s]) s = r
      if (s === i) break
      this.swap(i, s)
      i = s
    }
  }

  private swap(a: number, b: number): void {
    const ti = this.ids[a]
    this.ids[a] = this.ids[b]
    this.ids[b] = ti
    const tf = this.fs[a]
    this.fs[a] = this.fs[b]
    this.fs[b] = tf
  }
}
