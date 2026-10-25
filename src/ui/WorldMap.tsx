// World Network screen. The sector list, the Scan, the sector readout and the
// open-contract list all read the same world state, and the transport under
// the Scan is what moves Strategic time.
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../state/appStore'
import {
  DAY,
  SPEEDS,
  hhmm,
  feedText,
  influenceRefusal,
  sectorReadout,
  taxEligible,
  stamp,
  useWorldStore,
} from '../state/worldStore'
import type { WorldEvent } from '../state/worldStore'
import { MISSIONS } from '../game/data'
import { contractMission, visibleContracts } from '../game/contracts'
import type { GeneratedContract } from '../game/contracts'
import {
  EXPEDITE_EXTENSION_SEC,
  INFLUENCE_ACTIONS,
  cooldownKey,
  PRESSURE_UNREST_MIN,
} from '../game/influence'
import type { InfluenceActionId } from '../game/influence'
import { eventForecast } from '../game/forecast'
import type { ForecastKind } from '../game/forecast'
import { missionChance, missionMods, missionVariant } from '../game/missionParams'
import type { Difficulty } from '../game/missionParams'
import { useSettingsStore } from '../state/settingsStore'
import { missionLocked, useCampaignStore } from '../state/campaignStore'
import { useResearchStore } from '../state/researchStore'
import { warmTacticalMaps } from './briefMap'
import { useTutorialStore } from '../state/tutorialStore'
import { useSaveStatusStore } from '../state/saveStatusStore'
import { screenWriteFailureLine } from './filingStatus'
import { INFLUENCE_MOMENT_ID, WORLD_ONBOARD_ID } from '../game/tutorial'
import type { MissionDef, SectorId } from '../game/types'
import type { SectorState } from '../state/worldStore'
import {
  CITIES,
  CITIES_BY_SECTOR,
  CORPS,
  KEY_ORDER,
  LAT_LINES,
  LIGHTS_BY_SECTOR,
  LON_LINES,
  OPEN_SECTORS,
  SCAN_H,
  SCAN_W,
  SECTORS,
  SECTOR_COORD,
  SECTOR_VIEW,
  SECTOR_GLYPH_VIEW,
  SECTOR_SHAPES,
  sectorCorp,
  sectorDef,
  graticuleY,
} from '../game/atlas'
import type { CorpId } from '../game/atlas'
import { Chip, LockGlyph, Panel, ScrollBox, SegBar, TargetGlyph } from './bits'
import { ScreenChrome } from './Nav'
import { act, agoLabel, fmt } from './util'
import { uiClick } from './sound'
import type { GlobeOperation } from './WorldGlobe'
import { unprojectScan } from '../game/geography'
import { campaignBanner, campaignBannerCount } from './campaignBanner'
import { reviewKey } from './timelineKeys'
import {
  influenceActionsFor,
  influenceStatus,
  taxEligibilityLine,
  holderLine,
  eventToneClass,
  intelGate,
  lockReason,
  unrestTone,
  worldChance,
} from './worldChrome'
import { clockUse, influenceMoment, influenceMomentCopy, influenceMomentShown, orientationRows, startHere } from './worldOnboard'

const WorldGlobe = lazy(() => import('./WorldGlobe'))

