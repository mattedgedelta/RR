/**
 * win.ts — elimination and match resolution.
 *
 * A player is eliminated when it has no complete production building left (its
 * Spire / Legion Hall / Kennel — anything that trains units); without one it
 * can't reinforce, so it's out. When only one team remains standing (FFA = one
 * player), or the human falls, the match ends and `world.outcome` is written
 * from the human's point of view. The GameLoop stops ticking once outcome is set.
 */
import { BUILDINGS } from '../../data/buildings'
import type { PlayerId } from '../../data/players'
import type { World } from '../world'

export function runWin(world: World): void {
  if (world.outcome) return

  for (const p of world.players) {
    if (p.defeated) continue
    if (!hasProduction(world, p.id)) {
      p.defeated = true
      world.events.push({ type: 'playerDefeated', player: p.id })
    }
  }

  const human = world.players[0]
  const aliveTeams = new Set(world.players.filter((p) => !p.defeated).map((p) => p.team))

  if (human.defeated) {
    world.outcome = { victory: false, winnerTeam: [...aliveTeams][0] ?? human.team }
  } else if (aliveTeams.size <= 1) {
    const winnerTeam = [...aliveTeams][0] ?? human.team
    world.outcome = { victory: winnerTeam === human.team, winnerTeam }
  }
}

/** True if the player still has a complete unit-producing building. */
function hasProduction(world: World, owner: PlayerId): boolean {
  for (const b of world.buildings.values()) {
    if (b.owner === owner && b.state === 'complete' && BUILDINGS[b.kind].produces.length > 0) {
      return true
    }
  }
  return false
}
