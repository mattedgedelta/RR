# Red Rising: Iron Rain — Context Export

_Snapshot taken 2026-06-24. Repo: `mattedgedelta/RR`, branch `main` (clean), latest merge `#21 colors-phase-e`._

## What this is
A browser RTS — **Red Rising: Iron Rain** — skinned as the Edge Delta observability **"Field Console."**
React 18 + Vite + TypeScript, Canvas 2D renderer. Single-player skirmish vs. CPU houses.

## Tech & architecture
- **Data-driven sim**: typed records in `src/game/data/` (units, buildings, houses, tech, ages, resources, players) drive everything.
- **Headless seeded sim**: fixed 10 Hz tick, `mulberry32` RNG, **no `Date.now`/`Math.random` in sim** → fully deterministic (same seed → identical run).
- **Sim ↔ render split**: imperative Canvas renderer reads a read-only `Snapshot` projected from the mutable `World` (`snapshot.ts`); React/HUD also read only the snapshot via an external store (`useSyncExternalStore`).
- **Tick pipeline** (`tick.ts`): applyCommands → ai → pathfinding → movement → economy → construction → production → combat → **castes** → ages → win → cleanup.

## Progress
**Base game (Phases 0–11): ✅ complete** — scaffold, theme, data layer, sim core, loop/store/React boundary, rendering, HUD chrome, screens/flow, economy, build & train, combat/AI/win-lose, ages/tech/houses/polish.

**Colors caste-labor economy (Phases A–E): ✅ complete** — the major recent feature.
- **A — Roster & role-locks**: six Colors + Howler; capability flags `canGather/canBuild/canFight/canHeal` enforced; `pioneer → red`; building→Color map; distinct on-map silhouettes; Codex.
- **B — Caste economy**: command capacity (Golds raise the cap), grain upkeep + starvation, Yellow healing, per-Color snapshot tally. New `systems/castes.ts`.
- **C — Caste dashboard (HUD)**: `// caste` panel — command bar, food balance, Color tally, COMMAND CAPPED / STARVING flags. `casteView` projector.
- **D — AI & balance**: CPU advances ages (closed the long-standing gap), builds the pyramid, balanced grain-heavy economy, food-gated diverse army, no starvation death spiral. Upkeep retuned down.
- **E — Flavor & polish**: per-Color lore blurbs in Codex, caste-pyramid intro copy, dashboard hint tooltips.

## The six Colors (+ Howler) — `src/game/data/units.ts`
| Color | Role | Caste capability | Cmd cost | Upkeep (grain/min) | Made by | Age |
|---|---|---|---|---|---|---|
| red | worker | gather + build (the economy) | 1 | 2 | spire | bondsman |
| gray | infantry | fight | 1 | 4 | legionHall | initiate |
| obsidian | cavalry | fight (heavy) | 2 | 6 | legionHall | initiate |
| gold | command | fight + **provides +10 command** | 0 | 12 | spire | peerless |
| yellow | medicus | **heal** (no fight) | 1 | 5 | institute | peerless |
| blue | scout | fast, long LOS (no fight) | 1 | 3 | spire | initiate |
| howler | cavalry | fight (Mars unique) | 2 | 5 | kennel | peerless |

## Population = command-capacity system
Two per-player numbers (`world.ts`): `pop` (command used) / `popCap` (capacity). Labeled **"command"** in UI; field still named `pop`.
- **Capacity** = buildings (`popProvided`: Spire +15, Granary +10, Olympus +20) + age bonuses (Initiate +20, Peerless +25, Sovereign +30) + Golds (`commandProvided` +10 each).
- **Cost** = unit `pop` (above). Train gate (`commands.ts`): `pop + pendingPop + cost > popCap` → blocked.
- Spawn/death adjust both `pop` and (for Golds) `popCap`.
- **Separate from food**: grain upkeep (`castes.ts`) is an independent ongoing drain. A starving player's **army** attrits HP (Reds spared) until upkeep drops to what grain supports. In practice **food binds before command** (~30 command of army before grain runs dry vs. a ~70 cap).

## Key files
- `src/game/data/{units,buildings,houses,ages,tech,resources,players}.ts` — the data tables.
- `src/game/sim/world.ts` — World/Player state, `createWorld`, `TICK_HZ`.
- `src/game/sim/tick.ts` — the pipeline + `cleanup`.
- `src/game/sim/commands.ts` — command queue + all command handlers (train/build/gather/advanceAge/…).
- `src/game/sim/systems/{economy,construction,production,combat,castes,ages,win,ai,movement,pathfinding}.ts`
- `src/game/sim/systems/castes.ts` — upkeep + starvation + Yellow healing.
- `src/game/sim/systems/ai.ts` — the CPU controller (age advance, pyramid build order, balanced gathering, food-gated army).
- `src/game/sim/snapshot.ts` — World → Snapshot projection.
- `src/ui/hud/{CastePanel,ResourceBar,connect,…}.tsx` — HUD; `connect.ts` projects snapshot → view-models.
- `src/ui/screens/{Skirmish,Codex,Menu,…}Screen.tsx`
- `README.md` — kept current with a per-phase progress section.

## Verification workflow (per phase)
1. Sync `main`, create feature branch.
2. Implement; gate green on `npm run typecheck` (tsc -b) + `npm run build`.
3. **Headless**: `node_modules/.bin/esbuild <test>.mjs --bundle --format=esm --platform=node "--alias:@=$PWD/src" --outfile=out.mjs && node out.mjs`. (Note `spawnUnit(world, kind, owner, x, y)` arg order; valid houses are mars/diana/minerva/mercury/pluto/neptune/vulcan/jupiter/apollo/juno/ceres/saturn.)
4. **In-browser**: `playwright-core` in scratchpad, `chromium.launch({ channel: 'chrome', headless: true })` (system Chrome). `timeout` isn't a macOS builtin — poll with curl. Favicon 404 is harmless.
5. Update README; present report. User commits/merges, then says continue.

## Standing rules (in memory)
- Keep the README progress section current with every commit.
- Keep a detailed, ordered `plan.md` in the repo.
- **Keep the Codex in sync** whenever units/buildings/houses/tech change (it's data-driven, so data edits auto-surface — but verify ordering/lists).

## Open / possible next
- Colors arc is fully shipped; awaiting **playtest feedback**.
- Known balance note: **two evenly-matched hard AIs stalemate** (~30 min, no resolution) — a defensive equilibrium worth tuning if 1v1 length matters. A hard CPU beats a passive opponent in ~8 min.
- Mid-game **gather throughput decays** (nearby nodes deplete → long travel) — affects both players; not yet addressed.
- The other 11 Houses carry display name + specialty but mostly **neutral/stub modifiers** (only Mars is fully fleshed: Howler + Iron Rain). Filling these in is open.
- Golds rarely get trained by the AI because food caps the army below the command cap — emergent, currently fine.
