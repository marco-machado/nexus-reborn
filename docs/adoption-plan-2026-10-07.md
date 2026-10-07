# Adoption Plan

> **Generated**: 2026-10-07
> **Project phase**: Technical Setup (`production/stage.txt`)
> **Engine**: React 19.2.8 + Vite + r3f / three.js r185 (per `docs/technical-preferences.md` and `AGENTS.md`). `.claude/docs/technical-preferences.md` still says Unity 6.6 and is stale.
> **Template version**: v1.0+ (no `project.yaml`)

Work through these steps in order. Check off each item as you complete it.
Re-run `/adopt` anytime to check remaining gaps.

Do not rewrite `docs/game-design.md`, `CONTEXT.md`, or existing GDD/ADR prose.
Fill template-path gaps only. A previous plan exists at `docs/adoption-plan-2026-09-07.md`; this one reflects current state and does not diff against it.

**Audit result**: 9 GDDs (all 8 required sections present; `game-pillars.md` has no Status field, which is expected for a non-system doc), 20 ADRs (all have Status, ADR Dependencies, Engine Compatibility, GDD Requirements Addressed), 0 stories. `tr-registry.yaml`, `control-manifest.md` (Manifest Version 2026-09-12) and `requirements-traceability.md` exist. Engine reference exists at `docs/engine-reference/web/`.

Gap counts: BLOCKING 2, HIGH 0, MEDIUM 2, LOW 2.

---

## Step 1: Fix Blocking Gaps

### 1a. No `project.yaml` (v1.0 project needing migration) — BLOCKING
`project.yaml` is absent; stage, review mode, and engine settings are read through the legacy fallback chain, so v1.1 settings are unavailable.
**Do not run the converter as-is** until 1b is resolved: the dry run would copy the stale Unity values from `.claude/docs/technical-preferences.md` (including Unity specialists) into `project.yaml`, and would pin `modes.review_mode: full` explicitly.
Dry run: `bash .claude/scripts/migrate-v1-config.sh --dry-run`
Then run the converter, read `production/migration-report.md`, and run `--finalize`.
After migrating: decide `modes.rigor` (v1.0 behaved like `standard`; v1.1 defaults to `minimal`), and delete `modes.review_mode` from `project.yaml` if you want rigor to drive review depth.
**Time**: 30 min
- [ ] project.yaml created and reviewed
- [ ] `--finalize` run
- [ ] `modes.rigor` chosen

### 1b. Stale engine config in `.claude/docs/technical-preferences.md` — BLOCKING
It says Unity 6.6 / C# / URP / PhysX with Unity specialists. The real stack is React + Vite + r3f + three.js + TypeScript, recorded in `docs/technical-preferences.md`. Fix: `/setup-engine` (web), or copy the web values over by hand, before running 1a.
**Time**: 15 min
- [ ] `.claude/docs/technical-preferences.md` matches the web stack
- [ ] Specialists list contains no Unity agents

---

## Step 2: Fix High-Priority Gaps

None.

---

## Step 3: Bootstrap Infrastructure

### 3a. TR registry — done (`docs/architecture/tr-registry.yaml` exists)
### 3b. Control manifest — done (Manifest Version 2026-09-12)
### 3c. Create sprint tracking file
`production/sprint-status.yaml` is absent. Run `/sprint-plan update` once a sprint plan exists. No stories exist yet, so this follows `/create-epics` and `/create-stories`.
- [ ] production/sprint-status.yaml created

### 3d. Set authoritative project stage
After 1a, `project.stage` lives in `project.yaml`. Run `/gate-check` for the phase you are entering to confirm it.
- [ ] `project.stage` in `project.yaml` confirmed

---

## Step 4: Medium-Priority Gaps

### 4a. No epics or stories
`production/epics/` is empty. Run `/create-epics`, then `/create-stories [epic-slug]`.
**Time**: 1 session
- [ ] Epics created
- [ ] Stories created

### 4b. Uncommitted work in the tree
Many design/architecture docs, `tests/`, `prototypes/` and `.claude/` are uncommitted. Not a format gap, but the migration is only reversible via `git checkout` if the current state is committed first.
- [ ] Working tree committed (when you choose)

---

## Step 5: Optional Improvements

### 5a. ADRs 0001–0008 lack `## Performance Implications` (LOW)
Fix: `/architecture-decision retrofit docs/architecture/adr-NNNN-slug.md` for each of 0001–0008. Not pipeline-critical.
- [ ] 0001 two-clocks
- [ ] 0002 unsaved-mission
- [ ] 0003 one-contract-kind
- [ ] 0004 quiet-replay
- [ ] 0005 blueprint-assignment
- [ ] 0006 weather-script
- [ ] 0007 opening-hour
- [ ] 0008 influence-is-a-wallet

### 5b. Free-text Status fields in GDDs (LOW)
`audio.md`, `interface.md`, `research.md`, `roster-and-assembly.md` carry long annotated Status lines. Valid values are `Approved` etc.; annotated text may defeat exact-match checks. `audio.md` has no recognisable status value. Move the notes to the review log.
- [ ] Status lines normalised

---

## What to Expect from Existing Stories

None exist yet. Stories generated later will embed TR-IDs and the manifest version.

---

## Re-run

Run `/adopt` again after Step 1 to verify the blocking gaps are resolved.
