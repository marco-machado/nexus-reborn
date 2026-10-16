// TM-015 (TR-tactical-008, ADR-0016, AC 22): the mission camera does not
// rotate or tilt in play, and minimap up is screen up because the minimap
// turns by the same yaw. ADR-0016 keeps ELEV / MIN_DIST / MAX_DIST / fov local
// to CameraRig (no CameraPose module), and CameraRig imports three/webgpu, so
// this reads its source as text: no WebGPU in Node.
import { describe, expect, it } from 'vitest'
import { CAMERA_YAW } from '../game/types'
import rigSrc from './CameraRig.tsx?raw'
import minimapSrc from '../ui/Minimap.tsx?raw'

describe('fixed camera pose (TM-015, AC 22)', () => {
  it('yaw is 45°, elevation 55°, FOV 25°, zoom 44–115 m (spec literals)', () => {
    expect(CAMERA_YAW).toBeCloseTo((45 * Math.PI) / 180, 12)
    expect(rigSrc).toContain('const ELEV = (55 * Math.PI) / 180')
    expect(rigSrc).toMatch(/^const MIN_DIST = 44$/m)
    expect(rigSrc).toMatch(/^const MAX_DIST = 115$/m)
    expect(rigSrc).toMatch(/^\s*cam\.fov = 25$/m)
    // One definition each, so no later binding overrides the pose.
    expect(rigSrc.match(/\bcam\.fov\s*=/g)).toHaveLength(1)
    expect(rigSrc.match(/\bconst (ELEV|MIN_DIST|MAX_DIST)\b/g)).toHaveLength(3)
  })

  it('CameraRig takes its yaw from CAMERA_YAW and nothing in play rotates or tilts it', () => {
    expect(rigSrc).toContain("import { CAMERA_YAW, type CameraFootprint } from '../game/types'")
    expect(rigSrc).toContain('const SIN_Y = Math.sin(CAMERA_YAW)')
    expect(rigSrc).toContain('const COS_Y = Math.cos(CAMERA_YAW)')
    // Yaw and elevation are read-only bindings: no assignment, no orbit
    // controls, no direct rotation of the camera.
    expect(rigSrc).not.toMatch(/(?<!const )\bELEV\s*[-+*/]?=(?!=)/)
    expect(rigSrc).not.toMatch(/(?<!const )\b(SIN_Y|COS_Y)\s*[-+*/]?=(?!=)/)
    expect(rigSrc).not.toContain('OrbitControls')
    expect(rigSrc).not.toMatch(/camera\.(rotation|quaternion|up)\b/)
    expect(rigSrc).not.toMatch(/\bcam\.(rotation|quaternion|up)\b/)
    // Input reaches pan and zoom only.
    expect(rigSrc).not.toMatch(/case '(rotate|tilt|orbit)/i)
  })

  it('the minimap turns by the camera yaw, so screen up maps to panel up', () => {
    expect(minimapSrc).toContain('const YAW_SIN = Math.sin(CAMERA_YAW)')
    expect(minimapSrc).toContain('const YAW_COS = Math.cos(CAMERA_YAW)')
    expect(minimapSrc).toContain('ctx.rotate(CAMERA_YAW)')
    // Screen up on the ground is away from the eye: (-sin yaw, -cos yaw).
    const fwd = { x: -Math.sin(CAMERA_YAW), z: -Math.cos(CAMERA_YAW) }
    // The minimap's turn (turnX / turnZ in Minimap.tsx) sends it to panel up.
    const panelX = fwd.x * Math.cos(CAMERA_YAW) - fwd.z * Math.sin(CAMERA_YAW)
    const panelY = fwd.x * Math.sin(CAMERA_YAW) + fwd.z * Math.cos(CAMERA_YAW)
    expect(panelX).toBeCloseTo(0, 12)
    expect(panelY).toBeCloseTo(-1, 12)
  })
})
