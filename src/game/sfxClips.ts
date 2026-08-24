// Vite URL map for the committed combat / UI / rain clips.
// Bytes stay out of this module; audio.ts fetches and decodes them.
import type { WeaponId } from './types'

import gunAssault from '../../inspiration/audio/sfx/gun-assault.mp3?url'
import gunAssaultCorpsec from '../../inspiration/audio/sfx/gun-assault-corpsec.mp3?url'
import gunSmg from '../../inspiration/audio/sfx/gun-smg.mp3?url'
import gunSmgCorpsec from '../../inspiration/audio/sfx/gun-smg-corpsec.mp3?url'
import gunPistol from '../../inspiration/audio/sfx/gun-pistol.mp3?url'
import gunPistolCorpsec from '../../inspiration/audio/sfx/gun-pistol-corpsec.mp3?url'
import gunLongrifle from '../../inspiration/audio/sfx/gun-longrifle.mp3?url'
import gunLongrifleCorpsec from '../../inspiration/audio/sfx/gun-longrifle-corpsec.mp3?url'
import gunShotgun from '../../inspiration/audio/sfx/gun-shotgun.mp3?url'
import gunShotgunCorpsec from '../../inspiration/audio/sfx/gun-shotgun-corpsec.mp3?url'
import reload from '../../inspiration/audio/sfx/reload.mp3?url'
import blast from '../../inspiration/audio/sfx/blast.mp3?url'
import death from '../../inspiration/audio/sfx/death.mp3?url'
import agentHit from '../../inspiration/audio/sfx/agent-hit.mp3?url'
import ability from '../../inspiration/audio/sfx/ability.mp3?url'
import alertSting from '../../inspiration/audio/sfx/alert-sting.mp3?url'
import confirm from '../../inspiration/audio/sfx/confirm.mp3?url'
import uiClick from '../../inspiration/audio/sfx/ui-click.mp3?url'
import objective from '../../inspiration/audio/sfx/objective.mp3?url'
import interact from '../../inspiration/audio/sfx/interact.mp3?url'
import rainLight from '../../inspiration/audio/sfx/rain-light.mp3?url'
import rainHeavy from '../../inspiration/audio/sfx/rain-heavy.mp3?url'

export type GunSide = 'squad' | 'corpsec'

const GUN: Record<WeaponId, Record<GunSide, string>> = {
  assault: { squad: gunAssault, corpsec: gunAssaultCorpsec },
  smg: { squad: gunSmg, corpsec: gunSmgCorpsec },
  pistol: { squad: gunPistol, corpsec: gunPistolCorpsec },
  longrifle: { squad: gunLongrifle, corpsec: gunLongrifleCorpsec },
  shotgun: { squad: gunShotgun, corpsec: gunShotgunCorpsec },
}

export const CLIPS = {
  gun: GUN,
  reload,
  blast,
  death,
  agentHit,
  ability,
  alertSting,
  confirm,
  uiClick,
  objective,
  interact,
  rainLight,
  rainHeavy,
}

export function gunClipUrl(weaponId: WeaponId, side: GunSide = 'squad'): string {
  const pair = GUN[weaponId] ?? GUN.pistol
  return side === 'corpsec' ? pair.corpsec : pair.squad
}

export function rainClipUrl(weather: 'light' | 'heavy'): string {
  return weather === 'heavy' ? rainHeavy : rainLight
}

const WEAPONS: WeaponId[] = ['assault', 'smg', 'pistol', 'longrifle', 'shotgun']

export const ONE_SHOT_URLS: string[] = [
  ...WEAPONS.flatMap((id) => [GUN[id].squad, GUN[id].corpsec]),
  reload,
  blast,
  death,
  agentHit,
  ability,
  alertSting,
  confirm,
  uiClick,
  objective,
  interact,
]
