// Research remaining readout (P-22, research.md UI Requirements). Pure paint
// decision: the screen shows remaining only after sync(t) for that same t, as
// whole display seconds rounded up, so a positive remainder never paints 0.
// The ceil is a display rule, not a formula clamp: the oracle is
// `remaining()` in src/game/research.ts.
import { remaining } from '../game/research'
import { pad2 } from './util'

/**
 * Whole seconds the Research screen paints for `run` at world time `t`, or
 * `null` when no remaining label may exist: before `sync(t)` for this `t`
 * (`lastSyncT !== t`, including unset), no active run, or `t >= endT`.
 */
export function paintedRemaining(
  run: { readonly endT: number } | null | undefined,
  t: number,
  lastSyncT: number | null,
): number | null {
  if (lastSyncT === null || lastSyncT !== t) return null
  const r = remaining(run, t)
  return r === null ? null : Math.ceil(r)
}

/**
 * H:MM:SS for a painted remaining in whole seconds; 50,400 s reads 14:00:00
 * and 1 s reads 0:00:01. Format pending the Research screen spec (P-22).
 */
export function remainingHms(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h + ':' + pad2(m) + ':' + pad2(sec % 60)
}
