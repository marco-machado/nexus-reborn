# BUG-0011 fix verification, 2026-10-25 (IF-036 TC-036-22 re-walk)

**Change under test**: `.ts-stats` stat tiles reflowed from four across to 2 by 2 (`src/ui/ui.css`), `overflow-wrap: anywhere` removed from `.ts-stats label`. Label copy unchanged.
**Harness**: headless Chrome for Testing via `playwright-core`, exactly 1280x720, this worktree's dev server on http://localhost:4312/ (`npx vite --port 4312 --strictPort`). Never the in-app pane or the user's Chrome. Harness assists are named in each script header.

## Files

- `linebox.mjs`: for every `.ts-stats` label at text scale 90 / 100 / 110 / 125, default and high contrast, counts `Range.getClientRects()` line boxes over the label text (1 = one line), records text width vs tile inner width, overflow, and whether the dossier list (`.ts-detail-list`) still scrolls. Output: `linebox-output.txt`, `linebox.json`, `stats-<scale>.png`, `stats-hc-<scale>.png` (stat tiles scrolled into view).
- `sweep-output.txt`, `sweep-team.json`, `team-{90,100,110,125,hc}.png`: `SURFACES=team node production/qa/evidence/screens-2026-10-23/sweep.mjs` run with `PROBE_URL=http://localhost:4312/` and `PROBE_OUT` set to this folder (script unchanged).

## Result

| Scale | HLTH | STAMINA | FOCUS | MOBILITY (text / tile inner) | Dossier scrolls |
|---|---|---|---|---|---|
| 90 | 1 | 1 | 1 | 1 (46.2 / 119 px, 9 px) | yes (432 of 656 px) |
| 100 | 1 | 1 | 1 | 1 (51.4 / 119 px, 10 px) | yes (428 of 687 px) |
| 110 | 1 | 1 | 1 | 1 (56.5 / 125 px, 11 px) | yes (404 of 736 px) |
| 125 | 1 | 1 | 1 | 1 (64.2 / 146 px, 12.5 px) | yes (345 of 797 px) |

High contrast: identical counts and widths. No label overflows its tile. No page errors.

Team sweep: 225 runs, 32 targets; <10 px 0; <4.5:1 default 0, high contrast 0; Ink Dim 0, Ink Faint 0; label-in-name 0; targets <24 0; clip @90 / @100 / @110 / @125: 0 / 0 / 0 / 0; 24 tab stops.

Before the fix (`production/qa/evidence/sprint-011-head-2026-10-24/if-036/results.md`): `MOBILITY` was 2 line boxes at 100, 110 and 125 in a tile about 50 px wide.

## Not exercised

- Resolutions other than 1280x720; non-English labels (at 125% a tile has 146 px of room against 64 px for `MOBILITY`, about 2.3x; a +40% label is not measured).
- The Recruitment Market and non-default Assembly states.
