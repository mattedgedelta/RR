/**
 * RenderDebug — Phase 5 checkpoint (M1). Boots a real World + GameLoop and mounts
 * the Viewport so the renderer can be verified against live sim state: a Spire,
 * resource nodes and Pioneers render on the grid; left-click selects (box-drag
 * selects your units), wheel zooms, middle-drag / arrows / edge-scroll pan, and
 * right-click issues move/gather orders. Replaced by SkirmishScreen in Phase 7.
 */
import { useEffect, useRef, useState } from 'react'
import { createWorld, type World } from '@/game/sim/world'
import { defaultMatchConfig } from '@/game/data/players'
import { GameLoop } from '@/game/loop'
import { gameStore } from '@/game/store'
import { useRafText } from '@/ui/hooks/useRafText'
import Viewport from '@/ui/hud/Viewport'
import { FC } from '@/theme/palette'

const SEED = 0x5eed

export default function RenderDebug() {
  const [boot, setBoot] = useState<{ loop: GameLoop; world: World } | null>(null)
  const loopRef = useRef<GameLoop | null>(null)

  useEffect(() => {
    const world = createWorld(SEED, defaultMatchConfig(SEED))
    const loop = new GameLoop(world)
    loopRef.current = loop
    loop.start()
    setBoot({ loop, world })
    return () => {
      loop.stop()
      gameStore.reset()
      loopRef.current = null
    }
  }, [])

  const clockRef = useRafText<HTMLSpanElement>((s) => s.clock)

  return (
    <div style={{ position: 'fixed', inset: 0, background: FC.board }}>
      {boot && <Viewport source={boot.loop} map={boot.world.map} />}

      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          padding: '8px 12px',
          background: '#0C0C0CCC',
          border: `1px solid ${FC.border}`,
          borderRadius: 6,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          color: FC.textDim,
          pointerEvents: 'none',
          lineHeight: 1.7,
        }}
      >
        <div style={{ color: FC.accent, letterSpacing: 1.5, marginBottom: 4 }}>
          // render_check (phase_5) · <span ref={clockRef}>00:00</span>
        </div>
        <div>l-drag select · wheel zoom · m-drag/arrows/edge pan · r-click order</div>
      </div>
    </div>
  )
}
