# IF-027 — Ink Dim text on the World Network moves to Ink — execution results

**Story type**: UI | **Gate**: BLOCKING | **Build**: HEAD `131a5c1` | **Date**: 2026-10-24 | **Tester**: qa-tester (Claude)
**Cases**: `production/qa/test-cases/if-027-ink-dim-text-on-the-world-network-moves-to-ink-cases.md`
**Environment**: dev server http://localhost:4200 (already running; not started or stopped by this run). Headless Chrome for Testing via playwright-core, 1280x720, high contrast off, text scale 100.
**Hand-walk script**: `handwalk.mjs` (launch block, `HELPERS` and fixtures copied verbatim from `production/qa/evidence/sprint-011/probe.mjs`; the copy needed probe line 61, the closing `}` of `check`). Log: `run.log`; all measured runs per state: `runs-dump.json`. No console or page errors (`run.log` last line).

| Case | AC | Coverage | Actual Result | Result |
|---|---|---|---|---|
| TC-IF027-01 | AC-1 | R1 check | `r1-probe/probe-output.txt`: all 11 lines read PASS, e.g. line 4 `PASS IF-027 opening-card: no text in Ink Dim` ... line 54 `PASS IF-027 intel2: no text in Ink Dim`. Run ends `no console or page errors` / `ALL PASS`; `r1-probe/run.log` ends `R1 exit 0`. 11 `state-*.png` captures, each 1280 x 720 (checked with `file`). | PASS |
| TC-IF027-02 | AC-1 | R1 check | All 11 lines PASS. Minimum per state: opening-card 6.42, opening 6.42, garrison-secure 6.42, garrison-strained 6.42, garrison-critical 6.42, pressure 6.42, crisis 6.42, review 6.42, failed 4.83, influence-note 6.42, intel2 6.42 (lines 6–56, e.g. line 46 `PASS IF-027 failed: every text run >= 4.5:1 as rendered // min 4.83:1`). No FAIL, so the step 3 settled re-measure was not triggered. | PASS |
| TC-IF027-03 | AC-1 | Hand-walk | Every target that was present is `rgb(184, 216, 207)`, alpha 1, and ≥4.5:1. Lowest ratio of any target: 12.68:1 (`run.log` `TC03 targets not Ink or <4.5: 0`). Measured: sector reading CONTROL/UNREST labels (12, 12.68–13.04:1); `.wm-cu` CONTROL/UNREST labels; 7 `.kv` labels in each of the 7 sectors; `TAX PAID` `NO // NOT NEXUS-HELD` (eu, sa, af, as, oc, an; 12.68:1); Influence status words that are not ACTIVE/CLEAR (na, sa, eu, af, as, oc); `EVENT FORECAST` (opening and intel2); gate `REQUIRES INTEL LVL 2` (`.wm-fc-lock.dim`, 12.68:1); `TYPE // CITY` on the open row (eu: `SABOTAGE // OSLO`, the generated offer; na); contract chips including `GENERATED`, `CHANCE`, `ETA`, `EXPIRY` (eu: 12 runs; na, as); `SECTOR UNDER PASSIVE MONITORING` (sa, af, oc, an); `CLOCK SPEED`; Control key head `SECTORS`; 6 `.wm-key-name`; `SAT-16E // LIVE`; the focus holder name `.wm-ov.tc .dim` (all 7 sectors); `.screen-sub`. **Absent, recorded, not passed**: the contracts `n / m` count (my text matcher `^\d+ / \d+$` found nothing in any sector; I did not check whether it renders under another form); `FEED CLEAR` (opening/eu; the Feed was not clear); the forecast gate at intel 2 (absent, as the case expects). The generated offer is posted in Europe (store `contracts[0].sector: "eu"`, Oslo). Captures: `if-027-ink-runs-opening.png`, `if-027-ink-runs-intel2.png`. | PASS WITH NOTES |
| TC-IF027-04 | AC-1, edge case | Hand-walk | `opening`: the start Influence read 0 (`TC04 opening influence: 0`) and the eu actions were already disabled, so the `influence: 0` assist was not needed. 3 disabled buttons: `UNAFFORDABLE` `rgb(184, 216, 207)` alpha 1, 12.68:1. Opacity is 1 on the status word, `.wm-act-sub`, `.wm-act` and every ancestor checked. `influence-note`: 1 enabled (`CLEAR`, out of scope, Ink 13.04:1) and 2 disabled (`UNAFFORDABLE`, `NO TARGET`; Ink, alpha 1, 12.68:1). 5 disabled buttons measured; 0 out of spec. The 1.4.3 exemption was not needed. Captures: `if-027-influence-disabled.png`, `if-027-influence-note.png`. | PASS |
| TC-IF027-05 | AC-1 | Hand-walk | Step 1: SVG text under `.screen` = 0, in both opening and intel2. Step 2: visible text outside `.screen` = 0, in both states. Step 3: 4 `.tip` nodes, all globe contract markers (`button.globe-marker`, 16x16). After `page.mouse.move` to each marker's centre the tip's own opacity stayed **0**, so 0 tip runs were measured in either state. The tip text was **not observed**, and no `if-027-tip-hover.png` was taken. This is a defect in my script's hover, not something blocking the run. It can be run now. | INCOMPLETE (steps 1, 2, 4 PASS; step 3 and capture unobserved, so not PASS) |
| TC-IF027-06 | AC-2 | Hand-walk | `src/index.css:17` `--ink-dim: #5d7d75;` and `:52` `--ink-dim: #9dc3b8;` (high contrast); nothing else. `src/ui/tokens.ts:20` `export const INK_DIM = '#5d7d75'`. `git diff 05c7bd7^ 131a5c1` touches no `--ink-dim` / `INK_DIM` declaration. The only matching changed line is `-export const INK_DIM_A9 = 'rgba(93, 125, 117, 0.9)'` (alpha variant, removed in IF-036; recorded, not counted). `INK_DIM_A7`/`A8` remain as context lines. Both files are clean in the working tree. AC-2 clauses ".dim/.chip.dim scoped to World Network" and "other Screens unchanged": **SUPERSEDED** by IF-036 (decision-log line 387), not tested. | PASS (scoping clauses SUPERSEDED) |

