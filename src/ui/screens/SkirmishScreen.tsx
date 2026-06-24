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
import { settingsStore } from '@/game/settings'
import { Camera } from '@/render/Camera'
import { createViewState, type ViewState } from '@/render/types'
import type { EntityId, UnitStance } from '@/game/sim/entities'
import type { MatchConfig } from '@/game/data/players'
import type { UnitKind } from '@/game/data/units'
import { BUILDINGS, type BuildingKind } from '@/game/data/buildings'
import { HOUSES } from '@/game/data/houses'
import { FC, FONT } from '@/theme/palette'
import { useHotkeys, type HotkeyMap } from '@/ui/hooks/useHotkeys'
import Viewport from '@/ui/hud/Viewport'
import { ResourceBar } from '@/ui/hud/ResourceBar'
import { IdleBadge } from '@/ui/hud/IdleBadge'
import { Clock } from '@/ui/hud/Clock'
import { AgeProgress } from '@/ui/hud/AgeProgress'
import { SelectionPanel } from '@/ui/hud/SelectionPanel'
import { CommandGrid } from '@/ui/hud/CommandGrid'
import { MinimapPanel } from '@/ui/hud/MinimapPanel'
import { ViewportOverlay } from '@/ui/hud/ViewportOverlay'
import { AlertToast } from '@/ui/hud/AlertToast'
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
  const [toast, setToast] = useState<string | null>(null)
  const [speed, setSpeedState] = useState(() => settingsStore.get().gameSpeed)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()
  const lastPing = useRef(0)

  useEffect(() => {
    loop.setSpeed(settingsStore.get().gameSpeed) // seed from the saved default
    loop.start()
    return () => {
      loop.stop()
      gameStore.reset()
    }
  }, [loop])

  const changeSpeed = (v: number): void => {
    loop.setSpeed(v)
    setSpeedState(v)
  }

  // Live state.
  const snap = useGameValue((s) => s)
  const outcome = useGameValue((s) => s.outcome)
  const alert = useGameValue((s) => s.alert)

  useEffect(() => {
    if (outcome) onResult(outcome)
  }, [outcome, onResult])

  // UNDER_ATTACK → toast (lingers 4s after the last hit) + a throttled map ping.
  useEffect(() => {
    if (!alert) return
    setToast(alert.text)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 4000)
    const t = performance.now()
    if (t - lastPing.current > 1000) {
      lastPing.current = t
      view.pings.push({ x: alert.x, y: alert.y, born: t })
    }
  }, [alert, view])

  const houseBadge = HOUSES[config.players[HUMAN].house].name
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const selection = projectSelection(snap, selectedSet, houseBadge)
  const slots = commandSlots(snap, selectedSet, snap.age, config.players[HUMAN].house, snap.resources)
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

  // Cycle-select the next idle worker and centre the camera on it.
  const idleCycle = useRef(0)
  const cycleIdle = (): void => {
    const ids = snap.idleUnitIds
    if (ids.length === 0) return
    const id = ids[idleCycle.current % ids.length]
    idleCycle.current += 1
    view.selected = new Set([id])
    setSelectedIds([id])
    const e = snap.entities.find((en) => en.id === id)
    if (e) camera.centerOn(e.x, e.y)
  }

  const runSlot = (slot: CommandSlot | null): void => {
    if (!slot || slot.variant === 'disabled') return
    if (slot.label.startsWith('train_')) {
      if (selectedBuildingId != null) {
        dispatch({ type: 'train', player: HUMAN, buildingId: selectedBuildingId, unit: slot.label.slice(6) as UnitKind })
      }
    } else if (slot.label.startsWith('advance_')) {
      dispatch({ type: 'advanceAge', player: HUMAN })
    } else if (slot.label.startsWith('build_')) {
      const kind = slot.label.slice(6) as BuildingKind
      const fp = BUILDINGS[kind].footprint
      view.placement = { kind, w: fp.w, h: fp.h } // Viewport commits on a valid click
    } else if (slot.label.startsWith('stance_')) {
      dispatch({ type: 'setStance', player: HUMAN, unitIds: selectedIds, stance: slot.label.slice(7) as UnitStance })
    } else if (slot.label === 'stop') {
      dispatch({ type: 'stop', player: HUMAN, unitIds: selectedIds })
    }
  }

  const deleteSelection = (): void => {
    if (selectedIds.length === 0) return
    dispatch({ type: 'delete', player: HUMAN, ids: selectedIds })
    clearSelection()
  }

  // Control groups: Ctrl+1..9 assigns the selection, 1..9 reselects it.
  const groups = useRef(new Map<string, EntityId[]>())
  const assignGroup = (n: string): void => {
    groups.current.set(n, [...selectedIds])
  }
  const selectGroup = (n: string): void => {
    const live = (groups.current.get(n) ?? []).filter((id) => snap.entities.some((e) => e.id === id))
    if (live.length === 0) return
    view.selected = new Set(live)
    setSelectedIds(live)
  }

  const keymap: HotkeyMap = {
    q: () => runSlot(slots[0]),
    w: () => runSlot(slots[1]),
    e: () => runSlot(slots[2]),
    r: () => runSlot(slots[3]),
    escape: () => {
      if (view.placement) view.placement = null
      else if (selectedIds.length) clearSelection()
      else onExit()
    },
    delete: deleteSelection,
    backspace: deleteSelection,
  }
  for (let n = 1; n <= 9; n++) {
    keymap[String(n)] = () => selectGroup(String(n))
    keymap[`ctrl+${n}`] = () => assignGroup(String(n))
  }
  useHotkeys(keymap)

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
          <IdleBadge count={snap.idleCount} onClick={cycleIdle} />
          <Clock />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, letterSpacing: 1, color: FC.textDim }}>speed</span>
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.25}
              value={speed}
              onChange={(e) => changeSpeed(parseFloat(e.target.value))}
              style={{ accentColor: FC.accent, width: 96 }}
            />
            <span style={{ fontSize: 11, color: FC.text2, width: 32 }}>{speed}×</span>
          </div>
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
        {toast && (
          <div style={{ position: 'absolute', top: 44, right: 12 }}>
            <AlertToast message={toast} />
          </div>
        )}
      </div>

      {/* Bottom bar — fixed height so a building's queue strip never shifts it */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          padding: 12,
          height: 212,
          boxSizing: 'border-box',
          background: FC.rail,
          borderTop: `1px solid ${FC.border}`,
          overflow: 'hidden',
        }}
      >
        <MinimapPanel
          map={world.map}
          snapshot={snap}
          view={minimapView}
          onSeek={(tx, ty) => camera.centerOn(tx, ty)}
        />
        <SelectionPanel
          selection={selection}
          onCancelQueue={(i) => {
            if (selectedBuildingId != null) {
              dispatch({ type: 'cancelTrain', player: HUMAN, buildingId: selectedBuildingId, index: i })
            }
          }}
        />
        <div style={{ flex: 1 }} />
        <CommandGrid slots={slots} onSlot={(_, slot) => runSlot(slot)} />
      </div>
    </div>
  )
}
