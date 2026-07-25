// World Network screen. The sector list, the strategic plate, the sector
// readout and the operations list all read the same world state, and the
// transport under the map is what moves it.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { useAppStore } from '../state/appStore'
import {
  DAY,
  MAX_DT,
  SPEEDS,
  globalInfluence,
  hhmm,
  sectorReadout,
  stamp,
  threatLevel,
  useWorldStore,
} from '../state/worldStore'
import type { WorldEvent } from '../state/worldStore'
import { MISSIONS, ROSTER } from '../game/data'
import type { SectorId } from '../game/types'
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
  yOfLat,
} from '../game/atlas'
import type { CorpId } from '../game/atlas'
import { Chip, LockGlyph, NavGlyph, Panel, SegBar, TargetGlyph } from './bits'
import type { NavKind } from './bits'
import { fmt } from './util'
import { uiClick } from './sound'

// Intel gates the locked missions and the unbuilt tabs. It never rises yet, so
// it is one fixed level with the survey progress that unlocks the next.
const INTEL_LEVEL = 1
const INTEL_PROGRESS = 25
const INTEL_GATE = 'REQUIRES INTEL LVL 2'

const NAV_TABS: Array<{ key: NavKind; label: string }> = [
  { key: 'world', label: 'WORLD MAP' },
  { key: 'brief', label: 'BRIEFING' },
  { key: 'research', label: 'RESEARCH' },
  { key: 'operatives', label: 'OPERATIVES' },
  { key: 'archives', label: 'ARCHIVES' },
]

function act(fn: () => void): () => void {
  return () => {
    uiClick()
    fn()
  }
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

function agoLabel(sec: number): string {
  const m = Math.round(sec / 60)
  return m < 90 ? m + 'M' : (m / 60).toFixed(1) + 'H'
}

/* --------------------------------- hooks ---------------------------------- */

// Advances world time while the screen is mounted. Batched to 20Hz so the
// clock and the timeline repaint smoothly without a render every frame.
function useWorldClock(): void {
  const tick = useWorldStore((s) => s.tick)
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let acc = 0
    const step = (now: number) => {
      raf = requestAnimationFrame(step)
      acc += Math.min(MAX_DT, (now - last) / 1000)
      last = now
      if (acc < 0.05) return
      tick(acc)
      acc = 0
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [tick])
}

// True while the list has content below the fold, so the panel can show the
// cut edge instead of hiding it behind a hairline scrollbar.
function useOverflow<T extends HTMLElement>(dep: unknown): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [more, setMore] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => setMore(el.scrollHeight - el.clientHeight - el.scrollTop > 2)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    el.addEventListener('scroll', check)
    return () => {
      ro.disconnect()
      el.removeEventListener('scroll', check)
    }
  }, [dep])
  return [ref, more]
}

function ScrollList(props: { className?: string; dep: unknown; children: ReactNode }) {
  const [ref, more] = useOverflow<HTMLDivElement>(props.dep)
  return (
    <div className="wm-scroll-wrap">
      <div ref={ref} className={'wm-scroll' + (props.className ? ' ' + props.className : '')}>
        {props.children}
      </div>
      {more && <span className="wm-scroll-more" aria-hidden="true" />}
    </div>
  )
}

/* ------------------------------- map plate -------------------------------- */

