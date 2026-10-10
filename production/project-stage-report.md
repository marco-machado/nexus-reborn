# Project Stage Analysis Report

**Generated**: 2026-10-07
**Stage**: Technical Setup (configured) — artifacts indicate Production by source count, but no production management exists
**Stage Confidence**: CONCERNS — configured and observed stages disagree; the vertical slice ended in PIVOT with no next validation question
**Analysis Scope**: Full project
**Workflow tier**: `standard` (`modes.rigor` in `project.yaml`)

---

## Executive Summary

Nexus Reborn has a complete design and architecture record and a large working codebase. All 8 MVP systems are Approved, there are 20 ADRs plus an architecture overview, control manifest and traceability, and `src/` holds 114 files (~32.9k lines). On source count alone the project reads as Production. Nothing on the production-management side exists: no epics, no stories, no sprint plans. The first vertical slice (2026-10-06, a playtest of `src/`) returned **PIVOT**, and the last Technical Setup → Pre-Production gate check (2026-10-06) returned **CONCERNS**.

Work will be tracked in `production/sprints/` (decided 2026-10-07), so the missing sprint plan is a required gap at this tier, not an alternate-tracking question.

**Current Focus**: UX specs (HUD, Main Menu, interaction patterns approved in recent commits) and post-slice direction.
**Blocking Issues**: Post-pivot direction undefined; no epics/stories/sprint plan.
**Estimated Time to Next Stage**: Depends on the pivot decision. Pre-Production needs a passing gate check, epics, stories and a first sprint plan.

---

## Completeness Overview

### Design Documentation
- **Status**: ~100% for MVP scope
- **Files Found**: 15 entries in `design/gdd/` (8 system GDDs, `game-concept.md`, `game-pillars.md`, `systems-index.md`, 3 cross-reviews, `reviews/`); `design/art/art-bible.md`; 3 UX specs in `design/ux/`; `design/accessibility-requirements.md`
  - Narrative docs: none (`design/narrative/` absent)
  - Level designs: none (`design/levels/` absent; city is procedural from `mission.seed`)
- **Key Gaps**:
  - [ ] `systems-index.md` header still reads `Status: Draft` although all 8 systems are Approved — cosmetic
  - Absent narrative/level docs are not gaps at `standard`: the city is procedural and no narrative system is in the index

### Source Code
- **Status**: Shipping cut exists (verified by the vertical-slice playtest, not by this scan)
- **Files Found**: 114 `.ts`/`.tsx`/`.css` files in `src/`, ~32.9k lines of TS/TSX
- **Major Systems Identified**:
  - ✅ Simulation and static data (`src/game/`, 45 files) — mission sim, pathfinding, atlas, deploy mass, abilities
  - ✅ Scene (`src/scene/`, 19 files) — r3f / three.js WebGPU; `Units.tsx` modified and `unitModel.ts` untracked in the working tree
  - ✅ State (`src/state/`, 18 files) — Zustand stores, versioned campaign save
  - ✅ UI (`src/ui/`, 26 files) — DOM screens and mission HUD
  - ✅ City generation (`src/world/`, 2 files) — deterministic citygen
- **Key Gaps**: none against the systems index; code-to-GDD traceability lives in `docs/architecture/requirements-traceability.md` (untracked)

### Architecture Documentation
- **Status**: ~100%
- **ADRs Found**: 20 (`adr-0001` – `adr-0020`) in `docs/architecture/`
- **Coverage**:
  - ✅ Clocks, persistence envelope, store placement, renderer/frame loop, tactical sim contract, input/audio mixer, deploy gate, catch-up order — documented
  - ✅ `architecture.md`, `control-manifest.md`, `traceability-index.md`, `tr-registry.yaml`, 3 architecture reviews (2026-09-09/10/11)
- **Key Gaps**:
  - [ ] Several ADRs and `architecture.md` carry uncommitted edits — the record exists only in the working tree

### Production Management
- **Status**: 0%
- **Found**:
  - Sprint plans: 0 (`production/sprints/` absent)
  - Epics / stories: 0 (`production/epics/` absent)
  - Milestones: 0 (`production/milestones/` absent)
  - Roadmap: `production/pre-production-sequence.md` (untracked) — not a sprint plan
  - Gate checks: 5 (systems-design 2026-09-22; technical-setup 2026-09-28, 09-30, 10-05, 10-06 — latest CONCERNS)
- **Key Gaps**:
  - [ ] No epics or stories — `/create-epics` then `/create-stories` must precede a sprint plan
  - [ ] No sprint plan in `production/sprints/` — required at `standard`, and the chosen tracking location

### Testing
- **Status**: Coverage not measured
- **Test Files**: 38 — 35 co-located in `src/` (`src/game` 21, `src/state` 9, `src/scene` 2, `src/ui` 2, `src/world` 1) and 3 in `tests/` (`unit/mass.test.ts`, `integration/weapon-mass.test.ts`, `README.md`)
- **Coverage by System**: weighted toward sim and state, as `CLAUDE.md` requires; scene/UI are thin by design (covered by click-through)
- **Key Gaps**:
  - [ ] `tests/` is untracked and duplicates the co-located convention in `CLAUDE.md` — decide whether it stays

### Prototypes
- **Active Prototypes**: 1 in `prototypes/`
  - ✅ `nexus-reborn-vertical-slice/` — documented with `REPORT.md` and `PIVOT-NOTE.md`; indexed in `prototypes/index.md`. The session hook's "no README" warning is a false positive.
- **Archived**: 0
- **Key Gaps**:
  - [ ] PIVOT carry-forward is empty: failure category not classified, next validation question not defined

