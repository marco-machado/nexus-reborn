# Story 004: Continue restores the last Screen snapshot

> **Epic**: Persistence and validation
> **Status**: Ready
> **Layer**: Core
> **Type**: Integration
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/persistence-and-validation.md`
**Requirement**: `TR-persistence-005`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0011: Campaign persistence envelope  
**Secondary ADRs**: ADR-0020: Campaign fail flags
**ADR Decision Summary**: Three storage envelopes; src/state/save.ts is the only campaign writer; drop-all on a bad blob.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: `zustand persist` middleware on `worldStore` / `campaignStore`.
- Forbidden: re-deriving campaign failed from `operatives.length === 0` on hydrate.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [ ] GIVEN a lived-in campaign on a Screen, WHEN reload then Continue, THEN World Network, laboratories, roster, tutorial-seen, and campaign result match the last Screen visit (not the opening Operation).
- [ ] GIVEN recorded post-Screen Credits, Influence, Intel, strategic clock, Clock speed, Pause, sector Control / Unrest / ownership, open generated contracts, research done + active labs, roster, candidates, squad assignment, selected contract C, WHEN reload + Continue, THEN each recorded value matches including C; Focus / Review-time / mission / Debrief are not restored.
- [ ] GIVEN an authored contract already won, WHEN reload + Continue, THEN the persisted win flag is still present. Award amounts are Economy / World Network.
- [ ] GIVEN campaign not complete, roster emptied by KIA, World Network shows campaign failed and contracts locked, WHEN reload + Continue, THEN still failed (not complete), roster empty, contracts still locked.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- `captureSave` carries World Network (strategic `t`, Clock speed, Pause, sector Control / Unrest / ownership), Credits, Influence, Intel, open generated contracts, labs (done + active), roster, candidates, squad assignment, selected contract, `contractsWon`, tutorial-seen, and the campaign flags.
- Focus, Review-time, mission, and Debrief outcome are not restored. Hydrate restores stored flags verbatim (ADR-0020).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 012: RNG streams and no offline hours.
- Story 010/011: flag validation.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/state/save.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001
- Unlocks: Story 005, Story 007, Story 011, Story 012
