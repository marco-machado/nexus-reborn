// Procedural full-body operative figures for the assembly bays. Same angular
// language as the dossier portrait, staged as a lit display case: helmet and
// visor on top, plated torso, the operative's own weapon held across the body,
// boots on a plinth. Geometry jitter is derived from the operative id so a
// figure always renders the same way.
import { useMemo } from 'react'
import type { WeaponId } from '../game/types'
import { GunShape } from './bits'
import { blurFilterDef, polyPoints as p, scanlinePatternDef, visorGradientDef } from './glyph'
import { ARMOR_LIT, ARMOR_MID, ARMOR_LOW, BODY_BELT, BODY_DEEP, GUN_IRON, RIM, TEAL, TEAL_A35, TEAL_A40, TEAL_A45, TEAL_A50 } from './tokens'
import { hashOf, rngFrom } from './util'

export interface FigureOp {
  id: string
  codename: string
  accent: string
  weapon: WeaponId
}

const CX = 60

interface Build {
  uid: string
  head: string
  rim: string
  visor: string
  respirator: string
  crest: string | null
  antenna: { x1: number; y1: number; x2: number; y2: number } | null
  neck: string
  torso: string
  chest: string
  rig: Array<{ x: number; y: number; w: number; h: number }>
  pauldrons: [string, string]
  arms: [string, string]
  forearms: [string, string]
  gloves: [string, string]
  pouches: Array<{ x: number; w: number }>
  hips: string
  thighs: [string, string]
  knees: [string, string]
  shins: [string, string]
  boots: [string, string]
  plinth: string
  seams: Array<[number, number, number, number]>
}

function flip(list: Array<[number, number]>): Array<[number, number]> {
  return list.map((q) => [2 * CX - q[0], q[1]] as [number, number])
}

function pair(list: Array<[number, number]>): [string, string] {
  return [p(list), p(flip(list))]
}

