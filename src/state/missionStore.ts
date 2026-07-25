// CONTRACT FILE. Mission runtime UI state. The simulation (src/game/world.ts)
// pushes updates here at a low rate; HUD components subscribe to this store.
// Fast per frame data (unit positions) is read directly from the world via
// src/game/runtime.ts getWorld() inside useFrame or rAF loops, never via React.
import { create } from 'zustand'
import type { CommEntry } from '../game/types'

export interface SquadMemberUi {
  unitId: string
  slot: number
  name: string
  codename: string
  accent: string
  hp: number
  maxHp: number
  magazine: number
  magazineSize: number
  reloading: boolean
  weaponName: string
  sidearmName: string
  dead: boolean
}

export interface ObjectiveUi {
  id: string
  label: string
  done: boolean
  active: boolean
}

interface MissionUiState {
  live: boolean
  paused: boolean
  selected: string[]
  squad: SquadMemberUi[]
  objectives: ObjectiveUi[]
  log: CommEntry[]
  alert: number
  result: 'none' | 'won' | 'lost'
  clock: string
  setLive: (v: boolean) => void
  setPaused: (v: boolean) => void
  setSelected: (ids: string[]) => void
  setSquad: (rows: SquadMemberUi[]) => void
  setObjectives: (rows: ObjectiveUi[]) => void
  addLog: (e: CommEntry) => void
  setAlert: (n: number) => void
  setResult: (r: 'none' | 'won' | 'lost') => void
  setClock: (c: string) => void
  reset: () => void
}

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
}

export const useMissionStore = create<MissionUiState>((set) => ({
  ...initial,
  setLive: (v) => set({ live: v }),
  setPaused: (v) => set({ paused: v }),
  setSelected: (ids) => set({ selected: ids }),
  setSquad: (rows) => set({ squad: rows }),
  setObjectives: (rows) => set({ objectives: rows }),
  addLog: (e) => set((s) => ({ log: [...s.log.slice(-60), e] })),
  setAlert: (n) => set({ alert: n }),
  setResult: (r) => set({ result: r }),
  setClock: (c) => set({ clock: c }),
  reset: () => set({ ...initial }),
}))
