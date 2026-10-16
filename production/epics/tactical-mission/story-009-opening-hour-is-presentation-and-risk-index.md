# Story 009: Opening hour changes no sight, noise, or risk; risk index formula

> **Epic**: Tactical mission
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/tactical-mission.md`
**Requirement**: `TR-tactical-004`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0007: Opening hour is per-mission, not the look  
**Secondary ADRs**: ADR-0006: Weather is a script, not a roll mid-fight
**ADR Decision Summary**: Opening hour is presentation only, per mission, independent of strategic time and weather; lighting is frozen for the deployment.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript simulation logic in `src/game/`; no post-cutoff three.js or r3f API involved (ADR Engine Compatibility: Post-Cutoff APIs Used — None).

**Control Manifest Rules (this layer)**:
- Required: Opening hour is per-mission and presentation only; the HUD clock still ticks, the sky does not; risk index uses the clearer weather on the script.
- Forbidden: Never a live sky; never derive Opening hour from strategic now.
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [ ] **10.** **GIVEN** two deployments that differ only by Opening hour (dusk vs night) with the same weather script, **WHEN** CorpSec sight, weapon noise, and `risk_index` are computed, **THEN** sight, noise, and risk are unchanged; lighting is frozen from Opening hour (HUD clock still ticks; sky does not). Opening hour is independent of strategic time and of the weather script.
- [ ] **26.** **GIVEN** `risk_index = round(((4p + 5g) × h + 0.5c) × (0.7 + 0.3v))` with `p = 8`, `g = 7`, `c = 22`, `h = 1.2`, `v = 0.9`, **WHEN** `missionRisk` is evaluated, **THEN** index is 89 and band is Severe (≥ 75). Intel < 2 Chance readout vs intel 2+ Risk index is Interface/Brief presentation — Tactical still computes both `missionChance` and `missionRisk` regardless of intel.

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Tactical computes both `missionChance` and `missionRisk` regardless of intel; Chance vs Risk chrome is Interface/Brief.
- Severe band is risk_index ≥ 75.
- Performance: no performance impact expected — missionRisk (src/game/forecast.ts:106) runs at brief and deploy time, outside the sim tick, and the Opening hour changes no per-tick sight or noise value. No per-frame work.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Interface epic: Chance vs Risk index readout.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-008-2026-10-16.md` (2026-10-16).*

#### TM-009 — Opening hour changes no sight, noise, or risk; risk index formula (Logic)
**Test file**: `src/game/forecast.test.ts`, `src/game/world.test.ts`
**What to test**:
- AC 26: `missionRisk` with p=8, g=7, c=22, h=1.2, v=0.9 → 89, band Severe
- AC 10: dusk vs night deployments, same weather script → equal sight, noise and `risk_index`
**Edge cases**: band edges 29/30, 49/50, 74/75; `v` uses the clearer scripted weather, not live weather after a front; index not capped at 100
**Manual**: sky frozen while the HUD clock ticks (screenshot pair)
**Mutation check**: feed live weather into `v` → front edge case fails
**Estimated test count**: ~6

**Manual half:**

#### TM-009 — Opening hour lighting (presentation half of AC 10)
**Verification method**: Manual step-through in the in-app browser at 1280x720
**Who must sign off**: qa-lead
**Evidence to capture**: two screenshots of one mission 30+ s of tactical time apart, saved to `production/qa/evidence/tm-009/`
- [ ] HUD clock differs between the two screenshots
- [ ] Sky colour and light direction are the same in both
- [ ] A dusk mission and a night mission show different lighting at open

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/missionParams.test.ts`, `src/game/world.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 007
- Unlocks: None
