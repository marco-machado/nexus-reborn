// Mission-entry warm gate (frame-time pass 2026-10-22, R4). Effects clears it
// at mount and sets it once the scene pass has been precompiled; WorldTicker
// holds the mission clock while it is clear, so no mission time passes undrawn.
let warm = false

/** False from Effects mount until the scene pass has been precompiled. */
export function sceneWarm(): boolean {
  return warm
}

export function setSceneWarm(v: boolean): void {
  warm = v
}
