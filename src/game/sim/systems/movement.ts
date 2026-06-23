/**
 * movement.ts — path following plus lightweight local separation.
 *
 * Each unit with a `path` advances along its waypoints at the unit def's speed
 * (tiles/sec → per-tick), consuming the whole tick's distance across multiple
 * waypoints for smooth motion. On consuming the path, `arrive` resolves the
 * order: plain moves go idle; gather/build/attack leave the order alone so their
 * own systems handle the in-range hand-off. A separation pass then nudges
 * actively-moving units apart so crowds don't stack on one tile (cheaper and
 * smoother than routing every unit around every other unit with A*).
 */
import { isPassable } from '../map'
import { UNITS } from '../../data/units'
import { TICK_HZ, type World } from '../world'
import type { Unit } from '../entities'

const DT = 1 / TICK_HZ
/** Distance at which two moving units start pushing apart (tiles). */
const SEP_RADIUS = 0.6
/** Max separation nudge applied per tick (tiles). */
const SEP_MAX = 0.12

export function runMovement(world: World): void {
  for (const u of world.units.values()) follow(u)
  separate(world)
}

function follow(u: Unit): void {
  if (!u.path || u.path.length === 0) return
  let budget = UNITS[u.kind].speed * DT
  while (budget > 0 && u.pathStep < u.path.length) {
    const t = u.path[u.pathStep]
    const dx = t.x - u.x
    const dy = t.y - u.y
    const d = Math.hypot(dx, dy)
    if (d <= budget) {
      u.x = t.x
      u.y = t.y
      budget -= d
      u.pathStep++
    } else {
      u.x += (dx / d) * budget
      u.y += (dy / d) * budget
      budget = 0
    }
  }
  if (u.pathStep >= u.path.length) {
    u.path = null
    u.pathStep = 0
    arrive(u)
  }
}

function arrive(u: Unit): void {
  // gather / build / attack keep their order — their systems take over in range.
  if (u.order === 'move' || u.order === 'attackMove') {
    u.order = 'idle'
    u.moveGoal = null
  }
}

/** Push overlapping moving units apart using a 1-tile bucket grid. */
function separate(world: World): void {
  const W = world.map.width
  const buckets = new Map<number, Unit[]>()
  for (const u of world.units.values()) {
    const k = Math.floor(u.y) * W + Math.floor(u.x)
    const arr = buckets.get(k)
    if (arr) arr.push(u)
    else buckets.set(k, [u])
  }

  for (const u of world.units.values()) {
    if (!u.path) continue // only nudge units that are actively moving
    let px = 0
    let py = 0
    const bx = Math.floor(u.x)
    const by = Math.floor(u.y)
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const arr = buckets.get((by + dy) * W + (bx + dx))
        if (!arr) continue
        for (const v of arr) {
          if (v === u) continue
          const ox = u.x - v.x
          const oy = u.y - v.y
          const d = Math.hypot(ox, oy)
          if (d > 0 && d < SEP_RADIUS) {
            const force = (SEP_RADIUS - d) / SEP_RADIUS
            px += (ox / d) * force
            py += (oy / d) * force
          }
        }
      }
    }
    if (px === 0 && py === 0) continue
    const mag = Math.hypot(px, py)
    const scale = Math.min(SEP_MAX, mag) / mag
    const nx = u.x + px * scale
    const ny = u.y + py * scale
    // Don't shove a unit into an impassable tile.
    if (isPassable(world.map, Math.floor(nx), Math.floor(ny))) {
      u.x = nx
      u.y = ny
    }
  }
}
