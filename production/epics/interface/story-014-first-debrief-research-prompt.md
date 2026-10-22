# Story 014: First-Debrief Research prompt

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: Integration
> **Estimate**: 0.4 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-22

## Context

**GDD**: `design/gdd/interface.md` (Core Rule 13; States: Advisories; AC32), living spec §12
**Requirement**: `TR-interface-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/difficulty-curve.md` (approved 2026-10-21): Research is introduced at the first Debrief, when labs are idle and the first fee has landed, instead of as a row on the orientation card.
**Change impact**: `docs/architecture/change-impact-2026-10-21-interface.md` (notes A, C, G; ADR-0013 added).

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer (phase router; Debrief is not a Screen)
**Secondary ADRs**: ADR-0011: Campaign persistence envelope; ADR-0002: Unsaved mission; ADR-0013: Credits never overdraw / AUTHORIZE
**ADR Decision Summary**: Overlays and panels do not change `Phase`; Debrief writes nothing durable; Research eligibility is one rule (`eligibilityText`) that AUTHORIZE uses.
**ADR Version**: 2026-09-10 (ADR-0017 `## Date`); no `## Last Verified`

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM / Zustand 5. Call `markSeen` from an effect, never during render.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Required: leaving Debrief goes through `returnFromDebrief` (drops `missionId`); never a raw `goto('research')` (ADR-0011: the selected contract is not blob content after Debrief).
- Forbidden: a second "available project" rule; use `eligibilityText(node, done, labs)` (ADR-0013).
- Forbidden: durable writes on Debrief (ADR-0002 / ADR-0011).
- Guardrail: 1280×720 at text scale 90–125 without clipping; the CAMPAIGN FAILED banner keeps precedence (Interface Rule 18 / AC29).

---

## Acceptance Criteria

*From GDD `design/gdd/interface.md`, scoped to this story:*

- [ ] (AC32) GIVEN the first Debrief of a campaign with the Research prompt unfired, WHEN the Debrief is shown, THEN one prompt names the Research tab and the cheapest available project; dismiss marks it fired; it persists with the tutorial seen-set; no later Debrief in that campaign repeats it.
- [ ] GIVEN the prompt's "go to Research" control, WHEN activated, THEN the session leaves Debrief through `returnFromDebrief` (selected contract cleared, Brief locked) and then shows the Research Screen; `Phase` is `research`, not a new value.
- [ ] GIVEN a Debrief on a failed campaign (pyrrhic win or roster-emptying loss), WHEN shown, THEN the CAMPAIGN FAILED banner stays first and dominant; the prompt, if shown at all, sits below the invoice.
- [ ] GIVEN reload while still on the first Debrief, WHEN the campaign hydrates, THEN the prompt is unfired again (the mark was in memory only), matching the invoice's own unfiled status.
- [ ] GIVEN the "cheapest available project", WHEN it is chosen, THEN it is the lowest-cost node for which `eligibilityText(node, done, labs)` returns null; the story records whether "available" also means affordable against post-payout Credits.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- New standalone seen id appended to `SEEN_IDS` in `src/game/tutorial.ts` (the `WORLD_ONBOARD_ID` pattern), not a `HintId` — `HINTS` is toast copy fired by the sim and input layer (note A). Mark with `useTutorialStore.markSeen` from an effect, guarded by `!seen.includes(id)` (note G).
- `scheduleAutosave` refuses in `mission` and `debrief` (`src/state/save.ts`), so the mark becomes durable on the next Screen autosave; reload on Debrief loses it with the invoice. That is the accepted ADR-0011 behaviour.
- Project pick: reuse `eligibilityText` from `src/state/researchStore.ts`, the function `authorizeResearch` calls. The prompt reads in-memory post-apply state on Debrief. Decide in this story whether to filter by `credits >= cost` too; record the decision in Completion Notes and in `design/difficulty-curve.md` if it changes the teaching beat.
- Routing: `returnFromDebrief` then `goto('research')` (or a variant that also clears `missionId`). Phase routing in `App.tsx` is unchanged (ADR-0017).
- Not a filing indicator: the prompt must not read as, or sit inside, the unfiled / filed status chrome (ADR-0022, story 010).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Interface story 013: orientation card and the sector-panel Influence moment.
- Research story 009: the remaining-cost label and the AUTHORIZE flow itself.
- Any change to what Debrief applies or when (ADR-0021 transaction).

---

## QA Test Cases

QA plan: none yet. Provisional, Integration:

- `src/ui/*.test.ts` seam: prompt shown iff first Debrief and id unseen; cheapest project equals the `eligibilityText`-null node with the lowest cost; `markSeen` called once.
- `src/state/appStore.test.ts`: the Research control leaves `missionId === null` and `phase === 'research'`.
- `src/state/save.test.ts`: the new id validates in `seen`; a blob without it still validates.
- Headless capture at 1280×720: first Debrief with prompt; second Debrief without; pyrrhic Debrief with banner first.

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: passing tests beside the modules, plus retained captures of the three Debrief states in `production/qa/evidence/if-014/` with a click-through note.

**Status**: [ ] Not created

---

## Dependencies

- Depends on: none (Interface story 013 removes the card's Research row; order between 013 and 014 does not matter)
- Unlocks: playtest 2 "starts a Research project before the second deploy" check

---

## Completion Notes
_(filled by `/story-done`)_