function WarningGlyph() {
  return <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M10 2 19 18H1Z" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M10 7v5m0 2v1" stroke="currentColor" strokeWidth="1.8" /></svg>
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

// One vertex per open sector, unrest as height, so the scan chip is a live
// readout rather than a decoration.
function unrestSpark(sectors: Record<string, SectorState>): string {
  const n = OPEN_SECTORS.length
  return OPEN_SECTORS.map((id, i) => {
    const x = n <= 1 ? 35 : (i / (n - 1)) * 70
    const y = 14 - clamp01(sectors[id].unrest / 100) * 12
    return x.toFixed(1) + ',' + y.toFixed(1)
  }).join(' ')
}

// Success chance is derived, never authored: it moves with sector state and
// completed research, exactly as the brief computes it.
function chanceFor(
  m: MissionDef,
  sectors: Record<string, SectorState>,
  researchedCount: number,
  difficulty: Difficulty,
): number {
  return missionChance(m, missionMods(m, sectors[m.sector], difficulty), researchedCount)
}

// One operations entry: an authored mission, or a generated contract with its
// derived mission. Both render through the same rows and markers.
interface OpEntry {
  m: MissionDef
  gen: GeneratedContract | null
}

// Generated offers above the director's Intel are absent from Scan and OPEN
// CONTRACTS (visibleContracts; worldStore.contracts keeps the record).
// Authored contracts stay listed as locked.
function opsFor(
  sector: SectorId | null,
  contracts: GeneratedContract[],
  intelLevel: number,
): OpEntry[] {
  return [
    ...MISSIONS.filter((m) => sector === null || m.sector === sector).map((m) => ({
      m,
      gen: null,
    })),
    ...visibleContracts(contracts, intelLevel)
      .filter((c) => sector === null || c.sector === sector)
      .map((c) => ({ m: contractMission(c), gen: c })),
  ]
}

// Hours until a generated offer is rescinded. The selector output only moves
// once per world hour, so the countdown never re-renders at clock rate.
function ExpiryHours(props: { at: number }) {
  const hours = useWorldStore((s) => Math.max(0, Math.ceil((props.at - s.t) / 3600)))
  return <>{hours}H</>
}

/* ---------------------------- influence actions ---------------------------- */

// What each numbered action does, printed from the same data worldStore
// applies (game/influence.ts).
function actionEffect(id: InfluenceActionId): string {
  const def = INFLUENCE_ACTIONS[id]
  if (id === 'expedite') {
    return 'WAIVE INTEL GATE // +' + EXPEDITE_EXTENSION_SEC / 3600 + 'H EXPIRY'
  }
  const total = def.steps * (def.unrestDelta !== 0 ? def.unrestDelta : def.controlDelta)
  const stat = def.unrestDelta !== 0 ? 'UNREST' : 'CONTROL'
  const hours = (def.steps * def.stepSec) / 3600
  return (total > 0 ? '+' : '') + total + ' ' + stat + ' OVER ' + hours + 'H'
}

function InfluenceAction(props: { sector: SectorId; action: InfluenceActionId }) {
  const def = INFLUENCE_ACTIONS[props.action]
  const spend = useWorldStore((s) => s.spendInfluence)
  // Hour-resolution selectors, so the rows never re-render at clock rate.
  const coolHours = useWorldStore((s) =>
    Math.max(0, Math.ceil(((s.cooldowns[cooldownKey(props.sector, props.action)] ?? 0) - s.t) / 3600)),
  )
  const active = useWorldStore((s) =>
    s.spends.some((p) => p.sector === props.sector && p.action === props.action),
  )
  // The owner's own refusal (worldStore.influenceRefusal, the rule
  // spendInfluence refuses on); Interface only words it.
  const refusal = useWorldStore((s) => influenceRefusal(s, props.sector, props.action))
  const blocked = refusal !== null
  const status = influenceStatus(refusal, active, coolHours)
  return (
    <div className="wm-act-wrap">
      <button
        type="button"
        className={'wm-act' + (active ? ' active' : '')}
        disabled={blocked}
        aria-label={
          def.num + ' ' + def.name + ' // ' + def.cost + ' PTS // ' +
          actionEffect(props.action) + ' // ' + status
        }
        onClick={act(() => spend(props.sector, props.action))}
      >
        <span className="wm-act-name">
          <b className="wm-act-num">{def.num}</b> {def.name}
        </span>
        <span className="wm-act-sub">
          <b className="wm-act-cost">{def.cost}P</b>
          <i
            className={
              'wm-act-status ' +
              (status === 'ACTIVE' ? 'teal' : status === 'CLEAR' ? '' : 'dim')
            }
          >
            {status}
          </i>
        </span>
      </button>
      {/* The effect prints as text under its button (P-03; spec Open Question 8). */}
      <span className="wm-act-effect" aria-hidden="true">
        {actionEffect(props.action)}
      </span>
    </div>
  )
}

// The Influence moment (World Network Core Rule 13): one teaching note on
// the sector panel the first time any numbered action is affordable on the
// focused sector, once per campaign. The trigger is the owner's refusal
// (influenceRefusal === null), so Antarctica, cooldowns, a target-less
// Expedite and the opening 0 points never fire it. The mark is made from an
// effect on the first firing, guarded by the seen set, and the note stays up
// until dismissed; marked on a Screen, it is durable on the next autosave.
function useInfluenceMoment(sector: SectorId): {
  shown: InfluenceActionId | null
  dismiss: () => void
} {
  const seen = useTutorialStore((s) => s.seen.includes(INFLUENCE_MOMENT_ID))
  const markSeen = useTutorialStore((s) => s.markSeen)
  // Primitive selector: the first affordable action, or null. Re-renders
  // only when that answer changes, never at clock rate.
  const affordable = useWorldStore((s) =>
    influenceMoment((action) => influenceRefusal(s, sector, action)),
  )
  const [fired, setFired] = useState<{ action: InfluenceActionId; sector: SectorId } | null>(null)
  useEffect(() => {
    if (seen || fired !== null || affordable === null) return
    setFired({ action: affordable, sector })
    markSeen(INFLUENCE_MOMENT_ID)
  }, [seen, fired, affordable, sector, markSeen])
  // A refocus hides the note at once (influenceMomentShown) and drops it, so
  // focusing back does not bring it back.
  useEffect(() => {
    if (fired !== null && fired.sector !== sector) setFired(null)
  }, [fired, sector])
  const dismiss = useCallback(() => {
    uiClick()
    markSeen(INFLUENCE_MOMENT_ID)
    setFired(null)
  }, [markSeen])
  return { shown: influenceMomentShown(fired, sector), dismiss }
}

// The note itself. The right column has no slack at 1280x720, so while the
// note is up it takes the sector inset's slot (decorative art; the sector
// list duplicates its stepper) rather than crushing OPEN CONTRACTS.
function InfluenceMomentNote(props: { action: InfluenceActionId; onDismiss: () => void }) {
  const copy = influenceMomentCopy(props.action, actionEffect(props.action))
  return (
    <div className="wm-moment corners" role="note" aria-label={copy.title}>
      <span className="wm-moment-head">
        <b className="wm-moment-title">{copy.title}</b>
        <button
          type="button"
          className="hud-btn wm-moment-btn"
          aria-label="UNDERSTOOD // DISMISS THE INFLUENCE NOTE"
          onClick={props.onDismiss}
        >
          UNDERSTOOD
        </button>
      </span>
      <span className="wm-moment-body">{copy.body}</span>
    </div>
  )
}

/* ------------------------------ event forecast ----------------------------- */

const FORECAST_LABEL: Record<ForecastKind, string> = {
  riot: 'RIOT',
  blackout: 'BLKOUT',
  raid: 'RAID',
  trade: 'TRADE',
  seizure: 'SEIZE',
}

// Next-six-strategic-hours Event forecast for the focused sector, derived from
// the same weights the generator rolls from. The second strategic use of
// intel: the readout needs level 2.
function SectorForecast(props: { id: SectorId }) {
  const intelLevel = useCampaignStore((s) => s.intelLevel)
  const sectors = useWorldStore((s) => s.sectors)
  const crisis = useWorldStore((s) => s.crisis)
  if (intelLevel < 2) {
    return (
      <div className="wm-fc" title="EVENT FORECAST // NEXT 6 STRATEGIC HOURS">
        <label>EVENT FORECAST</label>
        <span className="wm-fc-lock dim">{intelGate(2)}</span>
      </div>
    )
  }
  const rows = eventForecast(
    OPEN_SECTORS.map((sec) => ({
      sector: sec,
      unrest: sectors[sec].unrest,
      crisis: crisis.includes(sec),
    })),
    props.id,
  )
  return (
    <div
      className="wm-fc"
      title="EVENT FORECAST // CHANCE PER CATEGORY OVER THE NEXT 6 STRATEGIC HOURS"
    >
      <label>EVENT FORECAST</label>
      {rows.map((r) => (
        <span key={r.kind} className="wm-fc-chip">
          <i>{FORECAST_LABEL[r.kind]}</i>
          <b>{r.chance}%</b>
        </span>
      ))}
    </div>
  )
}

/* ---------------------------------- Scan ---------------------------------- */

function WorldScan() {
  const sectors = useWorldStore((s) => s.sectors)
  const owner = useWorldStore((s) => s.owner)
  const selected = useWorldStore((s) => s.selected)
  const contracts = useWorldStore((s) => s.contracts)
  const selectMission = useAppStore((s) => s.selectMission)
  const intelLevel = useCampaignStore((s) => s.intelLevel)
  const campaignFailed = useCampaignStore((s) => s.campaignFailed)
  const researched = useResearchStore((s) => s.done)
  const difficulty = useSettingsStore((s) => s.difficulty)
  const marks = useMemo(() => opsFor(null, contracts, intelLevel), [contracts, intelLevel])
  const fresh = useMemo<GlobeOperation[]>(() => marks
    .filter(({ m, gen }) => gen === null || (!campaignFailed && !missionLocked(m, intelLevel)))
    .map(({ m }) => ({
      id: m.id, name: m.codename, city: m.city, sector: m.sector,
      location: CITIES.find((city) => city.name === m.city) ?? unprojectScan(m.mapPos.x / 100 * SCAN_W, m.mapPos.y / 100 * SCAN_H),
      locked: campaignFailed || missionLocked(m, intelLevel),
      requirement: lockReason(campaignFailed, m.intelReq),
      type: m.type, chance: chanceFor(m, sectors, researched.length, difficulty), etaDays: m.etaDays,
    })), [marks, campaignFailed, intelLevel, sectors, researched.length, difficulty])
  // sectors changes on every strategic tick (20 Hz) but the rounded chance a
  // marker shows rarely does. Keep the previous list while every shown field
  // is equal, so the memoised globe and its canvas skip the tick.
  const shown = fresh.map((o) => [o.id, o.name, o.city, o.sector, o.locked, o.requirement, o.type, o.chance, o.etaDays].join('|')).join('/')
  const kept = useRef<{ shown: string; ops: GlobeOperation[] } | null>(null)
  if (!kept.current || kept.current.shown !== shown) kept.current = { shown, ops: fresh }
  const operations = kept.current.ops
  const openOperation = useCallback((id: string) => { uiClick(); selectMission(id) }, [selectMission])
  // Warm the Brief's tactical maps for the openable contracts in idle time,
  // with the inputs the Brief will use (ui/index.tsx BriefScreen), so the
  // click that opens one does not build the city.
  useEffect(() => {
    const won = useCampaignStore.getState().contractsWon
    const live = useWorldStore.getState().sectors
    const jobs = marks
      .filter(({ m }) => !campaignFailed && !missionLocked(m, intelLevel))
      .map(({ m }) => {
        const mods = missionMods(m, live[m.sector], difficulty)
        return {
          mission: m,
          spec: missionVariant(m, won.includes(m.id)),
          gen: { enemyExtra: mods.enemyExtra, civilianCount: mods.civilianCount, officerCount: mods.officerCount, heavyCount: mods.heavyCount },
        }
      })
    return warmTacticalMaps(jobs)
  }, [marks, campaignFailed, intelLevel, difficulty, shown])

  const corps = useMemo(() => {
    const out: Record<string, CorpId> = {}
    for (const s of SECTORS) out[s.id] = sectorCorp(s.id, owner)
    return out
  }, [owner])
  const keyCount = useMemo(() => {
    const out: Record<string, number> = {}
    for (const s of SECTORS) out[corps[s.id]] = (out[corps[s.id]] ?? 0) + 1
    return out
  }, [corps])
  const focusDef = sectorDef(selected)

  return (
    <>
      <Suspense fallback={<div className="globe-status" role="status">ACQUIRING ORBITAL VIEW</div>}>
        <WorldGlobe operations={operations} onOpen={openOperation} />
      </Suspense>

      <div className="wm-ov tl">
        <b>ORBITAL VIEW</b>
        <span className="dim">SAT-16E // LIVE</span>
        <svg viewBox="0 0 70 16" className="wm-spark" aria-hidden="true">
          <polyline points={unrestSpark(sectors)} />
        </svg>
      </div>
      <div className="wm-ov tc">
        <b>{focusDef.title}</b>
        <span className="dim">{CORPS[corps[selected]].name}</span>
      </div>
      <div className="wm-ov br">
        <b className="wm-key-head">
          CONTROL KEY<span className="dim">SECTORS</span>
        </b>
        {KEY_ORDER.map((id) => (
          <span key={id} className="wm-key-row">
            <i className={'corp-' + id} />
            <span className="wm-key-name">{CORPS[id].name}</span>
            <b className="wm-key-n">{keyCount[id] ?? 0}</b>
          </span>
        ))}
      </div>
    </>
  )
}

/* ------------------------------ sector inset ------------------------------ */

function SectorInset(props: { id: SectorId }) {
  const owner = useWorldStore((s) => s.owner)
  const step = useWorldStore((s) => s.stepSector)
  const contracts = useWorldStore((s) => s.contracts)
  const inCrisis = useWorldStore((s) => s.crisis.includes(props.id))
  const intelLevel = useCampaignStore((s) => s.intelLevel)
  const def = sectorDef(props.id)
  const corp = sectorCorp(props.id, owner)
  const cities = CITIES_BY_SECTOR[props.id] ?? []
  const lights = LIGHTS_BY_SECTOR[props.id] ?? []
  const generated = visibleContracts(contracts, intelLevel).find((c) => c.sector === props.id)
  const mission =
    MISSIONS.find((m) => m.sector === props.id) ??
    (generated ? contractMission(generated) : undefined)

  return (
    <div className="wm-inset corners">
      <svg viewBox={SECTOR_VIEW[props.id]} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <g className="wm-inset-grid">
          {LON_LINES.map((x) => (
            <line key={'x' + x} x1={x} y1={0} x2={x} y2={SCAN_H} />
          ))}
          {LAT_LINES.map((lat) => (
            <line key={'y' + lat} x1={0} y1={graticuleY(lat)} x2={SCAN_W} y2={graticuleY(lat)} />
          ))}
        </g>
        {SECTOR_SHAPES[props.id].map((t) => (
          <polygon
            key={t.id}
            className={'wm-inset-land corp-' + corp + (inCrisis ? ' crisis' : '')}
            points={t.pts}
          />
        ))}
        <g className={'wm-lights corp-' + corp}>
          {lights.map((l, i) => (
            <circle key={i} cx={l.x} cy={l.y} r={l.r * 0.9} />
          ))}
        </g>
        {cities.map((c) => (
          <g key={c.id} className={'wm-city corp-' + (owner[c.id] ?? c.corp)}>
            <circle cx={c.x} cy={c.y} r="4" className="halo" />
            <circle cx={c.x} cy={c.y} r="1.4" className="core" />
          </g>
        ))}
        {mission && !missionLocked(mission, intelLevel) && (
          <g className="wm-inset-target">
            <circle cx={(mission.mapPos.x / 100) * SCAN_W} cy={(mission.mapPos.y / 100) * SCAN_H} r="7" />
            <circle
              cx={(mission.mapPos.x / 100) * SCAN_W}
              cy={(mission.mapPos.y / 100) * SCAN_H}
              r="2"
              className="core"
            />
          </g>
        )}
      </svg>
      <button
        type="button"
        className="wm-inset-chev l"
        onClick={act(() => step(-1))}
        aria-label="FOCUS PREVIOUS SECTOR"
      >
        &lt;
      </button>
      <button
        type="button"
        className="wm-inset-chev r"
        onClick={act(() => step(1))}
        aria-label="FOCUS NEXT SECTOR"
      >
        &gt;
      </button>
      <span className="wm-inset-tag">
        {def.name} // {CORPS[corp].name}
      </span>
    </div>
  )
}

/* -------------------------------- time code ------------------------------- */

function TimeCode() {
  const t = useWorldStore((s) => s.t)
  const review = useWorldStore((s) => s.review)
  const setReview = useWorldStore((s) => s.setReview)
  const at = review ?? t
  const s = stamp(at)
  return (
    <>
      <div className={'wm-date' + (review !== null ? ' review' : '')}>{s.date}</div>
      <div className="wm-clock">{s.clock} UTC</div>
      {review === null ? (
        <span className="wm-live">
          <i className="wm-live-dot" aria-hidden="true" />
          LIVE
        </span>
      ) : (
        <button
          type="button"
          className="wm-live review"
          onClick={act(() => setReview(null))}
          aria-label={'REVIEWING ' + agoLabel(t - at) + ' BACK // RETURN TO LIVE'}
        >
          <span>REVIEW -{agoLabel(t - at)}</span>
          <span className="wm-live-go">&gt; GO LIVE</span>
        </button>
      )}
    </>
  )
}

/* -------------------------------- timeline -------------------------------- */

function Timeline() {
  const t = useWorldStore((s) => s.t)
  const review = useWorldStore((s) => s.review)
  const events = useWorldStore((s) => s.events)
  const setReview = useWorldStore((s) => s.setReview)
  const ref = useRef<HTMLDivElement>(null)

  const at = review ?? t
  const frac = clamp01((at - (t - DAY)) / DAY)
  const ticks = useMemo(() => events.filter((e) => e.t >= t - DAY && e.t <= t), [events, t])

  const seek = useCallback(
    (clientX: number) => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const f = clamp01((clientX - r.left) / r.width)
      const now = useWorldStore.getState().t
      setReview(f > 0.985 ? null : now - DAY * (1 - f))
    },
    [setReview],
  )

  return (
    <div className="wm-tl">
      <div
        ref={ref}
        className="wm-tl-track"
        role="slider"
        tabIndex={0}
        aria-label="TIMELINE REVIEW"
        aria-valuemin={-24}
        aria-valuemax={0}
        aria-valuenow={Math.round(((at - t) / 3600) * 10) / 10}
        aria-valuetext={review === null ? 'LIVE' : hhmm(at)}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          seek(e.clientX)
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) seek(e.clientX)
        }}
        onKeyDown={(e) => {
          const next = reviewKey(e.key, useWorldStore.getState().t, review)
          if (next === undefined) return
          setReview(next)
          e.preventDefault()
        }}
      >
        <span className="wm-tl-fill" style={{ width: frac * 100 + '%' }} />
        {ticks.map((e) => (
          <i
            key={e.id}
            className={'wm-tl-ev ' + eventToneClass(e.tone)}
            style={{ left: clamp01((e.t - (t - DAY)) / DAY) * 100 + '%' }}
          />
        ))}
        <span
          className={'wm-tl-handle' + (review !== null ? ' review' : '')}
          style={{ left: frac * 100 + '%' }}
        />
      </div>
      <div className="wm-tl-axis">
        <span>-24H</span>
        <span>-12H</span>
        <span>-6H</span>
        <span className={review === null ? 'now' : undefined}>NOW</span>
      </div>
    </div>
  )
}

