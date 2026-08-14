// Shared SVG building blocks for the procedural figure and portrait glyphs.
// figure.tsx and portrait.tsx used to each carry their own copy of the point
// formatter and the visor/scanline/blur defs; they now draw from here so the
// geometry language and the effect defs stay in one place. Pure functions and
// tiny JSX fragments — no state, no hooks.
import type { ReactNode } from 'react'

// Turns a list of [x, y] points into an SVG points/polyline attribute.
export function polyPoints(list: Array<[number, number]>): string {
  return list.map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ')
}

// The visor gradient: white-hot at the crown falling through the accent to a
// dim tail. The `<defs>` block is the caller's; this is one fragment in it.
export function visorGradientDef(uid: string, accent: string): ReactNode {
  return (
    <linearGradient id={uid + '-v'} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
      <stop offset="0.25" stopColor={accent} />
      <stop offset="1" stopColor={accent} stopOpacity="0.25" />
    </linearGradient>
  )
}

// Horizontal scanline pattern painted over the whole glyph. alpha drives the
// band darkness (figure 0.26, portrait 0.28 — kept per-caller).
export function scanlinePatternDef(uid: string, alpha: number): ReactNode {
  return (
    <pattern id={uid + '-s'} width="4" height="3" patternUnits="userSpaceOnUse">
      <rect width="4" height="1" fill={`rgba(0, 0, 0, ${alpha})`} />
    </pattern>
  )
}

// Soft-focus pass behind the visor glow.
export function blurFilterDef(uid: string, stdDeviation: number): ReactNode {
  return (
    <filter id={uid + '-b'} x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation={stdDeviation} />
    </filter>
  )
}
