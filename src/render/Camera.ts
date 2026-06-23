/**
 * Camera.ts — viewport ↔ world transform, pan, and zoom.
 *
 * Model: `panX/panY` is the CSS-pixel screen position of world origin (tile
 * 0,0); `zoom` is a scale factor on top of `TILE` px/tile. So a tile coordinate
 * maps to screen as `tile * TILE * zoom + pan`. The renderer bakes this into a
 * single canvas transform (scaled by devicePixelRatio); hit-testing uses the
 * inverse via `screenToTile`. The camera clamps so the map can't drift entirely
 * out of view, and centres the map on the axis where it's smaller than the view.
 */
import { TILE } from '@/theme/palette'

export interface Vec2 {
  x: number
  y: number
}

const MIN_ZOOM = 0.25
const MAX_ZOOM = 4

export class Camera {
  zoom = 1
  /** Screen position (CSS px) of world pixel (0,0). */
  panX = 0
  panY = 0
  /** Viewport size in CSS px. */
  viewW = 0
  viewH = 0
  /** World size in CSS px (mapTiles * TILE). */
  worldW = 0
  worldH = 0

  setViewport(w: number, h: number): void {
    this.viewW = w
    this.viewH = h
    this.clamp()
  }

  setWorldSize(tilesW: number, tilesH: number): void {
    this.worldW = tilesW * TILE
    this.worldH = tilesH * TILE
  }

  /** Zoom that fits the whole world in view (with a small margin). */
  fitZoom(margin = 0.92): number {
    if (this.worldW === 0 || this.worldH === 0) return 1
    const z = Math.min(this.viewW / this.worldW, this.viewH / this.worldH) * margin
    return clampZoom(z)
  }

  /** Centre the view on a tile coordinate at the given zoom. */
  centerOn(tileX: number, tileY: number, zoom = this.zoom): void {
    this.zoom = clampZoom(zoom)
    this.panX = this.viewW / 2 - tileX * TILE * this.zoom
    this.panY = this.viewH / 2 - tileY * TILE * this.zoom
    this.clamp()
  }

  worldToScreen(tileX: number, tileY: number): Vec2 {
    return {
      x: tileX * TILE * this.zoom + this.panX,
      y: tileY * TILE * this.zoom + this.panY,
    }
  }

  /** Screen (CSS px) → fractional tile coordinate. */
  screenToTile(sx: number, sy: number): Vec2 {
    return {
      x: (sx - this.panX) / this.zoom / TILE,
      y: (sy - this.panY) / this.zoom / TILE,
    }
  }

  panBy(dxScreen: number, dyScreen: number): void {
    this.panX += dxScreen
    this.panY += dyScreen
    this.clamp()
  }

  /** Zoom by a factor while keeping the world point under (sx,sy) fixed. */
  zoomAt(sx: number, sy: number, factor: number): void {
    const next = clampZoom(this.zoom * factor)
    if (next === this.zoom) return
    // World pixel currently under the cursor.
    const wx = (sx - this.panX) / this.zoom
    const wy = (sy - this.panY) / this.zoom
    this.zoom = next
    this.panX = sx - wx * next
    this.panY = sy - wy * next
    this.clamp()
  }

  /** Keep the map from drifting off-screen; centre the smaller axis. */
  clamp(): void {
    const scaledW = this.worldW * this.zoom
    const scaledH = this.worldH * this.zoom
    if (scaledW <= this.viewW) {
      this.panX = (this.viewW - scaledW) / 2
    } else {
      this.panX = Math.min(0, Math.max(this.viewW - scaledW, this.panX))
    }
    if (scaledH <= this.viewH) {
      this.panY = (this.viewH - scaledH) / 2
    } else {
      this.panY = Math.min(0, Math.max(this.viewH - scaledH, this.panY))
    }
  }

  /** Install the world transform on a context (device px = CSS px * dpr). */
  applyTransform(ctx: CanvasRenderingContext2D, dpr: number): void {
    const s = this.zoom * dpr
    ctx.setTransform(s, 0, 0, s, this.panX * dpr, this.panY * dpr)
  }

  /** Visible tile range [x0,x1) × [y0,y1), clamped to the map, for culling. */
  visibleTiles(): { x0: number; y0: number; x1: number; y1: number } {
    const tl = this.screenToTile(0, 0)
    const br = this.screenToTile(this.viewW, this.viewH)
    return {
      x0: Math.floor(tl.x),
      y0: Math.floor(tl.y),
      x1: Math.ceil(br.x),
      y1: Math.ceil(br.y),
    }
  }
}

function clampZoom(z: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z))
}
