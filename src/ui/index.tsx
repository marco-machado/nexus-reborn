// DOM screens: MainMenu, MissionBrief, TeamSelect, Debrief. The world map and
// research screens live in ./WorldMap and ./Research and are re-exported here.
// Flow: menu -> world -> brief -> team -> mission -> debrief -> world, with
// research reachable from the world map nav.
import './ui.css'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { collateralFine, netPayout, useAppStore } from '../state/appStore'
import { useResearchStore } from '../state/researchStore'
import { useCampaignStore } from '../state/campaignStore'
import { useWorldStore } from '../state/worldStore'
import {
  continueOperation,
  hasValidSave,
  startNewOperation,
} from '../state/save'
import { ROSTER, missionById, operativeById } from '../game/data'
import { benefitOf, crewBonus, installedAugs, nodeTitle, squadWeapon } from '../game/research'
import type { ResearchNode } from '../game/research'
import type { AgentRole, MissionDef } from '../game/types'
import {
  Panel,
  Chip,
  ScrollBox,
  SegBar,
  GunSilhouette,
  RoleGlyph,
  ItemGlyph,
  SkullGlyph,
  HexGlyph,
} from './bits'
import {
  RECON_H,
  RECON_TARGET,
  RECON_W,
  buildReconBlocks,
  buildTacticalMap,
  pointsAttr,
  roofPoints,
  sidePoints,
  targetWindows,
  textWidth,
} from './briefMap'
import { fmt, pad2, hashOf } from './util'
import { Portrait } from './portrait'
import { Figure } from './figure'
import { uiClick, unlockAudio } from './sound'
export { WorldMap } from './WorldMap'
export { Research } from './Research'
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
// What an installed augmentation does, in the same words the research screen
// prints for it.
function augLine(node: ResearchNode): string {
  const e = node.effects[0]
  return e ? benefitOf(e).line : ''
}
/* ================================ MAIN MENU =============================== */
export function MainMenu() {
  const clock = useUtcClock()
  const [canContinue] = useState(() => hasValidSave())
  const [newOperationArmed, setNewOperationArmed] = useState(false)
  useEffect(() => {
    const unlock = () => unlockAudio()
    document.addEventListener('click', unlock, { once: true })
    return () => document.removeEventListener('click', unlock)
  }, [])
  useEffect(() => {
    if (!newOperationArmed) return
    const id = window.setTimeout(() => setNewOperationArmed(false), 3000)
    return () => window.clearTimeout(id)
  }, [newOperationArmed])

  const beginNewOperation = () => {
    if (canContinue && !newOperationArmed) {
      setNewOperationArmed(true)
      return
    }
    startNewOperation()
  }

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
        <div className="menu-actions">
          {canContinue && (
            <button
              type="button"
              className="cta menu-cta"
              aria-label="CONTINUE SAVED OPERATION // OPEN THE WORLD NETWORK"
              onClick={act(continueOperation)}
            >
              <span className="cta-inner">&lt;&lt; CONTINUE &gt;&gt;</span>
            </button>
          )}
          <button
            type="button"
            className={
              (canContinue ? 'btn amber menu-new' : 'cta menu-cta') +
              (newOperationArmed ? ' armed' : '')
            }
            aria-label={
              newOperationArmed
                ? 'CONFIRM NEW OPERATION // ERASE SAVED CAMPAIGN'
                : 'BEGIN NEW OPERATION'
            }
            onClick={act(beginNewOperation)}
          >
            {canContinue ? (
              newOperationArmed ? 'CONFIRM // ERASE SAVE?' : 'NEW OPERATION'
            ) : (
              <span className="cta-inner">&lt;&lt; NEW OPERATION &gt;&gt;</span>
            )}
          </button>
        </div>
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
const THREAT_BLOCKS: Record<MissionDef['threat'], number> = {
  MODERATE: 4,
  HIGH: 6,
  SEVERE: 8,
}
const OBJECTIVE_TIER = ['PRIMARY', 'SECONDARY', 'TERTIARY']
// Recon callout, sized from its own text so the frame always holds the label.
// The stack sits below the readouts on the right, clear of both.
const CALLOUT_LINES = [
  { text: 'TARGET BUILDING', size: 8, track: 0.9, cls: 'label' },
  { text: 'CHECKPOINT GATE', size: 10.5, track: 1, cls: 'name' },
  { text: 'ID: CP-07 // GRID 77-2A', size: 8, track: 0.9, cls: 'sub' },
]
const CALLOUT_PAD = 9
const CALLOUT_W =
  Math.max(...CALLOUT_LINES.map((l) => textWidth(l.text, l.size, l.track))) + CALLOUT_PAD * 2
const CALLOUT_H = 52
const CALLOUT_X = RECON_W - 16 - CALLOUT_W
const CALLOUT_Y = 104
const COMMS_LOG = [
  ['23:40:12', 'INTEL: SECURITY PATROLS INCREASED.'],
  ['23:40:45', 'WEATHER: HEAVY RAIN. VISIBILITY LOW.'],
  ['23:41:02', 'LOCAL: CORPSEC TASKFORCE ONSITE.'],
]
function LegendRow(props: { label: string; children: ReactNode }) {
  return (
    <div className="mb-legend-row">
      <svg viewBox="0 0 20 12" aria-hidden="true">{props.children}</svg>
      <span>{props.label}</span>
    </div>
  )
}
function TacStat(props: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="mb-tac-stat">
      <label>{props.label}</label>
      <b className={props.tone}>{props.value}</b>
    </div>
  )
}
export function MissionBrief() {
  const goto = useAppStore((s) => s.goto)
  const missionId = useAppStore((s) => s.missionId)
  const clock = useUtcClock()
  const m = missionId ? missionById(missionId) : null
  const blocks = useMemo(() => buildReconBlocks(m ? m.seed : 1), [m])
  const targetLights = useMemo(() => targetWindows(m ? m.seed : 1), [m])
  const tac = useMemo(() => (m ? buildTacticalMap(m) : null), [m])
  if (!m || !tac) return null
  const initials = m.codename
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
  const contractId = '77A-' + m.codename.replace(/\s+/g, '') + '-2087'
  const lz = tac.extraction
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
            <svg
              viewBox={'0 0 ' + RECON_W + ' ' + RECON_H}
              preserveAspectRatio="none"
              className="mb-recon-svg"
              role="img"
              aria-label={'Infrared satellite frame over ' + m.district + ', ' + m.city}
            >
              <defs>
                <linearGradient id="mb-recon-scrim" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#020708" stopOpacity="0.94" />
                  <stop offset="70%" stopColor="#020708" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#020708" stopOpacity="0" />
                </linearGradient>
                <radialGradient id="mb-target-glow">
                  <stop offset="0%" stopColor="#f0b445" stopOpacity="0.26" />
                  <stop offset="100%" stopColor="#f0b445" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect x="0" y="0" width={RECON_W} height={RECON_H} fill="#05090b" />
              <g className="mb-grid">
                {[60, 132, 204, 276, 332].map((y) => (
                  <line key={'h' + y} x1="0" y1={y} x2={RECON_W} y2={y} />
                ))}
                {[96, 192, 288, 384, 480, 576, 672, 768, 864].map((x) => (
                  <line key={'v' + x} x1={x} y1="0" x2={x} y2={RECON_H} />
                ))}
              </g>
              {blocks.map((b, i) => (
                <g key={i} className="mb-block">
                  <polygon className="side" points={sidePoints(b)} />
                  <rect className="face" x={b.x} y={b.y} width={b.w} height={b.h} />
                  {b.windows.map((w, k) => (
                    <rect key={k} className="mb-win" x={w.x} y={w.y} width="3.4" height="2.4" />
                  ))}
                  <polygon className="roof" points={roofPoints(b)} />
                </g>
              ))}
              {/* target building */}
              <ellipse
                cx={RECON_TARGET.x + RECON_TARGET.w / 2}
                cy={RECON_TARGET.y + RECON_TARGET.h / 2}
                rx="170"
                ry="120"
                fill="url(#mb-target-glow)"
              />
              <g className="mb-target">
                <polygon className="side" points={sidePoints(RECON_TARGET)} />
                <rect
                  className="face"
                  x={RECON_TARGET.x}
                  y={RECON_TARGET.y}
                  width={RECON_TARGET.w}
                  height={RECON_TARGET.h}
                />
                {targetLights.map((w, k) => (
                  <rect key={k} className="mb-target-win" x={w.x} y={w.y} width="3.4" height="2.4" />
                ))}
                <polygon className="roof" points={roofPoints(RECON_TARGET)} />
                {[132, 156, 180].map((y) => (
                  <line
                    key={y}
                    className="floor"
                    x1={RECON_TARGET.x}
                    y1={y}
                    x2={RECON_TARGET.x + RECON_TARGET.w}
                    y2={y}
                  />
                ))}
                {[455, 480, 505].map((x) => (
                  <line
                    key={x}
                    className="floor"
                    x1={x}
                    y1={RECON_TARGET.y}
                    x2={x}
                    y2={RECON_TARGET.y + RECON_TARGET.h}
                  />
                ))}
              </g>
              {/* insertion route from the south west */}
              <polyline
                className="mb-route ins"
                points="126,338 214,316 292,290 356,258 412,228 452,208"
              />
              <polygon className="mb-tri ins" points="126,330 133,344 119,344" />
              <g className="mb-tag ins">
                <rect x="42" y="292" width="120" height="30" />
                <text x="49" y="305">
                  INSERTION
                </text>
                <text x="49" y="317" className="sub">
                  ROUTE ALPHA
                </text>
              </g>
              {/* extraction route to the south east */}
              <polyline className="mb-route ext" points="544,176 640,228 726,276 806,318" />
              <polygon className="mb-tri ext" points="806,310 813,324 799,324" />
              <g className="mb-tag ext">
                <rect x="830" y="270" width="126" height="30" />
                <text x="837" y="283">
                  EXTRACTION
                </text>
                <text x="837" y="295" className="sub">
                  ROUTE OMEGA
                </text>
              </g>
              {/* readouts and briefing, on a scrim so type stays crisp */}
              <rect x="0" y="0" width={RECON_W} height="98" fill="url(#mb-recon-scrim)" />
              <g className="mb-readout">
                {[
                  'ALT: 1824M',
                  'RNG: 3.7KM',
                  'TRK: 117.3',
                  'ZOOM: 1.6X',
                  'MODE: IR-MONO',
                ].map((line, i) => (
                  <text key={line} x={RECON_W - 16} y={24 + i * 13} textAnchor="end">
                    {line}
                  </text>
                ))}
              </g>
              <g className="mb-brieflines">
                {m.briefing.map((line, i) => (
                  <text key={i} x="18" y={24 + i * 13}>
                    &gt; {line}
                  </text>
                ))}
              </g>
              {/* target callout, anchored clear of the readouts above */}
              <polyline
                className="mb-callout"
                points={`544,150 700,${CALLOUT_Y + CALLOUT_H / 2} ${CALLOUT_X},${CALLOUT_Y + CALLOUT_H / 2}`}
              />
              <circle className="mb-callout-dot" cx="544" cy="150" r="3" />
              <g className="mb-callout-box">
                <rect x={CALLOUT_X} y={CALLOUT_Y} width={CALLOUT_W} height={CALLOUT_H} />
                {CALLOUT_LINES.map((l, i) => (
                  <text
                    key={l.text}
                    className={l.cls}
                    x={CALLOUT_X + CALLOUT_PAD}
                    y={CALLOUT_Y + 15 + i * 15}
                  >
                    {l.text}
                  </text>
                ))}
              </g>
            </svg>
          </Panel>
          {/* tactical map, projected from the district the mission builds */}
          <Panel
            title={'TACTICAL MAP // ' + m.city + ' - ' + m.district}
            right={<span className="dim">GRID REF: 77-2A | {tac.size}M SQUARE</span>}
            className="mb-tac"
            bodyClassName="mb-tac-body"
          >
            <div className="mb-tac-rail">
              <TacStat label="CITY BLOCKS" value={tac.counts.blocks} />
              <TacStat label="STREETS" value={pad2(tac.counts.streets)} />
              <TacStat label="CIVILIANS" value={pad2(tac.counts.civilians)} />
              <TacStat label="PATROL CONTACTS" value={pad2(tac.counts.patrols)} tone="amber" />
              <TacStat label="GARRISON" value={pad2(tac.counts.garrison)} tone="red" />
              <TacStat label="ROUTE ALPHA" value={tac.counts.alphaMetres + ' M'} tone="teal" />
              <TacStat label="ROUTE OMEGA" value={tac.counts.omegaMetres + ' M'} tone="red" />
            </div>
            <div className="mb-tac-plate">
              <svg
                viewBox={'0 0 ' + tac.size + ' ' + tac.size}
                className="mb-tac-svg"
                role="img"
                aria-label={
                  'Tactical plan of ' +
                  m.district +
                  ' showing the insertion route to the target and the extraction route back to the landing zone'
                }
              >
                <defs>
                  <pattern
                    id="mb-hatch-r"
                    width="3"
                    height="3"
                    patternTransform="rotate(45)"
                    patternUnits="userSpaceOnUse"
                  >
                    <rect width="3" height="3" fill="rgba(224,75,60,0.06)" />
                    <rect width="0.7" height="3" fill="rgba(224,75,60,0.34)" />
                  </pattern>
                  <pattern
                    id="mb-hatch-a"
                    width="2.4"
                    height="2.4"
                    patternTransform="rotate(45)"
                    patternUnits="userSpaceOnUse"
                  >
                    <rect width="2.4" height="2.4" fill="rgba(240,180,69,0.1)" />
                    <rect width="0.7" height="2.4" fill="rgba(240,180,69,0.6)" />
                  </pattern>
                </defs>
                <rect x="0" y="0" width={tac.size} height={tac.size} fill="#04090a" />
                <g className="mb-tac-grid">
                  {[16, 32, 48, 64, 80].map((v) => (
                    <line key={'h' + v} x1="0" y1={v} x2={tac.size} y2={v} />
                  ))}
                  {[16, 32, 48, 64, 80].map((v) => (
                    <line key={'v' + v} x1={v} y1="0" x2={v} y2={tac.size} />
                  ))}
                </g>
                {tac.roads.map((r, i) => (
                  <rect key={i} className="mb-tac-road" x={r.x} y={r.y} width={r.w} height={r.h} />
                ))}
                {tac.buildings.map((b, i) => (
                  <rect
                    key={i}
                    className="mb-tac-block"
                    x={b.x}
                    y={b.y}
                    width={b.w}
                    height={b.h}
                    opacity={0.42 + b.lit * 0.58}
                  />
                ))}
                <polygon
                  className="mb-hostile"
                  points={pointsAttr(tac.hostile)}
                  fill="url(#mb-hatch-r)"
                />
                {tac.patrols.map((p, i) => (
                  <g key={i} className="mb-patrol">
                    <polyline points={pointsAttr(p)} />
                    {p.map((n, k) => (
                      <circle key={k} cx={n.x} cy={n.z} r="0.7" />
                    ))}
                  </g>
                ))}
                <polyline className="mb-route ins" points={pointsAttr(tac.routeAlpha)} />
                <polyline className="mb-route ext" points={pointsAttr(tac.routeOmega)} />
                {/* target zone */}
                <rect
                  className="mb-tac-target"
                  x={tac.target.x - 3.4}
                  y={tac.target.z - 3.4}
                  width="6.8"
                  height="6.8"
                  fill="url(#mb-hatch-a)"
                />
                <circle
                  className="mb-tac-ring amber"
                  cx={tac.target.x}
                  cy={tac.target.z}
                  r={tac.target.r}
                />
                <text
                  className="mb-tac-label amber"
                  x={tac.target.x}
                  y={tac.target.z + 9.5}
                  textAnchor="middle"
                >
                  TARGET CP-07
                </text>
                {/* landing zone: the squad inserts and extracts on the same pad */}
                <circle className="mb-tac-ring teal" cx={lz.x} cy={lz.z} r="4.4" />
                <polygon
                  className="mb-tri ins"
                  points={`${lz.x},${lz.z - 3.2} ${lz.x + 2.4},${lz.z - 0.4} ${lz.x - 2.4},${lz.z - 0.4}`}
                />
                <polygon
                  className="mb-tri ext"
                  points={`${lz.x - 2.4},${lz.z + 0.6} ${lz.x + 2.4},${lz.z + 0.6} ${lz.x},${lz.z + 3.4}`}
                />
                <text className="mb-tac-label teal" x={lz.x + 6.4} y={lz.z + 1.6}>
                  INS / EXT
                </text>
                {/* scale bar and north rose */}
                <g className="mb-tac-scale">
                  <line x1="6" y1="91" x2="26" y2="91" />
                  <line x1="6" y1="89" x2="6" y2="93" />
                  <line x1="16" y1="90" x2="16" y2="92" />
                  <line x1="26" y1="89" x2="26" y2="93" />
                  <text x="6" y="87.5">
                    20 M
                  </text>
                </g>
                <g className="mb-north">
                  <rect x="85.5" y="2.5" width="9" height="12.5" />
                  <text x="90" y="7.5" textAnchor="middle">
                    N
                  </text>
                  <polygon points="90,8.6 92,12.6 88,12.6" />
                </g>
              </svg>
            </div>
            <div className="mb-legend">
              <LegendRow label="INSERTION POINT">
                <polygon points="10,2 16,10 4,10" fill="none" stroke="#7ef0d4" strokeWidth="1.2" />
              </LegendRow>
              <LegendRow label="EXTRACTION POINT">
                <polygon points="4,2 16,2 10,10" fill="none" stroke="#ff6b55" strokeWidth="1.2" />
              </LegendRow>
              <LegendRow label="TARGET ZONE">
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
                <circle cx="6" cy="6" r="1.3" fill="#5d7d75" />
                <circle cx="14" cy="6" r="1.3" fill="#5d7d75" />
              </LegendRow>
            </div>
          </Panel>
        </section>
        {/* contract dossier */}
        <aside className="mb-dossier">
          <Panel title="CONTRACT DOSSIER" className="mb-dossier-panel" bodyClassName="mb-dossier-body">
            <ScrollBox className="mb-dossier-scroll">
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
                    <svg viewBox="0 0 118 176" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                      <defs>
                        <linearGradient id="mb-sil-bg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0d1a17" />
                          <stop offset="100%" stopColor="#050b0a" />
                        </linearGradient>
                        <linearGradient id="mb-sil-rim" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#7ef0d4" stopOpacity="0.5" />
                          <stop offset="45%" stopColor="#7ef0d4" stopOpacity="0.06" />
                          <stop offset="100%" stopColor="#f0b445" stopOpacity="0.22" />
                        </linearGradient>
                        <pattern id="mb-sil-s" width="4" height="3" patternUnits="userSpaceOnUse">
                          <rect width="4" height="1.1" fill="rgba(0,0,0,0.4)" />
                        </pattern>
                      </defs>
                      <rect x="0" y="0" width="118" height="176" fill="url(#mb-sil-bg)" />
                      <g stroke="rgba(126,240,212,0.07)" strokeWidth="0.8">
                        {[30, 60, 90, 120, 150].map((y) => (
                          <line key={y} x1="0" y1={y} x2="118" y2={y} />
                        ))}
                        {[30, 59, 88].map((x) => (
                          <line key={x} x1={x} y1="0" x2={x} y2="176" />
                        ))}
                      </g>
                      {/* head, shoulders and torso, filling the frame */}
                      <path
                        d="M59 22c14 0 23 11 23 26 0 11-3 19-9 25 19 6 31 19 34 41v62H11v-62c3-22 15-35 34-41-6-6-9-14-9-25 0-15 9-26 23-26Z"
                        fill="#070d0c"
                        stroke="url(#mb-sil-rim)"
                        strokeWidth="1.6"
                      />
                      <path
                        d="M59 22c-14 0-23 11-23 26 0 11 3 19 9 25-19 6-31 19-34 41v62"
                        fill="none"
                        stroke="rgba(126,240,212,0.34)"
                        strokeWidth="1.4"
                      />
                      <rect x="0" y="0" width="118" height="176" fill="url(#mb-sil-s)" />
                      <g stroke="var(--amber)" strokeWidth="1.6" fill="none">
                        <path d="M5 16V5h11" />
                        <path d="M102 5h11v11" />
                        <path d="M113 160v11h-11" />
                        <path d="M16 171H5v-11" />
                      </g>
                    </svg>
                    <span className="mb-sil-scan" aria-hidden="true" />
                    <span className="mb-sil-id">ID: {initials}-77</span>
                  </div>
                </div>
                <div className="mb-threat corners">
                  <span className="mb-skull">
                    <SkullGlyph size={24} />
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
                  <div className="mb-reward-line">
                    <b>
                      {fmt(m.reward)}
                      <i>CR</i>
                    </b>
                    <span className="dim">CORP CREDITS</span>
                  </div>
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
            </ScrollBox>
          </Panel>
        </aside>
      </div>
      {/* bottom action bar */}
      <footer className="mb-foot">
        <button
          type="button"
          className="btn mb-return"
          aria-label="RETURN TO THE WORLD NETWORK"
          onClick={act(() => goto('world'))}
        >
          &lt; RETURN
        </button>
        <div className="mb-comms corners">
          <b>COMMS LOG // CH 7A</b>
          {COMMS_LOG.map(([t, msg]) => (
            <span key={t} className="dim" title={'[' + t + '] ' + msg}>
              <i>[{t}]</i> {msg}
            </span>
          ))}
        </div>
        <button
          type="button"
          className="cta big mb-accept"
          aria-label={'ACCEPT CONTRACT ' + m.codename + ' // ' + fmt(m.reward) + ' CR'}
          onClick={act(() => goto('team'))}
        >
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
  const roster = useCampaignStore((s) => s.roster)
  const [focusId, setFocusId] = useState<string | null>(null)
  const mission = missionId ? missionById(missionId) : null
  const focus = useMemo(() => {
    const id = focusId ?? squad[0] ?? ROSTER[0].id
    return ROSTER.find((o) => o.id === id) ?? ROSTER[0]
  }, [focusId, squad])
  // Completed research rides with the operative: the same numbers the mission
  // builds units from.
  const done = useResearchStore((s) => s.done)
  const bonus = crewBonus(done)
  const maxHp = focus.maxHp + bonus.maxHp
  const speed = focus.speed + bonus.speed
  const fh = hashOf(focus.id + focus.name)
  const stats = {
    hlth: Math.min(100, Math.round(maxHp / 1.35)),
    stamina: Math.min(100, Math.round((speed / 5.8) * 100)),
    focus: 78 + (fh % 21),
    mobility: Math.min(99, Math.round(speed * 17.5)),
  }
  const primary = squadWeapon(focus.weapon, done)
  const sidearm = squadWeapon(focus.sidearm, done)
  const mass = squad.reduce((a, id) => {
    const o = operativeById(id)
    return a + o.maxHp * 0.48 + o.speed * 5.2
  }, 18.3)
  const ready =
    squad.length >= 1 && squad.every((id) => roster[id]?.status === 'READY')
  const augs = installedAugs(done)
  const invKinds = ['med', 'cell', 'frag', 'chip'] as const
  return (
    <div className="screen ts">
      <header className="ts-head">
        <div>
          <h1 className="screen-title">OPERATIVE ASSEMBLY</h1>
          <div className="ts-sub">
            <span className="ts-strike">STRIKE TEAM 04</span>
            <Chip tone="amber">SELECT UP TO FOUR OPERATIVES</Chip>
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
            bodyClassName="ts-roster-body"
          >
            <ScrollBox className="ts-roster-list" dep={squad}>
              {ROSTER.map((o, i) => {
                const inSquad = squad.includes(o.id)
                const condition = roster[o.id]?.status ?? 'INJURED'
                // reading up on an operative must not move them in or out of the
                // squad, so the row body focuses and the trailing key assigns
                const blocked =
                  condition === 'INJURED' ||
                  (inSquad ? squad.length <= 1 : squad.length >= 4)
                return (
                  <div
                    key={o.id}
                    className={
                      'ts-row' +
                      (inSquad ? ' sel' : '') +
                      (focus.id === o.id ? ' focus' : '') +
                      (condition === 'INJURED' ? ' injured' : '')
                    }
                  >
                    <button
                      type="button"
                      className="ts-row-main"
                      aria-label={
                        'READ THE DOSSIER ON ' +
                        o.codename +
                        ' // ' +
                        ROLE_LABEL[o.role] +
                        ' // ' +
                        condition
                      }
                      onClick={act(() => setFocusId(o.id))}
                    >
                      <span className="ts-row-idx">{pad2(i + 1)}</span>
                      <span className="ts-row-name">{o.codename}</span>
                      <span className="ts-row-role">{ROLE_LABEL[o.role]}</span>
                      <span className={'ts-row-status ' + statusTone(condition)}>{condition}</span>
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
                          ? condition === 'INJURED'
                            ? 'OPERATIVE INJURED // ADVANCE WORLD TIME TO RECOVER'
                            : inSquad
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
            </ScrollBox>
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
            const condition = roster[id]?.status ?? 'INJURED'
            const h = hashOf(o.id + o.codename)
            return (
              <button
                key={id}
                type="button"
                className={'ts-bay corners' + (focus.id === id ? ' focus' : '')}
                aria-label={
                  'BAY ' + pad2(slot + 1) + ' // ' + o.codename + ' // READ THE DOSSIER'
                }
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
                    <b className={statusTone(condition)}>{condition}</b>
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
                CONDITION:{' '}
                <b className={statusTone(roster[focus.id]?.status ?? 'INJURED')}>
                  {roster[focus.id]?.status ?? 'INJURED'}
                </b>
              </>
            }
            className="ts-detail-panel"
            bodyClassName="ts-detail-body"
          >
            <ScrollBox className="ts-detail-list" dep={focus.id}>
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
                {augs.map(({ slot, node }) => (
                  <div key={slot} className={'ts-aug' + (node ? '' : ' stock')}>
                    <span className="ts-aug-slot">{slot}</span>
                    <span className="ts-aug-glyph">
                      <HexGlyph size={13} />
                    </span>
                    <span className="ts-aug-main">
                      <b>{node ? nodeTitle(node) : 'STOCK ISSUE'}</b>
                      <i className="dim">{node ? augLine(node) : 'NO PROJECT RESEARCHED'}</i>
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
            </ScrollBox>
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
            className="btn ts-return"
            aria-label="RETURN TO THE WORLD NETWORK"
            onClick={act(() => goto('world'))}
          >
            &lt; RETURN
          </button>
          <button
            type="button"
            className="cta big"
            disabled={!ready}
            aria-label={
              ready
                ? 'DEPLOY STRIKE TEAM 04'
                : 'DEPLOY TEAM // INJURED OPERATIVE ASSIGNED'
            }
            onClick={act(() => goto('mission'))}
          >
            <span className="cta-inner">DEPLOY TEAM &gt;&gt;</span>
          </button>
          <div className="dim mini ts-deploy-sub">
            {ready
              ? 'CONFIRM AND DEPLOY STRIKE TEAM 04'
              : 'REMOVE INJURED OPERATIVES BEFORE DEPLOYMENT'}
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
  const outcomeSerial = useAppStore((s) => s.outcomeSerial)
  const m = missionId ? missionById(missionId) : null
  const won = outcome?.won ?? false
  const fine = outcome ? collateralFine(outcome) : 0
  const paid = outcome ? netPayout(outcome) : 0
  useEffect(() => {
    if (!outcome || !missionId) return
    if (useCampaignStore.getState().outcomeApplied >= outcomeSerial) return
    const worldT = useWorldStore.getState().t
    useCampaignStore.getState().reportMission(missionId, outcome, worldT)
    useWorldStore.getState().applyMissionResult(missionId, outcome)
    if (outcome.deadIds.length > 0) {
      const dead = new Set(outcome.deadIds)
      useAppStore.setState((state) => ({
        squad: state.squad.filter((id) => !dead.has(id)),
      }))
    }
  }, [missionId, outcome, outcomeSerial])
  const mmss = (sec: number) => {
    const s = Math.max(0, Math.floor(sec))
    return pad2(Math.floor(s / 60)) + ':' + pad2(s % 60)
  }
  // Built as a list because the deduction only takes a line when a round caught
  // a bystander, and the row stagger has to stay even either way.
  const rows: { label: string; value: ReactNode; tone?: string }[] = [
    { label: 'TARGET', value: m ? m.district + ' // ' + m.city : '--' },
    { label: 'ELIMINATIONS', value: outcome ? outcome.kills : '--' },
    {
      label: 'SQUAD CASUALTIES',
      value: outcome ? outcome.casualties : '--',
      tone: outcome && outcome.casualties > 0 ? 'red' : 'teal',
    },
    {
      label: 'COLLATERAL',
      value: outcome ? outcome.civiliansHit : '--',
      tone: outcome && outcome.civiliansHit > 0 ? 'red' : undefined,
    },
    { label: 'MISSION TIME', value: outcome ? mmss(outcome.timeSec) : '--:--' },
  ]
  if (outcome && won && fine > 0) {
    rows.push({ label: 'CONTRACT VALUE', value: fmt(outcome.reward) + ' CR' })
    rows.push({ label: 'COLLATERAL PENALTY', value: '-' + fmt(fine) + ' CR', tone: 'red' })
  }
  rows.push({
    label: 'PAYOUT',
    value: won && paid > 0 ? '+' + fmt(paid) + ' CR' : '0 CR',
    tone: won && paid > 0 ? 'teal' : 'red',
  })
  rows.push({ label: 'ACCOUNT BALANCE', value: fmt(credits) + ' CR', tone: 'amber' })
  return (
    <div className="screen db">
      <div className="db-card corners">
        <div className="db-tag dim">OPERATIONAL DEBRIEF // STRIKE TEAM 04 // CH 7A</div>
        <h1 className={'db-title ' + (won ? 'won' : 'lost')}>
          {won ? 'CONTRACT FULFILLED' : 'CONTRACT TERMINATED'}
        </h1>
        <div className="db-subtitle">
          {won
            ? fine > 0
              ? 'EXTRACTION CONFIRMED // PAYMENT ADJUSTED'
              : 'EXTRACTION CONFIRMED // PAYMENT RELEASED'
            : 'SQUAD LINK LOST // PAYMENT WITHHELD'}
        </div>
        <div className="db-rows">
          {rows.map((r, i) => (
            <DebriefRow key={r.label} index={i} label={r.label} value={r.value} tone={r.tone} />
          ))}
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
