# Story 010: Contradictory campaign flags drop the blob

> **Epic**: Persistence and validation
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-15

## Context

**GDD**: `design/gdd/persistence-and-validation.md`
**Requirement**: `TR-persistence-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0011: Campaign persistence envelope  
**Secondary ADRs**: ADR-0020: Campaign fail flags
**ADR Decision Summary**: Three storage envelopes; src/state/save.ts is the only campaign writer; drop-all on a bad blob.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: replacing the two booleans with a `CampaignStatus` enum.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [x] GIVEN a campaign blob with both complete and failed flags true, WHEN the origin reloads, THEN Continue is absent and Menu state is invalid/unreadable, distinct from never-started.
- [x] GIVEN a campaign blob with `campaignFailed` false and `campaignWon` true but fewer than three authored ids in `contractsWon`, WHEN the origin reloads to Menu, THEN Continue is absent and Menu state is invalid/unreadable, distinct from never-started.
- [x] GIVEN a campaign blob with `campaignFailed` false, `campaignWon` false, and all three authored ids in `contractsWon`, WHEN the origin reloads to Menu, THEN Continue is absent and Menu state is invalid/unreadable, distinct from never-started.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- `save.ts` drop-alls if `campaignFailed && campaignWon`; a non-failed blob's `campaignWon` must match the three-authored `contractsWon` record.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 011: combinations that must still load.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-006-2026-10-15.md` (Sprint 6). Type: Logic.*

**Automated**: `src/state/save.test.ts`.
- Both flags true: dropped, invalid state
- `campaignWon` true with <3 authored wins: dropped
- Not won with all 3 authored wins: dropped

**Gap**: Probably test-only; the Menu-state half depends on PV-008.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/save.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/save.test.ts` (3 PV-010 tests in "contradictory campaign flags drop the blob"; full suite 1068/1068 pass, 2026-10-15)

---

## Dependencies

- Depends on: Story 008
- Unlocks: Story 011

---

## Completion Notes
**Completed**: 2026-10-15
**Criteria**: 3/3 passing (all covered by automated tests in `src/state/save.test.ts`, describe "contradictory campaign flags drop the blob"; save.test.ts 54/54 pass, re-run by /story-done 2026-10-15; full suite 1068/1068 per /code-review)
**Deviations**: None. `src/state/save.ts:509-510` matches GDD Rule 8 and ADR-0020 "cannot be both"; no `CampaignStatus` enum added. Scope: test-only change; `src/state/save.ts` unchanged.
**Test Evidence**: Logic: test file at `src/state/save.test.ts`
**Run result**: N/A — save-validation logic with no new visible surface; the Menu-state half is asserted through `loadCampaignAtBoot` / `menuSaveStatus`.
**Code Review**: Run, verdict NOT ASSESSED (process gap only). /code-review could not spawn lead-programmer or qa-tester (no Agent tool in the workflow subagent); every check it ran itself was clean, with no required changes, and would otherwise be APPROVED WITH SUGGESTIONS. ADR-0011 and ADR-0020: COMPLIANT. Lean mode: answered "Yes — /code-review ran" with this result (autonomous workflow; recorded as-is, not as a pass).
**QA coverage gate**: QL-TEST-COVERAGE skipped — Lean mode.

**Advisory findings from /code-review** (not fixed in this story):
- Process gap: Phase 7 specialist and QA review did not run. To clear it, re-run /code-review from a session that can spawn agents, or accept the gap explicitly.
- `src/state/save.test.ts` (`expectDroppedToInvalidMenu`): `expect(menu === 'valid').toBe(false)` repeats `expect(menu).toBe('invalid')`. The trailing `loadCampaignAtBoot(new MemoryStorage())` resets the module flag `droppedAtBoot` after the real assertions; it works but is fragile if a later assertion is added after it.
- `src/state/save.test.ts` (both-flags test): it covers both flags true only with all three authored wins. Looping over `[[], ['m01'], ['m01','m02','m03']]` would prove the both-flags rule (`save.ts:509`) independently of the win-count rule (`save.ts:510`).
- `production/sprint-status.yaml`: PV-010 `estimate_days: 0.1` vs story Estimate 0.5 d (pre-existing mismatch).

**Autonomous decisions**: Phase 7 close option "Close the story (Recommended)" taken by default (verdict COMPLETE WITH NOTES).
