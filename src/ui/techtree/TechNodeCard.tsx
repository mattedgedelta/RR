/**
 * TechNodeCard — one node in the tech DAG, styled by runtime state:
 *   built (green fill) · available (green) · locked (dashed dim) · unique (gold ★).
 */
import { Icon, type IconName } from '@/theme/icons'
import { FC, FONT } from '@/theme/palette'
import type { TechNode } from '@/game/data/tech'

export type TechState = 'built' | 'available' | 'locked' | 'unique'

const KIND_ICON: Record<TechNode['kind'], IconName> = {
  building: 'home',
  unit: 'users',
  upgrade: 'zap',
}

interface StateStyle {
  border: string
  color: string
  bg: string
  dashed?: boolean
}

const STATE: Record<TechState, StateStyle> = {
  built: { border: FC.accent, color: FC.board, bg: FC.accent },
  available: { border: FC.border, color: FC.text2, bg: FC.card },
  locked: { border: FC.borderSoft, color: FC.textFaint, bg: 'transparent', dashed: true },
  unique: { border: FC.warn, color: FC.warn, bg: 'transparent' },
}

interface TechNodeCardProps {
  node: TechNode
  state: TechState
  innerRef?: (el: HTMLDivElement | null) => void
}

export function TechNodeCard({ node, state, innerRef }: TechNodeCardProps) {
  const s = STATE[state]
  return (
    <div
      ref={innerRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        borderRadius: 6,
        background: s.bg,
        border: `1px ${s.dashed ? 'dashed' : 'solid'} ${s.border}`,
        color: s.color,
        fontFamily: FONT.mono,
      }}
    >
      <Icon name={KIND_ICON[node.kind]} size={14} color={s.color} />
      <span style={{ fontSize: 11, letterSpacing: 0.5, flex: 1 }}>{node.label}</span>
      {state === 'unique' && <span style={{ fontSize: 11 }}>★</span>}
      {node.stub && <span style={{ fontSize: 8, color: FC.textFaint }}>stub</span>}
    </div>
  )
}
