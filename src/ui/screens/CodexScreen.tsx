/**
 * CodexScreen — the in-game encyclopedia. Browse Houses, units, buildings, and
 * the tech tree, all read from the game data tables. Reached from the menu
 * (`codex` / hotkey 4); Esc returns to the menu.
 */
import { useState } from 'react'
import { FC, FONT } from '@/theme/palette'
import { HOUSE_ORDER, HOUSES, type HouseId } from '@/game/data/houses'
import { UNITS, type UnitKind } from '@/game/data/units'
import { BUILDINGS, buildAge, type BuildingKind } from '@/game/data/buildings'
import { AGES } from '@/game/data/ages'
import { TECH_NODES } from '@/game/data/tech'
import { RESOURCE_KINDS, RESOURCE_META, type Cost } from '@/game/data/resources'
import { Panel } from '@/ui/common/Panel'
import { Badge } from '@/ui/common/Badge'
import { Button } from '@/ui/common/Button'
import { SectionLabel } from '@/ui/common/SectionLabel'
import { StatTile } from '@/ui/common/StatTile'
import { TechTree } from '@/ui/techtree/TechTree'
import { useHotkeys } from '@/ui/hooks/useHotkeys'

type Category = 'houses' | 'units' | 'buildings' | 'tech'
const CATEGORIES: Category[] = ['houses', 'units', 'buildings', 'tech']

const UNIT_ORDER: UnitKind[] = ['red', 'gray', 'obsidian', 'gold', 'yellow', 'blue', 'howler']
const BUILDING_ORDER: BuildingKind[] = [
  'spire',
  'legionHall',
  'granary',
  'farm',
  'exchange',
  'forge',
  'kennel',
  'citadel',
  'institute',
  'olympus',
]

/** Short Field-Console framing copy shown under each Codex category's tabs. */
const CATEGORY_INTRO: Partial<Record<Category, string>> = {
  units:
    'the Society is a pyramid of Colors, each locked to its caste — Reds labor, Grays and Obsidians hold the line, Golds command, Yellows mend, Blues scout. every unit you train costs command capacity (raised by Golds + buildings) and eats grain upkeep; feed your army or it wastes away. cultivate the mix your strategy needs.',
  buildings:
    'structures unlock as you advance ages, and gate the Colors they train. Reds raise them; the Spire is your heart — lose every Spire and producing-building and the House falls.',
}

function costStr(cost: Cost): string {
  const parts = RESOURCE_KINDS.filter((k) => cost[k]).map((k) => `${cost[k]} ${RESOURCE_META[k].label}`)
  return parts.length ? parts.join(' · ') : 'free'
}

const firstOf: Record<Category, string> = {
  houses: HOUSE_ORDER[0],
  units: UNIT_ORDER[0],
  buildings: BUILDING_ORDER[0],
  tech: HOUSE_ORDER[0],
}

export default function CodexScreen({ onBack }: { onBack: () => void }) {
  const [cat, setCat] = useState<Category>('houses')
  const [sel, setSel] = useState<string>('mars')
  useHotkeys({ escape: onBack })

  const pickCategory = (c: Category): void => {
    setCat(c)
    setSel(firstOf[c])
  }

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
        <span style={{ fontSize: 11, letterSpacing: 2, color: FC.accent }}>// codex</span>
        <Button variant="ghost" onClick={onBack}>
          [ESC] BACK
        </Button>
      </header>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {CATEGORIES.map((c) => (
          <Tab key={c} on={cat === c} label={c} onClick={() => pickCategory(c)} />
        ))}
      </div>

      {CATEGORY_INTRO[cat] && (
        <p style={{ margin: 0, maxWidth: 820, fontSize: 11, lineHeight: 1.7, color: FC.textDim }}>
          {CATEGORY_INTRO[cat]}
        </p>
      )}

      {cat === 'tech' ? (
        <Panel title="tech_tree">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
            {HOUSE_ORDER.map((h) => (
              <Tab key={h} on={sel === h} label={HOUSES[h].name.toLowerCase()} onClick={() => setSel(h)} />
            ))}
          </div>
          <TechTree house={sel as HouseId} />
        </Panel>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 14, alignItems: 'start' }}>
          <Panel title={cat}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {entriesFor(cat).map((e) => (
                <ListRow key={e.id} active={sel === e.id} label={e.label} onClick={() => setSel(e.id)} />
              ))}
            </div>
          </Panel>
          <Detail cat={cat} id={sel} />
        </div>
      )}
    </div>
  )
}

function entriesFor(cat: Category): { id: string; label: string }[] {
  if (cat === 'houses') return HOUSE_ORDER.map((id) => ({ id, label: HOUSES[id].name.toLowerCase() }))
  if (cat === 'units') return UNIT_ORDER.map((id) => ({ id, label: UNITS[id].label }))
  return BUILDING_ORDER.map((id) => ({ id, label: BUILDINGS[id].label }))
}

function Detail({ cat, id }: { cat: Category; id: string }) {
  if (cat === 'houses') return <HouseDetail house={id as HouseId} />
  if (cat === 'units') return <UnitDetail kind={id as UnitKind} />
  return <BuildingDetail kind={id as BuildingKind} />
}

