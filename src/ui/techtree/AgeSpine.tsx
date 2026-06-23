/** AgeSpine — the four-age header track across the tech columns; the current
 *  age (and those already passed) read green. */
import { AGE_ORDER, AGES, type AgeId } from '@/game/data/ages'
import { FC, FONT } from '@/theme/palette'

export function AgeSpine({ current }: { current: AgeId }) {
  const currentIndex = AGES[current].index
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 10 }}>
      {AGE_ORDER.map((id, i) => {
        const reached = i <= currentIndex
        return (
          <div
            key={id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: 1.5,
              color: reached ? FC.accent : FC.textDim,
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 3,
                fontSize: 9,
                color: reached ? FC.board : FC.textDim,
                background: reached ? FC.accent : 'transparent',
                border: `1px solid ${reached ? FC.accent : FC.border}`,
              }}
            >
              {i + 1}
            </span>
            {AGES[id].name}
          </div>
        )
      })}
    </div>
  )
}
