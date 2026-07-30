// Post pipeline: scene pass with an MRT emissive target feeding bloom, so only
// emissive surfaces (neon, lamps, lasers, tracer booms) glow. On the LOW
// quality tier the pipeline drops the MRT target and the bloom pass and
// renders the plain scene pass alone.
import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RenderPipeline } from 'three/webgpu'
import { pass, mrt, output, emissive } from 'three/tsl'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import { TIER_PARAMS, getMissionTier } from '../game/quality'

export default function Effects() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)

  const pipeline = useMemo(() => {
    // Tier read at mount, like Rain: fixed for the lifetime of this canvas.
    const scenePass = pass(scene, camera)
    const p = new RenderPipeline(gl as never)
    if (TIER_PARAMS[getMissionTier()].bloom) {
      scenePass.setMRT(mrt({ output, emissive }))
      const bloomPass = bloom(scenePass.getTextureNode('emissive'), 0.55, 0.4, 0.0)
      p.outputNode = scenePass.getTextureNode('output').add(bloomPass)
    } else {
      p.outputNode = scenePass.getTextureNode('output')
    }
    return p
  }, [gl, scene, camera])

  useEffect(() => () => pipeline.dispose(), [pipeline])

  useFrame(() => {
    pipeline.render()
  }, 1)

  return null
}
