// Settings panel: audio levels, control remapping, and accessibility modes.
// Rendered inside a .hud-menu-wrap by both the main menu and the mission
// pause menu; opening it from pause leaves the sim frozen (missionStore.paused
// is untouched) and closing returns to the pause menu.
//
// Key capture runs on a document-level capture-phase listener: it swallows the
// press before the mission's window-level handler can see it, so binding a key
// while paused cannot toggle the pause state. Escape cancels a capture, and
// closes the panel otherwise.
import { useEffect, useRef, useState } from 'react'
import { BINDINGS, BINDING_GROUPS, bindingFor, codeOf, keyLabel } from '../game/bindings'
import type { Binding, BindingId } from '../game/bindings'
import { QUALITY_SETTINGS } from '../game/quality'
import { TEXT_SCALES, useSettingsStore } from '../state/settingsStore'
import type { VolumeChannel } from '../state/settingsStore'
import { DIFFICULTIES } from '../game/missionParams'
import type { Difficulty } from '../game/missionParams'
import { useMissionStore } from '../state/missionStore'
import BalancePanel from './Balance'
import { Chip, Panel } from './bits'
import { uiClick } from './sound'

const QUALITY_LABEL: Record<string, string> = {
  auto: 'AUTO',
  high: 'HIGH',
  medium: 'MED',
  low: 'LOW',
}

const VOLUME_ROWS: Array<{ channel: VolumeChannel; label: string }> = [
  { channel: 'master', label: 'MASTER' },
  { channel: 'ui', label: 'UI CUES' },
  { channel: 'combat', label: 'COMBAT' },
  { channel: 'music', label: 'MUSIC' },
  { channel: 'ambience', label: 'AMBIENCE' },
]

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  standard: 'STANDARD',
  hardened: 'HARDENED',
}

function volumeOf(channel: VolumeChannel, s: {
  masterVol: number
  uiVol: number
  combatVol: number
  musicVol: number
  ambienceVol: number
}): number {
  if (channel === 'master') return s.masterVol
  if (channel === 'ui') return s.uiVol
  if (channel === 'combat') return s.combatVol
  if (channel === 'music') return s.musicVol
  return s.ambienceVol
}

function VolumeRow(props: { channel: VolumeChannel; label: string }) {
  const value = useSettingsStore((s) => volumeOf(props.channel, s))
  const setVolume = useSettingsStore((s) => s.setVolume)
  return (
    <label className="set-slider">
      <span className="set-slider-label">{props.label}</span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        aria-label={props.label + ' volume'}
        onChange={(e) => setVolume(props.channel, Number(e.target.value))}
      />
      <b className="set-slider-val">{value}</b>
    </label>
  )
}

