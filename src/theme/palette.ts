/**
 * palette.ts — single source of truth for colors & layout constants.
 *
 * Mirrors the Edge Delta foundation tokens and the "Field Console" (`--fc-*`)
 * semantic layer used throughout the design. `tokens.css` re-declares the same
 * values as CSS custom properties; keep the two in sync. Canvas code reads from
 * here (it can't read CSS vars cheaply); DOM/React chrome reads from `--fc-*`.
 */

/** Edge Delta neutral gray ramp (dark → light). */
export const GRAY = {
  g950: '#060606',
  g925: '#0A0A0A',
  g900: '#0C0C0C',
  g850: '#0F0F0F',
  g800: '#1F1F1F',
  g750: '#262626',
  g700: '#3A3A3A',
  g600: '#5A5A5A',
  g500: '#7A7A7A',
  g400: '#9B9B9B',
  g300: '#B4B4B4',
  g200: '#D6D6D6',
  g100: '#E6E6E6',
} as const

/** Edge-green accent ramp. */
export const GREEN = {
  g700: '#00A84B',
  g500: '#00DA63',
  g300: '#3DE889',
  faint: '#00DA6340',
} as const

/** Azure ramp (Edge Delta categorical). */
export const AZURE = {
  a700: '#005490',
  a500: '#0072BE',
  a300: '#3F9BD6',
} as const

/** Scarlet / error ramp. */
export const SCARLET = {
  s700: '#C63A2C',
  s500: '#FE5F4D',
  s300: '#FF8576',
} as const

/** Gold / warn ramp. */
export const GOLD = {
  go700: '#B89700',
  go500: '#F1C900',
  go300: '#F7DC4D',
} as const

/**
 * Field Console semantic layer — the names UI code should reach for.
 * Each maps onto a foundation value above.
 */
export const FC = {
  board: GRAY.g950, // #060606 viewport / page background
  rail: GRAY.g925, // #0A0A0A side rails
  card: GRAY.g900, // #0C0C0C panels / cards
  grid: GRAY.g850, // #0F0F0F grid lines

  border: GRAY.g750, // #262626 default borders
  borderSoft: GRAY.g800, // #1F1F1F softer dividers
  borderActive: GREEN.g500, // #00DA63 active / selected
  borderFaint: GREEN.faint, // #00DA6340 faint green glow

  text: GRAY.g100, // #E6E6E6 primary text
  text2: GRAY.g200, // #D6D6D6
  text3: GRAY.g300, // #B4B4B4
  textDim: GRAY.g500, // #7A7A7A
  textDimmer: GRAY.g600, // #5A5A5A
  textFaint: GRAY.g700, // #3A3A3A

  accent: GREEN.g500, // #00DA63 Edge-green
  warn: GOLD.go500, // #F1C900
  error: SCARLET.s500, // #FE5F4D
} as const

/** Resource icon colors. */
export const RESOURCE = {
  grain: '#00DA63', // leaf
  helium3: '#FF9554', // shard
  gold: '#F1C900', // coin
  ore: '#9B9B9B', // gem
} as const

/**
 * Player colors (up to 8). Index 0 is always the human (Edge-green).
 * Drawn from the Edge Delta categorical / avatar palette.
 */
export const PLAYER_COLORS = [
  '#00DA63', // 0 you — green
  '#0072BE', // 1 azure
  '#FF5091', // 2 rose
  '#F1C900', // 3 gold
  '#FF9554', // 4 orange
  '#9F4FFF', // 5 violet
  '#00B3B2', // 6 cyan
  '#FE5F4D', // 7 scarlet
] as const

/** Font stacks. */
export const FONT = {
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  sans: "'Inter', system-ui, -apple-system, sans-serif",
} as const

/** Layout / sizing constants (pixels). */
export const TILE = 26 // viewport grid cell
export const GRID_MENU = 23 // menu-screen grid cell
export const GRID_MINIMAP = 14 // minimap grid cell
export const UNIT_PX = 9 // unit square edge
export const BUILDING_PX = 50 // building cell edge
export const SELECT_INSET = 11 // selection L-bracket inset

/** Border radii. */
export const RADII = { sm: 4, md: 6, lg: 8, xl: 12 } as const
