// RS-009 / P-22: the Research remaining label exists only after sync(t) for
// that same t, reads endT - t rounded up, and never paints 0. The label is
// rendered to static markup and queried by its test selector.
import { beforeEach, describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { nodeById } from '../game/research'
import { useResearchStore } from '../state/researchStore'
import type { LabRun } from '../state/researchStore'
import { captureSave, hydrateSave, startNewOperation } from '../state/save'
import { useWorldStore } from '../state/worldStore'
import { REMAINING_TEST_ID, RemainingLabel } from './RemainingLabel'
import { paintedRemaining, remainingHms } from './remainingPaint'

const propellants = nodeById('b-propellants') // 2h, Ballistics

/** Renders the label as the Research screen does: world t + store lastSyncT. */
function paint(run: LabRun | null, t: number): string {
  const lastSyncT = useResearchStore.getState().lastSyncT
  return renderToStaticMarkup(createElement(RemainingLabel, { run, t, lastSyncT }))
}

/** The painted seconds under the label's test selector, or null when absent. */
function queryRemaining(html: string): number | null {
  const m = new RegExp('data-testid="' + REMAINING_TEST_ID + '"[^>]*data-remaining-sec="(\\d+)"').exec(html)
  return m ? Number(m[1]) : null
}

function activeRun(): LabRun {
  const run = useResearchStore.getState().labs.ballistics
  if (!run) throw new Error('ballistics lab is idle')
  return run
}

beforeEach(() => {
  startNewOperation(null)
})

describe('Research remaining label (DOM)', () => {
  it('has no label at t = 7199 before any sync, then reads 1 after sync(7199)', () => {
    expect(useResearchStore.getState().start(propellants, 0)).toBe(true)
    const run = activeRun()
    expect(run).toMatchObject({ startedT: 0, endT: 7200 })
    expect(useResearchStore.getState().lastSyncT).toBeNull()

    const before = paint(run, 7199)
    expect(before).not.toContain(REMAINING_TEST_ID)
    expect(before).toBe('')

    useResearchStore.getState().sync(7199)
    expect(useResearchStore.getState().lastSyncT).toBe(7199)
    const after = paint(activeRun(), 7199)
    expect(queryRemaining(after)).toBe(1)
    expect(after).toContain('0:00:01 REMAINING')
  })

  it('has no label when lastSyncT is older than t', () => {
    useResearchStore.getState().start(propellants, 0)
    useResearchStore.getState().sync(7000)
    expect(paint(activeRun(), 7199)).toBe('')
    expect(paint(activeRun(), 7000)).toContain(REMAINING_TEST_ID)
  })

  it('reads 6200 after sync(1000) for endT 7200, not the catalog duration', () => {
    useResearchStore.getState().start(propellants, 0)
    useResearchStore.getState().sync(1000)
    const html = paint(activeRun(), 1000)
    expect(queryRemaining(html)).toBe(6200)
    expect(queryRemaining(html)).not.toBe(propellants.hours * 3600)
    expect(html).toContain('1:43:20 REMAINING')
  })

  it('shows no countdown once the project is researched', () => {
    useResearchStore.getState().start(propellants, 0)
    const run = activeRun()
    useResearchStore.getState().sync(7200)
    expect(useResearchStore.getState().done).toEqual([propellants.id])
    expect(useResearchStore.getState().labs.ballistics).toBeNull()
    expect(paint(null, 7200)).toBe('')
    // Even the stale run at its own endT paints nothing, never 0.
    expect(paint(run, 7200)).toBe('')
  })

  it('rounds a fractional remainder up so it never paints 0', () => {
    useResearchStore.getState().start(propellants, 0)
    useResearchStore.getState().sync(7199.75)
    expect(queryRemaining(paint(activeRun(), 7199.75))).toBe(1)
  })

  it('new campaign is not hydration: no label until the first sync', () => {
    useResearchStore.getState().sync(500)
    startNewOperation(null)
    expect(useResearchStore.getState().lastSyncT).toBeNull()
    useResearchStore.getState().start(propellants, 0)
    expect(paint(activeRun(), 0)).toBe('')
    useResearchStore.getState().sync(0)
    expect(queryRemaining(paint(activeRun(), 0))).toBe(7200)
  })

  it('hydration counts as sync at the loaded t', () => {
    useResearchStore.getState().start(propellants, 0)
    useWorldStore.setState({ t: 7199 })
    const save = captureSave()
    startNewOperation(null)
    hydrateSave(save)
    expect(useResearchStore.getState().lastSyncT).toBe(7199)
    expect(queryRemaining(paint(activeRun(), useWorldStore.getState().t))).toBe(1)
  })
})

describe('paintedRemaining / remainingHms', () => {
  const run = { endT: 7200 }

  it('is none before sync for that t, and ceil(endT - t) after', () => {
    expect(paintedRemaining(run, 7199, null)).toBeNull()
    expect(paintedRemaining(run, 7199, 7198)).toBeNull()
    expect(paintedRemaining(run, 7199, 7199)).toBe(1)
  })

  it('is none, never 0, at and past endT even when synced', () => {
    expect(paintedRemaining(run, 7200, 7200)).toBeNull()
    expect(paintedRemaining(run, 7300, 7300)).toBeNull()
    expect(paintedRemaining(null, 10, 10)).toBeNull()
  })

  it('formats H:MM:SS, keeping the 50,400 s magnitude readable', () => {
    expect(remainingHms(1)).toBe('0:00:01')
    expect(remainingHms(6200)).toBe('1:43:20')
    expect(remainingHms(50400)).toBe('14:00:00')
  })
})
