# Red Rising: Iron Rain — Implementation Plan

A **fully playable** browser **RTS game** — **1 human + 1–7 CPU players** (up to 8), free-for-all or teams — reimagining an Age-of-Empires-style game as the **Edge Delta observability console**, built from the Claude Design project *"Modern Age of Empires.dc.html"*.

- **Stack:** React 18 + Vite + TypeScript. Canvas 2D for the map/minimap; React for chrome.
- **Visual treatment:** **Field Console only** (terminal/tactical — near-black `#060606` + grid, JetBrains Mono, Edge-green `#00DA63` accents, `lowercase_snake` labels), strictly on Edge Delta design tokens.
- **Runtime dependencies:** `react`, `react-dom` only. No router, no UI/CSS/state/icon libraries (Lucide icons hand-inlined).
- **Players:** 1 human + **1–7 CPU** = up to **8 players**, free-for-all or teams; **last team standing wins**.
- **Goal:** launch (`npm run dev`) → configure a skirmish (your House + opponent count/Houses/difficulty, FFA or teams, map size) → play a full match (gather → build → train → expand → fight) until one player/team remains, faithful to the design.

---

## 1. Architecture

Headless simulation engine ticks on a fixed timestep **outside React**. Canvas renders the world imperatively. React renders only HUD/menu/tech and reads sim state through a tiny external store. **Commands are the single mutation channel** — the UI and the AI both dispatch the same typed commands.

```
sim (fixed 10Hz, seeded RNG) --publish snapshot--> store --selectors--> React HUD (DOM)
                                              \--getSnapshot()--> Canvas rAF (~60Hz) viewport+minimap
UI / AI ----dispatch(command)----> world.commandQueue --drained each tick--> sim
```

