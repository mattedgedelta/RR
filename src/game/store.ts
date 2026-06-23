/**
 * store.ts — the React boundary: a tiny external store the GameLoop publishes
 * snapshots into, plus a tearing-safe per-widget selector hook.
 *
 * This is the seam that keeps a 10 Hz sim from triggering a React re-render
 * storm. The loop publishes a fresh Snapshot whenever the sim advances; widgets
 * subscribe through `useGameValue(selector)` and only re-render when *their*
 * selected slice changes (stable references + an equality check let React bail
 * out). Values that tick every frame (clock, resource counts, bars) should use
 * the imperative `useRafText`/`useRafWidth` hooks instead and never re-render.
 *
 * `dispatch(cmd)` is the UI-facing command channel: it forwards to whichever
 * World the active GameLoop registered, so the UI never touches sim state.
 */
import { useRef, useSyncExternalStore } from 'react'
import type { Snapshot } from './sim/snapshot'
import { emptySnapshot } from './sim/snapshot'
import { dispatch as simDispatch, type Command } from './sim/commands'
import type { World } from './sim/world'

let current: Snapshot = emptySnapshot()
const listeners = new Set<() => void>()
let activeWorld: World | null = null

/** The external snapshot store. The GameLoop owns `publish`. */
export const gameStore = {
  getSnapshot: (): Snapshot => current,
  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  /** Replace the current snapshot and notify subscribers. */
  publish(snapshot: Snapshot): void {
    current = snapshot
    for (const l of listeners) l()
  },
  /** Drop back to the empty snapshot (e.g. when leaving a match). */
  reset(): void {
    current = emptySnapshot()
    for (const l of listeners) l()
  },
}

/** Register the World that UI commands dispatch to (set by the GameLoop). */
export function setActiveWorld(world: World | null): void {
  activeWorld = world
}

/** UI-facing command dispatch — routed to the active match's command queue. */
export function dispatch(cmd: Command): void {
  if (activeWorld) simDispatch(activeWorld, cmd)
}

/**
 * Subscribe to a derived slice of the snapshot. Re-renders only when the
 * selected value changes per `isEqual` (default `Object.is`). The selection is
 * memoised against the snapshot reference so React can bail out of unchanged
 * widgets even though a new Snapshot is published on every sim tick.
 */
export function useGameValue<T>(
  selector: (s: Snapshot) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const selectorRef = useRef(selector)
  const isEqualRef = useRef(isEqual)
  selectorRef.current = selector
  isEqualRef.current = isEqual

  const memo = useRef<{ snap: Snapshot; value: T } | null>(null)

  const getSelection = (): T => {
    const snap = gameStore.getSnapshot()
    const prev = memo.current
    if (prev && prev.snap === snap) return prev.value
    const next = selectorRef.current(snap)
    if (prev && isEqualRef.current(prev.value, next)) {
      // Unchanged: keep the stable reference so React skips the re-render.
      memo.current = { snap, value: prev.value }
      return prev.value
    }
    memo.current = { snap, value: next }
    return next
  }

  return useSyncExternalStore(gameStore.subscribe, getSelection, getSelection)
}
