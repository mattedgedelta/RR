/** CommandButton — one command-grid cell: corner hotkey, icon, label. Empty
 *  slots render as a dim placeholder; `primary` is the green age-advance action. */
import { Icon } from '@/theme/icons'
import { FC, FONT } from '@/theme/palette'
import type { CommandSlot } from './types'

interface CommandButtonProps {
  slot: CommandSlot | null
  onClick?: () => void
}

export function CommandButton({ slot, onClick }: CommandButtonProps) {
  if (!slot) {
    return (
      <div
        style={{
          aspectRatio: '1 / 1',
          borderRadius: 6,
          border: `1px solid ${FC.borderSoft}`,
          background: 'transparent',
        }}
      />
    )
  }

  const primary = slot.variant === 'primary'
  const disabled = slot.variant === 'disabled'
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        position: 'relative',
        aspectRatio: '1 / 1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: primary ? FC.borderFaint : FC.card,
        border: `1px solid ${primary ? FC.borderActive : FC.border}`,
        color: disabled ? FC.textFaint : primary ? FC.accent : FC.text3,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 4,
          left: 5,
          fontFamily: FONT.mono,
          fontSize: 9,
          color: primary ? FC.accent : FC.textDim,
        }}
      >
        {slot.hotkey}
      </span>
      {slot.icon && <Icon name={slot.icon} size={18} color={primary ? FC.accent : FC.text3} />}
      <span style={{ fontFamily: FONT.mono, fontSize: 8, letterSpacing: 0.5, textAlign: 'center' }}>
        {slot.label}
      </span>
    </button>
  )
}
