# ADR-0022: Durable-commit (filing) status

## Status
Accepted

## Date
2026-10-08

## Last Verified
2026-10-08

## Decision Makers
Marco Machado (owner); drafted with Claude via `/architecture-decision`

## Summary
`writeSave` returns whether the campaign blob was written, but the autosave timer drops that result and `startNewOperation` swallows a `removeItem` failure, so Interface cannot tell the director whether a Debrief invoice (or a New Operation erase) is durable. A small session-only status store, written only by `save.ts`, holds `filed | unfiled | write-failed` plus a coarse failure reason; a swallowed write never reads `filed`, and the status never enters the campaign blob or the autosave subscription set.

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU |
| **Domain** | Core / Persistence |
| **Knowledge Risk** | HIGH for the pin overall (cutoff May 2025; see `docs/engine-reference/web/VERSION.md`). This domain uses no three.js / r3f / React 19.2 APIs: LOW. The one version-sensitive point is Zustand 5 selector stability (below). |
| **References Consulted** | `docs/engine-reference/web/VERSION.md`; `docs/engine-reference/web/breaking-changes.md`; `docs/engine-reference/web/deprecated-apis.md`; `docs/engine-reference/web/current-best-practices.md`; `docs/registry/architecture.yaml`; `docs/architecture/adr-0011-campaign-persistence-envelope.md`; `docs/architecture/adr-0021-outcome-dto-and-apply-once-key.md`; `src/state/save.ts`; `src/state/settingsStore.ts` (store header style) |
| **Post-Cutoff APIs Used** | None. Plain Zustand `create` / `getState` / `setState` / `subscribe`; `localStorage` `setItem` / `removeItem` and `DOMException.name`. |
| **Verification Required** | (1) Under Zustand 5 a selector that builds a new object each call (`(s) => ({ status: s.status, reason: s.reason })`) loops; `(s) => s` is stable. Interface selects primitives (or uses `useShallow`). (2) `DOMException.name` for a full quota differs by browser (`QuotaExceededError`, Firefox `NS_ERROR_DOM_QUOTA_REACHED`; legacy Safari reports code 22 / 1014); classify by duck-typing `name`, not `instanceof DOMException`, and let `unknown` cover the rest. (3) `localStorage` access itself can throw in a locked-down profile; `browserStorage()` already returns `null`, which this ADR maps to `unavailable`. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0011 (Accepted — writer, swallow, no persist middleware, next-Screen durable commit), ADR-0021 (Accepted — `appStore.lastAppliedKey`, the single `applyDebrief` transaction, session-only counters reset by hydrate and New Operation), ADR-0002 (Accepted — Debrief applies once in memory; mission and Debrief are never durable) |
| **Enables** | Interface/UX work for the Debrief filing indicator and the write-failure indicator (`/ux-design`); TR-persistence-009 stories |
| **Blocks** | None named as epics yet |
| **Ordering Note** | Additive to ADR-0011: it does not change what writes or when. It only makes the outcome of each write observable. It does not change ADR-0021's transaction steps. ADR-0011 is not edited. |

## Context

### Problem Statement
TR-persistence-009 (`persistence-and-validation.md` AC, 2026-09-22): the durable-commit status — unfiled, filed, write-failed — is observable to Interface, and a swallowed write failure never reports filed. ADR-0011 covers the swallow but names no signal (`architecture-review-2026-10-08.md`). In code:

1. `writeSave` (`src/state/save.ts`) returns `true` / `false`, and `scheduleAutosave`'s timer calls it and discards the result. Nothing remembers whether the last write landed.
2. `startNewOperation` wraps `storage.removeItem(SAVE_KEY)` in a `catch` that does nothing. If the erase throws, the in-memory house is reset while the old blob survives, and nothing says so.
3. Debrief applies once in memory and the first durable write is the next Screen autosave. Between the two, the invoice the director just read is not durable. The GDD requires that to be observable without leaving Debrief.

