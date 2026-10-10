# Story 012: Hydrate syncs to saved t; RNG streams continue

> **Epic**: Persistence and validation
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

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
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [ ] GIVEN recorded strategic `t` and laboratories / Tax-due / Event-due / candidate-due / generated-contract-due at that `t`, WHEN reload + Continue with no Screen tick, THEN `t` is unchanged; no laboratory completes; no Tax, Feed, candidate, or generated-contract fires (no offline hours; identity `sync(t)`).
- [ ] GIVEN a campaign whose Feed already differs from a fresh Operation, WHEN reload + Continue and the same strategic wait elapses at the same Clock speed, THEN the next rolled Event matches the recorded continuation, not a New Operation opening sequence.
- [ ] GIVEN recorded candidate identities / costs at a known strategic time, WHEN reload + Continue, THEN the market matches that list; the next refresh continues that market, not the opening pool.
- [ ] GIVEN a campaign whose generated market already differs from a fresh Operation, WHEN reload + Continue and the same strategic wait elapses at the same Clock speed, THEN the next generated contract matches the recorded continuation, not a New Operation opening sequence.

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

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/save.test.ts`, `src/state/worldStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 004
- Unlocks: None
