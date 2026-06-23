/**
 * useGameValue — per-widget selector subscription to the game store.
 *
 * Implemented in `game/store.ts` (co-located with the store internals); this is
 * the canonical UI import site. A widget re-renders only when its selected slice
 * changes. For values that change every tick (clock, counters, bars) prefer the
 * imperative `useRafText`/`useRafWidth` hooks so React never reconciles them.
 */
export { useGameValue } from '@/game/store'
