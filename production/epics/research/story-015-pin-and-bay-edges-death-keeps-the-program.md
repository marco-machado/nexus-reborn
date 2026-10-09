# Story 015: Pin and bay edges; death keeps the program

> **Epic**: Research
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-002`, `TR-research-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0005: Research is a program; bays wear blueprints
**ADR Decision Summary**: Labs fund one program; slotted projects are blueprints worn at most one per augmentation bay.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Unique per-operative implants.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [ ] GIVEN an operative, WHEN bays are listed, THEN they are Neural, Chest, Arms, Legs, with at most 1 completed slotted project per bay.
- [ ] GIVEN Neural Interface I researched and worn by Mara, WHEN Mara is KIA at debrief, THEN Neural Interface I stays researched.
- [ ] GIVEN Neural pinned to Neural Interface I, WHEN Mk II becomes researched, THEN currentIssue(Neural) is Mk II and the pinned bay still wears Neural Interface I.
- [ ] GIVEN Neural Interface I researched and a Neural pin naming an id not in done or in the wrong bay, WHEN worn Neural is resolved, THEN it falls through to Neural Interface I.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Death drops the assignment, not the program. Unpinned bays follow current issue, including new hires. A project is a blueprint — every operative may wear the same one.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Roster epic owns pin UI and hire flow.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/research.test.ts`, `src/state/researchStore.test.ts`. Roster-side coverage beside `src/game/recruits.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 014
- Unlocks: None
