/** ResourceStat — one resource: icon · amount · ▲rate (flat when rate is 0). */
import { Icon } from '@/theme/icons'
import { FC, FONT } from '@/theme/palette'
import type { ResourceItem } from './types'

export function ResourceStat({ item }: { item: ResourceItem }) {
  return (
    <div
      title={item.label}
      style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT.mono }}
    >
      <Icon name={item.icon} size={14} color={item.color} />
      <span style={{ fontSize: 13, color: FC.text }}>{item.amount}</span>
      <span style={{ fontSize: 10, color: item.rate > 0 ? FC.accent : FC.textDimmer }}>
        {item.rate > 0 ? `▲${item.rate}` : '0'}
      </span>
    </div>
  )
}
