/**
 * MenuScreen — the entry screen. Left rail (wordmark · `// MENU` nav · profile
 * chip), centre hero with the single_player / multiplayer cards, right rail with
 * network/record panels and a patch footer. 23px console grid background.
 */
import { FC, FONT } from '@/theme/palette'
import { Icon } from '@/theme/icons'
import { NavItem } from '@/ui/common/NavItem'
import { SectionLabel } from '@/ui/common/SectionLabel'
import { Button } from '@/ui/common/Button'
import { useHotkeys } from '@/ui/hooks/useHotkeys'

interface MenuScreenProps {
  onPlay: () => void
  onCodex: () => void
  onSettings: () => void
}

export default function MenuScreen({ onPlay, onCodex, onSettings }: MenuScreenProps) {
  useHotkeys({ '1': onPlay, enter: onPlay, '3': onSettings, '4': onCodex })

  return (
    <div
      className="fc-grid-23"
      style={{
        position: 'fixed',
        inset: 0,
        background: FC.board,
        display: 'grid',
        gridTemplateColumns: '248px 1fr 268px',
        fontFamily: FONT.mono,
        color: FC.text,
      }}
    >
      {/* Left rail */}
      <aside
        style={{
          borderRight: `1px solid ${FC.border}`,
          background: FC.rail,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          <Icon name="swords" size={18} color={FC.accent} />
          <span style={{ fontSize: 13, letterSpacing: 1.5, color: FC.text }}>
            RED_RISING<span style={{ color: FC.accent }}> // </span>IRON_RAIN
          </span>
        </div>

        <SectionLabel style={{ marginBottom: 10 }}>menu</SectionLabel>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <NavItem hotkey="1" active onClick={onPlay}>
            single_player
          </NavItem>
          <NavItem hotkey="2">multiplayer</NavItem>
          <NavItem hotkey="3" onClick={onSettings}>
            settings
          </NavItem>
          <NavItem hotkey="4" onClick={onCodex}>
            codex
          </NavItem>
        </nav>

        <div style={{ flex: 1 }} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 10,
            border: `1px solid ${FC.border}`,
            borderRadius: 6,
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 4,
              background: FC.borderFaint,
              border: `1px solid ${FC.borderActive}`,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 11, color: FC.text2 }}>reaper_01</span>
            <span style={{ fontSize: 9, color: FC.textDim }}>house_mars</span>
          </div>
        </div>
      </aside>

      {/* Centre */}
      <main style={{ padding: '64px 56px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: FC.accent, marginBottom: 14 }}>
          // tactical_command
        </div>
        <h1 style={{ margin: 0, fontSize: 40, letterSpacing: 1, color: FC.text, fontWeight: 600 }}>
          IRON RAIN
        </h1>
        <p style={{ maxWidth: 460, color: FC.text3, fontSize: 13, lineHeight: 1.7 }}>
          command a house of the society. gather, build, advance through the ages,
          and break the last team standing on the red planet.
        </p>

        <div style={{ display: 'flex', gap: 16, marginTop: 28 }}>
          <Card title="single_player" desc="skirmish vs. CPU houses" icon="crosshair" active onClick={onPlay} />
          <Card title="multiplayer" desc="// offline_in_this_build" icon="users" />
        </div>

        <div style={{ flex: 1 }} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 14,
            border: `1px solid ${FC.border}`,
            borderRadius: 8,
            background: FC.card,
          }}
        >
          <div>
            <SectionLabel>continue</SectionLabel>
            <span style={{ fontSize: 12, color: FC.textDim }}>no saved campaign — start a skirmish</span>
          </div>
          <Button variant="primary" onClick={onPlay}>
            DEPLOY ↵
          </Button>
        </div>
      </main>

      {/* Right rail */}
      <aside
        style={{
          borderLeft: `1px solid ${FC.border}`,
          background: FC.rail,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div>
          <SectionLabel style={{ marginBottom: 8 }}>network</SectionLabel>
          <Stat label="status" value="local" tone={FC.accent} />
          <Stat label="latency" value="0ms" />
          <Stat label="region" value="mars_local" />
        </div>
        <div>
          <SectionLabel style={{ marginBottom: 8 }}>record</SectionLabel>
          <Stat label="victories" value="0" />
          <Stat label="defeats" value="0" />
          <Stat label="apm" value="—" />
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: FC.textFaint }}>build · iron_rain v0.7 · M1</span>
      </aside>
    </div>
  )
}

function Card({
  title,
  desc,
  icon,
  active,
  onClick,
}: {
  title: string
  desc: string
  icon: 'crosshair' | 'users'
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{
        flex: 1,
        textAlign: 'left',
        padding: 18,
        borderRadius: 8,
        background: FC.card,
        border: `1px solid ${active ? FC.borderActive : FC.border}`,
        cursor: onClick ? 'pointer' : 'not-allowed',
        opacity: onClick ? 1 : 0.55,
        fontFamily: FONT.mono,
        color: FC.text,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <Icon name={icon} size={20} color={active ? FC.accent : FC.text3} />
      <span style={{ fontSize: 14, letterSpacing: 1 }}>{title}</span>
      <span style={{ fontSize: 11, color: FC.textDim }}>{desc}</span>
    </button>
  )
}

function Stat({ label, value, tone = FC.text2 }: { label: string; value: string; tone?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11 }}>
      <span style={{ color: FC.textDim }}>{label}</span>
      <span style={{ color: tone }}>{value}</span>
    </div>
  )
}