### Constraints
- ADR-0011: `save.ts` is the only campaign-blob writer; storage throws are swallowed and must not throw through Debrief or New Operation; no zustand `persist`; Mission and Debrief never write the campaign blob.
- ADR-0021: `lastAppliedKey` and `deploySerial` are session-only and never in the campaign blob; `applyDebrief` is the single apply transaction.
- Per-frame data stays out of React state. The campaign stores tick at 20Hz, so the status must not change per tick.
- Persistence does not apply fields, price Credits or tick laboratories. It only commits, and reports.
- Copy, layout and the Abort/land chrome are Interface (`/ux-design`). This ADR guarantees what Interface can read, not how it looks.

### Requirements
- Three observable values: `unfiled`, `filed`, `write-failed`.
- After Debrief applies and before the next successful campaign write: `unfiled`.
- After that write succeeds: `filed`. After reload then Continue: not `unfiled`.
- A write that throws, or has no storage, is `write-failed` and never `filed`, including a New Operation erase that throws.
- A reason that Interface can map to copy.

## Decision

A session-only **filing-status store** reports whether the in-memory campaign is durable. `save.ts` is its only writer. Interface reads it with primitive selectors.

### State and transitions

```ts
type FilingStatus = 'filed' | 'unfiled' | 'write-failed'
type WriteFailReason = 'quota' | 'unavailable' | 'unknown'
interface SaveStatusState { status: FilingStatus; reason: WriteFailReason | null }
// invariant: reason !== null  <=>  status === 'write-failed'
```

| Event | From | To |
|-------|------|----|
| `lastAppliedKey` increases (a Debrief apply, win, loss or quiet replay) | `filed` | `unfiled` |
| same | `unfiled` | `unfiled` |
| same | `write-failed` | `write-failed` (sticky: the failure signal is not lost) |
| `writeSave` succeeds | any | `filed` |
| `writeSave` fails (throw, or no storage) | any | `write-failed` + reason |
| `hydrateSave` completes | any | `filed` |
| `startNewOperation`, erase succeeds | any | `filed` |
| `startNewOperation`, `removeItem` throws | any | `write-failed` + reason |

Abort applies nothing, so it never marks `unfiled`. Settings and telemetry writes never touch this status (they are different envelopes; telemetry policy is OQ1 / TR-persistence-008).

### Who writes it
`save.ts` only:
- `writeSave` marks `filed` after `setItem` returns, or `write-failed` in its `catch` or when storage is `null`.
- `startAutosave` adds one subscription on `appStore`: `useAppStore.subscribe((s, prev) => { if (s.lastAppliedKey > prev.lastAppliedKey) markUnfiled() })`. It compares against Zustand's `prevState` argument and must not keep a closure variable: a frozen closure value would sit above the key after hydrate or New Operation reset it to 0, and the next apply (key 1) would never mark `unfiled`. A decrease is ignored. The subscription joins the same unsubscribe list, so StrictMode double-start and teardown stay idempotent.
- `hydrateSave` resets to `filed` as its last step; `startNewOperation` sets `filed` or `write-failed` after the in-memory reset. With `storage === null` the erase cannot happen, so it sets `write-failed` / `unavailable` (optional chaining on `removeItem` would otherwise read as success).

The marker fires synchronously inside the `lastAppliedKey` set of `applyDebrief`, which runs in a layout effect (ADR-0021). The first commit may read the stale status, but the update re-renders before the first painted frame, so no frame shows Debrief without it.

### Failure reasons
Classified at the catch site by `DOMException.name`:
- `quota`: `QuotaExceededError`, `NS_ERROR_DOM_QUOTA_REACHED`.
- `unavailable`: `storage` is `null`, or `SecurityError`.
- `unknown`: anything else, including a throw from `captureSave` / `JSON.stringify`.

Interface may show one generic message for all three. Every reason means not filed.

### Observability rules
- The store changes only on a transition. A successful autosave while already `filed` does not call `setState`.
- The store is **not** subscribed by autosave, and is not in `SaveV9`. A status change must never schedule a write.
- A mutator that would not change `status` or `reason` (`markFiled` while already `filed`, `markWriteFailed` with the same reason) must not call `setState`.
- `filed` means the last write landed, not that memory still equals the blob after later ticks; Interface treats it as meaningful after a Debrief apply and for the write-failure indicator.
- Interface selects primitives: `useSaveStatusStore((s) => s.status)` and `(s) => s.reason`. Do not build a new object in a selector (Zustand 5 loops); use `useShallow` if a pair is needed.
- The store is reset on hydrate; a reload never reports `unfiled` or `write-failed`.

