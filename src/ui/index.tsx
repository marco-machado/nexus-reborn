// DOM screens: MainMenu, MissionBrief, TeamSelect, Debrief. The world map
// screen lives in ./WorldMap and is re-exported here.
// Flow: menu -> world -> brief -> team -> mission -> debrief -> world.
import './ui.css'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useAppStore } from '../state/appStore'
import { ROSTER, WEAPONS, missionById, operativeById } from '../game/data'
import type { AgentRole, MissionDef } from '../game/types'
import {
  Panel,
  Chip,
  SegBar,
  GunSilhouette,
  RoleGlyph,
  ItemGlyph,
  SkullGlyph,
  HexGlyph,
} from './bits'
import { fmt, pad2, hashOf, rngFrom } from './util'
import { Portrait } from './portrait'
import { Figure } from './figure'
import { uiClick, unlockAudio } from './sound'

export { WorldMap } from './WorldMap'

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

// Role-card copy: each sentence of the bio becomes its own short line so the
// card shows them whole instead of clipping mid-word.
function bioLines(bio: string): string[] {
  return bio
    .split(/\.(?=\s|$)/)
    .map((s) => s.trim())
    .filter(Boolean)
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

  // every derived readout shifts unsigned: hashOf returns a full 32 bit value,
  // so a signed shift lands negative and prints counts like -1
  const augs: Array<[string, string, string]> = [
    ['NEURAL', 'CORTEX INTERFACE', 'TAC-LINK V' + (2 + (fh % 2)) + '.' + ((fh >>> 2) % 10)],
    ['CHEST', 'SYNAPTIC BUFFER', 'KINETIC SHIELD RIBS'],
    ['ARMS', 'TARGETING SUBROUTINE', 'STRENGTH BOOSTERS'],
    ['LEGS', 'AGI SERVOS V' + (2 + ((fh >>> 4) % 3)), 'IMPACT ABSORBERS'],
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
            right={<span className="dim">{ROSTER.length} ON FILE</span>}
            className="ts-roster-panel"
            bodyClassName="ts-roster-body scroll"
          >
            {ROSTER.map((o, i) => {
              const inSquad = squad.includes(o.id)
              // reading up on an operative must not move them in or out of the
              // squad, so the row body focuses and the trailing key assigns
              const blocked = inSquad ? squad.length <= 1 : squad.length >= 4
              return (
                <div
                  key={o.id}
                  className={
                    'ts-row' + (inSquad ? ' sel' : '') + (focus.id === o.id ? ' focus' : '')
                  }
                >
                  <button
                    type="button"
                    className="ts-row-main"
                    onClick={act(() => setFocusId(o.id))}
                  >
                    <span className="ts-row-idx">{pad2(i + 1)}</span>
                    <span className="ts-row-name">{o.codename}</span>
                    <span className="ts-row-role">{ROLE_LABEL[o.role]}</span>
                    <span className={'ts-row-status ' + statusTone(o.status)}>{o.status}</span>
                  </button>
                  <button
                    type="button"
                    className="ts-row-assign"
                    disabled={blocked}
                    aria-label={
                      (inSquad ? 'UNASSIGN ' : 'ASSIGN ') + o.codename + ' // STRIKE TEAM 04'
                    }
                    title={
                      blocked
                        ? inSquad
                          ? 'STRIKE TEAM 04 NEEDS AT LEAST ONE OPERATIVE'
                          : 'STRIKE TEAM 04 IS FULL'
                        : inSquad
                          ? 'UNASSIGN'
                          : 'ASSIGN'
                    }
                    onClick={act(() => toggle(o.id))}
                  >
                    {inSquad ? '−' : '+'}
                  </button>
                </div>
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
                <div className="ts-bay-figure">
                  <Figure op={o} />
                </div>
                <div className="ts-bay-info">
                  <div className="ts-bay-name">{o.codename}</div>
                  <div className="kv mini">
                    <span>CONDITION</span>
                    <b className={statusTone(o.status)}>{o.status}</b>
                  </div>
                  <div className="ts-bay-stats">
                    <span className="kv mini">
                      <span>NEURAL</span>
                      <b>{86 + (h % 13)}%</b>
                    </span>
                    <span className="kv mini">
                      <span>CHEST</span>
                      <b>{82 + ((h >>> 6) % 17)}%</b>
                    </span>
                    <span className="kv mini">
                      <span>ARMS</span>
                      <b>{84 + ((h >>> 3) % 15)}%</b>
                    </span>
                    <span className="kv mini">
                      <span>LEGS</span>
                      <b>{83 + ((h >>> 9) % 16)}%</b>
                    </span>
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

            {/* loadout and inventory sit side by side: stacked they push the
                sidearm and the whole grid past the fold at 1280x720 */}
            <div className="ts-kit">
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
                      <i>{pad2(((fh >>> i) % 3) + 1)}</i>
                    </span>
                  ))}
                </div>
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
                  {bioLines(o.bio).map((line, li) => (
                    <i key={li} className="dim">
                      {line}
                    </i>
                  ))}
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
            <b>{mass.toFixed(1)}</b>
            <span className="ts-mass-unit">KG</span>
          </div>
          <div className="ts-mass-limit dim">/ 400.0 KG LIMIT</div>
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
