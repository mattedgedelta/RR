/** IdleBadge — the gold `N IDLE` worker counter; hidden at zero. */
import { FC } from '@/theme/palette'
import { Badge } from '@/ui/common/Badge'

interface IdleBadgeProps {
  count: number
  onClick?: () => void
}

export function IdleBadge({ count, onClick }: IdleBadgeProps) {
  if (count <= 0) return null
  return (
    <span onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <Badge color={FC.warn}>{count} idle</Badge>
    </span>
  )
}
