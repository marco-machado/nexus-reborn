# IF-030 — Idle nav tab labels reach 4.5:1 in both modes: execution results

**Story type**: UI | **Gate level**: BLOCKING | **Build**: HEAD `131a5c1` (uncommitted src changes: three test files not imported by the app)
**Cases**: `production/qa/test-cases/if-030-idle-nav-tab-labels-reach-4-5-in-both-modes-cases.md`
**Executed**: 2026-10-24, qa-tester (`/team-qa` Sprint 11 Phase 5)
**Run conditions**: dev server on `http://localhost:4200` (already running; not started or stopped by this run). Headless Chrome for Testing via playwright-core, viewport 1280x720.
**Evidence**:
- Covered cases: `../r1-probe/run.log` (fresh R1 at HEAD, 152/152 PASS), PNGs `../r1-probe/if-030-nav-{world,research,brief,team}-hc.png`.
- Hand-walk script: `if030.mjs` (probe.mjs lines 22–35, 47–61 and HELPERS/fixtures 63–354 copied; OUT = this folder). Output `run.log` (`# 0 FAIL`, `# errors: none`), PNGs `if-030-brief-open-{world,research,team}-hc.png`.
- First-visit card: `dismissCard()` (markSeen) took it down on every fixture; the UNDERSTOOD fallback never fired (`card still up` count in run.log = 0).

## Results

| Case | AC | Coverage | Actual Result | Result |
|---|---|---|---|---|
| IF030-TC-01 | AC-1 | R1 | r1 line 115: `PASS IF-030 World Network default: idle labels >= 4.5:1` — RESEARCH, BRIEF, ASSEMBLY, each `rgb(184, 216, 207)` 12.68, all `"active":false`. Line 117: `PASS IF-030 World Network high contrast: idle labels >= 4.5:1` — same 3 labels `rgb(226, 246, 238)` 17.18. WORLD NETWORK not in the idle set (line 116: it is the active tab). Capture `if-030-nav-world-hc.png` present in r1-probe. | PASS |
| IF030-TC-02 | AC-1 | R1 | Line 121: `PASS IF-030 Research default: idle labels >= 4.5:1` — WORLD NETWORK, BRIEF, ASSEMBLY 12.68. Line 123: `PASS IF-030 Research high contrast: idle labels >= 4.5:1` — same 3 at 17.18. RESEARCH excluded (line 122 active). | PASS |
| IF030-TC-03 | AC-1 | R1 | Line 127: `PASS IF-030 Brief default: idle labels >= 4.5:1` — WORLD NETWORK, RESEARCH, ASSEMBLY 12.68. Line 129: `PASS IF-030 Brief high contrast: idle labels >= 4.5:1` — 17.18. BRIEF excluded (line 128 active). | PASS |
| IF030-TC-04 | AC-1 | R1 | Line 133: `PASS IF-030 Assembly default: idle labels >= 4.5:1` — WORLD NETWORK, RESEARCH, BRIEF 12.68. Line 135: `PASS IF-030 Assembly high contrast: idle labels >= 4.5:1` — 17.18. ASSEMBLY excluded (line 134 active). | PASS |
| IF030-TC-05 | AC-1 (Brief unlocked), AC-2 | Hand-walk | `opening` fixture + `selectMission('m03')`; selection retained across `goto`. On World Network, Research and Assembly, both modes: phase and `s-high-contrast` class matched; BRIEF tab `cls "navtab"`, not locked, not active, `aria-disabled` null; 3 idle labels each 12.68 default (`rgb(184, 216, 207)`) and 17.18 HC (`rgb(226, 246, 238)`); every idle label colour differs default -> HC; exactly one `aria-current="page"` and it is the `.active` tab (WORLD NETWORK / RESEARCH / ASSEMBLY). 27/27 checks PASS in `run.log`. Captures `if-030-brief-open-{world,research,team}-hc.png`. | PASS |
| IF030-TC-06 | AC-1 (observation) | Hand-walk | `.navtab.locked .navtab-cond` text `NO CONTRACT SELECTED` on all 3 Screens x 2 modes; every reading identical: colour `rgb(255, 107, 85)`, font-size `10px`, alpha 1, ratio **6.9:1**, in default and in high contrast (World Network, Research, Assembly). All six readings recorded. | PASS |
| IF030-TC-07 | AC-2 (remap) | R1 | Lines 119, 125, 131, 137: `PASS IF-030 <World Network/Research/Brief/Assembly>: idle labels take the high-contrast remap` — each `{"false":["rgb(184, 216, 207)" x3],"true":["rgb(226, 246, 238)" x3]}`. Values match the expected `--ink` default `#b8d8cf` and HC `#e2f6ee`. | PASS |
| IF030-TC-08 | AC-2 (aria-current) | R1 | Lines 116, 118, 122, 124, 128, 130, 134, 136 (8/8): `PASS IF-030 <Screen> <default/high contrast>: one tab aria-current="page"`, each listing a single tab with `"active":true,"current":"page"` whose label is the current Screen. | PASS |
| IF030-TC-09 | AC-2 (cause in commit message) | Hand-walk (git) | `git log --all -i -E --grep='nav\|high-contrast\|remap'` lists 05c7bd7 (and older unrelated commits). `05c7bd7` full message, matching lines verbatim: line 15 `(token unchanged elsewhere); Ink Faint off text; nav labels in Ink; locked`; line 20 `nav high-contrast row corrected (the earlier reading was a measurement error).` Case steps 1–4: `--grep=IF-030` -> only bb17de2 (QA plan, no cause); story file touched by 05c7bd7, bb17de2, 8605d32, 527dbb5; repo-wide `high.contrast\|remap\|measurement error` sweep -> 131a5c1, ab1cf1e, 03f7584 mention high contrast generically, none about nav labels. The message names the measurement-error finding for the nav high-contrast reading, so (a) and (b) are met. It does not state the as-built values or that the real failure was 4.29:1 in default mode. | PASS WITH NOTES |

## Notes

1. **TC-09 (process)**: 05c7bd7 records the finding ("the earlier reading was a measurement error") and the fix ("nav labels in Ink") but not the measured values from the Completion Notes (`rgb(93,125,117)` -> `rgb(157,195,184)` under HC; real failure 4.29:1 default). "nav high-contrast row" refers to the spec row, not explicitly "idle labels"; it does not name the locked row, so the CONCERN clause was not applied. Strategy F7's "no match" came from searching "high contrast" with a space: the message spells it "high-contrast".
2. **TC-06 observation (no threshold applies)**: `NO CONTRACT SELECTED` is 6.9:1 at 10 px in Red Hot `rgb(255, 107, 85)` and does not change under high contrast (same colour in both modes). Above 4.5:1; recorded for qa-lead.
3. **TC-01/02/04 locked-Brief preconditions**: the R1 log lines do not print the `locked` class. The same `opening` fixture in this hand-walk (TC-06) observed the Brief tab locked with `NO CONTRACT SELECTED` on World Network, Research and Assembly, which backs up the precondition.
4. The cases file's teardown step (stop the dev server) was not done: the caller said not to start or stop the server. The browser was closed by the script.

## Story verdict

**PASS WITH NOTES** — AC-1 PASS (TC-01 to TC-06), AC-2 PASS (TC-05, TC-07, TC-08). The TC-09 commit-message process check passes with notes.
