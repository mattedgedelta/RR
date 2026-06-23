/** Panel — the bordered Field Console card, with an optional `// title`. */
import type { CSSProperties, ReactNode } from 'react'
import { FC } from '@/theme/palette'
import { SectionLabel } from './SectionLabel'

interface PanelProps {
  children: ReactNode
  title?: string
  pad?: number
  style?: CSSProperties
}

export function Panel({ children, title, pad = 12, style }: PanelProps) {
  return (
    <div
      style={{
        background: FC.card,
        border: `1px solid ${FC.border}`,
        borderRadius: 8,
        padding: pad,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        ...style,
      }}
    >
      {title && <SectionLabel>{title}</SectionLabel>}
      {children}
    </div>
  )
}
