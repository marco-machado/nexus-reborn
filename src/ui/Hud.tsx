// In-mission HUD overlay. The root swallows no pointer events; only the
// panels themselves are interactive so the 3D canvas keeps receiving clicks
// everywhere else. No keyboard listeners live here (the scene layer owns keys).
import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../state/appStore'
import { useMissionStore } from '../state/missionStore'
import type { SquadMemberUi } from '../state/missionStore'
import { ROSTER, WEAPONS, missionById } from '../game/data'
import { WEATHER_LABEL } from '../game/missionParams'
import { getWorld, panCameraTo } from '../game/runtime'
import type { WeaponId } from '../game/types'
import { getMarquee, onMarquee } from '../scene/marquee'
import Minimap, { MM_ZOOM_MAX } from './Minimap'
import PauseMenu from './PauseMenu'
import { Portrait } from './portrait'
import { AbilityGlyph, Chip, GunSilhouette, ItemGlyph, RoleGlyph, ScrollBox } from './bits'
import { fmt, pad2 } from './util'
import { uiClick } from './sound'

function weaponIdByName(name: string): WeaponId {
  for (const w of Object.values(WEAPONS)) {
    if (w.name === name) return w.id
  }
  return 'assault'
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

// Drag select box. The scene input surface owns the rectangle and this only
// pushes it into styles, so dragging costs no render and no scene pass. First
// child of the root, so the panels paint over it.
function Marquee() {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const paint = (): void => {
      const el = ref.current
      if (!el) return
      const r = getMarquee()
      if (!r) {
        el.style.display = 'none'
        return
      }
      el.style.display = 'block'
      el.style.transform = 'translate(' + r.x + 'px,' + r.y + 'px)'
      el.style.width = r.w + 'px'
      el.style.height = r.h + 'px'
    }
    paint()
    return onMarquee(paint)
  }, [])
  return <div className="hud-marquee" ref={ref} />
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
  const inventory = useMissionStore((s) => s.inventory)
  const abilities = useMissionStore((s) => s.abilities)
  const grenadeTargeting = useMissionStore((s) => s.grenadeTargeting)
  const setPaused = useMissionStore((s) => s.setPaused)
  const setSelected = useMissionStore((s) => s.setSelected)
  const setGrenadeTargeting = useMissionStore((s) => s.setGrenadeTargeting)
  const credits = useAppStore((s) => s.credits)
  const goto = useAppStore((s) => s.goto)
  const missionId = useAppStore((s) => s.missionId)
  const mission = missionId ? missionById(missionId) : null
  const district = mission ? mission.district : 'DISTRICT 07'

  const logRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [log])

  // Abort lives in the pause menu now; the top bar keeps the one control that
  // opens it, and takes focus back when the menu closes.
  const pauseBtnRef = useRef<HTMLButtonElement | null>(null)

  const [mmZoom, setMmZoom] = useState(MM_ZOOM_MAX)

  const online = squad.filter((r) => !r.dead).length
  const firstSelected = selected.length > 0 ? squad.find((r) => r.unitId === selected[0]) : undefined
  const active = firstSelected ?? squad.find((r) => !r.dead) ?? squad[0] ?? null
  // The row carries the drawn weapon in weaponName/magazine and the stowed one
  // in stowedName/stowedMagazine; map both back onto the fixed panel slots.
  const primaryDrawn = active !== null && active.activeSlot === 'primary'
  const priName = active ? (primaryDrawn ? active.weaponName : active.stowedName) : ''
  const priMag = active ? (primaryDrawn ? active.magazine : active.stowedMagazine) : 0
  const secName = active ? (primaryDrawn ? active.stowedName : active.weaponName) : ''
  const secMag = active ? (primaryDrawn ? active.stowedMagazine : active.magazine) : 0
  const abilityTarget = selected
    .map((id) => squad.find((r) => r.unitId === id))
    .find((r): r is SquadMemberUi => !!r && !r.dead)
  const grenadeTargetReady = !!abilityTarget
  const grenadeState =
    abilities.grenade.availability !== 'usable'
      ? abilities.grenade.availability
      : !grenadeTargetReady
        ? 'disabled-target'
        : grenadeTargeting
          ? 'armed'
          : 'usable'
  // The item buttons disable on stock alone: a click with no valid target is
  // answered by the sim's comm fail line, exactly like the E and R keys.
  const medLabel =
    inventory.med <= 0
      ? 'Med kit unavailable: out of MED'
      : 'Use a med kit on the most wounded selected operative'
  const cellLabel =
    inventory.cell <= 0
      ? 'Power cell unavailable: out of CELL'
      : "Spend a power cell to finish the selected operative's ability cooldown"
  const grenadeLabel =
    grenadeState === 'out-of-stock'
      ? 'Grenade unavailable: out of CELL'
      : grenadeState === 'cooldown'
        ? 'Grenade cooling down'
        : grenadeState === 'disabled-target'
          ? 'Grenade unavailable: select a living operative'
          : grenadeState === 'armed'
            ? 'Cancel grenade targeting'
            : 'Arm grenade targeting'

  return (
    <div className="hud-root">
      <Marquee />
      {/* ------------------------------ top bar ----------------------------- */}
      <div className="hud-top">
        <div className="hud-top-left">
          <b className="hud-district">{district}</b>
          <span className="hud-clock">{clock}</span>
          <span className="chip dim">13.7C</span>
          <span className="chip dim">{WEATHER_LABEL[mission?.weather ?? 'none']}</span>
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
          {/* The menu backdrop covers the top bar, so while the menu is up
              this reads out the state and is not a control. Disabled says so,
              rather than offering a click that cannot land. */}
          <button
            type="button"
            className={'hud-btn pause' + (paused ? ' on' : '')}
            ref={pauseBtnRef}
            disabled={paused}
            aria-label={paused ? 'Mission paused' : 'Pause and open the menu'}
            onClick={() => {
              uiClick()
              setPaused(!paused)
            }}
          >
            {paused ? 'PAUSED' : 'PAUSE'}
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
                title={r.dead ? undefined : 'Double click to center the camera'}
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
                onDoubleClick={() => {
                  if (r.dead) return
                  const u = getWorld()?.unit(r.unitId)
                  if (u) panCameraTo(u.pos.x, u.pos.z)
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
                      {r.magazine}/{r.magazineSize} {r.activeSlot === 'primary' ? 'PRI' : 'SEC'}
                    </span>
                    {r.dead ? (
                      <span className="red hud-flatline">FLATLINED</span>
                    ) : r.reloading ? (
                      <span className="amber blink">RELOADING</span>
                    ) : r.swapping ? (
                      <span className="amber blink">DRAWING</span>
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
          <span>MISSION DIRECTIVES // {mission ? mission.type : 'TASKING'}</span>
        </div>
        <div className="hud-objectives-body">
          {objectives.map((o) => (
            <div
              key={o.id}
              className={
                'hud-obj' +
                (o.done ? ' done' : o.failed ? ' failed' : o.active ? ' active' : '') +
                (o.optional ? ' optional' : '')
              }
            >
              <ObjMark state={o.done ? 'done' : o.active && !o.failed ? 'active' : 'pending'} />
              <span className="hud-obj-main">
                <span className="hud-obj-label">
                  <span className="hud-obj-text">{o.label}</span>
                  {o.optional && <i className="hud-obj-opt">OPTIONAL</i>}
                  {o.timer !== undefined && <b className="hud-obj-timer">{o.timer}</b>}
                </span>
                {o.progress !== undefined && (
                  <span className="hud-obj-bar">
                    <i style={{ width: Math.round(o.progress * 100) + '%' }} />
                  </span>
                )}
              </span>
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
        <ScrollBox className="hud-comms-body" dep={log.length} boxRef={logRef}>
          {log.slice(-7).map((e, i) => (
            <div key={i + '-' + e.t} className={'hud-log ' + (e.cls ?? 'sys')}>
              {e.t} {e.who}: {e.msg}
            </div>
          ))}
          {log.length === 0 && <div className="hud-log sys">-- CHANNEL OPEN --</div>}
        </ScrollBox>
      </div>

      {/* ----------------------------- weapon bar --------------------------- */}
      {active && (
        <div className="hud-weapons">
          <div className="hud-panel hud-wpn corners">
            <div className="hud-panel-head">
              <span>PRIMARY // {active.codename}</span>
              {primaryDrawn && <span className="amber">DRAWN</span>}
            </div>
            <div className="hud-wpn-body">
              <GunSilhouette weapon={weaponIdByName(priName)} className="hud-gun" />
              <div className="hud-wpn-info">
                <span className="hud-wpn-name">{priName}</span>
                <span className="hud-ammo">
                  <b>{priMag}</b>
                  <i>/120</i>
                </span>
                {/* No DRAWING span: it squeezes the weapon name into an
                    ellipsis; the squad card carries the swap state. */}
                {primaryDrawn && active.reloading && (
                  <span className="amber blink mini">RELOADING</span>
                )}
              </div>
            </div>
          </div>
          <div className="hud-panel hud-wpn secondary corners">
            <div className="hud-panel-head">
              <span>SECONDARY</span>
              {!primaryDrawn && <span className="amber">DRAWN</span>}
            </div>
            <div className="hud-wpn-body">
              <GunSilhouette weapon={weaponIdByName(secName)} className="hud-gun sm" />
              <div className="hud-wpn-info">
                <span className="hud-wpn-name">{secName}</span>
                {/* No status spans here: the narrow panel clips the weapon
                    name under them, and the squad card carries the state. */}
                <span className="hud-ammo sm">
                  <b>{secMag}</b>
                  <i>/48</i>
                </span>
              </div>
            </div>
          </div>
          <div className="hud-panel hud-abilities corners">
            <div className="hud-panel-head">
              <span>ABILITIES</span>
              <span className={grenadeTargeting ? 'amber' : 'dim'}>
                {grenadeTargeting ? 'TARGETING' : 'Q / G'}
              </span>
            </div>
            <div className="hud-slots">
              <button
                type="button"
                className={'hud-slot ability ' + grenadeState}
                aria-label={grenadeLabel}
                aria-pressed={grenadeTargeting}
                disabled={grenadeState !== 'usable' && grenadeState !== 'armed'}
                title={grenadeLabel}
                onClick={() => {
                  uiClick()
                  setGrenadeTargeting(!grenadeTargeting)
                }}
              >
                <AbilityGlyph kind="grenade" />
                <span className="hud-slot-key">G</span>
                {grenadeState === 'cooldown' && (
                  <span className="hud-slot-cd">{abilities.grenade.cooldownRemaining.toFixed(1)}</span>
                )}
                {grenadeState === 'out-of-stock' && <span className="hud-slot-cd">00</span>}
              </button>
              {/* One role-ability slot per squad member, keyed to the same
                  slot digits as selection. Q fires the selection's abilities;
                  the button fires this member's alone. Teal ready, amber
                  running, red cooling or offline. */}
              {squad.map((r) => {
                const role = ROSTER.find((o) => o.codename === r.codename)?.role
                const cd = r.abilityCooldownRemaining
                const state = r.dead
                  ? 'offline'
                  : r.abilityActiveRemaining > 0
                    ? 'armed'
                    : cd > 0
                      ? 'recharging'
                      : 'usable'
                const label =
                  state === 'offline'
                    ? r.abilityName + ' offline: ' + r.codename + ' flatlined'
                    : state === 'armed'
                      ? r.abilityName + ' running on ' + r.codename
                      : state === 'recharging'
                        ? r.abilityName + ' recharging'
                        : 'Trigger ' + r.abilityName + ' on ' + r.codename
                const fill =
                  state === 'recharging' && r.abilityCooldownDuration > 0
                    ? Math.min(100, Math.round((cd / r.abilityCooldownDuration) * 100))
                    : 0
                return (
                  <button
                    type="button"
                    key={r.unitId}
                    className={'hud-slot ability ' + state}
                    aria-label={label}
                    title={label}
                    disabled={state !== 'usable'}
                    onClick={() => {
                      uiClick()
                      getWorld()?.orderAbility([r.unitId])
                    }}
                  >
                    {fill > 0 && <span className="hud-slot-fill" style={{ height: fill + '%' }} />}
                    {role && <RoleGlyph role={role} size={16} />}
                    <span className="hud-slot-key">{r.slot}</span>
                    {state === 'recharging' && (
                      <span className="hud-slot-cd">{Math.ceil(cd)}</span>
                    )}
                    {state === 'armed' && (
                      <span className="hud-slot-cd">{r.abilityActiveRemaining.toFixed(1)}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="hud-panel hud-items corners">
            <div className="hud-panel-head">
              <span>ITEMS</span>
              <span className="dim">E / R</span>
            </div>
            <div className="hud-slots">
              <button
                type="button"
                className={'hud-slot item' + (inventory.med <= 0 ? ' spent' : ' usable')}
                aria-label={medLabel}
                title={medLabel}
                disabled={inventory.med <= 0}
                onClick={() => getWorld()?.orderUseMed(selected)}
              >
                <ItemGlyph kind="med" size={16} />
                <span className="hud-slot-key">E</span>
                <i>{pad2(inventory.med)}</i>
              </button>
              <button
                type="button"
                className={'hud-slot item' + (inventory.cell <= 0 ? ' spent' : ' usable')}
                aria-label={cellLabel}
                title={cellLabel}
                disabled={inventory.cell <= 0}
                onClick={() => getWorld()?.orderUseCell(selected)}
              >
                <ItemGlyph kind="cell" size={16} />
                <span className="hud-slot-key">R</span>
                <i>{pad2(inventory.cell)}</i>
              </button>
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
      {paused && result === 'none' && (
        <PauseMenu
          returnRef={pauseBtnRef}
          onResume={() => setPaused(false)}
          onAbort={() => goto('world')}
        />
      )}
    </div>
  )
}
