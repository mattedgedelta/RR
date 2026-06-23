/**
 * ResultScreen — victory/defeat summary with paths back to a new skirmish or the
 * menu. Reached when a match produces an Outcome (wired now; fires once the win
 * system lands in Phase 10).
 */
import { FC, FONT } from '@/theme/palette'
import { Icon } from '@/theme/icons'
import { Button } from '@/ui/common/Button'
import { useHotkeys } from '@/ui/hooks/useHotkeys'
import type { Outcome } from '@/game/sim/world'

interface ResultProps {
  outcome: Outcome
  onRematch: () => void
  onMenu: () => void
}

export default function ResultScreen({ outcome, onRematch, onMenu }: ResultProps) {
  useHotkeys({ enter: onRematch, escape: onMenu })
  const win = outcome.victory
  const color = win ? FC.accent : FC.error

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
        gap: 18,
        fontFamily: FONT.mono,
        color: FC.text,
      }}
    >
      <Icon name={win ? 'swords' : 'alertTriangle'} size={44} color={color} />
      <div style={{ fontSize: 11, letterSpacing: 2, color: FC.textDim }}>// match_complete</div>
      <h1 style={{ margin: 0, fontSize: 38, letterSpacing: 3, color }}>
        {win ? 'VICTORY' : 'DEFEAT'}
      </h1>
      <p style={{ color: FC.text3, fontSize: 13 }}>
        {win ? `team_${outcome.winnerTeam} stands alone on mars.` : 'your house has fallen.'}
      </p>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <Button variant="primary" onClick={onRematch}>
          NEW_SKIRMISH ↵
        </Button>
        <Button variant="ghost" onClick={onMenu}>
          [ESC] MENU
        </Button>
      </div>
    </div>
  )
}