function HouseDetail({ house }: { house: HouseId }) {
  const h = HOUSES[house]
  return (
    <Panel title="detail">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Badge>{h.name}</Badge>
        <span style={{ fontSize: 10, color: FC.textDim }}>{h.specialty}</span>
      </div>
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: FC.text3 }}>{h.blurb}</p>
      <SectionLabel>bonuses</SectionLabel>
      {h.bonuses.length ? (
        h.bonuses.map((b) => (
          <div key={b} style={{ fontSize: 12, color: FC.accent }}>
            + {b}
          </div>
        ))
      ) : (
        <div style={{ fontSize: 12, color: FC.textDimmer }}>neutral — no bonuses</div>
      )}
      <SectionLabel>uniques</SectionLabel>
      <div style={{ fontSize: 12, color: FC.warn }}>
        {[...h.uniques.units, ...h.uniques.techs.map((t) => TECH_NODES[t].label)].join(' · ') || '—'}
      </div>
    </Panel>
  )
}

function UnitDetail({ kind }: { kind: UnitKind }) {
  const u = UNITS[kind]
  const caps: string[] = []
  if (u.canGather) caps.push('gathers')
  if (u.canBuild) caps.push('builds')
  if (u.canFight && u.attack > 0) caps.push('fights')
  if (u.canHeal) caps.push('heals nearby units')
  if (u.commandProvided) caps.push(`provides +${u.commandProvided} command`)
  if (u.role === 'scout') caps.push('scout — wide line of sight')
  if (!caps.length) caps.push('non-combatant')
  return (
    <Panel title="detail">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 14, letterSpacing: 1, color: FC.text }}>{u.label}</span>
        <Badge color={FC.text3}>{u.role}</Badge>
        {u.unique && <Badge color={FC.warn}>unique</Badge>}
      </div>
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: FC.text3 }}>{u.blurb}</p>
      <Grid>
        <StatTile label="hp" value={u.hp} />
        <StatTile label="attack" value={u.attack} />
        <StatTile label="armor m/p" value={`${u.meleeArmor}/${u.pierceArmor}`} />
        <StatTile label="range" value={u.range || 'melee'} />
        <StatTile label="speed" value={`${u.speed}/s`} />
        <StatTile label="cooldown" value={`${u.attackCooldown}s`} />
        <StatTile label="los" value={u.los} />
        <StatTile label="command" value={u.pop} />
        <StatTile label="upkeep" value={`${u.upkeep} grain/min`} />
        <StatTile label="build_time" value={`${u.buildTime}s`} />
        <StatTile label="age" value={AGES[u.requiredAge].label} />
        <StatTile label="made_by" value={BUILDINGS[u.producedBy].label} />
      </Grid>
      <SectionLabel>caste role</SectionLabel>
      <div style={{ fontSize: 12, color: FC.accent }}>{caps.join(' · ')}</div>
      <SectionLabel>cost</SectionLabel>
      <div style={{ fontSize: 12, color: FC.text2 }}>{costStr(u.cost)}</div>
    </Panel>
  )
}

function BuildingDetail({ kind }: { kind: BuildingKind }) {
  const b = BUILDINGS[kind]
  const drop = b.dropOff === 'all' ? 'all' : b.dropOff.length ? b.dropOff.join(' · ') : '—'
  return (
    <Panel title="detail">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 14, letterSpacing: 1, color: FC.text }}>{b.label}</span>
        {b.defensive && <Badge color={FC.error}>defensive</Badge>}
        {b.unique && <Badge color={FC.warn}>unique</Badge>}
      </div>
      <Grid>
        <StatTile label="hp" value={b.hp} />
        <StatTile label="footprint" value={`${b.footprint.w}×${b.footprint.h}`} />
        <StatTile label="armor m/p" value={`${b.meleeArmor}/${b.pierceArmor}`} />
        <StatTile label="los" value={b.los} />
        <StatTile label="build_time" value={`${b.buildTime}s`} />
        <StatTile label="age" value={AGES[buildAge(kind)].label} />
        <StatTile label="pop_cap" value={b.popProvided ? `+${b.popProvided}` : '0'} />
        <StatTile label="garrison" value={b.garrisonCap || '—'} />
        <StatTile label="drop_off" value={drop} />
      </Grid>
      {kind === 'farm' && (
        <div style={{ fontSize: 11, color: FC.accent }}>
          renewable grain — assign a red to harvest (drops off at spire / granary)
        </div>
      )}
      <SectionLabel>trains</SectionLabel>
      <div style={{ fontSize: 12, color: FC.text2 }}>
        {b.produces.length ? b.produces.map((u) => UNITS[u].label).join(' · ') : '—'}
      </div>
      <SectionLabel>cost</SectionLabel>
      <div style={{ fontSize: 12, color: FC.text2 }}>{costStr(b.cost)}</div>
    </Panel>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, rowGap: 12 }}>
      {children}
    </div>
  )
}

function Tab({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: FONT.mono,
        fontSize: 10,
        letterSpacing: 1,
        padding: '6px 12px',
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

function ListRow({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        fontFamily: FONT.mono,
        fontSize: 11,
        letterSpacing: 0.5,
        padding: '8px 10px',
        borderRadius: 5,
        cursor: 'pointer',
        background: active ? FC.borderFaint : 'transparent',
        border: `1px solid ${active ? FC.borderActive : FC.border}`,
        color: active ? FC.accent : FC.text3,
      }}
    >
      {label}
    </button>
  )
}
