/**
 * castes.ts — the Color caste economy: grain upkeep, starvation, and healing.
 *
 * Runs every tick AFTER combat so it heals the freshly wounded and starves the
 * underfed before the win check culls the dead. Three passes:
 *
 *  1. UPKEEP   — every living unit eats `UNITS[kind].upkeep` grain/min. Each
 *                player's grain stockpile is drained by the per-tick share. If
 *                grain can't cover it, the stockpile floors at 0 and the player
 *                is flagged `starving` (hard food — there is no soft buffer).
 *  2. STARVE   — while starving, the player's NON-LABOR units (everything but
 *                Reds) lose HP. Hungry soldiers, scouts and medics waste away
 *                first, shrinking upkeep back toward what the grain economy can
 *                feed — while the Reds who actually gather are spared, so a bad
 *                food balance costs you your army, not your whole base. Laborer
 *                upkeep is tiny and self-funding, so a pure economy never starves.
 *  3. HEAL     — each Yellow (medicus) restores HP to nearby friendly units.
 *                This also offsets starvation attrition for units near a Yellow,
 *                which is how a medicus "eases famine" without special-casing.
 */
import { UNITS } from '../../data/units'
import { TICK_HZ, type World } from '../world'

/** HP a Yellow restores per minute to each nearby friendly unit. */
const HEAL_PER_MIN = 180
/** Heal radius around a Yellow, in tiles. */
const HEAL_RANGE = 5
/** HP a unit loses per minute while its owner is starving. */
const STARVE_PER_MIN = 120

export function runCastes(world: World): void {
  const perTick = 1 / (60 * TICK_HZ)

  // ── 1. upkeep + starvation flag (per player) ──
  const upkeep = new Array(world.players.length).fill(0)
  for (const u of world.units.values()) upkeep[u.owner] += UNITS[u.kind].upkeep
  for (const p of world.players) {
    p.grainUpkeep = upkeep[p.id]
    const drain = upkeep[p.id] * perTick
    if (p.resources.grain >= drain) {
      p.resources.grain -= drain
      p.starving = false
    } else {
      p.resources.grain = 0
      p.starving = drain > 0
    }
  }

  // ── 2. starvation attrition — army only, sparing the laborers (cleanup()
  //       culls anything that hits 0) ──
  const starve = STARVE_PER_MIN * perTick
  for (const u of world.units.values()) {
    if (world.players[u.owner].starving && !UNITS[u.kind].canGather) u.hp -= starve
  }

  // ── 3. Yellow healing (few medics, so the nested scan is cheap) ──
  const heal = HEAL_PER_MIN * perTick
  for (const y of world.units.values()) {
    if (!UNITS[y.kind].canHeal || y.hp <= 0) continue
    for (const u of world.units.values()) {
      if (u.owner !== y.owner || u.hp <= 0 || u.hp >= u.maxHp) continue
      const dx = u.x - y.x
      const dy = u.y - y.y
      if (dx * dx + dy * dy <= HEAL_RANGE * HEAL_RANGE) u.hp = Math.min(u.maxHp, u.hp + heal)
    }
  }
}
