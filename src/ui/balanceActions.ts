// BALANCE panel actions, kept out of the component so they run without a DOM.
// EXPORT builds a local data: URL and clicks a download anchor; nothing is
// uploaded (ADR-0015). CLEAR is two-step: the first press only arms a confirm,
// the second erases the telemetry log and nothing else (the campaign blob
// lives under its own key and is never touched here).
import { clearRecords, exportJson } from '../state/telemetry'
import type { MissionRecord } from '../state/telemetry'
import type { SettingsStorage } from '../state/settingsStore'

/** File name the Export download saves under. */
export const BALANCE_EXPORT_FILENAME = 'nexus-balance.json'

/** How long an armed Clear waits for its confirm before disarming (P-01: 3 real seconds). */
export const CLEAR_ARM_TIMEOUT_MS = 3000

/** P-01 armed hint: names the window and the consequence. Placeholder copy pending /ux-design. */
export const CLEAR_ARM_HINT = 'PRESS AGAIN WITHIN 3 S TO ERASE RECORDS'

/** The local data: URL carrying the exported log as JSON. */
export function exportHref(records: MissionRecord[]): string {
  return 'data:application/json;charset=utf-8,' + encodeURIComponent(exportJson(records))
}

/** The slice of an anchor element the download needs. */
export interface DownloadAnchor {
  href: string
  download: string
  click(): void
}

/**
 * Download the log as a local JSON file: a data: URL on a download anchor.
 * `makeAnchor` defaults to a detached `<a>`; tests pass a stand-in.
 */
export function downloadBalanceJson(
  records: MissionRecord[],
  makeAnchor: () => DownloadAnchor = () => document.createElement('a'),
): DownloadAnchor {
  const a = makeAnchor()
  a.href = exportHref(records)
  a.download = BALANCE_EXPORT_FILENAME
  a.click()
  return a
}

/** Result of one Clear press: the next armed state, and whether the log was erased. */
export interface ClearStep {
  armed: boolean
  cleared: boolean
}

/**
 * One activation of the Clear control. Unarmed: arms the confirm and leaves the
 * records alone. Armed: requests the erase and disarms. `cleared` means the
 * erase was requested; a swallowed storage write is not reported (the panel
 * re-reads the log, so surviving records stay visible).
 */
export function pressClear(armed: boolean, storage?: SettingsStorage | null): ClearStep {
  if (!armed) return { armed: true, cleared: false }
  clearRecords(storage)
  return { armed: false, cleared: true }
}
