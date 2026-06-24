/**
 * Viewport.tsx — hosts the world <canvas>, owns the MapRenderer lifecycle, and
 * translates pointer/keyboard input into camera motion and sim commands.
 *
 * Left-drag box-selects your units (click selects one entity / empties on miss);
 * middle-drag and edge-scroll/arrow/WASD pan; wheel zooms toward the cursor;
 * right-click issues a context order to the selection (gather a node, attack a
 * foe, else move). Selection lives in a mutable `ViewState` the renderer reads
 * each frame, so selecting never triggers a React re-render.
 */
import { useEffect, useRef } from 'react'
import { footprintBuildable, type GameMap } from '@/game/sim/map'
import type { EntityId } from '@/game/sim/entities'
import { dispatch } from '@/game/store'
import { MapRenderer, type FrameSource } from '@/render/MapRenderer'
import type { Camera } from '@/render/Camera'
import { createViewState, type ViewState } from '@/render/types'
import { HitTest, dist2, rectFromPoints } from '@/render/HitTest'

const HUMAN = 0 as const
const DRAG_THRESHOLD2 = 25 // (5px)²

const PAN_KEY: Record<string, string> = {
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
}

interface ViewportProps {
  source: FrameSource
  map: GameMap
  /** Shared camera/view (the skirmish screen owns these so the minimap can too). */
  camera?: Camera
  view?: ViewState
  /** Fired after the selection set changes (click / box-select / clear). */
  onSelect?: (ids: EntityId[]) => void
}

export default function Viewport({ source, map, camera, view: propView, onSelect }: ViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const internalView = useRef(createViewState())
  const view = propView ?? internalView.current
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  // Left-drag (select) and middle-drag (pan) gesture state.
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null)
  const pan = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const renderer = new MapRenderer(canvas, source, map, view, camera)
    renderer.start()
    const cam = renderer.cam

    const localPt = (e: PointerEvent | WheelEvent) => {
      const r = canvas.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }

    const onWheel = (e: WheelEvent): void => {
      e.preventDefault()
      const p = localPt(e)
      cam.zoomAt(p.x, p.y, e.deltaY < 0 ? 1.1 : 1 / 1.1)
    }

    const onContextMenu = (e: MouseEvent): void => {
      e.preventDefault()
      if (view.placement) {
        view.placement = null // right-click cancels placement
        return
      }
      if (view.selected.size === 0) return
      const r = canvas.getBoundingClientRect()
      const sx = e.clientX - r.left
      const sy = e.clientY - r.top
      const tile = cam.screenToTile(sx, sy)
      const snap = source.getSnapshot()
      const sel = snap.entities.filter((en) => view.selected.has(en.id))
      const hasUnit = sel.some((en) => en.etype === 'unit' && en.owner === HUMAN)
      const building = sel.find((en) => en.etype === 'building' && en.owner === HUMAN)

      // A selected building (no units) → set its rally point.
      if (!hasUnit && building) {
        dispatch({ type: 'setRally', player: HUMAN, buildingId: building.id, x: tile.x, y: tile.y })
        return
      }

      const hit = new HitTest(snap).pickAt(cam, sx, sy)
      const ids = [...view.selected]
      if (hit?.etype === 'resource') {
        dispatch({ type: 'gather', player: HUMAN, unitIds: ids, nodeId: hit.id })
      } else if (hit?.etype === 'building' && hit.owner === HUMAN && hit.kind === 'farm') {
        // Assign workers to harvest an own Farm.
        dispatch({ type: 'gather', player: HUMAN, unitIds: ids, nodeId: hit.id })
      } else if (hit && hit.owner !== HUMAN) {
        dispatch({ type: 'attack', player: HUMAN, unitIds: ids, targetId: hit.id })
      } else {
        dispatch({ type: 'move', player: HUMAN, unitIds: ids, x: tile.x, y: tile.y })
      }
    }

    const onPointerDown = (e: PointerEvent): void => {
      const p = localPt(e)
      // Placement mode: a valid left-click commits the building.
      if (e.button === 0 && view.placement) {
        const t = cam.screenToTile(p.x, p.y)
        const tx = Math.floor(t.x)
        const ty = Math.floor(t.y)
        if (footprintBuildable(map, tx, ty, view.placement.w, view.placement.h)) {
          dispatch({
            type: 'build',
            player: HUMAN,
            builderIds: [...view.selected],
            building: view.placement.kind,
            x: tx,
            y: ty,
          })
          view.placement = null
        }
        return
      }
      canvas.setPointerCapture(e.pointerId)
      if (e.button === 0) {
        drag.current = { x: p.x, y: p.y, moved: false }
      } else if (e.button === 1) {
        pan.current = { x: p.x, y: p.y }
      }
    }

    const onPointerMove = (e: PointerEvent): void => {
      const p = localPt(e)
      view.mouse = { x: p.x, y: p.y, inside: true }

      if (pan.current) {
        cam.panBy(p.x - pan.current.x, p.y - pan.current.y)
        pan.current = { x: p.x, y: p.y }
        return
      }
      const d = drag.current
      if (d) {
        if (d.moved || dist2(d.x, d.y, p.x, p.y) > DRAG_THRESHOLD2) {
          d.moved = true
          view.dragRect = rectFromPoints(d.x, d.y, p.x, p.y)
        }
        return
      }
      // Idle hover highlight.
      view.hover = new HitTest(source.getSnapshot()).pickAt(cam, p.x, p.y)?.id ?? null
    }

    const onPointerUp = (e: PointerEvent): void => {
      const p = localPt(e)
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)

      if (e.button === 1) {
        pan.current = null
        return
      }
      const d = drag.current
      drag.current = null
      view.dragRect = null
      if (e.button !== 0 || !d) return

      const hit = new HitTest(source.getSnapshot())
      if (d.moved) {
        view.selected = new Set(hit.selectInRect(cam, rectFromPoints(d.x, d.y, p.x, p.y), HUMAN))
      } else {
        const picked = hit.pickAt(cam, p.x, p.y)
        view.selected = picked ? new Set([picked.id]) : new Set()
      }
      onSelectRef.current?.([...view.selected])
    }

    const onPointerLeave = (): void => {
      view.mouse.inside = false
    }

    const onKey = (down: boolean) => (e: KeyboardEvent): void => {
      const dir = PAN_KEY[e.key.toLowerCase()]
      if (!dir) return
      if (down) view.panKeys.add(dir)
      else view.panKeys.delete(dir)
    }
    const onKeyDown = onKey(true)
    const onKeyUp = onKey(false)

    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('contextmenu', onContextMenu)
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointerleave', onPointerLeave)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      renderer.stop()
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('contextmenu', onContextMenu)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [source, map, view, camera])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair', touchAction: 'none' }}
    />
  )
}
