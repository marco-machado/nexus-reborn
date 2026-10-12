# IF-011 evidence — Pyrrhic win banner and failed-campaign Debrief actions

**Date:** 2026-10-12 · **Revision:** 3023990 + uncommitted IF-011 working tree (`src/ui/debriefFlags.ts`, `src/ui/debriefFlags.test.ts`, `src/ui/index.tsx`, `src/ui/ui.css`)
**Environment:** `npm run dev -- --strictPort` (port 4200), headless Chrome for Testing (Playwright chromium-1247), viewport 1280×720, fresh browser context per capture (clean save).
**Partial click-through:** Debrief screen only (click-through step 5 inspect + step 6 layout). No mission was played. Server stopped afterwards, and port 4200 had no listener.

## Fixture seeding

For each capture, the script loads the app. It then sets the text scale and seeds the owner state through the Vite dev module graph. For a wipe fixture, that state is `campaignStore.operatives = [first operative]` and `deadIds = [that id]`. It sets `appStore.missionId = MISSIONS[0].id` (authored) and calls `appStore.setOutcome(...)` with `applyKey = lastAppliedKey + 1`. Debrief's own `applyDebrief` then runs, so `campaignFailed` comes from `campaignStore.reportMission`. Nothing is set by hand.

| Fixture | Outcome | Roster after | `campaignFailed` |
|---|---|---|---|
| `pyrrhic-win` | Win, 1 KIA (whole roster) | empty | true |
| `win` | Win, no casualties | intact | false |
| `failed-loss` | Loss, 1 KIA (whole roster) | empty | true |
| `loss` | Loss, no casualties | intact | false |

## Observations (measured in DOM + read from screenshots)

| Fixture | Scales | First child of `.db-card` | Banner font / title font | Invoice note | PAYOUT | Actions |
|---|---|---|---|---|---|---|
| pyrrhic-win | 90/100/110/125 | `.db-failed` "CAMPAIGN FAILED" (top 38px, bottom 102px) | 42px / 42px | `PYRRHIC — SQUAD LOST // CAMPAIGN FAILED` | +40,000 CR (= `netPayout`) | Return, Balance — **no Replay** |
| win | 90/100/110/125 | `.db-tag` | — | none | +40,000 CR | Return, **Replay**, Balance |
| failed-loss | 90/100/110/125 | `.db-failed` "CAMPAIGN FAILED" | 42px / 42px | none (win-only) | 0 CR | Return, Balance — **no Replay** |
| loss | 100 | `.db-tag` | — | none | 0 CR | Return, **Replay**, Balance |

- At every scale the banner sits fully inside the viewport and is not clipped (`scrollWidth`/`scrollHeight` ≤ client size). There is no page scroll.
- **Layout fix (approved):** before this fix, the pyrrhic card overflowed 720px at 110 (16px) and 125 (45px), which pushed the banner off the top. The plain Win already overflowed by 5px at 125 before this story. `.db-card` is now capped at the screen height, and `.db-rows` is the only region that shrinks and scrolls. On the pyrrhic and win fixtures at 125, the invoice scrolls internally, and PAYOUT and the note are below the fold inside the invoice. The banner, title and actions stay on screen.
- Console: one `404 (Not Found)` resource error on the first capture only (pyrrhic-win, 90). It's from a fresh-context asset request and unrelated to Debrief. The other 12 captures had no errors.

## Files

`if-011-<fixture>-1280x720.png` (100%) and `if-011-<fixture>-text{90,110,125}-1280x720.png`, 13 images.

---

## Re-capture — 2026-10-12, /team-qa sprint (MC-1)

**Revision:** 879bb68 (includes 27fd76f, f777b18, 96b9b05), `src/` clean. Same environment and seeding as above; all four fixtures at all four scales, so 16 images. The three loss scale captures `if-011-loss-text{90,110,125}-1280x720.png` are new. All 13 earlier images were overwritten.

| Fixture | Scales | First child | Banner top–bottom (90/100/110/125) | Banner / title | Focus on entry | Tab → | NOTE | PAYOUT | Actions |
|---|---|---|---|---|---|---|---|---|---|
| pyrrhic-win | all | `.db-failed` | 74–138 / 63–127 / 48–112 / 38–102 | 42px / 42px | `.db-failed` (alert, tabIndex −1) | `.db-rows` | `PYRRHIC — SQUAD LOST // CAMPAIGN FAILED` | +85,000 CR | Return, Balance (no Replay) |
| win | all | `.db-tag` | — | — / 42px | body | `.db-rows` | none | +85,000 CR | Return, Replay, Balance |
| failed-loss | all | `.db-failed` | 99–163 / 90–154 / 76–140 / 63–127 | 42px / 42px | `.db-failed` | `.db-rows` | none | 0 CR | Return, Balance (no Replay) |
| loss | all | `.db-tag` | — | — / 42px | body | `.db-rows` | none | 0 CR | Return, Replay, Balance |

- None of the 16 captures has a page scroll, and `.db-card` stays inside 720px on all of them. There were 0 console errors.
- AC30 is now evidenced for the loss fixture at all four scales.
- Cases: `production/qa/test-cases/if-011-pyrrhic-win-banner-cases.md` (TC01–TC09 PASS).
