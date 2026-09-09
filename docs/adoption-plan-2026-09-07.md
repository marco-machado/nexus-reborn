# Adoption Plan

> **Generated**: 2026-09-07
> **Project phase**: Systems Design
> **Engine**: Configured in `docs/technical-preferences.md` (React 19.2.8 + Vite 6.4.3 + r3f 9.6.1 / three.js 0.185.1 WebGPU, TypeScript)
> **Template version**: v1.0+

Work through these steps in order. Check off each item as you complete it.
Re-run `/adopt` anytime to check remaining gaps.

Do not rewrite `docs/game-design.md`, `CONTEXT.md`, or the existing ADR prose.
Fill template-path gaps only. `docs/game-design.md` remains the living specification.

---

## Step 1: Fix Blocking Gaps

### 1.1 Missing systems index

Template skills (`/design-system`, `/create-stories`, `/gate-check`, `/architecture-review`) require `design/gdd/systems-index.md`. It does not exist.

Seed it from the systems table already in `docs/game-design.md` §22. Status cells must be exact tokens only: `Not Started`, `In Progress`, `In Review`, `Designed`, `Approved`, `Needs Revision` — no parentheticals.

**Fix**: `/map-systems` (use the living GDD as input; do not invent new systems).
**Time**: 30 min
- [ ] `design/gdd/systems-index.md` created with System, Layer, Priority, Status columns and valid status tokens

### 1.2 Engine not configured while ADRs exist

Done. Live file is `docs/technical-preferences.md` (Engine, Language, Rendering, Physics filled). Do not write `gameworksreferences/` — that path was a concatenated skill shorthand, not a real file.

**Fix**: `/setup-engine` — configure Web (React 19 + Vite + R3F / three.js WebGPU), TypeScript, keyboard/mouse, no physics engine.
**Time**: 30 min
- [x] `docs/technical-preferences.md` exists with Engine, Language, Rendering, Physics filled (not `[TO BE CONFIGURED]`)

### 1.3 Relocate ADRs, then add `## Status` to each

`/story-readiness` looks for `docs/architecture/adr-*.md` and a `## Status` section. All eight records live at `docs/adr/NNNN-slug.md` with no Status. Copy them (do not rewrite the decision text), then retrofit Status. Leave the originals in `docs/adr/` so `CONTEXT.md` / README links keep working, or retarget those links in a later pass.

Valid Status values for the new section: Accepted (these decisions are already in force).

**Time**: 5 min copy + 5 min per ADR

#### 1.3a `0001-two-clocks.md`

**Problem**: Missing `## Status`, so ADR checks silently pass.
**Fix**: Copy to `docs/architecture/adr-0001-two-clocks.md`, then `/architecture-decision retrofit docs/architecture/adr-0001-two-clocks.md`
- [ ] `## Status` present on `docs/architecture/adr-0001-two-clocks.md`

#### 1.3b `0002-unsaved-mission.md`

**Problem**: Missing `## Status`.
**Fix**: `/architecture-decision retrofit docs/architecture/adr-0002-unsaved-mission.md`
- [ ] `## Status` present on `docs/architecture/adr-0002-unsaved-mission.md`

#### 1.3c `0003-one-contract-kind.md`

**Problem**: Missing `## Status`.
**Fix**: `/architecture-decision retrofit docs/architecture/adr-0003-one-contract-kind.md`
- [ ] `## Status` present on `docs/architecture/adr-0003-one-contract-kind.md`

#### 1.3d `0004-quiet-replay.md`

**Problem**: Missing `## Status`.
**Fix**: `/architecture-decision retrofit docs/architecture/adr-0004-quiet-replay.md`
- [ ] `## Status` present on `docs/architecture/adr-0004-quiet-replay.md`

#### 1.3e `0005-blueprint-assignment.md`

**Problem**: Missing `## Status`.
**Fix**: `/architecture-decision retrofit docs/architecture/adr-0005-blueprint-assignment.md`
- [ ] `## Status` present on `docs/architecture/adr-0005-blueprint-assignment.md`