---

## Stage Classification Rationale

**Why CONCERNS between Technical Setup and Production?**

The configured stage is Technical Setup. The heuristic table classifies by code-root size, and 114 source files puts the project in Production. But Production also implies active, planned development, and there are no epics, stories or sprints. The code predates the pipeline: `production/migration-report.md` shows the framework was adopted onto an existing game. The honest reading is that the project is a brownfield adoption whose process artifacts are catching up with its code, and it has not passed the Technical Setup → Pre-Production gate.

**Indicators for Technical Setup (configured)**:
- Latest gate check Technical Setup → Pre-Production: CONCERNS (2026-10-06)
- All technical-setup steps PRESENT in `artifact-check.sh` (architecture, ≥3 ADRs, review, control manifest, accessibility, interaction patterns, test setup)

**Indicators for Production (observed)**:
- 114 source files, ~32.9k lines, 38 test files

**Next stage requirements (Pre-Production)**:
- [ ] Resolve the vertical-slice PIVOT: classify the failure and define the next validation question
- [ ] Pass `/gate-check` Technical Setup → Pre-Production
- [ ] `/create-epics` and `/create-stories`
- [ ] First sprint plan in `production/sprints/`

---

## Gaps Identified (with Clarifying Questions)

### Critical Gaps (block progress)

1. **Vertical slice PIVOT without direction**
   - **Impact**: The slice's playtest findings (World Network load: "did not know where to start"; visuals still prototype; contracts not ready) are not turned into a next question, so neither epics nor a re-run slice have a target.
   - **Question**: Is the pivot about onboarding/World Network entry, presentation quality, or contract content — and which is the next validation question?
   - **Suggested Action**: Classify the failure in `PIVOT-NOTE.md`, then re-scope `/vertical-slice`.

2. **No epics, stories or sprint plan**
   - **Impact**: `production/sprints/` is the chosen tracking location and is empty; required at `standard`.
   - **Question**: Should the first sprint target the pivot findings, or the remaining UX-spec implementation?
   - **Suggested Action**: `/create-epics` → `/create-stories [epic]` → `/sprint-plan`.

### Important Gaps (affect quality/velocity)

3. **Configured stage and engine config drift**
   - **Impact**: `project.yaml` `engine.name` fails schema validation (expects Godot|Unity|Unreal); stage reads Technical Setup while the code is past it.
   - **Question**: Should `project.yaml` be corrected now, or after `production/migration-report.md` is finalized?
   - **Suggested Action**: Resolve via `/settings` or the migration `--finalize` step; let `/gate-check` own the stage value.

4. **Uncommitted design and architecture record**
   - **Impact**: ~30 modified files and many untracked paths (`.claude/`, `.github/`, `tests/`, `prototypes/`, `project.yaml`, gate checks, `requirements-traceability.md`) exist only locally.
   - **Question**: Which of these should be committed, and in what grouping?
   - **Suggested Action**: Commit in logical groups when requested.

### Nice-to-Have Gaps (polish/best practices)

5. **Stale session state** — `production/session-state/active.md` is a 2026-10-06 vertical-slice checkpoint in legacy format. Recreate from `.claude/docs/templates/session-state.md`.
6. **`systems-index.md` header status** — update `Status: Draft` to reflect 8/8 Approved.
7. **`tests/` vs co-located tests** — decide whether the top-level `tests/` tree stays alongside the `CLAUDE.md` convention.

---

## Recommended Next Steps

### Immediate Priority (Do First)
1. **Resolve the PIVOT** — every later step targets it.
   - Suggested skill: manual edit of `PIVOT-NOTE.md`, then `/vertical-slice`
   - Estimated effort: S (decision) / M (re-run)
2. **Create epics and stories** — prerequisite to sprint planning.
   - Suggested skill: `/create-epics`, `/create-stories [epic-slug]`
   - Estimated effort: M

### Short-Term (This Sprint/Week)
3. **First sprint plan in `production/sprints/`** — `/sprint-plan`
4. **Fix `project.yaml` engine name and finalize the migration** — clears the schema error on every session start
5. **Commit the working tree in logical groups** — when requested

### Medium-Term (Next Milestone)
6. **Re-run `/gate-check` Technical Setup → Pre-Production** — after items 1–3
7. **Define a first milestone** in `production/milestones/` for `/milestone-review`

---

## Follow-Up Skills to Run

- `/vertical-slice` — re-scoped run after the pivot is classified
- `/create-epics` → `/create-stories` — production management is empty
- `/sprint-plan` — tracking lives in `production/sprints/`
- `/gate-check` — Technical Setup → Pre-Production, once the above land
- `/settings` — correct `engine.name` in `project.yaml`

---

## Appendix: File Counts by Directory

```
design/
  gdd/           15 entries (8 system GDDs + concept, pillars, index, 3 cross-reviews, reviews/)
  ux/            3 specs (hud, main-menu, interaction-patterns)
  art/           1 (art-bible)
  narrative/     absent
  levels/        absent

src/             114 files, ~32.9k lines TS/TSX
  game/          45 files
  scene/         19 files
  state/         18 files
  ui/            26 files
  world/         2 files

docs/
  architecture/  20 ADRs + architecture.md, control-manifest, traceability, 3 reviews

production/
  sprints/       absent (0 plans)
  epics/         absent
  milestones/    absent
  gate-checks/   5

tests/           2 test files (+ 35 co-located in src/)
prototypes/      1 directory (vertical slice — PIVOT)
```

---

**End of Report**

*Generated by `/project-stage-detect` skill*
