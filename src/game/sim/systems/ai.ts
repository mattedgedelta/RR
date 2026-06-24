/**
 * ai.ts — one controller per CPU player, on a staggered think cadence.
 *
 * Each controller thinks every `thinkIntervalTicks` (per difficulty) at its own
 * per-player offset, so eight opponents never all compute on the same frame.
 *
 * A turn, in priority order:
 *   1. keep idle workers gathering — biased toward the resource the player is
 *      most short on (weighted toward grain, so the economy + food keep up);
 *   2. ADVANCE AGE whenever it's affordable and an economy exists — this is what
 *      unlocks the military buildings and the Gold/Yellow/Howler castes;
 *   3. run a build order up the caste pyramid (Granary → Legion Hall / Exchange
 *      → Institute / Kennel), one structure per turn;
 *   4. train the pyramid: Reds for economy, Golds for command capacity, line
 *      troops + heavies from the Legion Hall, Howlers (Mars) and a couple of
 *      Yellow medics — never overspending grain into starvation;
 *   5. raid once enough idle military has massed.
 *
 * Everything goes through the shared command queue — no cheating beyond
 * difficulty tuning — and allies are never targeted.
 */
import { UNITS } from '../../data/units'
import { BUILDINGS, buildAge, type BuildingKind } from '../../data/buildings'
import { AGES, ageAtLeast } from '../../data/ages'
import { HOUSES } from '../../data/houses'
import { RESOURCE_KINDS, canAfford, type ResourceKind } from '../../data/resources'
import { DIFFICULTY_TIERS, type DifficultyTier } from '../../data/players'
import { footprintBuildable, findNearestTile } from '../map'
import { dispatch } from '../commands'
import { areAllied, type World, type Player } from '../world'
import type { Building, ResourceNode, Unit } from '../entities'

const TARGET_WORKERS = 8
const RAID_SIZE = 6
/** Target share of the workforce per resource (grain-heavy: it feeds upkeep,
 *  units, and every age). Halved for a resource already stockpiled past PLENTY,
 *  so surplus workers flow back to grain/ore instead of hoarding. */
