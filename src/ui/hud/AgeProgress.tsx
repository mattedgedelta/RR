/**
 * AgeProgress — current age name, the 4-segment age spine, and the `[R]`
 * advance call-to-action with its cost (green primary, matching the design).
 */
import { FC, FONT } from '@/theme/palette'
import { RESOURCE_META } from '@/game/data/resources'
import type { Cost, ResourceKind } from '@/game/data/resources'
import { RESOURCE_KINDS } from '@/game/data/resources'
import { Button } from '@/ui/common/Button'
import type { AgeView } from './types'

function costLabel(cost: Cost): string {
  return RESOURCE_KINDS.filter((k) => cost[k])
    .map((k) => `${cost[k]} ${RESOURCE_META[k as ResourceKind].label}`)
    .join(' · ')
}

interface AgeProgressProps {
  age: AgeView
  onAdvance?: () => void
}

export function AgeProgress({ age, onAdvance }: AgeProgressProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 2, color: FC.text2 }}>
          {age.name}
        </span>
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: age.segmentsTotal }, (_, i) => (
            <span
              key={i}
              style={{
                width: 18,
                height: 4,
                borderRadius: 1,
                background: i < age.segmentsFilled ? FC.accent : FC.borderSoft,
              }}
            />
          ))}
        </div>
      </div>
      {age.advance && (
        <Button variant="primary" onClick={onAdvance} style={{ lineHeight: 1.3 }}>
          [R] {age.advance.label.toUpperCase()}
          <span style={{ display: 'block', fontSize: 9, opacity: 0.85 }}>
            {costLabel(age.advance.cost)}
          </span>
        </Button>
      )}
    </div>
  )
}
