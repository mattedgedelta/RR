/**
 * tick.ts — the fixed-timestep orchestrator (10 Hz).
 *
 * Advances the integer tick clock, drains commands, then runs every system in a
 * fixed, deterministic order. Systems are mostly stubs in Phase 3; this defines
 * the pipeline contract they fill in later. `cleanup` (real here) removes dead
 * entities and depleted resource nodes, freeing map occupancy and pop counts.
 */
import { UNITS } from '../data/units'
import { BUILDINGS } from '../data/buildings'
import { clearOccupant, footprintTiles } from './map'
import type { World } from './world'
import { applyCommands } from './commands'
import { runAi } from './systems/ai'
import { runPathfinding } from './systems/pathfinding'
import { runMovement } from './systems/movement'
import { runEconomy } from './systems/economy'
import { runConstruction } from './systems/construction'
import { runProduction } from './systems/production'
import { runCombat } from './systems/combat'
import { runCastes } from './systems/castes'
import { runAges } from './systems/ages'
import { runWin } from './systems/win'

/** Advance the world by exactly one simulation tick. */
export function tick(world: World): void {
  world.tick++
  world.events.length = 0 // transient events live for one tick

  applyCommands(world)
  runAi(world)
  runPathfinding(world)
  runMovement(world)
  runEconomy(world)
  runConstruction(world)
  runProduction(world)
  runCombat(world)
  runCastes(world)
  runAges(world)
  runWin(world)
  cleanup(world)
}

/** Remove dead units/buildings and depleted resource nodes. */
function cleanup(world: World): void {
  for (const u of world.units.values()) {
    if (u.hp > 0) continue
    world.players[u.owner].pop -= UNITS[u.kind].pop
    world.players[u.owner].popCap -= UNITS[u.kind].commandProvided // lost Gold → less command
    world.units.delete(u.id)
  }

  for (const b of world.buildings.values()) {
    if (b.hp > 0) continue
    for (const t of footprintTiles(b.x, b.y, b.w, b.h)) clearOccupant(world.map, t.x, t.y)
    if (b.state === 'complete') world.players[b.owner].popCap -= BUILDINGS[b.kind].popProvided
    world.buildings.delete(b.id)
  }

  for (const n of world.resources.values()) {
    if (n.amount > 0) continue
    clearOccupant(world.map, n.x, n.y)
    world.resources.delete(n.id)
  }
}
