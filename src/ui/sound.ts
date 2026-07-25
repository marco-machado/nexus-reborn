// Audio bridge for the UI layer. The real audio module (src/game/audio.ts) is
// produced by a parallel build, so the UI resolves it lazily at runtime and
// never depends on it at typecheck time. Every entry point is failure proof:
// a missing module or missing export is silently ignored.

interface SfxLike {
  uiClick?: () => void
}

interface AudioModuleLike {
  sfx?: SfxLike
  unlockAudio?: () => void
}

let modPromise: Promise<AudioModuleLike | null> | null = null
let mod: AudioModuleLike | null = null

function load(): Promise<AudioModuleLike | null> {
  if (!modPromise) {
    try {
      // @ts-ignore - src/game/audio.ts is written by a parallel build step and may be absent while this file typechecks.
      modPromise = (import('../game/audio') as Promise<AudioModuleLike>).then(
        (m) => {
          mod = m
          return m
        },
        () => null,
      )
    } catch {
      modPromise = Promise.resolve(null)
    }
  }
  return modPromise
}

// Kick off resolution at module load so the first click is not silent.
void load()

export function uiClick(): void {
  try {
    if (mod) {
      mod.sfx?.uiClick?.()
      return
    }
    void load().then((m) => m?.sfx?.uiClick?.())
  } catch {
    // audio unavailable
  }
}

export function unlockAudio(): void {
  try {
    void load().then((m) => m?.unlockAudio?.())
  } catch {
    // audio unavailable
  }
}
