# Test Evidence: Brief KIT line from objective kinds

> **Story**: `production/epics/interface/story-015-brief-kit-line-from-objective-kinds.md`
> **Story Type**: UI (unit seam `src/ui/kitLine.test.ts`)
> **Date**: 2026-10-22
> **Tester**: qa-tester agent under `/team-qa sprint` (autonomous), headless Chrome for Testing and `npx playwright-cli`
> **Build / Commit**: `74d3268` (includes BUG-0009 fix `ea1960f`), `npm run dev` on port 4200

---

## What Was Tested

Sprint 10 manual QA ran the 18 cases in `production/qa/test-cases/if-015-brief-kit-line-cases.md`: 12 for IF-015 and 6 for BUG-0009. They re-capture every Brief after the BUG-0009 fix, because the retained `if-015/m03-brief-125.png` showed the old threat-box overlap. Each case checks:
- KIT copy for the destroy, interact, escort and defend kinds.
- That no KIT line appears where a contract has none of those kinds.
- No clipping at 90/100/110/125 at 1280×720 (a 28-cell grid of 3 authored Briefs and 4 generated types).
- That the Brief objectives equal the deployed mission's objectives.

Full per-case results are in `production/qa/evidence/if-015/recapture-2026-10-22/results.md`.

**Acceptance criteria covered**: AC-1, AC-2, AC-3, AC-4; BUG-0009

---

## Acceptance Criteria Results

| # | Criterion (summary; exact text in the story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1/2 | KIT lines read as specified per kind. No line on contracts without those kinds. | PASS | The DOM holds the sentence-case strings. The row renders them uppercase via `.mb-obj-kit` (owner ruling). |
| AC-3 | Brief objectives equal the deployed mission's objectives. | PASS | Checked on an injected SABOTAGE contract and on Rust Haven reached through the UI at intel 1. Reclient/Expedite is covered by `kitLine.test.ts` only, with no manual case. |
| AC-4 | Nothing clips or truncates at 90/100/110/125. | PASS | All 28 grid cells pass. Rust Haven at 110/125 is readable after the dossier column scrolls. |
| BUG-0009 | MODERATE does not run into ETA RESPONSE at 125. | PASS — Verified Fixed | TC-01 to TC-06, including the bug's own UI repro with no store assists. |

---

## Screenshots / Video

The files are in `production/qa/evidence/if-015/recapture-2026-10-22/` and `production/qa/evidence/bug-0009-verify-2026-10-22/`, both confirmed on disk. The retained pre-fix captures in `production/qa/evidence/if-015/` are unchanged.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `recapture-2026-10-22/m0{1,2,3}-brief-{90,100,110,125}.png` | Authored Briefs at four scales, post-fix | AC-1, AC-4 |
| 2 | `recapture-2026-10-22/{seizure,extraction,sabotage,suppression}-brief-*.png` | One generated contract per type | AC-1, AC-2, AC-4 |
| 3 | `recapture-2026-10-22/sabotage-deployed-hud-objectives-100.png` | Deployed HUD objectives equal the Brief | AC-3 |
| 4 | `bug-0009-verify-2026-10-22/moderate-threat-box-{110,125}.png`, `m03-{110,125}-{fold,scrolled}.png` | Threat box wrapped, no overlap; objectives readable | BUG-0009, AC-4 |
| 5 | `bug-0009-verify-2026-10-22/real-m03-brief-{110,125}.png`, `real-m03-threat-{110,125}.png` | Bug repro through the UI, no assists | BUG-0009 |

---

## Test Conditions

- **Game state at start**: harness runs cleared localStorage, started a New Operation, set intel 3 and injected generated contracts (all HIGH, one shared seed, so every one is named COLD MERIDIAN). The UI runs used real intel 1 with no store assists.
- **Platform / hardware**: macOS arm64, headless Chrome for Testing, 1280×720.
- **Framerate during test**: not measured here.
- **Any special setup required**: Settings can only be reached from the Menu, so the UI runs went Menu, Settings, CONTINUE.

---

## Observations

- The bottom row of the tactical-map stats rail sits under the rail's fade on most captures. The rail scrolls (`overflow-y: auto`) and every stat is readable after scrolling, checked on Rust Haven at 125 only.
- The MODERATE threat row now wraps at 110, a layout change from the BUG-0009 fix, with no overlap.
- Not covered: the intel-2 gate for Glass Veil and Hollow Crown (the harness sets intel 3; IF013-20/21 covers it), MODERATE generated contracts, and resolutions other than 1280×720.

---

## Sign-Off

A UI story is closed by the retained screenshots above. A sign-off here is welcome but not required.

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | | | [ ] Approved |

---

*Template: `.claude/docs/templates/test-evidence.md`*