function buildFigure(op: FigureOp): Build {
  const h = hashOf(op.id + '#' + op.codename)
  const r = rngFrom(h)
  const j = (amt: number) => (r() - 0.5) * 2 * amt

  const headW = 14.5 + r() * 2.5
  const crown = 15 + r() * 3
  const visorY = 29 + r() * 2.5
  const visorH = 6 + r() * 2.5
  const slant = (r() < 0.5 ? -1 : 1) * (0.8 + r() * 1.6)
  const chinY = 57 + r() * 3
  const shW = 27.5 + r() * 5
  const stance = 1 + r() * 2.4

  const headArr: Array<[number, number]> = [
    [CX - headW, crown + 7],
    [CX - headW * 0.6, crown],
    [CX + headW * 0.6, crown],
    [CX + headW, crown + 7],
    [CX + headW - 0.5, visorY + visorH + 4],
    [CX + 8, chinY - 5],
    [CX + 2.5, chinY],
    [CX - 3, chinY],
    [CX - 8.5, chinY - 6],
    [CX - headW + 0.5, visorY + visorH + 5],
  ]

  const vx0 = CX - headW + 2.5
  const vx1 = CX + headW - 2.5

  const seams: Array<[number, number, number, number]> = [
    [CX - 15, 96 + j(3), CX + 15, 94 + j(3)],
    [CX - 20, 128 + j(4), CX + 20, 130 + j(4)],
    [CX - 18, 196 + j(6), CX - 9, 196 + j(6)],
    [CX + 9, 200 + j(6), CX + 18, 200 + j(6)],
    [CX - 20, 268 + j(6), CX - 11, 268 + j(6)],
    [CX + 11, 272 + j(6), CX + 20, 272 + j(6)],
  ]

  const pouches: Array<{ x: number; w: number }> = []
  let px = CX - 22
  while (px < CX + 16) {
    const w = 6 + r() * 5
    pouches.push({ x: px, w })
    px += w + 3 + r() * 3
  }

  return {
    uid: 'fig-' + op.id.replace(/[^a-zA-Z0-9_-]/g, ''),
    head: p(headArr),
    rim: p(headArr.slice(1, 7)),
    visor: p([
      [vx0, visorY + slant],
      [vx1, visorY - slant],
      [vx1, visorY - slant + visorH],
      [vx0, visorY + slant + visorH],
    ]),
    respirator: p([
      [CX - 7, visorY + visorH + 3],
      [CX + 7, visorY + visorH + 3],
      [CX + 5, chinY - 1],
      [CX - 5, chinY - 1],
    ]),
    crest:
      h % 3 === 0
        ? p([
            [CX - 3.5, crown + 1],
            [CX + 3.5, crown + 1],
            [CX + 2, crown - 4 - r() * 2],
            [CX - 2, crown - 4 - r() * 2],
          ])
        : null,
    antenna:
      h % 4 < 2
        ? { x1: CX + headW - 1, y1: visorY - 1, x2: CX + headW + 4, y2: visorY - 10 - r() * 3 }
        : null,
    neck: p([
      [CX - 7, chinY - 3],
      [CX + 7, chinY - 3],
      [CX + 9, 71],
      [CX - 9, 71],
    ]),
    torso: p([
      [CX - shW, 84],
      [CX - shW + 4, 73],
      [CX - 12, 67],
      [CX + 12, 67],
      [CX + shW - 4, 73],
      [CX + shW, 84],
      [CX + 23, 116],
      [CX + 19, 150],
      [CX - 19, 150],
      [CX - 23, 116],
    ]),
    chest: p([
      [CX - 18, 80],
      [CX, 76],
      [CX + 18, 80],
      [CX + 15, 106],
      [CX, 113],
      [CX - 15, 106],
    ]),
    rig:
      h % 2 === 0
        ? [
            { x: CX - 14, y: 88, w: 11, h: 7 },
            { x: CX + 3, y: 88, w: 11, h: 7 },
            { x: CX - 8, y: 98, w: 16, h: 8 },
          ]
        : [
            { x: CX - 13, y: 86, w: 9, h: 12 },
            { x: CX + 4, y: 86, w: 9, h: 12 },
          ],
    pauldrons: pair([
      [CX - shW - 6, 90],
      [CX - shW - 3, 73],
      [CX - shW + 10, 68],
      [CX - shW + 15, 90],
      [CX - shW + 7, 98],
    ]),
    arms: pair([
      [CX - shW - 2, 92],
      [CX - shW + 9, 90],
      [CX - shW + 12, 118],
      [CX - shW + 8, 132],
      [CX - shW, 130],
      [CX - shW - 3, 110],
    ]),
    forearms: [
      p([
        [CX - 27, 124],
        [CX - 18, 121],
        [CX - 2, 142],
        [CX - 8, 152],
        [CX - 25, 136],
      ]),
      p([
        [CX + 28, 118],
        [CX + 20, 116],
        [CX + 6, 124],
        [CX + 8, 135],
        [CX + 26, 130],
      ]),
    ],
    gloves: [
      p([
        [CX - 11, 141],
        [CX - 1, 139],
        [CX + 1, 151],
        [CX - 9, 153],
      ]),
      p([
        [CX + 4, 123],
        [CX + 14, 121],
        [CX + 16, 133],
        [CX + 6, 135],
      ]),
    ],
    pouches,
    hips: p([
      [CX - 25, 159],
      [CX + 25, 159],
      [CX + 22, 180],
      [CX - 22, 180],
    ]),
    thighs: pair([
      [CX - 22, 176],
      [CX - 7, 176],
      [CX - 8, 234],
      [CX - 22 - stance, 234],
    ]),
    knees: pair([
      [CX - 23 - stance, 230],
      [CX - 7, 230],
      [CX - 8, 246],
      [CX - 24 - stance, 246],
    ]),
    shins: pair([
      [CX - 23 - stance, 243],
      [CX - 9, 243],
      [CX - 10, 299],
      [CX - 24 - stance * 1.6, 299],
    ]),
    boots: pair([
      [CX - 25 - stance * 1.6, 296],
      [CX - 9, 296],
      [CX - 7, 312],
      [CX - 28 - stance * 1.6, 312],
    ]),
    plinth: p([
      [CX - 40, 316],
      [CX - 28, 310],
      [CX + 28, 310],
      [CX + 40, 316],
      [CX + 40, 326],
      [CX + 28, 332],
      [CX - 28, 332],
      [CX - 40, 326],
    ]),
    seams,
  }
}

// One key light from the viewer's left, so every plate shares the same ramp
// across the figure rather than shading itself.
const RAMPS: Array<[string, [string, string, string]]> = [
  ['lit', ARMOR_LIT],
  ['mid', ARMOR_MID],
  ['low', ARMOR_LOW],
]

const EDGE = TEAL_A35
const EDGE_HI = TEAL_A50

