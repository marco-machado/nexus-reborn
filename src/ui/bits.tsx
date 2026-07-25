// Shared UI atoms (panel chrome, chips, bars) and small SVG glyphs used by
// the screens and the HUD. Everything is drawn in code; no external assets.
import type { ReactNode } from 'react'
import type { AgentRole, WeaponId } from '../game/types'

/* ------------------------------- utilities ------------------------------- */

export function fmt(n: number): string {
  return n.toLocaleString('en-US')
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function hashOf(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function rngFrom(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

/* --------------------------------- atoms --------------------------------- */

export function Panel(props: {
  title?: ReactNode
  right?: ReactNode
  className?: string
  bodyClassName?: string
  children?: ReactNode
}) {
  return (
    <section className={'panel corners' + (props.className ? ' ' + props.className : '')}>
      {props.title != null && (
        <header className="panel-head">
          <span className="panel-title">{props.title}</span>
          {props.right != null && <span className="panel-right">{props.right}</span>}
        </header>
      )}
      <div className={'panel-body' + (props.bodyClassName ? ' ' + props.bodyClassName : '')}>
        {props.children}
      </div>
    </section>
  )
}

export type ChipTone = 'teal' | 'amber' | 'red' | 'green' | 'dim'

export function Chip(props: { children: ReactNode; tone?: ChipTone; className?: string }) {
  return (
    <span
      className={
        'chip' + (props.tone ? ' ' + props.tone : '') + (props.className ? ' ' + props.className : '')
      }
    >
      {props.children}
    </span>
  )
}

export function SegBar(props: {
  value: number
  tone?: 'amber' | 'red' | 'green'
  mini?: boolean
  className?: string
}) {
  const v = Math.max(0, Math.min(100, props.value))
  return (
    <div
      className={
        'segbar' +
        (props.tone ? ' ' + props.tone : '') +
        (props.mini ? ' mini' : '') +
        (props.className ? ' ' + props.className : '')
      }
    >
      <i style={{ width: v + '%' }} />
    </div>
  )
}

/* ------------------------------ gun silhouettes --------------------------- */

export function GunSilhouette(props: { weapon: WeaponId; className?: string }) {
  return (
    <svg
      viewBox="0 0 120 40"
      className={'gun-svg' + (props.className ? ' ' + props.className : '')}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <g fill="currentColor">{gunShape(props.weapon)}</g>
    </svg>
  )
}

function gunShape(id: WeaponId): ReactNode {
  switch (id) {
    case 'assault':
      return (
        <>
          <polygon points="4,21 16,19 16,27 6,29" />
          <polygon points="16,17 64,17 64,26 16,26" />
          <polygon points="20,14 58,14 58,17 20,17" />
          <polygon points="28,10 31,10 31,14 28,14" />
          <polygon points="50,11 53,11 53,14 50,14" />
          <polygon points="30,26 38,26 35,36 28,36" />
          <polygon points="44,26 54,26 51,38 42,38" />
          <polygon points="58,26 70,26 70,30 58,30" />
          <polygon points="64,19 98,19 98,23 64,23" />
          <polygon points="98,17 104,17 104,24 98,24" />
        </>
      )
    case 'smg':
      return (
        <>
          <polygon points="6,17 16,17 16,20 8,20" />
          <polygon points="6,17 8,17 8,30 6,30" />
          <polygon points="16,15 60,15 60,26 16,26" />
          <polygon points="20,12 52,12 52,15 20,15" />
          <polygon points="46,26 54,26 51,36 43,36" />
          <polygon points="30,26 40,26 37,40 28,40" />
          <polygon points="20,26 27,26 25,33 19,33" />
          <polygon points="60,18 78,18 78,22 60,22" />
          <polygon points="78,16 96,16 96,24 78,24" />
        </>
      )
    case 'pistol':
      return (
        <>
          <polygon points="28,12 72,12 72,20 28,20" />
          <polygon points="24,14 28,14 28,18 24,18" />
          <polygon points="30,9 33,9 33,12 30,12" />
          <polygon points="30,20 68,20 68,24 30,24" />
          <polygon points="54,24 68,24 62,40 48,40" />
          <polygon points="40,24 44,24 44,31 38,31 38,28 40,28" />
        </>
      )
    case 'shotgun':
      return (
        <>
          <polygon points="4,17 16,19 16,28 4,31" />
          <polygon points="16,17 56,17 56,26 16,26" />
          <polygon points="34,26 42,26 38,35 31,35" />
          <polygon points="56,18 100,18 100,22 56,22" />
          <polygon points="56,23 92,23 92,26 56,26" />
          <polygon points="60,26 76,26 76,31 60,31" />
          <polygon points="100,16 103,16 103,19 100,19" />
        </>
      )
    case 'longrifle':
      return (
        <>
          <polygon points="4,20 18,18 18,28 4,30" />
          <polygon points="8,15 18,15 18,18 8,18" />
          <polygon points="18,19 72,19 72,25 18,25" />
          <polygon points="36,8 62,8 62,14 36,14" />
          <polygon points="42,14 45,14 45,19 42,19" />
          <polygon points="54,14 57,14 57,19 54,19" />
          <polygon points="34,25 42,25 38,35 31,35" />
          <polygon points="46,25 54,25 52,32 45,32" />
          <polygon points="72,20 110,20 110,23 72,23" />
          <polygon points="110,18 116,18 116,25 110,25" />
          <polygon points="76,23 79,23 75,34 73,34" />
          <polygon points="84,23 87,23 90,34 88,34" />
        </>
      )
  }
}

/* --------------------------------- glyphs -------------------------------- */

export function RoleGlyph(props: { role: AgentRole; size?: number }) {
  const size = props.size ?? 16
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className="glyph" aria-hidden="true">
      {roleShape(props.role)}
    </svg>
  )
}

function roleShape(role: AgentRole): ReactNode {
  switch (role) {
    case 'assault':
      return (
        <g fill="currentColor">
          <circle cx="8" cy="6.4" r="4.6" />
          <rect x="5.4" y="10.2" width="5.2" height="3.4" />
          <circle cx="6.2" cy="6" r="1.3" fill="#07100e" />
          <circle cx="9.8" cy="6" r="1.3" fill="#07100e" />
          <rect x="6.7" y="10.8" width="0.8" height="2.2" fill="#07100e" />
          <rect x="8.5" y="10.8" width="0.8" height="2.2" fill="#07100e" />
        </g>
      )
    case 'recon':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="8" cy="8" r="4.6" />
          <path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3" />
          <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
        </g>
      )
    case 'infiltrator':
      return (
        <g>
          <path d="M8 1.5 14.5 8 8 14.5 1.5 8Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M8 5 11 8 8 11 5 8Z" fill="currentColor" />
        </g>
      )
    case 'demolitions':
      return (
        <path
          fill="currentColor"
          d="M8 1 9.6 5.2 13.8 3.4 11.4 7.2 15 8.6 10.9 9.5 12.6 13.6 8.8 10.9 7.4 15 6.5 10.6 2.4 12.4 5 8.7 1 7.4 5.3 6.4 3.5 2.4Z"
        />
      )
    case 'sniper':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.1">
          <circle cx="8" cy="8" r="5" />
          <path d="M8 0.8v4M8 11.2v4M0.8 8h4M11.2 8h4" />
          <circle cx="8" cy="8" r="0.9" fill="currentColor" stroke="none" />
        </g>
      )
    case 'tech':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.1">
          <rect x="4" y="4" width="8" height="8" />
          <rect x="6.4" y="6.4" width="3.2" height="3.2" fill="currentColor" stroke="none" />
          <path d="M6 4V1.6M10 4V1.6M6 14.4V12M10 14.4V12M4 6H1.6M4 10H1.6M14.4 6H12M14.4 10H12" />
        </g>
      )
    case 'support':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="2.5" y="5" width="11" height="8.5" />
          <path d="M5.5 5V2.8h5V5" />
          <path d="M5.8 9.2h4.4M8 7v4.4" strokeWidth="1.4" />
        </g>
      )
    case 'medic':
      return (
        <path
          fill="currentColor"
          d="M6.2 1.8h3.6v4.4h4.4v3.6H9.8v4.4H6.2V9.8H1.8V6.2h4.4Z"
        />
      )
  }
}