function TimeControl() {
  const speed = useWorldStore((s) => s.speed)
  const paused = useWorldStore((s) => s.paused)
  const setSpeed = useWorldStore((s) => s.setSpeed)
  const togglePause = useWorldStore((s) => s.togglePause)
  const markSeen = useTutorialStore((s) => s.markSeen)
  return (
    <div className="wm-tc">
      <div className="wm-transport">
        <button
          type="button"
          className={'wm-tbtn' + (paused ? ' on' : '')}
          onClick={act(() => clockUse(togglePause, markSeen))}
          aria-pressed={paused}
          aria-label={paused ? 'RESUME STRATEGIC CLOCK' : 'PAUSE STRATEGIC CLOCK'}
        >
          <svg viewBox="0 0 12 12" aria-hidden="true">
            {paused ? (
              <polygon points="3,2 10,6 3,10" />
            ) : (
              <>
                <rect x="3" y="2" width="2.6" height="8" />
                <rect x="6.8" y="2" width="2.6" height="8" />
              </>
            )}
          </svg>
        </button>
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            className={'wm-tbtn' + (!paused && speed === s ? ' on' : '')}
            onClick={act(() => clockUse(() => setSpeed(s), markSeen))}
            aria-pressed={!paused && speed === s}
            aria-label={'CLOCK SPEED ' + s + 'X'}
          >
            {s}X
          </button>
        ))}
      </div>
      <div className="wm-speed">
        CLOCK SPEED: <b className={paused ? 'red' : 'teal'}>{paused ? 'PAUSED' : speed + 'X'}</b>
      </div>
    </div>
  )
}

