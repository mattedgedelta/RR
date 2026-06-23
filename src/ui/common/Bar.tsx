/** Bar — a thin progress/value track with a colored fill (0..1). */
import { FC } from '@/theme/palette'

interface BarProps {
  value: number
  color?: string
  track?: string
  height?: number
}

export function Bar({ value, color = FC.accent, track = FC.borderSoft, height = 4 }: BarProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div style={{ background: track, borderRadius: 2, height, width: '100%', overflow: 'hidden' }}>
      <div style={{ background: color, height: '100%', width: `${pct}%` }} />
    </div>
  )
}
