# Test Evidence: Four-row orientation card and the sector-panel Influence moment

> **Story**: `production/epics/interface/story-013-four-row-orientation-card-and-sector-panel-influence-moment.md`
> **Story Type**: UI
> **Date**: 2026-10-22
> **Tester**: qa-tester agent under `/team-qa sprint` (autonomous), headless Chrome for Testing
> **Build / Commit**: `74d3268`, `npm run dev` on port 4200

---

## What Was Tested

Sprint 10 manual QA ran the 21 cases in `production/qa/test-cases/if-013-orientation-card-influence-moment-cases.md` against the running build. The cases cover:
- The four-row orientation card, with START HERE matched against the Scan's own Chance chips.
- UNDERSTOOD dismissing the card, both across a save round-trip and after a New Operation reset.
- The sector panel at Influence 0.
- The one-time Influence moment, including that it never returns after Influence is spent and recovers.
- Antarctica.
- Text scales 90/100/110/125 at 1280×720.
- WN-020's intel-1 and intel-2 Scan lock state.

Full per-case results are in `production/qa/evidence/if-013/manual-2026-10-22/results.md`.

**Acceptance criteria covered**: AC1, AC2, AC3, AC4, AC5, AC6 (plus the optional WN-020 checks)

---

## Acceptance Criteria Results

| # | Criterion (summary; exact text in the story) | Result | Notes |
|---|----------------------|--------|-------|
| AC1 | The card shows exactly four rows. START HERE names the open contract with the highest Chance. | PASS | IF013-01/02/03. START HERE reads NEON GARDEN / OSLO / 87%, which equals the hand pick. |
| AC2 | UNDERSTOOD dismisses the card once per campaign. | PASS | IF013-05/06/07. Covers the reload with CONTINUE and the reset on New Operation. |
| AC3 | At Influence 0 the panel shows the owner's reasons and no teaching panel. | PASS | IF013-08/09. Expedite shows NO TARGET on North America. On Europe it reads UNAFFORDABLE because the seeded offer is there (owner wording ruling in Completion Notes). |
| AC4 | One teaching panel appears when an action becomes affordable, and dismissing it is permanent. | PASS | IF013-11/13/14/15. The moment is marked seen when it fires (owner ruling). IF013-16, the optional real clean-win path, is BLOCKED (not run); the fixture case IF013-11 is the evidence. |
| AC5 | Antarctica focused: no panel. | PASS | IF013-17 at all four scales. |
| AC6 | Nothing clips at 90/100/110/125. | PASS | IF013-04/10/12. |

---

## Screenshots / Video

All files are in `production/qa/evidence/if-013/manual-2026-10-22/` and were confirmed on disk. The dev-story captures in `production/qa/evidence/if-013/` (17 PNGs) are unchanged.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `IF013-01-100.png`, `IF013-02-100-card.png`, `IF013-02-100-scan-eu.png` | Four-row card; START HERE against the Scan | AC1 |
| 2 | `IF013-05-100.png`, `IF013-06-100-after-reload.png`, `IF013-07-100.png` | Card dismissed; absent after reload; back on New Operation | AC2 |
| 3 | `IF013-08-100.png`, `IF013-09-100.png` | Influence 0 reasons (Europe, North America) | AC3 |
| 4 | `IF013-11-100.png`, `IF013-13-100.png`, `IF013-14-100-south-america.png`, `IF013-15-100.png` | Moment up, dismissed, never returns | AC4 |
| 5 | `IF013-17-{90,100,110,125}.png`, `IF013-17-100-refocus-eu.png` | Antarctica: no panel | AC5 |
| 6 | `IF013-04-*.png`, `IF013-10-*.png`, `IF013-12-*.png` | Card, panel and moment at four text scales | AC6 |
| 7 | `IF013-20-*.png`, `IF013-21-*.png` | WN-020 lock state at intel 1 and 2 | WN-020 |

---

## Test Conditions

- **Game state at start**: cleared localStorage, then New Operation. Fixtures are named per case: `influence: 8` for a clean win, `intelLevel: 2`, and `select('an')`.
- **Platform / hardware**: macOS arm64, headless Chrome for Testing (chromium-1247), viewport 1280×720, confirmed after every reload.
- **Framerate during test**: not measured here. See `production/qa/evidence/sprint-010-sweep-perf-2026-10-22/README.md`.
- **Any special setup required**: text scale set through the settings store. Every assist is named in results.md.

---

## Observations

- IF013-18: if focus moved to Antarctica while the moment was up, the panel stayed and still described Stabilize on "the focused sector" (code-review finding 1). **Fixed 2026-10-22 on the owner's ruling:** the note now hides when the focus moves and does not come back. Evidence: `production/qa/evidence/if-013/refocus-fix-2026-10-22/` (`capture-output.txt` ALL PASS; `a1`/`a2`/`a3`/`b1` PNGs).
- IF013-19: leaving the World Network with the moment up consumes the lesson (code-review finding 2). **Accepted 2026-10-22 on the owner's ruling to keep on-fire marking.** AC4 now reads "firing marks it seen".
- At 125 the OPEN CONTRACTS list shows about one row behind its fade while the moment is up. It scrolls (IF013-12 pass 3).
- The strategic clock keeps running under the card. This matches the earlier "clock runs under the card" ruling.
- 0 console or page errors.

---

## Sign-Off

A UI story is closed by the retained screenshots above. A sign-off here is welcome but not required.

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | | | [ ] Approved |

---

*Template: `.claude/docs/templates/test-evidence.md`*
