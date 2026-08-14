// Project glyphs for the research tree. Each shape is drawn inside a 24x24 box
// in currentColor, so a node hex and the detail schematic can share one set at
// two sizes. Returns bare SVG children: the caller owns the svg element.
import type { ReactNode } from 'react'

// Every shape the tree can ask for. Typed (not `string`) so a node glyph id is
// a type error when it names no drawn shape.
export type ResearchGlyphId =
  | 'rounds'
  | 'barrel'
  | 'velocity'
  | 'feed'
  | 'rail'
  | 'frag'
  | 'sabot'
  | 'brain'
  | 'synapse'
  | 'reflex'
  | 'pulse'
  | 'accel'
  | 'weave'
  | 'cache'
  | 'reticle'
  | 'sensor'
  | 'swarm'
  | 'threat'
  | 'em'
  | 'crypt'
  | 'ai'

export function researchShape(kind: ResearchGlyphId): ReactNode {
  switch (kind) {
    /* ------------------------------ ballistics ---------------------------- */
    case 'rounds':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M5 9.5 6.8 5.2 8.6 9.5v9.3H5Z" />
          <path d="M10.4 9.5 12.2 5.2 14 9.5v9.3h-3.6Z" />
          <path d="M15.8 9.5 17.6 5.2 19.4 9.5v9.3h-3.6Z" />
          <path d="M5 13h3.6M10.4 13H14M15.8 13h3.6" strokeWidth="1" />
        </g>
      )
    case 'barrel':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.3">
          <rect x="3" y="8.6" width="15.4" height="6.8" />
          <path d="M18.4 10.4H21v3.2h-2.6" />
          <path d="M7 8.6v6.8M11 8.6v6.8M15 8.6v6.8" strokeWidth="0.9" />
          <circle cx="5.4" cy="12" r="1.1" fill="currentColor" stroke="none" />
        </g>
      )
    case 'velocity':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M20 12 13.6 8.2v7.6Z" fill="currentColor" stroke="none" />
          <path d="M13.6 9.6H9.8v4.8h3.8" />
          <path d="M2.6 7.4h5M2.6 12h4M2.6 16.6h5" strokeWidth="1.1" />
        </g>
      )
    case 'feed':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M7.4 21V9.4l9.2-3.4V17Z" />
          <path d="M9.8 12.2 14.2 10.6M9.8 15.4l4.4-1.6" strokeWidth="1" />
          <path d="M18.6 6.4 21 8.8l-2.4 2.4" strokeWidth="1.1" />
        </g>
      )
    case 'rail':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M3 7.6h18M3 16.4h18" />
          <rect x="9" y="10" width="6" height="4" fill="currentColor" stroke="none" />
          <path d="M16.4 12h4.4" strokeWidth="1.1" />
          <path d="M5.4 10.2v3.6" strokeWidth="1" />
        </g>
      )
    case 'frag':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none" />
          <path d="M12 7.4V2.8M12 16.6v4.6M7.4 12H2.8M16.6 12h4.6" />
          <path d="M8.4 8.4 5.6 5.6M15.6 15.6l2.8 2.8M8.4 15.6 5.6 18.4M15.6 8.4l2.8-2.8" strokeWidth="1" />
        </g>
      )
    case 'sabot':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M12 2.6 15 9v9.4H9V9Z" />
          <path d="M9 11 5.4 8.2v7.4L9 13.4M15 11l3.6-2.8v7.4L15 13.4" strokeWidth="1.1" />
          <path d="M12 6.4v9" strokeWidth="0.9" />
        </g>
      )

    /* ------------------------------ cybernetics --------------------------- */
    case 'brain':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M12 4.6c-3.4 0-6 2.2-6 5 0 1.4.6 2.6 1.6 3.5v3.2a2 2 0 0 0 2 2h4.8a2 2 0 0 0 2-2v-3.2c1-.9 1.6-2.1 1.6-3.5 0-2.8-2.6-5-6-5Z" />
          <path d="M12 6.6v11.7M9.4 8.6c1 .8 1.4 2 1.2 3.4M14.6 8.6c-1 .8-1.4 2-1.2 3.4" strokeWidth="1" />
        </g>
      )
    case 'synapse':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M3.4 12h5.2l2.6-4.6M8.6 12l2.6 4.6" />
          <path d="M11.2 7.4h4.2M11.2 16.6h4.2" />
          <circle cx="17.4" cy="7.4" r="2.2" />
          <circle cx="17.4" cy="16.6" r="2.2" />
          <circle cx="3.4" cy="12" r="1.4" fill="currentColor" stroke="none" />
        </g>
      )
    case 'reflex':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M7.6 20V12l-2-3a1.6 1.6 0 0 1 2.6-1.8l2.4 3.2V4.4a1.6 1.6 0 0 1 3.2 0v5.2h1.4a3 3 0 0 1 3 3V20Z" />
          <path d="M20.4 5.4a5.4 5.4 0 0 1 0 5.6" strokeWidth="1" />
        </g>
      )
    case 'pulse':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M2.6 12.6h4l2-4.4 3 9.2 2.4-6 1.6 3h5.8" />
          <circle cx="6.6" cy="12.6" r="1.1" fill="currentColor" stroke="none" />
        </g>
      )
    case 'accel':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M12 4.4c-3 0-5.4 2-5.4 4.6 0 1.3.6 2.4 1.5 3.2v3a1.8 1.8 0 0 0 1.8 1.8h4.2a1.8 1.8 0 0 0 1.8-1.8v-3c.9-.8 1.5-1.9 1.5-3.2 0-2.6-2.4-4.6-5.4-4.6Z" />
          <path d="m12.8 7.6-2.4 3.6h2.6l-1.6 3.4 3.4-4.2h-2.4Z" fill="currentColor" stroke="none" />
          <path d="M8 20.4h8" strokeWidth="1.1" />
        </g>
      )
    case 'weave':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M4 8.4h16M4 12h16M4 15.6h16" />
          <path d="M8 4.6v14.8M12 4.6v14.8M16 4.6v14.8" strokeWidth="0.9" />
          <rect x="4" y="4.6" width="16" height="14.8" strokeWidth="1.3" />
        </g>
      )
    case 'cache':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.3">
          <rect x="4.4" y="5.6" width="15.2" height="4.4" />
          <rect x="4.4" y="14" width="15.2" height="4.4" />
          <path d="M7.4 7.8h3M7.4 16.2h3" strokeWidth="1.1" />
          <path d="M16.6 7.8h.02M16.6 16.2h.02" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 10v4" strokeWidth="1" />
        </g>
      )

    /* ---------------------------- control systems ------------------------- */
    case 'reticle':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.3">
          <circle cx="12" cy="12" r="6.6" />
          <path d="M12 1.8v5M12 17.2v5M1.8 12h5M17.2 12h5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </g>
      )
    case 'sensor':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.3">
          <circle cx="12" cy="18.4" r="1.8" fill="currentColor" stroke="none" />
          <path d="M7.6 15.4a6.2 6.2 0 0 1 8.8 0" />
          <path d="M4.6 11.6a10.4 10.4 0 0 1 14.8 0" />
          <path d="M1.8 7.8a14.6 14.6 0 0 1 20.4 0" strokeWidth="1.1" />
        </g>
      )
    case 'swarm':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.1">
          <path d="M12 5.4 5.2 10.2 7.8 18h8.4l2.6-7.8Z" />
          <circle cx="12" cy="5.4" r="1.9" fill="currentColor" stroke="none" />
          <circle cx="5.2" cy="10.2" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="18.8" cy="10.2" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="7.8" cy="18" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="16.2" cy="18" r="1.6" fill="currentColor" stroke="none" />
          <path d="M12 5.4v12.6M5.2 10.2h13.6" strokeWidth="0.8" />
        </g>
      )
    case 'threat':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M2.8 17.6 8 10.4l3.6 3.4L16 6.6l5.2 11Z" />
          <path d="M2.8 20.6h18.4" strokeWidth="1" />
          <circle cx="16" cy="6.6" r="1.8" fill="currentColor" stroke="none" />
        </g>
      )
    case 'em':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M12 2.8 19.4 6v6.4c0 4-3 7-7.4 8.8-4.4-1.8-7.4-4.8-7.4-8.8V6Z" />
          <path d="M9 11.6 12 7.4v3.8h2.8L11.8 16v-4.4Z" fill="currentColor" stroke="none" />
        </g>
      )
    case 'crypt':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.3">
          <rect x="5.6" y="10.4" width="12.8" height="9" />
          <path d="M8.4 10.4V7.8a3.6 3.6 0 0 1 7.2 0v2.6" />
          <path d="M12 13.4v3.2" strokeWidth="1.6" />
          <path d="M2.6 15h3M18.4 15h3" strokeWidth="1" />
        </g>
      )
    case 'ai':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.3">
          <rect x="7" y="7" width="10" height="10" />
          <rect x="10.2" y="10.2" width="3.6" height="3.6" fill="currentColor" stroke="none" />
          <path d="M9.6 7V3.4M14.4 7V3.4M9.6 20.6V17M14.4 20.6V17M7 9.6H3.4M7 14.4H3.4M20.6 9.6H17M20.6 14.4H17" strokeWidth="1" />
        </g>
      )
  }
  return null
}
