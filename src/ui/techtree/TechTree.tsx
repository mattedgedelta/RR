/**
 * TechTree — the Field Console tech DAG for a House.
 *
 * Four age columns (AgeSpine header) of TechNodeCards, with SVG prereq
 * Connectors drawn between them. Node state is derived from the House (which
 * unique nodes it owns) and the current age (what's unlocked). Connector
 * endpoints are measured from the live DOM via refs and a ResizeObserver, so the
 * lines track the cards through layout/resize.
 */
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { AGE_ORDER, AGES, type AgeId } from '@/game/data/ages'
import { TECH_BY_AGE, TECH_NODES, HOUSE_SIGNATURE, type TechId, type TechNode } from '@/game/data/tech'
import { HOUSES, type HouseId, type HouseDef } from '@/game/data/houses'
import { AgeSpine } from './AgeSpine'
import { TechColumn } from './TechColumn'
import { Connectors, type Line } from './Connectors'
import type { TechState } from './TechNodeCard'

function stateOf(node: TechNode, house: HouseDef, currentIndex: number): TechState {
  if (node.unique) {
    const owned =
      (node.unlocksUnit && house.uniques.units.includes(node.unlocksUnit)) ||
      house.uniques.techs.includes(node.id)
    return owned ? 'unique' : 'locked'
  }
  if (node.stub) return 'locked'
  return AGES[node.age].index <= currentIndex ? 'available' : 'locked'
}

interface TechTreeProps {
  house: HouseId
  /** Current age (drives availability); defaults to the starting age. */
  age?: AgeId
}

export function TechTree({ house, age = 'bondsman' }: TechTreeProps) {
  const houseDef = HOUSES[house]
  const currentIndex = AGES[age].index

  const containerRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef(new Map<TechId, HTMLDivElement>())
  const [lines, setLines] = useState<Line[]>([])

  const registerRef = useCallback((id: TechId, el: HTMLDivElement | null) => {
    if (el) nodeRefs.current.set(id, el)
    else nodeRefs.current.delete(id)
  }, [])

  useLayoutEffect(() => {
    const measure = (): void => {
      const cont = containerRef.current
      if (!cont) return
      const cb = cont.getBoundingClientRect()
      const next: Line[] = []
      for (const id of Object.keys(TECH_NODES) as TechId[]) {
        const el = nodeRefs.current.get(id)
        if (!el) continue
        const tb = el.getBoundingClientRect()
        const x2 = tb.left - cb.left
        const y2 = tb.top - cb.top + tb.height / 2
        for (const pre of TECH_NODES[id].prereqs) {
          const pe = nodeRefs.current.get(pre)
          if (!pe) continue
          const pb = pe.getBoundingClientRect()
          next.push({ x1: pb.right - cb.left, y1: pb.top - cb.top + pb.height / 2, x2, y2 })
        }
      }
      setLines(next)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [house, age])

  return (
    <div>
      <AgeSpine current={age} />
      <div ref={containerRef} style={{ position: 'relative' }}>
        <Connectors lines={lines} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {AGE_ORDER.map((ageId) => {
            // The Sovereign column's signature slot shows THIS House's gold tech.
            const ids =
              ageId === 'sovereign' ? [...TECH_BY_AGE[ageId], HOUSE_SIGNATURE[house]] : TECH_BY_AGE[ageId]
            return (
              <TechColumn
                key={ageId}
                registerRef={registerRef}
                nodes={ids.map((id) => ({
                  node: TECH_NODES[id],
                  state: stateOf(TECH_NODES[id], houseDef, currentIndex),
                }))}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
