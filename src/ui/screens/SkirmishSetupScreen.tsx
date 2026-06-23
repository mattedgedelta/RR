/**
 * SkirmishSetupScreen — the full configurator (M5).
 *
 * Pick your House (12), read its bonuses/uniques, preview its tech DAG, and set
 * up the match: 1–7 CPU opponents (each with a House + difficulty), FFA vs.
 * Teams, and map size. DEPLOY assembles a MatchConfig and starts the skirmish.
 */
import { useMemo, useState } from 'react'
import { FC, FONT, PLAYER_COLORS } from '@/theme/palette'
import {
  playerColor,
  DIFFICULTIES,
  type Difficulty,
  type MapSizeId,
  type MatchConfig,
  type PlayerId,
  type PlayerSetup,
} from '@/game/data/players'
import { HOUSE_ORDER, HOUSES, DEFAULT_HOUSE, type HouseId } from '@/game/data/houses'
import { TECH_NODES } from '@/game/data/tech'
import { Panel } from '@/ui/common/Panel'
import { Badge } from '@/ui/common/Badge'
import { Button } from '@/ui/common/Button'
import { SectionLabel } from '@/ui/common/SectionLabel'
import { TechTree } from '@/ui/techtree/TechTree'
import { useHotkeys } from '@/ui/hooks/useHotkeys'

const MAP_SIZES: MapSizeId[] = ['auto', 'small', 'medium', 'large', 'huge']
const cycle = <T,>(arr: readonly T[], cur: T): T => arr[(arr.indexOf(cur) + 1) % arr.length]

interface Opponent {
  house: HouseId
  difficulty: Difficulty
}

interface SetupProps {
  onDeploy: (config: MatchConfig) => void
  onBack: () => void
}

