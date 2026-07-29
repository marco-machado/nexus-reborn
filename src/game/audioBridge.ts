// Mission-safe bridge to the procedural audio module. The simulation keeps a
// synchronous API while Rollup can place the implementation in its own lazy
// chunk. Calls made during the short module load window are safely ignored.
import type { WeaponId } from './types'

interface MissionSfx {
  gunshot: (weaponId: WeaponId) => void
  reload: () => void
  confirmBlip: () => void
  alertSting: () => void
  objectiveChime: () => void
  deathThud: () => void
  blast: () => void
}

let loaded: MissionSfx | null = null

void import('./audio').then(
  (module) => {
    loaded = module.sfx
  },
  () => undefined,
)

export const missionSfx: MissionSfx = {
  gunshot(weaponId) {
    loaded?.gunshot(weaponId)
  },
  reload() {
    loaded?.reload()
  },
  confirmBlip() {
    loaded?.confirmBlip()
  },
  alertSting() {
    loaded?.alertSting()
  },
  objectiveChime() {
    loaded?.objectiveChime()
  },
  deathThud() {
    loaded?.deathThud()
  },
  blast() {
    loaded?.blast()
  },
}
