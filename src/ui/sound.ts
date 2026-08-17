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
  startStrategyBed?: () => void
  stopStrategyBed?: () => void
  startMissionBed?: () => void
  stopMissionBed?: () => void
}

let modPromise: Promise<AudioModuleLike | null> | null = null
let mod: AudioModuleLike | null = null

function load(): Promise<AudioModuleLike | null> {
  if (!modPromise) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- @ts-expect-error would fail to compile whenever audio.ts exists
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

function callBed(fn: (m: AudioModuleLike) => void): void {
  try {
    if (mod) {
      fn(mod)
      return
    }
    void load().then((m) => {
      if (m) fn(m)
    })
  } catch {
    // audio unavailable
  }
}

export function startStrategyBed(): void {
  callBed((m) => m.startStrategyBed?.())
}

export function stopStrategyBed(): void {
  callBed((m) => m.stopStrategyBed?.())
}

export function startMissionBed(): void {
  callBed((m) => m.startMissionBed?.())
}

export function stopMissionBed(): void {
  callBed((m) => m.stopMissionBed?.())
}
