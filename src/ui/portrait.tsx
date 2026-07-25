// Procedural operative portraits: angular bust silhouettes with a visor band
// tinted by the operative accent. Geometry jitter is derived deterministically
// from the operative id and codename so every dossier renders the same face.
import { useMemo } from 'react'
import { hashOf, rngFrom } from './bits'

export interface PortraitOp {
  id: string
  codename: string
  accent: string
}

interface Geometry {
  uid: string
  headPts: string
  rimPts: string
  shoulderPts: string
  neckPts: string
  crestPts: string | null
  antenna: { x1: number; y1: number; x2: number; y2: number; dot: [number, number] } | null
  visorStyle: number
  visorPts: string
  slitL: { x: number; y: number; w: number; h: number }
  slitR: { x: number; y: number; w: number; h: number }
  facets: Array<[number, number, number, number]>
  chestPts: string
  collarPts: string
  bars: Array<{ x: number; w: number }>
  serial: string
  edge: string
}

function p(list: Array<[number, number]>): string {
  return list.map((pt) => pt[0].toFixed(1) + ',' + pt[1].toFixed(1)).join(' ')
}

function buildGeometry(op: PortraitOp): Geometry {
  const h = hashOf(op.id + ':' + op.codename)
  const r = rngFrom(h)
  const j = (amt: number) => (r() - 0.5) * 2 * amt

  const cx = 50
  const headW = 14.5 + r() * 4.5
  const crownY = 13 + r() * 5
  const visorY = 33 + r() * 6
  const visorH = 6 + r() * 4
  const slant = (r() < 0.5 ? -1 : 1) * (1 + r() * 2.4)
  const jawW = 8 + r() * 4
  const jawY = 53 + r() * 5
  const chinY = jawY + 6 + r() * 4

  const headArr: Array<[number, number]> = [
    [cx - headW + j(1.5), crownY + 5],
    [cx - headW * 0.55, crownY + j(1.2)],
    [cx + headW * 0.6, crownY + j(1.2)],
    [cx + headW - j(1), crownY + 6],
    [cx + headW - 1.5, visorY + visorH + 4],
    [cx + jawW, jawY],
    [cx + 2.5, chinY],
    [cx - 3, chinY],
    [cx - jawW - 1, jawY - 1],
    [cx - headW + 1.5, visorY + visorH + 5],
  ]
  const headPts = p(headArr)
  // rim light path: crown across the right side down to the chin
  const rimPts = p(headArr.slice(1, 7))

  const shTopY = 71 + r() * 4
  const shoulderPts = p([
    [7 + j(3), 100],
    [11, shTopY + 9],
    [23, shTopY + j(2)],
    [37, shTopY - 6],
    [43.5, shTopY - 8],
    [43.5, 64],
    [56.5, 64],
    [56.5, shTopY - 8],
    [63, shTopY - 6],
    [77, shTopY + 1 + j(2)],
    [89 + j(3), shTopY + 10],
    [93, 100],
  ])

  const neckPts = p([
    [44, chinY - 2],
    [56, chinY - 2],
    [57, 68],
    [43, 68],
  ])

  const crest =
    h % 4 === 1
      ? p([
          [cx - 4, crownY + 1],
          [cx + 4, crownY + 1],
          [cx + 2.4, crownY - 4 - r() * 3],
          [cx - 2.4, crownY - 4 - r() * 3],
        ])
      : null

  const antenna =
    h % 5 < 2
      ? {
          x1: cx + headW - 1,
          y1: visorY - 2,
          x2: cx + headW + 4.5,
          y2: visorY - 9 - r() * 4,
          dot: [cx + headW + 4.5, visorY - 10 - r() * 4] as [number, number],
        }
      : null

  const vx0 = cx - headW + 3
  const vx1 = cx + headW - 3
  const visorPts = p([
    [vx0, visorY + slant],
    [vx1, visorY - slant],
    [vx1, visorY - slant + visorH],
    [vx0, visorY + slant + visorH],
  ])

  const slitW = 8 + r() * 2
  const slitH = 2.6 + r() * 1.2
  const slitL = { x: cx - 3.5 - slitW, y: visorY + 1 + slant, w: slitW, h: slitH }
  const slitR = { x: cx + 3.5, y: visorY + 1 - slant, w: slitW, h: slitH }

  const facets: Array<[number, number, number, number]> = []
  const nFacets = 2 + (h % 3)
  for (let i = 0; i < nFacets; i++) {
    const y = visorY + visorH + 4 + r() * (chinY - visorY - visorH - 4)
    facets.push([cx - jawW + r() * 3, y, cx + jawW - r() * 3, y + j(3)])
  }
  facets.push([16 + r() * 6, shTopY + 6, 40, shTopY - 3 + j(2)])
  facets.push([84 - r() * 6, shTopY + 7, 60, shTopY - 3 + j(2)])

  const chestPts = p([
    [cx - 9, 86 + j(2)],
    [cx, 82 + j(2)],
    [cx + 9, 86 + j(2)],
  ])

  const collarPts = p([
    [40, 69],
    [50, 74],
    [60, 69],
  ])

  const bars: Array<{ x: number; w: number }> = []
  let bx = 8
  while (bx < 44) {
    const w = 0.8 + r() * 2
    bars.push({ x: bx, w })
    bx += w + 0.8 + r() * 1.4
  }

  const serial = op.id.toUpperCase() + '-' + String(1000 + (h % 9000))

  const edge = p([
    [cx - headW + 1, visorY + visorH + 4],
    [cx - jawW - 0.5, jawY - 1.5],
    [cx - 3.5, chinY - 0.5],
  ])

  return {
    uid: 'pp-' + op.id.replace(/[^a-zA-Z0-9_-]/g, ''),
    headPts,
    rimPts,
    shoulderPts,
    neckPts,
    crestPts: crest,
    antenna,
    visorStyle: h % 3,
    visorPts,
    slitL,
    slitR,
    facets,
    chestPts,
    collarPts,
    bars,
    serial,
    edge,
  }
}

