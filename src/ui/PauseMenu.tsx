// Pause menu: a centered panel over the frozen scene, carrying RESUME, the two
// step ABORT and the whole control table. The table prints game/bindings, so an
// action added there appears here with no edit to this file.
//
// The backdrop takes pointer events, which is what keeps a click meant for the
// menu from reaching the canvas and ordering the squad across the map.
import { useEffect, useRef, useState, type RefObject } from 'react'
import { BINDINGS, BINDING_GROUPS } from '../game/bindings'
import { Chip, Panel } from './bits'
import { uiClick } from './sound'

export default function PauseMenu(props: {
  onResume: () => void
  onAbort: () => void
  // The control that opened the menu; focus goes back to it on close.
  returnRef: RefObject<HTMLButtonElement | null>
}) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const resumeRef = useRef<HTMLButtonElement | null>(null)
  const [abortArmed, setAbortArmed] = useState(false)

  // Two step abort: first click arms, second confirms, auto resets after 3s.
  useEffect(() => {
    if (!abortArmed) return
    const id = window.setTimeout(() => setAbortArmed(false), 3000)
    return () => window.clearTimeout(id)
  }, [abortArmed])

  useEffect(() => {
    resumeRef.current?.focus()
  }, [])

  const returnRef = props.returnRef
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

  return (
    <div className="hud-menu-wrap" role="dialog" aria-modal="true" aria-label="Mission paused">
      <div className="hud-menu-panel" ref={panelRef}>
        <Panel title="MISSION PAUSED" right={<span className="dim">SIM HALTED</span>}>
          <div className="hud-menu-grid">
            {BINDING_GROUPS.map((g) => {
              const rows = BINDINGS.filter((b) => b.group === g.group)
              if (rows.length === 0) return null
              return (
                <div className="hud-menu-group" key={g.group}>
                  <div className="hud-menu-group-head">{g.title}</div>
                  <dl className="hud-menu-rows">
                    {rows.map((b) => (
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
              )
            })}
          </div>
          <div className="hud-menu-actions">
            <button
              type="button"
              className="hud-btn pause"
              ref={resumeRef}
              onClick={() => {
                uiClick()
                props.onResume()
              }}
            >
              RESUME
            </button>
            <button
              type="button"
              className={'hud-btn abort' + (abortArmed ? ' armed' : '')}
              aria-label={abortArmed ? 'Confirm abort mission' : 'Abort mission'}
              onClick={() => {
                uiClick()
                if (abortArmed) props.onAbort()
                else setAbortArmed(true)
              }}
            >
              {abortArmed ? 'CONFIRM?' : 'ABORT'}
            </button>
          </div>
        </Panel>
      </div>
    </div>
  )
}