export default function SkirmishSetupScreen({ onDeploy, onBack }: SetupProps) {
  const [house, setHouse] = useState<HouseId>(DEFAULT_HOUSE)
  const [opponents, setOpponents] = useState<Opponent[]>([{ house: 'diana', difficulty: 'normal' }])
  const [teams, setTeams] = useState(false)
  const [mapSize, setMapSize] = useState<MapSizeId>('auto')

  const total = 1 + opponents.length

  const setOppCount = (n: number): void => {
    const next = Math.max(1, Math.min(7, n))
    setOpponents((prev) => {
      const out = prev.slice(0, next)
      while (out.length < next) out.push({ house: 'mars', difficulty: 'normal' })
      return out
    })
  }
  const editOpp = (i: number, patch: Partial<Opponent>): void =>
    setOpponents((prev) => prev.map((o, j) => (j === i ? { ...o, ...patch } : o)))

  const build = (): MatchConfig => {
    const half = Math.ceil(total / 2)
    const teamOf = (idx: number): number => (teams ? (idx < half ? 0 : 1) : idx)
    const players: PlayerSetup[] = [
      { id: 0, kind: 'human', house, team: teamOf(0), difficulty: 'normal', color: playerColor(0) },
      ...opponents.map((o, i): PlayerSetup => {
        const id = (i + 1) as PlayerId
        return { id, kind: 'cpu', house: o.house, team: teamOf(i + 1), difficulty: o.difficulty, color: playerColor(id) }
      }),
    ]
    return { seed: Math.floor(Math.random() * 0xffffffff), players, mapSize }
  }

  useHotkeys({ enter: () => onDeploy(build()), escape: onBack })
  const houseDef = useMemo(() => HOUSES[house], [house])

  return (
    <div
      className="fc-grid-23"
      style={{
        position: 'fixed',
        inset: 0,
        background: FC.board,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: 24,
        fontFamily: FONT.mono,
        color: FC.text,
        overflow: 'auto',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, letterSpacing: 2, color: FC.accent }}>// skirmish_setup</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={onBack}>
            [ESC] BACK
          </Button>
          <Button variant="primary" onClick={() => onDeploy(build())}>
            DEPLOY ↵
          </Button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 1fr', gap: 14, alignItems: 'start' }}>
        {/* House picker */}
        <Panel title="house">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {HOUSE_ORDER.map((h) => {
              const active = h === house
              return (
                <button
                  key={h}
                  onClick={() => setHouse(h)}
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 10,
                    letterSpacing: 0.5,
                    textAlign: 'left',
                    padding: '7px 8px',
                    borderRadius: 5,
                    cursor: 'pointer',
                    background: active ? FC.borderFaint : FC.card,
                    border: `1px solid ${active ? FC.borderActive : FC.border}`,
                    color: active ? FC.accent : FC.text3,
                  }}
                >
                  {HOUSES[h].name.toLowerCase()}
                  <div style={{ fontSize: 8, color: FC.textDim }}>{HOUSES[h].specialty}</div>
                </button>
              )
            })}
          </div>
        </Panel>

        {/* House detail */}
        <Panel title="house_detail">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge>{houseDef.name}</Badge>
            <span style={{ fontSize: 10, color: FC.textDim }}>{houseDef.specialty}</span>
          </div>
          <p style={{ margin: 0, fontSize: 11, lineHeight: 1.6, color: FC.text3 }}>{houseDef.blurb}</p>
          <SectionLabel>bonuses</SectionLabel>
          {houseDef.bonuses.length ? (
            houseDef.bonuses.map((b) => (
              <div key={b} style={{ fontSize: 11, color: FC.accent }}>
                + {b}
              </div>
            ))
          ) : (
            <div style={{ fontSize: 11, color: FC.textDimmer }}>neutral — no bonuses</div>
          )}
          <SectionLabel>uniques</SectionLabel>
          <div style={{ fontSize: 11, color: FC.warn }}>
            {[...houseDef.uniques.units, ...houseDef.uniques.techs.map((t) => TECH_NODES[t].label)].join(' · ') || '—'}
          </div>
        </Panel>

        {/* Match config */}
        <Panel title="match">
          <Row label="opponents">
            <Stepper value={opponents.length} onDec={() => setOppCount(opponents.length - 1)} onInc={() => setOppCount(opponents.length + 1)} />
            <span style={{ fontSize: 10, color: FC.textDim, marginLeft: 8 }}>{total} players</span>
          </Row>
          <Row label="mode">
            <Toggle on={!teams} label="ffa" onClick={() => setTeams(false)} />
            <Toggle on={teams} label="teams" onClick={() => setTeams(true)} />
          </Row>
          <Row label="map">
            <CycleBtn value={mapSize} onClick={() => setMapSize(cycle(MAP_SIZES, mapSize))} />
          </Row>
          <SectionLabel>cpu_roster</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 150, overflow: 'auto' }}>
            {opponents.map((o, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: PLAYER_COLORS[i + 1] }} />
                <span style={{ fontSize: 10, color: FC.textDim, width: 44 }}>cpu_{i + 1}</span>
                <CycleBtn value={HOUSES[o.house].name.toLowerCase()} onClick={() => editOpp(i, { house: cycle(HOUSE_ORDER, o.house) })} />
                <CycleBtn value={o.difficulty} onClick={() => editOpp(i, { difficulty: cycle(DIFFICULTIES, o.difficulty) })} />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="tech_tree">
        <TechTree house={house} />
      </Panel>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ width: 78, fontSize: 10, letterSpacing: 1, color: FC.textDim }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{children}</div>
    </div>
  )
}

function Stepper({ value, onDec, onInc }: { value: number; onDec: () => void; onInc: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <MiniBtn onClick={onDec}>−</MiniBtn>
      <span style={{ fontSize: 13, color: FC.text, minWidth: 14, textAlign: 'center' }}>{value}</span>
      <MiniBtn onClick={onInc}>+</MiniBtn>
    </div>
  )
}

function MiniBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: FONT.mono,
        fontSize: 13,
        width: 24,
        height: 24,
        borderRadius: 5,
        cursor: 'pointer',
        background: FC.card,
        border: `1px solid ${FC.border}`,
        color: FC.text2,
      }}
    >
      {children}
    </button>
  )
}

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: FONT.mono,
        fontSize: 10,
        letterSpacing: 1,
        padding: '5px 10px',
        borderRadius: 5,
        cursor: 'pointer',
        background: on ? FC.borderFaint : FC.card,
        border: `1px solid ${on ? FC.borderActive : FC.border}`,
        color: on ? FC.accent : FC.textDim,
      }}
    >
      {label}
    </button>
  )
}

function CycleBtn({ value, onClick }: { value: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: FONT.mono,
        fontSize: 10,
        letterSpacing: 0.5,
        padding: '5px 9px',
        borderRadius: 5,
        cursor: 'pointer',
        background: FC.card,
        border: `1px solid ${FC.border}`,
        color: FC.text2,
        minWidth: 70,
        textAlign: 'left',
      }}
    >
      {value}
    </button>
  )
}
