// Drag select box bridge: the input surface writes the live rectangle, the HUD
// overlay draws it. Pixels, relative to the canvas top left. Kept out of React
// state so a drag never re-renders the tree on a pointer move.
export interface MarqueeRect {
  x: number
  y: number
  w: number
  h: number
}

let rect: MarqueeRect | null = null
const listeners = new Set<() => void>()

export function setMarquee(r: MarqueeRect | null): void {
  rect = r
  for (const fn of listeners) fn()
}

export function getMarquee(): MarqueeRect | null {
  return rect
}

export function onMarquee(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