#### 1.3f `0006-weather-script.md`

**Problem**: Missing `## Status`.
**Fix**: `/architecture-decision retrofit docs/architecture/adr-0006-weather-script.md`
- [ ] `## Status` present on `docs/architecture/adr-0006-weather-script.md`

#### 1.3g `0007-opening-hour.md`

**Problem**: Missing `## Status`.
**Fix**: `/architecture-decision retrofit docs/architecture/adr-0007-opening-hour.md`
- [ ] `## Status` present on `docs/architecture/adr-0007-opening-hour.md`

#### 1.3h `0008-influence-is-a-wallet.md`

**Problem**: Missing `## Status`.
**Fix**: `/architecture-decision retrofit docs/architecture/adr-0008-influence-is-a-wallet.md`
- [ ] `## Status` present on `docs/architecture/adr-0008-influence-is-a-wallet.md`

---

## Step 2: Fix High-Priority Gaps

### 2.1 ADRs missing `## ADR Dependencies`

Without this section, `/architecture-review` cannot order decisions. Several ADRs already cross-link in prose (0001↔0007, 0003↔0004).

**Fix**: `/architecture-decision retrofit` on each file in 1.3; add `## ADR Dependencies` without changing the decision body.
**Time**: 5 min each
- [ ] `adr-0001-two-clocks.md`
- [ ] `adr-0002-unsaved-mission.md`
- [ ] `adr-0003-one-contract-kind.md`
- [ ] `adr-0004-quiet-replay.md`
- [ ] `adr-0005-blueprint-assignment.md`
- [ ] `adr-0006-weather-script.md`
- [ ] `adr-0007-opening-hour.md`
- [ ] `adr-0008-influence-is-a-wallet.md`

### 2.2 ADRs missing `## Engine Compatibility`

Post-cutoff API risk is unknown to ADR skills. This project is browser three.js / WebGPU, not Godot/Unity/Unreal.

**Fix**: same retrofit pass as 2.1; record engine/API constraints (WebGPURenderer with WebGL2 fallback, no engine upgrade cutoff beyond locked npm versions).
**Time**: 5 min each
- [ ] Engine Compatibility on all eight ADRs

### 2.3 No game concept at the template path

`design/gdd/game-concept.md` is missing. Concept content already lives in `docs/game-design.md` §§1–4 (high concept, pillars, fantasy, structure of play).

**Fix**: Create `design/gdd/game-concept.md` from those sections. Do not rewrite the living GDD.
**Time**: 30 min
- [ ] `design/gdd/game-concept.md` exists and links back to `docs/game-design.md`

### 2.4 Living GDD is not template-shaped

`docs/game-design.md` has no `**Status**:` field and none of the eight required headings (`## Overview`, `## Player Fantasy`, `## Detailed` / `## Core Rules` / `## Detailed Design`, `## Formulas`, `## Edge Cases`, `## Dependencies`, `## Tuning`, `## Acceptance`). Content for those topics exists under numbered sections, including `## 20. Acceptance`. `/create-stories` will not see it.

The living spec also states that separate per-system GDDs are not required. Default: keep one living spec; add template-path GDD file(s) that supply the required headings and point at existing sections. Do not split or rewrite `docs/game-design.md`.

**Fix**: After 1.1, `/design-system retrofit design/gdd/[filename].md` on each template GDD that maps a systems-index row (or one wrapper GDD if the index stays a single system). Add `**Status**:` (`Approved` if the living spec is in force).
**Time**: 1 session
- [ ] At least one GDD under `design/gdd/` has `**Status**:` and `## Acceptance`
- [ ] `docs/game-design.md` left intact

### 2.5 Engine reference snapshot missing

ADR engine checks look for `docs/engine-reference/[engine]/VERSION.md`.

**Fix**: After `/setup-engine`, add a version pin for three.js / r3f (and note WebGPURenderer). Manual file is enough if `/setup-engine` does not write one.
**Time**: 30 min
- [ ] `docs/engine-reference/` contains a `VERSION.md` for the configured stack

---

## Step 3: Bootstrap Infrastructure

