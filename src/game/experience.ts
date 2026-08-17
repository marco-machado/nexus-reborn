// Operative experience. Survivors gain a point per mission; createWorld
// samples the bonus the same way it samples research, so a running
// deployment never changes under a later award.
export const XP_PER_SURVIVE = 1
export const XP_HP_PER = 2
export const XP_SPEED_PER = 0.05

export interface XpBonus {
  maxHp: number
  speed: number
}

export function xpBonus(xp: number): XpBonus {
  const n = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0
  return { maxHp: n * XP_HP_PER, speed: n * XP_SPEED_PER }
}
