# Story 019: crewBonus from applied ids

> **Epic**: Research
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: —
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
- Forbidden: Adding Experience into the research crew bonus.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [ ] GIVEN appliedNodeIds empty, WHEN crewBonus is computed, THEN (0, 0).
- [ ] GIVEN appliedNodeIds = [Pain Inhibitor], THEN maxHp 14, speed 0; GIVEN [Synaptic Enhancement, Neural Cache Array], THEN maxHp 18, speed 0.55.
- [ ] GIVEN Experience bonuses on a survivor, WHEN crewBonus is computed from appliedNodeIds, THEN Experience +2 HP / +0.05 m/s are not included.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- `createWorld` copies `roster.maxHp` / `roster.speed`; it does not re-run `crewBonus`, `xpBonus` or `tierSpeedDelta`.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Roster epic owns Experience.

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

- Depends on: Story 014
- Unlocks: None
