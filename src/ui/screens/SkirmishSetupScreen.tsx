/**
 * SkirmishSetupScreen — M1 stub. Shows the default skirmish (you = House Mars
 * vs. 1 CPU, FFA, auto map) and DEPLOYs it. The full 3-column house/tech/match
 * configurator lands in Phase 11 (M5); this keeps the screen flow honest now.
 */
import { useMemo } from 'react'
import { FC, FONT, PLAYER_COLORS } from '@/theme/palette'
import { defaultMatchConfig, type MatchConfig } from '@/game/data/players'
import { HOUSES } from '@/game/data/houses'
import { Panel } from '@/ui/common/Panel'
import { Badge } from '@/ui/common/Badge'
import { Button } from '@/ui/common/Button'
import { SectionLabel } from '@/ui/common/SectionLabel'
import { useHotkeys } from '@/ui/hooks/useHotkeys'

interface SetupProps {
  onDeploy: (config: MatchConfig) => void
  onBack: () => void
}

export default function SkirmishSetupScreen({ onDeploy, onBack }: SetupProps) {
  // A fresh seed per visit so the same defaults still vary the map.
  const config = useMemo(() => defaultMatchConfig(Math.floor(Math.random() * 0xffffffff)), [])

  useHotkeys({ enter: () => onDeploy(config), escape: onBack })

  return (
    <div
      className="fc-grid-23"
      style={{
        position: 'fixed',
        inset: 0,
        background: FC.board,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
        fontFamily: FONT.mono,
        color: FC.text,
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: 2, color: FC.accent }}>// skirmish_setup</div>

      <Panel title="match_config" style={{ width: 440 }}>
        <Row label="players">
          {config.players.map((p) => (
            <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 12 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: PLAYER_COLORS[p.id] }} />
              <span style={{ fontSize: 11, color: FC.text2 }}>
                {p.kind === 'human' ? 'you' : 'cpu'} · {HOUSES[p.house].label}
                {p.kind === 'cpu' && <span style={{ color: FC.textDim }}> ({p.difficulty})</span>}
              </span>
            </span>
          ))}
        </Row>
        <Row label="mode">
          <Badge>free_for_all</Badge>
        </Row>
        <Row label="map">
          <span style={{ fontSize: 11, color: FC.text2 }}>auto · seed {config.seed}</span>
        </Row>
        <SectionLabel color={FC.textFaint} style={{ marginTop: 4 }}>
          full_configurator_in_M5
        </SectionLabel>
      </Panel>

      <div style={{ display: 'flex', gap: 12 }}>
        <Button variant="ghost" onClick={onBack}>
          [ESC] BACK
        </Button>
        <Button variant="primary" onClick={() => onDeploy(config)}>
          DEPLOY ↵
        </Button>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ width: 70, fontSize: 10, letterSpacing: 1, color: FC.textDim }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>{children}</div>
    </div>
  )
}
