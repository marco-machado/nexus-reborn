// Post pipeline: scene pass with an MRT emissive target feeding bloom, so only
// emissive surfaces (neon, lamps, lasers, tracer booms) glow. On the LOW
// quality tier the pipeline drops the MRT target and the bloom pass and
// renders the plain scene pass alone.
//
// Mission entry: the first pipeline.render() built every material's pipeline
// in one ~260 ms frame (frame-time pass 2026-10-22, R4). The scene pass is now
// precompiled with PassNode.compileAsync (three r185), which compiles against
// the pass's own render target and MRT, so the pipelines match the ones the
// pass draws with. Until it resolves nothing is rendered and WorldTicker holds
// the mission clock (sceneWarm), so no mission time passes undrawn. Objects
// outside the camera at compile time, and the bloom/output quads, still
// compile on first use.
import { useEffect, useLayoutEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RenderPipeline } from 'three/webgpu'
import type { WebGPURenderer } from 'three/webgpu'
import { pass, mrt, output, emissive } from 'three/tsl'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import { TIER_PARAMS, getMissionTier } from '../game/quality'
import { sceneWarm, setSceneWarm } from './sceneWarm'

export default function Effects() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)

  const { pipeline, scenePass } = useMemo(() => {
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
    return { pipeline: p, scenePass }
  }, [gl, scene, camera])

  useEffect(() => () => pipeline.dispose(), [pipeline])

  // Layout effect: runs at commit, before the first frame WorldTicker sees.
  useLayoutEffect(() => {
    setSceneWarm(false)
    let current = true
    // A failed precompile falls back to compiling on first render, as before.
    scenePass
      .compileAsync(gl as unknown as WebGPURenderer)
      .catch(() => {})
      .finally(() => {
        if (current) setSceneWarm(true)
      })
    return () => {
      current = false
    }
  }, [gl, scenePass])

  useFrame(() => {
    if (!sceneWarm()) return
    pipeline.render()
  }, 1)

  return null
}
