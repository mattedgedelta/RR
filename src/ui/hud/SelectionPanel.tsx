/**
 * SelectionPanel — the selected entity card: name + House badge, an HP bar with
 * current/max + %, a row of stat cells (armor / garrison / los …), and the
 * production readout when the entity is training. Empty state when nothing is
 * selected.
 */
import { Icon } from '@/theme/icons'
import { FC, FONT } from '@/theme/palette'
import { UNIT_ICON, type UnitKind } from '@/game/data/units'
import { Panel } from '@/ui/common/Panel'
import { Badge } from '@/ui/common/Badge'
import { Bar } from '@/ui/common/Bar'
import { StatCell } from './StatCell'
import { ProductionBar } from './ProductionBar'
import type { SelectionView } from './types'

const hpColor = (f: number): string =>
  f > 0.5 ? FC.accent : f > 0.25 ? FC.warn : FC.error

interface SelectionPanelProps {
  selection: SelectionView | null
  /** Cancel the queue item at `index` (refunds its cost). */
  onCancelQueue?: (index: number) => void
}

export function SelectionPanel({ selection, onCancelQueue }: SelectionPanelProps) {
  if (!selection) {
    return (
      <Panel title="selection" style={{ minWidth: 240 }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 11, color: FC.textDimmer }}>
          no_selection
        </span>
      </Panel>
    )
  }

  const frac = selection.maxHp > 0 ? selection.hp / selection.maxHp : 0
  return (
    <Panel title="selection" style={{ minWidth: 240 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 13, color: FC.text, letterSpacing: 1 }}>
          {selection.name}
        </span>
        {selection.badge && <Badge>{selection.badge}</Badge>}
      </div>

      {selection.maxHp > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT.mono, fontSize: 11 }}>
            <span style={{ color: FC.textDim }}>{selection.barLabel ?? 'hp'}</span>
            <span style={{ color: FC.text3 }}>
              {selection.hp}/{selection.maxHp} · {Math.round(frac * 100)}%
            </span>
          </div>
          <Bar value={frac} color={hpColor(frac)} height={5} />
        </div>
      )}

      {selection.stats.length > 0 && (
        <div style={{ display: 'flex', gap: 18 }}>
          {selection.stats.map((s) => (
            <StatCell key={s.label} stat={s} />
          ))}
        </div>
      )}

      {selection.production && <ProductionBar production={selection.production} />}

      {selection.production && selection.production.queue.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: 1, color: FC.textDim }}>
            queue · click to cancel
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {selection.production.queue.map((u, i) => (
              <button
                key={i}
                onClick={() => onCancelQueue?.(i)}
                title={`cancel ${u} (refund)`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  cursor: 'pointer',
                  background: i === 0 ? FC.borderFaint : FC.card,
                  border: `1px solid ${i === 0 ? FC.borderActive : FC.border}`,
                }}
              >
                <Icon name={UNIT_ICON[u as UnitKind]} size={12} color={FC.text3} />
              </button>
            ))}
          </div>
        </div>
      )}
    </Panel>
  )
}
