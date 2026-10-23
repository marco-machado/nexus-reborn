# Story 039: Brief, Assembly, Debrief and Abort say what actually happens

> **Epic**: Interface
> **Status**: Complete
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-23

## Context

**GDD**: `design/gdd/interface.md` (Rule 12 Abort; Screens table); UX specs `design/ux/brief.md` (OQ7, OQ11), `assembly.md`, `debrief.md`
**Requirement**: `TR-interface-002` (no clipping; critical state never colour-only), `TR-interface-006` (two-step Abort)
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: agent playtests 2–4: the Brief printed `COLLATERAL TOLERANCE: LOW (10%)` on every contract while its notes said MODERATE, and no percentage tolerance exists (collateral is 5,000 CR per hit, capped at the reward); a four-step contract printed TERTIARY twice; "ETA 4D" read as travel; Assembly did not name the contract and the slot cycle was found by trial; a KIA was "just a red name"; the Abort confirm said only "PRESS AGAIN WITHIN 3 S". At 125% text, MISSION DIRECTIVES // SABOTAGE ran off the panel and the screen.

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer
**Secondary ADRs**: ADR-0002: A mission in progress is not saved (what Abort discards)
**ADR Decision Summary**: One palette; Screens at 1280×720 and four text scales without clipping; critical state never colour-only.
**ADR Version**: 2026-09-10
**Engine**: React 19.2.8 + Vite 6.4.3 | **Risk**: LOW | **Engine Notes**: DOM and CSS only.

**Control Manifest Rules (this layer)**:
- Required: palette tokens only; Ledger Amber for money only; no overlap or clipping at four text scales.

---

## Acceptance Criteria

- [x] GIVEN any Brief WHEN it prints THEN the collateral box reads `COLLATERAL: 5,000 CR PER CIVILIAN HIT // CAPPED AT THE REWARD` (the figure from `COLLATERAL_FINE`) with no meter or percentage, contract notes say `EVERY CIVILIAN HIT IS BILLED.`, the reward block adds `A WIN SPENDS n DAYS OF WORLD TIME`, and required steps are numbered PRIMARY, SECONDARY, TERTIARY, QUATERNARY.
- [x] GIVEN Assembly WHEN it prints THEN the deploy line names the contract (`<CODENAME> // A WIN SPENDS n DAYS OF WORLD TIME`) and the loadout reads `CLICK A SLOT TO CYCLE: EMPTY > MED KIT > POWER CELL`.
- [x] GIVEN a Debrief with deaths WHEN it prints THEN each KIA is its own row `KIA // <CODENAME>` with `n XP LOST // ROSTER r/cap`.
- [x] GIVEN Abort armed WHEN the hint shows THEN it reads `PRESS AGAIN WITHIN 3 S TO ABORT // NO INVOICE, CONTRACT STAYS OPEN, ROSTER AS DEPLOYED`.
- [x] GIVEN the Mission HUD at 125% text WHEN a panel head is longer than its panel THEN it wraps inside the panel.

---

## Implementation Notes

- `src/ui/index.tsx` (Brief, Assembly, Debrief); `src/game/data.ts`, `src/game/contracts.ts` (notes); `src/ui/abortArm.ts`; `src/ui/debriefWorld.ts` `kiaCostRows`; `src/state/campaignStore.ts` KIA rows carry `xp`; `src/ui/ui.css` `.mb-reward-eta`, `.mb-collateral`, `.ts-loadout-hint`, `.hud-panel-head` wrap.

---

## QA Test Cases

- **AC-3**: `src/ui/debriefWorld.test.ts` "each KIA prints the experience lost and the roster left".
- **AC-4**: `src/ui/abortArm.test.ts` checks the armed hint is `ABORT_ARM_HINT`; no test pins the literal copy.
- **AC-1, AC-2, AC-5**: sweep `production/qa/evidence/playtest-fixes-2026-10-23/sweep.mjs` at 90/100/110/125% and high contrast on Brief, Assembly, Debrief, Debrief with KIA, Mission HUD: 0 failures; the new spill-host and off-screen checks were seen to fail on the HUD panel head before the CSS fix. No unit test pins the Brief and Assembly copy.

---

## Test Evidence

**Story Type**: UI
**Status**: [x] Screenshots `brief-*`, `team-*`, `debrief-*`, `debriefkia-*`, `mission-*`; `sweep-output.txt`.

---

## Dependencies

- Depends on: WN-021 (the Debrief sector rows sit beside the KIA rows)
- Unlocks: none

---

## Completion Notes
**Completed**: 2026-10-23 (code in `2c73542`; story file written after)
**Verdict**: COMPLETE
**Criteria**: 5/5
**Decision**: Claude, delegated by the owner's /goal 2026-10-23. Abort keeps escaping every ledger (living spec §19 #8, accepted); only its confirm copy changed. CD-PLAYTEST recommends the owner reopen Abort in Polish after a human playtest.
**Not done**: `/code-review` not run. "INVOICE UNFILED // COMMITS ON NEXT SCREEN" (`src/ui/filingStatus.ts`), which CD-PLAYTEST says misled the tester into thinking REPLAY undoes deaths, is not changed (Polish copy).
