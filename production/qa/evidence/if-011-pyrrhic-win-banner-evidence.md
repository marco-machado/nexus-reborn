# Test Evidence: IF-011 Pyrrhic win banner and failed-campaign Debrief actions

> **Story**: `production/epics/interface/story-011-pyrrhic-win-banner-and-failed-campaign-debrief-actions.md`
> **Story Type**: UI
> **Date**: 2026-10-12
> **Tester**: Claude (headless Chrome, /team-qa sprint, MC-1)
> **Build / Commit**: 879bb68

---

## What Was Tested

The Debrief was tested with four owner-state fixtures (pyrrhic win, plain win, failed-campaign loss, plain loss), each at text scales 90, 100, 110 and 125 at 1280×720. The checks covered:
- the CAMPAIGN FAILED banner's order, size and focus;
- the pyrrhic invoice note and the unchanged payout;
- Replay showing or hiding with `campaignFailed`;
- no clipping and no page scroll.

**Acceptance criteria covered**: AC29, AC30

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC29 | The pyrrhic fixture shows the CAMPAIGN FAILED banner above the invoice, first and visually dominant. Its note reads `PYRRHIC — SQUAD LOST // CAMPAIGN FAILED`, with the full net payout unchanged. The non-pyrrhic fixture shows neither. | PASS | The banner is the first child, 42px (the title is 42px). The payout is +85,000 CR, the same as the plain win. Focus lands on the banner on entry (96b9b05). |
| AC30 | On a failed campaign there is no Replay and World Network return is available. On a non-failed authored Debrief, Replay is present. | PASS | Pyrrhic-win and failed-loss show Return and Balance. Win and loss also show Replay. Holds at all 4 scales. |

---

## Screenshots / Video

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `if-011/if-011-pyrrhic-win-1280x720.png` (+ `-text90/110/125`) | Banner first, pyrrhic note, payout, no Replay | AC29, AC30 |
| 2 | `if-011/if-011-win-1280x720.png` (+ `-text90/110/125`) | No banner, no note, Replay present | AC29, AC30 |
| 3 | `if-011/if-011-failed-loss-1280x720.png` (+ `-text90/110/125`) | Banner, no note, 0 CR, no Replay | AC30 |
| 4 | `if-011/if-011-loss-1280x720.png` (+ `-text90/110/125`) | No banner, Replay present | AC30 |

---

## Test Conditions

- **Game state at start**: A fresh browser context each time (clean save). The fixture is seeded through the Vite module graph per `if-011/README.md`, and Debrief's own `applyDebrief` sets `campaignFailed`.
- **Platform / hardware**: macOS, headless Chrome for Testing (Playwright chromium-1247), 1280×720
- **Framerate during test**: not measured (static screen)
- **Any special setup required**: `npm run dev -- --strictPort --port 4200`. The server was stopped afterwards and the port is free.

---

## Observations

- At scale 125 the invoice scrolls inside `.db-rows`, which is the approved layout fix in the README. The page itself never scrolls.
- The light focus ring on the banner is the browser's focus outline from the 96b9b05 focus call. The banner border is the existing red rgba.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | | | [ ] Approved |
