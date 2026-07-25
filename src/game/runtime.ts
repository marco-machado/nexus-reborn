// CONTRACT FILE. Module level holders for the live simulation instance and the
// camera ground footprint so the scene, HUD and input layers can reach them
// without prop drilling or React state.
import type { CameraFootprint, WorldApi } from './types'

let world: WorldApi | null = null
let cameraFootprint: CameraFootprint | null = null

export function setWorld(w: WorldApi | null): void {
  world = w
}

export function getWorld(): WorldApi | null {
  return world
}

// Written by the scene camera rig every frame, read by the HUD minimap. Null
// while no scene is mounted.
export function setCameraFootprint(f: CameraFootprint | null): void {
  cameraFootprint = f
}

export function getCameraFootprint(): CameraFootprint | null {
  return cameraFootprint
}
