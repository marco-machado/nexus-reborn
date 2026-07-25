// DOM screens: MainMenu, WorldMap, MissionBrief, TeamSelect, Debrief.
// Flow: menu -> world -> brief -> team -> mission -> debrief -> world.
import './ui.css'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useAppStore } from '../state/appStore'
import { MISSIONS, ROSTER, WEAPONS, missionById, operativeById } from '../game/data'
import type { AgentRole, MissionDef } from '../game/types'
import {
  Panel,
  Chip,
  SegBar,
  GunSilhouette,
  RoleGlyph,
  ItemGlyph,
  LockGlyph,
  SkullGlyph,
  TargetGlyph,
  HexGlyph,
} from './bits'
import { fmt, pad2, hashOf, rngFrom } from './util'
import { Portrait } from './portrait'
import { uiClick, unlockAudio } from './sound'

/* -------------------------------- helpers -------------------------------- */

function act(fn: () => void): () => void {
  return () => {
    uiClick()
    fn()
  }
}

function utcNow(): string {
  const d = new Date()
  return pad2(d.getUTCHours()) + ':' + pad2(d.getUTCMinutes()) + ':' + pad2(d.getUTCSeconds())
}

function useUtcClock(): string {
  const [t, setT] = useState(() => utcNow())
  useEffect(() => {
    const id = window.setInterval(() => setT(utcNow()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return t
}

const ROLE_LABEL: Record<AgentRole, string> = {
  assault: 'ASSAULT',
  recon: 'RECON',
  infiltrator: 'INFILTRATOR',
  demolitions: 'DEMOLITIONS',
  sniper: 'SNIPER',
  tech: 'TECH SPECIALIST',
  support: 'SUPPORT',
  medic: 'MEDIC',
}

function statusTone(status: 'READY' | 'INJURED' | 'ON MISSION'): string {
  if (status === 'READY') return 'teal'
  if (status === 'INJURED') return 'red'
  return 'amber'
}

/* ================================ MAIN MENU =============================== */

export function MainMenu() {
  const goto = useAppStore((s) => s.goto)
  const clock = useUtcClock()

  useEffect(() => {
    const unlock = () => unlockAudio()
    document.addEventListener('click', unlock, { once: true })
    return () => document.removeEventListener('click', unlock)
  }, [])

  return (
    <div className="screen menu">
      <div className="menu-gridbg" aria-hidden="true" />
      <div className="menu-scanbar" aria-hidden="true" />
      <header className="menu-top">
        <div className="menu-boot">
          <div>SYS:GN-7A // BOOT SEQUENCE COMPLETE</div>
          <div>PRT:ON | SEC:LVL 3 | UPLINK EU-4 STRONG</div>
          <div className="dim">
            AWAITING OPERATOR<span className="cursor">_</span>
          </div>
        </div>
        <div className="menu-clock">{clock} UTC</div>
      </header>
      <div className="menu-center">
        <div className="menu-rule" aria-hidden="true" />
        <h1 className="menu-wordmark">SYNDICATE</h1>
        <div className="menu-tagline">CORPORATE GEOSTRATEGIC COMMAND INTERFACE</div>
        <div className="menu-rule" aria-hidden="true" />
        <button type="button" className="cta menu-cta" onClick={act(() => goto('world'))}>
          <span className="cta-inner">&lt;&lt; INITIATE &gt;&gt;</span>
        </button>
      </div>
      <footer className="menu-foot">
        <span>VER 7.2.1 // BUILD 2087.05.14</span>
        <span className="dim">UNAUTHORIZED ACCESS IS A CLASS-1 CORPORATE OFFENSE</span>
        <span>USER: OPS_DIRECTOR // CLEARANCE: EXECUTIVE</span>
      </footer>
    </div>
  )
}

/* ================================ WORLD MAP =============================== */

interface SectorRow {
  name: string
  pct: number
  control: number
  unrest: number
  sel?: boolean
  locked?: boolean
}

const SECTORS: SectorRow[] = [
  { name: 'NORTH AMERICA', pct: 68, control: 68, unrest: 12 },
  { name: 'SOUTH AMERICA', pct: 41, control: 41, unrest: 24 },
  { name: 'EUROPE', pct: 62, control: 62, unrest: 18, sel: true },
  { name: 'AFRICA', pct: 37, control: 37, unrest: 28 },
  { name: 'ASIA', pct: 55, control: 55, unrest: 16 },
  { name: 'OCEANIA', pct: 73, control: 73, unrest: 9 },
  { name: 'ANTARCTICA', pct: 0, control: 0, unrest: 0, locked: true },
]

const SECTOR_GLYPHS: Record<string, string> = {
  'NORTH AMERICA': '1,4 6,1 12,2 16,5 14,8 10,9 8,13 5,10 2,7',
  'SOUTH AMERICA': '8,1 12,3 13,7 10,13 7,15 6,9 5,4',
  EUROPE: '2,8 5,4 9,1 13,3 16,6 12,9 8,10 4,11',
  AFRICA: '4,2 10,1 14,4 13,9 9,15 6,10 3,6',
  ASIA: '1,6 6,2 13,1 20,3 21,6 16,9 11,12 6,9',
  OCEANIA: '3,6 8,3 14,4 17,8 13,12 6,11',
  ANTARCTICA: '2,10 6,7 12,6 18,8 20,12 14,14 6,13',
}

// Low poly landmass polygons on a 1000x520 plate.
const EURO_PTS =
  '470,158 488,138 504,124 518,112 540,94 562,78 586,88 612,104 642,120 652,140 630,154 600,164 574,174 552,180 528,178 506,180 488,182 476,176'
const UK_PTS = '484,106 500,98 506,118 492,126 482,118'

const WORLD_LAND: Array<{ k: string; pts: string; cls: string }> = [
  {
    k: 'na',
    cls: 'tint-a',
    pts: '40,78 92,54 148,66 205,92 252,88 302,104 344,118 332,148 300,158 286,184 280,214 256,224 232,236 216,252 200,236 176,206 150,176 120,140 86,118 56,100',
  },
  { k: 'gl', cls: 'tint-dim', pts: '300,56 342,44 366,72 342,98 306,88' },
  {
    k: 'sa',
    cls: 'tint-b',
    pts: '286,268 320,262 352,284 396,308 406,338 386,378 356,418 330,458 312,490 300,470 294,430 284,388 274,344 270,304',
  },
  { k: 'eu', cls: 'tint-c', pts: EURO_PTS },
  { k: 'uk', cls: 'tint-c', pts: UK_PTS },
  {
    k: 'af',
    cls: 'tint-b',
    pts: '478,196 512,186 546,190 586,200 612,216 640,264 630,300 602,330 586,368 570,404 556,428 540,404 526,368 514,330 504,300 490,264 478,230',
  },
  {
    k: 'as',
    cls: 'tint-a',
    pts: '652,138 664,110 700,84 762,64 832,58 902,58 962,70 976,90 950,114 920,130 890,150 862,170 840,190 820,206 800,216 786,240 770,256 750,240 736,262 720,282 706,254 694,228 670,214 648,208 630,194 626,174 636,154',
  },
  { k: 'ar', cls: 'tint-b', pts: '606,204 640,202 658,234 636,256 612,242' },
  { k: 'jp', cls: 'tint-a', pts: '902,142 912,136 918,152 908,168 898,158' },
  { k: 'id1', cls: 'tint-b', pts: '780,286 812,292 824,304 800,308 776,296' },
  { k: 'id2', cls: 'tint-b', pts: '836,300 862,306 852,318 830,312' },
  {
    k: 'au',
    cls: 'tint-c',
    pts: '814,368 846,348 882,344 912,364 926,394 916,424 890,440 858,434 834,418 818,394',
  },
  { k: 'nz', cls: 'tint-dim', pts: '946,442 960,452 954,470 942,458' },
  { k: 'an', cls: 'tint-dim', pts: '60,508 200,498 400,492 600,496 800,492 950,500 950,518 60,518' },
]

const HOTSPOTS: Array<{ x: number; y: number; t: 'teal' | 'amber' | 'red' }> = [
  { x: 272, y: 148, t: 'teal' },
  { x: 155, y: 172, t: 'teal' },
  { x: 298, y: 288, t: 'amber' },
  { x: 380, y: 372, t: 'teal' },
  { x: 494, y: 114, t: 'amber' },
  { x: 506, y: 134, t: 'teal' },
  { x: 540, y: 120, t: 'teal' },
  { x: 590, y: 204, t: 'teal' },
  { x: 516, y: 284, t: 'red' },
  { x: 624, y: 104, t: 'teal' },
  { x: 830, y: 150, t: 'teal' },
  { x: 905, y: 154, t: 'amber' },
  { x: 918, y: 412, t: 'teal' },
  { x: 558, y: 398, t: 'teal' },
  { x: 712, y: 242, t: 'teal' },
]

const ARCS: Array<{ d: string; a?: boolean }> = [
  { d: 'M272,148 Q380,60 494,114' },
  { d: 'M494,114 Q560,90 624,104' },
  { d: 'M506,134 Q548,170 590,204' },
  { d: 'M624,104 Q730,90 830,150' },
  { d: 'M830,150 Q874,270 918,412' },
  { d: 'M298,288 Q340,330 380,372' },
  { d: 'M155,172 Q210,240 298,288' },
  { d: 'M590,204 Q660,240 712,242' },
  { d: 'M272,148 Q400,100 506,134', a: true },
  { d: 'M506,134 Q640,160 830,150', a: true },
]

const OP_META: Record<string, { chance: number; eta: string }> = {
  m01: { chance: 78, eta: '2D' },
  m02: { chance: 64, eta: '4D' },
  m03: { chance: 82, eta: '3D' },
}

const CONTROL_KEY: Array<{ c: string; n: string }> = [
  { c: '#59d6c9', n: 'STRATOS INDUSTRIES' },
  { c: '#7de08a', n: 'NEXUS GLOBAL' },
  { c: '#f0b445', n: 'HELIX CORP' },
  { c: '#5d7d75', n: 'OMNICORP' },
  { c: '#e04b3c', n: 'CONTESTED' },
]

function WorldSvg() {
  const xs: number[] = []
  for (let x = 100; x < 1000; x += 100) xs.push(x)
  const ys: number[] = []
  for (let y = 74; y < 520; y += 74) ys.push(y)
  return (
    <svg className="wm-map-svg" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
      <rect x="0" y="0" width="1000" height="520" fill="#03080a" />
      <rect x="0" y="0" width="1000" height="520" fill="url(#wm-glow)" />
      <defs>
        <radialGradient id="wm-glow" cx="0.5" cy="0.42" r="0.75">
          <stop offset="0" stopColor="#0e2c26" stopOpacity="0.5" />
          <stop offset="1" stopColor="#0e2c26" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className="wm-grat">
        {xs.map((x) => (
          <line key={'x' + x} x1={x} y1={0} x2={x} y2={520} />
        ))}
        {ys.map((y) => (
          <line key={'y' + y} x1={0} y1={y} x2={1000} y2={y} />
        ))}
        <line className="strong" x1={0} y1={286} x2={1000} y2={286} />
      </g>
      <g className="wm-land-g">
        {WORLD_LAND.map((c) => (
          <polygon key={c.k} className={'wm-land ' + c.cls} points={c.pts} />
        ))}
      </g>
      <g className="wm-arcs">
        {ARCS.map((a, i) => (
          <path key={i} className={a.a ? 'amber' : undefined} d={a.d} />
        ))}
      </g>
      <g>
        {HOTSPOTS.map((hs, i) => (
          <g key={i} className={'wm-dot ' + hs.t}>
            <circle cx={hs.x} cy={hs.y} r="6" className="halo" />
            <circle cx={hs.x} cy={hs.y} r="1.8" className="core" />
          </g>
        ))}
      </g>
    </svg>
  )
}

export function WorldMap() {
  const selectMission = useAppStore((s) => s.selectMission)
  const credits = useAppStore((s) => s.credits)
  const clock = useUtcClock()
  const openOps = MISSIONS.filter((m) => !m.locked).length

  return (
    <div className="screen wm">
      <header className="wm-head">
        <div>
          <h1 className="screen-title">WORLD NETWORK</h1>
          <div className="screen-sub">CORPORATE GEOSTRATEGIC COMMAND INTERFACE</div>
        </div>
        <div className="wm-head-right">
          <Chip tone="dim">SYS:GN-7A</Chip>
          <Chip tone="dim">PRT:ON</Chip>
          <Chip tone="dim">SEC:LVL 3</Chip>
          <Chip tone="teal">NETWORK UPLINK: STRONG</Chip>
          <Chip tone="dim">COORD 48.8566N 2.3522E</Chip>
        </div>
      </header>

      <div className="wm-main">
        {/* left: influence + sectors */}
        <aside className="wm-left">
          <Panel title="GLOBAL INFLUENCE" right={<b className="teal">54.7%</b>}>
            <SegBar value={54.7} />
            <div className="axis">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </Panel>
          <Panel title="CONTINENTAL SECTORS" right={<span className="dim">7 / 7</span>} className="wm-sectors" bodyClassName="wm-sectors-body scroll">
            {SECTORS.map((sec) => (
              <div
                key={sec.name}
                className={'wm-sector' + (sec.sel ? ' sel' : '') + (sec.locked ? ' locked' : '')}
              >
                <span className="wm-sector-glyph">
                  <svg viewBox="0 0 22 16" aria-hidden="true">
                    <polygon points={SECTOR_GLYPHS[sec.name]} />
                  </svg>
                </span>
                <span className="wm-sector-main">
                  <b>{sec.name}</b>
                  {sec.locked ? (
                    <i className="dim">
                      CONTROL --- <span className="pad" /> UNREST ---
                    </i>
                  ) : (
                    <i className="dim">
                      CONTROL {sec.control}% <span className="pad" /> UNREST {sec.unrest}%
                    </i>
                  )}
                </span>
                <span className="wm-sector-side">
                  {sec.locked ? (
                    <span className="wm-sector-lock">
                      <LockGlyph size={11} />
                    </span>
                  ) : (
                    <b className="wm-sector-pct">{sec.pct}%</b>
                  )}
                  <SegBar value={sec.locked ? 0 : sec.unrest * 2.4} tone="red" mini className="wm-unrest" />
                </span>
                {sec.sel && <span className="wm-sector-chev">&gt;</span>}
              </div>
            ))}
          </Panel>
        </aside>

        {/* center: world plate + mission markers */}
        <section className="wm-center corners">
          <div className="wm-map-wrap">
            <div className="wm-map">
              <WorldSvg />
              {MISSIONS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={'wm-marker' + (m.locked ? ' locked' : ' live')}
                  style={{ left: m.mapPos.x + '%', top: m.mapPos.y + '%' }}
                  disabled={m.locked}
                  onClick={m.locked ? undefined : act(() => selectMission(m.id))}
                >
                  {!m.locked && <span className="wm-marker-ring" aria-hidden="true" />}
                  <span className="wm-marker-core" aria-hidden="true" />
                  <span className="wm-marker-label">
                    {m.locked && <LockGlyph size={8} />}
                    {m.codename}
                  </span>
                </button>
              ))}
              <div className="wm-ov tl">
                <b>ORBITAL SCAN</b>
                <span className="dim">SAT-16E // LIVE FEED</span>
                <svg viewBox="0 0 70 16" className="wm-spark" aria-hidden="true">
                  <polyline points="0,12 8,10 16,13 24,7 32,9 40,4 48,8 56,3 64,6 70,4" />
                </svg>
              </div>
              <div className="wm-ov bl red-line">
                <b>THREAT LEVEL</b>
                <span className="red blink">ELEVATED</span>
              </div>
              <div className="wm-ov br">
                <b>CONTROL KEY</b>
                {CONTROL_KEY.map((k) => (
                  <span key={k.n} className="wm-key-row">
                    <i style={{ background: k.c }} />
                    {k.n}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* right: focused sector + operations */}
        <aside className="wm-right">
          <Panel title="EUROPEAN SECTOR" right={<Chip tone="amber">FOCUS</Chip>}>
            <div className="wm-euro corners">
              <svg viewBox="440 60 240 150" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                <rect x="440" y="60" width="240" height="150" fill="#0c0903" />
                <g className="wm-euro-grid">
                  <line x1="440" y1="110" x2="680" y2="110" />
                  <line x1="440" y1="160" x2="680" y2="160" />
                  <line x1="520" y1="60" x2="520" y2="210" />
                  <line x1="600" y1="60" x2="600" y2="210" />
                </g>
                <polygon className="wm-euro-land" points={EURO_PTS} />
                <polygon className="wm-euro-land" points={UK_PTS} />
                <g className="wm-euro-dots">
                  <circle cx="494" cy="114" r="2.2" />
                  <circle cx="506" cy="134" r="1.6" />
                  <circle cx="540" cy="120" r="1.6" />
                  <circle cx="561" cy="168" r="1.3" />
                </g>
              </svg>
              <span className="wm-euro-chev l">&lt;</span>
              <span className="wm-euro-chev r">&gt;</span>
            </div>
            <div className="wm-cu">
              <div>
                <label>CONTROL</label>
                <b className="amber">62%</b>
                <SegBar value={62} tone="amber" mini />
              </div>
              <div>
                <label>UNREST</label>
                <b className="red">18%</b>
                <SegBar value={18} tone="red" mini />
              </div>
            </div>
            <div className="kv">
              <span>TAX YIELD (WEEKLY)</span>
              <b>2.47B CR</b>
            </div>
            <div className="kv">
              <span>INFLUENCE INCOME</span>
              <b className="teal">+1.23B</b>
            </div>
            <div className="kv">
              <span>BLACK MARKET IMPACT</span>
              <b className="red">-0.18B</b>
            </div>
            <div className="kv">
              <span>GARRISON STATUS</span>
              <b className="teal">SECURE</b>
            </div>
            <div className="kv">
              <span>DEFENSE RATING</span>
              <SegBar value={74} tone="green" mini className="wm-defense" />
            </div>
          </Panel>
          <Panel
            title="AVAILABLE OPERATIONS"
            right={<span className="dim">{openOps} / {MISSIONS.length}</span>}
            className="wm-ops"
            bodyClassName="wm-ops-body"
          >
            {MISSIONS.map((m) => {
              const meta = OP_META[m.id] ?? { chance: 70, eta: '2D' }
              return (
                <button
                  key={m.id}
                  type="button"
                  className={'wm-op' + (m.locked ? ' locked' : '')}
                  disabled={m.locked}
                  onClick={m.locked ? undefined : act(() => selectMission(m.id))}
                >
                  <span className="wm-op-glyph">{m.locked ? <LockGlyph /> : <TargetGlyph />}</span>
                  <span className="wm-op-main">
                    <b>{m.codename}</b>
                    {m.locked ? (
                      <i className="red-dim">REQUIRES INTEL LVL 2</i>
                    ) : (
                      <i className="dim">
                        {m.type} // {m.city}
                      </i>
                    )}
                  </span>
                  <span className="wm-op-meta">
                    <span className="chip dim">
                      CHANCE {meta.chance}%
                    </span>
                    <span className="chip dim">ETA {meta.eta}</span>
                  </span>
                </button>
              )
            })}
            <button type="button" className="btn wide" disabled>
              VIEW SECTOR INTEL &gt;
            </button>
          </Panel>
        </aside>
      </div>

      {/* bottom strip */}
      <div className="wm-bottom">
        <Panel title="TIME CODE" className="wm-time">
          <div className="wm-date">2087.05.14</div>
          <div className="wm-clock">{clock} UTC</div>
        </Panel>
        <Panel title="GLOBAL EVENTS FEED" right={<span className="red">3 UNREAD</span>} className="wm-feed">
          <div className="wm-feed-line red">14:28 RIOTS REPORTED IN CAIRO</div>
          <div className="wm-feed-line green">14:11 NEXUS GLOBAL TAKES CONTROL OF BOGOTA</div>
          <div className="wm-feed-line dim">13:47 HELIX CORP SECURES TRADE AGREEMENT IN OSLO</div>
        </Panel>
        <Panel title="RESOURCE POOL" className="wm-pool">
          <div className="kv">
            <span>CREDITS</span>
            <b className="teal">{fmt(credits)} CR</b>
          </div>
          <div className="kv">
            <span>INFLUENCE</span>
            <b>2,450</b>
          </div>
          <div className="kv">
            <span>OPERATIVES</span>
            <b>
              {ROSTER.length} / 120
            </b>
          </div>
          <div className="kv">
            <span>INTEL LEVEL</span>
            <SegBar value={25} mini className="wm-intel" />
          </div>
        </Panel>
      </div>

      {/* nav tabs */}
      <nav className="wm-nav">
        <button type="button" className="wm-tab active">
          WORLD MAP
        </button>
        <button type="button" className="wm-tab" disabled>
          BRIEFING
        </button>
        <button type="button" className="wm-tab" disabled>
          RESEARCH
        </button>
        <button type="button" className="wm-tab" disabled>
          OPERATIVES
        </button>
        <button type="button" className="wm-tab" disabled>
          ARCHIVES
        </button>
      </nav>
    </div>
  )
}

/* =============================== MISSION BRIEF ============================ */

interface Block {
  x: number
  y: number
  w: number
  h: number
}

function buildRecon(seed: number): { blocks: Block[]; tac: Block[] } {
  const r = rngFrom(seed >>> 0)
  const blocks: Block[] = []
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 7; col++) {
      if (r() < 0.16) continue
      const x = 20 + col * 86 + r() * 22
      const y = 46 + row * 72 + r() * 16
      const w = 30 + r() * 30
      const h = 24 + r() * 26
      if (x + w > 262 && x < 396 && y + h > 86 && y < 214) continue
      blocks.push({ x, y, w, h })
    }
  }
  const tac: Block[] = []
  for (let i = 0; i < 44; i++) {
    tac.push({ x: 8 + r() * 410, y: 12 + r() * 178, w: 8 + r() * 22, h: 6 + r() * 14 })
  }
  return { blocks, tac }
}

const THREAT_BLOCKS: Record<MissionDef['threat'], number> = {
  MODERATE: 4,
  HIGH: 6,
  SEVERE: 8,
}

const OBJECTIVE_TIER = ['PRIMARY', 'SECONDARY', 'TERTIARY']

function LegendRow(props: { label: string; children: ReactNode }) {
  return (
    <div className="mb-legend-row">
      <svg viewBox="0 0 20 12" aria-hidden="true">{props.children}</svg>
      <span>{props.label}</span>
    </div>
  )
}

export function MissionBrief() {
  const goto = useAppStore((s) => s.goto)
  const missionId = useAppStore((s) => s.missionId)
  const clock = useUtcClock()
  const m = missionId ? missionById(missionId) : null
  const recon = useMemo(() => buildRecon(m ? m.seed : 1), [m])
  if (!m) return null

  const initials = m.codename
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
  const contractId = '77A-' + m.codename.replace(/\s+/g, '') + '-2087'

  return (
    <div className="screen mb">
      <header className="mb-head">
        <h1 className="screen-title">MISSION BRIEF</h1>
        <div className="mb-head-right">
          <Chip tone="dim">CORPSEC OPS TERMINAL // V7.2.1</Chip>
          <Chip tone="dim">DATETIME: 2087.05.14 {clock}</Chip>
          <Chip tone="dim">USER: OPS_DIRECTOR</Chip>
          <Chip tone="teal">SECURE CH 7A</Chip>
        </div>
      </header>

      <div className="mb-main">
        <section className="mb-left">
          {/* orbital recon feed */}
          <Panel
            title={'RECON FEED // SAT-7A'}
            right={<span className="dim">{clock} | IR-MONO</span>}
            className="mb-recon"
            bodyClassName="mb-recon-body"
          >
            <div className="mb-sweep" aria-hidden="true" />
            <svg viewBox="0 0 640 360" preserveAspectRatio="none" className="mb-recon-svg">
              <rect x="0" y="0" width="640" height="360" fill="#05090b" />
              <g className="mb-grid">
                {[60, 132, 204, 276, 332].map((y) => (
                  <line key={'h' + y} x1="0" y1={y} x2="640" y2={y} />
                ))}
                {[80, 180, 280, 380, 480, 580].map((x) => (
                  <line key={'v' + x} x1={x} y1="0" x2={x} y2="360" />
                ))}
              </g>
              {recon.blocks.map((b, i) => (
                <g key={i} className="mb-block">
                  <rect x={b.x} y={b.y} width={b.w} height={b.h} />
                  <polygon
                    points={`${b.x},${b.y} ${b.x + 9},${b.y - 7} ${b.x + b.w + 9},${b.y - 7} ${b.x + b.w},${b.y}`}
                  />
                  <line x1={b.x + b.w} y1={b.y + b.h} x2={b.x + b.w + 9} y2={b.y + b.h - 7} />
                  <line x1={b.x + b.w + 9} y1={b.y - 7} x2={b.x + b.w + 9} y2={b.y + b.h - 7} />
                </g>
              ))}

              {/* target building */}
              <g className="mb-target">
                <rect x="290" y="102" width="76" height="90" />
                <polygon points="290,102 302,92 378,92 366,102" />
                <line x1="366" y1="192" x2="378" y2="182" />
                <line x1="378" y1="92" x2="378" y2="182" />
                <line x1="315" y1="102" x2="315" y2="192" />
                <line x1="341" y1="102" x2="341" y2="192" />
                <line x1="290" y1="132" x2="366" y2="132" />
                <line x1="290" y1="162" x2="366" y2="162" />
              </g>
              <polyline className="mb-callout" points="366,112 452,64 470,64" />
              <g className="mb-callout-box">
                <rect x="470" y="46" width="158" height="34" />
                <text x="478" y="60">TARGET: CHECKPOINT GATE</text>
                <text x="478" y="73" className="sub">
                  ID: CP-07 // GRID 77-2A
                </text>
              </g>

              {/* insertion route from the south */}
              <polyline className="mb-route ins" points="96,346 150,318 196,292 232,258 262,226 300,196" />
              <polygon className="mb-tri ins" points="96,338 103,350 89,350" />
              <g className="mb-tag ins">
                <rect x="24" y="316" width="86" height="26" />
                <text x="30" y="327">INSERTION</text>
                <text x="30" y="338" className="sub">
                  ROUTE ALPHA
                </text>
              </g>

              {/* extraction route to the south east */}
              <polyline className="mb-route ext" points="366,168 434,220 500,272 552,312" />
              <polygon className="mb-tri ext" points="552,306 559,318 545,318" />
              <g className="mb-tag ext">
                <rect x="500" y="322" width="94" height="26" />
                <text x="506" y="333">EXTRACTION</text>
                <text x="506" y="344" className="sub">
                  ROUTE OMEGA
                </text>
              </g>

              {/* hud readouts */}
              <g className="mb-readout">
                <text x="628" y="22" textAnchor="end">ALT: 1824M</text>
                <text x="628" y="34" textAnchor="end">RNG: 3.7KM</text>
                <text x="628" y="46" textAnchor="end">TRK: 117.3</text>
                <text x="628" y="58" textAnchor="end">ZOOM: 1.6X</text>
                <text x="628" y="70" textAnchor="end">MODE: IR-MONO</text>
              </g>
              <g className="mb-brieflines">
                {m.briefing.map((line, i) => (
                  <text key={i} x="14" y={22 + i * 12}>
                    &gt; {line}
                  </text>
                ))}
              </g>
            </svg>
          </Panel>

          {/* tactical map */}
          <Panel
            title={'TACTICAL MAP // ' + m.city + ' - ' + m.district}
            right={<span className="dim">GRID REF: 77-2A | NORTH</span>}
            className="mb-tac"
            bodyClassName="mb-tac-body"
          >
            <svg viewBox="0 0 460 210" preserveAspectRatio="none" className="mb-tac-svg">
              <defs>
                <pattern id="mb-hatch-r" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                  <rect width="6" height="6" fill="rgba(224,75,60,0.05)" />
                  <rect width="1.4" height="6" fill="rgba(224,75,60,0.3)" />
                </pattern>
                <pattern id="mb-hatch-a" width="5" height="5" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                  <rect width="5" height="5" fill="rgba(240,180,69,0.08)" />
                  <rect width="1.4" height="5" fill="rgba(240,180,69,0.55)" />
                </pattern>
              </defs>
              <rect x="0" y="0" width="460" height="210" fill="#04090a" />
              <g className="mb-grid">
                {[42, 84, 126, 168].map((y) => (
                  <line key={'h' + y} x1="0" y1={y} x2="460" y2={y} />
                ))}
                {[57, 114, 171, 228, 285, 342, 399].map((x) => (
                  <line key={'v' + x} x1={x} y1="0" x2={x} y2="210" />
                ))}
              </g>
              {recon.tac.map((b, i) => (
                <rect key={i} className="mb-tac-block" x={b.x} y={b.y} width={b.w} height={b.h} />
              ))}
              <polygon
                className="mb-hostile"
                points="206,26 300,22 336,68 302,112 210,108 180,64"
                fill="url(#mb-hatch-r)"
              />
              <rect className="mb-tac-target" x="240" y="52" width="26" height="26" fill="url(#mb-hatch-a)" />
              <text className="mb-tac-label amber" x="253" y="94" textAnchor="middle">
                TARGET CP-07
              </text>
              <polyline className="mb-route ins" points="36,184 110,168 150,140 174,108 212,86 240,70" />
              <polyline className="mb-route ext" points="266,72 322,98 372,130 414,154" />
              <polygon className="mb-tri ins" points="36,177 42,188 30,188" />
              <polygon className="mb-tri ext" points="414,148 420,159 408,159" />
              <text className="mb-tac-label teal" x="52" y="196">INS</text>
              <text className="mb-tac-label red" x="424" y="170">EXT</text>
              <g className="mb-north">
                <text x="440" y="20">N</text>
                <line x1="443" y1="26" x2="443" y2="40" />
                <polygon points="443,24 447,32 439,32" />
              </g>
            </svg>
            <div className="mb-legend">
              <LegendRow label="INSERTION POINT">
                <polygon points="10,2 16,10 4,10" fill="none" stroke="#7ef0d4" strokeWidth="1.2" />
              </LegendRow>
              <LegendRow label="EXTRACTION POINT">
                <polygon points="4,2 16,2 10,10" fill="none" stroke="#ff6b55" strokeWidth="1.2" />
              </LegendRow>
              <LegendRow label="TARGET BUILDING">
                <rect x="5" y="1.5" width="9" height="9" fill="none" stroke="#f0b445" strokeWidth="1.2" />
              </LegendRow>
              <LegendRow label="ROUTE ALPHA">
                <line x1="2" y1="6" x2="18" y2="6" stroke="#7ef0d4" strokeWidth="1.4" strokeDasharray="3 2" />
              </LegendRow>
              <LegendRow label="ROUTE OMEGA">
                <line x1="2" y1="6" x2="18" y2="6" stroke="#ff6b55" strokeWidth="1.4" strokeDasharray="3 2" />
              </LegendRow>
              <LegendRow label="HOSTILE ZONE">
                <rect x="4" y="1.5" width="12" height="9" fill="rgba(224,75,60,0.18)" stroke="rgba(224,75,60,0.6)" strokeWidth="1" />
                <line x1="4" y1="10.5" x2="16" y2="1.5" stroke="rgba(224,75,60,0.7)" strokeWidth="1" />
              </LegendRow>
              <LegendRow label="PATROL ROUTE">
                <line x1="2" y1="6" x2="18" y2="6" stroke="#5d7d75" strokeWidth="1.2" strokeDasharray="1.5 2.5" />
              </LegendRow>
            </div>
          </Panel>
        </section>

        {/* contract dossier */}
        <aside className="mb-dossier">
          <Panel title="CONTRACT DOSSIER" className="mb-dossier-panel" bodyClassName="mb-dossier-body scroll">
            <div className="mb-idrow">
              <div className="mb-fields">
                <div className="field">
                  <label>OPERATION:</label>
                  <div className="value big">{m.codename}</div>
                </div>
                <div className="field">
                  <label>LOCATION:</label>
                  <div className="value">{m.city}</div>
                </div>
                <div className="field">
                  <label>MISSION TYPE:</label>
                  <div className="value">{m.type}</div>
                </div>
                <div className="field">
                  <label>CLIENT:</label>
                  <div className="value">{m.client}</div>
                </div>
              </div>
              <div className="mb-sil corners">
                <svg viewBox="0 0 90 100" aria-hidden="true">
                  <defs>
                    <pattern id="mb-sil-s" width="4" height="3" patternUnits="userSpaceOnUse">
                      <rect width="4" height="1" fill="rgba(0,0,0,0.35)" />
                    </pattern>
                  </defs>
                  <rect x="0" y="0" width="90" height="100" fill="#0a0f0d" />
                  <path
                    d="M45 16c9 0 15 7 15 17 0 7-2 12-6 16 12 4 20 12 22 26v25H14V75c2-14 10-22 22-26-4-4-6-9-6-16 0-10 6-17 15-17Z"
                    fill="#060a09"
                    stroke="rgba(126,240,212,0.12)"
                  />
                  <rect x="0" y="0" width="90" height="100" fill="url(#mb-sil-s)" />
                  <g stroke="rgba(240,180,69,0.7)" strokeWidth="1.2" fill="none">
                    <path d="M4 12V4h8" />
                    <path d="M78 4h8v8" />
                    <path d="M86 88v8h-8" />
                    <path d="M12 96H4v-8" />
                  </g>
                </svg>
                <span className="mb-sil-id">ID: {initials}-77</span>
              </div>
            </div>

            <div className="mb-threat corners">
              <span className="mb-skull">
                <SkullGlyph size={26} />
              </span>
              <span className="mb-threat-main">
                <label>THREAT RATING</label>
                <b>{m.threat}</b>
              </span>
              <span className="mb-threat-side">
                <span className="mb-threat-blocks">
                  {Array.from({ length: 9 }, (_, i) => (
                    <i key={i} className={i < THREAT_BLOCKS[m.threat] ? 'on' : undefined} />
                  ))}
                </span>
                <span className="mb-threat-eta">ETA RESPONSE: &lt; 06:00</span>
              </span>
            </div>

            <div className="mb-reward corners">
              <label>REWARD:</label>
              <b>{fmt(m.reward)} CR</b>
              <span className="dim">CORP CREDITS</span>
            </div>

            <div className="mb-box">
              <label>OBJECTIVES:</label>
              {m.objectives.map((o, i) => (
                <div key={o.id} className="mb-obj">
                  <span className="mb-obj-glyph" />
                  <span>
                    <b>{OBJECTIVE_TIER[Math.min(i, 2)]}:</b> {o.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mb-box">
              <label>
                COLLATERAL TOLERANCE: <b className="red">LOW (10%)</b>
              </label>
              <div className="mb-meter">
                <i style={{ left: '10%' }} />
              </div>
              <div className="axis">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="mb-box">
              <label>MISSION NOTES:</label>
              {m.notes.map((n, i) => (
                <div key={i} className="mb-note dim">
                  {n}
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </div>

      {/* bottom action bar */}
      <footer className="mb-foot">
        <button type="button" className="btn mb-return" onClick={act(() => goto('world'))}>
          &lt; RETURN
        </button>
        <div className="mb-comms corners">
          <b>COMMS LOG // CH 7A</b>
          <span className="dim">[23:40:12] INTEL: INCREASED SECURITY PATROLS DETECTED.</span>
          <span className="dim">[23:40:45] WEATHER: HEAVY RAIN. VISIBILITY REDUCED.</span>
          <span className="dim">[23:41:02] LOCAL: CORPSEC TASKFORCE ONSITE.</span>
        </div>
        <button type="button" className="cta big mb-accept" onClick={act(() => goto('team'))}>
          <span className="cta-inner">&lt;&lt; ACCEPT CONTRACT &gt;&gt;</span>
        </button>
        <div className="mb-contract corners">
          <span>
            CONTRACT ID: <b>{contractId}</b>
          </span>
          <span>
            CLEARANCE LEVEL: <b className="red">EXECUTIVE</b>
          </span>
          <div className="mb-barcode" aria-hidden="true" />
        </div>
      </footer>
    </div>
  )
}

/* =============================== TEAM SELECT ============================== */

export function TeamSelect() {
  const goto = useAppStore((s) => s.goto)
  const squad = useAppStore((s) => s.squad)
  const toggle = useAppStore((s) => s.toggleOperative)
  const missionId = useAppStore((s) => s.missionId)
  const [focusId, setFocusId] = useState<string | null>(null)
  const mission = missionId ? missionById(missionId) : null

  const focus = useMemo(() => {
    const id = focusId ?? squad[0] ?? ROSTER[0].id
    return ROSTER.find((o) => o.id === id) ?? ROSTER[0]
  }, [focusId, squad])

  const fh = hashOf(focus.id + focus.name)
  const stats = {
    hlth: Math.min(100, Math.round(focus.maxHp / 1.35)),
    stamina: Math.min(100, Math.round((focus.speed / 5.8) * 100)),
    focus: 78 + (fh % 21),
    mobility: Math.min(99, Math.round(focus.speed * 17.5)),
  }
  const primary = WEAPONS[focus.weapon]
  const sidearm = WEAPONS[focus.sidearm]
  const mass = squad.reduce((a, id) => {
    const o = operativeById(id)
    return a + o.maxHp * 0.48 + o.speed * 5.2
  }, 18.3)
  const ready = squad.length === 4

  const augs: Array<[string, string, string]> = [
    ['NEURAL', 'CORTEX INTERFACE', 'TAC-LINK V' + (2 + (fh % 2)) + '.' + ((fh >> 2) % 10)],
    ['CHEST', 'SYNAPTIC BUFFER', 'KINETIC SHIELD RIBS'],
    ['ARMS', 'TARGETING SUBROUTINE', 'STRENGTH BOOSTERS'],
    ['LEGS', 'AGI SERVOS V' + (2 + ((fh >> 4) % 3)), 'IMPACT ABSORBERS'],
  ]
  const invKinds = ['med', 'cell', 'frag', 'chip'] as const

  return (
    <div className="screen ts">
      <header className="ts-head">
        <div>
          <h1 className="screen-title">OPERATIVE ASSEMBLY</h1>
          <div className="ts-sub">
            <span className="ts-strike">STRIKE TEAM 04</span>
            <Chip tone="amber">SELECT FOUR OPERATIVES</Chip>
            <Chip tone="dim">{squad.length} / 4 ASSIGNED</Chip>
          </div>
        </div>
        <div className="ts-head-right">
          <Chip tone="dim">SYS VER 1.7.6.2</Chip>
          <Chip tone="teal">NET: SECURE</Chip>
          <Chip tone="teal">LINK: NOMINAL</Chip>
          <Chip tone="dim">CORP INTERNAL // EYES ONLY</Chip>
          {mission && (
            <Chip tone="dim">
              PROFILE: {mission.type} // {mission.district}
            </Chip>
          )}
        </div>
      </header>

      <div className="ts-main">
        {/* roster */}
        <aside className="ts-roster">
          <Panel
            title="ROSTER DATABASE"
            right={<span className="dim">{ROSTER.length} / 24</span>}
            className="ts-roster-panel"
            bodyClassName="ts-roster-body scroll"
          >
            {ROSTER.map((o, i) => {
              const inSquad = squad.includes(o.id)
              return (
                <button
                  key={o.id}
                  type="button"
                  className={
                    'ts-row' + (inSquad ? ' sel' : '') + (focus.id === o.id ? ' focus' : '')
                  }
                  onClick={act(() => {
                    toggle(o.id)
                    setFocusId(o.id)
                  })}
                >
                  <span className="ts-row-idx">{pad2(i + 1)}</span>
                  <span className="ts-row-name">{o.codename}</span>
                  <span className="ts-row-role">{ROLE_LABEL[o.role]}</span>
                  <span className={'ts-row-status ' + statusTone(o.status)}>{o.status}</span>
                  <span className="ts-row-chev">{inSquad ? '>' : ''}</span>
                </button>
              )
            })}
            <div className="ts-roster-foot">
              <span className="dim">ROSTER SYNC</span>
              <span className="dim">00:12:44 AGO</span>
            </div>
          </Panel>
        </aside>

        {/* glass bays */}
        <section className="ts-bays">
          {[0, 1, 2, 3].map((slot) => {
            const id = squad[slot]
            if (!id) {
              return (
                <div key={'empty' + slot} className="ts-bay empty corners">
                  <b className="ts-bay-num">{pad2(slot + 1)}</b>
                  <span className="ts-bay-emptylabel">EMPTY BAY</span>
                  <span className="dim mini">AWAITING ASSIGNMENT</span>
                </div>
              )
            }
            const o = operativeById(id)
            const h = hashOf(o.id + o.codename)
            return (
              <button
                key={id}
                type="button"
                className={'ts-bay corners' + (focus.id === id ? ' focus' : '')}
                onClick={act(() => setFocusId(id))}
              >
                <div className="ts-bay-top">
                  <b>{pad2(slot + 1)}</b>
                  <span className="ts-bay-barcode" aria-hidden="true" />
                </div>
                <div className="ts-bay-portrait">
                  <Portrait op={o} size={176} />
                </div>
                <div className="ts-bay-info">
                  <div className="ts-bay-name">{o.codename}</div>
                  <div className="kv mini">
                    <span>CONDITION</span>
                    <b className={statusTone(o.status)}>{o.status}</b>
                  </div>
                  <div className="kv mini">
                    <span>NEURAL</span>
                    <b>{86 + (h % 13)}%</b>
                  </div>
                  <div className="kv mini">
                    <span>ARMS</span>
                    <b>{84 + ((h >> 3) % 15)}%</b>
                  </div>
                </div>
                {focus.id === id && <div className="ts-bay-tag">- SELECTED -</div>}
              </button>
            )
          })}
        </section>

        {/* operative detail */}
        <aside className="ts-detail">
          <Panel
            title={
              <>
                <b className="amber">{squad.indexOf(focus.id) >= 0 ? pad2(squad.indexOf(focus.id) + 1) : '--'}</b>{' '}
                {focus.codename} / {ROLE_LABEL[focus.role]}
              </>
            }
            right={
              <>
                CONDITION: <b className={statusTone(focus.status)}>{focus.status}</b>
              </>
            }
            className="ts-detail-panel"
            bodyClassName="ts-detail-body scroll"
          >
            <div className="ts-id">
              <span className="ts-id-portrait">
                <Portrait op={focus} size={64} />
              </span>
              <span className="ts-id-main">
                <b>{focus.name}</b>
                <i className="dim">{focus.bio}</i>
              </span>
            </div>
            <div className="ts-stats">
              <div>
                <label>HLTH</label>
                <b>{stats.hlth}%</b>
              </div>
              <div>
                <label>STAMINA</label>
                <b>{stats.stamina}%</b>
              </div>
              <div>
                <label>FOCUS</label>
                <b>{stats.focus}%</b>
              </div>
              <div>
                <label>MOBILITY</label>
                <b>{stats.mobility}%</b>
              </div>
            </div>

            <div className="ts-box">
              <label>AUGMENTATIONS</label>
              {augs.map(([slotName, main, sub]) => (
                <div key={slotName} className="ts-aug">
                  <span className="ts-aug-slot">{slotName}</span>
                  <span className="ts-aug-glyph">
                    <HexGlyph size={13} />
                  </span>
                  <span className="ts-aug-main">
                    <b>{main}</b>
                    <i className="dim">{sub}</i>
                  </span>
                </div>
              ))}
            </div>

            <div className="ts-box">
              <label>LOADOUT</label>
              <div className="ts-weapon corners">
                <div className="ts-weapon-head">
                  <span>PRIMARY</span>
                  <span className="dim">
                    {primary.magazine}/120
                  </span>
                </div>
                <GunSilhouette weapon={focus.weapon} className="lg" />
                <div className="ts-weapon-name">{primary.name}</div>
              </div>
              <div className="ts-weapon corners secondary">
                <div className="ts-weapon-head">
                  <span>SECONDARY</span>
                  <span className="dim">
                    {sidearm.magazine}/48
                  </span>
                </div>
                <GunSilhouette weapon={focus.sidearm} className="sm" />
                <div className="ts-weapon-name">{sidearm.name}</div>
              </div>
            </div>

            <div className="ts-box">
              <label>
                INVENTORY <span className="dim">12/16</span>
              </label>
              <div className="ts-inv">
                {Array.from({ length: 12 }, (_, i) => (
                  <span key={i} className="ts-inv-tile">
                    <ItemGlyph kind={invKinds[(i + (fh % 4)) % 4]} />
                    <i>{pad2(((fh >> i) % 3) + 1)}</i>
                  </span>
                ))}
              </div>
            </div>
          </Panel>
        </aside>
      </div>

      {/* bottom deploy strip */}
      <footer className="ts-foot">
        <div className="ts-roles">
          {squad.map((id) => {
            const o = operativeById(id)
            return (
              <div key={id} className="ts-role corners">
                <span className="ts-role-glyph">
                  <RoleGlyph role={o.role} size={18} />
                </span>
                <span className="ts-role-main">
                  <b>{ROLE_LABEL[o.role]}</b>
                  <i className="dim">{o.bio}</i>
                </span>
              </div>
            )
          })}
          {Array.from({ length: 4 - squad.length }, (_, i) => (
            <div key={'slot' + i} className="ts-role corners empty">
              <span className="dim">EMPTY SLOT</span>
            </div>
          ))}
        </div>
        <div className="ts-mass corners">
          <label>DEPLOYMENT MASS</label>
          <div className="ts-mass-num">
            <b>{mass.toFixed(1)} KG</b>
            <span className="dim">/ 400.0 KG LIMIT</span>
          </div>
          <SegBar value={mass / 4} tone="amber" />
        </div>
        <div className="ts-deploy">
          <button
            type="button"
            className="cta big"
            disabled={!ready}
            onClick={act(() => goto('mission'))}
          >
            <span className="cta-inner">DEPLOY TEAM &gt;&gt;</span>
          </button>
          <div className="dim mini ts-deploy-sub">
            {ready
              ? 'CONFIRM AND DEPLOY STRIKE TEAM 04'
              : 'ASSIGN ' + (4 - squad.length) + ' MORE OPERATIVE' + (4 - squad.length === 1 ? '' : 'S')}
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ================================= DEBRIEF ================================ */

function DebriefRow(props: { label: string; value: ReactNode; index: number; tone?: string }) {
  return (
    <div className="db-row" style={{ animationDelay: props.index * 110 + 'ms' }}>
      <span className="db-row-label">&gt; {props.label}</span>
      <span className="db-dots" aria-hidden="true" />
      <b className={props.tone}>{props.value}</b>
    </div>
  )
}

export function Debrief() {
  const goto = useAppStore((s) => s.goto)
  const outcome = useAppStore((s) => s.outcome)
  const credits = useAppStore((s) => s.credits)
  const missionId = useAppStore((s) => s.missionId)
  const m = missionId ? missionById(missionId) : null
  const won = outcome?.won ?? false

  const mmss = (sec: number) => {
    const s = Math.max(0, Math.floor(sec))
    return pad2(Math.floor(s / 60)) + ':' + pad2(s % 60)
  }

  return (
    <div className="screen db">
      <div className="db-card corners">
        <div className="db-tag dim">OPERATIONAL DEBRIEF // STRIKE TEAM 04 // CH 7A</div>
        <h1 className={'db-title ' + (won ? 'won' : 'lost')}>
          {won ? 'CONTRACT FULFILLED' : 'CONTRACT TERMINATED'}
        </h1>
        <div className="db-subtitle">
          {won ? 'EXTRACTION CONFIRMED // PAYMENT RELEASED' : 'SQUAD LINK LOST // PAYMENT WITHHELD'}
        </div>
        <div className="db-rows">
          <DebriefRow index={0} label="TARGET" value={m ? m.district + ' // ' + m.city : '--'} />
          <DebriefRow index={1} label="ELIMINATIONS" value={outcome ? outcome.kills : '--'} />
          <DebriefRow
            index={2}
            label="SQUAD CASUALTIES"
            value={outcome ? outcome.casualties : '--'}
            tone={outcome && outcome.casualties > 0 ? 'red' : 'teal'}
          />
          <DebriefRow
            index={3}
            label="COLLATERAL"
            value={outcome ? outcome.civiliansHit : '--'}
            tone={outcome && outcome.civiliansHit > 0 ? 'red' : undefined}
          />
          <DebriefRow index={4} label="MISSION TIME" value={outcome ? mmss(outcome.timeSec) : '--:--'} />
          <DebriefRow
            index={5}
            label="PAYOUT"
            value={outcome && won ? '+' + fmt(outcome.reward) + ' CR' : '0 CR'}
            tone={won ? 'teal' : 'red'}
          />
          <DebriefRow index={6} label="ACCOUNT BALANCE" value={fmt(credits) + ' CR'} tone="amber" />
        </div>
        <div className="db-actions">
          <button type="button" className="btn" onClick={act(() => goto('world'))}>
            RETURN TO WORLD NETWORK
          </button>
          <button type="button" className="btn amber" onClick={act(() => goto('brief'))}>
            REPLAY MISSION
          </button>
        </div>
        <div className="db-barcode" aria-hidden="true" />
      </div>
    </div>
  )
}
