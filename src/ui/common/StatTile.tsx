/** StatTile — a stacked label/value cell. */
import type { ReactNode } from 'react'
import { FC, FONT } from '@/theme/palette'

interface StatTileProps {
  label: string
  value: ReactNode
  color?: string
}

export function StatTile({ label, value, color = FC.text }: StatTileProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: 1, color: FC.textDim }}>
        {label}
      </span>
      <span style={{ fontFamily: FONT.mono, fontSize: 14, color }}>{value}</span>
    </div>
  )
}
