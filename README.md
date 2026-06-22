# Red Rising: Iron Rain

A fully playable browser **RTS** — 1 human + 1–7 CPU players (up to 8), free-for-all or teams — reimagining an Age-of-Empires-style game as the **Edge Delta observability console** ("Field Console" terminal/tactical treatment).

- **Stack:** React 18 + Vite + TypeScript. Canvas 2D for the map/minimap; React for HUD/menu chrome.
- **Runtime deps:** `react`, `react-dom` only.
- **Architecture:** headless fixed-timestep sim (10 Hz, seeded RNG) decoupled from an imperative Canvas renderer; React reads sim state through a tiny external store. Commands are the single mutation channel for both UI and AI.

See [`plan.md`](./plan.md) for the full implementation plan, design contract, and build orchestration.

## Getting started

```bash
npm install
npm run dev        # serve on http://localhost:5173
npm run typecheck  # tsc -b (project references)
npm run build      # tsc -b && vite build
```

## Build progress

Phased build per `plan.md` (Phases 0–11, milestones M0–M6).

| Phase | Milestone | Status |
|---|---|---|
| **0 — Project setup** | M0 | ✅ done |
| **1 — Theme foundation** | M0 | ✅ done |
| **2 — Data layer** | M0 | ✅ done |
| **3 — Simulation core** | M0 | ✅ done |
| 4 — Loop, store, React boundary | M0 | ⏳ next |
| 5 — Rendering | M1 | ⬜ todo |
| 6 — HUD chrome | M1 | ⬜ todo |
| 7 — Screens & flow | M1 | ⬜ todo |
| 8 — Economy | M2 | ⬜ todo |
| 9 — Build & train | M3 | ⬜ todo |
| 10 — Combat, AI, win/lose | M4 | ⬜ todo |
| 11 — Ages, tech, houses, polish | M5/M6 | ⬜ todo |

### Done so far

- **Phase 0** — Vite + React 18 + TS scaffold; `@ → /src` alias; solution-style tsconfig (`app`/`node` references); `index.html` with Inter + JetBrains Mono and `#060606` board background; scripts `dev`/`build`/`preview`/`typecheck`.
- **Phase 1** — `src/theme/`: `palette.ts` (color/layout source of truth), `tokens.css` (ED foundation + `--fc-*` semantic layer), `global.css` (resets, JetBrains Mono base, grid utilities, `edpulse`), `icons.tsx` (16 Lucide glyphs as React `<Icon>` + raw `Path2D` strings).
- **Phase 2** — `src/game/data/`: `resources.ts`, `ages.ts`, `units.ts`, `buildings.ts`, `tech.ts` (12-node DAG), `houses.ts` (12 Houses; Mars fully specified), `players.ts` (8 colors, difficulty tiers, `MatchConfig`). All values mirror the confirmed design frame.
- **Phase 3** — `src/game/sim/`: `rng.ts` (seeded mulberry32), `map.ts` (tile grid, occupancy/passability, radial starts, auto-scaling size), `entities.ts` (Unit/Building/ResourceNode + factories), `world.ts` (`createWorld` seeds 2–8 balanced bases), `commands.ts` (single mutation channel: dispatch/apply with cost charging + validation), `snapshot.ts` (World→Snapshot projection), `tick.ts` (10 Hz pipeline + cleanup). The 9 `systems/` are stubbed with final signatures (filled in Phases 8–11). Verified: 600-tick 1v1 + 400-tick 8-player runs, deterministic by seed, commands apply correctly.

_Each phase ends green on `npm run typecheck` + `npm run build`._
