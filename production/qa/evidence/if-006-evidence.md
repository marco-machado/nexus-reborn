# Test Evidence: IF-006 Menu Continue, New Operation, and telemetry persistence chrome

> **Story**: `production/epics/interface/story-006-menu-continue-new-operation-and-telemetry-persistence-c.md`
> **Story Type**: UI
> **Date**: 2026-10-19
> **Tester**: Claude (headless Chrome for Testing, 1280x720, via /team-qa Phase 5, autonomous mode)
> **Build / Commit**: 0dcb87c

---

## What Was Tested

Two scripts ran at HEAD in `production/qa/evidence/team-qa-2026-10-19-s9/if-006/`:
- `capture.mjs`, the retained script copied unchanged: the three Menu fixtures, the armed New Operation, and Balance with recording off. Result: ALL PASS.
- `probe.mjs`, new for this run. It covers the checks the retained script does not:
  - a confirmed New Operation with nondefault Settings and a progressed campaign;
  - telemetry across a recording-off interval;
  - New Operation and Clear against the log.
  Result: ALL PASS.

Cases: `production/qa/test-cases/if-006-menu-continue-new-operation-cases.md` TC-01 to TC-10.

**Acceptance criteria covered**: AC9, AC17, AC21, AC25

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC9 | GIVEN Menu with no valid campaign blob vs a valid blob, WHEN Continue is read, THEN Continue is absent vs present accordingly. | PASS | never-started: Continue absent, `NO CAMPAIGN ON FILE`. valid: Continue present, `CAMPAIGN ON FILE`. |
| AC17 | GIVEN recorded nondefault Settings and a progressed campaign, WHEN New Operation is confirmed under successful storage conditions, THEN those Settings still match; campaign Credits, Intel, contractsWon, laboratories and tutorial-seen match Persistence's canonical fresh-operation fixture. | PASS | SEEDED Settings `hardened / low / holdGround KeyJ / 125 / telemetry on` all differ from the defaults, and all 5 survived the two-step confirm. SEEDED campaign: 4,321 CR, Intel 3, contractsWon m01+m02, Ballistics lab running, 9 tutorial ids. After the confirm, all 5 fields equal the fixture read at run time: `INITIAL_CREDITS` 128,450, `initialCampaignData()` intel 1 and `[]`, the labs reset to null (`src/state/save.ts:975`), and tutorial `[]`. The arming window disarms after 3,300 ms (retained script). |
| AC21 | GIVEN Persistence reports never-started, invalid/unreadable, and valid in separate Menu fixtures, THEN Continue is absent, absent, and present; invalid/unreadable has a visible reason distinct from never-started. | PASS | unreadable: Continue absent, `SAVE UNREADABLE // DROPPED` (marked invalid), which differs from `NO CAMPAIGN ON FILE`. |
| AC25 | GIVEN telemetry enabled with recorded history, WHEN recording is disabled, a mission finishes or Aborts, and recording is enabled again to inspect Balance, THEN the earlier records remain and the disabled interval added none. Successful Clear empties the log; New Operation does not. Balance remains reachable while recording is disabled because the log is nonempty. | PASS | The control Abort with recording on added exactly 1 record (2 → 3). Recording was then turned OFF by a real click on the Settings toggle, and the next Abort added 0 (ids unchanged). After recording was turned back on, Balance read 3 records with the same ids. New Operation kept 3, and a two-step Clear emptied the log to 0. With recording OFF and 1 record, the Balance entry is present and Balance opens. |

---

## Screenshots / Video

All files are in `production/qa/evidence/team-qa-2026-10-19-s9/if-006/`.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `01-menu-never-started-scale125.png` | Menu: no Continue, `NO CAMPAIGN ON FILE` | AC9, AC21 |
| 2 | `02-menu-unreadable-scale125.png` | Menu: no Continue, `SAVE UNREADABLE // DROPPED` | AC21 |
| 3 | `03-menu-valid-scale125.png` | Menu: Continue, `CAMPAIGN ON FILE` | AC9, AC21 |
| 4 | `04-menu-new-operation-armed-scale125.png` | New Operation armed (`CONFIRM`) | AC17 |
| 5 | `05-balance-recording-off-scale125.png` | Balance opened (retained shot) | AC25 |
| 6 | `probe-06-after-new-operation.png` | World Network after the confirmed New Operation | AC17 |
| 7 | `probe-07-balance-after-disabled-interval.png` | Balance with 3 records after the off interval | AC25 |
| 8 | `probe-08-balance-cleared.png` | Balance after Clear | AC25 |
| 9 | `probe-09a-settings-recording-off-balance-entry.png` | Settings: TELEMETRY OFF with the Balance entry visible | AC25 |
| 10 | `probe-09b-balance-open-recording-off.png` | Balance open while recording is off | AC25 |
| 11 | `capture-output.txt`, `probe-output.txt` | Run transcripts | all |

---

## Test Conditions

- **Game state at start**: fresh profile per run (localStorage cleared).
- **Platform / hardware**: macOS, headless Chrome for Testing (chromium-1247), 1280x720; `npm run dev` on port 4200.
- **Framerate during test**: not measured in this run.
- **Any special setup required**:
  - Retained script: blob fixtures written through `save.ts`, records via `telemetry.saveRecords`, and recording-off via `setTelemetry(false)`.
  - Probe: SEEDED Settings through settingsStore setters, and a SEEDED campaign through store setState then `writeSave`. Both are printed in `probe-output.txt`.
  - Probe: 2 SEEDED and then 1 SEEDED telemetry record, and missions reached through the app store (Team Deploy → startMission).
  - Real clicks for Menu, Settings, the telemetry toggle, pause/Abort, Balance and Clear.

---

## Observations

- The first probe run failed on harness faults, not on the build. The lab seed id `seeded` made the save invalid, and the Menu does not hydrate the campaign. The seed and the read were fixed and the probe was re-run; the result above is from that re-run (`team-qa-2026-10-19-s9/README.md`).
- qa-lead, cosmetic: at 125%, Balance's MEAN FIRST CONTACT placeholder value breaks onto two lines (probe-09b). Nothing is clipped, and Balance is not one of AC1's surfaces. This is a candidate for S4-Low / P3-Backlog and was not filed.
- After New Operation the orientation card shows again (tutorial reset). Its RESEARCH row is cut at the card's scroll edge, which R2 accepts.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | Not required: UI story, closed by the retained screenshots | — | — |
| QA lead | qa-lead (agent, /team-qa Phase 5 review, `team-qa-2026-10-19-s9/qa-lead-review.md`) | 2026-10-19 | [x] Approved — SIGNED WITH NOTES |

---

*Template: `.claude/docs/templates/test-evidence.md`*