/* ------------------------------- events feed ------------------------------ */

function FeedRow(props: { event: WorldEvent }) {
  const select = useWorldStore((s) => s.select)
  const markRead = useWorldStore((s) => s.markRead)
  const contracts = useWorldStore((s) => s.contracts)
  const intelLevel = useCampaignStore((s) => s.intelLevel)
  const e = props.event
  const text = feedText(e, contracts, intelLevel)
  return (
    <button
      type="button"
      className={'wm-feed-line ' + eventToneClass(e.tone)}
      aria-label={hhmm(e.t) + ' ' + text + ' // FOCUS ' + sectorDef(e.sector).name}
      onClick={act(() => {
        markRead()
        select(e.sector)
      })}
    >
      <span className="wm-feed-t">{hhmm(e.t)}</span>
      <span className="wm-feed-x">{text}</span>
      <span className="wm-feed-chev" aria-hidden="true">
        &gt;
      </span>
    </button>
  )
}

function EventsFeed() {
  const events = useWorldStore((s) => s.events)
  const review = useWorldStore((s) => s.review)
  const shown = useMemo(() => {
    const list = review === null ? events : events.filter((e) => e.t <= review)
    return list.slice(-14).reverse()
  }, [events, review])

  // Rows arrive at the head, so browser scroll anchoring is what keeps the line
  // a reader is on from sliding down as traffic comes in. It is left on: it
  // already handles rows leaving the tail on a scrub, which is more than a hand
  // rolled offset correction covers.
  //
  // A primitive the fade can key on: it moves whenever a row enters or leaves,
  // and holds its identity across commits that leave the list alone. The row
  // count alone will not do, since it stops changing at the cap and the fade
  // would then measure children that are no longer there.
  const dep = `${shown.length}:${shown[0]?.id ?? -1}`

  return (
    <ScrollBox className="wm-feed-list" dep={dep}>
      {shown.length === 0 ? (
        <div className="wm-empty">-- CHANNEL OPEN --</div>
      ) : (
        shown.map((e) => <FeedRow key={e.id} event={e} />)
      )}
    </ScrollBox>
  )
}

