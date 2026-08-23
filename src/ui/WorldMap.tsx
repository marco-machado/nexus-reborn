// World Network screen. The sector list, the strategic plate, the sector
// readout and the operations list all read the same world state, and the
// transport under the map is what moves it.
import { useCallback, useMemo, useRef } from 'react'
import { useAppStore } from '../state/appStore'
import {
  DAY,
  SPEEDS,
  hhmm,
  sectorReadout,
  stamp,
  useWorldStore,
} from '../state/worldStore'
import type { WorldEvent } from '../state/worldStore'
import { MISSIONS } from '../game/data'
import { contractMission, expediteTarget } from '../game/contracts'
import type { GeneratedContract } from '../game/contracts'
import {
  EXPEDITE_EXTENSION_SEC,
  INFLUENCE_ACTIONS,
  INFLUENCE_ACTION_ORDER,
  cooldownKey,
} from '../game/influence'
import type { InfluenceActionId } from '../game/influence'
import { eventForecast } from '../game/forecast'
import type { ForecastKind } from '../game/forecast'
import { ROSTER_CAP } from '../game/recruits'
import { missionChance, missionMods } from '../game/missionParams'
import type { Difficulty } from '../game/missionParams'
import { useSettingsStore } from '../state/settingsStore'
import { missionLocked, useCampaignStore } from '../state/campaignStore'
import { useResearchStore } from '../state/researchStore'
import { useTutorialStore } from '../state/tutorialStore'
import { WORLD_ONBOARD_ID } from '../game/tutorial'
import type { MissionDef, SectorId } from '../game/types'
import type { SectorState } from '../state/worldStore'
import {
  ARCS,
  CITIES,
  CITIES_BY_SECTOR,
  CORPS,
  KEY_ORDER,
  LAT_LINES,
  LIGHTS_BY_SECTOR,
  LON_LINES,
  OPEN_SECTORS,
  PLATE_H,
  PLATE_W,
  SECTORS,
  SECTOR_COORD,
  SECTOR_VIEW,
  TERRITORIES,
  sectorCorp,
  sectorDef,
  graticuleY,
} from '../game/atlas'
import type { CorpId } from '../game/atlas'
import { Chip, LockGlyph, Panel, ScrollBox, SegBar, TargetGlyph } from './bits'
import { NavTabs } from './Nav'
import { useWorldClock } from './clock'
import { act, agoLabel, fmt } from './util'
import { uiClick } from './sound'
import { ART_BG, RED, WORLD_GLOW } from './tokens'
import { layoutPlateMarks, visiblePlateMarks } from './plateMarks'

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

function intelGate(level: number): string {
  return 'REQUIRES INTEL LVL ' + level
}

// One operations entry: an authored mission, or a generated contract with its
// derived mission. Both render through the same rows and markers.
interface OpEntry {
  m: MissionDef
  gen: GeneratedContract | null
}