## Per-AC

- **AC-1**: TC-01 PASS, TC-02 PASS, TC-03 PASS WITH NOTES, TC-04 PASS, TC-05 INCOMPLETE (hover tips not observed).
- **AC-2**: PASS for the token clause. The scoping and "other Screens unchanged" clauses are SUPERSEDED (IF-036).

## Notes

- The contracts `n / m` count was never matched in any sector, so it is not evidenced. It may be absent from the panel or written in a form my regex missed. Not checked.
- `FEED CLEAR` did not appear in `opening`, so its colour was not measured in this run.
- In `influence-note` the orientation card was still up after the fixture's `markSeen`. The script clicked UNDERSTOOD (`run.log`: `card still up: clicking UNDERSTOOD`) and measured after that. In every other state the card was gone after `dismissCard()`.
- The R1 minimum in `failed` is 4.83:1. That passes. The run does not name which run it is (not IF-027 Ink; every Ink target here is ≥12.68:1).
- The session scratchpad is shared with other agents, which overwrote my first assembled copy. The script was rebuilt from probe.mjs; the shipped `handwalk.mjs` is the version that ran.

## Story verdict

**FAIL is not observed. Verdict: PASS WITH NOTES is withheld until TC-IF027-05 step 3 is completed.** Current status: **INCOMPLETE**. Every observed AC-1 and AC-2 measurement passes, but the hover-tip text (TC-05 step 3, and its capture) was not observed. Unobserved does not count as PASS.

## qa-lead ruling (orchestrator, 2026-10-24)
TC-IF027-05 step 3 is resolved as **PASS (N/A: no visible tip text)**. The hover was performed and the tip's computed opacity stayed 0 on all 4 globe markers. That is the observation: `.globe-marker:hover .tip` (src/ui/ui.css:4541) sets no opacity, so a globe tip is never drawn, the same finding as IF-017 (production/qa/evidence/sprint-011-head-2026-10-24/if-017/results.md). Text that is not drawn has no contrast to fail. The spec does not rely on marker tips (design/ux/world-network.md:391), so the missing hover tip is an observation, not a defect.
Story verdict: **PASS WITH NOTES**.