export function Figure({ op }: { op: FigureOp }) {
  const g = useMemo(() => buildFigure(op), [op])
  const uid = g.uid
  return (
    <svg
      className="figure-svg"
      viewBox="0 0 120 340"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={'OPERATIVE ' + op.codename}
    >
      <defs>
        {visorGradientDef(uid, op.accent)}
        <radialGradient id={uid + '-amb'} cx="0.5" cy="0.32" r="0.6">
          <stop offset="0" stopColor={op.accent} stopOpacity="0.16" />
          <stop offset="1" stopColor={op.accent} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={uid + '-floor'} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={TEAL} stopOpacity="0.22" />
          <stop offset="1" stopColor={TEAL} stopOpacity="0" />
        </radialGradient>
        {scanlinePatternDef(uid, 0.26)}
        {blurFilterDef(uid, 2.2)}
        {RAMPS.map(([name, stops]) => (
          <linearGradient
            key={name}
            id={uid + '-' + name}
            gradientUnits="userSpaceOnUse"
            x1="16"
            y1="0"
            x2="104"
            y2="0"
          >
            <stop offset="0" stopColor={stops[0]} />
            <stop offset="0.42" stopColor={stops[1]} />
            <stop offset="1" stopColor={stops[2]} />
          </linearGradient>
        ))}
      </defs>

      {/* case light: a soft key behind the figure and a pool at its feet */}
      <rect x="0" y="0" width="120" height="290" fill={'url(#' + uid + '-amb)'} />
      <ellipse cx="60" cy="322" rx="52" ry="20" fill={'url(#' + uid + '-floor)'} />

      {/* plinth */}
      <polygon points={g.plinth} fill={BODY_DEEP} stroke={EDGE} strokeWidth="0.7" />
      <rect x="34" y="327" width="52" height="1.6" fill={op.accent} opacity="0.55" />

      {/* legs */}
      <g stroke={EDGE} strokeWidth="0.6">
        {g.boots.map((d, i) => (
          <polygon key={'bt' + i} points={d} fill={'url(#' + uid + '-low)'} />
        ))}
        {g.shins.map((d, i) => (
          <polygon key={'sh' + i} points={d} fill={'url(#' + uid + '-mid)'} />
        ))}
        {g.knees.map((d, i) => (
          <polygon key={'kn' + i} points={d} fill={'url(#' + uid + '-lit)'} />
        ))}
        {g.thighs.map((d, i) => (
          <polygon key={'th' + i} points={d} fill={'url(#' + uid + '-mid)'} />
        ))}
      </g>

      {/* hips and belt */}
      <polygon points={g.hips} fill={'url(#' + uid + '-low)'} stroke={EDGE} strokeWidth="0.6" />
      <rect x="36" y="150" width="48" height="12" fill={BODY_BELT} stroke={EDGE} strokeWidth="0.6" />
      <g fill={'url(#' + uid + '-lit)'} stroke={EDGE} strokeWidth="0.4">
        {g.pouches.map((b, i) => (
          <rect key={'po' + i} x={b.x} y={152} width={b.w} height={8} />
        ))}
      </g>

      {/* torso */}
      <polygon points={g.torso} fill={'url(#' + uid + '-mid)'} stroke={EDGE_HI} strokeWidth="0.7" />
      <polygon points={g.chest} fill={'url(#' + uid + '-lit)'} stroke={EDGE} strokeWidth="0.6" />
      <g fill={'url(#' + uid + '-low)'} stroke={EDGE} strokeWidth="0.4">
        {g.rig.map((b, i) => (
          <rect key={'rg' + i} x={b.x} y={b.y} width={b.w} height={b.h} />
        ))}
      </g>
      {g.arms.map((d, i) => (
        <polygon key={'ar' + i} points={d} fill={'url(#' + uid + '-low)'} stroke={EDGE} strokeWidth="0.6" />
      ))}
      {g.pauldrons.map((d, i) => (
        <polygon key={'pa' + i} points={d} fill={'url(#' + uid + '-lit)'} stroke={EDGE} strokeWidth="0.6" />
      ))}

      {/* head */}
      <polygon points={g.neck} fill={'url(#' + uid + '-low)'} stroke={EDGE} strokeWidth="0.5" />
      <polygon points={g.head} fill={'url(#' + uid + '-lit)'} stroke={TEAL_A45} strokeWidth="0.6" />
      <polyline
        points={g.rim}
        fill="none"
        stroke={RIM}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {g.crest && (
        <polygon points={g.crest} fill={'url(#' + uid + '-mid)'} stroke={EDGE} strokeWidth="0.5" />
      )}
      {g.antenna && (
        <g>
          <line
            x1={g.antenna.x1}
            y1={g.antenna.y1}
            x2={g.antenna.x2}
            y2={g.antenna.y2}
            stroke={TEAL_A40}
            strokeWidth="0.7"
          />
          <circle cx={g.antenna.x2} cy={g.antenna.y2 - 1} r="1.1" fill={op.accent} opacity="0.9" />
        </g>
      )}
      <polygon points={g.respirator} fill={'url(#' + uid + '-low)'} stroke={EDGE} strokeWidth="0.5" />
      <polygon points={g.visor} fill={op.accent} filter={'url(#' + uid + '-b)'} opacity="0.7" />
      <polygon points={g.visor} fill={'url(#' + uid + '-v)'} />

      {/* forearms come up, then the primary lies across them, then the gloves
          close on the grip and the foregrip */}
      {g.forearms.map((d, i) => (
        <polygon
          key={'fa' + i}
          points={d}
          fill={'url(#' + uid + '-mid)'}
          stroke={EDGE}
          strokeWidth="0.6"
        />
      ))}
      <g transform="translate(24 141) rotate(-30) scale(0.66)" color={GUN_IRON}>
        <GunShape weapon={op.weapon} />
      </g>
      {g.gloves.map((d, i) => (
        <polygon key={'gl' + i} points={d} fill={'url(#' + uid + '-low)'} stroke={EDGE} strokeWidth="0.5" />
      ))}

      {/* plate seams */}
      <g stroke="rgba(255,255,255,0.09)" strokeWidth="0.5">
        {g.seams.map((s, i) => (
          <line key={'sm' + i} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} />
        ))}
      </g>

      <rect x="0" y="0" width="120" height="340" fill={'url(#' + uid + '-s)'} opacity="0.4" />
    </svg>
  )
}
