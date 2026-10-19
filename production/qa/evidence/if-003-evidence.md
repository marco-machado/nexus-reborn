# Test Evidence: IF-003 Contract navigation gates Brief, Assembly, and Deploy

> **Story**: `production/epics/interface/story-003-contract-navigation-gates-brief-assembly-and-deploy.md`
> **Story Type**: UI
> **Date**: 2026-10-19
> **Tester**: Claude (headless Chrome for Testing, 1280x720, via /team-qa Phase 5, autonomous mode)
> **Build / Commit**: 0dcb87c

---

## What Was Tested

The retained `production/qa/evidence/if-003/capture.mjs` was copied unchanged to `production/qa/evidence/team-qa-2026-10-19-s9/if-003/` and re-run at HEAD. Reason: 19 `src/` files changed after the story's evidence commit `e256bc0`. The re-run checked the no-contract gates, Brief against the deployed mission on Glass Veil (m01), and the Debrief return and Replay paths. Its transcript and `brief-vs-deployed.md` match the signed-off originals line for line, apart from decimals. Cases: `production/qa/test-cases/if-003-contract-navigation-gates-cases.md` TC-01 to TC-08.

**Acceptance criteria covered**: AC4, AC5, AC6

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC4 | GIVEN no selected contract, WHEN Brief navigation, Assembly navigation and Deploy are each exercised, THEN Brief cannot open, Assembly opens, and Deploy does not start a mission and shows the missing-contract reason. | PASS | Brief nav: `BRIEF // LOCKED // NO CONTRACT SELECTED`, and a click leaves `phase=world`. Assembly: `phase=team`. Deploy: aria `DEPLOY TEAM // NO CONTRACT SELECTED`, the phase stays `team`, and capture 03 shows the visible text `SELECT A CONTRACT ON THE WORLD NETWORK` under the disabled control. |
| AC5 | GIVEN a selected unlocked contract and recorded seed/variant, Difficulty and relevant deployment inputs, WHEN Brief is opened and that same deployment is created, THEN Brief is reachable and its insertion, objectives, extraction, force/civilian counts, Opening hour and weather-front timing match the District. | PASS WITH NOTES | All 9 rows of `brief-vs-deployed.md` are equal: seed 20870514, Difficulty standard, insertion, extraction, objectives ob1–ob3, garrison 07, civilians 22, Opening hour 80048, `HEAVY RAIN → LIGHT RAIN 22:16:38`. There is no variant row. qa-lead R8 rules the seed sufficient: 20870514 is `variants[0].seed`, and `variants[1]` is 20870515 (`src/game/data.ts:139-143`). |
| AC6 | GIVEN Debrief returning to the World Network, WHEN the nav is read, THEN the selected contract is cleared and Brief is locked. For authored work on a non-failed campaign, Replay returns directly without reselecting. Generated work has no Replay control. | PASS | Replay count 1 → `phase=brief missionId=m01`. Debrief `RETURN TO WORLD NETWORK` (`capture.mjs:158`) → `phase=world missionId=null`, and Brief is locked. The generated Debrief shows Replay count 0. |

---

## Screenshots / Video

All files are in `production/qa/evidence/team-qa-2026-10-19-s9/if-003/`.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `01-nav-no-contract-brief-locked.png` | Nav with BRIEF locked and no contract | AC4 |
| 2 | `02-assembly-reachable-no-contract.png` | Assembly opened with no contract | AC4 |
| 3 | `03-deploy-refusal-no-contract.png` | Disabled DEPLOY with `SELECT A CONTRACT ON THE WORLD NETWORK` | AC4 |
| 4 | `04-nav-with-contract-brief-open.png` | BRIEF unlocked with Glass Veil selected | AC5 |
| 5 | `05-deployed-mission.png` | The deployed Glass Veil mission | AC5 |
| 6 | `06-debrief-authored-replay-offered.png` | Authored Debrief offering Replay | AC6 |
| 7 | `07-replay-returns-to-brief.png` | Replay lands on the Glass Veil Brief | AC6 |
| 8 | `08-nav-after-debrief-return-brief-locked.png` | Nav after the Debrief return, BRIEF locked | AC6 |
| 9 | `09-debrief-generated-no-replay.png` | Generated Debrief with no Replay | AC6 |
| 10 | `brief-vs-deployed.md`, `capture-output.txt` | The compared fields and the run transcript | AC5 |

---

## Test Conditions

- **Game state at start**: fresh profile (localStorage cleared) for each script; Glass Veil (m01), Standard.
- **Platform / hardware**: macOS, headless Chrome for Testing (chromium-1247), viewport 1280x720; `npm run dev` on port 4200.
- **Framerate during test**: not measured in this run.
- **Any special setup required**: the retained script's assists. The Debrief outcomes are seeded through `settleOutcome` (the transcript labels the first one "assist outcome"; the return-path one is at `capture.mjs:153-156`).

---

## Observations

- The Replay Brief shows CITY BLOCKS 31, CIVILIANS 28 and PATROL CONTACTS 09, against 29/22/08 on the first Brief. qa-lead traced this to `missionVariant(m, true)`, which picks the other authored layout. The AC5 table covers only the first deployment. Advisory: add a variant row and a Replay comparison in a test-tightening follow-up (qa-lead R8).
- The story's code review recorded asserts that cannot fail in `navGates.test.ts` / `contractNavigation.test.ts` (strategy). This run did not change that.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | Not required: UI story, closed by the retained screenshots | — | — |
| QA lead | qa-lead (agent, /team-qa Phase 5 review, `team-qa-2026-10-19-s9/qa-lead-review.md`) | 2026-10-19 | [x] Approved — SIGNED WITH NOTES |

---

*Template: `.claude/docs/templates/test-evidence.md`*
