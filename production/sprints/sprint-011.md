# Sprint 11 — 2026-10-23 to 2026-10-28

## Sprint Goal

Bring the World Network screen up to its approved UX spec (`design/ux/world-network.md`): the Standard-tier legibility, contrast and 24×24 hit-target floors, the corrected failed-campaign copy, and the owner's layout rulings (no duplicate resource panels).

## Capacity

- Total days: 4 (one person; Fri 23, Mon 26, Tue 27, Wed 28 Oct; owner chose the dates 2026-10-23)
- Buffer (20%): 0.8 day
- Available: 3.2 days
- Committed: Must Have 2.7 d + Should Have 0.5 d = 3.2 d (the available line). Nice to Have 0.6 d, taken only if the buffer is unused on Tue 27.
- Not counted in the 3.2 d (PR-SPRINT): a shared measurement script (≈0.2–0.3 d, before IF-026); `/qa-plan sprint`; `npm test` ×3 (retro 10 action 4); the owner's audio listening pass, moved to Fri 23 (day 1); the hand-played mission in the EC-023 playtest and the World Network p95 re-profile, both Wed 28.
- Velocity (retro 10): 2.1/2.1 sheet-days, 5 stories in a 102 min commit window; QA sign-off 15 h after the last story commit. Sheet-days do not measure the work; UI evidence and QA rulings do.
- Story count: 20 — every `Ready` story under `production/epics/` (IF-016 to IF-035; 145 others Complete). The `fine` range is 15–25; planned whole, not padded.
- Each story has one spec criterion plus guard criteria (owner 2026-10-23) so it meets the `/story-readiness` minimum (UI 2, Integration 3).
- No milestone is defined — planning against the story backlog alone. No risk register exists; risks are assessed from the sprint contents only.
- PR-SPRINT: **CONCERNS** (producer, 2026-10-23): 3.8 d against 3.2 d. Owner chose Option A: IF-023 / IF-024 promoted to Must, IF-019 and IF-025 deferred to Nice to Have.

QA Plan: `production/qa/qa-plan-sprint-011-2026-10-23.md` (written 2026-10-23, before implementation; option [A] chosen in autonomous mode at planning). It must add the five guard cases the stories mark as missing (IF-020, IF-023, IF-026, IF-029, IF-030) and the four IF-015 coverage gaps (Sprint 10 QA condition 4).

### Owner rulings at planning (2026-10-23)

- `TR-interface-???` on IF-031 to IF-035: **waived for this sprint** (no hit-target TR registered); register it at a later `/architecture-review`.
- Globe view-control bar: **stays this sprint**; IF-035 measures its six controls.
- Audio listening pass: Fri 23 (day 1), inside the sprint window.

### Order of work (PR-SPRINT)

1. Before the first story: `npm test` ×3; `/qa-plan sprint`; commit the plan and story edits.
2. Wave 1, copy and layout: IF-016, IF-017, IF-022, IF-023, IF-024, IF-020, IF-021, IF-018.
3. Wave 2, type size: the shared measurement script, then IF-026.
4. Wave 3, ink: IF-029 (makes the scoped `.chip.dim` change), IF-027, IF-028, IF-030.
5. Wave 4, hit targets: IF-031, IF-032, IF-033, IF-035, IF-034.
6. Finish: re-run the screen-wide checks (IF-026, IF-027, IF-028, IF-035) on the final build. Story freeze end of Tue 27; Wed 28 is QA, the playtest and the p95 re-profile (on the final World Network build).

## Tasks