Fix ADR formats (Step 1.3 and Step 2.1–2.2) before this step. The registry reads ADR Status fields.

### 3a. Register existing requirements (creates tr-registry.yaml)

Run `/architecture-review` — even if ADRs already exist, this run bootstraps
the TR registry from your existing GDDs and ADRs.
**Time**: 1 session (review can be long for large codebases)
- [ ] `docs/architecture/tr-registry.yaml` created

### 3b. Create control manifest

Run `/create-control-manifest`
**Time**: 30 min
- [ ] `docs/architecture/control-manifest.md` created
- [ ] Header contains `Manifest Version:`

### 3c. Create sprint tracking file

Run `/sprint-plan update`
**Time**: 5 min (if sprint plan already exists as markdown)
- [ ] `production/sprint-status.yaml` created

### 3d. Set authoritative project stage

`production/stage.txt` currently says `Systems Design`. The repo has 111 `src/` files and a playable campaign loop; `/gate-check` should confirm whether that stamp is still intended.

Run `/gate-check Systems Design` (or the phase you mean to own).
**Time**: 5 min
- [ ] `production/stage.txt` written authoritatively after the gate

---

## Step 4: Medium-Priority Gaps

### 4.1 Template GDD headings still missing after Acceptance

Even with Acceptance present, skills still want Overview, Player Fantasy, Detailed Design/Core Rules, Formulas, Edge Cases, Dependencies, and Tuning as headings.

**Fix**: `/design-system retrofit design/gdd/[filename].md` — add headings that alias existing numbered sections; do not duplicate rules into a second source of truth.
**Time**: 1 session
- [ ] Required headings present on template-path GDD(s)

### 4.2 ADRs missing `## GDD Requirements Addressed`

Traceability matrix coverage is incomplete without this section.

**Fix**: `/architecture-decision retrofit` on each ADR in Step 1.3; point at the matching GDD sections / future TR-IDs.
**Time**: 5 min each
- [ ] Section present on all eight ADRs

### 4.3 No architecture traceability matrix

**Fix**: produced or updated by `/architecture-review` in 3a.
**Time**: included in 3a
- [ ] `docs/architecture/architecture-traceability.md` exists

### 4.4 Naming conventions unconfigured

**Fix**: fill Naming Conventions in `docs/technical-preferences.md` from existing TS style (no new convention).
**Time**: 5 min
- [x] Naming conventions no longer `[TO BE CONFIGURED]`

### 4.5 Performance budgets unconfigured

`docs/game-design.md` §20 leaves product-level perf budgets pending. Do not invent numbers.

**Fix**: mark budgets as pending in technical-preferences, or copy only already-authored scoped budgets (e.g. city-architecture pass) with their scope stated.
**Time**: 5 min
- [x] Performance budgets field is explicit (pending or scoped), not `[TO BE CONFIGURED]`

---

## Step 5: Optional Improvements

### 5.1 ADRs missing `## Performance Implications`

Not pipeline-critical.

**Fix**: `/architecture-decision retrofit` — add a short section (often “none beyond existing frame/sim rules”).
**Time**: 5 min each
- [ ] Section present on all eight ADRs

### 5.2 Technical preferences empty lists

Forbidden Patterns and Allowed Libraries start empty by design. Optionally record zustand / r3f / drei / three / vitest as allowed, and the AGENTS.md guardrails as forbidden patterns.

**Time**: 5 min
- [ ] Optional: Allowed Libraries lists the current `package.json` runtime deps

---

## What to Expect from Existing Stories

Existing stories continue to work with all template skills. New format checks
(TR-ID validation, manifest version staleness) auto-pass when the fields are
absent — so nothing breaks. They won't benefit from staleness tracking until
regenerated. Do not regenerate stories that are in progress or done.

This repo has no files under `production/epics/`. Do not generate stories until Steps 1–3 are done and GDDs have Acceptance Criteria at the template path.

---

## Re-run

Run `/adopt` again after completing Step 3 to verify all blocking and high gaps
are resolved. The new run will reflect the current state of the project.