export type AbilityKind = 'grenade' | 'shield' | 'dash' | 'scan' | 'flame'

export function AbilityGlyph(props: { kind: AbilityKind; size?: number }) {
  const size = props.size ?? 18
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className="glyph" aria-hidden="true">
      {abilityShape(props.kind)}
    </svg>
  )
}

function abilityShape(kind: AbilityKind): ReactNode {
  switch (kind) {
    case 'grenade':
      return (
        <g fill="currentColor">
          <rect x="6" y="7" width="8" height="10" rx="2" />
          <rect x="8" y="4" width="4" height="3" />
          <circle cx="14.4" cy="4.2" r="2" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <rect x="8.8" y="9" width="2.4" height="1" fill="#07100e" />
        </g>
      )
    case 'shield':
      return (
        <g>
          <path d="M10 1.8 17 4.8v6L10 18.2 3 10.8v-6Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d="M10 5.2 13.6 6.8v3.4L10 14 6.4 10.2V6.8Z" fill="currentColor" />
        </g>
      )
    case 'dash':
      return (
        <g fill="currentColor">
          <polygon points="3,4 9,10 3,16 6,16 12,10 6,4" />
          <polygon points="9,4 15,10 9,16 12,16 18,10 12,4" />
        </g>
      )
    case 'scan':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="10" cy="10" r="6.6" />
          <path d="M10 10 15.2 5.6" />
          <circle cx="10" cy="10" r="1" fill="currentColor" stroke="none" />
          <circle cx="13" cy="12.6" r="1" fill="currentColor" stroke="none" />
          <path d="M10 3.4v-2M10 18.6v-2M3.4 10h-2M18.6 10h-2" strokeWidth="0.9" />
        </g>
      )
    case 'flame':
      return (
        <path
          fill="currentColor"
          d="M10 1.6 13 6.6 12.2 9.4 15.4 8.2 14.4 13.4 10 18.4 5.6 13.4 4.6 8.2 7.8 9.4 7 6.6Z"
        />
      )
  }
}

