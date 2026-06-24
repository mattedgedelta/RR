/**
 * useScreen — the top-level screen state machine.
 *
 *   menu → skirmish-setup → skirmish → result → menu
 *
 * App owns one instance. The MatchConfig assembled on the setup screen and the
 * Outcome produced by a match are carried on the state so the skirmish and
 * result screens can read them. No router: four screens, no deep-linking, and a
 * skirmish couples an imperative canvas + loop to mount/unmount.
 */
import { useCallback, useState } from 'react'
import type { MatchConfig } from '@/game/data/players'
import type { Outcome } from '@/game/sim/world'

export type Screen = 'menu' | 'skirmish-setup' | 'skirmish' | 'result' | 'codex' | 'settings'

interface ScreenState {
  screen: Screen
  /** Set once the setup screen DEPLOYs; read by the skirmish screen. */
  config: MatchConfig | null
  /** Set when a match ends; read by the result screen. */
  outcome: Outcome | null
}

export interface ScreenNav extends ScreenState {
  toMenu: () => void
  toSetup: () => void
  toSkirmish: (config: MatchConfig) => void
  toResult: (outcome: Outcome) => void
  toCodex: () => void
  toSettings: () => void
}

export function useScreen(initial: Screen = 'menu'): ScreenNav {
  const [state, setState] = useState<ScreenState>({
    screen: initial,
    config: null,
    outcome: null,
  })

  const toMenu = useCallback(
    () => setState({ screen: 'menu', config: null, outcome: null }),
    [],
  )
  const toSetup = useCallback(
    () => setState((s) => ({ ...s, screen: 'skirmish-setup', outcome: null })),
    [],
  )
  const toSkirmish = useCallback(
    (config: MatchConfig) => setState({ screen: 'skirmish', config, outcome: null }),
    [],
  )
  const toResult = useCallback(
    (outcome: Outcome) => setState((s) => ({ ...s, screen: 'result', outcome })),
    [],
  )
  const toCodex = useCallback(() => setState((s) => ({ ...s, screen: 'codex' })), [])
  const toSettings = useCallback(() => setState((s) => ({ ...s, screen: 'settings' })), [])

  return { ...state, toMenu, toSetup, toSkirmish, toResult, toCodex, toSettings }
}
