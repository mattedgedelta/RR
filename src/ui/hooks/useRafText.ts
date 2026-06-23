/**
 * useRafText / useRafWidth — imperative, zero-re-render bindings for values that
 * change every tick.
 *
 * Instead of pushing ticking numbers (clock, resource counts, HP/queue bars)
 * through React state — which would reconcile a component subtree ~10×/sec, the
 * #1 browser-RTS + React pitfall — these hooks return a ref. A private rAF loop
 * reads the latest snapshot and writes `textContent` / `style.width` directly on
 * the DOM node, only when the value actually changed. React never re-renders.
 */
import { useEffect, useRef, type RefObject } from 'react'
import { gameStore } from '@/game/store'
import type { Snapshot } from '@/game/sim/snapshot'

/** Bind an element's text content to a string projection of the snapshot. */
export function useRafText<E extends HTMLElement = HTMLElement>(
  select: (s: Snapshot) => string,
): RefObject<E> {
  const ref = useRef<E>(null)
  const selectRef = useRef(select)
  selectRef.current = select

  useEffect(() => {
    let raf = 0
    let last: string | null = null
    const loop = (): void => {
      const el = ref.current
      if (el) {
        const v = selectRef.current(gameStore.getSnapshot())
        if (v !== last) {
          el.textContent = v
          last = v
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return ref
}

/** Bind an element's width (%) to a 0..1 fraction projection of the snapshot. */
export function useRafWidth<E extends HTMLElement = HTMLElement>(
  select: (s: Snapshot) => number,
): RefObject<E> {
  const ref = useRef<E>(null)
  const selectRef = useRef(select)
  selectRef.current = select

  useEffect(() => {
    let raf = 0
    let last = -1
    const loop = (): void => {
      const el = ref.current
      if (el) {
        const f = Math.max(0, Math.min(1, selectRef.current(gameStore.getSnapshot())))
        const pct = Math.round(f * 1000) / 10 // 0.1% steps
        if (pct !== last) {
          el.style.width = `${pct}%`
          last = pct
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return ref
}
