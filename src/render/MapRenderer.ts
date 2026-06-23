/**
 * MapRenderer.ts — the viewport's own rAF draw loop, independent of the sim.
 *
 * Each frame: sync the backing store to container size × devicePixelRatio,
 * advance continuous camera motion (edge-scroll + held pan keys), clear to the
 * board colour, install the camera transform, and run the draw layers in z-order.
 * The drag-select rectangle is drawn last in screen space (transform reset).
 *
 * It reads the latest snapshot + interpolation `alpha` from a `FrameSource`
 * (the GameLoop satisfies this structurally), so rendering runs at display
 * refresh while the sim ticks at a fixed 10 Hz.
 */
import { FC } from '@/theme/palette'
import type { Snapshot } from '@/game/sim/snapshot'
import type { GameMap } from '@/game/sim/map'
import { Camera } from './Camera'
import type { DrawLayer, ViewState } from './types'
import { drawTerrain } from './layers/terrain'
import { drawGrid } from './layers/grid'
import { drawResources } from './layers/resources'
import { drawBuildings } from './layers/buildings'
import { drawUnits } from './layers/units'
import { drawSelection } from './layers/selection'
import { drawHealth } from './layers/health'
import { drawPings } from './layers/pings'
import { drawFog } from './layers/fog'

/** Layers in back-to-front draw order. */
const LAYERS: DrawLayer[] = [
  drawTerrain,
  drawGrid,
  drawResources,
  drawBuildings,
  drawUnits,
  drawSelection,
  drawHealth,
  drawPings,
  drawFog,
]

/** Anything that can hand the renderer a snapshot + interpolation alpha. */
export interface FrameSource {
  getSnapshot(): Snapshot
  readonly alpha: number
}

/** Pan speed in CSS px/sec for edge-scroll and held keys. */
const PAN_SPEED = 900
/** Screen margin (px) that triggers edge-scroll. */
const EDGE_MARGIN = 24

export class MapRenderer {
  readonly cam: Camera
  private rafId = 0
  private running = false
  private lastFrame = 0
  private dpr = 1
  private readonly ctx: CanvasRenderingContext2D

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly source: FrameSource,
    private readonly map: GameMap,
    private readonly view: ViewState,
    /** Share a camera with other widgets (e.g. the minimap); else owns one. */
    camera?: Camera,
  ) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('2D canvas context unavailable')
    this.ctx = ctx
    this.cam = camera ?? new Camera()
    this.cam.setWorldSize(map.width, map.height)
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.resize()
    // Frame the whole map on first start.
    this.cam.centerOn(this.map.width / 2, this.map.height / 2, this.cam.fitZoom())
    this.lastFrame = performance.now()
    this.rafId = requestAnimationFrame(this.frame)
  }

  stop(): void {
    if (!this.running) return
    this.running = false
    cancelAnimationFrame(this.rafId)
  }

  /** Match the backing store to the CSS size and devicePixelRatio. */
  private resize(): void {
    const dpr = window.devicePixelRatio || 1
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    const needW = Math.round(w * dpr)
    const needH = Math.round(h * dpr)
    if (this.canvas.width !== needW || this.canvas.height !== needH || this.dpr !== dpr) {
      this.canvas.width = needW
      this.canvas.height = needH
      this.dpr = dpr
    }
    this.cam.setViewport(w, h)
  }

  private applyCameraMotion(dtSec: number): void {
    const step = PAN_SPEED * dtSec
    let dx = 0
    let dy = 0
    const keys = this.view.panKeys
    if (keys.has('left')) dx += step
    if (keys.has('right')) dx -= step
    if (keys.has('up')) dy += step
    if (keys.has('down')) dy -= step

    const m = this.view.mouse
    if (m.inside) {
      if (m.x < EDGE_MARGIN) dx += step
      else if (m.x > this.cam.viewW - EDGE_MARGIN) dx -= step
      if (m.y < EDGE_MARGIN) dy += step
      else if (m.y > this.cam.viewH - EDGE_MARGIN) dy -= step
    }
    if (dx !== 0 || dy !== 0) this.cam.panBy(dx, dy)
  }

  private frame = (now: number): void => {
    if (!this.running) return
    const dtSec = Math.min(0.1, (now - this.lastFrame) / 1000)
    this.lastFrame = now

    this.resize()
    this.applyCameraMotion(dtSec)

    const ctx = this.ctx
    const snap = this.source.getSnapshot()

    // Clear to board colour in device space.
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = FC.board
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // World-space layers.
    this.cam.applyTransform(ctx, this.dpr)
    const lc = {
      ctx,
      cam: this.cam,
      map: this.map,
      snap,
      alpha: this.source.alpha,
      selected: this.view.selected,
      hover: this.view.hover,
      now,
    }
    for (const layer of LAYERS) {
      ctx.save()
      layer(lc)
      ctx.restore()
    }

    // Screen-space overlay: the live drag-select rectangle.
    const r = this.view.dragRect
    if (r) {
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
      ctx.fillStyle = FC.borderFaint
      ctx.fillRect(r.x, r.y, r.w, r.h)
      ctx.lineWidth = 1
      ctx.strokeStyle = FC.accent
      ctx.strokeRect(r.x, r.y, r.w, r.h)
    }

    this.rafId = requestAnimationFrame(this.frame)
  }
}
