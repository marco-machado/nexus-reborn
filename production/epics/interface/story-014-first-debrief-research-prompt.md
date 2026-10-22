# Story 014: First-Debrief Research prompt

> **Epic**: Interface
> **Status**: Complete
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

- [x] (AC32) GIVEN the first Debrief of a campaign with the Research prompt unfired, WHEN the Debrief is shown, THEN one prompt names the Research tab and the cheapest available project; dismiss marks it fired; it persists with the tutorial seen-set; no later Debrief in that campaign repeats it.
- [x] GIVEN the prompt's "go to Research" control, WHEN activated, THEN the session leaves Debrief through `returnFromDebrief` (selected contract cleared, Brief locked) and then shows the Research Screen; `Phase` is `research`, not a new value.
- [x] GIVEN a Debrief on a failed campaign (pyrrhic win or roster-emptying loss), WHEN shown, THEN the CAMPAIGN FAILED banner stays first and dominant; the prompt, if shown at all, sits below the invoice.
- [x] GIVEN reload while still on the first Debrief, WHEN the campaign hydrates, THEN the prompt is unfired again (the mark was in memory only), matching the invoice's own unfiled status.
- [x] GIVEN the "cheapest available project", WHEN it is chosen, THEN it is the lowest-cost node for which `eligibilityText(node, done, labs)` returns null AND `cost <= Credits` after the payout applies (decided 2026-10-22: "available" means affordable); if no node qualifies, the prompt is not shown and stays unfired.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- New standalone seen id appended to `SEEN_IDS` in `src/game/tutorial.ts` (the `WORLD_ONBOARD_ID` pattern), not a `HintId` — `HINTS` is toast copy fired by the sim and input layer (note A). Mark with `useTutorialStore.markSeen` from an effect, guarded by `!seen.includes(id)` (note G).
- `scheduleAutosave` refuses in `mission` and `debrief` (`src/state/save.ts`), so the mark becomes durable on the next Screen autosave; reload on Debrief loses it with the invoice. That is the accepted ADR-0011 behaviour.
- Project pick: reuse `eligibilityText` from `src/state/researchStore.ts`, the function `authorizeResearch` calls. The prompt reads in-memory post-apply state on Debrief. Decided 2026-10-22 (owner): also filter by `credits >= cost` against post-payout Credits; record it in Completion Notes and in `design/difficulty-curve.md`.
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

QA plan: `production/qa/qa-plan-sprint-010-2026-10-22.md`. Provisional, Integration:

- `src/ui/*.test.ts` seam: prompt shown iff first Debrief and id unseen; cheapest project equals the `eligibilityText`-null node with the lowest cost; `markSeen` called once.
- `src/state/appStore.test.ts`: the Research control leaves `missionId === null` and `phase === 'research'`.
- `src/state/save.test.ts`: the new id validates in `seen`; a blob without it still validates.
- Headless capture at 1280×720: first Debrief with prompt; second Debrief without; pyrrhic Debrief with banner first.

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: passing tests beside the modules, plus retained captures of the three Debrief states in `production/qa/evidence/if-014/` with a click-through note.

**Status**: [x] Created — `production/qa/evidence/if-014/` (11 PNGs at 1280×720, text scale 90/100/110/125 on the first Debrief and 100/125 on the pyrrhic one, `README.md` click-through note, `capture.mjs`, `capture-output.txt` ALL PASS); tests in `src/ui/debriefResearch.test.ts`, `src/state/appStore.test.ts`, `src/state/save.test.ts`, `src/game/tutorial.test.ts`

---

## Dependencies

