# QA Strategy: Sprint 10 (difficulty-curve stories)

**Date**: 2026-10-22
**Author**: qa-lead
**Stage**: Production | **qa.level**: full | **team.size**: studio
**Companion plan**: `production/qa/qa-plan-sprint-010-2026-10-22.md`
**Smoke report**: `production/qa/smoke-2026-10-22-sprint-010.md`

Story types are the headers' declared types; no reclassification (reasons checked below). At `qa.level full`, Logic and Integration evidence is the automated test; UI and Visual/Feel need retained screenshots (BLOCKING).

## Strategy Table

| Story | Type | Automated Required | Manual Required | Blocker? |
|-------|------|--------------------|-----------------|----------|
| WN-020 Rust Haven opens at intel 1; Glass Veil/Hollow Crown at 2 | Logic | `src/game/data.test.ts`, `src/state/campaignStore.test.ts`, `src/state/appStore.test.ts`, `src/state/save.test.ts` (all present) | None required by gate. Optional 10 min look at intel-1 vs intel-2 Scan against `evidence/wn-020/` (2 PNGs present) | No |
| EC-023 Opening market offer seeded at New Operation | Logic | `src/game/contracts.test.ts`, `src/state/worldStore.test.ts`, `src/state/save.test.ts`, `src/state/appStore.test.ts` (all present) | None required by gate. Seeded offer deploys through Brief, Mission, Debrief (smoke item 4, sim-assisted) | No |
| IF-013 Four-row orientation card + sector-panel Influence moment | UI | `src/ui/worldOnboard.test.ts`, `src/state/tutorialStore.test.ts` (present; unit seams, not the gate) | Screenshots: 17 PNGs at 90/100/110/125 in `evidence/if-013/` (present, count verified). Click-through of AC27 copy, UNDERSTOOD once-only, Influence moment never returns, Antarctica no-fire | No |
| IF-014 First-Debrief Research prompt | Integration | `src/ui/debriefResearch.test.ts`, `src/state/appStore.test.ts`, `src/state/save.test.ts`, `src/game/tutorial.test.ts` (all present) | Documented playtest/click-through: first Debrief, go-to-Research routing, reload re-fires, second Debrief silent, pyrrhic banner first, unaffordable no prompt. 11 PNGs in `evidence/if-014/` (present) | No |
| IF-015 Brief KIT line from objective kinds | UI (unit seam) | `src/ui/kitLine.test.ts` (present, covers 4 kinds, authored/generated parity, Brief vs deploy, reclient, Expedite) | Screenshots in `evidence/if-015/` (present, 32 files). Re-capture Brief at scale 110/125 after the BUG-0009 fix, because the retained `m03-brief-125.png` shows the overlap (see Concerns) | No (advisory re-capture) |

**Smoke Check: PASS WITH WARNINGS — `production/qa/smoke-2026-10-22-sprint-010.md` (1626/1626 tests, lint, build green; warnings: if-001 `sweep.mjs`/`perf.mjs` target Glass Veil, now locked at intel 1, so the 4-scale Debrief+later clip sweep and in-mission frame check were not re-run; mission play was sim-API assisted; audio listening not re-run). Build may proceed to manual QA.**

**Open bugs in scope: BUG-0009 (S3-Medium, Interface Brief/IF-001, Fixed, awaiting QA verification, evidence `production/qa/evidence/bug-0009-fix-2026-10-22/`); BUG-0008 (S3-Medium, Audio, Open, not reproduced; system outside Sprint 10, carried, not in scope). No open S1/S2.**

## Verification of Inputs (on disk)

- All named test files exist: `data.test.ts`, `campaignStore.test.ts`, `appStore.test.ts`, `save.test.ts`, `worldStore.test.ts`, `tutorialStore.test.ts`, `contracts.test.ts`, `worldOnboard.test.ts`, `tutorial.test.ts`, `debriefResearch.test.ts`, `kitLine.test.ts`.
- Evidence dirs exist: `wn-020/` (README + 2 PNGs), `ec-023/` (2 PNGs), `if-013/` (17 PNGs + README, capture.mjs, capture-output.txt), `if-014/` (11 PNGs + README etc.), `if-015/` (32 files), `bug-0009-fix-2026-10-22/` (24 PNGs + capture.mjs, capture-output.txt).
- The qa-plan's EC-023 row omits `src/game/contracts.test.ts` and `evidence/ec-023/`, both present and cited in the story; the Logic evidence includes them.
- Pass/fail of these tests rests on the smoke run (1626/1626); this strategy did not re-run them.

