// The per-frame gate in front of world.tick. WorldTicker in scene/GameCanvas.tsx
// calls it every frame, so a paused, held or not-yet-live mission banks no
// time: the Debrief entry delay is world time and holds still while paused
// (IF-009) or held (TM-019).
import type { WorldApi } from './types'

/** Ticks `w` by `dt` only while the mission is live, not paused and not held. */
export function tickIfLive(
  w: WorldApi | null,
  ms: { live: boolean; paused: boolean; held?: boolean },
  dt: number,
): void {
  if (w && ms.live && !ms.paused && !ms.held) w.tick(dt)
}