function UnreadBadge() {
  const unread = useWorldStore((s) => s.unread)
  const markRead = useWorldStore((s) => s.markRead)
  if (unread === 0) return <span className="dim">FEED CLEAR</span>
  return (
    <button
      type="button"
      className="wm-unread"
      onClick={act(markRead)}
      aria-label={unread + ' UNREAD // MARK ALL EVENTS READ'}
    >
      {unread} UNREAD
    </button>
  )
}

/* -------------------------------- the screen ------------------------------ */

// First-visit orientation: four rows (THE JOB, START HERE, STRATEGIC TIME,
// the four numbers) and nothing else (GDD Core Rule 13: teach the job, not
// "click the marker"; the nine-row card read as too dense). Influence is
// taught on the sector panel when first affordable, Research on the first
// Debrief. Shows once per campaign; the dismissal persists with the save
// through the tutorial seen set.
function WorldOnboard() {
  const seen = useTutorialStore((s) => s.seen)
  const markSeen = useTutorialStore((s) => s.markSeen)
  const contracts = useWorldStore((s) => s.contracts)
  const sectors = useWorldStore((s) => s.sectors)
  const intelLevel = useCampaignStore((s) => s.intelLevel)
  const campaignFailed = useCampaignStore((s) => s.campaignFailed)
  const researchedCount = useResearchStore((s) => s.done.length)
  const difficulty = useSettingsStore((s) => s.difficulty)
  // START HERE reads the same list the Scan prints, every sector, with the
  // Chance the owner derives; it picks, it does not compute.
  const target = useMemo(
    () =>
      startHere(
        opsFor(null, contracts, intelLevel).map(({ m }) => ({
          codename: m.codename,
          city: m.city,
          chance: chanceFor(m, sectors, researchedCount, difficulty),
          locked: campaignFailed || missionLocked(m, intelLevel),
        })),
      ),
    [contracts, intelLevel, sectors, researchedCount, difficulty, campaignFailed],
  )
  // A failed write shows inside the card while it is up, so the fixed notice
  // never lies over its text (BUG-0003). The fixed region stays the live
  // region screen readers announce; this copy is visual only.
  const failLine = screenWriteFailureLine(useSaveStatusStore((s) => s.status))
  if (seen.includes(WORLD_ONBOARD_ID)) return null
  return (
    <div
      className="hud-menu-wrap wm-onboard-wrap"
      role="dialog"
      aria-label="World Network orientation"
    >
      <div className="hud-menu-panel wm-onboard">
        <Panel title="WORLD NETWORK // ORIENTATION" right={<span className="dim">FIRST UPLINK</span>}>
          {failLine && (
            <div className="write-fail-notice wm-onboard-fail corners" aria-hidden="true">
              {failLine}
            </div>
          )}
          <div className="wm-onboard-rows">
            {orientationRows(target).map((row) => (
              <div key={row.id} className="wm-onboard-row lead" data-row={row.id}>
                <b>{row.title}</b>
                {row.lines.length === 1 ? (
                  <span>{row.lines[0]}</span>
                ) : (
                  <span className="wm-onboard-lines">
                    {row.lines.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="hud-menu-actions">
            <button
              type="button"
              className="hud-btn pause"
              aria-label="UNDERSTOOD // DISMISS THE ORIENTATION"
              autoFocus
              onClick={() => {
                uiClick()
                markSeen(WORLD_ONBOARD_ID)
              }}
            >
              UNDERSTOOD
            </button>
          </div>
        </Panel>
      </div>
    </div>
  )
}

export function WorldMap() {
  const selectMission = useAppStore((s) => s.selectMission)
  const sectors = useWorldStore((s) => s.sectors)
  const selected = useWorldStore((s) => s.selected)
  const select = useWorldStore((s) => s.select)
  const intelLevel = useCampaignStore((s) => s.intelLevel)
  const intelProgress = useCampaignStore((s) => s.intelProgress)
  const campaignWon = useCampaignStore((s) => s.campaignWon)
  const campaignFailed = useCampaignStore((s) => s.campaignFailed)
  const contractsWon = useCampaignStore((s) => s.contractsWon)
  const researched = useResearchStore((s) => s.done)
  const difficulty = useSettingsStore((s) => s.difficulty)
  const contracts = useWorldStore((s) => s.contracts)
  const crisis = useWorldStore((s) => s.crisis)

  const def = sectorDef(selected)
  const read = sectorReadout(selected, sectors[selected])
  const owner = useWorldStore((s) => s.owner)
  const taxLine = taxEligibilityLine(taxEligible(selected, owner))
  const holder = holderLine(selected, owner)
  const ops = useMemo(
    () => opsFor(selected, contracts, intelLevel),
    [selected, contracts, intelLevel],
  )
  const openOps = ops.filter(({ m }) => !missionLocked(m, intelLevel)).length
  const banner = campaignBanner(campaignWon, campaignFailed)
  const bannerCount = campaignBannerCount(banner, contractsWon)
  const moment = useInfluenceMoment(selected)
  const focusUnrest = unrestTone(
    crisis.includes(selected),
    !def.locked && read.unrest > PRESSURE_UNREST_MIN,
  )

  return (
    <ScreenChrome
      current="world"
      title="WORLD NETWORK"
      subtitle={<div className="screen-sub">NEXUS GLOBAL // GEOSTRATEGIC COMMAND INTERFACE</div>}
      className="wm"
    >
      {banner === 'failed' && (
        <div className="wm-campaign-fail corners" role="status">
          <span className="wm-campaign-sigil fail" aria-hidden="true">◆</span>
          <span>
            <b>CAMPAIGN FAILED</b>
            <i>ROSTER EMPTY // NO CONTRACT CAN BE TAKEN</i>
          </span>
          <strong>{bannerCount}</strong>
        </div>
      )}
      {banner === 'complete' && (
        <div className="wm-campaign-win corners" role="status">
          <span className="wm-campaign-sigil" aria-hidden="true">◆</span>
          <span>
            <b>CAMPAIGN COMPLETE</b>
            <i>ALL THREE AUTHORED CONTRACTS FULFILLED // WORLD NETWORK REMAINS ACTIVE</i>
          </span>
          <strong>{bannerCount}</strong>
        </div>
      )}

      <div className="wm-main">
        {/* left: sectors (Influence prints in the header only) */}
        <aside className="wm-left">
          <Panel
            title="SECTORS"
            right={
              <span className="dim">
                {OPEN_SECTORS.length} / {SECTORS.length}
              </span>
            }
            className="wm-sectors"
            bodyClassName="wm-sectors-body"
          >
            <ScrollBox className="wm-sector-list" dep={selected}>
              {SECTORS.map((sec) => {
                const st = sectors[sec.id]
                const sel = sec.id === selected
                const inCrisis = crisis.includes(sec.id)
                const pressure = !sec.locked && st.unrest > PRESSURE_UNREST_MIN
                return (
                  <button
                    key={sec.id}
                    type="button"
                    className={
                      'wm-sector' +
                      (sel ? ' sel' : '') +
                      (sec.locked ? ' locked' : '') +
                      (inCrisis ? ' crisis' : '')
                    }
                    aria-pressed={sel}
                    aria-disabled={sec.locked || undefined}
                    aria-label={
                      sec.locked
                        ? sec.name + ' // NO SURVEY DATA'
                        : sec.name +
                          ' // CONTROL ' +
                          Math.round(st.control) +
                          '% // UNREST ' +
                          Math.round(st.unrest) +
                          '%' +
                          (inCrisis ? ' // CRISIS' : pressure ? ' // UNREST PRESSURE' : '')
                    }
                    onClick={sec.locked ? undefined : act(() => select(sec.id))}
                  >
                    <span className="wm-sector-glyph">
                      <svg viewBox={SECTOR_GLYPH_VIEW[sec.id]} aria-hidden="true">
                        {SECTOR_SHAPES[sec.id].map((t) => <polygon key={t.id} points={t.pts} />)}
                      </svg>
                    </span>
                    <span className="wm-sector-main">
                      <span className="wm-sector-top">
                        <b className="wm-sector-name">{sec.name}</b>
                        {sec.locked && <span className="wm-sector-lock"><LockGlyph size={12} /></span>}
                      </span>
                      {sec.locked ? <span className="wm-sector-sub dim">NO SURVEY DATA</span> : (
                        <>
                          <span className="wm-sector-reading"><span>CONTROL</span><b>{Math.round(st.control)}%</b></span>
                          <span className="wm-sector-reading"><span>UNREST</span><b className={unrestTone(inCrisis, pressure).ink}>{Math.round(st.unrest)}%</b></span>
                          {pressure || inCrisis ? <span className={'wm-sector-warning ' + (inCrisis ? 'red' : 'notice')}><WarningGlyph />{inCrisis ? 'CRISIS' : 'UNREST PRESSURE'}</span> : <SegBar value={st.control} mini className="wm-sector-bar" />}
                        </>
                      )}
                    </span>
                  </button>
                )
              })}
            </ScrollBox>
          </Panel>
        </aside>

        {/* center: Scan + mission markers */}
        <section className="wm-center corners">
          <div className="wm-map-wrap">
            <WorldScan />
          </div>
        </section>

        {/* right: focused sector + operations */}
        <aside className="wm-right">
          <Panel
            title={def.title}
            right={
              crisis.includes(selected) ? (
                <Chip tone="red">CRISIS</Chip>
              ) : (
                <Chip tone="teal">FOCUS</Chip>
              )
            }
            bodyClassName="wm-sector-panel-body"
          >
            {/* Scrolls when the readout, actions and forecast outgrow the
                column (125% text scale); OPEN CONTRACTS keeps its row. */}
            <ScrollBox className="wm-sector-scroll" dep={selected}>
              {moment.shown === null && <SectorInset id={selected} />}
              <div className="kv">
                <span>COORD</span>
                <b>{SECTOR_COORD[selected]}</b>
              </div>
              <div className="wm-cu">
                <div>
                  <label>CONTROL</label>
                  <b className="teal">{Math.round(read.control)}%</b>
                  <SegBar value={read.control} mini />
                </div>
                <div>
                  <label>UNREST</label>
                  <b className={focusUnrest.ink}>{Math.round(read.unrest)}%</b>
                  <SegBar value={read.unrest} tone={focusUnrest.bar} mini />
                </div>
              </div>
              <div className="kv">
                <span>HELD BY</span>
                <b className={'wm-kv-readout ' + holder.tone}>{holder.text}</b>
              </div>
              <div className="kv">
                <span>TAX YIELD</span>
                <b className="wm-kv-readout">{fmt(read.taxYield)} CR / 24h</b>
              </div>
              <div className="kv wm-tax-pay">
                <span>TAX PAID</span>
                <b className={'wm-kv-readout ' + taxLine.tone}>{taxLine.text}</b>
              </div>
              <div className="kv">
                <span>GARRISON CONDITION</span>
                <b className={'wm-kv-readout ' + (read.garrison === 'SECURE' ? 'teal' : read.garrison === 'STRAINED' ? 'notice' : 'red')}>
                  {read.garrison}
                </b>
              </div>
              <div className="wm-actions">
                {influenceActionsFor(selected).map((action) => (
                  <InfluenceAction key={action} sector={selected} action={action} />
                ))}
              </div>
              {moment.shown !== null && (
                <InfluenceMomentNote action={moment.shown} onDismiss={moment.dismiss} />
              )}
              <SectorForecast id={selected} />
            </ScrollBox>
          </Panel>
          <Panel
            title="OPEN CONTRACTS"
            right={
              <span className="dim">
                {openOps} / {ops.length}
              </span>
            }
            className="wm-ops"
            bodyClassName="wm-ops-body"
          >
            <ScrollBox className="wm-ops-list" dep={selected}>
              {ops.length === 0 ? (
                <div className="wm-empty">
                  NO CONTRACTS POSTED IN {def.name}
                  <i className="dim">SECTOR UNDER PASSIVE MONITORING</i>
                </div>
              ) : (
                ops.map(({ m, gen }) => {
                  const locked = campaignFailed || missionLocked(m, intelLevel)
                  const reason = lockReason(campaignFailed, m.intelReq)
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={'wm-op' + (locked ? ' locked' : '')}
                      aria-disabled={locked || undefined}
                      aria-label={
                        locked
                          ? m.codename + ' // LOCKED // ' + reason
                          : 'OPEN CONTRACT ' +
                            m.codename +
                            ' // ' +
                            m.type +
                            ' // ' +
                            m.city +
                            (gen ? (gen.priority ? ' // PRIORITY CONTRACT' : ' // GENERATED CONTRACT') : '')
                      }
                      onClick={locked ? undefined : act(() => selectMission(m.id))}
                    >
                      <span className="wm-op-glyph">{locked ? <LockGlyph /> : <TargetGlyph />}</span>
                      <span className="wm-op-main">
                        <b>{m.codename}</b>
                        {locked ? (
                          <i className="red">{reason}</i>
                        ) : (
                          <i className="dim">
                            {m.type} // {m.city}
                          </i>
                        )}
                      </span>
                      <span className="wm-op-meta">
                        {gen && (
                          <span className={'chip ' + (gen.priority ? 'amber' : 'dim')}>
                            {gen.priority ? 'PRIORITY' : 'GENERATED'}
                          </span>
                        )}
                        <span className="chip dim">
                          {worldChance(chanceFor(m, sectors, researched.length, difficulty))}
                        </span>
                        <span className="chip dim">ETA {m.etaDays}D</span>
                        {gen && (
                          <span className="chip dim" title="EXPIRES">
                            EXPIRY <ExpiryHours at={gen.expiresAtT} />
                          </span>
                        )}
                      </span>
                    </button>
                  )
                })
              )}
            </ScrollBox>
          </Panel>
        </aside>
      </div>

      {/* bottom strip */}
      <div className="wm-bottom">
        <Panel title="TIME CODE" className="wm-time">
          <TimeCode />
        </Panel>
        <Panel title="TIMELINE" className="wm-timectl">
          <Timeline />
          <TimeControl />
        </Panel>
        <Panel title="FEED" right={<UnreadBadge />} className="wm-feed" bodyClassName="wm-feed-body">
          <EventsFeed />
        </Panel>
        {/* Credits, Influence and Roster print in the header; this panel
            carries only what the header does not: progress to the next level. */}
        <Panel title="INTEL" className="wm-intel-panel">
          <div className="kv">
            <span>LEVEL</span>
            <b>{intelLevel}</b>
          </div>
          <div className="kv">
            <span>PROGRESS</span>
            <b>{Math.round(intelProgress)} / 100</b>
          </div>
          <SegBar value={intelProgress} mini />
        </Panel>
      </div>

      <WorldOnboard />
    </ScreenChrome>
  )
}
