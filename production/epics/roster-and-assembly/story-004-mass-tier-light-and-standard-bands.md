# Story 004: Mass tier: light and standard bands

> **Epic**: Roster and Assembly
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0019: Deploy gate  
**Secondary ADRs**: ADR-0009: Partitioned deploy snapshot
**ADR Decision Summary**: Deploy needs a contract, a squad of at least one, every member READY, and mass ≤ 400 kg; `src/game/mass.ts` owns the kilogram functions.
**ADR Version**: 2026-09-11 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: `MASS_LIMIT_KG` in `world.ts`; Tactical re-checking or relaxing the gate; raw `goto('mission')` as a start API.
- Forbidden: running mission reading live stores; worn ids on the Research slice.
- Guardrail: no per-frame work; no per-frame React state (AGENTS.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [ ] **GIVEN** `squad_mass = 286.1` kg, **WHEN** `mass_tier_delta` is sampled at deploy, **THEN** it is +0.15 m/s applied once to the whole squad. *(GDD AC 70)*
- [ ] **GIVEN** any `squad_mass`, **WHEN** `mass_tier_delta` is sampled, **THEN** the value is exactly one of {+0.15, 0, −0.15} m/s using: ≤ 340 → +0.15; 340 < x ≤ 380 → 0; > 380 → −0.15. *(GDD AC 71)*
- [ ] **GIVEN** `squad_mass = 340` kg, **WHEN** mass tier is sampled at deploy, **THEN** `mass_tier_delta = +0.15` m/s for the whole squad and Deploy is allowed (other gates passing). *(GDD AC 53)*
- [ ] **GIVEN** `squad_mass = 340.1` kg, **WHEN** mass tier is sampled, **THEN** delta is 0 m/s and Deploy is allowed (other gates passing). *(GDD AC 54)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- `massTier` / `tierSpeedDelta` in `mass.ts`: ≤ 340 → +0.15; 340 < x ≤ 380 → 0; > 380 → −0.15. One tier for the whole squad.
- Tier is sampled once at mission create onto the Roster slice (`massKg` + `massTier`, already folded into `speed`) — ADR-0009.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 005: 380/400 boundaries and the over-limit refusal.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/mass.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 003
- Unlocks: Story 005
