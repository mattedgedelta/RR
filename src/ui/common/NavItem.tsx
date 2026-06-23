/** NavItem — a menu row with a trailing hotkey (used by the menu screen, P7). */
import type { ReactNode } from 'react'
import { FC, FONT } from '@/theme/palette'

interface NavItemProps {
  children: ReactNode
  hotkey?: string
  active?: boolean
  onClick?: () => void
}

export function NavItem({ children, hotkey, active = false, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        width: '100%',
        textAlign: 'left',
        fontFamily: FONT.mono,
        fontSize: 12,
        letterSpacing: 1,
        padding: '10px 12px',
        cursor: 'pointer',
        background: active ? FC.borderFaint : 'transparent',
        color: active ? FC.accent : FC.text3,
        border: `1px solid ${active ? FC.borderActive : 'transparent'}`,
        borderRadius: 6,
      }}
    >
      <span>{children}</span>
      {hotkey && <span style={{ color: FC.textDim }}>{hotkey}</span>}
    </button>
  )
}
