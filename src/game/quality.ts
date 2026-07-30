// Performance tiers. Pure TypeScript, no three.js: the tier table maps a
// quality setting and renderer probe onto renderer parameters as data, and the
// scene reads the resolved tier once at mission mount, never per frame. The
// player setting lives in settingsStore; AUTO resolves against the renderer
// backend when the mission canvas initializes, and a sustained-slow-frame
// probe may step the persisted setting down one tier.

export type QualityTier = 'high' | 'medium' | 'low'
export type QualitySetting = QualityTier | 'auto'

export const QUALITY_SETTINGS: QualitySetting[] = ['auto', 'high', 'medium', 'low']

export interface TierParams {
  // Upper device-pixel-ratio bound handed to the renderer at mount.
  dprMax: number
  // Multiplier on the rain streak counts the mission weather asks for.
  rainMul: number
  // Whether the emissive-MRT bloom pass runs; off, the plain scene pass
  // renders alone. Building ghosting is tactical readability and never a tier
  // casualty.
  bloom: boolean
}

// HIGH is the pre-tier behavior, byte for byte.
export const TIER_PARAMS: Record<QualityTier, TierParams> = {
  high: { dprMax: 1.75, rainMul: 1, bloom: true },
  medium: { dprMax: 1.25, rainMul: 0.5, bloom: true },
  low: { dprMax: 1, rainMul: 0.15, bloom: false },
}

// AUTO: a WebGPU backend runs HIGH, the WebGL2 fallback MEDIUM.
export function resolveTier(setting: QualitySetting, webgpu: boolean): QualityTier {
  if (setting !== 'auto') return setting
  return webgpu ? 'high' : 'medium'
}

export function stepDownTier(tier: QualityTier): QualityTier | null {
  if (tier === 'high') return 'medium'
  if (tier === 'medium') return 'low'
  return null
}

/* ------------------------------ frame probe -------------------------------- */

// A frame time the moving average must hold above before the governor acts.
export const SLOW_FRAME_MS = 28
// Opening seconds ignored: WebGPU pipeline compiles distort the first frames.
export const PROBE_GRACE_SEC = 8
// How long the average must stay above the line before the probe fires.
export const PROBE_HOLD_SEC = 6

export interface FrameProbe {
  // Feeds one frame delta in seconds. Returns true exactly once, when the
  // moving average has held above the threshold for the whole hold window.
  sample(dtSec: number): boolean
}

// Allocation-free by construction: the closure owns four numbers and the
// caller keeps one probe per mission mount.
export function createFrameProbe(
  thresholdMs: number = SLOW_FRAME_MS,
  graceSec: number = PROBE_GRACE_SEC,
  holdSec: number = PROBE_HOLD_SEC,
): FrameProbe {
  let elapsed = 0
  let avgMs = 16
  let slowFor = 0
  let fired = false
  return {
    sample(dtSec: number): boolean {
      if (fired || !Number.isFinite(dtSec) || dtSec <= 0) return false
      elapsed += dtSec
      // One long hitch (tab switch, pipeline compile) must not read as load;
      // clamp the sample before it enters the average.
      const ms = Math.min(dtSec * 1000, 250)
      avgMs += (ms - avgMs) * 0.1
      if (elapsed < graceSec) return false
      if (avgMs > thresholdMs) {
        slowFor += dtSec
        if (slowFor >= holdSec) {
          fired = true
          return true
        }
      } else {
        slowFor = 0
      }
      return false
    },
  }
}

/* ---------------------------- mission tier holder --------------------------- */

// The tier the running mission mounted with. Written once by the canvas mount
// (after the renderer backend is known), read by the scene components at their
// own mount. Module state in the runtime.ts style: per-frame readers never
// touch it.
let missionTier: QualityTier = 'high'

export function setMissionTier(tier: QualityTier): void {
  missionTier = tier
}

export function getMissionTier(): QualityTier {
  return missionTier
}
