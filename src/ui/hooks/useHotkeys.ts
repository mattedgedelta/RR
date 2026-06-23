/**
 * useHotkeys — declarative keyboard bindings for a screen.
 *
 * Maps normalised key combos to handlers, e.g. `{ q: ..., r: ..., escape: ...,
 * 'ctrl+1': ... }`. Keystrokes inside text inputs are ignored so typing never
 * fires a command. Used for the command grid (Q/W/E/R), age advance (R), control
 * groups (Ctrl+1..9), and Esc-to-clear. The binding map is read through a ref so
 * passing a fresh object literal each render doesn't re-bind the listener.
 */
import { useEffect, useRef } from 'react'

export type HotkeyHandler = (e: KeyboardEvent) => void
export type HotkeyMap = Record<string, HotkeyHandler>

function comboFromEvent(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey || e.metaKey) parts.push('ctrl')
  if (e.altKey) parts.push('alt')
  if (e.shiftKey) parts.push('shift')
  parts.push(e.key.toLowerCase())
  return parts.join('+')
}

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.isContentEditable
  )
}

export function useHotkeys(map: HotkeyMap, enabled = true): void {
  const mapRef = useRef(map)
  mapRef.current = map

  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.repeat || isEditable(e.target)) return
      const handler = mapRef.current[comboFromEvent(e)]
      if (handler) {
        e.preventDefault()
        handler(e)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
