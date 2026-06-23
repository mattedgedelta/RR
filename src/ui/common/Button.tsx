/** Button — Field Console button; `primary` is the green-fill call to action. */
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { FC, FONT } from '@/theme/palette'

export type ButtonVariant = 'default' | 'primary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
}

const VARIANTS: Record<ButtonVariant, CSSProperties> = {
  primary: { background: FC.accent, color: FC.board, border: `1px solid ${FC.accent}` },
  default: { background: FC.card, color: FC.text, border: `1px solid ${FC.border}` },
  ghost: { background: 'transparent', color: FC.text3, border: `1px solid ${FC.border}` },
}

export function Button({ variant = 'default', children, style, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        fontFamily: FONT.mono,
        fontSize: 11,
        letterSpacing: 1,
        padding: '8px 12px',
        borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        ...VARIANTS[variant],
        ...style,
      }}
    >
      {children}
    </button>
  )
}
