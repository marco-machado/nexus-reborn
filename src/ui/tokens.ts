// Design tokens for TS/SVG code — the single source for every colour a
// component draws. A hex or rgba literal must never appear in a .ts/.tsx under
// src/ui; import the constant instead.
//
// These mirror the CSS custom properties in src/index.css :root. Keep the two
// in sync: the CSS variables drive classes, this file drives inline SVG fills
// and canvas paints. Near-black art backgrounds that used to be a different
// literal per file now share one token so they cannot drift.
//
//   import { TEAL, AMBER } from './tokens'   // never '#7ef0d4' in JSX
//
// A palette change touches src/index.css AND this file, and nothing else.

/* ------------------------------- palette -------------------------------- */

export const BG = '#04070a'
export const BG_PANEL_SOLID = '#0a1412'
export const INK = '#b8d8cf'
export const INK_DIM = '#5d7d75'
export const INK_FAINT = '#35504a'
export const TEAL = '#7ef0d4'
export const CYAN = '#59d6c9'
export const AMBER = '#f0b445'
export const AMBER_HOT = '#ffd075'
export const RED = '#e04b3c'
export const RED_HOT = '#ff6b55'
export const GREEN = '#7de08a'
export const LINE = 'rgba(126, 240, 212, 0.22)'
export const LINE_STRONG = 'rgba(126, 240, 212, 0.45)'
export const LINE_AMBER = 'rgba(240, 180, 69, 0.55)'

/* --------------------------- teal line alphas --------------------------- */
// The UI strokes the same teal at many strengths; a token per strength keeps
// a panel that wants a slightly brighter edge from inventing a new value.

export const TEAL_A025 = 'rgba(126, 240, 212, 0.025)'
export const TEAL_A04 = 'rgba(126, 240, 212, 0.04)'
export const TEAL_A05 = 'rgba(126, 240, 212, 0.05)'
export const TEAL_A055 = 'rgba(126, 240, 212, 0.055)'
export const TEAL_A06 = 'rgba(126, 240, 212, 0.06)'
export const TEAL_A07 = 'rgba(126, 240, 212, 0.07)'
export const TEAL_A12 = 'rgba(126, 240, 212, 0.12)'
export const TEAL_A14 = 'rgba(126, 240, 212, 0.14)'
export const TEAL_A16 = 'rgba(126, 240, 212, 0.16)'
export const TEAL_A25 = 'rgba(126, 240, 212, 0.25)'
export const TEAL_A28 = 'rgba(126, 240, 212, 0.28)'
export const TEAL_A34 = 'rgba(126, 240, 212, 0.34)'
export const TEAL_A35 = 'rgba(126, 240, 212, 0.35)'
export const TEAL_A40 = 'rgba(126, 240, 212, 0.4)'
export const TEAL_A45 = 'rgba(126, 240, 212, 0.45)'
export const TEAL_A50 = 'rgba(126, 240, 212, 0.5)'
export const TEAL_A55 = 'rgba(126, 240, 212, 0.55)'
export const TEAL_A8 = 'rgba(126, 240, 212, 0.8)'

export const AMBER_A1 = 'rgba(240, 180, 69, 0.1)'
export const AMBER_A11 = 'rgba(240, 180, 69, 0.11)'
export const AMBER_A35 = 'rgba(240, 180, 69, 0.35)'
export const AMBER_A6 = 'rgba(240, 180, 69, 0.6)'

export const RED_A06 = 'rgba(224, 75, 60, 0.06)'
export const RED_A08 = 'rgba(224, 75, 60, 0.08)'
export const RED_A13 = 'rgba(255, 107, 85, 0.13)'
export const RED_A18 = 'rgba(224, 75, 60, 0.18)'
export const RED_A34 = 'rgba(224, 75, 60, 0.34)'
export const RED_A45 = 'rgba(224, 75, 60, 0.45)'
export const RED_A6 = 'rgba(224, 75, 60, 0.6)'
export const RED_A7 = 'rgba(224, 75, 60, 0.7)'
export const RED_A8 = 'rgba(224, 75, 60, 0.8)'

export const INK_A045 = 'rgba(184, 216, 207, 0.045)'
export const INK_A1 = 'rgba(184, 216, 207, 0.1)'
export const INK_A26 = 'rgba(184, 216, 207, 0.26)'
export const INK_A5 = 'rgba(184, 216, 207, 0.5)'
export const INK_A55 = 'rgba(184, 216, 207, 0.55)'
export const INK_A8 = 'rgba(184, 216, 207, 0.8)'
export const INK_DIM_A7 = 'rgba(93, 125, 117, 0.7)'
export const INK_DIM_A8 = 'rgba(93, 125, 117, 0.8)'
export const INK_DIM_A9 = 'rgba(93, 125, 117, 0.9)'

/* ------------------------------ shared tints ---------------------------- */

// Rim light used by both the figure and the portrait.
export const RIM = 'rgba(232, 251, 242, 0.4)'

/* --------------------------- art backgrounds ---------------------------- */
// Near-black canvases behind the procedural art. One per role so a minimap
// ground and a recon frame cannot drift apart again.

export const ART_BG = '#030a08' // minimap ground + World Network Scan
export const ART_BG_DEEP = '#020708' // recon vignette
export const ART_BG_PANEL = '#05090b' // recon / satellite frames
export const ART_BG_TILE = '#04090a' // tactical tiles
export const ART_BG_INSET = '#070d0c' // nested panel fills
export const WORLD_GLOW = '#0e2c26' // Scan glow
export const PANEL_GRAD_A = '#0d1a17' // mission-list panel gradient top
export const PANEL_GRAD_B = '#050b0a' // mission-list panel gradient bottom

/* ------------------------- operative figure shades ---------------------- */
// Figure armour ramps (lit / mid / low) and the portrait's body fills.

export const ARMOR_LIT: [string, string, string] = ['#3a635a', '#22403a', '#0f221d']
export const ARMOR_MID: [string, string, string] = ['#2b4d45', '#193029', '#0a1714']
export const ARMOR_LOW: [string, string, string] = ['#1b342e', '#10231e', '#060f0d']
export const BODY_DEEP = '#0b1613'
export const BODY_BELT = '#0b1714'
export const FACE_BG = '#0a1512'
export const FACE_SHOULDER = '#132420'
export const FACE_NECK = '#0f1d18'
export const FACE_HEAD = '#1c2f28'
export const FACE_CREST = '#152622'

/* --------------------------- glyph detail fills ------------------------- */

// The dark cut-outs inside currentColor glyphs (eye sockets, grenade seams).
export const INK_DEEP = '#07100e'
export const DARK_RED = '#140505'
export const GUN_IRON = '#82a396'

/* ------------------------- mission marker colours ----------------------- */

// Mission markers with no CSS token.
export const DEVICE = '#ffb300'
export const DEVICE_A25 = 'rgba(255, 179, 0, 0.25)'
export const VIP = '#9be8ff'
