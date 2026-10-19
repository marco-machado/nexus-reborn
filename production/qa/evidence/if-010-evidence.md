# Test Evidence: IF-010 Debrief filing status and write-failure indicators

> **Story**: `production/epics/interface/story-010-debrief-filing-status-and-write-failure-indicators.md`
> **Story Type**: UI
> **Date**: 2026-10-19
> **Tester**: Claude (review of the 2026-10-19 smoke re-run, via /team-qa Phase 5, autonomous mode)
> **Build / Commit**: 0dcb87c

---

## What Was Tested

This is a review of the smoke check's re-run of the retained `capture.mjs`, done today on the current tree at 1280x720: `production/qa/evidence/smoke-2026-10-19/if-010/`. It was not re-run. The script is byte-identical to the story copy, and there are 0 `src/` commits after the smoke record (c4c1dc9). The review covers:
- the Debrief invoice's unfiled state;
- filing after the next-Screen autosave, on the World Network return and on Brief Replay separately;
- the write-failure notice on both exits and on New Operation.

Cases: `production/qa/test-cases/if-010-debrief-filing-status-cases.md` TC-01 to TC-07.

**Acceptance criteria covered**: AC22, AC23

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC22 | GIVEN an applied in-memory Debrief, WHEN it is displayed before any Screen return, THEN the invoice visibly reads as unfiled. After a successful next-Screen autosave, tested through World Network return and Brief Replay separately, filing status no longer reads unfiled. The success signal comes from Persistence, not merely navigation. | PASS | Debrief reads `"status":"unfiled"` with `INVOICE UNFILED // COMMITS ON NEXT SCREEN`, not clipped. On World Network arrival it is still `unfiled` until the write, and then `filed` with no notice. The second Debrief is unfiled; after Brief Replay it reads `filed` with no notice. |
| AC23 | GIVEN Persistence reports a failed New Operation durable write or failed first Screen write after Debrief, WHEN the corresponding surface is shown, THEN it visibly reports failure rather than durable erase/filing success; an invoice remains unfiled. Use both World Network-return and Brief-Replay failure fixtures. | PASS | World Network return: `write-failed` (quota), with `SAVE FAILED // CAMPAIGN NOT FILED` not clipped and persisting after the orientation is dismissed. Brief Replay: `write-failed` with the same notice. New Operation: `write-failed` with the notice. None of these shows erased or filed copy. |

---

## Screenshots / Video

All files are in `production/qa/evidence/smoke-2026-10-19/if-010/`.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `01-debrief-invoice-unfiled-1280x720.png` | Debrief invoice unfiled | AC22 |
| 2 | `02-world-return-filed-1280x720.png` | Filed after the World Network autosave | AC22 |
| 3 | `03-brief-replay-filed-1280x720.png` | Filed after the Brief Replay autosave | AC22 |
| 4 | `04-world-return-write-failed-1280x720.png` | Write failure on the World Network return | AC23 |
| 5 | `05-brief-replay-write-failed-1280x720.png` | Write failure on Brief Replay | AC23 |
| 6 | `06a-new-operation-write-failed-with-orientation-1280x720.png` | New Operation write failure with the orientation card up | AC23 (see BUG-0003) |
| 7 | `06b-new-operation-write-failed-1280x720.png` | New Operation write failure after UNDERSTOOD | AC23 |
| 8 | `capture-output.txt`, `run.log` | Run transcript | all |

---

## Test Conditions

- **Game state at start**: fresh profile; the write-failure fixtures make the storage write throw a quota error (retained script).
- **Platform / hardware**: macOS, headless Chrome for Testing, 1280x720; `npm run dev` on port 4200 (smoke run).
- **Framerate during test**: not measured.
- **Any special setup required**: the retained script's assists, unchanged.

---

## Observations

- **BUG-0003 (S4-Low / P3-Backlog):** in 06a, the `SAVE FAILED // CAMPAIGN NOT FILED` notice covers first-visit orientation-card text: the end of START HERE's second line and the start of STRATEGIC TIME. That is an IF-001 AC1 concern, not this story's AC22/AC23, and qa-lead ruled it does not block this sign-off. The `ui.css:2841-2850` comment says the 31vh band covers no text.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | Not required: UI story, closed by the retained screenshots | — | — |
| QA lead | qa-lead (agent, /team-qa Phase 5 review, `team-qa-2026-10-19-s9/qa-lead-review.md`) | 2026-10-19 | [x] Approved — SIGNED WITH NOTES |

---

*Template: `.claude/docs/templates/test-evidence.md`*
