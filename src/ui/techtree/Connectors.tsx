/** Connectors — SVG prereq lines between tech nodes (measured by TechTree). */
import { FC } from '@/theme/palette'

export interface Line {
  x1: number
  y1: number
  x2: number
  y2: number
}

export function Connectors({ lines }: { lines: Line[] }) {
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      {lines.map((l, i) => {
        const mx = (l.x1 + l.x2) / 2
        return (
          <path
            key={i}
            d={`M ${l.x1} ${l.y1} C ${mx} ${l.y1}, ${mx} ${l.y2}, ${l.x2} ${l.y2}`}
            fill="none"
            stroke={FC.borderSoft}
            strokeWidth={1}
          />
        )
      })}
    </svg>
  )
}
