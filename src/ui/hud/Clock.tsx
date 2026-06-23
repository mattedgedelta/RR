/**
 * Clock — elapsed mm:ss. With no `value` it binds to the live store via
 * `useRafText` (writes textContent each frame, zero re-renders); pass `value`
 * for a static/fixture readout.
 */
import { Icon } from '@/theme/icons'
import { FC, FONT } from '@/theme/palette'
import { useRafText } from '@/ui/hooks/useRafText'

export function Clock({ value }: { value?: string }) {
  const ref = useRafText<HTMLSpanElement>((s) => s.clock)
  const numStyle = { fontFamily: FONT.mono, fontSize: 14, color: FC.text2, letterSpacing: 1 }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Icon name="clock" size={13} color={FC.textDim} />
      {value !== undefined ? (
        <span style={numStyle}>{value}</span>
      ) : (
        <span ref={ref} style={numStyle}>
          00:00
        </span>
      )}
    </div>
  )
}
