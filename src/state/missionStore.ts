// CONTRACT FILE. Mission runtime UI state. The simulation (src/game/world.ts)
// pushes updates here at a low rate; HUD components subscribe to this store.
// Fast per frame data (unit positions) is read directly from the world via
// src/game/runtime.ts getWorld() inside useFrame or rAF loops, never via React.
import { create } from 'zustand'
import type { CommEntry, Weather } from '../game/types'

export interface MissionInventory {
  med: number
  cell: number
}

export type AbilityAvailability = 'out-of-stock' | 'cooldown' | 'usable'

export interface AbilitySnapshot {
  availability: AbilityAvailability
  cooldownRemaining: number
  cooldownDuration: number
}

export interface MissionAbilities {
  grenade: AbilitySnapshot
}

export interface SquadMemberUi {
  unitId: string
  slot: number
  name: string
  codename: string
  accent: string
  hp: number
  maxHp: number
  // The drawn weapon: name, live magazine and reload state.
  magazine: number
  magazineSize: number
  reloading: boolean
  // True while the freshly drawn weapon is still coming up and cannot fire.
  swapping: boolean
  weaponName: string
  // Which authored slot is drawn, and the stowed slot's name and magazine.
  activeSlot: 'primary' | 'sidearm'
  stowedName: string
  stowedMagazine: number
  stowedMagazineSize: number
  // Order state, mirrored from the unit so the squad card can show it.
  holdGround: boolean
  holdFire: boolean
  // Role ability snapshot (game/abilities.ts): the active's name, cooldown
  // remaining against the total it was charged, and how long the running
  // effect still has (0 while none runs).
  abilityName: string
  abilityCooldownRemaining: number
  abilityCooldownDuration: number
  abilityActiveRemaining: number
  abilityActiveDuration: number
  dead: boolean
}

export interface ObjectiveUi {
  id: string
  label: string
  done: boolean
  active: boolean
  optional?: boolean
  failed?: boolean
  // 0..1 for an active interact channel or defend countdown.
  progress?: number
  // Remaining defend time, preformatted (m:ss).
  timer?: string
}

export interface MissionUiState {
  live: boolean
  paused: boolean
  selected: string[]
  squad: SquadMemberUi[]
  objectives: ObjectiveUi[]
  log: CommEntry[]
  alert: number
  result: 'none' | 'won' | 'lost'
  clock: string
  weather: Weather
  inventory: MissionInventory
  abilities: MissionAbilities
  grenadeTargeting: boolean
  setLive: (v: boolean) => void
  setPaused: (v: boolean) => void
  setSelected: (ids: string[]) => void
  setSquad: (rows: SquadMemberUi[]) => void
  setObjectives: (rows: ObjectiveUi[]) => void
  addLog: (e: CommEntry) => void
  setAlert: (n: number) => void
  setResult: (r: 'none' | 'won' | 'lost') => void
  setClock: (c: string) => void
  setWeather: (w: Weather) => void
  setInventory: (inventory: MissionInventory) => void
  setAbilities: (abilities: MissionAbilities) => void
  setGrenadeTargeting: (v: boolean) => void
  reset: () => void
}

const emptyAbility = (duration: number): AbilitySnapshot => ({
  availability: 'out-of-stock',
  cooldownRemaining: 0,
  cooldownDuration: duration,
})

const initial = {
  live: false,
  paused: false,
  selected: [] as string[],
  squad: [] as SquadMemberUi[],
  objectives: [] as ObjectiveUi[],
  log: [] as CommEntry[],
  alert: 0,
  result: 'none' as const,
  clock: '22:00:00',
  weather: 'none' as Weather,
  inventory: { med: 0, cell: 0 } as MissionInventory,
  abilities: {
    grenade: emptyAbility(4),
  } as MissionAbilities,
  grenadeTargeting: false,
}

export const useMissionStore = create<MissionUiState>((set) => ({
  ...initial,
  setLive: (v) => set({ live: v, ...(!v ? { grenadeTargeting: false } : {}) }),
  setPaused: (v) => set({ paused: v, ...(v ? { grenadeTargeting: false } : {}) }),
  setSelected: (ids) => set({ selected: ids }),
  setSquad: (rows) =>
    set((s) => ({
      squad: rows,
      ...(s.grenadeTargeting &&
      !s.selected.some((id) => rows.some((row) => row.unitId === id && !row.dead))
        ? { grenadeTargeting: false }
        : {}),
    })),
  setObjectives: (rows) => set({ objectives: rows }),
  addLog: (e) => set((s) => ({ log: [...s.log.slice(-60), e] })),
  setAlert: (n) => set({ alert: n }),
  setResult: (r) => set({ result: r, ...(r !== 'none' ? { grenadeTargeting: false } : {}) }),
  setClock: (c) => set({ clock: c }),
  setWeather: (w) => set({ weather: w }),
  setInventory: (inventory) => set({ inventory }),
  setAbilities: (abilities) =>
    set({
      abilities,
      ...(abilities.grenade.availability !== 'usable' ? { grenadeTargeting: false } : {}),
    }),
  setGrenadeTargeting: (v) => set({ grenadeTargeting: v }),
  reset: () => set({ ...initial }),
}))
