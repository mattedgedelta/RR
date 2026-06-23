/** CommandButton — one command-grid cell: corner hotkey, icon, label, and the
 *  resource cost. The action verb (build/train/advance) is conveyed by the icon
 *  and context, so the label drops it to fit; cells wrap rather than clip. */
import { Icon } from '@/theme/icons'
import { FC, FONT, RESOURCE } from '@/theme/palette'
import { RESOURCE_KINDS, type Cost } from '@/game/data/resources'
import type { CommandSlot } from './types'

function costParts(cost: Cost | undefined) {
  if (!cost) return []
  return RESOURCE_KINDS.filter((k) => cost[k]).map((k) => ({ k, v: cost[k] as number, color: RESOURCE[k] }))
}

export function CommandButton({ slot, onClick }: { slot: CommandSlot | null; onClick?: () => void }) {
  if (!slot) {
    return (
      <div style={{ minHeight: 62, borderRadius: 6, border: `1px solid ${FC.borderSoft}`, background: 'transparent' }} />
    )
  }

  const primary = slot.variant === 'primary'
  const disabled = slot.variant === 'disabled'
  const fg = disabled ? FC.textFaint : primary ? FC.accent : FC.text3
  // Drop the action verb (icon conveys it) and render lowercase_snake.
  const label = slot.label
    .replace(/^(build|train|advance)_/, '')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase()
  const costs = costParts(slot.cost)

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        position: 'relative',
        minHeight: 62,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        padding: '16px 4px 5px',
        borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: primary ? FC.borderFaint : FC.card,
        border: `1px solid ${primary ? FC.borderActive : FC.border}`,
        color: fg,
        opacity: disabled ? 0.5 : 1,
        overflow: 'hidden',
      }}
    >
      <span style={{ position: 'absolute', top: 3, left: 5, fontFamily: FONT.mono, fontSize: 9, color: primary ? FC.accent : FC.textDim }}>
        {slot.hotkey}
      </span>
      {slot.icon && <Icon name={slot.icon} size={16} color={fg} />}
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 8,
          lineHeight: 1.1,
          letterSpacing: 0.3,
          textAlign: 'center',
          wordBreak: 'break-word',
        }}
      >
        {label}
      </span>
      {costs.length > 0 && (
        <span style={{ display: 'flex', gap: 4, fontFamily: FONT.mono, fontSize: 8 }}>
          {costs.map((c) => (
            <span key={c.k} style={{ color: c.color }}>
              {c.v}
            </span>
          ))}
        </span>
      )}
    </button>
  )
}
