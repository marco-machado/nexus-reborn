// CONTRACT FILE. Mission lifecycle wiring: builds the world when the screen
// mounts, tears it down on unmount. Rendering is delegated to GameCanvas
// (scene) and Hud (ui), which read the world via getWorld().
import { useEffect, useState } from 'react'
import { useAppStore } from '../state/appStore'
import { useMissionStore } from '../state/missionStore'
import { missionById, operativeById } from '../game/data'
import { createWorld } from '../game/world'
import { setWorld } from '../game/runtime'
import GameCanvas from '../scene/GameCanvas'
import Hud from './Hud'

export default function MissionScreen() {
  const missionId = useAppStore((s) => s.missionId)
  const squad = useAppStore((s) => s.squad)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!missionId) return
    const mission = missionById(missionId)
    const ops = squad.map(operativeById)
    const world = createWorld(mission, ops)
    setWorld(world)
    const ms = useMissionStore.getState()
    ms.reset()
    ms.setLive(true)
    setReady(true)
    return () => {
      setReady(false)
      setWorld(null)
      useMissionStore.getState().reset()
    }
  }, [missionId, squad])

  if (!missionId) return null
  return (
    <div className="mission-screen">
      {ready ? (
        <>
          <GameCanvas />
          <Hud />
        </>
      ) : (
        <div className="deploy-splash">ESTABLISHING SQUAD LINK</div>
      )}
    </div>
  )
}
