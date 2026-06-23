/** ViewportOverlay — the corner telemetry labels (GRID · SCALE · FOG) drawn over
 *  the map viewport. Non-interactive. */
import { FC, FONT } from '@/theme/palette'

interface ViewportOverlayProps {
  gridW: number
  gridH: number
  scale?: string
  fogPct?: number
}

export function ViewportOverlay({ gridW, gridH, scale = '1:240', fogPct = 18 }: ViewportOverlayProps) {
  const labelStyle = {
    fontFamily: FONT.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: FC.textDimmer,
  } as const
  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        right: 12,
        display: 'flex',
        gap: 14,
        pointerEvents: 'none',
      }}
    >
      <span style={labelStyle}>
        GRID {gridW}·{gridH}
      </span>
      <span style={labelStyle}>SCALE {scale}</span>
      <span style={labelStyle}>FOG {fogPct}%</span>
    </div>
  )
}
