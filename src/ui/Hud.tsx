// In-mission HUD overlay. The root swallows no pointer events; only the
// panels themselves are interactive so the 3D canvas keeps receiving clicks
// everywhere else. No keyboard listeners live here (the scene layer owns keys).
import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../state/appStore'
import { useMissionStore } from '../state/missionStore'
import type { SquadMemberUi } from '../state/missionStore'
import { useResearchStore } from '../state/researchStore'
import { ROSTER, WEAPONS, missionById } from '../game/data'
import { squadWeapon } from '../game/research'
import type { WeaponId } from '../game/types'
import Minimap, { MM_ZOOM_MAX } from './Minimap'
import { Portrait } from './portrait'
import { AbilityGlyph, Chip, GunSilhouette, ItemGlyph, LockGlyph } from './bits'
import { fmt, pad2 } from './util'
import { uiClick } from './sound'

const ABILITIES = ['grenade', 'shield', 'dash', 'scan', 'flame'] as const

function weaponIdByName(name: string): WeaponId {
  for (const w of Object.values(WEAPONS)) {
    if (w.name === name) return w.id
  }
  return 'assault'
}

// One baseline kit of each, plus role bonuses from the deployed roster.
function itemCounts(squad: SquadMemberUi[]): { med: number; cell: number } {
  let med = 1
  let cell = 1
  for (const r of squad) {
    const role = ROSTER.find((o) => o.codename === r.codename)?.role
    if (role === 'medic') med += 2
    else if (role === 'support') med += 1
    else if (role === 'tech') cell += 1
  }
  return { med, cell }
}

