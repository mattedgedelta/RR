/**
 * icons.tsx — the Lucide glyphs used across the design.
 *
 * Each icon is stored as an array of SVG path `d` strings (lines/circles are
 * pre-converted to path commands) so the same data drives both the React
 * `<Icon>` component and Canvas `new Path2D(d)` rendering on a 24×24 viewBox.
 */
import type { SVGProps } from 'react'

export type IconName =
  | 'leaf'
  | 'gem'
  | 'coins'
  | 'zap'
  | 'users'
  | 'clock'
  | 'swords'
  | 'hammer'
  | 'home'
  | 'shield'
  | 'crosshair'
  | 'chevronRight'
  | 'x'
  | 'play'
  | 'pause'
  | 'alertTriangle'

/** Raw path data per icon (24×24 viewBox). Consumed by Canvas via Path2D. */
export const ICON_PATHS: Record<IconName, string[]> = {
  leaf: [
    'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z',
    'M2 21c0-3 1.85-5.36 5.08-6',
  ],
  gem: [
    'M6 3h12l4 6-10 13L2 9Z',
    'm12 22 4-13-3-6',
    'M12 22 8 9l3-6',
    'M2 9h20',
  ],
  coins: [
    'M2 8a6 6 0 1 0 12 0a6 6 0 1 0 -12 0',
    'M18.09 10.37A6 6 0 1 1 10.34 18',
    'M7 6h1v4',
    'm16.71 13.88.7.71-2.82 2.82',
  ],
  zap: [
    'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
  ],
  users: [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
    'M22 21v-2a4 4 0 0 0-3-3.87',
    'M16 3.13a4 4 0 0 1 0 7.75',
  ],
  clock: ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0', 'M12 6v6l4 2'],
  swords: [
    'M14.5 17.5 3 6 3 3 6 3 17.5 14.5',
    'M13 19 19 13',
    'M16 16 20 20',
    'M19 21 21 19',
    'M14.5 6.5 18 3 21 3 21 6 17.5 9.5',
    'M5 14 9 18',
    'M7 17 4 20',
    'M3 19 5 21',
  ],
  hammer: [
    'm15 12-8.373 8.373a1 1 0 1 1-3-3L12 9',
    'm18 15 4-4',
    'm21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5',
  ],
  home: ['m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
  shield: [
    'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
  ],
  crosshair: [
    'M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0',
    'M22 12h-4',
    'M6 12H2',
    'M12 6V2',
    'M12 22v-4',
  ],
  chevronRight: ['m9 18 6-6-6-6'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
  play: ['M6 3 20 12 6 21Z'],
  pause: ['M14 4h4v16h-4z', 'M6 4h4v16H6z'],
  alertTriangle: [
    'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z',
    'M12 9v4',
    'M12 17h.01',
  ],
}

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
  /** Stroke color; defaults to `currentColor`. */
  color?: string
  strokeWidth?: number
}

/** Renders a Lucide-style stroked icon on a 24×24 viewBox. */
export function Icon({
  name,
  size = 16,
  color = 'currentColor',
  strokeWidth = 2,
  ...rest
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {ICON_PATHS[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
}
