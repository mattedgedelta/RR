/**
 * ai.ts — one controller per CPU player, on a staggered think cadence.
 *
 * Each controller thinks every `thinkIntervalTicks` (per difficulty) at its own
 * per-player offset, so eight opponents never all compute on the same frame. A
 * turn: keep idle workers gathering, run a small build order (ensure a Legion
 * Hall), train workers toward a difficulty-scaled target plus any unlocked
 * military, and once enough idle military has massed, attack-move it at the
 * nearest enemy base. Everything goes through the shared command queue — no
 * cheating beyond difficulty tuning — and allies are never targeted. Military
 * stays dormant until ages unlock those units (Phase 11).
 */
import { UNITS } from '../../data/units'
import { BUILDINGS } from '../../data/buildings'
import { DIFFICULTY_TIERS, type DifficultyTier } from '../../data/players'
import { canAfford } from '../../data/resources'
import { footprintBuildable, findNearestTile } from '../map'
import { dispatch } from '../commands'
import { areAllied, type World, type Player } from '../world'
import type { Building, ResourceNode, Unit } from '../entities'

const TARGET_WORKERS = 8
const RAID_SIZE = 6

export function runAi(world: World): void {
  for (const p of world.players) {
    if (!p.ai || p.defeated) continue
    if (world.tick < p.ai.nextThinkTick) continue
    const tier = DIFFICULTY_TIERS[p.difficulty]
    p.ai.nextThinkTick = world.tick + tier.thinkIntervalTicks
    think(world, p, tier)
  }
}

function think(world: World, p: Player, tier: DifficultyTier): void {
  const buildings: Building[] = []
  const workers: Unit[] = []
  const military: Unit[] = []
  for (const b of world.buildings.values()) if (b.owner === p.id) buildings.push(b)
  for (const u of world.units.values()) {
    if (u.owner !== p.id) continue
    if (UNITS[u.kind].canGather) workers.push(u)
    else military.push(u)
  }

  // 1) Idle workers → gather the nearest node.
  for (const w of workers) {
    if (w.order !== 'idle') continue
    const node = nearestNode(world, w.x, w.y)
    if (node) dispatch(world, { type: 'gather', player: p.id, unitIds: [w.id], nodeId: node.id })
  }

  const spire = buildings.find((b) => b.kind === 'spire' && b.state === 'complete')

  // 2) Build order: ensure a Legion Hall (counts foundations so we build one once).
  if (!buildings.some((b) => b.kind === 'legionHall') && canAfford(p.resources, BUILDINGS.legionHall.cost)) {
    const builder = workers.find((w) => w.order === 'gather' || w.order === 'idle')
    const anchor = spire ?? buildings[0]
    if (builder && anchor) {
      const spot = buildSpot(world, anchor)
      if (spot) {
        dispatch(world, { type: 'build', player: p.id, builderIds: [builder.id], building: 'legionHall', x: spot.x, y: spot.y })
      }
    }
  }

  // 3) Train workers toward a difficulty-scaled target.
  const targetWorkers = Math.round(TARGET_WORKERS * tier.economyMul)
  if (spire && workers.length < targetWorkers && spire.queue.length < 2) {
    dispatch(world, { type: 'train', player: p.id, buildingId: spire.id, unit: 'pioneer' })
  }

  // 3b) Train any unlocked military from production buildings (age-gated by command).
  for (const b of buildings) {
    if (b.state !== 'complete' || b.queue.length >= 2) continue
    const unit = BUILDINGS[b.kind].produces.find((u) => u !== 'pioneer')
    if (unit) dispatch(world, { type: 'train', player: p.id, buildingId: b.id, unit })
  }

  // 4) Raid once enough idle military has massed.
  const raidSize = Math.max(3, Math.round(RAID_SIZE * tier.aggression))
  const idleMilitary = military.filter((u) => u.order === 'idle')
  if (idleMilitary.length >= raidSize) {
    const enemy = nearestEnemyBuilding(world, p, spire ?? buildings[0])
    if (enemy) {
      dispatch(world, {
        type: 'move',
        player: p.id,
        unitIds: idleMilitary.map((u) => u.id),
        x: enemy.x + enemy.w / 2,
        y: enemy.y + enemy.h / 2,
        attackMove: true,
      })
    }
  }
}

function nearestNode(world: World, x: number, y: number): ResourceNode | undefined {
  let best: ResourceNode | undefined
  let bestD = Infinity
  for (const n of world.resources.values()) {
    if (n.amount <= 0) continue
    const d = (n.x - x) ** 2 + (n.y - y) ** 2
    if (d < bestD) {
      bestD = d
      best = n
    }
  }
  return best
}

/** A buildable 2×2 footprint spiralling out from a building. */
function buildSpot(world: World, near: Building): { x: number; y: number } | null {
  const ax = near.x + 2
  const ay = near.y + 2
  return findNearestTile(world.map, ax, ay, (x, y) => footprintBuildable(world.map, x, y, 2, 2), 8)
}

function nearestEnemyBuilding(world: World, p: Player, from: Building | undefined): Building | undefined {
  const ox = from ? from.x : world.map.centerX
  const oy = from ? from.y : world.map.centerY
  let best: Building | undefined
  let bestD = Infinity
  for (const b of world.buildings.values()) {
    if (areAllied(world, p.id, b.owner)) continue
    const d = (b.x - ox) ** 2 + (b.y - oy) ** 2
    if (d < bestD) {
      bestD = d
      best = b
    }
  }
  return best
}
