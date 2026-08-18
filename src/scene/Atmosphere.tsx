// Sky, fog and the small budget of real lights. Look is frozen from the
// mission Opening hour: dusk or night. Everything else in the city glows
// through emissive materials picked up by the bloom pass.
import { useMemo } from 'react'
import { getWorld } from '../game/runtime'
import { missionPeriod } from '../game/missionParams'
import type { MissionPeriod } from '../game/missionParams'

interface Crossing {
  x: number
  z: number
}

interface SkyLook {
  bg: string
  fog: string
  fogDensity: number
  hemiSky: string
  hemiGround: string
  hemiInt: number
  key: string
  keyInt: number
  fill: string
  fillInt: number
  lamp: string
  lampInt: number
  crossingInt: number
}

const SKY: Record<MissionPeriod, SkyLook> = {
  night: {
    bg: '#050a10',
    fog: '#0a141f',
    fogDensity: 0.007,
    hemiSky: '#a8c4da',
    hemiGround: '#2a3138',
    hemiInt: 0.85,
    key: '#c2d8ee',
    keyInt: 1.1,
    fill: '#7d9ab8',
    fillInt: 0.35,
    lamp: '#ffb46b',
    lampInt: 7,
    crossingInt: 3.2,
  },
  // Warmer, slightly brighter fill. Lamps and neon still read.
  dusk: {
    bg: '#0c1018',
    fog: '#1c2230',
    fogDensity: 0.0055,
    hemiSky: '#c8ae92',
    hemiGround: '#3a322e',
    hemiInt: 1.05,
    key: '#e6c4a0',
    keyInt: 1.35,
    fill: '#8aa0b8',
    fillInt: 0.45,
    lamp: '#ffb46b',
    lampInt: 6.2,
    crossingInt: 2.8,
  },
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

  // Sampled once from the Opening hour. The HUD clock still ticks; the sky does not.
  const look = SKY[world ? missionPeriod(world.mission.openingHour) : 'night']

  // Gate lights and fog anchor on the archetype's gate landmark when present.
  const gate = world
    ? (world.city.landmarks.gate ?? world.city.checkpoint)
    : { x: 48, z: 14, r: 6 }

  return (
    <>
      <color attach="background" args={[look.bg]} />
      <fogExp2 attach="fog" args={[look.fog, look.fogDensity]} />
      <hemisphereLight args={[look.hemiSky, look.hemiGround, look.hemiInt]} />
      <directionalLight color={look.key} intensity={look.keyInt} position={[-30, 55, -20]} />
      <directionalLight color={look.fill} intensity={look.fillInt} position={[35, 40, 30]} />
      <pointLight position={[gate.x - 2.5, 4.6, gate.z + 5.5]} color={look.lamp} intensity={look.lampInt} distance={17} decay={1.8} />
      <pointLight position={[gate.x + 3.5, 4.6, gate.z + 5.5]} color={look.lamp} intensity={look.lampInt} distance={17} decay={1.8} />
      {crossings.map((c, i) => (
        <pointLight
          key={i}
          position={[c.x, 4.4, c.z]}
          color={look.lamp}
          intensity={look.crossingInt}
          distance={13}
          decay={1.8}
        />
      ))}
    </>
  )
}