### Architecture Diagram

```
applyDebrief (ADR-0021)
   └─ appStore.lastAppliedKey ↑ ──subscribe──▶ save.ts ──markUnfiled──▶ ┐
                                                                         │
Screen autosave ─▶ writeSave ─ ok ───────────▶ markFiled ───────────────▶│ saveStatusStore
                      └─ throw / no storage ─▶ markWriteFailed(reason) ─▶│   { status, reason }
startNewOperation ─ removeItem ok / throw ───▶ filed / write-failed ────▶│        │
hydrateSave ─────────────────────────────────▶ filed ───────────────────▶┘        │
                                                                 Interface selectors (read-only)
```

### Key Interfaces

```ts
// src/state/saveStatusStore.ts  (CONTRACT FILE; session-only, not in SaveV9, not autosave-subscribed)
export const useSaveStatusStore: UseBoundStore<StoreApi<SaveStatusState & {
  // each mutator is one set({ status, reason }); markFiled/markUnfiled set reason: null
  markUnfiled(): void                       // no-op when status is write-failed
  markFiled(): void
  markWriteFailed(reason: WriteFailReason): void
  reset(): void                             // filed, reason null
}>>
// save.ts
export function classifyWriteFailure(error: unknown): WriteFailReason  // total: never throws for null, non-objects, or errors without `name`
```

### Implementation Guidelines
- Only `save.ts` must call the store's mutators. Interface, owners and `applyDebrief` must never.
- `writeSave` must set the status on every path, including `storage === null`.
- The `lastAppliedKey` subscription must compare against `prevState`, never a closure variable, and must never mark `unfiled` on a decrease.
- `classifyWriteFailure` and the mutators run inside `catch` blocks and must not throw.
- `startNewOperation` must set the status after its in-memory reset, so the reset of `lastAppliedKey` does not mask an erase failure.
- The status must never be added to `captureSave`, and the store must never be added to the `startAutosave` subscription list.
- Production code must not report `filed` from anything except a `setItem` that returned, a completed hydrate, or a successful erase.

## Alternatives Considered

### Alternative 1: Use `writeSave`'s boolean only
- **Description**: Keep the return value; Interface polls it or a caller stores it.
- **Pros**: No new module.
- **Cons**: The autosave timer is the only production caller and nobody holds the result; Interface has nothing reactive to read; New Operation's erase has no value at all.
- **Rejection Reason**: Does not make anything observable.

### Alternative 2: A `saveStatus` field on `appStore`
- **Description**: Put the status beside `phase` and `credits`.
- **Pros**: No new store.
- **Cons**: `appStore` is autosave-subscribed, so every status flip schedules another write; session-only fields in the app store are already growing (ADR-0021 counters).
- **Rejection Reason**: Feedback into the writer it reports on.

### Alternative 3: `applyDebrief` calls `markUnfiled()`
- **Description**: Make the unfiled mark an explicit step of the ADR-0021 transaction.
- **Pros**: Explicit.
- **Cons**: Amends an Accepted transaction list and makes `appStore` import the status module; a future second apply path would have to remember to call it.
- **Rejection Reason**: Watching `lastAppliedKey` in `save.ts` needs no change to ADR-0021 and covers every apply.

### Alternative 4: Read back after `setItem`
- **Description**: `getItem` and compare to confirm the write.
- **Pros**: Catches a silently dropped write.
- **Cons**: Doubles blob I/O on every autosave for a failure mode `localStorage` does not exhibit (it throws).
- **Rejection Reason**: Cost without a known failure it catches. Revisit if a browser is shown to drop writes silently.

### Alternative 5: Amend ADR-0011 in place
- **Description**: Add a status section to the Accepted envelope ADR.
- **Pros**: One document.
- **Cons**: Re-opens an Accepted ADR for an additive concern and invalidates its review lines.
- **Rejection Reason**: A new ADR with its own validation criteria keeps ADR-0011 stable.

## Consequences

### Positive
- Debrief can show an unfiled invoice without leaving Debrief; any screen can show a write failure.
- A swallowed write failure is visible and sticky until a write succeeds.
- No change to what writes or when; no change to ADR-0021's transaction.

