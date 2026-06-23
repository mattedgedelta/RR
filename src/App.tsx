import LoopDebug from '@/ui/debug/LoopDebug'

/**
 * App — temporary host for the current build checkpoint. Phase 4 mounts the
 * GameLoop + store debug view (end of M0). Replaced by the `useScreen` state
 * machine (menu → skirmish-setup → skirmish → result) in Phase 7.
 *
 * The Phase 1 theme swatch lives on at `@/ui/debug/ThemeSwatch`.
 */
export default function App() {
  return <LoopDebug />
}
