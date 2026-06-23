/** StatCell — one selection stat (armor / garrison / los …) with tone. */
import { FC } from '@/theme/palette'
import { StatTile } from '@/ui/common/StatTile'
import type { SelectionStat, StatTone } from './types'

const TONE: Record<StatTone, string> = {
  default: FC.text,
  accent: FC.accent,
  warn: FC.warn,
  error: FC.error,
}

export function StatCell({ stat }: { stat: SelectionStat }) {
  return <StatTile label={stat.label} value={stat.value} color={TONE[stat.tone ?? 'default']} />
}
