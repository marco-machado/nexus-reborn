# Story 013: Four-row orientation card and the sector-panel Influence moment

> **Epic**: Interface
> **Status**: Complete
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-22

## Context

**GDD**: `design/gdd/interface.md` (States: Overlay; UI Requirements: World Network row; AC27), `design/gdd/world-network.md` (Core Rule 13; Opening desk AC), living spec §12
**Requirement**: `TR-interface-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/difficulty-curve.md` (approved 2026-10-21). Playtest 2026-10-19: the nine-row card was "too dense"; Influence actions meant nothing ("I don't even know what that is").
**Change impact**: `docs/architecture/change-impact-2026-10-21-interface.md` (notes B, G, H).

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer
**Secondary ADRs**: ADR-0011: Campaign persistence envelope (seen-set is blob content); ADR-0008: Influence is a wallet (refusal reasons are the owner's)
**ADR Decision Summary**: One palette, one remap table; overlays do not change Phase; DOM screens at 1280×720.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM / Zustand 5. Select primitives or use `useShallow`; do not use React 19.2 `<Activity>` to hide phases. Effects, not render, call store actions.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Required: disabled controls carry visible owner-reported reasons; critical state is never color-only.
- Forbidden: recomputing board rules in Interface (AC27) — affordability comes from `influenceRefusal`, never `influence >= cost`.
- Guardrail: colours from `src/ui/tokens.ts` / `src/index.css` only; 1280×720 at text scale 90–125 without clipping.

---

## Acceptance Criteria

*From GDD `design/gdd/interface.md` and `design/gdd/world-network.md`, scoped to this story:*

- [x] (AC27) GIVEN the first-visit orientation card, WHEN it is read, THEN it holds four rows — THE JOB, START HERE, STRATEGIC TIME, the four numbers — and no Influence or Research row; START HERE names the open contract with the highest Chance; Pause/Clock speed are identified as control over strategic time; Nexus-held Tax eligibility is stated.
- [x] (WN Opening desk) GIVEN New Operation, WHEN the card is dismissed with UNDERSTOOD, THEN `hint-worldmap` is marked seen once and the card does not return in that campaign.
- [x] GIVEN Influence 0 at opening, WHEN the sector panel is read, THEN Stabilize and Lobby show the owner's unaffordable reason and Expedite its no-target reason, and no teaching panel is shown.
- [x] GIVEN a clean first win (+8 Influence) and the Influence moment unseen, WHEN World Network is shown and `influenceRefusal(state, focusedSector, action) === null` for any of the three actions, THEN one teaching panel on the sector panel names the affordable action, its cost and effect; firing marks it seen (owner ruling 2026-10-22); it shows only on the sector it fired on and hides for good when the focus moves (owner ruling 2026-10-22); it never returns in that campaign, including after Influence is spent and recovers.
- [x] GIVEN Antarctica focused, WHEN the moment would otherwise fire, THEN it does not (`locked-sector` refusal).
- [x] (TR-interface-002) GIVEN the card and the teaching panel at 1280×720 and text scales 90 / 100 / 110 / 125, WHEN captured, THEN nothing clips or truncates.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Card copy lives in `src/ui/WorldMap.tsx` (the `WORLD NETWORK // ORIENTATION` panel). Cut to four rows. Row copy is the UX spec's to finalise (`/ux-design` World Network); use the GDD row names until then. START HERE reads the highest-Chance open, unlocked offer from the same list the Scan prints; it does not compute Chance itself.
- Influence moment: a new standalone seen id in `SEEN_IDS` (`src/game/tutorial.ts`, the `WORLD_ONBOARD_ID` pattern — not a `HintId`, which is toast copy). Trigger is the owner's `influenceRefusal(...) === null` on the focused sector. Mark with `useTutorialStore.markSeen` from an effect, guarded by `!seen.includes(id)`; `markSeen` currently calls `set` even when already seen and `scheduleAutosave` subscribes to the store, so an unguarded call on the 20 Hz sector panel would spam autosave (note G). Alternatively make `markSeen` return early when already seen.
- The mark happens on a Screen, so it is durable on the next autosave (ADR-0011). No envelope or `SAVE_VERSION` change; `validateSave` checks membership in `SEEN_IDS` only.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Interface story 014: the first-Debrief Research prompt (the Research row leaves the card here; the prompt arrives there).
- World Network story 020 and Economy story 023: the data that gives START HERE a Moderate contract to name. If they land later, START HERE still names the highest-Chance open offer, whatever it is.
- Sector readout labels for Control / Unrest (art bible §7.3/§7.5; gate recommendation) — a separate story if not covered by `/ux-design`.

---

## QA Test Cases

QA plan: `production/qa/qa-plan-sprint-010-2026-10-22.md`. Provisional, UI:

- Headless capture at 1280×720 × 4 text scales: card (four rows), sector panel at Influence 0, teaching panel at Influence 8 after a clean win fixture, Antarctica focused (no panel).
- Unit seam (`src/ui/*.test.ts`): the START HERE selector returns the highest-Chance unlocked offer; the teaching trigger is `influenceRefusal === null`, not a Credits/Influence compare; `markSeen` is called at most once per id.
- Store read in the click-through note: `tutorialStore.seen` holds `hint-worldmap` and the new id exactly once after dismissals.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each screen touched, in `production/qa/evidence/if-013/`, plus a click-through note naming the screens exercised (docs/click-through.md). Screens must work at 1280×720 without clipping or truncation.

**Status**: [x] Created — `production/qa/evidence/if-013/` (17 PNGs at 1280×720 × text scale 90/100/110/125, `README.md` click-through note, `capture.mjs`, `capture-output.txt` ALL PASS)

---

## Dependencies

- Depends on: World Network story 020 and Economy story 023 for the intended START HERE target (soft; the selector works without them)
- Unlocks: playtest 2 onboarding checklist (`design/difficulty-curve.md` Validation Checklist)

---

## Completion Notes
**Completed**: 2026-10-22
**Verdict**: COMPLETE WITH NOTES
**Criteria**: 6/6 passing (none deferred)
**Deviations**: None blocking. Advisory:
- AC4 wording vs implementation: the AC reads "dismiss marks it seen"; the story's Implementation Notes and change-impact note H prescribe marking from the effect, so `hint-influence` is marked seen on firing (`src/ui/WorldMap.tsx` `useInfluenceMoment`) and again (a no-op) on dismiss. Observable outcome holds (seen after dismiss, never returns); the drift is that leaving World Network with the note up also consumes the lesson. **Owner ruling 2026-10-22 (Marco Machado, Sprint 10 QA condition 2): keep on-fire marking.** The AC now reads "firing marks it seen". Leaving World Network with the note up consuming the lesson is accepted (IF013-19).
- AC3 "Expedite its no-target reason" is unreachable on the default focus (Europe) because EC-023 seeds a Europe offer and `influenceRefusal` reports no-target before unaffordable; Europe prints UNAFFORDABLE (`02-sector-panel-influence-0-*.png`), North America prints NO TARGET (`02b-sector-panel-influence-0-no-target-na-100.png`). Both are owner-reported (AC27). The AC text should name a sector without an offer.
- Player-facing copy in `src/ui/worldOnboard.ts` is string literals; the repo has no localization layer (`src/i18n` / `src/locales` absent). Pre-existing project-wide gap, not a regression.
- Scope: `src/ui/worldOnboard.ts` (new, pure copy/selector module), `src/ui/ui.css` (note styles) and the two test files are outside the three files the Implementation Notes name; all are Presentation-layer and story-required. Valid, not creep.
**Test Evidence**: UI: retained screenshots at `production/qa/evidence/if-013/` — `01-card-{90,100,110,125}.png`, `02-sector-panel-influence-0-{90,100,110,125}.png`, `02b-sector-panel-influence-0-no-target-na-100.png`, `03-influence-moment-{90,100,110,125}.png`, `04-antarctica-focused-{90,100,110,125}.png`; click-through note `README.md`; `capture-output.txt` ALL PASS, no console or page errors. Unit seams: `src/ui/worldOnboard.test.ts`, `src/state/tutorialStore.test.ts`. Run result: OBSERVED (dev-story checkpoint; images opened at /story-done: 01-card-100/125, 02-…-100, 02b, 03-…-100/125, 04-…-100).
**Code Review**: APPROVED WITH SUGGESTIONS — specialists: lead-programmer, qa-tester, ui-programmer, gameplay-programmer (`/code-review` run by the implement-stories workflow; vitest 62 files / 1596 tests pass, `tsc -b` exit 0, eslint clean on the six TS/TSX files). QL-TEST-COVERAGE and LP-CODE-REVIEW were not spawned (no Agent tool in the workflow session); the named /code-review record stands in for both, and its qa-tester coverage findings are carried below.
**Mutation Check**: Mutation check: FAILED AS EXPECTED — src/ui/worldOnboard.ts:116 `=== null` → `!== null` → "fires on a clean first win (+8): Stabilize is the affordable action" failed; restored (cmp match, test file green)
**Manifest**: story 2026-10-08 = current 2026-10-08.

### Test-Criterion Traceability
| Criterion | Test | Status |
|-----------|------|--------|
| AC-1 (AC27) four-row card, START HERE highest Chance, Pause/Clock, Nexus-held Tax | `01-card-{90,100,110,125}.png`; `worldOnboard.test.ts` (START HERE selector vs independent `Math.max`); `capture-output.txt` card@* | COVERED |
| AC-2 (WN Opening desk) UNDERSTOOD marks `hint-worldmap` once; card never returns | `capture-output.txt` "UNDERSTOOD marks hint-worldmap seen exactly once", "card does not return after leaving and re-entering"; `tutorialStore.test.ts` | COVERED |
| AC-3 Influence 0: owner reasons, no teaching panel | `02-sector-panel-influence-0-*.png` (Europe: all UNAFFORDABLE); `02b-…-na-100.png` (North America: Expedite NO TARGET) | COVERED (wording note above) |
| AC-4 clean win +8: one panel names action/cost/effect; seen; never returns | `03-influence-moment-*.png`; `capture-output.txt` dismiss / spent-and-recovers / re-enter lines; `worldOnboard.test.ts` "fires on a clean first win" | COVERED (marking-on-fire note above) |
| AC-5 Antarctica focused: no fire (`locked-sector`) | `04-antarctica-focused-*.png`; `capture-output.txt` antarctica@* + "refocusing Europe fires once" | COVERED |
| AC-6 (TR-interface-002) 1280×720 × 90/100/110/125, nothing clips | all 17 PNGs; `capture-output.txt` "nothing clipped" per scale | COVERED |

### Advisory findings from /code-review (for follow-up)
1. `src/ui/WorldMap.tsx:227-232` — the note's `shown` state is not reset when the focused sector changes; after firing on Europe the player can focus Antarctica (or a cooling sector) before UNDERSTOOD and still read "on the focused sector" with no action listed and the inset hidden. Spec silent on refocus; no test or capture covers fire-then-refocus. Suggested: clear `shown` when `sector` changes (id is already seen so it will not refire) or name the sector in the copy. **Resolved 2026-10-22, owner ruling (Sprint 10 QA condition 2, IF013-18): the note hides when the focus moves and does not come back.** `src/ui/worldOnboard.ts` `influenceMomentShown`, wired in `src/ui/WorldMap.tsx` `useInfluenceMoment`. Unit test in `src/ui/worldOnboard.test.ts` ("shows only on the sector it fired on"). Capture `production/qa/evidence/if-013/refocus-fix-2026-10-22/` ALL PASS.
2. `src/ui/WorldMap.tsx:228-232` — `hint-influence` marked on firing while AC4 reads "dismiss marks it seen" (see Deviations; resolved 2026-10-22: keep on-fire marking).
3. Story line 41 — "Expedite its no-target reason" unreachable on default focus with EC-023's seeded Europe offer (see Deviations; evidence README flags it).
4. `src/ui/WorldMap.tsx:696-723` — `WorldOnboard` keeps running its START HERE `useMemo` after dismissal (hooks precede the seen early-return). Event-rate, not 20 Hz; optional: move the body into a child rendered only while unseen.
5. `production/qa/evidence/if-013/capture.mjs:133` — headless START HERE check is a sentence-shape regex; the NEON GARDEN 87% claim is by inspection. Unit test covers pick logic; live WorldMap wiring not asserted end-to-end.
6. `capture.mjs:241-247` — "never returns in that campaign" verified in-memory only (goto research → goto world); no `page.reload()` or save round-trip test for `hint-influence` (`save.test.ts:744-759` round-trips `hint-worldmap` only). Persistence rests on the generic `SEEN_ID_SET` path (`save.ts:429/452`) plus `worldOnboard.test.ts:193`. Suggest a reload step or a captureSave/validateSave/hydrate test.
7. `src/ui/WorldMap.tsx:927` — while the note is up the SectorInset (and its FOCUS PREVIOUS / NEXT chevrons) is removed; the left sector list still focuses, so no function is lost. Layout trade-off commented at lines 241-243; worth ux-designer confirmation.
8. `src/ui/worldOnboard.ts:49-137` — user-facing copy is string literals; no localization layer exists in the repo (pre-existing gap). Gamepad line of `ui-code.md` does not apply (ADR-0017 forbids gamepad).
9. Standards: `WorldOnboard` (~77 lines, mostly JSX) and the pre-existing `WorldMap` component exceed the 40-line guideline; shape predates this story.
