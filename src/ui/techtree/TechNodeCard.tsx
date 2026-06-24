/**
 * TechNodeCard — one node in the tech DAG, styled by runtime state:
 *   built (green fill) · available (green) · locked (dashed dim) · unique (gold ★).
 * Hovering shows a tooltip explaining the item with its key stats.
 */
import { useState } from 'react'
import { Icon, type IconName } from '@/theme/icons'
import { FC, FONT } from '@/theme/palette'
import { BUILDINGS, BUILDING_ICON } from '@/game/data/buildings'
import { UNITS, UNIT_ICON } from '@/game/data/units'
import { RESOURCE_KINDS, RESOURCE_META, type Cost } from '@/game/data/resources'
import { AGES } from '@/game/data/ages'
import type { TechNode } from '@/game/data/tech'

export type TechState = 'built' | 'available' | 'locked' | 'unique'

function nodeIcon(node: TechNode): IconName {
  if (node.unlocksBuilding) return BUILDING_ICON[node.unlocksBuilding]
  if (node.unlocksUnit) return UNIT_ICON[node.unlocksUnit]
  return 'zap'
}

const costStr = (cost: Cost): string =>
  RESOURCE_KINDS.filter((k) => cost[k])
    .map((k) => `${cost[k]} ${RESOURCE_META[k].label}`)
    .join(' · ') || 'free'

/** Tooltip lines: name + key stats + age, derived from the data tables. */
function tooltipLines(node: TechNode): string[] {
  if (node.unlocksBuilding) {
    const b = BUILDINGS[node.unlocksBuilding]
    return [
      `building · ${AGES[b.requiredAge].label}`,
      `hp ${b.hp} · armor ${b.meleeArmor}/${b.pierceArmor} · los ${b.los}`,
      b.produces.length ? `trains ${b.produces.join(', ')}` : `cost ${costStr(b.cost)}`,
    ]
  }
  if (node.unlocksUnit) {
    const u = UNITS[node.unlocksUnit]
    return [
      `unit · ${AGES[u.requiredAge].label}`,
      `hp ${u.hp} · atk ${u.attack} · armor ${u.meleeArmor}/${u.pierceArmor}`,
      `cost ${costStr(u.cost)}`,
    ]
  }
  return [node.unique ? 'house signature — passive bonus' : 'upgrade', `${AGES[node.age].label}`]
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
  const [hover, setHover] = useState(false)

  return (
    <div
      ref={innerRef}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
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
      <Icon name={nodeIcon(node)} size={14} color={s.color} />
      <span style={{ fontSize: 11, letterSpacing: 0.5, flex: 1 }}>{node.label}</span>
      {state === 'unique' && <span style={{ fontSize: 11 }}>★</span>}
      {node.stub && <span style={{ fontSize: 8, color: FC.textFaint }}>stub</span>}

      {hover && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: 0,
            zIndex: 20,
            minWidth: 180,
            padding: '8px 10px',
            background: FC.card,
            border: `1px solid ${FC.border}`,
            borderRadius: 6,
            boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 11, color: FC.text, letterSpacing: 0.5, marginBottom: 4 }}>
            {node.label}
            {node.unique && <span style={{ color: FC.warn }}> ★</span>}
          </div>
          {tooltipLines(node).map((line, i) => (
            <div key={i} style={{ fontSize: 10, color: FC.text3, lineHeight: 1.5 }}>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
