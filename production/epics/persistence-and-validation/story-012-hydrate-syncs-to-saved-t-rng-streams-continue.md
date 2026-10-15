# Story 012: Hydrate syncs to saved t; RNG streams continue

> **Epic**: Persistence and validation
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-15

## Context

**GDD**: `design/gdd/persistence-and-validation.md`
**Requirement**: `TR-persistence-005`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0011: Campaign persistence envelope  
**Secondary ADRs**: ADR-0001: Two clocks, never both; ADR-0018: Catch-up collision order
**ADR Decision Summary**: Three storage envelopes; src/state/save.ts is the only campaign writer; drop-all on a bad blob.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: wall-clock offline hours on reload.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [x] GIVEN recorded strategic `t` and laboratories / Tax-due / Event-due / candidate-due / generated-contract-due at that `t`, WHEN reload + Continue with no Screen tick, THEN `t` is unchanged; no laboratory completes; no Tax, Feed, candidate, or generated-contract fires (no offline hours; identity `sync(t)`).
- [x] GIVEN a campaign whose Feed already differs from a fresh Operation, WHEN reload + Continue and the same strategic wait elapses at the same Clock speed, THEN the next rolled Event matches the recorded continuation, not a New Operation opening sequence.
- [x] GIVEN recorded candidate identities / costs at a known strategic time, WHEN reload + Continue, THEN the market matches that list; the next refresh continues that market, not the opening pool.
- [x] GIVEN a campaign whose generated market already differs from a fresh Operation, WHEN reload + Continue and the same strategic wait elapses at the same Clock speed, THEN the next generated contract matches the recorded continuation, not a New Operation opening sequence.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- After restore, `researchStore.sync(t)` and `campaignStore.sync(t)` run at the saved strategic `t` — an identity sync; no lab completes and no Tax, Feed, candidate, or generated contract fires.
- World Event and candidate / generated-market RNG state serialize into the campaign blob (TR-persistence-007) so the next roll continues the recorded stream.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- None beyond the epic boundary.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-006-2026-10-15.md` (Sprint 6). Type: Logic.*

**Automated**: `src/state/save.test.ts`.
- Reload with no tick: t unchanged, nothing fires
- Next Event matches the recorded continuation
- Candidate market matches; next refresh continues it
- Next generated contract matches the recorded continuation
- Edge: Same Clock speed and wait on both sides of the comparison

**Gap**: Probably test-only.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/save.test.ts`, `src/state/worldStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/save.test.ts` (describe "hydrate syncs to saved t; RNG streams continue")

---

## Dependencies

- Depends on: Story 004
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-15
**Criteria**: 4/4 passing (each covered by an automated test in `src/state/save.test.ts`, describe "hydrate syncs to saved t; RNG streams continue")
**Deviations**: None
**Test Evidence**: Logic: `src/state/save.test.ts` (4 new tests, one per AC; 84/84 in the file pass under vitest, run during /story-done). `src/state/worldStore.test.ts` is listed in Required evidence and exists, but this story did not change it. Decision (autonomous, default): `save.test.ts` alone satisfies the evidence requirement, because every AC is covered there.
**Run result**: N/A — test-only Logic story; no player-visible surface changed.
**Code Review**: Complete, with a caveat. /code-review returned "Verdict: NOT ASSESSED". The lead-programmer and qa-tester specialist reviews could not be spawned (no Agent tool in the unattended run). The manual review found no required changes and would otherwise have been APPROVED WITH SUGGESTIONS. ADR compliance: COMPLIANT (ADR-0011 Hydrate, ADR-0001). Lean-mode prompt answered with "Yes — /code-review passed or was approved with suggestions" (autonomous default).
**Advisory findings from /code-review**:
- Process: the Phase 7 specialist reviews (lead-programmer, qa-tester) did not run. Option [A], re-run /code-review where specialists can be spawned, remains open. It is not decided here.
- The change is test-only. ADR-0011 "### Hydrate" (identity research.sync / campaign.sync at saved t, no offline hours) is asserted directly by test 1: t unchanged, `researchStore.lastSyncT === T`, and `captureSave()` after the reload equals the recorded save. A control tick proves the armed processes were due.
- Suggestion (generated-contract test): also assert `expect(continued.map(contractIdentity)).not.toEqual(opening.map(contractIdentity))`, for symmetry with the Event test. The current `[0]` check is adequate because the initial `contracts` is [] (src/state/worldStore.ts:762).
- Suggestion (test 1): campaignStore identity sync is checked only indirectly, through `restored.campaign` equalling `recorded.campaign`. That is acceptable because campaignStore exposes no sync stamp.
**Gates**: QL-TEST-COVERAGE skipped (Lean mode). Manifest version matches (2026-10-08).
