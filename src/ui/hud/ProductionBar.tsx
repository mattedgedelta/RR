/** ProductionBar — current trainee + progress + `QUEUE n · Ns`. */
import { FC, FONT } from '@/theme/palette'
import { Bar } from '@/ui/common/Bar'
import type { ProductionView } from './types'

export function ProductionBar({ production }: { production: ProductionView }) {
  const pct = Math.round(production.progress01 * 100)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontFamily: FONT.mono }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span style={{ color: FC.text3 }}>
          producing <span style={{ color: FC.accent }}>{production.unit}</span>
        </span>
        <span style={{ color: FC.textDim }}>{pct}%</span>
      </div>
      <Bar value={production.progress01} />
      <div style={{ fontSize: 10, color: FC.textDim }}>
        queue {production.queueLen} · {production.etaSec}s
      </div>
    </div>
  )
}
