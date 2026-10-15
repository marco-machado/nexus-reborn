# Test Evidence: Debrief filing status reads unfiled until the next Screen

> **Story**: `production/epics/persistence-and-validation/story-017-debrief-filing-status-reads-unfiled-until-the-next-screen.md`
> **Story Type**: UI
> **Date**: 2026-10-15
> **Tester**: Claude (Playwright, headed Chrome for Testing, 1280x720) — /team-qa sprint
> **Build / Commit**: `02491cf`

---

## What Was Tested

The Debrief filing status after a played paid win and a played quiet replay, and that it reads filed once the next Screen (World Network) autosaves. The story's earlier set came from seeded store calls; this pass reached both Debriefs through played missions.

**Acceptance criteria covered**: see the story's AC list; this pass covers the unfiled-on-apply (paid and quiet replay) and filed-after-next-Screen criteria. Reload-restores-post-apply is covered by `04-reload-continue-not-unfiled` and smoke s5.

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| Unfiled on apply (paid) | Applied Debrief shows unfiled | PASS | `quietReplay: false`, status `unfiled`, `INVOICE UNFILED // COMMITS ON NEXT SCREEN` |
| Unfiled on apply (quiet replay) | Applied Debrief shows unfiled | PASS | `quietReplay: true`, status `unfiled`, same line |
| Filed after next Screen | Successful next-Screen write: status not unfiled | PASS | `filed` after World Network return, both cases |
| Reload restores post-apply | Reload restores post-apply, not unfiled | PASS | Retained `04-reload-continue-not-unfiled`; smoke s5 |

---

## Screenshots / Video

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `pv-017/m2-01-played-paid-win-debrief-unfiled-1280x720.png` | Played paid-win Debrief, unfiled | Unfiled (paid) |
| 2 | `pv-017/m2-02-played-quiet-replay-debrief-unfiled-1280x720.png` | `REPLAY // FEE ALREADY COLLECTED`, unfiled | Unfiled (quiet replay) |
| 3 | `pv-017/m2-03-quiet-replay-world-network-filed-1280x720.png` | World Network after the replay | Filed after next Screen |
| 4 | `pv-017/01-debrief-unfiled-1280x720.png` … `04-reload-continue-not-unfiled-1280x720.png` | Story's earlier set (seeded) | All |

---

## Test Conditions

- **Game state at start**: clean origin, telemetry on via Settings toggle, New Operation, Continue
- **Platform / hardware**: macOS (Darwin 25.5.0), Chrome for Testing, 1280x720, dev server
- **Framerate during test**: not measured this pass
- **Any special setup required**: missions played by the sim-order bot in god mode with extra ticks (harness assist)

---

## Observations

- Filing-status copy is placeholder pending `/ux-design` (logged at story close).

---

## Sign-Off

Lead-programmer sign-off **waived** by Marco Machado (project owner), 2026-10-15: a UI story is closed by its retained screenshots (template above), and the QA plan's sign-off request is withdrawn for this story. No sign-off row is kept, because every row here is treated as required.
