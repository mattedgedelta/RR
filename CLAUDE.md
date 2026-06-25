# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Red Rising: Iron Rain** — a browser RTS (Age-of-Empires style) reskinned as the Edge Delta observability "Field Console." 1 human + 1–7 CPU players, FFA or teams. React 18 + Vite + TypeScript; Canvas 2D for the map/minimap, React for HUD/menu chrome. Runtime deps are `react`/`react-dom` only. The game is feature-complete; current work is playtest-feedback passes.

## Commands

```bash
npm run dev        # vite dev server on http://localhost:5173
npm run typecheck  # tsc -b (project references) — the primary gate
npm run build      # tsc -b && vite build — must stay green
```

There is **no test runner and no linter**. Correctness is gated by `typecheck`/`build` plus headless and in-browser sim verification (below). TS is strict, with `noUnusedLocals`/`noUnusedParameters` — unused symbols fail the build. Import via the `@/*` → `src/*` alias.

## Architecture — the three rules that shape everything

1. **Deterministic headless sim.** The simulation is a fixed 10 Hz integer tick (`TICK_HZ` in `world.ts`) seeded by `mulberry32` (`sim/rng.ts`). Same seed → byte-identical run. **Never use `Date.now()` or `Math.random()` inside the sim** — all randomness goes through `world.rng`, all timing through whole ticks. Wall-clock time lives only in `loop.ts` (the rAF accumulator), outside the sim.

2. **Sim ↔ render/UI split via a read-only Snapshot.** The mutable `World` (`sim/world.ts`) is the single state container. `sim/snapshot.ts` projects it to an immutable `Snapshot`. The Canvas renderer (`render/`) and React HUD **only ever read the Snapshot** — never the World. `GameLoop` (`loop.ts`) publishes a fresh Snapshot each tick into `game/store.ts`, an external store. Widgets subscribe through `useGameValue(selector)` (memoised, equality-checked, tearing-safe) and re-render only when their slice changes; per-frame values (clock, bars) use `useRafText`/`useRafWidth` to write the DOM imperatively with zero re-renders.

3. **Commands are the only mutation channel.** Both the human UI and the CPU AI mutate the World exclusively by enqueueing a `Command` (`sim/commands.ts`). UI dispatches via `store.ts`'s `dispatch(cmd)` → the active world's queue. Commands are drained and applied at the top of each tick (`applyCommands`), where cost-charging, validation, and pop/age gating happen. Don't mutate entities directly from UI or render code.

### Tick pipeline (`sim/tick.ts`)

Every tick runs systems in this fixed order (determinism depends on the order):
`applyCommands → ai → pathfinding → movement → economy → construction → production → combat → castes → ages → win → cleanup`

Each system is `sim/systems/<name>.ts` with a `run<Name>(world)` signature. `cleanup` removes dead entities/depleted nodes and reconciles `pop`/`popCap`.

### Data-driven design

Typed records in `src/game/data/` (`units`, `buildings`, `houses`, `ages`, `tech`, `resources`, `players`) drive the whole game — balance, gating, costs, House modifiers. Editing a data table changes the sim, the Codex screen, and the tech tree at once.

## Two interacting economies — don't conflate them

- **Command capacity** (`pop` / `popCap` on `Player`, labeled "command" in the UI): a hard train gate. Capacity comes from buildings (`popProvided`) + age bonuses + Golds (`commandProvided`). Cost is each unit's `pop`. Spawn/death adjust both.
- **Grain upkeep / starvation** (`sim/systems/castes.ts`): an independent ongoing drain. A starving player's *army* attrits HP (Reds spared) until upkeep drops to what grain supports. In practice food binds before command.

The six **Colors** + Howler (`data/units.ts`) carry capability flags (`canGather/canBuild/canFight/canHeal`) that role-lock behavior. See `docs/CONTEXT.md` for the full Color/role/cost table.

## Verification workflow (per change)

1. Gate green: `npm run typecheck` + `npm run build`.
2. **Headless sim test** (deterministic): bundle a `.mjs` harness with esbuild and run in node:
   ```bash
   node_modules/.bin/esbuild <test>.mjs --bundle --format=esm --platform=node "--alias:@=$PWD/src" --outfile=out.mjs && node out.mjs
   ```
   Note `spawnUnit(world, kind, owner, x, y)` arg order. Valid houses: mars/diana/minerva/mercury/pluto/neptune/vulcan/jupiter/apollo/juno/ceres/saturn.
3. **In-browser** (when UI/render is touched): `playwright-core` in scratchpad, `chromium.launch({ channel: 'chrome', headless: true })` (system Chrome). `timeout` isn't a macOS builtin — poll with curl. Favicon 404 is harmless.

## Standing rules

- Keep the **README.md "Build progress" section** current with every commit.
- Keep a detailed, ordered **`plan.md`** in the repo.
- **Keep the Codex screen in sync** whenever units/buildings/houses/tech change. Data edits auto-surface there, but verify ordering and lists (`src/ui/screens/CodexScreen.tsx`).

## Where things live

- `src/game/data/` — the data tables (source of truth for balance/gating).
- `src/game/sim/` — `world.ts`, `tick.ts`, `commands.ts`, `snapshot.ts`, `entities.ts`, `map.ts`, `rng.ts`, and `systems/`.
- `src/game/{loop.ts,store.ts}` — the fixed-timestep loop and the React boundary.
- `src/render/` — imperative Canvas: `MapRenderer`, `Camera`, `HitTest`, `Minimap`, and z-ordered `layers/`.
- `src/ui/` — `screens/` (menu→setup→skirmish→result state machine in `App.tsx`), `hud/` (widgets + `connect.ts` snapshot→view-model projections), `techtree/`, `common/`, `hooks/`.
- `docs/CONTEXT.md` — fuller architecture/balance notes and known open issues.
