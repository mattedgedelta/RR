/**
 * App — the screen state machine (end of M1). Drives the flow
 * menu → skirmish-setup → skirmish → result via `useScreen`. The skirmish is
 * keyed by seed so each new match mounts a fresh engine. Earlier build
 * checkpoints live on at `@/ui/debug/*` (ThemeSwatch, LoopDebug, RenderDebug,
 * HudDebug).
 */
import { useScreen } from '@/ui/hooks/useScreen'
import MenuScreen from '@/ui/screens/MenuScreen'
import SkirmishSetupScreen from '@/ui/screens/SkirmishSetupScreen'
import SkirmishScreen from '@/ui/screens/SkirmishScreen'
import ResultScreen from '@/ui/screens/ResultScreen'
import CodexScreen from '@/ui/screens/CodexScreen'
import SettingsScreen from '@/ui/screens/SettingsScreen'

export default function App() {
  const nav = useScreen('menu')
  const menu = <MenuScreen onPlay={nav.toSetup} onCodex={nav.toCodex} onSettings={nav.toSettings} />

  switch (nav.screen) {
    case 'skirmish-setup':
      return <SkirmishSetupScreen onDeploy={nav.toSkirmish} onBack={nav.toMenu} />
    case 'codex':
      return <CodexScreen onBack={nav.toMenu} />
    case 'settings':
      return <SettingsScreen onBack={nav.toMenu} />
    case 'skirmish':
      return nav.config ? (
        <SkirmishScreen
          key={nav.config.seed}
          config={nav.config}
          onExit={nav.toMenu}
          onResult={nav.toResult}
        />
      ) : (
        menu
      )
    case 'result':
      return nav.outcome ? (
        <ResultScreen outcome={nav.outcome} onRematch={nav.toSetup} onMenu={nav.toMenu} />
      ) : (
        menu
      )
    case 'menu':
    default:
      return menu
  }
}
