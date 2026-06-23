/** TechColumn — the stack of tech nodes for a single age. */
import type { TechId, TechNode } from '@/game/data/tech'
import { TechNodeCard, type TechState } from './TechNodeCard'

interface TechColumnProps {
  nodes: { node: TechNode; state: TechState }[]
  registerRef: (id: TechId, el: HTMLDivElement | null) => void
}

export function TechColumn({ nodes, registerRef }: TechColumnProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {nodes.map(({ node, state }) => (
        <TechNodeCard
          key={node.id}
          node={node}
          state={state}
          innerRef={(el) => registerRef(node.id, el)}
        />
      ))}
    </div>
  )
}
