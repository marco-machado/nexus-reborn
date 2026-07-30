// Night sky, rain fog and the small budget of real lights. Everything else in
// the city glows through emissive materials picked up by the bloom pass.
import { useMemo } from 'react'
import { getWorld } from '../game/runtime'

interface Crossing {
  x: number
  z: number
}

export default function Atmosphere() {
  const world = getWorld()

  const crossings = useMemo<Crossing[]>(() => {
    if (!world) return []
    const { roadsH, roadsV } = world.city
    const all: Crossing[] = []
    for (const cz of roadsH) for (const cx of roadsV) all.push({ x: cx + 0.5, z: cz })
    if (all.length <= 6) return all
    const out: Crossing[] = []
    const step = all.length / 6
    for (let i = 0; i < 6; i++) out.push(all[Math.floor(i * step)])
    return out
  }, [world])

  // Gate lights and fog anchor on the archetype's gate landmark when present.
  const gate = world
    ? (world.city.landmarks.gate ?? world.city.checkpoint)
    : { x: 48, z: 14, r: 6 }

  return (
    <>
      <color attach="background" args={['#050a10']} />
      <fogExp2 attach="fog" args={['#0a141f', 0.007]} />
      <hemisphereLight args={['#a8c4da', '#2a3138', 0.85]} />
      <directionalLight color="#c2d8ee" intensity={1.1} position={[-30, 55, -20]} />
      <directionalLight color="#7d9ab8" intensity={0.35} position={[35, 40, 30]} />
      <pointLight position={[gate.x - 2.5, 4.6, gate.z + 5.5]} color="#ffb46b" intensity={7} distance={17} decay={1.8} />
      <pointLight position={[gate.x + 3.5, 4.6, gate.z + 5.5]} color="#ffb46b" intensity={7} distance={17} decay={1.8} />
      {crossings.map((c, i) => (
        <pointLight
          key={i}
          position={[c.x, 4.4, c.z]}
          color="#ffb46b"
          intensity={3.2}
          distance={13}
          decay={1.8}
        />
      ))}
    </>
  )
}
