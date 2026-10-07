import { afterAll, describe, expect, it } from 'vitest'
import * as THREE from 'three/webgpu'
import { addAgentModel, createAgentResources } from './agentModel'
import { TEAL } from '../ui/tokens'

const resources = createAgentResources()
const optic = new THREE.MeshStandardMaterial({ emissive: TEAL })
const batches = [...resources.body, ...resources.leftLeg, ...resources.rightLeg, ...resources.rifle]

afterAll(() => {
  for (const batch of batches) batch.geometry.dispose()
  const textures = new Set<THREE.Texture>()
  for (const material of Object.values(resources.materials)) {
    for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value)
    material.dispose()
  }
  for (const texture of textures) texture.dispose()
  optic.dispose()
})

describe('procedural armored agent', () => {
  it('fits the mission height and ground plane, with forward-facing optics', () => {
    const rig = new THREE.Group()
    rig.scale.setScalar(1.22)
    addAgentModel(rig, resources, optic, true)
    const bounds = new THREE.Box3().setFromObject(rig)
    expect(Math.abs(bounds.min.y)).toBeLessThan(0.01)
    expect(bounds.max.y).toBeGreaterThan(1.9)
    expect(bounds.max.y).toBeLessThan(2.12) // Health tag remains clear above the helmet.
    const optics = resources.body.find((batch) => batch.finish === 'optic')!
    expect(optics.geometry.boundingBox!.min.x).toBeGreaterThan(0.1)
  })

  it('shares GPU resources while each unit retains independent animated leg pivots', () => {
    const first = new THREE.Group()
    const second = new THREE.Group()
    const a = addAgentModel(first, resources, optic, true)
    const b = addAgentModel(second, resources, optic, true)
    const meshA = a.legL.children[0] as THREE.Mesh
    const meshB = b.legL.children[0] as THREE.Mesh
    expect(meshA.geometry).toBe(meshB.geometry)
    expect(meshA.material).toBe(meshB.material)
    a.legL.rotation.z = 0.55
    expect(b.legL.rotation.z).toBe(0)
    expect(a.legR.rotation.z).toBe(0)
    first.updateMatrixWorld(true)
    expect(meshA.matrixWorld.equals(meshB.matrixWorld)).toBe(false)
  })

  it('omits the complete rifle assembly for an unarmed preview', () => {
    const rig = new THREE.Group()
    addAgentModel(rig, resources, optic, false)
    expect(rig.getObjectByName('agent-rifle')).toBeUndefined()
    expect(rig.getObjectByName('agent-body')).toBeDefined()
  })

  it('bounds detailed-agent geometry and draw batches independently of small details', () => {
    let triangles = 0
    for (const { geometry } of batches) {
      const positions = geometry.getAttribute('position')
      expect(Array.from(positions.array).every(Number.isFinite)).toBe(true)
      triangles += (geometry.index?.count ?? positions.count) / 3
    }
    expect(triangles).toBeLessThan(20000)
    expect(batches.length).toBeLessThanOrEqual(20)
  })
})
