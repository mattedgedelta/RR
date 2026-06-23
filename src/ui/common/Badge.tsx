/** Badge — small uppercase pill (House tag, age marker). */
import type { ReactNode } from 'react'
import { FC, FONT } from '@/theme/palette'

interface BadgeProps {
  children: ReactNode
  color?: string
  filled?: boolean
}

export function Badge({ children, color = FC.accent, filled = false }: BadgeProps) {
  return (
    <span
      style={{
        fontFamily: FONT.mono,
        fontSize: 9,
        letterSpacing: 1,
        textTransform: 'uppercase',
        padding: '2px 6px',
        borderRadius: 4,
        color: filled ? FC.board : color,
        background: filled ? color : 'transparent',
        border: `1px solid ${color}`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}
