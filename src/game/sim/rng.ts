/**
 * rng.ts — the only randomness allowed inside the sim.
 *
 * Deterministic seeded PRNG (mulberry32). Never use Math.random / Date.now in
 * sim code — reproducibility (replays, deterministic bugs) depends on every
 * stochastic decision flowing through one seeded stream owned by the World.
 */

export class Rng {
  /** Internal 32-bit state. */
  private s: number
  /** Original seed (kept for debugging / reseeding). */
  readonly seed: number

  constructor(seed: number) {
    this.seed = seed | 0
    this.s = seed | 0
  }

  /** Next float in [0, 1). */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) | 0
    let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** Integer in [0, maxExclusive). */
  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive)
  }

  /** Integer in [min, maxInclusive]. */
  irange(min: number, maxInclusive: number): number {
    return min + this.int(maxInclusive - min + 1)
  }

  /** Float in [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  /** Uniform pick from a non-empty array. */
  pick<T>(arr: readonly T[]): T {
    return arr[this.int(arr.length)]
  }

  /** True with probability p (0..1). */
  chance(p: number): boolean {
    return this.next() < p
  }
}

export function mulberry32(seed: number): Rng {
  return new Rng(seed)
}
