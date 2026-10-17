// The one runtime-owned freshness window for one-shot cues (audio README,
// "Runtime integration"). A cue whose clip decode or audio-module load
// completes later than this after the originating event is dropped, never
// replayed as a delayed burst. Kept in its own dependency-free module so the
// UI bridge (`src/ui/sound.ts`) can read it without typecheck-importing
// `audio.ts`.

/** Maximum age, in seconds, a one-shot request may reach before it is dropped. */
export const CUE_FRESHNESS_WINDOW_S = 0.12

/**
 * True when an event raised at `requestedAt` is still fresh at `now`
 * (both in seconds, on the same clock).
 */
export function isCueFresh(requestedAt: number, now: number): boolean {
  return now - requestedAt <= CUE_FRESHNESS_WINDOW_S
}
