/**
 * players.ts — player slots, colors, difficulty tiers, and the MatchConfig
 * that the skirmish-setup screen assembles and `createWorld` consumes.
 *
 * Up to 8 players: slot 0 is always the human (Edge-green); 1–7 are CPU.
 * Colors come from the Edge Delta categorical/avatar palette (see palette.ts).
 */
import { PLAYER_COLORS } from '@/theme/palette'
import { type HouseId, DEFAULT_HOUSE } from './houses'

export type PlayerId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 8

/** Per-player color, index = PlayerId. Slot 0 = Edge-green. */
export const playerColor = (id: PlayerId): string => PLAYER_COLORS[id]

// ── difficulty ──────────────────────────────────────────────────────────

export type Difficulty = 'easy' | 'normal' | 'hard'

export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'normal', 'hard']

export interface DifficultyTier {
  id: Difficulty
  label: string
  /** AI controller think cadence: thinks once every N ticks (lower = sharper). */
  thinkIntervalTicks: number
  /** 0..1 weighting toward military/raids over pure economy. */
  aggression: number
  /** Multiplier on AI economic throughput (no resource cheating beyond this). */
  economyMul: number
}

export const DIFFICULTY_TIERS: Record<Difficulty, DifficultyTier> = {
  easy: { id: 'easy', label: 'easy', thinkIntervalTicks: 30, aggression: 0.35, economyMul: 0.85 },
  normal: { id: 'normal', label: 'normal', thinkIntervalTicks: 20, aggression: 0.65, economyMul: 1.0 },
  hard: { id: 'hard', label: 'hard', thinkIntervalTicks: 12, aggression: 1.0, economyMul: 1.2 },
}

// ── map size ────────────────────────────────────────────────────────────

export type MapSizeId = 'auto' | 'small' | 'medium' | 'large' | 'huge'

/** Explicit square grid dimensions (in tiles) per named size. */
export const MAP_SIZES: Record<Exclude<MapSizeId, 'auto'>, { label: string; dim: number }> = {
  small: { label: 'small', dim: 36 },
  medium: { label: 'medium', dim: 52 },
  large: { label: 'large', dim: 64 },
  huge: { label: 'huge', dim: 76 },
}

/**
 * Grid dimension for a config. 'auto' scales with player count
 * (≈26 for a 1v1 up to ≈72 for 8), clamped to a sane range.
 */
export function mapDim(size: MapSizeId, playerCount: number): number {
  if (size !== 'auto') return MAP_SIZES[size].dim
  const dim = 26 + Math.max(0, playerCount - 2) * 8
  return Math.min(72, Math.max(26, dim))
}

// ── match config ──────────────────────────────────────────────────────────

export interface PlayerSetup {
  id: PlayerId
  kind: 'human' | 'cpu'
  house: HouseId
  /** Team number. FFA = every player on its own team. */
  team: number
  /** AI difficulty (ignored for the human slot). */
  difficulty: Difficulty
  color: string
}

export interface MatchConfig {
  /** Seed for the deterministic world RNG. */
  seed: number
  /** 2–8 player slots; slot 0 is the human. */
  players: PlayerSetup[]
  mapSize: MapSizeId
}

/** True when every player is on a distinct team (free-for-all). */
export const isFFA = (cfg: MatchConfig): boolean =>
  new Set(cfg.players.map((p) => p.team)).size === cfg.players.length

/** Distinct team numbers present in the match. */
export const teamsOf = (cfg: MatchConfig): number[] =>
  [...new Set(cfg.players.map((p) => p.team))].sort((a, b) => a - b)

/**
 * Build a CPU player slot with sensible defaults.
 */
export function cpuSetup(
  id: PlayerId,
  house: HouseId,
  difficulty: Difficulty = 'normal',
  team = id,
): PlayerSetup {
  return { id, kind: 'cpu', house, team, difficulty, color: playerColor(id) }
}

/**
 * Default skirmish: 1 human (Mars) vs 1 CPU (normal), free-for-all, auto map.
 * Used by the M1 stubbed setup screen and as a baseline elsewhere.
 */
export function defaultMatchConfig(seed: number): MatchConfig {
  return {
    seed,
    mapSize: 'auto',
    players: [
      { id: 0, kind: 'human', house: DEFAULT_HOUSE, team: 0, difficulty: 'normal', color: playerColor(0) },
      cpuSetup(1, DEFAULT_HOUSE, 'normal', 1),
    ],
  }
}
