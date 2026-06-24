/**
 * SettingsScreen — global preferences (menu → settings / hotkey 3): default game
 * speed (seeds new matches + the in-match slider) and map resource density
 * (controls how many scattered nodes spawn). Persisted via the settings store.
 */
import { FC, FONT } from '@/theme/palette'
import { useSettings, settingsStore } from '@/game/settings'
import { Panel } from '@/ui/common/Panel'
import { Button } from '@/ui/common/Button'
import { SectionLabel } from '@/ui/common/SectionLabel'
import { useHotkeys } from '@/ui/hooks/useHotkeys'

export default function SettingsScreen({ onBack }: { onBack: () => void }) {
  const s = useSettings()
  useHotkeys({ escape: onBack })

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
      <div style={{ fontSize: 11, letterSpacing: 2, color: FC.accent }}>// settings</div>

      <Panel title="preferences" style={{ width: 460 }}>
        <Slider
          label="game_speed"
          value={s.gameSpeed}
          min={0.5}
          max={4}
          step={0.25}
          fmt={(v) => `${v}×`}
          onChange={(v) => settingsStore.set({ gameSpeed: v })}
        />
        <Slider
          label="resource_density"
          value={s.resourceDensity}
          min={0}
          max={2}
          step={0.1}
          fmt={(v) => `${v.toFixed(1)}×`}
          onChange={(v) => settingsStore.set({ resourceDensity: v })}
        />
        <SectionLabel color={FC.textFaint} style={{ marginTop: 4 }}>
          game_speed seeds new matches + the in-match slider · density sets scattered-node count
        </SectionLabel>
      </Panel>

      <Button variant="ghost" onClick={onBack}>
        [ESC] BACK
      </Button>
    </div>
  )
}

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  fmt: (v: number) => string
  onChange: (v: number) => void
}

function Slider({ label, value, min, max, step, fmt, onChange }: SliderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ width: 130, fontSize: 11, letterSpacing: 1, color: FC.textDim }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ accentColor: FC.accent, flex: 1 }}
      />
      <span style={{ width: 48, textAlign: 'right', fontSize: 13, color: FC.text }}>{fmt(value)}</span>
    </div>
  )
}