### Must Have (Critical Path)

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| IF-016 | [Failed-campaign banner reads ROSTER EMPTY // NO CONTRACT CAN BE TAKEN](../../production/epics/interface/story-016-failed-campaign-banner-reads-no-contract-can-be-taken.md) | ui-programmer | 0.1 | None | Per story file (UI) |
| IF-017 | [Failed-campaign contract rows read CAMPAIGN LOST](../../production/epics/interface/story-017-failed-campaign-contract-rows-read-campaign-lost.md) | ui-programmer | 0.1 | None (land before IF-029: same element, `WorldMap.tsx:1042`) | Per story file (UI) |
| IF-023 | [Remove the duplicate left INFLUENCE panel](../../production/epics/interface/story-023-remove-the-duplicate-left-influence-panel.md) | ui-programmer | 0.2 | None | Per story file (UI) |
| IF-024 | [RESOURCE POOL becomes INTEL](../../production/epics/interface/story-024-resource-pool-becomes-intel.md) | ui-programmer | 0.2 | None | Per story file (UI) |
| IF-026 | [World Network type meets the size floors](../../production/epics/interface/story-026-world-network-type-meets-the-size-floors.md) | ui-programmer | 0.5 | IF-023, IF-024 (soft: settle the layout first); the shared measurement script | Per story file (UI) |
| IF-027 | [Ink Dim text on the World Network moves to Ink](../../production/epics/interface/story-027-ink-dim-text-on-the-world-network-moves-to-ink.md) | ui-programmer | 0.3 | IF-029 makes the World Network `.chip.dim` change first (fix once) | Per story file (UI) |
| IF-028 | [Feed times and the Timeline axis move off Ink Faint](../../production/epics/interface/story-028-feed-times-and-timeline-axis-move-off-ink-faint.md) | ui-programmer | 0.1 | None | Per story file (UI) |
| IF-029 | [Locked contract rows dim the frame, not the text, and their reason prints in Red Hot](../../production/epics/interface/story-029-locked-contract-rows-dim-the-frame-not-the-text.md) | ui-programmer | 0.3 | IF-017 (same element) | Per story file (UI) |
| IF-030 | [Idle nav tab labels reach 4.5:1 in both modes](../../production/epics/interface/story-030-idle-nav-tab-labels-reach-4-5-in-both-modes.md) | ui-programmer | 0.2 | IF-026 (soft: `.navtab-label` ellipsis at 125%) | Per story file (UI) |
| IF-031 | [Feed rows have a 24 px hit area](../../production/epics/interface/story-031-feed-rows-have-a-24-px-hit-area.md) | ui-programmer | 0.1 | IF-026 (soft) | Per story file (UI) |
| IF-032 | [Timeline track has a 24 px hit area](../../production/epics/interface/story-032-timeline-track-has-a-24-px-hit-area.md) | ui-programmer | 0.1 | IF-026 (soft) | Per story file (UI) |
| IF-033 | [Speed buttons have a 24 px hit area](../../production/epics/interface/story-033-speed-buttons-have-a-24-px-hit-area.md) | ui-programmer | 0.1 | IF-026 (soft); `.wm-tbtn` shared with IF-035 and IF-019 | Per story file (UI) |
| IF-034 | [Inset steppers have a 24 px hit area](../../production/epics/interface/story-034-inset-steppers-have-a-24-px-hit-area.md) | ui-programmer | 0.1 | IF-026 (soft) | Per story file (UI) |
| IF-035 | [Remaining World Network pointer targets meet 24×24](../../production/epics/interface/story-035-remaining-world-network-pointer-targets-meet-24-px.md) | ui-programmer | 0.3 | IF-026 (soft), IF-033 (`.wm-tbtn`) | Per story file (UI) |

### Should Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| IF-018 | [First-visit card is not aria-modal](../../production/epics/interface/story-018-first-visit-card-is-not-aria-modal.md) | ui-programmer | 0.1 | None | Per story file (UI) |
| IF-020 | [STRAINED Garrison prints in the notice tone, not amber](../../production/epics/interface/story-020-strained-garrison-prints-in-the-notice-tone.md) | ui-programmer | 0.1 | None | Per story file (UI) |
| IF-021 | [Unrest ink and bar follow its state](../../production/epics/interface/story-021-unrest-ink-and-bar-follow-its-state.md) | ui-programmer | 0.2 | None | Per story file (UI) |
| IF-022 | [Empty Feed prints -- CHANNEL OPEN --](../../production/epics/interface/story-022-empty-feed-prints-channel-open.md) | ui-programmer | 0.1 | None | Per story file (UI) |

### Nice to Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| IF-019 | [Using the clock dismisses the first-visit card for the campaign](../../production/epics/interface/story-019-using-the-clock-dismisses-the-first-visit-card.md) | ui-programmer | 0.3 | `.wm-tbtn` handler shared with IF-033 / IF-035 | Per story file (Integration) |
| IF-025 | [Each Influence action prints its effect as visible text](../../production/epics/interface/story-025-each-influence-action-prints-its-effect.md) | ui-programmer | 0.3 | IF-026 (soft); reopens IF-026/IF-027 evidence | Per story file (UI) |

## Carryover from Previous Sprint

| Task | Reason | New Estimate |
|------|--------|-------------|
| — | None. All 5 Sprint 10 stories are `done` in `production/sprint-status.yaml`. | — |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Evidence volume across 19 UI stories (several modes, scales and Screens) outruns the sprint; QA sign-off slips past Wed 28 (Sprint 10's tail was 15 h) | High | High | Shared measurement script before IF-026; headless `playwright-cli` at exactly 1280×720; story freeze end of Tue 27 |
| The audio pass on day 1 and the Wed 28 playtest and p95 re-profile take capacity the 3.2 d does not reserve | High | Medium | Option B (also defer IF-021, IF-022) if they take ≥0.3 d |
| IF-026 surfaces clipping or nav ellipsis on Research, Brief or Assembly at 125% (BUG-0009 precedent; `.navtab-label` truncates, `ui.css:407`) | Medium | High | Budget IF-026 pessimistic at 1.0 d; land it before the hit-target stories |
| Later stories make earlier screen-wide evidence stale (IF-026 / 027 / 028 / 035) | High | Medium | Order by wave; final full sweep before QA; IF-025 deferred |
| `WorldMap.tsx`, `ui.css` and `Nav.tsx` edited by most stories | Medium | Medium | Land one at a time; scope `.dim` / `.chip.dim` changes to World Network selectors (IF-027 AC2) |
| `/story-readiness` may still flag `TR-interface-???` on IF-031 to IF-035 | Medium | Low | Owner waiver recorded in each story file and here |
| Test flake recurs (retro 10 action 4 open) | Low | Medium | `npm test` ×3 before the first story |

## Dependencies on External Factors

- `/qa-plan sprint` before implementation begins.
- Headless Playwright (`npx playwright-cli`) for 1280×720 capture. Never the user's own Chrome.
- The owner's audio listening pass (Fri 23), hand-played mission in the EC-023 playtest (Wed 28) and World Network p95 re-profile (Wed 28; it also sets the open-time budget the spec leaves blank).
