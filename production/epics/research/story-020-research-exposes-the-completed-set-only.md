# Story 020: Research exposes the completed set only

> **Epic**: Research
> **Status**: Ready
> **Layer**: Core
> **Type**: Integration
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-004`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0009: Partitioned deploy snapshot
**ADR Decision Summary**: Four plain-data slices (World Network, Economy, Research, Roster) are cloned onto DeployParams at create.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Computing Chance, Risk index or Event forecast in Research.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [ ] GIVEN done = [Advanced Propellants, Neural Interface I] as the completed-set export and Neural pinned STOCK, WHEN strategy presentation evaluates Chance, THEN `missionChance` receives researchedCount = 2 from the full completed program, not the worn or unslotted-only count.
- [ ] GIVEN fixed deployment patrol, garrison and civilian counts, enemy toughness and clearer-weather visibility, WHEN done changes from empty to [Advanced Propellants, Neural Interface I], THEN `missionRisk` returns the same Risk index and band.
- [ ] GIVEN Research's public API, WHEN its exports and returned state are enumerated, THEN it exposes no Chance, Risk-index or Event-forecast computation or number.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Oracles: `src/game/missionParams.ts`, `src/game/forecast.ts`, `design/gdd/tactical-mission.md` `risk_index`. Mapping of completed nodes to authored chance is Tactical / Brief's; Research exposes the completed set only.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Brief and Tactical epics own those computations.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test beside the module — `src/game/missionParams.test.ts`, `src/game/research.test.ts`, `src/game/forecast.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 008
- Unlocks: None
