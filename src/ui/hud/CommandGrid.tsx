/** CommandGrid — the 4×2 action grid (hotkeys Q/W/E/R · A/S/D/F). */
import { Panel } from '@/ui/common/Panel'
import { CommandButton } from './CommandButton'
import type { CommandSlot } from './types'

interface CommandGridProps {
  slots: (CommandSlot | null)[]
  onSlot?: (index: number, slot: CommandSlot) => void
}

export function CommandGrid({ slots, onSlot }: CommandGridProps) {
  const cells: (CommandSlot | null)[] = slots.slice(0, 8)
  while (cells.length < 8) cells.push(null)

  return (
    <Panel title="commands" style={{ width: 232 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: 6,
        }}
      >
        {cells.map((slot, i) => (
          <CommandButton
            key={i}
            slot={slot}
            onClick={slot && onSlot ? () => onSlot(i, slot) : undefined}
          />
        ))}
      </div>
    </Panel>
  )
}
