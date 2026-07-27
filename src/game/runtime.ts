// CONTRACT FILE. Module level holders for the live simulation instance, the
// camera pose and pan requests, so the scene, HUD and input layers can reach
// them without prop drilling or React state.
import type { CameraFootprint, Vec2, WorldApi } from './types'

let world: WorldApi | null = null
let cameraFootprint: CameraFootprint | null = null
let cameraFocus: Vec2 | null = null
const panRequest: Vec2 = { x: 0, z: 0 }
let panPending = false

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

// The ground point the camera looks at, written every frame beside the
// footprint. Live and mutable like the footprint, so read it and drop it.
export function setCameraFocus(p: Vec2 | null): void {
  cameraFocus = p
}

export function getCameraFocus(): Vec2 | null {
  return cameraFocus
}

// Pan request from the HUD to the rig, which takes it on its next frame. A
// drag firing faster than the frame rate leaves only its newest point.
export function panCameraTo(x: number, z: number): void {
  panRequest.x = x
  panRequest.z = z
  panPending = true
}

// Returns the shared request point, so copy the numbers out before yielding.
export function takeCameraPan(): Vec2 | null {
  if (!panPending) return null
  panPending = false
  return panRequest
}
