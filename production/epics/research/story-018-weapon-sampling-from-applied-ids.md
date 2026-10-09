# Story 018: Weapon sampling from applied ids

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
- Forbidden: Pasting weapon-table values into tests.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [ ] GIVEN appliedNodeIds = [Advanced Propellants, Tungsten Sabot], WHEN squadWeapon(assault) is sampled, THEN damage = assault weapon-table base × 1.12 × 1.15. Read the base from the weapon-table owner at sample time; do not paste it.
- [ ] GIVEN Caseless Ammo Feed is the only applied magazine effect, WHEN squadWeapon(smg) is sampled, THEN magazine = round(smg weapon-table magazine + 10). Do not paste the table base or the sum.
- [ ] GIVEN appliedNodeIds empty, WHEN weapons are sampled, THEN each weapon field equals that weapon's table base, read from the weapon-table owner.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Read table bases from the owner module in the test; assert the multiplier relationship, not pasted constants.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 019: crewBonus.

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