function ObjMark(props: { state: 'done' | 'active' | 'pending' }) {
  if (props.state === 'active') {
    return (
      <svg viewBox="0 0 12 12" className="hud-obj-mark" aria-hidden="true">
        <polygon points="3,1.5 10,6 3,10.5" fill="#f0b445" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 12 12" className="hud-obj-mark" aria-hidden="true">
      <rect
        x="1.5"
        y="1.5"
        width="9"
        height="9"
        fill={props.state === 'done' ? 'rgba(126,240,212,0.12)' : 'none'}
        stroke={props.state === 'done' ? '#7ef0d4' : 'rgba(93,125,117,0.7)'}
        strokeWidth="1.2"
      />
      {props.state === 'done' && (
        <path d="M3 6.2 5.2 8.6 9 3.4" fill="none" stroke="#7ef0d4" strokeWidth="1.5" />
      )}
    </svg>
  )
}

export default function Hud() {
  const squad = useMissionStore((s) => s.squad)
  const selected = useMissionStore((s) => s.selected)
  const objectives = useMissionStore((s) => s.objectives)
  const log = useMissionStore((s) => s.log)
  const alert = useMissionStore((s) => s.alert)
  const paused = useMissionStore((s) => s.paused)
  const result = useMissionStore((s) => s.result)
  const clock = useMissionStore((s) => s.clock)
  const setPaused = useMissionStore((s) => s.setPaused)
  const setSelected = useMissionStore((s) => s.setSelected)
  const credits = useAppStore((s) => s.credits)
  const goto = useAppStore((s) => s.goto)
  const missionId = useAppStore((s) => s.missionId)
  const researched = useResearchStore((s) => s.done)
  const mission = missionId ? missionById(missionId) : null
  const district = mission ? mission.district : 'DISTRICT 07'

  const logRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [log])

  // Two step abort: first click arms, second confirms, auto resets after 3s.
  const [abortArmed, setAbortArmed] = useState(false)
  useEffect(() => {
    if (!abortArmed) return
    const id = window.setTimeout(() => setAbortArmed(false), 3000)
    return () => window.clearTimeout(id)
  }, [abortArmed])

  const [mmZoom, setMmZoom] = useState(0)

  const online = squad.filter((r) => !r.dead).length
  const firstSelected = selected.length > 0 ? squad.find((r) => r.unitId === selected[0]) : undefined
  const active = firstSelected ?? squad.find((r) => !r.dead) ?? squad[0] ?? null
  const sidearmId = active ? weaponIdByName(active.sidearmName) : 'pistol'
  // Same weapon the squad deployed with, research included.
  const sidearm = squadWeapon(sidearmId, researched)
  const items = itemCounts(squad)

  return (
    <div className="hud-root">
      {/* ------------------------------ top bar ----------------------------- */}
      <div className="hud-top">
        <div className="hud-top-left">
          <b className="hud-district">{district}</b>
          <span className="hud-clock">{clock}</span>
          <span className="chip dim">13.7C</span>
          <span className="chip dim">HUM 72</span>
          <span className="chip dim">1.2M/S</span>
        </div>
        <div className={'hud-alert' + (alert > 0 ? ' hot' : '')}>
          <span className="hud-alert-bars" aria-hidden="true">
            |||
          </span>
          <span className="hud-alert-num">ALERT: {alert}</span>
          <span className="hud-alert-bars" aria-hidden="true">
            |||
          </span>
        </div>
        <div className="hud-top-right">
          <span className="dim">CREDITS</span>
          <b className="hud-credits">{fmt(credits)}</b>
          <button
            type="button"
            className={'hud-btn pause' + (paused ? ' on' : '')}
            aria-label={paused ? 'Resume mission' : 'Pause mission'}
            onClick={() => {
              uiClick()
              setPaused(!paused)
            }}
          >
            {paused ? 'PAUSED' : 'PAUSE'}
          </button>
          <button
            type="button"
            className={'hud-btn abort' + (abortArmed ? ' armed' : '')}
            aria-label={abortArmed ? 'Confirm abort mission' : 'Abort mission'}
            onClick={() => {
              uiClick()
              if (abortArmed) {
                goto('world')
              } else {
                setAbortArmed(true)
              }
            }}
          >
            {abortArmed ? 'CONFIRM?' : 'ABORT'}
          </button>
        </div>
      </div>

      {/* ----------------------------- squad link --------------------------- */}
      <div className="hud-panel hud-squad corners">
        <div className="hud-panel-head">
          <span>SQUAD LINK</span>
          <span className="dim">{online} ONLINE</span>
        </div>
        <div className="hud-squad-body">
          {squad.map((r) => {
            const op =
              ROSTER.find((o) => o.codename === r.codename) ?? {
                id: r.unitId,
                codename: r.codename,
                accent: r.accent,
              }
            const hpPct = r.maxHp > 0 ? (r.hp / r.maxHp) * 100 : 0
            const isSel = selected.includes(r.unitId)
            const isActive = active !== null && r.unitId === active.unitId
            return (
              <div
                key={r.unitId}
                className={'hud-agent' + (isSel ? ' sel' : '') + (r.dead ? ' dead' : '')}
                onClick={(e) => {
                  if (r.dead) return
                  uiClick()
                  if (e.shiftKey) {
                    setSelected(
                      isSel ? selected.filter((x) => x !== r.unitId) : [...selected, r.unitId],
                    )
                  } else {
                    setSelected([r.unitId])
                  }
                }}
              >
                {isActive && <span className="hud-agent-active">ACTIVE</span>}
                <span className="hud-agent-slot">{r.slot}</span>
                <span className="hud-agent-portrait">
                  <Portrait op={op} size={38} />
                </span>
                <span className="hud-agent-main">
                  <span className="hud-agent-name">
                    <b>{r.codename}</b>
                    <i className="dim">{r.name}</i>
                  </span>
                  <span className={'hud-hp' + (hpPct < 30 ? ' low' : '')}>
                    <i style={{ width: hpPct + '%' }} />
                  </span>
                  <span className="hud-agent-sub">
                    <span>
                      {Math.max(0, Math.ceil(r.hp))}/{r.maxHp}
                    </span>
                    <span className="dim">
                      {r.magazine}/{r.magazineSize}
                    </span>
                    {r.dead ? (
                      <span className="red hud-flatline">FLATLINED</span>
                    ) : r.reloading ? (
                      <span className="amber blink">RELOADING</span>
                    ) : null}
                  </span>
                  {!r.dead && (
                    <span className="hud-agent-orders">
                      <Chip tone={r.holdGround ? 'amber' : 'dim'}>
                        {r.holdGround ? 'HOLD' : 'MOVE'}
                      </Chip>
                      <Chip tone={r.holdFire ? 'red' : 'dim'}>
                        {r.holdFire ? 'TIGHT' : 'FREE'}
                      </Chip>
                    </span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ----------------------------- objectives --------------------------- */}
      <div className="hud-panel hud-objectives corners">
        <div className="hud-panel-head">
          <span>OBJECTIVE: BREACH THE CHECKPOINT</span>
        </div>
        <div className="hud-objectives-body">
          {objectives.map((o) => (
            <div
              key={o.id}
              className={'hud-obj' + (o.done ? ' done' : o.active ? ' active' : '')}
            >
              <ObjMark state={o.done ? 'done' : o.active ? 'active' : 'pending'} />
              <span>{o.label}</span>
            </div>
          ))}
          {objectives.length === 0 && (
            <div className="hud-obj">
              <span className="dim">AWAITING TASKING...</span>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------ comm log ---------------------------- */}
      <div className="hud-panel hud-comms corners">
        <div className="hud-panel-head">
          <span>COMM LOG</span>
          <span className="dim">{clock}</span>
        </div>
        <div className="hud-comms-body scroll" ref={logRef}>
          {log.slice(-7).map((e, i) => (
            <div key={i + '-' + e.t} className={'hud-log ' + (e.cls ?? 'sys')}>
              {e.t} {e.who}: {e.msg}
            </div>
          ))}
          {log.length === 0 && <div className="hud-log sys">-- CHANNEL OPEN --</div>}
        </div>
      </div>

      {/* ----------------------------- weapon bar --------------------------- */}
      {active && (
        <div className="hud-weapons">
          <div className="hud-panel hud-wpn corners">
            <div className="hud-panel-head">
              <span>PRIMARY // {active.codename}</span>
            </div>
            <div className="hud-wpn-body">
              <GunSilhouette weapon={weaponIdByName(active.weaponName)} className="hud-gun" />
              <div className="hud-wpn-info">
                <span className="hud-wpn-name">{active.weaponName}</span>
                <span className="hud-ammo">
                  <b>{active.magazine}</b>
                  <i>/120</i>
                </span>
                {active.reloading && <span className="amber blink mini">RELOADING</span>}
              </div>
            </div>
          </div>
          <div className="hud-panel hud-wpn secondary corners">
            <div className="hud-panel-head">
              <span>SECONDARY</span>
            </div>
            <div className="hud-wpn-body">
              <GunSilhouette weapon={sidearmId} className="hud-gun sm" />
              <div className="hud-wpn-info">
                <span className="hud-wpn-name">{active.sidearmName}</span>
                <span className="hud-ammo sm">
                  <b>{sidearm.magazine}</b>
                  <i>/48</i>
                </span>
              </div>
            </div>
          </div>
          <div className="hud-panel hud-abilities corners">
            <div className="hud-panel-head">
              <span>ABILITIES</span>
              <span className="dim">LOCKED</span>
            </div>
            <div className="hud-slots">
              {ABILITIES.map((k) => (
                <span key={k} className="hud-slot locked" title="LOCKED">
                  <AbilityGlyph kind={k} />
                  <span className="hud-slot-lock">
                    <LockGlyph size={7} />
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div className="hud-panel hud-items corners">
            <div className="hud-panel-head">
              <span>ITEMS</span>
            </div>
            <div className="hud-slots">
              <span className="hud-slot">
                <ItemGlyph kind="med" size={16} />
                <i>{pad2(items.med)}</i>
              </span>
              <span className="hud-slot">
                <ItemGlyph kind="cell" size={16} />
                <i>{pad2(items.cell)}</i>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------- minimap ----------------------------- */}
      <div className="hud-panel hud-minimap corners">
        <div className="hud-panel-head">
          <span>{district}</span>
          <span className="dim">SECTOR B</span>
        </div>
        <div className="hud-mm-body">
          <Minimap zoom={mmZoom} />
          <div className="hud-mm-zoom">
            <button
              type="button"
              aria-label="Zoom minimap in"
              disabled={mmZoom >= MM_ZOOM_MAX}
              onClick={() => {
                uiClick()
                setMmZoom((z) => Math.min(MM_ZOOM_MAX, z + 1))
              }}
            >
              +
            </button>
            <button
              type="button"
              aria-label="Zoom minimap out"
              disabled={mmZoom <= 0}
              onClick={() => {
                uiClick()
                setMmZoom((z) => Math.max(0, z - 1))
              }}
            >
              -
            </button>
          </div>
        </div>
      </div>

      {/* --------------------------- center overlays ------------------------- */}
      {result !== 'none' && (
        <div className="hud-banner-wrap" aria-live="polite">
          <div className={'hud-banner ' + result}>
            <div className="hud-banner-title">
              {result === 'won' ? 'CONTRACT FULFILLED' : 'SQUAD ELIMINATED'}
            </div>
            <div className="hud-banner-sub">
              {result === 'won' ? 'EXTRACTION CONFIRMED' : 'CONTRACT TERMINATED'}
            </div>
          </div>
        </div>
      )}
      {paused && result === 'none' && <div className="hud-paused-tag">PAUSED</div>}
    </div>
  )
}