function opsFor(sector: SectorId | null, contracts: GeneratedContract[]): OpEntry[] {
  return [
    ...MISSIONS.filter((m) => sector === null || m.sector === sector).map((m) => ({
      m,
      gen: null,
    })),
    ...contracts
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
  const points = useWorldStore((s) => s.influence)
  const spend = useWorldStore((s) => s.spendInfluence)
  // Hour-resolution selectors, so the rows never re-render at clock rate.
  const coolHours = useWorldStore((s) =>
    Math.max(0, Math.ceil(((s.cooldowns[cooldownKey(props.sector, props.action)] ?? 0) - s.t) / 3600)),
  )
  const active = useWorldStore((s) =>
    s.spends.some((p) => p.sector === props.sector && p.action === props.action),
  )
  const hasTarget = useWorldStore(
    (s) => props.action !== 'expedite' || expediteTarget(s.contracts, props.sector) !== null,
  )
  const short = points < def.cost
  const blocked = short || coolHours > 0 || !hasTarget
  const status = active
    ? 'ACTIVE'
    : coolHours > 0
      ? 'CD ' + coolHours + 'H'
      : !hasTarget
        ? 'NO TARGET'
        : short
          ? 'LOW PTS'
          : 'READY'
  return (
    <button
      type="button"
      className={'wm-act' + (active ? ' active' : '')}
      disabled={blocked}
      aria-label={
        def.num + ' ' + def.name + ' // ' + def.cost + ' PTS // ' +
        actionEffect(props.action) + ' // ' + status
      }
      title={actionEffect(props.action)}
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
            (status === 'READY' ? 'teal' : status === 'ACTIVE' ? 'amber' : 'dim')
          }
        >
          {status}
        </i>
      </span>
    </button>
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

// Next-6-world-hours event risk for the focused sector, derived from the same
// weights the generator rolls from. The second strategic use of intel: the
// readout needs level 2.
function SectorForecast(props: { id: SectorId }) {
  const intelLevel = useCampaignStore((s) => s.intelLevel)
  const sectors = useWorldStore((s) => s.sectors)
  const crisis = useWorldStore((s) => s.crisis)
  if (intelLevel < 2) {
    return (
      <div className="wm-fc" title="EVENT FORECAST // NEXT 6 WORLD HOURS">
        <label>FORECAST 6H</label>
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
      title="EVENT FORECAST // CHANCE PER CATEGORY OVER THE NEXT 6 WORLD HOURS"
    >
      <label>FORECAST 6H</label>
      {rows.map((r) => (
        <span key={r.kind} className="wm-fc-chip">
          <i>{FORECAST_LABEL[r.kind]}</i>
          <b>{r.chance}%</b>
        </span>
      ))}
    </div>
  )
}

/* ------------------------------- map plate -------------------------------- */

function WorldPlate() {
  const sectors = useWorldStore((s) => s.sectors)
  const owner = useWorldStore((s) => s.owner)
  const selected = useWorldStore((s) => s.selected)
  const contracts = useWorldStore((s) => s.contracts)
  const crisis = useWorldStore((s) => s.crisis)
  const selectMission = useAppStore((s) => s.selectMission)
  const intelLevel = useCampaignStore((s) => s.intelLevel)
  const campaignFailed = useCampaignStore((s) => s.campaignFailed)
  const researched = useResearchStore((s) => s.done)
  const difficulty = useSettingsStore((s) => s.difficulty)
  const marks = useMemo(() => opsFor(null, contracts), [contracts])
  const plateMarks = useMemo(
    () =>
      visiblePlateMarks(
        marks.map(({ m, gen }) => ({
          id: m.id,
          codename: m.codename,
          mapPos: m.mapPos,
          locked: campaignFailed || missionLocked(m, intelLevel),
          authored: gen === null,
        })),
      ),
    [marks, campaignFailed, intelLevel],
  )
  const layouts = useMemo(() => layoutPlateMarks(plateMarks), [plateMarks])
  const plateOps = useMemo(() => {
    const ids = new Set(plateMarks.map((m) => m.id))
    return marks.filter(({ m }) => ids.has(m.id))
  }, [marks, plateMarks])

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

  const corpOf = (sector: SectorId | null): CorpId => (sector ? corps[sector] : 'unknown')

  return (
    <>
    <div className="wm-map">
      <svg
        className="wm-map-svg"
        viewBox={`0 0 ${PLATE_W} ${PLATE_H}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="wm-glow" cx="0.5" cy="0.42" r="0.75">
            <stop offset="0" stopColor={WORLD_GLOW} stopOpacity="0.5" />
            <stop offset="1" stopColor={WORLD_GLOW} stopOpacity="0" />
          </radialGradient>
          <pattern
            id="wm-crisis-hatch"
            patternUnits="userSpaceOnUse"
            width="7"
            height="7"
            patternTransform="rotate(35)"
          >
            <path d="M0 0 H7" stroke={RED} strokeWidth="2" opacity="0.55" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={PLATE_W} height={PLATE_H} fill={ART_BG} />
        <rect x="0" y="0" width={PLATE_W} height={PLATE_H} fill="url(#wm-glow)" />

        <g className="wm-grat">
          {LON_LINES.map((x) => (
            <line key={'x' + x} x1={x} y1={0} x2={x} y2={PLATE_H} />
          ))}
          {LAT_LINES.map((lat) => (
            <line
              key={'y' + lat}
              className={lat === 0 ? 'strong' : undefined}
              x1={0}
              y1={graticuleY(lat)}
              x2={PLATE_W}
              y2={graticuleY(lat)}
            />
          ))}
        </g>
        <g className="wm-lat">
          {LAT_LINES.filter((lat) => lat !== -60).map((lat) => (
            <text key={'l' + lat} x={7} y={Math.max(10, graticuleY(lat) - 4)}>
              {lat}
            </text>
          ))}
        </g>

        <g className="wm-land-g">
          {TERRITORIES.map((t) => (
            <polygon
              key={t.id}
              className={
                'wm-land corp-' +
                corpOf(t.sector) +
                (t.sector === selected ? ' focus' : '') +
                (t.sector !== null && crisis.includes(t.sector) ? ' crisis' : '')
              }
              points={t.pts}
            />
          ))}
          {TERRITORIES.filter((t) => t.sector !== null && crisis.includes(t.sector)).map((t) => (
            <polygon key={'hatch-' + t.id} className="wm-crisis-hatch" points={t.pts} />
          ))}
        </g>

        {SECTORS.map((s) => (
          <g key={'lt' + s.id} className={'wm-lights corp-' + corps[s.id]}>
            {(LIGHTS_BY_SECTOR[s.id] ?? []).map((l, i) => (
              <circle key={i} cx={l.x} cy={l.y} r={l.r} />
            ))}
          </g>
        ))}

        <g className="wm-arcs">
          {ARCS.map((a, i) => (
            <path key={i} className={a.hot ? 'hot' : undefined} d={a.d} />
          ))}
        </g>

        <g className="wm-cities">
          {CITIES.map((c) => (
            <g key={c.id} className={'wm-city corp-' + (owner[c.id] ?? c.corp)}>
              <circle cx={c.x} cy={c.y} r="5.5" className="halo" />
              <circle cx={c.x} cy={c.y} r="1.7" className="core" />
            </g>
          ))}
        </g>
        <text className="wm-an-label" x="310" y="500" textAnchor="middle">
          ANTARCTICA
        </text>
      </svg>

      <span className="wm-sweep-clip" aria-hidden="true">
        <span className="wm-sweep" />
      </span>

      {plateOps.map(({ m, gen }, i) => {
        const locked = campaignFailed || missionLocked(m, intelLevel)
        const lay = layouts[i]
        return (
          <button
            key={m.id}
            type="button"
            className={'wm-marker' + (locked ? ' locked' : ' live')}
            style={{ left: lay.pin.x + '%', top: lay.pin.y + '%' }}
            aria-disabled={locked || undefined}
            aria-label={
              locked
                ? m.codename + ' // LOCKED // ' + intelGate(m.intelReq)
                : 'OPEN CONTRACT ' + m.codename + ' // ' + m.type + ' // ' + m.city
            }
            onClick={locked ? undefined : act(() => selectMission(m.id))}
          >
            {!locked && (
              <>
                <span className="wm-marker-ring" aria-hidden="true" />
                <span className="wm-marker-ring d2" aria-hidden="true" />
              </>
            )}
            <span className="wm-marker-core" aria-hidden="true" />
            <span className={'wm-marker-label ' + lay.side}>
              {locked && <LockGlyph size={8} />}
              {m.codename}
            </span>
            <span className="tip" aria-hidden="true">
              <b>{m.codename}</b>
              {locked ? (
                <>
                  <i className="red">LOCKED</i>
                  <i className="dim">{intelGate(m.intelReq)}</i>
                </>
              ) : (
                <>
                  <i>
                    <span>TYPE</span>
                    {m.type}
                  </i>
                  <i>
                    <span>CHANCE</span>
                    {chanceFor(m, sectors, researched.length, difficulty)}%
                  </i>
                  <i>
                    <span>ETA</span>
                    {m.etaDays}D
                  </i>
                  <i>
                    <span>THREAT</span>
                    {m.threat}
                  </i>
                  {gen && (
                    <i>
                      <span>EXPIRES</span>
                      <ExpiryHours at={gen.expiresAtT} />
                    </i>
                  )}
                </>
              )}
            </span>
          </button>
        )
      })}
    </div>

      <div className="wm-ov tl">
        <b>ORBITAL SCAN</b>
        <span className="dim">SAT-16E // LIVE FEED</span>
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
  const generated = contracts.find((c) => c.sector === props.id)
  const mission =
    MISSIONS.find((m) => m.sector === props.id) ??
    (generated ? contractMission(generated) : undefined)

  return (
    <div className="wm-inset corners">
      <svg viewBox={SECTOR_VIEW[props.id]} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <g className="wm-inset-grid">
          {LON_LINES.map((x) => (
            <line key={'x' + x} x1={x} y1={0} x2={x} y2={PLATE_H} />
          ))}
          {LAT_LINES.map((lat) => (
            <line key={'y' + lat} x1={0} y1={graticuleY(lat)} x2={PLATE_W} y2={graticuleY(lat)} />
          ))}
        </g>
        {TERRITORIES.filter((t) => t.sector === props.id).map((t) => (
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
            <circle cx={(mission.mapPos.x / 100) * PLATE_W} cy={(mission.mapPos.y / 100) * PLATE_H} r="7" />
            <circle
              cx={(mission.mapPos.x / 100) * PLATE_W}
              cy={(mission.mapPos.y / 100) * PLATE_H}
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

  const nudge = (hours: number) => {
    const now = useWorldStore.getState().t
    const next = at + hours * 3600
    setReview(next >= now ? null : Math.max(now - DAY, next))
  }

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
          if (e.key === 'ArrowLeft') nudge(-1)
          else if (e.key === 'ArrowRight') nudge(1)
          else if (e.key === 'Home') setReview(t - DAY)
          else if (e.key === 'End') setReview(null)
          else return
          e.preventDefault()
        }}
      >
        <span className="wm-tl-fill" style={{ width: frac * 100 + '%' }} />
        {ticks.map((e) => (
          <i
            key={e.id}
            className={'wm-tl-ev ' + e.tone}
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
  return (
    <div className="wm-tc">
      <div className="wm-transport">
        <button
          type="button"
          className={'wm-tbtn' + (paused ? ' on' : '')}
          onClick={act(togglePause)}
          aria-pressed={paused}
          aria-label={paused ? 'RESUME WORLD CLOCK' : 'PAUSE WORLD CLOCK'}
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
            onClick={act(() => setSpeed(s))}
            aria-pressed={!paused && speed === s}
            aria-label={'GAME SPEED ' + s + 'X'}
          >
            {s}X
          </button>
        ))}
      </div>
      <div className="wm-speed">
        GAME SPEED: <b className={paused ? 'red' : 'amber'}>{paused ? 'PAUSED' : speed + 'X'}</b>
      </div>
    </div>
  )
}

/* ------------------------------- events feed ------------------------------ */

function FeedRow(props: { event: WorldEvent }) {
  const select = useWorldStore((s) => s.select)
  const markRead = useWorldStore((s) => s.markRead)
  const e = props.event
  return (
    <button
      type="button"
      className={'wm-feed-line ' + e.tone}
      aria-label={hhmm(e.t) + ' ' + e.text + ' // FOCUS ' + sectorDef(e.sector).name}
      onClick={act(() => {
        markRead()
        select(e.sector)
      })}
    >
      <span className="wm-feed-t">{hhmm(e.t)}</span>
      <span className="wm-feed-x">{e.text}</span>
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
        <div className="wm-empty">NO TRAFFIC IN THIS WINDOW</div>
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
      aria-label={'MARK ' + unread + ' EVENTS READ'}
    >
      {unread} UNREAD
    </button>
  )
}

/* -------------------------------- the screen ------------------------------ */

// First-visit orientation: names the screen's four panel groups and the way
// to Research. Shows once per campaign; the dismissal persists with the save
// through the tutorial seen set.
function WorldOnboard() {
  const seen = useTutorialStore((s) => s.seen)
  const markSeen = useTutorialStore((s) => s.markSeen)
  if (seen.includes(WORLD_ONBOARD_ID)) return null
  return (
    <div
      className="hud-menu-wrap wm-onboard-wrap"
      role="dialog"
      aria-modal="true"
      aria-label="World Network orientation"
    >
      <div className="hud-menu-panel wm-onboard">
        <Panel title="WORLD NETWORK // ORIENTATION" right={<span className="dim">FIRST UPLINK</span>}>
          <div className="wm-onboard-rows">
            <div className="wm-onboard-row">
              <b>CONTINENTAL SECTORS</b>
              <span>
                The left column lists every sector; pick one to focus it on the plate. Crisis
                states flag themselves in red.
              </span>
            </div>
            <div className="wm-onboard-row">
              <b>SECTOR COMMAND</b>
              <span>
                The right panel reads the focused sector: control, unrest, tax yield, garrison,
                the numbered influence actions, and the event forecast.
              </span>
            </div>
            <div className="wm-onboard-row">
              <b>AVAILABLE OPERATIONS</b>
              <span>
                Below it, the open contracts for that sector. Opening one moves to the mission
                brief.
              </span>
            </div>
            <div className="wm-onboard-row">
              <b>TIME AND EVENTS</b>
              <span>
                The bottom strip runs the world clock, reviews the last 24 hours, and carries the
                global events feed and your resource pool.
              </span>
            </div>
            <div className="wm-onboard-row">
              <b>RESEARCH</b>
              <span>
                The RESEARCH tab on the bottom navigation opens the lab programs; labs run on the
                same world clock.
              </span>
            </div>
          </div>
          <div className="hud-menu-actions">
            <button
              type="button"
              className="hud-btn pause"
              aria-label="Dismiss the orientation"
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
  const credits = useAppStore((s) => s.credits)
  const sectors = useWorldStore((s) => s.sectors)
  const selected = useWorldStore((s) => s.selected)
  const select = useWorldStore((s) => s.select)
  const intelLevel = useCampaignStore((s) => s.intelLevel)
  const intelProgress = useCampaignStore((s) => s.intelProgress)
  const campaignWon = useCampaignStore((s) => s.campaignWon)
  const campaignFailed = useCampaignStore((s) => s.campaignFailed)
  const contractsWon = useCampaignStore((s) => s.contractsWon)
  const operativeCount = useCampaignStore((s) => s.operatives.length)
  const researched = useResearchStore((s) => s.done)
  const difficulty = useSettingsStore((s) => s.difficulty)
  const contracts = useWorldStore((s) => s.contracts)
  const points = useWorldStore((s) => s.influence)
  const crisis = useWorldStore((s) => s.crisis)
  useWorldClock()

  const def = sectorDef(selected)
  const read = sectorReadout(selected, sectors[selected])
  const ops = useMemo(() => opsFor(selected, contracts), [selected, contracts])
  const openOps = ops.filter(({ m }) => !missionLocked(m, intelLevel)).length

  return (
    <div className="screen wm">
      <header className="wm-head">
        <div>
          <h1 className="screen-title">WORLD NETWORK</h1>
          <div className="screen-sub">NEXUS GLOBAL // GEOSTRATEGIC COMMAND INTERFACE</div>
        </div>
        <div className="wm-head-right">
          <Chip tone="dim">SYS:GN-7A</Chip>
          <Chip tone="dim">PRT:ON</Chip>
          <Chip tone="dim">SEC:LVL 3</Chip>
          <Chip tone="teal">NETWORK UPLINK: STRONG</Chip>
          <Chip tone="dim">COORD {SECTOR_COORD[selected]}</Chip>
        </div>
      </header>

      {campaignFailed && (
        <div className="wm-campaign-fail corners" role="status">
          <span className="wm-campaign-sigil fail" aria-hidden="true">◆</span>
          <span>
            <b>CAMPAIGN DIRECTIVE FAILED</b>
            <i>STRIKE ROSTER WIPED // NETWORK COMMAND SUSPENDED</i>
          </span>
          <strong>0 / {MISSIONS.length}</strong>
        </div>
      )}
      {campaignWon && !campaignFailed && (
        <div className="wm-campaign-win corners" role="status">
          <span className="wm-campaign-sigil" aria-hidden="true">◆</span>
          <span>
            <b>CAMPAIGN DIRECTIVE COMPLETE</b>
            <i>ALL THREE AUTHORIZED CONTRACTS FULFILLED // WORLD NETWORK REMAINS ACTIVE</i>
          </span>
          <strong>{contractsWon.length} / {MISSIONS.length}</strong>
        </div>
      )}

      <div className="wm-main">
        {/* left: influence + sectors */}
        <aside className="wm-left">
          <Panel title="INFLUENCE" right={<b className="amber">{points} PTS</b>}>
            <div className="kv">
              <span>POINTS</span>
              <b className="amber">{points} PTS</b>
            </div>
          </Panel>
          <Panel
            title="CONTINENTAL SECTORS"
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
                          (inCrisis ? ' // CRISIS' : '')
                    }
                    onClick={sec.locked ? undefined : act(() => select(sec.id))}
                  >
                    <span className="wm-sector-glyph">
                      <svg viewBox="0 0 22 16" aria-hidden="true">
                        <polygon points={sec.glyph} />
                      </svg>
                    </span>
                    <span className="wm-sector-main">
                      <span className="wm-sector-top">
                        <b className="wm-sector-name">{sec.name}</b>
                        {sec.locked ? (
                          <span className="wm-sector-lock">
                            <LockGlyph size={10} />
                          </span>
                        ) : (
                          <b className="wm-sector-pct">{Math.round(st.control)}%</b>
                        )}
                      </span>
                      <span className="wm-sector-sub">
                        {sec.locked ? (
                          <i className="dim">NO SURVEY DATA</i>
                        ) : (
                          <>
                            <i className="dim">CTRL {Math.round(st.control)}</i>
                            <i className="dim">UNREST {Math.round(st.unrest)}</i>
                            {inCrisis && <i className="wm-sector-crisis">CRISIS</i>}
                            <SegBar value={st.unrest * 2.4} tone="red" mini className="wm-unrest" />
                          </>
                        )}
                      </span>
                    </span>
                  </button>
                )
              })}
            </ScrollBox>
          </Panel>
        </aside>

        {/* center: world plate + mission markers */}
        <section className="wm-center corners">
          <div className="wm-map-wrap">
            <WorldPlate />
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
                <Chip tone="amber">FOCUS</Chip>
              )
            }
            bodyClassName="wm-sector-panel-body"
          >
            <SectorInset id={selected} />
            <div className="wm-cu">
              <div>
                <label>CONTROL</label>
                <b className="amber">{Math.round(read.control)}%</b>
                <SegBar value={read.control} tone="amber" mini />
              </div>
              <div>
                <label>UNREST</label>
                <b className="red">{Math.round(read.unrest)}%</b>
                <SegBar value={read.unrest} tone="red" mini />
              </div>
            </div>
            <div className="kv">
              <span>TAX YIELD</span>
              <b>{fmt(read.taxYield)} CR / 24h</b>
            </div>
            <div className="kv">
              <span>GARRISON CONDITION</span>
              <b className={read.garrison === 'SECURE' ? 'teal' : read.garrison === 'STRAINED' ? 'amber' : 'red'}>
                {read.garrison}
              </b>
            </div>
            <div className="wm-actions">
              {INFLUENCE_ACTION_ORDER.map((action) => (
                <InfluenceAction key={action} sector={selected} action={action} />
              ))}
            </div>
            <SectorForecast id={selected} />
          </Panel>
          <Panel
            title="AVAILABLE OPERATIONS"
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
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={'wm-op' + (locked ? ' locked' : '')}
                      aria-disabled={locked || undefined}
                      aria-label={
                        locked
                          ? m.codename + ' // LOCKED // ' + intelGate(m.intelReq)
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
                          <i className="red-dim">{intelGate(m.intelReq)}</i>
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
                          CHANCE {chanceFor(m, sectors, researched.length, difficulty)}%
                        </span>
                        <span className="chip dim">ETA {m.etaDays}D</span>
                        {gen && (
                          <span className="chip dim">
                            EXP <ExpiryHours at={gen.expiresAtT} />
                          </span>
                        )}
                      </span>
                    </button>
                  )
                })
              )}
            </ScrollBox>
            <button
              type="button"
              className="btn wide"
              disabled
              aria-label="VIEW SECTOR INTEL // REQUIRES A SECTOR INTEL LINK"
              title="REQUIRES A SECTOR INTEL LINK"
            >
              VIEW SECTOR INTEL &gt;
            </button>
          </Panel>
        </aside>
      </div>

      {/* bottom strip */}
      <div className="wm-bottom">
        <Panel title="TIME CODE" className="wm-time">
          <TimeCode />
        </Panel>
        <Panel title="TIME CONTROL" className="wm-timectl">
          <Timeline />
          <TimeControl />
        </Panel>
        <Panel title="GLOBAL EVENTS FEED" right={<UnreadBadge />} className="wm-feed" bodyClassName="wm-feed-body">
          <EventsFeed />
        </Panel>
        <Panel title="RESOURCE POOL" className="wm-pool">
          <div className="kv">
            <span>CREDITS</span>
            <b className="teal">{fmt(credits)} CR</b>
          </div>
          <div className="kv">
            <span>INFLUENCE PTS</span>
            <b className="amber">{points}</b>
          </div>
          <div className="kv">
            <span>OPERATIVES</span>
            <b>{operativeCount} / {ROSTER_CAP}</b>
          </div>
          <div className="kv">
            <span>INTEL LEVEL</span>
            <span className="wm-intel-val">
              <b>{intelLevel}</b>
              <SegBar value={intelProgress} mini className="wm-intel" />
            </span>
          </div>
        </Panel>
      </div>

      <NavTabs current="world" />
      <WorldOnboard />
    </div>
  )
}
