// Mission lifecycle sequences shared by the UI and the tests (RA-019,
// ADR-0002, ADR-0009, ADR-0021). The MissionScreen and Hud call these; the
// tests call the same functions, so the real abort and deploy paths run.
import type { MissionDef } from '../game/types'
import { createWorld } from '../game/world'
import { getWorld, setWorld } from '../game/runtime'
import { useAppStore } from './appStore'
import { useMissionStore } from './missionStore'
import { liveOperativeById } from './campaignStore'
import { freezeDeploy } from './deployFreeze'
import { recordAbort } from './telemetry'

/**
 * Mission create (the MissionScreen composer). Resolves the squad to live
 * operatives, mints the ADR-0021 apply-once key (`deploySerial + 1`, minted
 * here and nowhere else), freezes the deploy (ADR-0009), builds and publishes
 * the world, then resets and arms the mission store. Writes no campaign state.
 */
export function composeMission(
  mission: MissionDef,
  squad: readonly string[],
): { world: ReturnType<typeof createWorld>; applyKey: number } {
  const ops = squad.map(liveOperativeById)
  // A StrictMode or squad-change rebuild mints a fresh key for the new world;
  // the torn-down world never reaches an outcome, so its key is burned.
  const applyKey = useAppStore.getState().deploySerial + 1
  useAppStore.setState({ deploySerial: applyKey })
  // A replay of a won contract rotates to the second authored variant.
  const world = createWorld(mission, ops, freezeDeploy(mission, ops, applyKey))
  setWorld(world)
  const ms = useMissionStore.getState()
  ms.reset()
  ms.setLive(true)
  return { world, applyKey }
}

/**
 * Abort a mission in progress (Hud, after the pause-menu confirm). Appends
 * the thin telemetry abort row and returns to the World Network. Memory only:
 * no outcome, no roster, no Experience, no campaign write (ADR-0002).
 */
export function abortMission(missionId: string | null): void {
  const world = getWorld()
  recordAbort(
    missionId ?? world?.mission.id ?? 'unknown',
    world?.time ?? 0,
    world?.mission.seed ?? 0,
    (world?.units ?? [])
      .filter((u) => u.kind === 'agent' && u.operative)
      .map((u) => u.operative!.role),
  )
  useAppStore.getState().goto('world')
}

/** Drop the published world and clear the mission store (MissionScreen cleanup). */
export function teardownMission(): void {
  setWorld(null)
  useMissionStore.getState().reset()
}
