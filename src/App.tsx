import HudDebug from '@/ui/debug/HudDebug'

/**
 * App — temporary host for the current build checkpoint. Phase 6 mounts the full
 * Field Console HUD composed from design-frame fixtures (M1). Replaced by the
 * `useScreen` state machine (menu → skirmish-setup → skirmish → result) in P7.
 *
 * Earlier checkpoints: `@/ui/debug/ThemeSwatch` (P1), `LoopDebug` (P4),
 * `RenderDebug` (P5).
 */
export default function App() {
  return <HudDebug />
}
