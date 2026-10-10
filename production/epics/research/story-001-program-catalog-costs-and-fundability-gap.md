# Story 001: Program catalog, costs and fundability gap

> **Epic**: Research
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0005: Research is a program; bays wear blueprints
**ADR Decision Summary**: Labs fund one program; slotted projects are blueprints worn at most one per augmentation bay.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Unique implants or an equipment locker.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [ ] GIVEN a new campaign, WHEN the Research program is listed, THEN there are 3 laboratories, 7 projects each, 21 total.
- [ ] GIVEN the cost rows in GDD §7, WHEN branch and program costs are summed, THEN 248,000 / 261,000 / 270,000 / 779,000 CR.
- [ ] GIVEN the §7 cost rows and the §6 Credits rows (opening 128,450 CR, one clean authored pass 203,000 CR), WHEN the program gap is computed, THEN it is 447,550 CR; and GIVEN minimum-reward generated offers (30,500 CR each), WHEN 15 such wins are applied, THEN they fund the gap (15 × 30,500 = 457,500 ≥ 447,550). This pins the predicate only; pacing ownership stays Economy / World Network.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Three laboratories — Ballistics, Cybernetics, Control Systems — seven projects each. Ballistics is unslotted and squad-wide; Cybernetics and Control Systems are slotted blueprints.
- Read the reward formula from its oracle (living spec §9 / `contracts.ts`); do not paste the table.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 004: prerequisite states.

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

- Depends on: None
- Unlocks: Story 002, Story 004
