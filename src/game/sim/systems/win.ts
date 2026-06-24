/**
 * win.ts — elimination and match resolution.
 *
 * A player is eliminated only once it has NO units left (all military + workers
 * destroyed) AND no building that can still produce pioneers (its Spire) — i.e.
 * no army and no way to rebuild a workforce. When only one team remains standing
 * (FFA = one player), or the human falls, the match ends and `world.outcome` is
 * written from the human's point of view. The GameLoop halts once it's set.
 */
import { BUILDINGS } from '../../data/buildings'
import type { PlayerId } from '../../data/players'
import type { World } from '../world'

export function runWin(world: World): void {
  if (world.outcome) return

  for (const p of world.players) {
    if (p.defeated) continue
    if (!isAlive(world, p.id)) {
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

/** Alive while the player has any unit, or a complete pioneer-producing building. */
function isAlive(world: World, owner: PlayerId): boolean {
  for (const u of world.units.values()) {
    if (u.owner === owner) return true
  }
  for (const b of world.buildings.values()) {
    if (b.owner === owner && b.state === 'complete' && BUILDINGS[b.kind].produces.includes('pioneer')) {
      return true
    }
  }
  return false
}
