/**
 * LoopDebug — Phase 4 checkpoint (end of M0). Boots a real World + GameLoop and
 * proves the React boundary: the clock updates imperatively via `useRafText`
 * (no re-render), tick/pop/entity counts flow through `useGameValue` selectors,
 * and pause/speed drive the loop. Replaced by the screen state machine in P7.
 */
import { useEffect, useRef, useState } from 'react'
import { createWorld } from '@/game/sim/world'
import { defaultMatchConfig } from '@/game/data/players'
import { GameLoop } from '@/game/loop'
import { gameStore, useGameValue } from '@/game/store'
import { useRafText } from '@/ui/hooks/useRafText'
import { FC } from '@/theme/palette'

const SEED = 0x5eed

export default function LoopDebug() {
  const loopRef = useRef<GameLoop | null>(null)
  const [, forceRender] = useState(0)
  const sync = () => forceRender((n) => n + 1)

  useEffect(() => {
    const world = createWorld(SEED, defaultMatchConfig(SEED))
    const loop = new GameLoop(world)
    loopRef.current = loop
    loop.start()
    sync()
    return () => {
      loop.stop()
      gameStore.reset()
      loopRef.current = null
    }
  }, [])

  // Ticking value, written straight to the DOM — never re-renders this tree.
  const clockRef = useRafText<HTMLSpanElement>((s) => s.clock)
  // Slice selectors — re-render only on change (≈10 Hz, and only when it moves).
  const tick = useGameValue((s) => s.tick)
  const pop = useGameValue((s) => `${s.pop}/${s.popCap}`)
  const grain = useGameValue((s) => s.resources.grain)
  const entityCount = useGameValue((s) => s.entities.length)

  const loop = loopRef.current
  const paused = loop?.isPaused() ?? false
  const speed = loop?.getSpeed() ?? 1

  return (
    <div style={{ padding: 24, color: FC.text, fontFamily: 'JetBrains Mono, monospace' }}>
      <div style={{ fontSize: 11, letterSpacing: 2, color: FC.accent, marginBottom: 20 }}>
        // RED_RISING · IRON_RAIN — loop_check (phase_4)
      </div>

      <div style={{ display: 'flex', gap: 32, alignItems: 'baseline', marginBottom: 24 }}>
        <Stat label="clock">
          <span ref={clockRef} style={{ fontSize: 40, color: FC.accent }}>
            00:00
          </span>
        </Stat>
        <Stat label="tick">{tick}</Stat>
        <Stat label="pop">{pop}</Stat>
        <Stat label="grain">{grain}</Stat>
        <Stat label="entities">{entityCount}</Stat>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Btn
          onClick={() => {
            loop?.togglePause()
            sync()
          }}
        >
          {paused ? '▶ resume' : '⏸ pause'}
        </Btn>
        {[1, 2, 4].map((s) => (
          <Btn
            key={s}
            active={speed === s}
            onClick={() => {
              loop?.setSpeed(s)
              sync()
            }}
          >
            {s}×
          </Btn>
        ))}
      </div>

      <div style={{ marginTop: 20, fontSize: 11, color: FC.textFaint }}>
        clock writes textContent every frame with zero React re-renders; the
        counters above re-render only when their selected slice changes.
      </div>
    </div>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 10, letterSpacing: 1, color: FC.textDim }}>{label}</span>
      <span style={{ fontSize: 24, color: FC.text }}>{children}</span>
    </div>
  )
}

function Btn({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'inherit',
        fontSize: 12,
        padding: '8px 14px',
        color: active ? FC.board : FC.text,
        background: active ? FC.accent : FC.card,
        border: `1px solid ${active ? FC.accent : FC.border}`,
        borderRadius: 6,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}
