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
import { FC, TILE } from '@/theme/palette'
import type { Snapshot } from '@/game/sim/snapshot'
import { footprintBuildable, type GameMap } from '@/game/sim/map'
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

/** Per-frame easing toward the true unit position (smooths 10 Hz stepping). */
const SMOOTH = 0.35

export class MapRenderer {
  readonly cam: Camera
  private rafId = 0
  private running = false
  private lastFrame = 0
  private dpr = 1
  /** Eased render positions per unit id (visual interpolation between ticks). */
  private readonly renderPos = new Map<number, { x: number; y: number }>()
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

    // Ease unit render positions toward the latest sim positions, then draw a
    // snapshot view with those smoothed positions (layers stay pure).
    const seen = new Set<number>()
    const entities = snap.entities.map((e) => {
      if (e.etype !== 'unit') return e
      seen.add(e.id)
      let rp = this.renderPos.get(e.id)
      if (!rp) {
        rp = { x: e.x, y: e.y }
        this.renderPos.set(e.id, rp)
      }
      rp.x += (e.x - rp.x) * SMOOTH
      rp.y += (e.y - rp.y) * SMOOTH
      return { ...e, x: rp.x, y: rp.y }
    })
    for (const id of this.renderPos.keys()) if (!seen.has(id)) this.renderPos.delete(id)

    // World-space layers.
    this.cam.applyTransform(ctx, this.dpr)
    const lc = {
      ctx,
      cam: this.cam,
      map: this.map,
      snap: { ...snap, entities },
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

    // World-space overlay: the building-placement ghost (camera transform still set).
    const place = this.view.placement
    if (place && this.view.mouse.inside) {
      const t = this.cam.screenToTile(this.view.mouse.x, this.view.mouse.y)
      const tx = Math.floor(t.x)
      const ty = Math.floor(t.y)
      const ok = footprintBuildable(this.map, tx, ty, place.w, place.h)
      const color = ok ? FC.accent : FC.error
      ctx.save()
      ctx.globalAlpha = 0.25
      ctx.fillStyle = color
      ctx.fillRect(tx * TILE, ty * TILE, place.w * TILE, place.h * TILE)
      ctx.globalAlpha = 1
      ctx.lineWidth = 2 / this.cam.zoom
      ctx.strokeStyle = color
      ctx.strokeRect(tx * TILE, ty * TILE, place.w * TILE, place.h * TILE)
      ctx.restore()
    }

    // World-space overlay: expanding alert pings (camera transform still set).
    if (this.view.pings.length) {
      const PING_MS = 1400
      this.view.pings = this.view.pings.filter((p) => now - p.born < PING_MS)
      for (const p of this.view.pings) {
        const age = (now - p.born) / PING_MS
        ctx.globalAlpha = (1 - age) * 0.8
        ctx.strokeStyle = FC.error
        ctx.lineWidth = 2 / this.cam.zoom
        ctx.beginPath()
        ctx.arc(p.x * TILE, p.y * TILE, (0.4 + age * 2.2) * TILE, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
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