## Type Review

- WN-020, EC-023: Logic confirmed (pure data and store rules). EC-023 also holds a flow AC (select, deploy, leave market); it is covered by an `appStore.test.ts` test, so Logic stays.
- IF-014: Integration confirmed (Debrief, tutorial store, router, Research). Its UI evidence is extra, not gate-required.
- IF-015: UI confirmed. Its pure `kitLine` seam is covered by automated tests, as the header notes.

## Gaps and Acceptance Criteria Review

- All ACs are testable as written; none is a "feels good" criterion. TR-interface-002 clip criteria are measurable (probe in each `capture.mjs`).
- IF-014 AC4 (reload on the first Debrief re-fires the prompt): evidence is `02-reload-then-debrief-prompt-fires-again-100.png` only. I found no automated assertion for the reload; the story accepts this as ADR-0011 behaviour. Advisory.
- IF-013 AC "Nexus-held Tax eligibility is stated" is asserted by `worldOnboard.test.ts` (copy test present), so no manual need beyond a read.
- EC-023 AC1 ("before `t` advances"): the retained PNGs were taken after the clock advanced (~76 min). The Logic tests are the evidence for AC1; screenshots depict the seeded offer only. No blocker.
- No missing evidence that blocks QA hand-off.

## Manual QA Estimate (headless `npx playwright-cli` at exactly 1280x720; never the in-app pane or the user's Chrome)

| Session | Scope | Est. |
|---------|-------|------|
| 1 | IF-013 click-through (card, UNDERSTOOD, Influence moment, Antarctica) at scale 100, spot-check 125 | 45 min |
| 2 | IF-014 click-through (4 Debrief states, go-to-Research, reload) | 45 min |
| 3 | IF-015 Brief pass at 110/125 for Rust Haven, Hollow Crown, one generated type per kind; plus BUG-0009 verification | 60 min |
| 4 | Smoke-warning follow-up: retarget `if-001/sweep.mjs` and `perf.mjs` from Glass Veil to Rust Haven, rerun the Debrief+later clip sweep and in-mission frame check | 60 min |

Total: 4 sessions, about 3.5 h. WN-020 and EC-023 need no session; the optional Scan look is folded into Session 1. No separate playtest session is warranted; the companion plan's playtest list stays as written.

## BUG-0009 Verification Step

Yes, a verification step is needed. Category is UI and its Status is "Fixed (awaiting QA verification)", so `/bug-report verify BUG-0009` needs a manual check on a build with fix commit `ea1960f`. Automated evidence (13 PASS in the fix `capture.mjs`) covers MODERATE, HIGH and SEVERE at 90/100/110/125; it does not cover 1366x768 or 1920x1080. Fold it into Session 3: view Rust Haven Brief at 125 and 110, confirm `MODERATE` clears `ETA RESPONSE`, and confirm the wrapped layout does not push KIT lines or objectives to clip. Verified-by line will be manual, with the build named.

## Concerns

- IF-015 retained `m03-brief-125.png` shows the BUG-0009 overlap; AC4 evidence at 125 is stale for Rust Haven (and likely the other briefs). Re-capture after the fix, or cite the bug-0009 evidence in the IF-015 README.
- Smoke warning: the if-001 `sweep.mjs` and `perf.mjs` harness points at Glass Veil, locked at intel 1 by WN-020. This is a harness defect, not a story defect, but the Debrief+ clip sweep and frame check stay un-run until retargeted (Session 4). It is needed before the sprint sign-off.
- The BUG-0009 fix wraps the threat row at 110 for MODERATE; check that this does not regress IF-013 or IF-015 Brief captures at 110.
- BUG-0008 is carried, not verified, and stays Open.

## Sign-off Condition

Sprint 10 QA sign-off needs: Sessions 1-4 recorded, BUG-0009 Verified Fixed (manual, build named), IF-015 evidence refreshed or cross-referenced, and no open S1/S2. A S3 (BUG-0008) is outside this sprint's systems and does not block this sprint; any later milestone gate at `workflow: full` still counts it.
