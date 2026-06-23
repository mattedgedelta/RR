import RenderDebug from '@/ui/debug/RenderDebug'

/**
 * App — temporary host for the current build checkpoint. Phase 5 mounts the
 * Viewport + MapRenderer over a live sim (M1). Replaced by the `useScreen` state
 * machine (menu → skirmish-setup → skirmish → result) in Phase 7.
 *
 * Earlier checkpoints live on at `@/ui/debug/ThemeSwatch` (P1) and
 * `@/ui/debug/LoopDebug` (P4).
 */
export default function App() {
  return <RenderDebug />
}
