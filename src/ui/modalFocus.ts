// P-05 modal focus for a dialog that opens over a Screen or another panel:
// focus moves into the dialog, Tab and Shift+Tab wrap inside it, Escape calls
// onEscape, and on close focus goes back to the control that opened it when
// that control is still on the page. Pause and Settings keep their own
// initial-focus rules and use the same trap shape.
import { useEffect, useRef, type RefObject } from 'react'

const STOPS = 'button:not([disabled]), input:not([disabled]), [tabindex="0"]'

export function useModalFocus(
  root: RefObject<HTMLElement | null>,
  opts: { onEscape?: () => void } = {},
): void {
  // The latest onEscape, read at key time, so a parent's inline callback does
  // not re-run the effect (which would re-focus and re-register the trap).
  const escape = useRef(opts.onEscape)
  useEffect(() => {
    escape.current = opts.onEscape
  })
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const el = root.current
    el?.querySelector<HTMLElement>(STOPS)?.focus()
    const onKey = (e: globalThis.KeyboardEvent): void => {
      const box = root.current
      if (!box) return
      if (e.key === 'Escape' && escape.current) {
        e.preventDefault()
        e.stopPropagation()
        escape.current()
        return
      }
      if (e.key !== 'Tab') return
      const stops = Array.from(box.querySelectorAll<HTMLElement>(STOPS))
      if (stops.length === 0) return
      const first = stops[0]
      const last = stops[stops.length - 1]
      const here = document.activeElement
      let to: HTMLElement | null = null
      if (!box.contains(here)) to = first
      else if (e.shiftKey && here === first) to = last
      else if (!e.shiftKey && here === last) to = first
      if (!to) return
      e.preventDefault()
      to.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (opener?.isConnected) opener.focus()
    }
  }, [root])
}
