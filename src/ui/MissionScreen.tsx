// CONTRACT FILE. Mission lifecycle wiring: builds the world when the screen
// mounts, tears it down on unmount. Rendering is delegated to GameCanvas
// (scene) and Hud (ui), which read the world via getWorld().
import { useEffect, useState } from 'react'
import { useAppStore } from '../state/appStore'
import { useMissionStore } from '../state/missionStore'
import { resolveMission, useWorldStore } from '../state/worldStore'
import { liveOperativeById, useCampaignStore } from '../state/campaignStore'
import { missionMods, missionVariant } from '../game/missionParams'
import { createWorld } from '../game/world'
import { setWorld } from '../game/runtime'
import GameCanvas from '../scene/GameCanvas'
import Hud from './Hud'

export default function MissionScreen() {
  const missionId = useAppStore((s) => s.missionId)
  const squad = useAppStore((s) => s.squad)
  const linked = useMissionStore((s) => s.squad.length > 0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!missionId) return
    const mission = resolveMission(missionId)
    if (!mission) return
    const ops = squad.map(liveOperativeById)
    // Deployment snapshot: sector state and the layout variant are computed
    // here, outside the sim, so world.ts never reads worldStore. A replay of
    // a won contract rotates to the second authored variant.
    const replay = useCampaignStore.getState().contractsWon.includes(mission.id)
    const sector = useWorldStore.getState().sectors[mission.sector]
    const world = createWorld(mission, ops, {
      mods: missionMods(mission, sector),
      district: missionVariant(mission, replay),
      loadout: useAppStore.getState().loadout,
    })
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
      {ready && (
        <>
          <GameCanvas />
          <Hud />
        </>
      )}
      {/* Full screen splash above the canvas while it warms up; fades out once
          the simulation populates the squad store on its first tick. */}
      <div className={'deploy-splash' + (linked ? ' out' : '')}>ESTABLISHING SQUAD LINK</div>
    </div>
  )
}