- Depends on: none (Interface story 013 removes the card's Research row; order between 013 and 014 does not matter)
- Unlocks: playtest 2 "starts a Research project before the second deploy" check

---

## Completion Notes
**Completed**: 2026-10-22
**Verdict**: COMPLETE WITH NOTES
**Criteria**: 5/5 passing (none deferred)
**Deviations**: None blocking. Advisory:
- AC32 wording vs implementation: the AC reads "dismiss marks it fired"; the Implementation Notes (note G) prescribe marking from an effect guarded by `!seen.includes(id)`, so `hint-debrief-research` is marked seen on firing (`src/ui/index.tsx` `useDebriefResearchPrompt`, lines 1633–1636) and again (a no-op) on UNDERSTOOD. The observable outcome holds (fired once, no later Debrief repeats it); the drift is that leaving the Debrief with the note up also consumes the lesson. Same accepted deviation as IF-013's Influence moment.
- AC3 "if shown at all": on a failed campaign (pyrrhic win / wipe) the prompt is still shown under the CAMPAIGN FAILED banner, below the invoice (`06-pyrrhic-debrief-banner-first-{100,125}.png`), and its copy says "AUTHORIZE it before the next deploy" though deploy is refused on `campaignFailed` (`src/state/appStore.ts:233`). The single show-rule was kept; the AC permits it. Owner ruling needed: keep, suppress on `campaignFailed`, or branch the copy.
- ADR-0013 MINOR (INFO): `cheapestAvailableProject` (`src/ui/debriefResearch.ts:33`) applies a third filter, `Number.isFinite(cost) && cost > 0`, beyond the story's two (`eligibilityText` null AND `cost <= Credits`). It mirrors the AUTHORIZE pre-check (`appStore.ts:281`); no live node (minimum cost 14,000) is affected. Full rule: lowest-cost node with finite positive cost, cost ≤ post-payout Credits, and `eligibilityText(node, done, labs) === null`; ties keep `NODES` order; null when nothing qualifies (prompt stays unfired). Recorded in `design/difficulty-curve.md` (Research row).
- CONTRACT FILE widened: `returnFromDebrief: (to?: 'world' | 'research') => void` in `src/state/appStore.ts` (lines 171, 229) rather than a second exit action. `act()` passes no arguments so every existing caller keeps `'world'`; header comment updated. Lead-programmer in the /code-review found it safe; acknowledged here as the story's "variant that also clears missionId".
- Player-facing copy in `src/ui/debriefResearch.ts` is string literals; the repo has no localization layer (`src/i18n` / `src/locales` absent). Pre-existing project-wide gap (also noted on IF-013), not a regression.
- Scope: `src/ui/debriefResearch.ts` (new, pure selector/copy module), `src/ui/ui.css` (`.db-research` styles) and the four test files are beyond the files the Implementation Notes name; all Presentation-layer and story-required. `design/difficulty-curve.md` edited as the Implementation Notes instruct. Valid, not creep.
**Test Evidence**: Integration: tests beside the modules — `src/ui/debriefResearch.test.ts` (file present; cheapest pick, affordability filter, shown-rule, markSeen once, copy), `src/state/appStore.test.ts` ("IF-014: the Research control leaves Debrief with missionId null and phase research"), `src/state/save.test.ts` ("IF-014: the first-Debrief Research prompt id validates in seen…"), `src/game/tutorial.test.ts` (`SEEN_IDS` holds the id). Retained captures at `production/qa/evidence/if-014/`: `01-first-debrief-prompt-{90,100,110,125}.png`, `02-reload-then-debrief-prompt-fires-again-100.png`, `03-research-screen-after-open-100.png`, `04-second-debrief-no-prompt-100.png`, `05-after-understood-100.png`, `06-pyrrhic-debrief-banner-first-{100,125}.png`, `07-first-debrief-unaffordable-no-prompt-100.png`; click-through note `README.md`; `capture-output.txt` ALL PASS, no console or page errors. Run result: OBSERVED (dev-story checkpoint; images opened at /story-done: 01-…-100, 02, 03, 04, 06-…-100, 07). This skill verified test-file existence only; pass/fail is the /code-review record's.
**Code Review**: APPROVED WITH SUGGESTIONS — specialists: lead-programmer, qa-tester, ui-programmer, gameplay-programmer (`/code-review` run by the implement-stories workflow). QL-TEST-COVERAGE and LP-CODE-REVIEW were not spawned (no Agent tool in the workflow session); the named /code-review record stands in for both, and its qa-tester coverage findings are carried below.
**Mutation Check**: Mutation check: FAILED AS EXPECTED — src/ui/debriefResearch.ts:34 `node.cost > credits` → `node.cost >= credits` → "filters by cost <= Credits after the payout: 13,999 CR qualifies nothing, 14,000 CR qualifies the 14,000 project" failed; restored (cmp match, test file green)
**Manifest**: story 2026-10-08 = current 2026-10-08.
**Closed by**: /story-done in autonomous mode (implement-stories workflow); "Close the story (Recommended)" taken by default.

### Test-Criterion Traceability
| Criterion | Test | Status |
|-----------|------|--------|
| AC-1 (AC32) first Debrief: one prompt names the Research tab and the cheapest available project; fired once; persists with the seen-set; no later Debrief repeats it | `01-first-debrief-prompt-{90,100,110,125}.png`; `04-second-debrief-no-prompt-100.png`; `capture-output.txt` "first Debrief shows one prompt…", "fired: seen holds the id exactly once", "the Screen autosave makes the mark durable", "second Debrief shows no prompt"; `debriefResearch.test.ts` shown-rule / markSeen-once; `save.test.ts` IF-014 id validates | COVERED (mark-on-fire note above) |
| AC-2 OPEN RESEARCH leaves through `returnFromDebrief`: missionId null, Brief locked, phase `research` | `03-research-screen-after-open-100.png` (BRIEF LOCKED // NO CONTRACT SELECTED); `capture-output.txt` "OPEN RESEARCH: phase research, missionId null"; `appStore.test.ts` IF-014 case | COVERED |
| AC-3 failed campaign: CAMPAIGN FAILED banner first and dominant; prompt, if shown, below the invoice | `06-pyrrhic-debrief-banner-first-{100,125}.png`; `capture-output.txt` "banner is the first child of the card", "the prompt, shown, sits below the invoice, under the banner" | COVERED (owner ruling on showing it at all, above) |
| AC-4 reload on the first Debrief: prompt unfired again, like the unfiled invoice | `02-reload-then-debrief-prompt-fires-again-100.png`; `capture-output.txt` "after reload + Continue the prompt is unfired again", "the next Debrief after that reload fires the prompt again", "still unfiled on Debrief: the mark is not in the blob" | COVERED (capture only; no vitest case for the save.ts phase guard — advisory 8 below) |
| AC-5 cheapest available = lowest-cost `eligibilityText`-null node with cost ≤ post-payout Credits; none → not shown, stays unfired | `debriefResearch.test.ts` "filters by cost <= Credits after the payout…", "is the lowest-cost node the owner reports eligible…", "returns null when no idle lab…"; `07-first-debrief-unaffordable-no-prompt-100.png`; `capture-output.txt` "unaffordable first Debrief (1,000 CR, loss pays 0): no prompt, id unfired" | COVERED |

### Advisory findings from /code-review (for follow-up)
1. `src/ui/index.tsx:1767` — prompt still renders on a failed campaign and its copy says "AUTHORIZE it before the next deploy" though deploy is refused on `campaignFailed` (`appStore.ts:233`). AC3 "if shown at all" permits it; owner ruling needed (see Deviations). Suggest `researchPromptShown` take `campaignFailed`, or branch the copy.
2. `src/ui/index.tsx:1633-1636` — mark is made on show, not on dismiss; AC32 says "dismiss marks it fired". Matches the Implementation Notes; recorded as an accepted deviation above.
3. `src/state/appStore.test.ts:207` — tautological assertion: after line 204 asserts `phase === 'research'`, the `toContain` over all seven phases cannot fail. Drop it or replace with one that can fail.
4. `src/ui/debriefResearch.test.ts:58` — weak assertion: `expect(researched?.id).not.toBe('b-coating')` passes on a null return. Deterministic pick is `c-interface` (`src/game/research.ts:195-202`, cost 15,000, needs []); assert `toBe('c-interface')`.
5. `src/ui/index.tsx:1618-1644` — `useDebriefResearchPrompt` (show-once latch, mark from effect, dismiss) has no vitest coverage (no DOM environment; vitest include is `src/**/*.test.ts`). Covered only by `capture.mjs`; rerun the capture before sign-off or add a DOM test environment.
6. `production/qa/evidence/if-014/capture.mjs:85,164` — the "one prompt" probe uses `document.querySelector('.db-research')`, so a duplicate render would still PASS. Use `querySelectorAll(...).length === 1`.
7. `src/ui/debriefResearch.ts:34` — non-finite credits bypass the affordability filter (`14000 > NaN` is false). Unreachable today (save.ts rejects non-finite credits per ADR-0013; addCredits ignores non-finite) but untested; add `Number.isFinite(credits)` early return and a NaN case.
8. `src/state/save.test.ts:478-491` — no vitest case for the AC4 mechanism (markSeen on Debrief stays memory-only via the `save.ts:863` phase guard, filed by the next Screen autosave); proven only by `capture-output.txt` lines 7 and 15.
9. `production/qa/evidence/if-014/README.md:21` — the click-through drives only CONTINUE, OPEN RESEARCH and UNDERSTOOD (`capture.mjs:190,200,220`); RETURN TO WORLD NETWORK and REPLAY after the prompt fires were not driven. State this in the README or add that pass.
10. `src/ui/index.tsx:1580,1588` — aria-labels "Open the Research tab" / "Dismiss the Research prompt" do not contain the visible text OPEN RESEARCH / UNDERSTOOD (WCAG 2.5.3 Label in Name); same habit on BALANCE DATA (line 1789). Drop the aria-labels or prefix with the visible text.
11. `src/ui/index.tsx:1638-1641` — UNDERSTOOD unmounts the focused button without moving focus; keyboard focus falls to body. Move focus to RETURN TO WORLD NETWORK or the `.db-rows` region.
12. `src/ui/debriefResearch.ts:33` — ADR-0013 MINOR DEVIATION (INFO): third filter `Number.isFinite(cost) && cost > 0` (see Deviations; full rule recorded there).
13. `src/state/appStore.ts:171,229` — CONTRACT FILE public action widened to `returnFromDebrief(to?)` (see Deviations; lead-programmer found it safe).
14. Code review Phase 9 default taken (autonomous mode): [B] run /story-done with suggestions noted for later; items 1, 2, 12 and 13 carried here as owner rulings / Completion Notes.
