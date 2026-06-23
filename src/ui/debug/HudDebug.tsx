/**
 * HudDebug — Phase 6 checkpoint (M1). Composes the full Field Console HUD from
 * the design-frame fixtures to verify chrome fidelity: top resource/age strip,
 * the GRID/SCALE/FOG viewport overlay + an UNDER_ATTACK toast, and the bottom
 * bar (minimap | selection | commands). The minimap draws a real seeded world so
 * the entity dots are genuine. Wired to live sim state by SkirmishScreen in P7.
 */
import { useMemo } from 'react'
import { createWorld } from '@/game/sim/world'
import { buildSnapshot } from '@/game/sim/snapshot'
import { defaultMatchConfig } from '@/game/data/players'
import { FC } from '@/theme/palette'
import { ResourceBar } from '@/ui/hud/ResourceBar'
import { IdleBadge } from '@/ui/hud/IdleBadge'
import { Clock } from '@/ui/hud/Clock'
import { AgeProgress } from '@/ui/hud/AgeProgress'
import { SelectionPanel } from '@/ui/hud/SelectionPanel'
import { CommandGrid } from '@/ui/hud/CommandGrid'
import { MinimapPanel } from '@/ui/hud/MinimapPanel'
import { AlertToast } from '@/ui/hud/AlertToast'
import { ViewportOverlay } from '@/ui/hud/ViewportOverlay'
import {
  FIXTURE_RESOURCES,
  FIXTURE_POP,
  FIXTURE_AGE,
  FIXTURE_SELECTION,
  FIXTURE_COMMANDS,
} from '@/ui/hud/fixtures'

const SEED = 0x5eed

export default function HudDebug() {
  const world = useMemo(() => createWorld(SEED, defaultMatchConfig(SEED)), [])
  const snapshot = useMemo(() => buildSnapshot(world), [world])
  const view = useMemo(
    () => ({ x0: world.map.width * 0.18, y0: world.map.height * 0.2, x1: world.map.width * 0.52, y1: world.map.height * 0.55 }),
    [world],
  )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: FC.board,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      {/* Top strip — resources · idle · clock · age */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          padding: '12px 18px',
          background: FC.rail,
          borderBottom: `1px solid ${FC.border}`,
        }}
      >
        <ResourceBar items={FIXTURE_RESOURCES} pop={FIXTURE_POP.pop} popCap={FIXTURE_POP.popCap} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <IdleBadge count={FIXTURE_POP.idle} />
          <Clock value={FIXTURE_POP.clock} />
          <AgeProgress age={FIXTURE_AGE} />
        </div>
      </div>

      {/* Middle — viewport region with corner telemetry + an alert */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }} className="fc-grid-26">
        <ViewportOverlay gridW={world.map.width} gridH={world.map.height} />
        <div style={{ position: 'absolute', top: 44, right: 12 }}>
          <AlertToast message="UNDER_ATTACK · NW" />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: FC.textFaint,
            fontSize: 11,
            letterSpacing: 2,
          }}
        >
          // hud_check (phase_6) — viewport rendered by SkirmishScreen in P7
        </div>
      </div>

      {/* Bottom bar — minimap | selection | commands */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 12,
          padding: 12,
          background: FC.rail,
          borderTop: `1px solid ${FC.border}`,
        }}
      >
        <MinimapPanel map={world.map} snapshot={snapshot} view={view} />
        <SelectionPanel selection={FIXTURE_SELECTION} />
        <div style={{ flex: 1 }} />
        <CommandGrid slots={FIXTURE_COMMANDS} />
      </div>
    </div>
  )
}
