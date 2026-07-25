// CONTRACT FILE. Module level holder for the live simulation instance so the
// scene, HUD and input layers can reach it without prop drilling or React state.
import type { WorldApi } from './types'

let world: WorldApi | null = null

export function setWorld(w: WorldApi | null): void {
  world = w
}

export function getWorld(): WorldApi | null {
  return world
}
