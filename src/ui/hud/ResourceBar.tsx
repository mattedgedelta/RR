/** ResourceBar — the four resource stats plus the population counter. */
import { Icon } from '@/theme/icons'
import { FC, FONT } from '@/theme/palette'
import { ResourceStat } from './ResourceStat'
import type { ResourceItem } from './types'

interface ResourceBarProps {
  items: ResourceItem[]
  pop: number
  popCap: number
}

export function ResourceBar({ items, pop, popCap }: ResourceBarProps) {
  const over = pop > popCap
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      {items.map((it) => (
        <ResourceStat key={it.kind} item={it} />
      ))}
      <span style={{ width: 1, height: 18, background: FC.borderSoft }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT.mono }}>
        <Icon name="users" size={14} color={FC.text3} />
        <span style={{ fontSize: 13, color: over ? FC.warn : FC.text }}>
          {pop}/{popCap}
        </span>
      </div>
    </div>
  )
}
