/**
 * MinimapPanel — hosts the minimap <canvas>. Redraws when the snapshot/view
 * changes (Phase 6 fixtures pass a static snapshot; Phase 7 can pass a live
 * getter for per-frame redraw). Click/drag seeks the camera via `onSeek`.
 */
import { useEffect, useRef } from 'react'
import type { GameMap } from '@/game/sim/map'
import type { Snapshot } from '@/game/sim/snapshot'
import { Panel } from '@/ui/common/Panel'
import { renderMinimap, minimapToTile, type MinimapView } from '@/render/Minimap'

const SIZE = 168

interface MinimapPanelProps {
  map: GameMap
  snapshot: Snapshot
  view?: MinimapView
  onSeek?: (tileX: number, tileY: number) => void
}

export function MinimapPanel({ map, snapshot, view, onSeek }: MinimapPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(SIZE * dpr)
    canvas.height = Math.round(SIZE * dpr)
    renderMinimap(ctx, SIZE, SIZE, dpr, map, snapshot, view)
  }, [map, snapshot, view])

  const seek = (e: React.PointerEvent): void => {
    if (!onSeek) return
    const r = e.currentTarget.getBoundingClientRect()
    const t = minimapToTile(map, r.width, r.height, e.clientX - r.left, e.clientY - r.top)
    onSeek(t.x, t.y)
  }

  return (
    <Panel title="minimap">
      <canvas
        ref={canvasRef}
        onPointerDown={seek}
        style={{
          width: SIZE,
          height: SIZE,
          display: 'block',
          borderRadius: 4,
          cursor: onSeek ? 'pointer' : 'default',
        }}
      />
    </Panel>
  )
}
