import { FC, PLAYER_COLORS, RESOURCE } from './theme/palette'
import { Icon, type IconName } from './theme/icons'

/**
 * Scratch swatch — Phase 1 checkpoint. Verifies fonts, palette, and icons
 * render correctly. Replaced by the screen state machine in Phase 7.
 */
const ICON_NAMES: IconName[] = [
  'leaf',
  'gem',
  'coins',
  'zap',
  'users',
  'clock',
  'swords',
  'hammer',
  'home',
  'shield',
  'crosshair',
  'chevronRight',
  'x',
  'play',
  'pause',
  'alertTriangle',
]

export default function App() {
  return (
    <div style={{ padding: 24, color: FC.text }}>
      <div
        style={{
          fontSize: 11,
          letterSpacing: 2,
          color: FC.accent,
          marginBottom: 16,
        }}
      >
        // RED_RISING · IRON_RAIN — theme_check
      </div>

      <SectionLabel>resource_colors</SectionLabel>
      <Row>
        {Object.entries(RESOURCE).map(([name, hex]) => (
          <Swatch key={name} label={name} hex={hex} />
        ))}
      </Row>

      <SectionLabel>player_colors</SectionLabel>
      <Row>
        {PLAYER_COLORS.map((hex, i) => (
          <Swatch key={i} label={`p${i}`} hex={hex} />
        ))}
      </Row>

      <SectionLabel>field_console_neutrals</SectionLabel>
      <Row>
        {(['board', 'rail', 'card', 'grid', 'border', 'textDim', 'text'] as const).map(
          (k) => (
            <Swatch key={k} label={k} hex={FC[k]} />
          ),
        )}
      </Row>

      <SectionLabel>icons</SectionLabel>
      <Row>
        {ICON_NAMES.map((n) => (
          <div
            key={n}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              color: FC.text3,
              width: 64,
            }}
          >
            <Icon name={n} size={22} color={FC.accent} />
            <span style={{ fontSize: 10, color: FC.textDim }}>{n}</span>
          </div>
        ))}
      </Row>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        letterSpacing: 1.5,
        color: FC.textDim,
        margin: '24px 0 10px',
      }}
    >
      {children}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
      {children}
    </div>
  )
}

function Swatch({ label, hex }: { label: string; hex: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 88 }}>
      <div
        style={{
          height: 44,
          background: hex,
          border: `1px solid ${FC.border}`,
          borderRadius: 6,
        }}
      />
      <span style={{ fontSize: 10, color: FC.textDim }}>{label}</span>
      <span style={{ fontSize: 10, color: FC.textFaint }}>{hex}</span>
    </div>
  )
}
