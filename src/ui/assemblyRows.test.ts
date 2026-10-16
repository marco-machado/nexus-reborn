// RA-008 AC 5: focusing a dossier never edits the squad. The Assembly row body
// and the squad bays call `read`; only the trailing assign key calls `assign`.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../state/appStore'
import { assemblyRowHandlers } from './assemblyRows'

describe('assemblyRowHandlers (RA-008 AC 5)', () => {
  beforeEach(() => {
    useAppStore.setState({ squad: ['op1', 'op2', 'op3'] })
  })

  it('reading a dossier focuses it and leaves the assigned set unchanged', () => {
    const focus = vi.fn()
    const toggle = vi.fn(useAppStore.getState().toggleOperative)
    for (const id of ['op1', 'op4', 'op5']) assemblyRowHandlers(id, { focus, toggle }).read()
    expect(focus.mock.calls).toEqual([['op1'], ['op4'], ['op5']])
    expect(toggle).not.toHaveBeenCalled()
    expect(useAppStore.getState().squad).toEqual(['op1', 'op2', 'op3'])
  })

  it('the assign key toggles the squad through the store and does not move focus', () => {
    const focus = vi.fn()
    const toggle = useAppStore.getState().toggleOperative
    assemblyRowHandlers('op4', { focus, toggle }).assign()
    expect(useAppStore.getState().squad).toEqual(['op1', 'op2', 'op3', 'op4'])
    assemblyRowHandlers('op2', { focus, toggle }).assign()
    expect(useAppStore.getState().squad).toEqual(['op1', 'op3', 'op4'])
    expect(focus).not.toHaveBeenCalled()
  })
})
