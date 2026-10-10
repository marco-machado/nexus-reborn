# Story 007: Lab endT from authorize time and duration

> **Epic**: Research
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0001: Two clocks, never both
**ADR Decision Summary**: Strategic and tactical clocks are independent; a win spends the contract ETA as strategic days, a loss spends none.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Defining seconds-per-ETA-day in this system.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [ ] GIVEN Advanced Propellants authorized at t = 0, WHEN the lab run is read, THEN endT = 7200; GIVEN it is authorized at t = 1000, THEN endT = 8200.
- [ ] GIVEN Hypervelocity Core (4h) authorized at t = 0, THEN endT = 14400.
- [ ] GIVEN each lab idle and all three 14h caps available, WHEN all three are authorized, THEN all three run and each endT = startedT + 50400.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- `endT = startedT + duration × 3600` strategic seconds; durations come from the catalog.
- Strategic seconds per ETA day are not authored in Research; do not define one in tests.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 008: completion on sync.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/research.test.ts`, `src/state/researchStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 002
- Unlocks: Story 008
