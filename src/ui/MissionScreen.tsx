// CONTRACT FILE. Mission lifecycle wiring: builds the world when the screen
// mounts, tears it down on unmount. Rendering is delegated to GameCanvas
// (scene) and Hud (ui), which read the world via getWorld().
import { useEffect, useState } from 'react'
import { useAppStore } from '../state/appStore'
import { useMissionStore } from '../state/missionStore'
import { resolveMission } from '../state/worldStore'
import { composeMission, teardownMission } from '../state/missionLifecycle'
import { missionSfx } from '../game/audioBridge'
import { startMissionBed, stopMissionBed } from './sound'
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
    composeMission(mission, squad)
    setReady(true)
    startMissionBed()
    return () => {
      setReady(false)
      teardownMission()
      // The tension drone and rain bed must not follow the player back.
      missionSfx.threatLevel(0)
      stopMissionBed()
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
