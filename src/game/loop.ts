/**
 * loop.ts — the GameLoop: a fixed-timestep rAF accumulator that advances the
 * sim deterministically and publishes snapshots to the store.
 *
 * The sim runs at a fixed TICK_MS (10 Hz) regardless of display refresh; the
 * accumulator pattern decouples sim rate from frame rate so the game neither
 * stutters on slow frames nor races on fast ones. A MAX_STEPS_PER_FRAME spiral
 * guard drops the backlog after a long stall (e.g. a backgrounded tab) instead
 * of trying to "catch up" forever. `alpha` (0..1 into the current tick) is
 * exposed for the Phase 5 renderer to interpolate motion between ticks.
 *
 * Wall-clock time (`performance.now`) lives here, OUTSIDE the sim — the sim
 * itself only ever sees whole ticks, preserving determinism.
 */
import { tick } from './sim/tick'
import { buildSnapshot, type Snapshot } from './sim/snapshot'
import { TICK_MS, type World } from './sim/world'
import { gameStore, setActiveWorld } from './store'

/** Hard cap on ticks simulated per frame; the rest of the backlog is dropped. */
const MAX_STEPS_PER_FRAME = 5
/** Ignore frame gaps longer than this (tab refocus) rather than spiralling. */
const MAX_FRAME_MS = 250
const MIN_SPEED = 0.25
const MAX_SPEED = 8

export interface GameLoopOptions {
  /** Invoked with each published snapshot (e.g. to react to `outcome`). */
  onSnapshot?: (snap: Snapshot) => void
}

export class GameLoop {
  readonly world: World
  /** Interpolation fraction into the current tick (0..1), for the renderer. */
  alpha = 0

  private rafId = 0
  private running = false
  private paused = false
  private speed = 1
  private accumulator = 0
  private lastTime = 0
  private latest: Snapshot
  private readonly opts: GameLoopOptions

  constructor(world: World, opts: GameLoopOptions = {}) {
    this.world = world
    this.opts = opts
    this.latest = buildSnapshot(world)
  }

  /** Begin ticking and register this match as the dispatch target. */
  start(): void {
    if (this.running) return
    this.running = true
    setActiveWorld(this.world)
    this.lastTime = performance.now()
    this.accumulator = 0
    this.publish() // initial paint before the first tick
    this.rafId = requestAnimationFrame(this.frame)
  }

  /** Stop ticking and clear the dispatch target. Safe to call repeatedly. */
  stop(): void {
    if (!this.running) return
    this.running = false
    cancelAnimationFrame(this.rafId)
    setActiveWorld(null)
  }

  isRunning(): boolean {
    return this.running
  }
  isPaused(): boolean {
    return this.paused
  }
  getSpeed(): number {
    return this.speed
  }
  /** Latest published snapshot (for the renderer to poll alongside `alpha`). */
  getSnapshot(): Snapshot {
    return this.latest
  }

  pause(): void {
    this.paused = true
  }
  resume(): void {
    if (!this.paused) return
    this.paused = false
    this.lastTime = performance.now() // don't fast-forward the paused span
  }
  togglePause(): void {
    if (this.paused) this.resume()
    else this.pause()
  }

  /** Set the sim speed multiplier (clamped to 0.25×–8×). */
  setSpeed(mult: number): void {
    this.speed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, mult))
  }

  private frame = (now: number): void => {
    if (!this.running) return

    let frameMs = now - this.lastTime
    this.lastTime = now
    if (frameMs > MAX_FRAME_MS) frameMs = MAX_FRAME_MS

    let stepped = false
    if (!this.paused && this.world.outcome === null) {
      this.accumulator += frameMs * this.speed
      let steps = 0
      while (this.accumulator >= TICK_MS && steps < MAX_STEPS_PER_FRAME) {
        tick(this.world)
        this.accumulator -= TICK_MS
        steps++
        stepped = true
        if (this.world.outcome !== null) {
          this.accumulator = 0
          break
        }
      }
      // Spiral guard: a frame couldn't drain the backlog — drop it.
      if (steps === MAX_STEPS_PER_FRAME && this.accumulator >= TICK_MS) {
        this.accumulator = 0
      }
    }

    this.alpha = this.paused ? 0 : this.accumulator / TICK_MS
    if (stepped) this.publish()

    this.rafId = requestAnimationFrame(this.frame)
  }

  private publish(): void {
    this.latest = buildSnapshot(this.world)
    gameStore.publish(this.latest)
    this.opts.onSnapshot?.(this.latest)
  }
}
