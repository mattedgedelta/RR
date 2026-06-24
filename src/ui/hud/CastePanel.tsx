/**
 * CastePanel — the caste dashboard. Surfaces the three things the caste economy
 * makes the player manage: command capacity (used / cap, with a fill bar that
 * reddens when capped), grain food balance (income − upkeep per minute, green
 * when in surplus), and the live per-Color tally. Persistent STARVING /
 * COMMAND CAPPED flags warn while those conditions hold.
 */
import { Icon } from '@/theme/icons'
import type { IconName } from '@/theme/icons'
import { FC, FONT } from '@/theme/palette'
import { Panel } from '@/ui/common/Panel'
import type { CasteView } from './types'

export function CastePanel({ view }: { view: CasteView }) {
  const { command, food, colors } = view
  const cmd01 = command.cap > 0 ? Math.min(1, command.used / command.cap) : 0
  const cmdColor = command.capped ? FC.error : cmd01 > 0.85 ? FC.warn : FC.text
  const netColor = food.starving ? FC.error : food.net >= 0 ? FC.accent : FC.warn

  return (
    <Panel title="caste" style={{ width: 226, boxSizing: 'border-box' }}>
      {/* command capacity */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <Row
          icon="users"
          label="command"
          value={`${command.used}/${command.cap}`}
          color={cmdColor}
          hint="command capacity — the force you can field. raised by Golds and buildings; train a Gold when capped."
        />
        <Bar value01={cmd01} color={cmdColor} />
        {command.capped && <Flag color={FC.error}>COMMAND CAPPED — field a Gold</Flag>}
      </div>

      {/* food balance */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Row
          icon="zap"
          label="food"
          value={`${food.net >= 0 ? '+' : ''}${food.net}/min`}
          color={netColor}
          hint="grain income minus army upkeep, per minute. a deficit starves your army — Reds are spared."
        />
        <span style={{ fontSize: 9, letterSpacing: 0.5, color: FC.textDim }}>
          grain {food.income}/min · upkeep {food.upkeep}/min
        </span>
        {food.starving && <Flag color={FC.error}>STARVING — units attriting</Flag>}
      </div>

      {/* Color tally */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {colors.length ? (
          colors.map((c) => (
            <span
              key={c.kind}
              title={c.label}
              style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: FC.text2 }}
            >
              <Icon name={c.icon} size={12} color={FC.text3} />
              {c.count}
            </span>
          ))
        ) : (
          <span style={{ fontSize: 10, color: FC.textDimmer }}>no units</span>
        )}
      </div>
    </Panel>
  )
}

function Row({
  icon,
  label,
  value,
  color,
  hint,
}: {
  icon: IconName
  label: string
  value: string
  color: string
  hint?: string
}) {
  return (
    <div title={hint} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT.mono, cursor: hint ? 'help' : 'default' }}>
      <Icon name={icon} size={12} color={FC.text3} />
      <span style={{ fontSize: 9, letterSpacing: 1, color: FC.textDim }}>{label}</span>
      <span style={{ marginLeft: 'auto', fontSize: 13, color }}>{value}</span>
    </div>
  )
}

function Bar({ value01, color }: { value01: number; color: string }) {
  return (
    <div style={{ height: 4, borderRadius: 2, background: FC.border, overflow: 'hidden' }}>
      <div style={{ width: `${Math.round(value01 * 100)}%`, height: '100%', background: color }} />
    </div>
  )
}

function Flag({ color, children }: { color: string; children: string }) {
  return (
    <span style={{ fontSize: 9, letterSpacing: 0.5, color, fontFamily: FONT.mono }}>▸ {children}</span>
  )
}
