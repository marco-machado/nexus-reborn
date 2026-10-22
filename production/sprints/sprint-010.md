# Sprint 10 — 2026-10-22 to 2026-10-28

## Sprint Goal

Land the five difficulty-curve stories approved on 2026-10-21 (`design/difficulty-curve.md`) so Production → Polish gate blocker 3 closes: Rust Haven opens at intel 1 and the other two authored contracts at 2, one Moderate market offer is seeded at New Operation, the orientation card drops to four rows with a sector-panel Influence moment, the first Debrief prompts Research, and the Brief shows a KIT line from objective kinds.

## Capacity

- Total days: 5 (one person; Thu 22, Fri 23, Mon 26, Tue 27, Wed 28 Oct)
- Buffer (20%): 1.0 day
- Available: 4.0 days
- Stories: Must Have 1.3 d, Should Have 0.8 d = 2.1 d, 1.9 d under the available line.
- Dates (logged assumption): Sprint 9 closed 2026-10-19 (QA sign-off r2, retro). Sprint 10 starts today and keeps the 2026-10-28 end Sprints 4–9 shared. Move the dates if that is not intended.
- Velocity (retro sprint 9, `production/retrospectives/retro-sprint-9-2026-10-19.md`): 5.5/5.5 sheet-days (100%), 17 stories in a 177 min commit window, ~5.8 stories/h on the automated part; the four Visual/Feel stories closed two days later after the user's listening pass. Retro 9 lesson: three stories closed with ticked criteria that QA then failed — tick a UI/Integration criterion only after running it.
- Sizing: the story files' own estimates are kept (0.3–0.5 d). They were written 2026-10-22 against the current code, so no green-field discount applies. Re-size at `/story-readiness`.
- Story count: 5 — every `Ready` story under `production/epics/`. The `fine` granularity range is 15–25; the Ready backlog is smaller, so it is planned whole, not padded.
- Sprint 9 was planned as the final sprint; this one exists because the 2026-10-19 playtest produced design changes (gate re-run 3 FAIL, blocker 3). Everything else in `production/epics/` is Complete.
- No milestone is defined — planning against the story backlog alone. No risk register exists; risks are assessed from the sprint contents only.
- PR-SPRINT: **REALISTIC** (producer, 2026-10-22). Load 52% of capacity; no hard dependencies; notes folded into Risks and Dependencies below.

QA plan: run `/qa-plan sprint` before implementation begins (none exists for Sprint 10; option [A] chosen automatically in autonomous mode).

### Readiness at planning — criteria count only

Counted against the `/story-readiness` minimums (Logic/Integration 3, UI 2). The full `/story-readiness` skill still runs per story before `/dev-story`.

| Story | Type | ACs | Min | Count verdict |
|---|---|---|---|---|
| WN-020 | Logic | 4 | 3 | OK |
| EC-023 | Logic | 6 | 3 | OK |
| IF-013 | UI | 6 | 2 | OK |
| IF-014 | Integration | 5 | 3 | OK |
| IF-015 | UI | 4 | 2 | OK |

### Open decisions inside Ready stories (PR-SPRINT)

Settle on day 1 so no story stalls halfway:

- EC-023: Feed line at t=0 — **decided yes** (owner, 2026-10-22).
- IF-014: "available" also means affordable after the payout — **decided yes** (owner, 2026-10-22).
- IF-013 and IF-015 copy waits on `/ux-design` (gate blocker 4); expect copy rework if the UX spec lands after the story.

## Tasks

### Must Have (Critical Path)

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| WN-020 | Rust Haven opens at intel 1; Glass Veil and Hollow Crown at 2 | gameplay-programmer | 0.3 | None | Per story file |
| EC-023 | One Moderate market offer is seeded at New Operation | gameplay-programmer | 0.5 | None (land after WN-020, not interleaved: both edit `save.test.ts` / `appStore.test.ts`) | Per story file |
| IF-013 | Four-row orientation card and the sector-panel Influence moment | ui-programmer | 0.5 | WN-020, EC-023 (soft: START HERE target) | Per story file |

### Should Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| IF-014 | First-Debrief Research prompt | ui-programmer | 0.4 | None (shares `SEEN_IDS` / `markSeen` with IF-013; fix the guard once, in whichever lands first) | Per story file |
| IF-015 | Brief KIT line from objective kinds | ui-programmer | 0.4 | None | Per story file |

### Nice to Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| — | None | | | | |

## Carryover from Previous Sprint

| Task | Reason | New Estimate |
|------|--------|-------------|
| — | None. All 17 Sprint 9 stories are `done` in `production/sprint-status.yaml`; R-1 to R-7 closed per the Sprint 9 plan. | — |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| UI evidence is the cost driver: IF-013 + IF-014 ≈ 20 captures, IF-015 4 scales × (3 authored + one per generated type); Sprint 9 slipped on 800×600 in-app shots | High | Medium | Headless `playwright-cli` at exactly 1280×720 from the first capture; evidence under `production/qa/evidence/<story-slug>/`; Claude captures it (CLAUDE.md "Do It Yourself") |
| Criteria ticked without being run (retro 9: three stories failed QA after being ticked) | Medium | High | Run each UI/Integration AC against the click-through before ticking; qa-tester review stays on every story |
| EC-023 moves market-RNG golden values; WN-020 and EC-023 both edit `save.test.ts` and `appStore.test.ts` | Medium | High | Land sequentially; each commit body states that determinism and the versioned save are preserved (CLAUDE.md guardrails) |
| IF-013 and IF-014 both add to `SEEN_IDS`; `markSeen` sets even when already seen | Medium | Medium | Fix the guard once in the first of the two to land; the second reuses it |
| IF-013 / IF-015 copy changes after `/ux-design` | Medium | Low | Spend part of the 1.9 d slack on `/ux-design` World Network + Brief before IF-013, or accept a copy-only follow-up |
| This sprint closes blocker 3 only; smoke at HEAD, playtests 2–3 and UX specs stay open | High | Medium | Not sprint stories; tracked in `production/session-state/active.md`; the gate cannot pass on this sprint alone |

## Dependencies on External Factors

- `/qa-plan sprint` before implementation begins.
- The two decisions above (EC-023 Feed line, IF-014 "available") were answered yes on day 1.
- Headless Playwright (`npx playwright-cli`) for 1280×720 capture. Never the user's own Chrome.
- Remaining gate blockers outside this sprint: `/ux-design` World Network + Brief (blocker 4), smoke at HEAD (blocker 1), playtests 2–3 (blocker 2).
