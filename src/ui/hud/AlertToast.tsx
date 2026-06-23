/** AlertToast — transient `! UNDER_ATTACK`-style alert, pulsing for urgency. */
import { Icon } from '@/theme/icons'
import { FC, FONT } from '@/theme/palette'

interface AlertToastProps {
  message: string
  tone?: 'error' | 'warn'
}

export function AlertToast({ message, tone = 'error' }: AlertToastProps) {
  const color = tone === 'warn' ? FC.warn : FC.error
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        borderRadius: 6,
        background: FC.card,
        border: `1px solid ${color}`,
        color,
        fontFamily: FONT.mono,
        fontSize: 12,
        letterSpacing: 1,
        animation: 'edpulse 1.4s ease-in-out infinite',
      }}
    >
      <Icon name="alertTriangle" size={14} color={color} />
      {message}
    </div>
  )
}
