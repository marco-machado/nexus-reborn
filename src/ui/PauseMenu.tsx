// Pause menu: a centered panel over the frozen scene, carrying RESUME, the two
// step ABORT and the whole control table. The table prints game/bindings, so an
// action added there appears here with no edit to this file.
//
// The backdrop takes pointer events, which is what keeps a click meant for the
// menu from reaching the canvas and ordering the squad across the map.
import { useEffect, useRef, useState, type RefObject } from 'react'
import { abortArmHint, createAbortArm } from './abortArm'
import { Chip, Panel } from './bits'
import SettingsPanel from './Settings'
import { pauseBindingGroups } from './pauseMenuModel'
import { uiClick } from './sound'

export default function PauseMenu({
  onResume,
  onAbort,
  returnRef,
}: {
  onResume: () => void
  onAbort: () => void
  // The control that opened the menu; focus goes back to it on close.
  returnRef: RefObject<HTMLButtonElement | null>
}) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const resumeRef = useRef<HTMLButtonElement | null>(null)
  const [abortArmed, setAbortArmed] = useState(false)
  // Two step abort (P-01): the first press arms, a second within three real
  // seconds confirms, and a lapse disarms with the mission still paused. The
  // controller owns the window; this state only paints it.
  const [abortArm] = useState(() => createAbortArm(setAbortArmed))
  // Settings swaps the panel content; the sim stays frozen (paused untouched)
  // and closing lands back on this menu.
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Closing the menu drops a pending arm, so no lapse timer outlives it.
  useEffect(() => () => abortArm.disarm(), [abortArm])

  // Opening the menu focuses RESUME; closing Settings returns focus to the
  // SETTINGS control that opened it (P-05 restore).
  const settingsRef = useRef<HTMLButtonElement | null>(null)
  const settingsWasOpen = useRef(false)
  useEffect(() => {
    if (settingsOpen) settingsWasOpen.current = true
    else if (settingsWasOpen.current) {
      settingsWasOpen.current = false
      settingsRef.current?.focus()
    } else resumeRef.current?.focus()
  }, [settingsOpen])

  useEffect(
    () => () => {
      returnRef.current?.focus()
    },
    [returnRef],
  )

  // Tab is browser focus behaviour rather than a mission binding, so it is
  // read here and not through game/bindings. On the document because a click
  // on the backdrop drops focus to the body, and a handler mounted inside the
  // panel would never see the Tab that followed.
  useEffect(() => {
    const onTab = (e: globalThis.KeyboardEvent): void => {
      if (e.key !== 'Tab') return
      const root = panelRef.current
      if (!root) return
      const stops = Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled])'))
      if (stops.length === 0) return
      const first = stops[0]
      const last = stops[stops.length - 1]
      // Wrap at both ends, and haul focus back in from anywhere outside.
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

  if (settingsOpen) {
    return (
      <div className="hud-menu-wrap" role="dialog" aria-modal="true" aria-label="Settings">
        <SettingsPanel onClose={() => setSettingsOpen(false)} />
      </div>
    )
  }

  return (
    <div className="hud-menu-wrap" role="dialog" aria-modal="true" aria-label="Mission paused">
      <div className="hud-menu-panel" ref={panelRef}>
        <Panel title="MISSION PAUSED" right={<span className="dim">SIM HALTED</span>}>
          <div className="hud-menu-grid">
            {pauseBindingGroups().map((g) => (
              <div className="hud-menu-group" key={g.group}>
                <div className="hud-menu-group-head">{g.title}</div>
                <dl className="hud-menu-rows">
                  {g.rows.map((b) => (
                    <div className="hud-menu-row" key={b.id}>
                      <dt>
                        {b.keys.map((k) => (
                          <Chip key={k} tone="dim">
                            {k}
                          </Chip>
                        ))}
                      </dt>
                      <dd>{b.label}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          <div className="hud-menu-actions">
            <button
              type="button"
              className="hud-btn pause"
              ref={resumeRef}
              onClick={() => {
                uiClick()
                onResume()
              }}
            >
              RESUME
            </button>
            <button
              type="button"
              className="hud-btn"
              aria-label="Open settings"
              ref={settingsRef}
              onClick={() => {
                uiClick()
                setSettingsOpen(true)
              }}
            >
              SETTINGS
            </button>
            <button
              type="button"
              className={'hud-btn abort' + (abortArmed ? ' armed' : '')}
              aria-label={abortArmed ? 'Confirm abort mission' : 'Abort mission'}
              onClick={() => {
                uiClick()
                if (abortArm.press() === 'confirm') onAbort()
              }}
            >
              {abortArmed ? 'CONFIRM?' : 'ABORT'}
            </button>
          </div>
          {/* P-01 armed-hint slot: always mounted (a polite live region that
              mounts with its text is not announced); disarm clears it silently. */}
          <div className="pause-arm-hint" role="status" aria-live="polite">
            {abortArmHint(abortArmed)}
          </div>
        </Panel>
      </div>
    </div>
  )
}