function ToggleRow(props: {
  label: string
  sub: string
  on: boolean
  onToggle: (next: boolean) => void
}) {
  return (
    <div className="set-toggle">
      <span className="set-toggle-main">
        <b>{props.label}</b>
        <i className="dim">{props.sub}</i>
      </span>
      <button
        type="button"
        className={'btn set-toggle-btn' + (props.on ? ' amber' : '')}
        aria-pressed={props.on}
        aria-label={props.label + (props.on ? ' // ON' : ' // OFF')}
        onClick={() => {
          uiClick()
          props.onToggle(!props.on)
        }}
      >
        {props.on ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}

export default function SettingsPanel(props: { onClose: () => void }) {
  const muted = useSettingsStore((s) => s.muted)
  const reducedMotion = useSettingsStore((s) => s.reducedMotion)
  const highContrast = useSettingsStore((s) => s.highContrast)
  const textScale = useSettingsStore((s) => s.textScale)
  const quality = useSettingsStore((s) => s.quality)
  const difficulty = useSettingsStore((s) => s.difficulty)
  const telemetry = useSettingsStore((s) => s.telemetry)
  const overrides = useSettingsStore((s) => s.overrides)
  // A quality change during a mission cannot rebuild the live pipeline; the
  // row says so instead of pretending it applied.
  const missionLive = useMissionStore((s) => s.live)
  const setMuted = useSettingsStore((s) => s.setMuted)
  const setReducedMotion = useSettingsStore((s) => s.setReducedMotion)
  const setHighContrast = useSettingsStore((s) => s.setHighContrast)
  const setTextScale = useSettingsStore((s) => s.setTextScale)
  const setQuality = useSettingsStore((s) => s.setQuality)
  const setDifficulty = useSettingsStore((s) => s.setDifficulty)
  const setTelemetry = useSettingsStore((s) => s.setTelemetry)
  const setBindingOverride = useSettingsStore((s) => s.setBindingOverride)
  const clearBindingOverride = useSettingsStore((s) => s.clearBindingOverride)
  const resetBindings = useSettingsStore((s) => s.resetBindings)

  const [capture, setCapture] = useState<BindingId | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [balanceOpen, setBalanceOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  // Focus trap over the panel's controls, the same shape as the pause menu's
  // but including the sliders.
  useEffect(() => {
    const onTab = (e: globalThis.KeyboardEvent): void => {
      if (e.key !== 'Tab') return
      const root = panelRef.current
      if (!root) return
      const stops = Array.from(
        root.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])'),
      )
      if (stops.length === 0) return
      const first = stops[0]
      const last = stops[stops.length - 1]
      const here = document.activeElement
      let to: HTMLElement | null = null
      if (!root.contains(here)) to = first
      else if (e.shiftKey && here === first) to = last
      else if (!e.shiftKey && here === last) to = first
      if (!to) return
      e.preventDefault()
      to.focus()
    }
    document.addEventListener('keydown', onTab)
    return () => document.removeEventListener('keydown', onTab)
  }, [])

  const onClose = props.onClose
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent): void => {
      if (capture) {
        e.preventDefault()
        e.stopPropagation()
        const code = codeOf(e)
        if (code === 'Escape') {
          setCapture(null)
          setNotice(null)
          return
        }
        if (
          !code ||
          code === 'Tab' ||
          code.startsWith('Shift') ||
          code.startsWith('Control') ||
          code.startsWith('Alt') ||
          code.startsWith('Meta')
        ) {
          setNotice('THAT KEY CANNOT BE BOUND')
          return
        }
        const holder = bindingFor(code)
        if (holder && holder.id !== capture) {
          setNotice(keyLabel(code).toUpperCase() + ' IS CLAIMED BY: ' + holder.label.toUpperCase())
          return
        }
        setBindingOverride(capture, [code])
        setCapture(null)
        setNotice(null)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        // The balance dashboard sits over the panel; Escape peels it first.
        if (balanceOpen) setBalanceOpen(false)
        else onClose()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [capture, onClose, setBindingOverride, balanceOpen])

  const fixedNote = (b: Binding): string | null => {
    if (b.group === 'mouse' || b.codes.length === 0) return 'MOUSE'
    if (b.id === 'pause') return 'FIXED'
    if (b.id === 'selectSlot') return 'FIXED'
    return null
  }

  const anyOverride = Object.keys(overrides).length > 0

  if (balanceOpen) return <BalancePanel onClose={() => setBalanceOpen(false)} />

  return (
    <div className="hud-menu-panel settings-panel" ref={panelRef}>
      <Panel title="SETTINGS" right={<span className="dim">STORED ON THIS TERMINAL</span>}>
        <div className="set-grid">
          <div className="set-col">
            <div className="set-section">
              <div className="hud-menu-group-head">AUDIO</div>
              {VOLUME_ROWS.map((row) => (
                <VolumeRow key={row.channel} channel={row.channel} label={row.label} />
              ))}
              <ToggleRow
                label="MUTE"
                sub="Silences every synthesized voice"
                on={muted}
                onToggle={setMuted}
              />
            </div>
            <div className="set-section">
              <div className="hud-menu-group-head">ACCESSIBILITY</div>
              <ToggleRow
                label="REDUCED MOTION"
                sub="Stops sweeps and pulses; rain drops to minimum density"
                on={reducedMotion}
                onToggle={setReducedMotion}
              />
              <ToggleRow
                label="HIGH CONTRAST"
                sub="Brightens text against the dark panels"
                on={highContrast}
                onToggle={setHighContrast}
              />
              <div className="set-toggle">
                <span className="set-toggle-main">
                  <b>TEXT SCALE</b>
                  <i className="dim">Screens scroll rather than clip at larger sizes</i>
                </span>
                <span className="set-scale">
                  {TEXT_SCALES.map((scale) => (
                    <button
                      key={scale}
                      type="button"
                      className={'btn set-scale-btn' + (textScale === scale ? ' amber' : '')}
                      aria-pressed={textScale === scale}
                      aria-label={'Text scale ' + scale + '%'}
                      onClick={() => {
                        uiClick()
                        setTextScale(scale)
                      }}
                    >
                      {scale}%
                    </button>
                  ))}
                </span>
              </div>
            </div>
            <div className="set-section">
              <div className="hud-menu-group-head">DIFFICULTY</div>
              <div className="set-toggle">
                <span className="set-toggle-main">
                  <b>THREAT PROFILE</b>
                  <i className="dim">
                    HARDENED: extra patrols, longer confirm, cleaner shots, +1 m sight, tighter optional windows. Minimap stays
                  </i>
                </span>
                <span className="set-scale">
                  {DIFFICULTIES.map((id) => (
                    <button
                      key={id}
                      type="button"
                      className={'btn set-scale-btn' + (difficulty === id ? ' amber' : '')}
                      aria-pressed={difficulty === id}
                      aria-label={'Difficulty ' + DIFFICULTY_LABEL[id]}
                      onClick={() => {
                        uiClick()
                        setDifficulty(id)
                      }}
                    >
                      {DIFFICULTY_LABEL[id]}
                    </button>
                  ))}
                </span>
              </div>
            </div>
            <div className="set-section">
              <div className="hud-menu-group-head">PERFORMANCE</div>
              <div className="set-toggle">
                <span className="set-toggle-main">
                  <b>QUALITY</b>
                  <i className="dim">
                    {missionLive
                      ? 'Applies from the next mission'
                      : 'AUTO probes the renderer and steps down under load'}
                  </i>
                </span>
                <span className="set-scale">
                  {QUALITY_SETTINGS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className={'btn set-scale-btn' + (quality === q ? ' amber' : '')}
                      aria-pressed={quality === q}
                      aria-label={'Render quality ' + q}
                      onClick={() => {
                        uiClick()
                        setQuality(q)
                      }}
                    >
                      {QUALITY_LABEL[q]}
                    </button>
                  ))}
                </span>
              </div>
            </div>
            <div className="set-section">
              <div className="hud-menu-group-head">DATA</div>
              <ToggleRow
                label="TELEMETRY: LOCAL ONLY"
                sub="Logs mission records on this terminal; nothing is transmitted"
                on={telemetry}
                onToggle={setTelemetry}
              />
              <div className="set-toggle">
                <span className="set-toggle-main">
                  <b>BALANCE DATA</b>
                  <i className="dim">Aggregates over the local mission log</i>
                </span>
                <button
                  type="button"
                  className="btn set-toggle-btn"
                  aria-label="Open the balance dashboard"
                  onClick={() => {
                    uiClick()
                    setBalanceOpen(true)
                  }}
                >
                  OPEN
                </button>
              </div>
            </div>
          </div>
          <div className="set-col">
            <div className="set-section">
              <div className="hud-menu-group-head">
                CONTROLS
                <button
                  type="button"
                  className="btn set-reset-all"
                  disabled={!anyOverride}
                  aria-label="Reset every control to its default key"
                  onClick={() => {
                    uiClick()
                    setCapture(null)
                    setNotice(null)
                    resetBindings()
                  }}
                >
                  RESET ALL
                </button>
              </div>
              <div className="set-bind-note dim">
                PAUSE, OPERATIVE SLOTS 1-4 AND THE MOUSE STAY FIXED. CLICK REBIND, THEN PRESS THE
                NEW KEY; ESC CANCELS.
              </div>
              {notice && <div className="set-bind-notice red">{notice}</div>}
              <div className="set-bind-list">
                {BINDING_GROUPS.filter((g) => g.group !== 'mouse').map((g) => (
                  <div key={g.group} className="set-bind-group">
                    <div className="set-bind-group-head dim">{g.title}</div>
                    {BINDINGS.filter((b) => b.group === g.group).map((b) => {
                      const note = fixedNote(b)
                      const overridden = overrides[b.id] !== undefined
                      return (
                        <div key={b.id} className="set-bind-row">
                          <span className="set-bind-label">{b.label}</span>
                          <span className="set-bind-keys">
                            {b.keys.map((k) => (
                              <Chip key={k} tone={overridden ? 'amber' : 'dim'}>
                                {k}
                              </Chip>
                            ))}
                          </span>
                          <span className="set-bind-ctl">
                            {note ? (
                              <Chip tone="dim">{note}</Chip>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className={
                                    'btn set-bind-btn' + (capture === b.id ? ' amber' : '')
                                  }
                                  aria-label={
                                    capture === b.id
                                      ? 'Press the new key for ' + b.label
                                      : 'Rebind ' + b.label
                                  }
                                  onClick={() => {
                                    uiClick()
                                    setNotice(null)
                                    setCapture(capture === b.id ? null : b.id)
                                  }}
                                >
                                  {capture === b.id ? 'PRESS KEY...' : 'REBIND'}
                                </button>
                                <button
                                  type="button"
                                  className="btn set-bind-btn"
                                  disabled={!overridden}
                                  aria-label={'Reset ' + b.label + ' to its default key'}
                                  onClick={() => {
                                    uiClick()
                                    setCapture(null)
                                    setNotice(null)
                                    clearBindingOverride(b.id)
                                  }}
                                >
                                  RESET
                                </button>
                              </>
                            )}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="hud-menu-actions">
          <button
            type="button"
            className="hud-btn pause"
            ref={closeRef}
            onClick={() => {
              uiClick()
              props.onClose()
            }}
          >
            CLOSE
          </button>
        </div>
      </Panel>
    </div>
  )
}
