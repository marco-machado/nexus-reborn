# QA Strategy: Sprint 002 (World Network director loop)

Date: 2026-10-13 | Config: qa.level standard, automation autonomous, team.size individual
Baseline rev: 41febe7 (working tree has uncommitted globe changes, see Smoke Check)
Classification source: production/qa/qa-plan-sprint-002-2026-10-12.md

## Test Summary

| Story | Type | Automated Required | Manual Required | Blocker? |
|-------|------|--------------------|-----------------|----------|
| WN-005 Quiet replay awards nothing | Logic | Yes: campaignStore, worldStore, contracts tests | No | No (colocated tests exist per smoke 770/770) |
| WN-008 Influence wallet income | Logic | Yes: influence, worldStore tests | No | No |
| WN-009 Stabilize/Expedite refusals | Logic | Yes: influence, worldStore tests | No | No |
| WN-010 Stabilize staged effect, six hourly steps | Logic | Yes: worldStore tests | No | No |
| WN-011 Intel progress awards | Logic | Yes: campaignStore tests | No | No |
| WN-018 Campaign complete/failed banners | Integration (secondary UI) | Yes: campaignStore, appStore integration; debriefFlags regression | Yes: banner screenshots (2 PNGs present) | Evidence STALE risk, see below |
| WN-017 Opening desk, post-win Scan | Integration (secondary UI) | Yes: worldStore t0 write-back | Yes: opening desk + header screenshots (4 PNGs + in-app dir) | Evidence STALE risk, see below |
| WN-012 Event forecast gated on Intel | UI | No | Yes: screenshot per screen (3 PNGs) | Evidence STALE (map replaced) |
| WN-013 Antarctica hidden, Focus cycle, Tax figure | UI | No | Yes (2 PNGs) | Evidence STALE (map replaced) |
| WN-014 Scan hides contracts above Intel, Chance prints | UI | No (store read for "record remains" clause) | Yes (3 PNGs) | Evidence STALE (map replaced) |
| WN-019 Campaign flag edge cases | Logic | Yes: campaignStore, save tests | No | No |

No missing acceptance criteria were found in the classification source. I did not re-read the individual story files for this strategy, so criteria testability is not re-assessed here.

## Evidence directory check (ls only)

All present under production/qa/evidence/, each with README.md plus PNGs:
- wn-012: 3 PNG; wn-013: 2 PNG; wn-014: 3 PNG (+ drive.mjs)
- wn-017: 4 PNG (+ in-app/, drive.mjs); wn-018: 2 PNG; wn-019: 2 PNG (+ drive.mjs)
- world-globe-2026-10-13: 3 JPG (antarctica-1280, europe-1280, world-network-globe), untied to any story

production/qa/bugs/ does not exist.

## Evidence validity vs. the uncommitted globe work

Verified from `git diff`: src/ui/WorldMap.tsx now lazy-loads WorldGlobe and no longer renders the SVG map, territory polygons, or layoutScanMarks/visibleScanMarks marks (205 lines changed, mostly removed). atlas.ts, scanTerritories.ts, ui.css, tokens.ts also changed.

- WN-012, WN-013, WN-014 screenshots show the old flat Scan map (Antarctica hidden, Scan marks hidden by Intel). That rendering path is gone from the working tree, so these PNGs no longer evidence the current UI. Judgment: INVALID for the working tree; still valid for commit 41febe7.
- WN-017 and WN-018 screenshots of the header, overlay and banners: partly outside the changed component, but they were captured with the old map behind them. Judgment: re-capture the World Network screen shots; Debrief-only shots unaffected.
- WN-014 additionally depends on filtering moving into WorldMap.tsx `operations` (gen === null || not locked). Logic is now in a React useMemo with no stated unit test; the filter and the gate must be re-verified.
- Behavioural criteria (Antarctica hidden, locked contracts hidden, forecast gating) have no automated coverage in the new globe path that I verified. atlas.test.ts and globeLabels.test.ts were modified/added; I did not read them to confirm they cover these criteria.

## Smoke Check

PASS WITH WARNINGS. production/qa/smoke-2026-10-13.md reports PASS (770/770 vitest, build OK, 10/10 critical paths) at rev 41febe7, but it states "no source changes" while the working tree has uncommitted changes to WorldMap.tsx, atlas.ts, scanTerritories.ts, tokens.ts, ui.css, atlas/contracts tests and new WorldGlobe.tsx, globeLabels.ts, geography.ts, sectorOutlines.ts. The report is stale against the working tree. Re-run /smoke-check before any manual QA hand-off of the globe build.

## Open bugs

None on file (production/qa/bugs/ does not exist). Note this is an absent record, not a verified-clean one; no bugs have ever been filed through /bug-report.

## Manual session estimate (individual, 1 tester)

- Session 1 (~45 min): re-capture WN-012/013/014 on the globe at 1280x720 across Intel 1/2/3 (about 8 screenshots); verify WN-014 hidden record remains via store read.
- Session 2 (~30 min): re-capture WN-017 (opening desk, header Influence 8) and WN-018 (complete/failed banners) over the globe.
- Session 3 (~30 min, optional but recommended): globe exploratory pass (rotation, Antarctica, Europe labels, lazy-load fallback, WebGL2 fallback). No story covers it.
- Total: 2 required sessions, about 1.25 h, plus a smoke re-run.
- Logic stories (WN-005/008/009/010/011/019): zero manual sessions.

## Gate verdict (qa.level standard)

- Logic/Integration automated evidence gate: MET per smoke report (not independently re-run in this strategy).
- UI screenshot gate (BLOCKING): NOT MET for the working tree for WN-012/013/014 (and likely 017/018) if the globe is shipped with the sprint. MET if the sprint is closed at commit 41febe7 with the globe work held out.

## Recommended path

1. Decide: land the globe in sprint-002 or split it into its own story/sprint (it has no story ID or acceptance criteria today).
2. If landed: run /smoke-check, re-capture the evidence above, add a unit test for the operations filter (hidden contracts, Antarctica).
3. If held back: stash/branch the globe work and sign off sprint-002 at 41febe7.
