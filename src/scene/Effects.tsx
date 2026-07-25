// Post pipeline: scene pass with an MRT emissive target feeding bloom, so only
// emissive surfaces (neon, lamps, lasers, tracer booms) glow.
import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RenderPipeline } from 'three/webgpu'
import { pass, mrt, output, emissive } from 'three/tsl'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'

export default function Effects() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)

  const pipeline = useMemo(() => {
    const scenePass = pass(scene, camera)
    scenePass.setMRT(mrt({ output, emissive }))
    const bloomPass = bloom(scenePass.getTextureNode('emissive'), 0.55, 0.4, 0.0)
    const p = new RenderPipeline(gl as never)
    p.outputNode = scenePass.getTextureNode('output').add(bloomPass)
    return p
  }, [gl, scene, camera])

  useEffect(() => () => pipeline.dispose(), [pipeline])

  useFrame(() => {
    pipeline.render()
  }, 1)

  return null
}
