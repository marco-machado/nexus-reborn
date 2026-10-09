# Story 008: Weather retunes CorpSec sight and weapon noise only

> **Epic**: Tactical mission
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/tactical-mission.md`
**Requirement**: `TR-tactical-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0006: Weather is a script, not a roll mid-fight  
**Secondary ADRs**: ADR-0016: Tactical sim contract
**ADR Decision Summary**: Weather is fixed at mission create: at most one adjacent-intensity change at a set tactical time; rain only shortens CorpSec sight and quiets weapons.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript simulation logic in `src/game/`; no post-cutoff three.js or r3f API involved (ADR Engine Compatibility: Post-Cutoff APIs Used — None).

**Control Manifest Rules (this layer)**:
- Required: Rain only shortens CorpSec sight and quiets weapons; a mission may change weather once, to an adjacent intensity, at a tactical time fixed at create.
- Forbidden: Never play-driven weather; never an unscripted mid-mission weather roll.
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [ ] **9a.** **GIVEN** Standard difficulty and live weather none vs light vs heavy, **WHEN** CorpSec cone range is read, **THEN** it is 14 / 12.6 / 11.2 m respectively.
- [ ] **9b.** **GIVEN** the same Standard deployments, **WHEN** accuracy, movement, and omni notice are read, **THEN** accuracy and movement equal the clear-weather values and omni notice is 4.5 m.
- [ ] **9c.** **GIVEN** a scripted front at its fixed tactical time, **WHEN** the front hits, **THEN** live sight retunes, weapon-noise radius strictly decreases as rain intensity increases (do not paste `noiseMul`), a comm-log line is written, and accuracy / movement / 4.5 m notice do not change.

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Accuracy, movement, and the 4.5 m omni notice do not change with weather.
- Assert that noise radius strictly decreases with rain intensity; do not paste `noiseMul` (code-owned, GDD OQ7).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 015: Hardened +1 m vision.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/world.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 007
- Unlocks: None
