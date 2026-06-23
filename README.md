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
| **4 — Loop, store, React boundary** | M0 | ✅ done |
| **5 — Rendering** | M1 | ✅ done |
| **6 — HUD chrome** | M1 | ✅ done |
| **7 — Screens & flow** | M1 | ✅ done |
| **8 — Economy** | M2 | ✅ done |
| **9 — Build & train** | M3 | ✅ done |
| 10 — Combat, AI, win/lose | M4 | ⏳ next |
| 11 — Ages, tech, houses, polish | M5/M6 | ⬜ todo |

### Done so far

- **Phase 0** — Vite + React 18 + TS scaffold; `@ → /src` alias; solution-style tsconfig (`app`/`node` references); `index.html` with Inter + JetBrains Mono and `#060606` board background; scripts `dev`/`build`/`preview`/`typecheck`.
- **Phase 1** — `src/theme/`: `palette.ts` (color/layout source of truth), `tokens.css` (ED foundation + `--fc-*` semantic layer), `global.css` (resets, JetBrains Mono base, grid utilities, `edpulse`), `icons.tsx` (16 Lucide glyphs as React `<Icon>` + raw `Path2D` strings).
- **Phase 2** — `src/game/data/`: `resources.ts`, `ages.ts`, `units.ts`, `buildings.ts`, `tech.ts` (12-node DAG), `houses.ts` (12 Houses; Mars fully specified), `players.ts` (8 colors, difficulty tiers, `MatchConfig`). All values mirror the confirmed design frame.
- **Phase 3** — `src/game/sim/`: `rng.ts` (seeded mulberry32), `map.ts` (tile grid, occupancy/passability, radial starts, auto-scaling size), `entities.ts` (Unit/Building/ResourceNode + factories), `world.ts` (`createWorld` seeds 2–8 balanced bases), `commands.ts` (single mutation channel: dispatch/apply with cost charging + validation), `snapshot.ts` (World→Snapshot projection), `tick.ts` (10 Hz pipeline + cleanup). The 9 `systems/` are stubbed with final signatures (filled in Phases 8–11). Verified: 600-tick 1v1 + 400-tick 8-player runs, deterministic by seed, commands apply correctly.
- **Phase 4** — the React boundary (end of M0): `src/game/store.ts` (external snapshot store + tearing-safe `useGameValue(selector)` with memoised, equality-checked selections so widgets re-render only when their slice changes; `dispatch(cmd)` routes UI commands to the active world), `src/game/loop.ts` (`GameLoop` — fixed-timestep rAF accumulator at 10 Hz with `MAX_STEPS_PER_FRAME` spiral guard, pause/resume, 0.25×–8× speed, and `alpha` interpolation for the renderer), and `src/ui/hooks/` (`useRafText`/`useRafWidth` write `textContent`/`style.width` imperatively with zero re-renders; `useGameValue`, `useScreen` state machine, `useHotkeys`). Checkpoint `LoopDebug` mounts a live world: clock ticks with no React re-render, counters update via selectors, pause/speed verified.
- **Phase 5** — imperative Canvas rendering (M1): `src/render/Camera.ts` (tile↔screen transform, pan, zoom-to-cursor, map clamp, DPR-baked transform, visible-tile culling), `src/render/MapRenderer.ts` (own rAF loop reading the loop's snapshot + `alpha`; resizes to container×DPR, runs layers in z-order, edge-scroll/key pan), `src/render/HitTest.ts` (spatial-hash pick — units > buildings > resources — and box-select of own units), the 9 `src/render/layers/` draw fns (terrain/grid/resources/buildings/units/selection/health; fog + pings are deferred no-ops for P10/P11), and `src/ui/hud/Viewport.tsx` (canvas host wiring pointer/keyboard → camera + `move`/`gather`/`attack` commands; selection in a mutable `ViewState` so it never re-renders React). Checkpoint `RenderDebug` renders the live world — Spire + nodes + Pioneers on the grid with select / pan / zoom / right-click orders.
- **Phase 6** — the Field Console HUD (M1): `src/ui/common/` primitives (`Panel`, `SectionLabel`, `Button`, `Bar`, `Badge`, `NavItem`, `StatTile`) bound to the FC tokens, and the `src/ui/hud/` widgets — `ResourceBar`+`ResourceStat`, `AgeProgress`, `IdleBadge`, `Clock` (`useRafText`-backed), `SelectionPanel`+`StatCell`+`ProductionBar`, `CommandGrid`+`CommandButton`, `MinimapPanel`, `AlertToast`, `ViewportOverlay` — all presentational (prop-driven via `hud/types.ts` view-models, so chrome is verifiable before the engine is wired). `src/render/Minimap.ts` draws the scaled map + entity dots + viewport rect with click-to-pan. Checkpoint `HudDebug` composes the whole HUD from `hud/fixtures.ts` (the exact design-frame values: grain 480 ▲12 … Spire 2100/2400 · MARS · INITIATE 2/4 · advance Peerless). Live wiring lands in Phase 7.
- **Phase 7** — screens & flow (**end of M1** — the app now runs end-to-end): `src/ui/screens/` `MenuScreen` (rails + hero + single_player/continue), `SkirmishSetupScreen` (M1 stub — Mars vs 1 CPU FFA, fresh seed, full configurator deferred to M5), `SkirmishScreen` (owns the `GameLoop` lifecycle; wires live snapshot → HUD via `hud/connect.ts` projections; shares one `Camera`/`ViewState` between Viewport and minimap; selection flows Viewport → React → SelectionPanel/CommandGrid; Q/W/E/R + Esc hotkeys; train/advance/stop dispatch through the command channel), and `ResultScreen`. `App.tsx` drives the `menu → skirmish-setup → skirmish → result` machine via `useScreen` (skirmish keyed by seed for a clean engine per match). Verified: `tsc -b` + `vite build` clean and the dev server boots and serves the full module graph without error.
- **Phase 8** — the economy comes alive (**end of M2**): `sim/systems/pathfinding.ts` (budgeted A* — octile, 8-dir, no corner-cutting, binary-heap, per-tick request budget + per-tick cache; blocked goals resolve to the nearest passable tile so workers route to a standing spot), `sim/systems/movement.ts` (path following at unit speed + 1-tile-bucket local separation so crowds don't stack), `sim/systems/economy.ts` (the proximity-driven gather state machine toNode → gathering → toDropOff → depositing, accrual with House gather modifier, idle-worker lists), and `sim/systems/rates.ts` (per-player trailing-window `RateTracker` → the HUD's real ▲rate). Wired the IdleBadge cycle-select (next idle worker + camera recenter); `move`/`gather` commands from the Viewport now actually drive units. Verified headlessly (deterministic): commanded gather takes idle `3 → 0`, grain `480 → 650`, measured rate ~300/min, identical across seeded runs — and in-browser, box-selected Pioneers path to a right-clicked target and spread by separation.
- **Phase 9** — build & train (**end of M3**): `sim/systems/construction.ts` (foundations progress while assigned builders are in range — more builders = faster — HP ramps from 10% to full, completion grants pop cap and frees builders) and `sim/systems/production.ts` (queues tick down with House production-speed modifiers, finished units spawn on a free adjacent tile, gated on pop cap + free space, and head for the rally point). UI: a worker's CommandGrid becomes a **build menu** (age-filtered) that enters a placement mode — the Viewport draws a green/red footprint **ghost** and commits the `build` on a valid click; right-clicking with a building selected sets its **rally**; train/queue/`pop` already live in the SelectionPanel/ResourceBar. Verified headlessly (deterministic): a Legion Hall builds to completion (full HP), Spire→Pioneer training spawns 2 units (pop 3→5) that walk to the rally, and obsidians are correctly age-gated at Bondsman (train enabled once ages land in P11); in-browser, the ghost renders, placement charges cost (grain 480→330, ore 75→25), and builders raise the hall.

_Each phase ends green on `npm run typecheck` + `npm run build`._
