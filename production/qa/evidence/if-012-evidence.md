# Test Evidence: IF-012 Assembly hire refusals and heavy-tier hint

> **Story**: `production/epics/interface/story-012-assembly-hire-refusals-and-heavy-tier-hint.md`
> **Story Type**: UI
> **Date**: 2026-10-19
> **Tester**: Claude (headless Chrome for Testing, 1280x720, via /team-qa Phase 5, autonomous mode)
> **Build / Commit**: 0dcb87c

---

## What Was Tested

Two scripts ran at HEAD in `production/qa/evidence/team-qa-2026-10-19-s9/if-012/`:
- **`capture.mjs`**, the retained script copied unchanged: the unaffordable, full-roster and control hire fixtures, the over-limit Deploy refusal, the heavy-tier advisory, and the no-repeat check from the log. Result: ALL PASS.
- **`probe.mjs`**, new: real clicks on the disabled refusal controls with every `AudioBufferSourceNode.start()` logged, and an image of the second heavy deploy. Result: ALL PASS.

Cases: `production/qa/test-cases/if-012-assembly-hire-refusals-cases.md` TC-01 to TC-08.

**Acceptance criteria covered**: AC26, AC28

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC26 | GIVEN an unseen heavy-tier advisory and an otherwise-valid heavy-tier deployment, WHEN the mission starts, THEN the existing speed-penalty hint appears once. A later valid deployment in the same campaign does not repeat it. An over-limit Assembly attempt is refused with its reason and never enters Mission; it is not the heavy-tier mission-hint trigger. | PASS | Over-limit: 430.1 KG of 400.0 KG, Deploy disabled, `OFFLOAD 30.1 KG BEFORE DEPLOYMENT`, phase stays `team`, hints `[]`, advisory not seen. Heavy legal: `HEAVY LOAD`, then one `ADVISORY // HEAVY LOADOUT` toast in Mission, not clipped (t 1.67). Second heavy deploy: phase `mission`, hints `[]`, 0 toasts, captured at t 2.36. |
| AC28 | GIVEN candidate offers with owner-reported costs, Credits and roster capacity, WHEN Assembly is shown in unaffordable and full-roster fixtures separately, THEN hire cost versus Credits is visible and hire is disabled with the matching reason. Overdraft and Deploy refusal retain disabled controls plus visible reasons; no refusal audio is required for either. | PASS | Unaffordable: 3 of 3 show `COST <n> CR // CREDITS 9,000 CR`, a disabled HIRE, and `INSUFFICIENT CREDITS // 15,500 / 19,000 / 13,500 CR SHORT`. Full roster: `COST <n> CR // CREDITS 500,000 CR` and `ROSTER AT CAPACITY // 8 / 8`. Control: enabled, no reason. Clicks on the 3 disabled HIRE buttons and on the disabled DEPLOY started 0 audio sources, and the controls and reasons stayed. |

---

## Screenshots / Video

All files are in `production/qa/evidence/team-qa-2026-10-19-s9/if-012/`.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `01-unaffordable-hire-1280x720.png` | Cost vs Credits, disabled HIRE, shortfall reason | AC28 |
| 2 | `02-full-roster-hire-1280x720.png` | Capacity reason, 8 / 8 | AC28 |
| 3 | `03-hire-allowed-control-1280x720.png` | Control: HIRE enabled | AC28 |
| 4 | `04-over-limit-deploy-refused-1280x720.png` | Over-limit Deploy refused with reason | AC26, AC28 |
| 5 | `05-heavy-tier-advisory-in-mission-1280x720.png` | The one heavy-loadout advisory | AC26 |
| 6 | `probe-06a-first-heavy-deploy-advisory.png` | First heavy deploy advisory (probe) | AC26 |
| 7 | `probe-06-second-heavy-deploy-no-advisory.png` | Second heavy deploy: no advisory | AC26 |
| 8 | `probe-07-refusals-1280x720.png` | Refusals after the clicks; 0 source starts | AC28 |
| 9 | `capture-output.txt`, `probe-output.txt` | Run transcripts | all |

---

## Test Conditions

- **Game state at start**: `startNewOperation`, then the retained fixtures: Credits 9,000 or 500,000 CR; roster 4 or full (8 / 8); squad maxHp +80 (over 400 kg) or +40 (heavy, legal) with two med kits each; tutorial skipped.
- **Platform / hardware**: macOS, headless Chrome for Testing (chromium-1247), 1280x720; `npm run dev` on port 4200.
- **Framerate during test**: not measured in this run.
- **Any special setup required**:
  - The fixtures are set through store setState.
  - The second deploy uses `tutorialStore.dismissHint` and `appStore.goto('team')`.
  - The init script wraps `AudioBufferSourceNode.prototype.start`. `src/ui/sound.ts` exports no generic cue function, so source starts are the only cue signal.

---

## Observations

- The Recruitment Market is a modal over Assembly and is missing from IF-001 AC1's declared-overlay list. qa-lead calls this a document gap only (R7).

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | Not required: UI story, closed by the retained screenshots | — | — |
| QA lead | qa-lead (agent, /team-qa Phase 5 review, `team-qa-2026-10-19-s9/qa-lead-review.md`) | 2026-10-19 | [x] Approved — SIGNED |

qa-lead also ruled that AC26 and AC28 may be ticked in the story file. That edit was not made by this run.

---

*Template: `.claude/docs/templates/test-evidence.md`*
