// CONTRACT FILE. Mission lifecycle wiring: builds the world when the screen
// mounts, tears it down on unmount. Rendering is delegated to GameCanvas
// (scene) and Hud (ui), which read the world via getWorld().
import { useEffect, useState } from 'react'
import { useAppStore } from '../state/appStore'
import { useMissionStore } from '../state/missionStore'
import { resolveMission } from '../state/worldStore'
import { liveOperativeById } from '../state/campaignStore'
import { freezeDeploy } from '../state/deployFreeze'
import { createWorld } from '../game/world'
import { setWorld } from '../game/runtime'
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
    const ops = squad.map(liveOperativeById)
    // ADR-0021: one apply-once key per mission create, minted here and nowhere
    // else. A StrictMode or squad-change rebuild mints a fresh key for the new
    // world; the torn-down world never reaches an outcome, so its key is burned.
    const applyKey = useAppStore.getState().deploySerial + 1
    useAppStore.setState({ deploySerial: applyKey })
    // Deploy freeze (ADR-0009): the four slices, mods and district are
    // cloned from the live stores once, here, so the sim never reads a store.
    // A replay of a won contract rotates to the second authored variant.
    const world = createWorld(mission, ops, freezeDeploy(mission, ops, applyKey))
    setWorld(world)
    const ms = useMissionStore.getState()
    ms.reset()
    ms.setLive(true)
    setReady(true)
    startMissionBed()
    return () => {
      setReady(false)
      setWorld(null)
      useMissionStore.getState().reset()
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