function WorldPlate() {
  const sectors = useWorldStore((s) => s.sectors)
  const owner = useWorldStore((s) => s.owner)
  const selected = useWorldStore((s) => s.selected)
  const selectMission = useAppStore((s) => s.selectMission)

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
  const threat = threatLevel(sectors)

  const corpOf = (sector: SectorId | null): CorpId => (sector ? corps[sector] : 'unknown')

  return (
    <div className="wm-map">
      <svg
        className="wm-map-svg"
        viewBox={`0 0 ${PLATE_W} ${PLATE_H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="wm-glow" cx="0.5" cy="0.42" r="0.75">
            <stop offset="0" stopColor="#0e2c26" stopOpacity="0.5" />
            <stop offset="1" stopColor="#0e2c26" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width={PLATE_W} height={PLATE_H} fill="#03080a" />
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
              y1={yOfLat(lat)}
              x2={PLATE_W}
              y2={yOfLat(lat)}
            />
          ))}
        </g>
        <g className="wm-lat">
          {LAT_LINES.map((lat) => (
            <text key={'l' + lat} x={7} y={yOfLat(lat) - 4}>
              {lat}
            </text>
          ))}
        </g>

        <g className="wm-land-g">
          {TERRITORIES.map((t) => (
            <polygon
              key={t.id}
              className={
                'wm-land corp-' + corpOf(t.sector) + (t.sector === selected ? ' focus' : '')
              }
              points={t.pts}
            />
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
      </svg>

      <span className="wm-sweep-clip" aria-hidden="true">
        <span className="wm-sweep" />
      </span>

      {MISSIONS.map((m) => (
        <button
          key={m.id}
          type="button"
          className={'wm-marker' + (m.locked ? ' locked' : ' live')}
          style={{ left: m.mapPos.x + '%', top: m.mapPos.y + '%' }}
          aria-disabled={m.locked || undefined}
          aria-label={
            m.locked
              ? m.codename + ' // LOCKED // ' + INTEL_GATE
              : 'OPEN CONTRACT ' + m.codename + ' // ' + m.type + ' // ' + m.city
          }
          onClick={m.locked ? undefined : act(() => selectMission(m.id))}
        >
          {!m.locked && (
            <>
              <span className="wm-marker-ring" aria-hidden="true" />
              <span className="wm-marker-ring d2" aria-hidden="true" />
            </>
          )}
          <span className="wm-marker-core" aria-hidden="true" />
          <span className="wm-marker-label">
            {m.locked && <LockGlyph size={8} />}
            {m.codename}
          </span>
          <span className="wm-tip" aria-hidden="true">
            <b>{m.codename}</b>
            {m.locked ? (
              <>
                <i className="red">LOCKED</i>
                <i className="dim">{INTEL_GATE}</i>
              </>
            ) : (
              <>
                <i>
                  <span>TYPE</span>
                  {m.type}
                </i>
                <i>
                  <span>CHANCE</span>
                  {m.chance}%
                </i>
                <i>
                  <span>ETA</span>
                  {m.etaDays}D
                </i>
                <i>
                  <span>THREAT</span>
                  {m.threat}
                </i>
              </>
            )}
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
      <div className={'wm-ov bl threat-' + threat.toLowerCase()}>
        <b>THREAT LEVEL</b>
        <span className="wm-threat-val">{threat}</span>
      </div>
      <div className="wm-ov br">
        <b className="wm-key-head">
          CONTROL KEY<span className="dim">SECTORS</span>
        </b>
        {KEY_ORDER.map((id) => (
          <span key={id} className="wm-key-row">
            <i style={{ background: CORPS[id].color }} />
            <span className="wm-key-name">{CORPS[id].name}</span>
            <b className="wm-key-n">{keyCount[id] ?? 0}</b>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------ sector inset ------------------------------ */

function SectorInset(props: { id: SectorId }) {
  const owner = useWorldStore((s) => s.owner)
  const step = useWorldStore((s) => s.stepSector)
  const def = sectorDef(props.id)
  const corp = sectorCorp(props.id, owner)
  const cities = CITIES_BY_SECTOR[props.id] ?? []
  const lights = LIGHTS_BY_SECTOR[props.id] ?? []
  const mission = MISSIONS.find((m) => m.sector === props.id)

  return (
    <div className="wm-inset corners">
      <svg viewBox={SECTOR_VIEW[props.id]} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <g className="wm-inset-grid">
          {LON_LINES.map((x) => (
            <line key={'x' + x} x1={x} y1={0} x2={x} y2={PLATE_H} />
          ))}
          {LAT_LINES.map((lat) => (
            <line key={'y' + lat} x1={0} y1={yOfLat(lat)} x2={PLATE_W} y2={yOfLat(lat)} />
          ))}
        </g>
        {TERRITORIES.filter((t) => t.sector === props.id).map((t) => (
          <polygon key={t.id} className={'wm-inset-land corp-' + corp} points={t.pts} />
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
        {mission && !mission.locked && (
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

  return (
    <ScrollList className="wm-feed-list" dep={shown.length}>
      {shown.length === 0 ? (
        <div className="wm-empty">NO TRAFFIC IN THIS WINDOW</div>
      ) : (
        shown.map((e) => <FeedRow key={e.id} event={e} />)
      )}
    </ScrollList>
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

export function WorldMap() {
  const selectMission = useAppStore((s) => s.selectMission)
  const credits = useAppStore((s) => s.credits)
  const sectors = useWorldStore((s) => s.sectors)
  const selected = useWorldStore((s) => s.selected)
  const select = useWorldStore((s) => s.select)
  useWorldClock()

  const def = sectorDef(selected)
  const read = sectorReadout(selected, sectors[selected])
  const influence = globalInfluence(sectors)
  const ops = useMemo(() => MISSIONS.filter((m) => m.sector === selected), [selected])
  const openOps = ops.filter((m) => !m.locked).length

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
          <Chip tone="dim">COORD {SECTOR_COORD[selected]}</Chip>
        </div>
      </header>

      <div className="wm-main">
        {/* left: influence + sectors */}
        <aside className="wm-left">
          <Panel title="GLOBAL INFLUENCE" right={<b className="teal">{influence.toFixed(1)}%</b>}>
            <SegBar value={influence} />
            <div className="axis">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
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
            <ScrollList className="wm-sector-list" dep={selected}>
              {SECTORS.map((sec) => {
                const st = sectors[sec.id]
                const sel = sec.id === selected
                return (
                  <button
                    key={sec.id}
                    type="button"
                    className={'wm-sector' + (sel ? ' sel' : '') + (sec.locked ? ' locked' : '')}
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
                          '%'
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
                            <SegBar value={st.unrest * 2.4} tone="red" mini className="wm-unrest" />
                          </>
                        )}
                      </span>
                    </span>
                  </button>
                )
              })}
            </ScrollList>
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
            right={<Chip tone="amber">FOCUS</Chip>}
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
              <span>TAX YIELD (WEEKLY)</span>
              <b>{read.taxYield.toFixed(2)}B CR</b>
            </div>
            <div className="kv">
              <span>INFLUENCE INCOME</span>
              <b className="teal">+{read.influenceIncome.toFixed(2)}B</b>
            </div>
            <div className="kv">
              <span>BLACK MARKET IMPACT</span>
              <b className="red">{read.blackMarket.toFixed(2)}B</b>
            </div>
            <div className="kv">
              <span>GARRISON STATUS</span>
              <b className={read.garrison === 'SECURE' ? 'teal' : read.garrison === 'STRAINED' ? 'amber' : 'red'}>
                {read.garrison}
              </b>
            </div>
            <div className="kv">
              <span>TOTAL FORCES</span>
              <b>{fmt(read.forces)}</b>
            </div>
            <div className="kv">
              <span>DEFENSE RATING</span>
              <SegBar value={read.defense} tone="green" mini className="wm-defense" />
            </div>
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
            <ScrollList className="wm-ops-list" dep={selected}>
              {ops.length === 0 ? (
                <div className="wm-empty">
                  NO CONTRACTS POSTED IN {def.name}
                  <i className="dim">SECTOR UNDER PASSIVE MONITORING</i>
                </div>
              ) : (
                ops.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={'wm-op' + (m.locked ? ' locked' : '')}
                    aria-disabled={m.locked || undefined}
                    aria-label={
                      m.locked
                        ? m.codename + ' // LOCKED // ' + INTEL_GATE
                        : 'OPEN CONTRACT ' + m.codename + ' // ' + m.type + ' // ' + m.city
                    }
                    onClick={m.locked ? undefined : act(() => selectMission(m.id))}
                  >
                    <span className="wm-op-glyph">{m.locked ? <LockGlyph /> : <TargetGlyph />}</span>
                    <span className="wm-op-main">
                      <b>{m.codename}</b>
                      {m.locked ? (
                        <i className="red-dim">{INTEL_GATE}</i>
                      ) : (
                        <i className="dim">
                          {m.type} // {m.city}
                        </i>
                      )}
                    </span>
                    <span className="wm-op-meta">
                      <span className="chip dim">CHANCE {m.chance}%</span>
                      <span className="chip dim">ETA {m.etaDays}D</span>
                    </span>
                  </button>
                ))
              )}
            </ScrollList>
            <button type="button" className="btn wide" disabled title="REQUIRES A SECTOR INTEL LINK">
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
            <span>INFLUENCE</span>
            <b>{fmt(Math.round(influence * 45))}</b>
          </div>
          <div className="kv">
            <span>OPERATIVES</span>
            <b>{ROSTER.length} / 120</b>
          </div>
          <div className="kv">
            <span>INTEL LEVEL</span>
            <span className="wm-intel-val">
              <b>{INTEL_LEVEL}</b>
              <SegBar value={INTEL_PROGRESS} mini className="wm-intel" />
            </span>
          </div>
        </Panel>
      </div>

      {/* nav tabs */}
      <nav className="wm-nav">
        {NAV_TABS.map((tab, i) => {
          const active = i === 0
          return (
            <span key={tab.key} className="wm-tab-wrap" title={active ? undefined : INTEL_GATE}>
              <button
                type="button"
                className={'wm-tab' + (active ? ' active' : ' locked')}
                aria-current={active ? 'page' : undefined}
                aria-disabled={active ? undefined : true}
                aria-label={active ? tab.label : tab.label + ' // LOCKED // ' + INTEL_GATE}
              >
                <NavGlyph kind={tab.key} size={active ? 15 : 13} />
                <span className="wm-tab-label">{tab.label}</span>
                {!active && (
                  <span className="wm-tab-lock">
                    <LockGlyph size={9} />
                  </span>
                )}
              </button>
              {!active && <span className="wm-tip nav">{INTEL_GATE}</span>}
            </span>
          )
        })}
      </nav>
    </div>
  )
}