### Decisions & rationale
- **Sim/render decoupling** — fixed timestep `TICK_MS=100` (10 Hz) via rAF accumulator with `MAX_STEPS_PER_FRAME` spiral guard; render at display refresh and interpolate with `alpha`. Avoids jank and tab-backgrounded death spirals.
- **Entity model** — typed discriminated-union records (`Unit | Building | ResourceNode`) in `Map<EntityId,T>` pools, **not** a full ECS (overkill for ~3 unit + ~9 building types). Plain serializable structs; logic in pure `system(state, dt)` functions. Every entity carries `owner: PlayerId` (`0..7`, 0 = human).
- **Determinism** — seeded PRNG (`mulberry32`) only (never `Math.random`/`Date.now` inside sim), integer tick clock, stable id-ordered iteration. Reproducible bugs, replay-friendly.
- **React boundary** — hand-rolled external store + `useSyncExternalStore` per-widget selectors (tearing-safe, zero deps). A `useRafText` hook writes `textContent`/`style.width` on a ref for values that change every tick (resources, clock, FOG, HP/queue bars) so React never reconciles ticking numbers → **no per-frame re-render storm** (the #1 browser-RTS+React pitfall).
- **Canvas 2D (not DOM/SVG) for the viewport** — many moving markers + pan/zoom/fog → one element, one clear+redraw, cheap math hit-testing.
- **Pathfinding** — A* (octile, 8-dir) on the 26×26 grid (sub-ms) for terrain/buildings + lightweight local **separation** for unit crowding; per-tick path-request budget + path cache.
- **Screens** — `useState` state machine `menu → skirmish-setup → skirmish → result`; no react-router (4 screens, no deep-linking; skirmish couples an imperative canvas + loop to mount/unmount).

### Players, teams & match setup
- **Up to 8 players**: `players[0]` = human, `players[1..7]` = CPU. A `MatchConfig` (chosen in the setup screen) defines player count (2–8), each player's **House**, **team** (FFA = every player its own team), **difficulty** (easy/normal/hard), **color**, and **map size**.
- **`createWorld(seed, matchConfig)`** seeds one starting base (Spire + Pioneers + nearby resources) per player at **balanced radial start positions**, sized to the player count.
- **Per-player state** (in `world.players[]`): `house`, `team`, `color`, `difficulty`, `resources`, `pop/popCap`, `idleUnitIds`, `defeated`, AI controller handle. Resources/selection/alerts/fog in the HUD always read **player 0**.
- **AI** runs **one controller per CPU player**, all dispatching through the same command queue (no cheating beyond difficulty tuning). Controllers use a **staggered think cadence** (each thinks every K ticks at a per-player offset) so 7 opponents don't spike a single frame. Allies are never targeted.
- **Diplomacy**: teams define alliances; combat target acquisition and win checks are team-aware. Shared vision within a team (optional polish).
- **Player colors**: the design only specifies you=green / enemy=red, so we extend to **8 on-brand colors** from the Edge Delta categorical/avatar tokens (player 0 always Edge-green `#00DA63`; others azure `#0072BE`, rose `#FF5091`, gold `#F1C900`, orange `#FF9554`, violet `#9F4FFF`, cyan `#00B3B2`, scarlet `#FE5F4D`). Units/buildings/minimap dots render in the owner's color.

---

## 2. Confirmed design values (the build contract)

| Domain | Values (from design frames) |
|---|---|
| Map | `GRID 26·26`, `SCALE 1:240`, `FOG 18%`. Grid lines `#0F0F0F`: 26px viewport, 23px menu, 14px minimap. |
| Resources (+rate/min) | grain `480 ▲12` (leaf, `#00DA63`) · helium-3 `325 ▲8` (shard, `#FF9554`) · gold `140 0` (coin, `#F1C900`) · ore `75 ▲4` (gem, `#9B9B9B`) |
| Pop / idle / clock | `64/75` · `2 IDLE` (gold) · `42:18` |
| Ages | Bondsman → Initiate → Peerless → Sovereign. Bar: `INITIATE` + 4 segments (2 filled). Advance: `[R] ADVANCE_PEERLESS — 800 grain · 200 helium-3`. |
| Selection (Spire) | HP `2100/2400` (84%) · `ARMOR 8/7` · `GARRISON 3/15` · `LOS 8` · `PRODUCING pioneer` (46%) · `QUEUE 3 · 12s` · badge `MARS` |
| Command grid | 4×2, hotkeys `Q/W/E/R`; **R = advance age** (green primary) |
| Houses (12) | Mars=Cavalry (default), Diana=Archers, Minerva=Defense, Mercury=Cav-archers, Pluto/Neptune/Vulcan=Infantry, Jupiter=Defense, +4 stubs. Mars: Obsidians +20% HP, Reds +25% gather, Citadels −25% cost; uniques Howler, Iron Rain (Kennels +40%). |
| Tech DAG | Bondsman: Spire/Legion Hall/Granary · Initiate: Exchange/Forge/Kennel (available) · Peerless: Citadel/Institute/Howler (locked) · Sovereign: Olympus/Olympic Knight/Iron Rain (locked). States: built / available (green) / locked (dashed dim) / unique (gold ★). |
| Players & colors | 1 human + 1–7 CPU (up to 8); FFA or teams; **last team standing** wins. Design specifies you=green `#00DA63` / enemy=red `#FE5F4D` — extend to 8 on-brand colors from ED categorical/avatar tokens (azure `#0072BE`, rose `#FF5091`, gold `#F1C900`, orange `#FF9554`, violet `#9F4FFF`, cyan `#00B3B2`). |
| Palette | board `#060606`, rails `#0A0A0A`, cards `#0C0C0C`; borders `#262626`/`#1F1F1F`/active `#00DA63`/faint `#00DA6340`; text `#E6E6E6 #D6D6D6 #B4B4B4 #7A7A7A #5A5A5A #3A3A3A`; accent `#00DA63`; warn `#F1C900`; error `#FE5F4D`. JetBrains Mono throughout. Primary button = green fill on `#060606`. |

*Content fix:* the Field Console civ-list active row literally reads `franks` (AoE template leftover) — use Red Rising names (`house_mars`, …) consistently.

---

## 3. Target file tree (all new)

```
index.html  package.json  vite.config.ts  tsconfig.json  tsconfig.node.json  .gitignore
src/
  main.tsx  App.tsx
  theme/    palette.ts  tokens.css  global.css  icons.tsx
  game/
    sim/      world.ts  tick.ts  map.ts  entities.ts  commands.ts  rng.ts  snapshot.ts
      systems/ movement.ts pathfinding.ts economy.ts production.ts construction.ts combat.ts ai.ts ages.ts win.ts
    data/     houses.ts  ages.ts  units.ts  buildings.ts  tech.ts  players.ts
    loop.ts   store.ts
  render/   Camera.ts  MapRenderer.ts  HitTest.ts  Minimap.ts
    layers/ grid.ts terrain.ts resources.ts buildings.ts units.ts selection.ts health.ts fog.ts pings.ts
  ui/
    screens/ MenuScreen.tsx SkirmishSetupScreen.tsx SkirmishScreen.tsx ResultScreen.tsx
    hud/     ResourceBar.tsx ResourceStat.tsx AgeProgress.tsx IdleBadge.tsx Clock.tsx
             SelectionPanel.tsx StatCell.tsx ProductionBar.tsx CommandGrid.tsx CommandButton.tsx
             MinimapPanel.tsx AlertToast.tsx ViewportOverlay.tsx Viewport.tsx
    techtree/ TechTree.tsx AgeSpine.tsx TechColumn.tsx TechNodeCard.tsx Connectors.tsx
    common/  Panel.tsx SectionLabel.tsx Button.tsx Bar.tsx Badge.tsx NavItem.tsx StatTile.tsx
    hooks/   useGameValue.ts useRafText.ts useHotkeys.ts useScreen.ts
```

---

## 4. Execution order (step-by-step)

Build strictly top-to-bottom. Each **Phase** ends with a runnable/typechecked checkpoint. UI is built against `game/data` + `game/sim/snapshot` fixtures so chrome can be verified before the full engine lands. Phases map to milestones M0–M6 (noted per phase).

### Phase 0 — Project setup  *(M0)*
1. `npm create vite@latest . -- --template react-ts` in the repo root (keep existing `README.md`); remove Vite boilerplate (`App.css`, demo `App.tsx` body, logos).
2. Configure `vite.config.ts` (`@ -> /src` alias, `base: './'`, `build.target: 'es2020'`), `tsconfig.json` (strict, paths), `.gitignore` (`node_modules`, `dist`).
3. `package.json` scripts: `dev`, `build` (`tsc -b && vite build`), `preview`, `typecheck` (`tsc --noEmit`).
4. `index.html`: copy the `<link rel="preconnect">` ×2 + Google Fonts link (Inter + JetBrains Mono) from the design head verbatim; `<meta name="color-scheme" content="dark">`; body bg `#060606`; single `#root`.
5. `npm install`.
- **Checkpoint:** `npm run dev` serves a blank dark page; `npm run typecheck` clean.

### Phase 1 — Theme foundation  *(M0)*
6. `theme/palette.ts` — **source of truth**: typed hex constants (ED gray ramp + Field Console `--fc-*` values + resource colors) and layout consts `TILE=26`, `UNIT_PX=9`, `BUILDING_PX=50`, `SELECT_INSET=11`.
7. `theme/tokens.css` — `:root` CSS custom properties: full Edge Delta foundation (gray/azure/scarlet/gold/green ramps, radii 4/6/8/12, spacing 4–32, font stacks) + the `--fc-*` semantic layer mirroring `palette.ts`.
8. `theme/global.css` — resets (`*{box-sizing}`, `html,body{margin:0}`), body bg + JetBrains Mono base, `@keyframes edpulse`, thin dark scrollbar, `.fc-grid-23/26/14` background utilities.
9. `theme/icons.tsx` — the ~16 Lucide paths used in the design, exported as React `<Icon name>` components **and** raw path strings (for Canvas `Path2D`). Import `tokens.css`/`global.css` in `main.tsx`.
- **Checkpoint:** a scratch swatch render shows correct fonts/colors.

### Phase 2 — Data layer  *(M0, drives everything)*
10. `game/data/`: `ages.ts` (4 ages + advance cost/time — Initiate→Peerless = 800 grain/200 helium-3), `units.ts` (pioneer/obsidian/howler base stats: hp, speed, armor 8/7-style, attack, range, LOS, cost, buildTime), `buildings.ts` (9 building types: hp, footprint, armor, LOS, drop-off resources, producible units, garrison cap), `tech.ts` (TechNode DAG with `age`, `prereqs`, `cost`, `kind`), `houses.ts` (12 HouseDef rows; Mars bonuses fully filled, others stubbed), `players.ts` (8 player colors from ED categorical/avatar palette — player 0 = green `#00DA63`; AI difficulty tiers easy/normal/hard).

### Phase 3 — Simulation core  *(M0)*
11. `sim/rng.ts` — `mulberry32(seed)`.
12. `sim/map.ts` — `GameMap` (`Tile[]`) whose size **scales with player count** (≈26×26 for 1v1 up to ≈72×72 for 8); terrain gen, resource-node placement, **N balanced radial start positions** (one base per player, each with nearby resources), occupancy + `tileIndex(x,y)` helpers, `passable` derivation. HUD overlay shows the actual grid size.
13. `sim/entities.ts` — `Entity`/`Unit`/`Building`/`ResourceNode` types + factories (`spawnUnit`, `placeBuilding`, `createResourceNode`); `GatherState`, `ProductionQueue`, `ConstructionState`.
14. `sim/world.ts` — `World` (entity pools, `players[]`, command queue, events, rng, tick, outcome) + `Player` (house/team/color/difficulty/resources/pop/defeated/ai); `createWorld(seed, matchConfig)` seeds **2–8 players** (1 human + 1–7 CPU) each with a Spire + Pioneers + resources at a balanced start.
15. `sim/commands.ts` — `Command` union + `dispatch(world, cmd)` (enqueue) + `applyCommands(world)` (drain → set intents).
16. `sim/snapshot.ts` — `World → Snapshot` projection (only HUD-relevant scalars/views + entity render list).
17. `sim/tick.ts` — orchestrator calling systems in order (stub the systems initially): `tick++` → `applyCommands` → `ai` → `pathfinding` → `movement` → `economy` → `construction` → `production` → `combat` → `ages` → `win` → `cleanup`.
- **Checkpoint:** unit-call `tick()` N times in a scratch test; world advances without throwing.

### Phase 4 — Loop, store, React boundary  *(M0)*
18. `game/loop.ts` — `GameLoop` (rAF accumulator, `setSpeed`/pause, publishes snapshot + `alpha` each frame).
19. `game/store.ts` — external store (`subscribe`/`getSnapshot`/`publish`) + `useGameValue(selector, eq)` (via `useSyncExternalStore`) + `dispatch` re-export.
20. `ui/hooks/`: `useRafText` (ref + rAF writes textContent/width), `useGameValue`, `useScreen`, `useHotkeys`.
- **Checkpoint:** mount a debug component showing live `clock` from the store; pause/speed verified. **End of M0.**

### Phase 5 — Rendering  *(M1)*
21. `render/Camera.ts` — `{x,y,zoom}`, `worldToScreen`/`screenToWorld`, pan (edge-scroll/drag/keys), zoom (`+/-`/wheel toward cursor), clamp to map; devicePixelRatio handling.
22. `render/layers/*` — pure draw fns: `grid` (26px `#0F0F0F`), `terrain` (region tints), `resources` (dim Path2D icons), `buildings` (50px cells + border in the **owner's player color** + icon), `units` (9px squares in the **owner's player color**; you = green `#00DA63`, allies tinted, enemies from the categorical palette), `selection` (ring + L-bracket + drag rect), `health` bars, `fog` (deferred mask), `pings`.
23. `render/MapRenderer.ts` — own rAF loop: read `getSnapshot()`, clear, apply camera transform, call layers in order, interpolate via `alpha`.
24. `render/HitTest.ts` — screen→world click pick (nearest within radius), drag-select AABB → unit id list; spatial hash from snapshot.
25. `ui/hud/Viewport.tsx` — host `<canvas>`, size to container/DPR, start/stop `MapRenderer`, wire pointer events → `commands` (select/move/attack/gather/build/setRally) + camera.
- **Checkpoint:** fixtures render a Spire + nodes + Pioneers on the grid; click-select highlights; pan/zoom work.

### Phase 6 — HUD chrome (Field Console)  *(M1)*
26. `ui/common/*` primitives (`Panel`, `SectionLabel`, `Button`, `Bar`, `Badge`, `NavItem`, `StatTile`) bound to `--fc-*` tokens.
27. `ui/hud/` widgets, each with its own selector: `ResourceBar`+`ResourceStat`, `AgeProgress`, `IdleBadge`, `Clock` (useRafText), `SelectionPanel`+`StatCell`+`ProductionBar`, `CommandGrid`+`CommandButton`, `MinimapPanel` (hosts `Minimap` canvas), `AlertToast`, `ViewportOverlay` (GRID/SCALE/FOG).
28. `render/Minimap.ts` — small canvas: regions, entity dots, viewport rect, click-to-pan.
- **Checkpoint:** HUD is pixel-faithful to the HUD frame against fixtures (resources, selection panel, command grid, minimap, toast).

### Phase 7 — Screens & flow  *(M1)*
29. `ui/screens/MenuScreen.tsx` — left rail (wordmark, `// MENU` nav with hotkeys, profile chip), main (hero, single_player/multiplayer cards, `// CONTINUE` resume bar + `RESUME ↵`), right rail (`// NETWORK`, `// RECORD`, patch footer). 23px grid bg.
30. `ui/screens/SkirmishScreen.tsx` — compose `ResourceBar` / `Viewport`+overlays / bottom bar (`MinimapPanel | SelectionPanel | CommandGrid`); owns engine `GameLoop` lifecycle (start/stop in effect keyed on `houseId`).
31. `ui/screens/ResultScreen.tsx` — win/lose summary + back to menu.
32. `App.tsx` + `useScreen` — state machine `menu → skirmish-setup → skirmish → result`; wire transitions (single_player/RESUME → skirmish-setup; DEPLOY with the assembled `MatchConfig` → skirmish; outcome → result). Setup screen is **stubbed in M1** (defaults to 1 human + 1 CPU) and fully built in M5. **End of M1.**

### Phase 8 — Economy  *(M2)*
33. `sim/systems/pathfinding.ts` — A* octile + per-tick request budget + path cache.
34. `sim/systems/movement.ts` — path following + local separation.
35. `sim/systems/economy.ts` — Pioneer gather state machine (toNode→gathering→toDropOff→depositing), resource accrual, `RateTracker` (trailing-window per-minute), idle detection, pop count.
36. Wire commands: click-to-move, right-click resource → gather; `IdleBadge` cycle-select.
- **Checkpoint:** resources climb with correct `▲rate`; `N IDLE` updates; workers path around buildings. **End of M2.**

### Phase 9 — Build & train  *(M3)*
37. `sim/systems/construction.ts` — placement validity, progress, HP ramp, becomes functional/drop-off when complete.
38. `sim/systems/production.ts` — train queues, spawn at edge, rally points, pop-cap gating.
39. UI: build-placement ghost (valid/invalid) from `CommandGrid`; train buttons; rally via right-click; `QUEUE 3 · 12s` + `64/75` live; Q/W/E hotkeys.
- **Checkpoint:** place Legion Hall, train Obsidians, set rally. **End of M3.**

### Phase 10 — Combat, AI, win/lose  *(M4 — MVP playable loop)*
40. `sim/systems/combat.ts` — target acquisition within LOS (**only non-allied players** are valid targets), attack cooldown, `damage=max(1,atk-armor)`, death/cleanup, building destruction, `underAttack` event (quadrant from map center).
41. `sim/systems/ai.ts` — **one controller per CPU player (1–7)**: keep workers gathering, timed/age-gated build order, raid groups via `attackMove` (all via the same command queue). **Staggered think cadence** (each AI thinks every K ticks at a per-player offset) bounds CPU across many opponents; **difficulty tiers** scale economy/aggression; respects team alliances (won't attack allies).
42. `sim/systems/win.ts` — a player is **eliminated** when its Spire/last production building falls (`player.defeated = true`). Match ends when **one team remains** (FFA = one player): human eliminated → defeat; human's team last standing → victory. → `world.outcome`; loop pauses.
43. UI: `AlertToast` `! UNDER_ATTACK` + map ping; transition to `ResultScreen`.
- **Checkpoint:** a full match can be **won and lost** vs. the AI. **End of M4.**

### Phase 11 — Ages, tech, houses, polish  *(M5 + M6)*
44. `sim/systems/ages.ts` — `[R]` advance age (cost/timer), unlock next tech column, raise pop cap / stat bumps.
45. `ui/techtree/*` — `SkirmishSetupScreen` 3-column layout: house list (12) + `HouseDetail` (bonuses/unique) + `TechTree` (`AgeSpine`, `TechColumn`, `TechNodeCard` with built/available/locked/unique states, `Connectors` SVG prereq lines via refs + `ResizeObserver`). Plus a **match-config panel** (right rail / footer): opponent count **1–7**, each opponent's House + difficulty, **FFA vs teams** toggle (with team assignment), and map size. **DEPLOY** assembles a `MatchConfig` and starts the match.
46. `game/sim/modifiers` — apply House Mars bonuses at computation sites (gather ×1.25, obsidian HP ×1.20, citadel cost ×0.75, kennel production ×1.40); add Howler unique.
47. Polish: minimap viewport rect + click-to-pan, render interpolation via `alpha`, optional fog mask (`FOG %`), `prefers-reduced-motion`, control groups (`Ctrl+1..9`), `Esc` clears selection.
- **Checkpoint:** advancing age unlocks columns live; picking Mars measurably changes the sim; tech screen matches design. **End of M5/M6.**

---

## 5. Verification

- **Static:** `npm run typecheck` and `npm run build` clean.
- **End-to-end (`npm run dev`):** Menu → Skirmish setup (pick Mars; add **3 CPU opponents, FFA**; see bonuses + tech DAG) → Skirmish → select Spire, train Pioneer, gather (grain `▲rate` rises), build Legion Hall, train Obsidians, fight the AIs (`UNDER_ATTACK` fires) until one team remains → Result. Repeat with **7 CPUs in teams** to validate scaling + alliances.
- **Fidelity:** spot-check each Field Console screen vs. the design frames (palette, JetBrains Mono, grid sizes, paddings, badges); optionally drive with the `/run` or `/verify` skill (screenshot + compare).
- **Performance:** React DevTools "highlight updates" shows ticking numbers do **not** re-render their component trees; frame time stable with 50+ units.

## 6. Top risks & mitigations
1. **React re-render storms** → external store selectors + `useRafText` + imperative canvas (never `setState` per frame).
2. **Sim/render coupling jank** → fixed timestep + `alpha` interpolation.
3. **Spiral of death** (backgrounded tab) → `MAX_STEPS_PER_FRAME` + drop backlog; optional pause on `document.hidden`.
4. **Pathfinding spikes** → per-tick budget + cache; separation (not A*) for unit crowding.
5. **Non-determinism leaks** → seeded RNG only, integer tick clock, id-ordered iteration.
6. **Scope creep (12 houses / 4 ages / navy)** → everything data-driven in `game/data`; MVP ships Mars + 3 unit types + shown buildings; rest are table rows. Water/navy deferred.
7. **Scaling to 8 players (up to ~600 units)** → spatial hash for proximity queries, budgeted + cached pathfinding, separation (not A*) for crowding, **staggered AI thinking** across players, per-player fog at low cadence; pop cap (≤75/player) bounds totals. Profile from M4 onward; if needed, lower sim Hz or cap concurrent path requests.
```
