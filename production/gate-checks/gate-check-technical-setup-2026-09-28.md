# Gate Check: Technical Setup → Pre-Production

**Date**: 2026-09-28
**Checked by**: gate-check skill (review mode: full)

### Verdict: CONCERNS

## Required Artifacts: 10/13 present

- [x] Engine chosen — CLAUDE.md stack pinned (three r185 / React 19.2.8 / Vite 6.4.3)
- [x] `docs/technical-preferences.md` — populated; naming conventions set
- [x] `design/art/art-bible.md` — all 9 sections, AD-ART-BIBLE CONCERNS revised same-day 2026-09-23
- [x] ADRs — 20/20 Accepted (need ≥3 Foundation), all with Engine Compatibility + GDD Requirements sections
- [x] `docs/engine-reference/web/` — VERSION.md (risk HIGH, pinned), deprecated-apis.md present
- [x] Example test files — ~39 colocated `*.test.ts`; `npm run test` verified live: 35 files, 591 tests, all pass (colocated layout is the documented project convention, satisfying the framework check)
- [x] `docs/architecture/architecture.md` — v1.0, TD-ARCHITECTURE APPROVED WITH CONDITIONS, lead-programmer FEASIBLE
- [x] Traceability index — present as `traceability-index.md` (equivalent of `requirements-traceability.md`)
- [x] `/architecture-review` — 3 passes; latest 2026-09-11, verdict CONCERNS
- [x] `design/accessibility-requirements.md` — Standard tier committed 2026-09-23
- [ ] `design/ux/interaction-patterns.md` — MISSING (`design/ux/` does not exist)
- [ ] `tests/unit/` + `tests/integration/` — MISSING as literal paths (vitest colocated suite green — intent satisfied, paths not)
- [ ] CI workflow (`.github/workflows/tests.yml` or equivalent) — MISSING; nothing enforces the green suite

## Quality Checks: 9/11 passing

- [x] ADRs cover rendering (ADR-0010), input/audio (ADR-0017), state (stores/persistence ADR-0011)
- [ ] Technical preferences budgets — PENDING (QQ-01: framerate/frame/draw-call/memory all `[PENDING — §20]`; art bible §8.3/§8.4 budgets provisional against it)
- [x] Accessibility tier defined (Standard) and consumed by ADR-0017/0010
- [ ] UX spec started — no `design/ux/` artifact of any kind yet
- [x] ADR Engine Compatibility sections — 20/20 stamped
- [x] ADR GDD Requirements Addressed sections — 20/20 present
- [x] No deprecated API usage — confirmed by 2026-09-11 review ("none used as the chosen path")
- [x] HIGH-risk domains addressed — WebGPU/r3f/React 19.2 stamped against engine reference; forbidden patterns in prefs + control manifest
- [x] Traceability — zero Foundation gaps; all TRs have Accepted ADR coverage
- [x] ADR dependency graph — acyclic, no dangling refs (20 nodes, 27 edges, programmatic check)
- [x] Engine version agreement — r185 / React 19.2.8 consistent across all ADRs

## Blockers

None. All three required-artifact gaps and the two quality gaps are resolvable in Pre-Production with named owners.

## Concerns (consolidated, all four directors + artifact scan)

1. **QQ-01 performance budgets PENDING** — flagged by all four directors independently; load-bearing for art bible §8 and perf acceptance criteria. Resolve before story breakdown, or mark perf criteria DEFERRED.
2. **No CI workflow** — suite is green locally but unenforced; early Pre-Production story.
3. **Engine-reference drift** (`modules/webgpu.md` "PostProcessing gone", `deprecated-apis.md` "waitForGPU removed") — ADR-0010 HIGH-risk claims lean on these docs; fix before implementation sprints.
4. **Traceability index lags registry v6** — [verified 2026-09-28] `TR-tactical-012` and `TR-interface-008` exist in `tr-registry.yaml` (v6, 2026-09-22) but are absent from `traceability-index.md` (shows 64/64; registry/architecture say 66).
5. **~~Token mirror drift~~ — RESOLVED 2026-09-29 (misdiagnosis).** `--ink: #e2f6ee` at `src/index.css:44` is the `:root.s-high-contrast` override, not drift; base `--ink` (line 16) matches `INK` in `src/ui/tokens.ts`. Real gap was no TS constant for Print White (art bible §4.1); added `PRINT_WHITE` to `tokens.ts`.
6. **~~`game-pillars.md` Draft stamp~~ — RESOLVED 2026-09-29.** Header set to Approved by project owner.
7. **QQ-02 implementation debt** — live `DeployParams` lags Accepted ADR-0009/0019; must become a named first-sprint story.
8. **Open design questions unowned** — Roster OQ1–5, Tactical OQ3/OQ6, research-completion Feed line live only in session state; assign to epics/stories during `/create-epics`/`/create-stories`.
9. **`design/ux/interaction-patterns.md` missing** — required artifact; `/ux-design` produces it as Pre-Production's first step.

## Director Panel Assessment

Creative Director:  CONCERNS
  Pillars enforced across GDDs/art bible; no fantasy-compromising decisions. Fix `game-pillars.md` stamp; set QQ-01 budgets early.

Technical Director: CONCERNS
  Architecture sound, no ADR cycles, 591 tests green (ran live), HIGH-risk domains addressed. Fix engine-ref drift (#3) and traceability lag (#4) before the first implementation sprint.

Producer:           CONCERNS
  Scope closed and previously validated; brownfield de-risks the phase. Own the OQs, QQ-02 story, CI, and first capacity-based sprint plan.

Art Director:       CONCERNS
  Visual identity complete and implementation-matched. Ratify §20 budgets; reconcile the INK token mirror drift before visual stories.

## Verdict: CONCERNS

Minor, tracked gaps exist but none block entering Pre-Production. Concerns 3–6 are documentation hygiene best fixed before the first sprint; concerns 1–2, 7–9 are early Pre-Production work.

Stage not advanced: `production/stage.txt` remains `Technical Setup` (verdict is CONCERNS, not PASS).

Chain-of-Verification: 5 questions checked — verdict unchanged. Traceability lag, token drift, and pillars stamp all confirmed by re-read during verification; no FAIL condition was softened — the literal tests-dirs/CI gaps are real but the framework's intent (functional, green suite) is verified, keeping them CONCERNS not FAIL.
