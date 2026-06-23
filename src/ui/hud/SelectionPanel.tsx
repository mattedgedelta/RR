/**
 * SelectionPanel — the selected entity card: name + House badge, an HP bar with
 * current/max + %, a row of stat cells (armor / garrison / los …), and the
 * production readout when the entity is training. Empty state when nothing is
 * selected.
 */
import { FC, FONT } from '@/theme/palette'
import { Panel } from '@/ui/common/Panel'
import { Badge } from '@/ui/common/Badge'
import { Bar } from '@/ui/common/Bar'
import { StatCell } from './StatCell'
import { ProductionBar } from './ProductionBar'
import type { SelectionView } from './types'

const hpColor = (f: number): string =>
  f > 0.5 ? FC.accent : f > 0.25 ? FC.warn : FC.error

export function SelectionPanel({ selection }: { selection: SelectionView | null }) {
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT.mono, fontSize: 11 }}>
          <span style={{ color: FC.textDim }}>hp</span>
          <span style={{ color: FC.text3 }}>
            {selection.hp}/{selection.maxHp} · {Math.round(frac * 100)}%
          </span>
        </div>
        <Bar value={frac} color={hpColor(frac)} height={5} />
      </div>

      {selection.stats.length > 0 && (
        <div style={{ display: 'flex', gap: 18 }}>
          {selection.stats.map((s) => (
            <StatCell key={s.label} stat={s} />
          ))}
        </div>
      )}

      {selection.production && <ProductionBar production={selection.production} />}
    </Panel>
  )
}
