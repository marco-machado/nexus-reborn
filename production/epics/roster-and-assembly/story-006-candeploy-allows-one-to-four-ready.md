# Story 006: canDeploy allows one to four Ready operatives

> **Epic**: Roster and Assembly
> **Status**: Complete
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-12

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0019: Deploy gate  
**ADR Decision Summary**: Deploy needs a contract, a squad of at least one, every member READY, and mass ≤ 400 kg; `src/game/mass.ts` owns the kilogram functions.
**ADR Version**: 2026-09-11 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: `MASS_LIMIT_KG` in `world.ts`; Tactical re-checking or relaxing the gate; raw `goto('mission')` as a start API.
- Guardrail: no per-frame work; no per-frame React state (CLAUDE.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [x] **GIVEN** a selected contract, `squad_mass ≤ 400` kg, and exactly 1 assigned Ready operative (other Squad bays empty), **WHEN** Deploy is requested, **THEN** Deploy is allowed. *(GDD AC 1)*
- [x] **GIVEN** a selected contract, `squad_mass ≤ 400` kg, and exactly 2 assigned Ready operatives, **WHEN** Deploy is requested, **THEN** Deploy is allowed. *(GDD AC 2)*
- [x] **GIVEN** a selected contract, `squad_mass ≤ 400` kg, and exactly 3 assigned Ready operatives, **WHEN** Deploy is requested, **THEN** Deploy is allowed. *(GDD AC 3)*
- [x] **GIVEN** a selected contract, `squad_mass ≤ 400` kg, and exactly 4 assigned Ready operatives, **WHEN** Deploy is requested, **THEN** Deploy is allowed. *(GDD AC 4)*
- [x] **GIVEN** a selected contract and 1–4 assigned operatives where `canDeploy` is not ok (any assigned operative not Ready, or `squad_mass > 400` kg), **WHEN** `appStore.startMission()` is called, **THEN** `appStore.phase` stays `team` and no mission is created (world, research and loadout snapshots unchanged). *(ADR-0019; Implementation Notes)*
- [x] **GIVEN** zero assigned operatives (all four Squad bays empty), **WHEN** Deploy is requested, **THEN** Deploy is refused. *(TR-roster-001: "requires 1–4")*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Extract a pure `canDeploy` (or `deployGate`) in `src/game` — never `src/scene`, never a `getState()` helper reading three stores.
- Add `appStore.startMission()` that no-ops unless `canDeploy` is ok; Team Deploy calls it instead of raw `goto('mission')`.
- Empty bays do not block.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 007: refusals.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — src/game/mass.test.ts (or a sibling `src/game/deployGate.test.ts` beside the new module), `src/state/appStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/deployGate.test.ts` (canDeploy, assignedMassKg), `src/state/appStore.test.ts` (`startMission (ADR-0019)`), passing

---

## Dependencies

- Depends on: Story 003
- Unlocks: Story 007, Story 008

---

## Completion Notes
**Completed**: 2026-10-12
**Criteria**: 6/6 passing (AC 1-4 plus the refused-start no-op and zero-operative refusal)
**Deviations**: None. `canDeploy` follows the ADR-0019 Key Interfaces (`none-assigned`, `overKg`, `reason: null`).
**Test Evidence**: Logic: `src/game/deployGate.test.ts`, `src/state/appStore.test.ts` (688 tests passing). Deploy button observed in a headless browser: `production/qa/evidence/ra-006/` (enabled, empty squad, over mass). The Deploy click itself was not exercised in the browser; `startMission` is covered by unit tests.
**Code Review**: Complete — /code-review returned CHANGES REQUIRED; both required changes and the low-cost suggestions were applied, not re-reviewed.
**Notes**: Team screen and `startMission` share `assignedMassKg` and `canDeploy`. The Deploy label's `>>` is clipped at the button edge in the captures (existing styling, untouched). Story 007 builds refusal text on `gate.reason`.
