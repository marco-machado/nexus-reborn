import { describe, expect, it } from 'vitest'
import { DEVICE_MARK_R, objectiveMarks, objectiveZone } from './objectiveMarks'
import type { CityData, ObjectiveDef, Unit } from './types'

const city = {
  checkpoint: { x: 1, z: 2, r: 3 },
  extraction: { x: 9, z: 9, r: 4 },
  landmarks: { console: { x: 10, z: 20, r: 2.5 }, server: { x: 30, z: 40, r: 2 } },
} as unknown as CityData

const dev = (id: string, tag: string, x: number, dead = false) =>
  ({ id, kind: 'device', tag, pos: { x, z: 0 }, stance: dead ? 'dead' : 'idle' }) as unknown as Unit

const row = (id: string, active = true, done = false) => ({ id, active, done })

describe('objective marks (TM-020)', () => {
  it('a zone objective marks its own zone, its landmark, else the checkpoint', () => {
    expect(objectiveZone({ id: 'a', label: '', kind: 'reach-zone', zone: { x: 5, z: 5, r: 1 } }, city)).toEqual({ x: 5, z: 5, r: 1 })
    expect(objectiveZone({ id: 'b', label: '', kind: 'interact', landmark: 'console' }, city)).toEqual({ x: 10, z: 20, r: 2.5 })
    expect(objectiveZone({ id: 'c', label: '', kind: 'eliminate-tag', tag: 'garrison' }, city)).toEqual({ x: 1, z: 2, r: 3 })
  })

  it('marks every active objective, required and optional, and skips done, inactive and extract', () => {
    const defs: ObjectiveDef[] = [
      { id: 'gate', label: '', kind: 'reach-zone', landmark: 'console' },
      { id: 'server', label: '', kind: 'interact', landmark: 'server', optional: true },
      { id: 'later', label: '', kind: 'interact', landmark: 'console' },
      { id: 'out', label: '', kind: 'extract' },
    ]
    const marks = objectiveMarks(defs, [row('gate'), row('server'), row('later', false), row('out')], [], city)
    expect(marks).toEqual([
      { x: 10, z: 20, r: 2.5, optional: false },
      { x: 30, z: 40, r: 2, optional: true },
    ])
    expect(objectiveMarks(defs, [row('gate', true, true)], [], city)).toEqual([])
  })

  it('a destroy rings each living device of its tag, not the dead or other tags', () => {
    const defs: ObjectiveDef[] = [{ id: 'relays', label: '', kind: 'destroy', tag: 'relay' }]
    const units = [dev('r1', 'relay', 1), dev('r2', 'relay', 2, true), dev('t1', 'transformer', 3), dev('r3', 'relay', 4)]
    expect(objectiveMarks(defs, [row('relays')], units, city)).toEqual([
      { x: 1, z: 0, r: DEVICE_MARK_R, optional: false },
      { x: 4, z: 0, r: DEVICE_MARK_R, optional: false },
    ])
  })
})