const GATHER_WEIGHT: Record<ResourceKind, number> = { grain: 4, ore: 1, helium3: 1, gold: 1 }
const PLENTY = 500
/** Build order up the caste pyramid; each gated by its own unlock age. */
const BUILD_ORDER: BuildingKind[] = ['granary', 'legionHall', 'exchange', 'institute', 'kennel']

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
  const count = unitCounts() // includes queued units so we don't over-train
  for (const b of world.buildings.values()) {
    if (b.owner !== p.id) continue
    buildings.push(b)
    for (const item of b.queue) count[item.unit]++
  }
  for (const u of world.units.values()) {
    if (u.owner !== p.id) continue
    count[u.kind]++
    if (UNITS[u.kind].canGather) workers.push(u)
    else military.push(u)
  }

  const spire = buildings.find((b) => b.kind === 'spire' && b.state === 'complete')
  const base = spire ?? buildings[0]
  const targetWorkers = Math.round(TARGET_WORKERS * tier.economyMul)
  const grainOk = !p.starving && p.resources.grain > 80
  // Grain we're netting per minute after upkeep. Soldiers are only trained when
  // there's surplus to feed them — this is what stops the AI massing an army it
  // can't sustain and starving its own workers (the weakest) into a death spiral.
  const foodSurplus = (p.rateTracker.perMin.grain ?? 0) - p.grainUpkeep

  // Don't dump every grain into troops while there's still infrastructure to
  // buy. Bank for the next investment — teching toward Peerless, or the next
  // unbuilt pyramid building (Legion Hall → Institute → Kennel) — keeping only a
  // small defensive force meanwhile. Once nothing's left to save for, mass.
  const advance = AGES[p.age].advance
  const ageSaving = !p.ageProgress && !!advance && !canAfford(p.resources, advance.cost) && !ageAtLeast(p.age, 'peerless')
  const nextBuild = BUILD_ORDER.find(
    (k) =>
      !buildings.some((b) => b.kind === k) &&
      !(k === 'kennel' && !HOUSES[p.house].uniques.units.includes('howler')) &&
      ageAtLeast(p.age, buildAge(k)),
  )
  const buildSaving = !!nextBuild && !canAfford(p.resources, BUILDINGS[nextBuild].cost)
  const minDefense = Math.max(4, Math.round(RAID_SIZE * tier.aggression))
  const canMass = !(ageSaving || buildSaving) || military.length < minDefense

  // 1) Keep the workforce balanced across resources (grain-heavy). Idle workers
  //    are assigned to the most under-staffed resource; one committed worker per
  //    turn is nudged off an over-staffed resource so a bad early split corrects.
  if (base && workers.length) {
    const ox = base.x + base.w / 2
    const oy = base.y + base.h / 2
    balanceWorkers(world, p, workers, ox, oy)
  }

  // 2) Advance age once an economy exists — this unlocks the war machine.
  if (!p.ageProgress && advance && canAfford(p.resources, advance.cost) && workers.length >= Math.max(3, targetWorkers * 0.5)) {
    dispatch(world, { type: 'advanceAge', player: p.id })
  }

  // 3) Build order — one structure per turn, only when unlocked + affordable.
  if (base) {
    for (const kind of BUILD_ORDER) {
      if (buildings.some((b) => b.kind === kind)) continue // built or under construction
      if (kind === 'kennel' && !HOUSES[p.house].uniques.units.includes('howler')) continue
      if (!ageAtLeast(p.age, buildAge(kind))) continue
      if (!canAfford(p.resources, BUILDINGS[kind].cost)) continue
      const builder = workers.find((w) => w.order === 'gather' || w.order === 'idle')
      if (!builder) break
      const fp = BUILDINGS[kind].footprint
      const spot = buildSpot(world, base, fp.w, fp.h)
      if (spot) {
        dispatch(world, { type: 'build', player: p.id, builderIds: [builder.id], building: kind, x: spot.x, y: spot.y })
        break
      }
    }
  }

  // 4) Economy: train Reds toward the worker target.
  if (spire && workers.length < targetWorkers && spire.queue.length < 2) {
    dispatch(world, { type: 'train', player: p.id, buildingId: spire.id, unit: 'red' })
  }

  // 5) Command: at Peerless, raise the cap with Golds when near the ceiling or
  //    too few are leading the army.
  if (spire && grainOk && canMass && spire.queue.length < 2 && ageAtLeast(p.age, UNITS.gold.requiredAge)) {
    const nearCap = p.pop >= p.popCap - 4
    const wantGolds = 1 + Math.floor(military.length / 10)
    if ((nearCap || count.gold < wantGolds) && foodSurplus > UNITS.gold.upkeep && canAfford(p.resources, UNITS.gold.cost)) {
      dispatch(world, { type: 'train', player: p.id, buildingId: spire.id, unit: 'gold' })
    }
  }

  // 6) Army + medics — train ONE unit per turn, the least-represented affordable
  //    pick, so the army diversifies (Obsidian/Howler/Yellow) instead of the
  //    first building draining the grain and starving out the others.
  if (grainOk && canMass) {
    let pick: { b: Building; unit: 'gray' | 'obsidian' | 'howler' | 'yellow' } | null = null
    for (const b of buildings) {
      if (b.state !== 'complete' || b.queue.length >= 2 || b.kind === 'spire') continue
      const unit = armyUnitFor(b.kind, p, count)
      if (!unit) continue
      if (p.pop + UNITS[unit].pop > p.popCap) continue
      if (foodSurplus <= UNITS[unit].upkeep) continue // only what we can feed
      if (!canAfford(p.resources, UNITS[unit].cost)) continue
      if (!pick || count[unit] < count[pick.unit]) pick = { b, unit }
    }
    if (pick) dispatch(world, { type: 'train', player: p.id, buildingId: pick.b.id, unit: pick.unit })
  }

  // 7) Raid once enough idle military has massed.
  const raidSize = Math.max(3, Math.round(RAID_SIZE * tier.aggression))
  const idleMilitary = military.filter((u) => u.order === 'idle')
  if (idleMilitary.length >= raidSize) {
    const enemy = nearestEnemyBuilding(world, p, base)
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

/** Which unit a given production building should train next (null = none). */
function armyUnitFor(kind: BuildingKind, p: Player, count: Record<string, number>): 'gray' | 'obsidian' | 'howler' | 'yellow' | null {
  if (kind === 'legionHall') {
    // Prefer Obsidian heavies once affordable, else Gray line infantry.
    return canAfford(p.resources, UNITS.obsidian.cost) ? 'obsidian' : 'gray'
  }
  if (kind === 'kennel') return 'howler'
  if (kind === 'institute') return count.yellow < 2 ? 'yellow' : null
  return null
}

/** Assign idle workers and gently rebalance committed ones toward the target
 *  resource shares, so the AI doesn't strand its whole crew on one pile. */
function balanceWorkers(world: World, p: Player, workers: Unit[], ox: number, oy: number): void {
  const present = new Set<ResourceKind>()
  for (const n of world.resources.values()) if (n.amount > 0) present.add(n.resource)
  if (!present.size) return

  // Effective weight: discount resources we've already stockpiled past PLENTY.
  let totalW = 0
  const weight = {} as Record<ResourceKind, number>
  for (const k of RESOURCE_KINDS) {
    weight[k] = present.has(k) ? GATHER_WEIGHT[k] * ((p.resources[k] ?? 0) > PLENTY ? 0.25 : 1) : 0
    totalW += weight[k]
  }
  if (totalW <= 0) return

  // Current staffing per resource + the pool of idle workers to assign. Workers
  // doing anything else (constructing, moving) are left strictly alone — pulling
  // a builder back to gather would strand the foundation half-built.
  const cur = {} as Record<ResourceKind, number>
  for (const k of RESOURCE_KINDS) cur[k] = 0
  const idle: Unit[] = []
  for (const w of workers) {
    const r = w.gather?.resource
    if (w.order === 'gather' && r && present.has(r)) cur[r]++
    else if (w.order === 'idle') idle.push(w)
  }
  const desired = (k: ResourceKind): number => (weight[k] / totalW) * workers.length
  const mostUnder = (): ResourceKind | null => {
    let best: ResourceKind | null = null
    let bestGap = -Infinity
    for (const k of RESOURCE_KINDS) {
      if (!present.has(k)) continue
      const gap = desired(k) - cur[k]
      if (gap > bestGap) {
        bestGap = gap
        best = k
      }
    }
    return best
  }

  // Assign the free pool to wherever we're shortest.
  for (const w of idle) {
    const k = mostUnder()
    const node = (k && nearestNode(world, ox, oy, k)) ?? nearestNode(world, ox, oy, null)
    if (!node) break
    dispatch(world, { type: 'gather', player: p.id, unitIds: [w.id], nodeId: node.id })
    cur[node.resource]++
  }

  // Nudge one over-staffed worker toward the most under-staffed resource.
  let over: ResourceKind | null = null
  let overGap = 1 // require a real surplus before poaching
  for (const k of RESOURCE_KINDS) {
    if (!present.has(k)) continue
    const gap = cur[k] - desired(k)
    if (gap > overGap) {
      overGap = gap
      over = k
    }
  }
  const under = mostUnder()
  if (over && under && over !== under && desired(under) - cur[under] > 1) {
    const mover = workers.find((w) => w.gather?.resource === over && w.order === 'gather')
    const node = nearestNode(world, ox, oy, under) ?? nearestNode(world, ox, oy, null)
    if (mover && node) dispatch(world, { type: 'gather', player: p.id, unitIds: [mover.id], nodeId: node.id })
  }
}

function unitCounts(): Record<string, number> {
  const c: Record<string, number> = {}
  for (const k of Object.keys(UNITS)) c[k] = 0
  return c
}

/** Nearest non-empty node to (x, y); when `resource` is set, only that type. */
function nearestNode(world: World, x: number, y: number, resource: ResourceKind | null): ResourceNode | undefined {
  let best: ResourceNode | undefined
  let bestD = Infinity
  for (const n of world.resources.values()) {
    if (n.amount <= 0) continue
    if (resource && n.resource !== resource) continue
    const d = (n.x - x) ** 2 + (n.y - y) ** 2
    if (d < bestD) {
      bestD = d
      best = n
    }
  }
  return best
}

/** A buildable w×h footprint spiralling out from a building. */
function buildSpot(world: World, near: Building, w: number, h: number): { x: number; y: number } | null {
  const ax = near.x + 2
  const ay = near.y + 2
  return findNearestTile(world.map, ax, ay, (x, y) => footprintBuildable(world.map, x, y, w, h), 8)
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
