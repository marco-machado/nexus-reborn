// RA-005 AC 52: a refused Deploy button names the overage. The copy is built
// from the real canDeploy gate, so a wrong overKg or format fails here.
import { describe, expect, it } from 'vitest'
import { canDeploy } from '../game/deployGate'
import { deployRefusalCopy } from './deployRefusal'

const READY = { op1: 'READY', op2: 'READY' } as const
const gate = (massKg: number, missionSelected = true, assignedIds = ['op1', 'op2']) =>
  canDeploy({ missionSelected, assignedIds, statusById: READY, massKg })

describe('deployRefusalCopy', () => {
  it('names a 0.1 kg overage at 400.1 kg (AC 52)', () => {
    expect(deployRefusalCopy(gate(400.1))).toEqual([
      '0.1 KG OVER THE MASS LIMIT',
      'OFFLOAD 0.1 KG BEFORE DEPLOYMENT',
    ])
  })

  it('names the overage to one decimal for a larger excess', () => {
    expect(deployRefusalCopy(gate(412.34))?.[0]).toBe('12.3 KG OVER THE MASS LIMIT')
  })

  it('has no refusal copy at exactly 400 kg', () => {
    expect(deployRefusalCopy(gate(400))).toBeNull()
  })

  it('says why for each non-mass refusal', () => {
    expect(deployRefusalCopy(gate(300, false))?.[0]).toBe('NO CONTRACT SELECTED')
    expect(deployRefusalCopy(gate(300, true, []))?.[0]).toBe('NO OPERATIVES ASSIGNED')
    expect(
      deployRefusalCopy(
        canDeploy({ missionSelected: true, assignedIds: ['op1'], statusById: { op1: 'INJURED' }, massKg: 70 }),
      )?.[0],
    ).toBe('INJURED OPERATIVE ASSIGNED')
  })
})