export type ItemKind = 'med' | 'cell' | 'frag' | 'chip'

export function ItemGlyph(props: { kind: ItemKind; size?: number }) {
  const size = props.size ?? 14
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className="glyph" aria-hidden="true">
      {itemShape(props.kind)}
    </svg>
  )
}

function itemShape(kind: ItemKind): ReactNode {
  switch (kind) {
    case 'med':
      return (
        <g>
          <rect x="1.6" y="3" width="12.8" height="10.4" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <path d="M6.8 5.4h2.4v2h2v2.4h-2v2H6.8v-2h-2V7.4h2Z" fill="currentColor" />
        </g>
      )
    case 'cell':
      return (
        <g>
          <rect x="4" y="2.6" width="8" height="11" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <polygon points="9.4,4.4 6.4,8.6 8.2,8.6 6.8,12 10.2,7.6 8.4,7.6" fill="currentColor" />
        </g>
      )
    case 'frag':
      return (
        <g fill="currentColor">
          <circle cx="8" cy="9.4" r="4.2" />
          <rect x="6.6" y="2.6" width="2.8" height="2.4" />
          <path d="M5 9.4h6" stroke="#07100e" strokeWidth="0.9" />
        </g>
      )
    case 'chip':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1">
          <rect x="4.4" y="4.4" width="7.2" height="7.2" />
          <rect x="6.8" y="6.8" width="2.4" height="2.4" fill="currentColor" stroke="none" />
          <path d="M6 4.4V2M10 4.4V2M6 14v-2.4M10 14v-2.4M4.4 6H2M4.4 10H2M14 6h-2.4M14 10h-2.4" />
        </g>
      )
  }
}

export function LockGlyph(props: { size?: number }) {
  const size = props.size ?? 10
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 12 14" className="glyph" aria-hidden="true">
      <path d="M3.4 6V4.6a2.6 2.6 0 0 1 5.2 0V6" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <rect x="2" y="6" width="8" height="6.4" fill="currentColor" />
    </svg>
  )
}

export function SkullGlyph(props: { size?: number }) {
  const size = props.size ?? 20
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className="glyph" aria-hidden="true">
      <g fill="currentColor">
        <path d="M10 1.6c4 0 6.6 2.6 6.6 6.2 0 2-1 3.6-2.4 4.6v2H5.8v-2C4.4 11.4 3.4 9.8 3.4 7.8 3.4 4.2 6 1.6 10 1.6Z" />
        <rect x="6.4" y="14.8" width="7.2" height="3.4" />
      </g>
      <circle cx="7" cy="8" r="1.7" fill="#140505" />
      <circle cx="13" cy="8" r="1.7" fill="#140505" />
      <path d="M10 10.2 9 12.4h2Z" fill="#140505" />
      <path d="M8.2 15v3M10 15v3M11.8 15v3" stroke="#140505" strokeWidth="0.9" />
    </svg>
  )
}

export function TargetGlyph(props: { size?: number }) {
  const size = props.size ?? 14
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className="glyph" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.1">
        <circle cx="8" cy="8" r="4.8" />
        <path d="M8 0.8v3M8 12.2v3M0.8 8h3M12.2 8h3" />
      </g>
      <circle cx="8" cy="8" r="1.4" fill="currentColor" />
    </svg>
  )
}

export function HexGlyph(props: { size?: number }) {
  const size = props.size ?? 12
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" className="glyph" aria-hidden="true">
      <path d="M7 1.2 12.2 4.1v5.8L7 12.8 1.8 9.9V4.1Z" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="7" cy="7" r="1.6" fill="currentColor" />
    </svg>
  )
}
