/**
 * settings.ts — persisted player preferences (default game speed, resource
 * density), held in a tiny external store and mirrored to localStorage.
 *
 * The menu Settings screen edits them; the skirmish reads `gameSpeed` to seed
 * the loop and `resourceDensity` when assembling a MatchConfig. `useSettings`
 * subscribes React components.
 */
import { useSyncExternalStore } from 'react'

export interface Settings {
  /** Default sim speed multiplier (0.5–4). */
  gameSpeed: number
  /** Scattered-resource density multiplier (0–2). */
  resourceDensity: number
}

const KEY = 'rr.settings'
const DEFAULTS: Settings = { gameSpeed: 1, resourceDensity: 1 }

function load(): Settings {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
  } catch {
    return { ...DEFAULTS }
  }
}

let current = load()
const listeners = new Set<() => void>()

export const settingsStore = {
  get: (): Settings => current,
  set: (patch: Partial<Settings>): void => {
    current = { ...current, ...patch }
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(current))
    } catch {
      /* persistence is best-effort */
    }
    for (const l of listeners) l()
  },
  subscribe: (l: () => void): (() => void) => {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
}

export function useSettings(): Settings {
  return useSyncExternalStore(settingsStore.subscribe, settingsStore.get, settingsStore.get)
}
