/** SectionLabel — the `// lowercase_label` motif that heads every panel. */
import type { CSSProperties, ReactNode } from 'react'
import { FC, FONT } from '@/theme/palette'

interface SectionLabelProps {
  children: ReactNode
  color?: string
  style?: CSSProperties
}

export function SectionLabel({ children, color = FC.textDim, style }: SectionLabelProps) {
  return (
    <div
      style={{
        fontFamily: FONT.mono,
        fontSize: 10,
        letterSpacing: 1.5,
        color,
        ...style,
      }}
    >
      // {children}
    </div>
  )
}
