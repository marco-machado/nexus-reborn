// Mission-safe bridge to the procedural audio module. The simulation keeps a
// synchronous API while Rollup can place the implementation in its own lazy
// chunk. Calls made during the short module load window are safely ignored.
import type { WeaponId, Weather } from './types'

interface MissionSfx {
  gunshot: (weaponId: WeaponId, side?: 'squad' | 'corpsec') => void
  reload: () => void
  confirmBlip: () => void
  alertSting: () => void
  objectiveChime: () => void
  deathThud: () => void
  blast: () => void
  interactTick: () => void
  abilityCue: () => void
  agentHit: () => void
  threatLevel: (level: number) => void
  weatherBed: (weather: Weather) => void
}

let loaded: MissionSfx | null = null

void import('./audio').then(
  (module) => {
    loaded = module.sfx
  },
  () => undefined,
)

export const missionSfx: MissionSfx = {
  gunshot(weaponId, side) {
    loaded?.gunshot(weaponId, side)
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
  interactTick() {
    loaded?.interactTick()
  },
  abilityCue() {
    loaded?.abilityCue()
  },
  agentHit() {
    loaded?.agentHit()
  },
  threatLevel(level) {
    loaded?.threatLevel(level)
  },
  weatherBed(weather) {
    loaded?.weatherBed(weather)
  },
}