export function Portrait({ op, size = 96 }: { op: PortraitOp; size?: number }) {
  const g = useMemo(() => buildGeometry(op), [op])
  const uid = g.uid
  return (
    <svg
      className="portrait-svg"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={'OPERATIVE ' + op.codename}
    >
      <defs>
        <linearGradient id={uid + '-v'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="0.25" stopColor={op.accent} />
          <stop offset="1" stopColor={op.accent} stopOpacity="0.25" />
        </linearGradient>
        <radialGradient id={uid + '-g'} cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor={op.accent} stopOpacity="0.30" />
          <stop offset="1" stopColor={op.accent} stopOpacity="0" />
        </radialGradient>
        <pattern id={uid + '-s'} width="4" height="3" patternUnits="userSpaceOnUse">
          <rect width="4" height="1" fill="rgba(0,0,0,0.28)" />
        </pattern>
        <filter id={uid + '-b'} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>

      {/* backdrop */}
      <rect x="0" y="0" width="100" height="100" fill="#0a1512" />
      <rect x="0" y="0" width="100" height="100" fill={'url(#' + uid + '-g)'} />
      <g stroke="rgba(126,240,212,0.05)" strokeWidth="0.5">
        <line x1="0" y1="25" x2="100" y2="25" />
        <line x1="0" y1="50" x2="100" y2="50" />
        <line x1="0" y1="75" x2="100" y2="75" />
        <line x1="50" y1="0" x2="50" y2="100" />
      </g>

      {/* bust */}
      <polygon points={g.shoulderPts} fill="#132420" stroke="rgba(126,240,212,0.35)" strokeWidth="0.6" />
      <polygon points={g.neckPts} fill="#0f1d18" />
      <polyline points={g.collarPts} fill="none" stroke="rgba(126,240,212,0.28)" strokeWidth="0.6" />
      <polygon points={g.headPts} fill="#1c2f28" stroke="rgba(126,240,212,0.45)" strokeWidth="0.6" />
      <polyline
        points={g.rimPts}
        fill="none"
        stroke="rgba(232,251,242,0.4)"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      {g.crestPts && <polygon points={g.crestPts} fill="#152622" stroke="rgba(126,240,212,0.25)" strokeWidth="0.5" />}
      {g.antenna && (
        <g>
          <line
            x1={g.antenna.x1}
            y1={g.antenna.y1}
            x2={g.antenna.x2}
            y2={g.antenna.y2}
            stroke="rgba(126,240,212,0.4)"
            strokeWidth="0.7"
          />
          <circle cx={g.antenna.dot[0]} cy={g.antenna.dot[1]} r="1.1" fill={op.accent} opacity="0.9" />
        </g>
      )}

      {/* visor: soft glow pass then crisp pass */}
      {g.visorStyle === 1 ? (
        <g>
          <g filter={'url(#' + uid + '-b)'} opacity="0.8">
            <rect x={g.slitL.x} y={g.slitL.y} width={g.slitL.w} height={g.slitL.h} fill={op.accent} />
            <rect x={g.slitR.x} y={g.slitR.y} width={g.slitR.w} height={g.slitR.h} fill={op.accent} />
          </g>
          <rect x={g.slitL.x} y={g.slitL.y} width={g.slitL.w} height={g.slitL.h} fill={'url(#' + uid + '-v)'} />
          <rect x={g.slitR.x} y={g.slitR.y} width={g.slitR.w} height={g.slitR.h} fill={'url(#' + uid + '-v)'} />
        </g>
      ) : (
        <g>
          <polygon points={g.visorPts} fill={op.accent} filter={'url(#' + uid + '-b)'} opacity="0.7" />
          <polygon points={g.visorPts} fill={'url(#' + uid + '-v)'} opacity={g.visorStyle === 2 ? 0.6 : 1} />
          {g.visorStyle === 2 && <circle cx="50" cy="46" r="1.4" fill={op.accent} opacity="0.9" />}
        </g>
      )}

      {/* facet lines */}
      <g stroke="rgba(255,255,255,0.1)" strokeWidth="0.5">
        {g.facets.map((f, i) => (
          <line key={i} x1={f[0]} y1={f[1]} x2={f[2]} y2={f[3]} />
        ))}
      </g>
      <polyline points={g.edge} fill="none" stroke={op.accent} strokeWidth="0.5" opacity="0.35" />
      <polyline points={g.chestPts} fill="none" stroke={op.accent} strokeWidth="0.8" opacity="0.55" />

      {/* scanline texture */}
      <rect x="0" y="0" width="100" height="100" fill={'url(#' + uid + '-s)'} opacity="0.35" />

      {/* barcode strip + serial */}
      <g fill="rgba(184,216,207,0.55)">
        {g.bars.map((b, i) => (
          <rect key={i} x={b.x} y={88} width={b.w} height={7} />
        ))}
      </g>
      <text
        x="92"
        y="94"
        textAnchor="end"
        fontSize="4.2"
        fontFamily="inherit"
        fill="rgba(93,125,117,0.9)"
        letterSpacing="0.6"
      >
        {g.serial}
      </text>

      {/* frame */}
      <rect x="0.5" y="0.5" width="99" height="99" fill="none" stroke="rgba(126,240,212,0.16)" strokeWidth="1" />
      <g stroke="rgba(126,240,212,0.55)" strokeWidth="1" fill="none">
        <path d="M1 8V1h7" />
        <path d="M92 1h7v7" />
        <path d="M99 92v7h-7" />
        <path d="M8 99H1v-7" />
      </g>
      <circle cx="92" cy="7" r="1.6" fill={op.accent} className="pp-live" />
    </svg>
  )
}