### Negative
- One new session-only store and a classifier helper to maintain.
- `unfiled` depends on `lastAppliedKey` increasing (ADR-0021's contract).
- Reason classification depends on browser `DOMException` names, with an `unknown` fallback.

## Risks
- **ADR-0021 changes its guard**: the unfiled mark would silently stop. Mitigation: a test that a Debrief apply marks `unfiled`; ADR-0021 and this ADR are listed in each other's registry references.
- **Closing the tab inside the 500 ms coalescing window** loses the pending write. Accepted by the GDD (reload-on-Debrief restores the last Screen snapshot); not addressed here.
- **Retry**: a failed write retries on the next store change after the coalescing delay; there is no backoff because writes are already coalesced. If nothing changes, nothing retries and the status stays `write-failed`.
- **Whole-object selector** in Interface under Zustand 5. Mitigation: Key Interfaces and the Implementation Guidelines require primitives or `useShallow`.

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| persistence-and-validation.md | TR-persistence-009 Durable-commit status (unfiled / filed / write-failed) is observable to Interface; a swallowed write failure never reports filed | The filing-status store; `writeSave` and the New Operation erase set it on every path |
| persistence-and-validation.md | AC: after Debrief applies and before any Screen, an observable filing-status indicates unfiled | `lastAppliedKey` increase marks `unfiled` before the first Debrief paint |
| persistence-and-validation.md | AC: after the next Screen autosave succeeds, reload then Continue is not still unfiled | `writeSave` success marks `filed`; hydrate resets to `filed` |
| persistence-and-validation.md | AC: a thrown write (autosave or New Operation erase) does not throw, does not read filed, and Continue loads the last durable blob | `catch` marks `write-failed`; ADR-0011's swallow and hydrate behaviour are unchanged |

## Performance Implications
- **CPU**: one `appStore` subscription callback comparing two numbers; `setState` only on a transition.
- **Memory**: one two-field store.
- **Load Time**: none.
- **Network**: none.

## Migration Plan
- Add `src/state/saveStatusStore.ts` (with a test) and give it a `CONTRACT FILE` header. Tests that call `writeSave` with a fake storage mutate the global store: call `reset()` in `beforeEach`.
- `src/state/save.ts`: `writeSave` sets the status on every path; add `classifyWriteFailure`; `startAutosave` adds the `lastAppliedKey` subscription to its unsubscribe list; `hydrateSave` resets; `startNewOperation` records the erase result after the reset.
- Interface (Debrief filing indicator, write-failure indicator): reads the store. Copy and layout come from `/ux-design`, not this ADR.
- `docs/architecture/architecture.md` Data Flow §3: add the status path.
- `docs/registry/architecture.yaml`: register the state, the read interface and the forbidden patterns below.

## Validation Criteria
- Debrief applies (win, loss, quiet replay) → `unfiled`; Abort → unchanged.
- Next Screen autosave succeeds → `filed`; reload then Continue → `filed`.
- Injected `setItem` throw after a Debrief apply → the session does not throw; status is `write-failed` with a reason, never `filed`; reload then Continue restores the pre-apply snapshot.
- Injected `removeItem` throw in New Operation → no throw; status `write-failed` asserted immediately (fake timers). Reload then Continue loads the old campaign only if `setItem` also throws; otherwise the new house's autosave overwrites it within the 500 ms window and the status truthfully becomes `filed`.
- `startNewOperation(null)` → `write-failed` / `unavailable`.
- `storage === null` → `write-failed` / `unavailable`.
- A later successful write after a failure → `filed`; a Debrief apply while `write-failed` stays `write-failed`.
- Hydrate and the `lastAppliedKey` reset to 0 do not mark `unfiled`.
- Ticking the strategic clock while `filed` causes no store updates.

## Related
- [ADR-0011](adr-0011-campaign-persistence-envelope.md) — writer, swallow, durable commit on the next Screen (unchanged)
- [ADR-0021](adr-0021-outcome-dto-and-apply-once-key.md) — `lastAppliedKey`, `applyDebrief` (unchanged)
- [ADR-0002](adr-0002-unsaved-mission.md) — Debrief applies once in memory
- `design/gdd/persistence-and-validation.md` — TR-persistence-009; Interface owns copy and layout
