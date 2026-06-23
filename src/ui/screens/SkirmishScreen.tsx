/**
 * SkirmishScreen — the live match. Owns the engine lifecycle (creates the World
 * + GameLoop from the MatchConfig, starts/stops it) and wires live sim state
 * into the Field Console HUD and the Viewport.
 *
 * Layout: top resource/age strip · the Viewport (shared camera/view with the
 * minimap) · bottom bar (minimap | selection | commands). Selection flows from
 * the Viewport into React state, which drives the SelectionPanel + CommandGrid;
 * commands dispatch through the single command channel. Mount one instance per
 * match (App keys it by seed) so each skirmish starts from a clean world.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { createWorld, type Outcome, type World } from '@/game/sim/world'
import { GameLoop } from '@/game/loop'
import { dispatch, gameStore, useGameValue } from '@/game/store'
import { Camera } from '@/render/Camera'
import { createViewState, type ViewState } from '@/render/types'
import type { EntityId } from '@/game/sim/entities'
import type { MatchConfig } from '@/game/data/players'
import type { UnitKind } from '@/game/data/units'
import { HOUSES } from '@/game/data/houses'
import { FC, FONT } from '@/theme/palette'
import { useHotkeys } from '@/ui/hooks/useHotkeys'
import Viewport from '@/ui/hud/Viewport'
import { ResourceBar } from '@/ui/hud/ResourceBar'
import { IdleBadge } from '@/ui/hud/IdleBadge'
import { Clock } from '@/ui/hud/Clock'
import { AgeProgress } from '@/ui/hud/AgeProgress'
import { SelectionPanel } from '@/ui/hud/SelectionPanel'
import { CommandGrid } from '@/ui/hud/CommandGrid'
import { MinimapPanel } from '@/ui/hud/MinimapPanel'
import { ViewportOverlay } from '@/ui/hud/ViewportOverlay'
import type { CommandSlot } from '@/ui/hud/types'
import { resourceItems, ageView, projectSelection, commandSlots } from '@/ui/hud/connect'

const HUMAN = 0

interface SkirmishScreenProps {
  config: MatchConfig
  onExit: () => void
  onResult: (outcome: Outcome) => void
}

interface Engine {
  world: World
  loop: GameLoop
  camera: Camera
  view: ViewState
}

export default function SkirmishScreen({ config, onExit, onResult }: SkirmishScreenProps) {
  // One engine per mounted match (kept across re-renders / StrictMode remounts).
  const ref = useRef<Engine | null>(null)
  if (ref.current === null) {
    const world = createWorld(config.seed, config)
    ref.current = { world, loop: new GameLoop(world), camera: new Camera(), view: createViewState() }
  }
  const { world, loop, camera, view } = ref.current

  const [selectedIds, setSelectedIds] = useState<EntityId[]>([])

  useEffect(() => {
    loop.start()
    return () => {
      loop.stop()
      gameStore.reset()
    }
  }, [loop])

  // Live state.
  const snap = useGameValue((s) => s)
  const outcome = useGameValue((s) => s.outcome)

  useEffect(() => {
    if (outcome) onResult(outcome)
  }, [outcome, onResult])

  const houseBadge = HOUSES[config.players[HUMAN].house].name
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const selection = projectSelection(snap, selectedSet, houseBadge)
  const slots = commandSlots(snap, selectedSet, snap.age)
  const selectedBuildingId = snap.entities.find(
    (e) => selectedSet.has(e.id) && e.etype === 'building' && e.owner === HUMAN,
  )?.id

  const minimapView =
    camera.viewW > 0
      ? (() => {
          const v = camera.visibleTiles()
          return {
            x0: Math.max(0, v.x0),
            y0: Math.max(0, v.y0),
            x1: Math.min(world.map.width, v.x1),
            y1: Math.min(world.map.height, v.y1),
          }
        })()
      : undefined

  const clearSelection = (): void => {
    view.selected = new Set()
    setSelectedIds([])
  }

  const runSlot = (slot: CommandSlot | null): void => {
    if (!slot || slot.variant === 'disabled') return
    if (slot.label.startsWith('train_')) {
      if (selectedBuildingId != null) {
        dispatch({ type: 'train', player: HUMAN, buildingId: selectedBuildingId, unit: slot.label.slice(6) as UnitKind })
      }
    } else if (slot.label.startsWith('advance_')) {
      dispatch({ type: 'advanceAge', player: HUMAN })
    } else if (slot.label === 'stop') {
      dispatch({ type: 'stop', player: HUMAN, unitIds: selectedIds })
    }
  }

  useHotkeys({
    q: () => runSlot(slots[0]),
    w: () => runSlot(slots[1]),
    e: () => runSlot(slots[2]),
    r: () => runSlot(slots[3]),
    escape: () => (selectedIds.length ? clearSelection() : onExit()),
  })

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: FC.board,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT.mono,
      }}
    >
      {/* Top strip */}
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
        <ResourceBar items={resourceItems(snap)} pop={snap.pop} popCap={snap.popCap} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <IdleBadge count={snap.idleCount} />
          <Clock />
          <AgeProgress age={ageView(snap)} onAdvance={() => dispatch({ type: 'advanceAge', player: HUMAN })} />
          <button
            onClick={onExit}
            style={{
              fontFamily: FONT.mono,
              fontSize: 10,
              color: FC.textDim,
              background: 'transparent',
              border: `1px solid ${FC.border}`,
              borderRadius: 6,
              padding: '6px 10px',
              cursor: 'pointer',
            }}
          >
            [ESC] menu
          </button>
        </div>
      </div>

      {/* Middle — the world */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <Viewport source={loop} map={world.map} camera={camera} view={view} onSelect={setSelectedIds} />
        <ViewportOverlay gridW={world.map.width} gridH={world.map.height} />
      </div>

      {/* Bottom bar */}
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
        <MinimapPanel
          map={world.map}
          snapshot={snap}
          view={minimapView}
          onSeek={(tx, ty) => camera.centerOn(tx, ty)}
        />
        <SelectionPanel selection={selection} />
        <div style={{ flex: 1 }} />
        <CommandGrid slots={slots} onSlot={(_, slot) => runSlot(slot)} />
      </div>
    </div>
  )
}
