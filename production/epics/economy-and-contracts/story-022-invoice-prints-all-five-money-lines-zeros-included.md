# Story 022: Invoice prints all five money lines, zeros included

> **Epic**: Economy and contracts
> **Status**: Complete
> **Layer**: Core
> **Type**: UI
> **Estimate**: 1.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-007`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0021: Outcome DTO and apply-once key
**ADR Decision Summary**: One apply key per deploy; applyDebrief applies an outcome iff its key exceeds lastAppliedKey.
**ADR Version**: 2026-10-08 (ADR `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Omitting a zero money line.
- Forbidden: Computing collateral in the component.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [x] GIVEN Economy has priced Reward 0, optional bonus 0, Collateral 0, net payout 0 and new balance C, WHEN Interface builds the invoice, THEN those five lines are present (not omitted).
- [x] GIVEN a loss, stored Reward 85,000 CR, Collateral 10,000 CR, optional bonus 0, `net_payout = 0`, new balance C, THEN Reward 85,000 CR is present and all five money lines are present.
- [x] GIVEN a quiet-replay win, stored Reward 62,000 CR, optional bonus 0, Collateral 0, `net_payout = 0`, new balance C, THEN Reward 62,000 CR is present and all five money lines are present.
- [x] GIVEN a non-quiet win, N = 0, Collateral 0 CR, THEN the Collateral 0 CR line is present (not omitted).

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Debrief renders the stored priced outcome (`MissionOutcome`); it prices nothing itself. Interface owns presentation, Economy owns the numbers.
- Do not fork a second show-rule for zero rows (GDD Closed Question 3).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Interface epic owns Debrief layout and copy.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-004-2026-10-14.md` (Sprint 4). Type: UI.*

**Automated**: new `src/ui/debriefInvoice.test.ts` on a pure row builder extracted from `src/ui/index.tsx` (~L1560-1617). Assert the five money lines (Reward, Optional bonus, Collateral, Net payout, Account balance) for the four AC cases, zeros printed.

**Gap**: this is a code change. Today CONTRACT VALUE and COLLATERAL PENALTY print only when `won && !quiet && fine > 0`, and OPTIONAL BONUS only when `bonus > 0`, so a zero line, a loss and a quiet replay all omit rows.

**Manual**: Playwright at 1280x720, one screenshot per case in `production/qa/evidence/sprint-004/`; lead-programmer sign-off.
- [x] Non-quiet win, Collateral 0: five lines, Collateral shows 0 CR
- [x] Zero-priced win: five lines present
- [x] Loss: Reward shows the stored value (85,000 CR), payout 0
- [x] Quiet-replay win: Reward shows the stored value (62,000 CR), payout 0
- [x] No row clipped in the invoice region

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each screen touched, in `production/qa/evidence/`, plus a click-through note naming the screens exercised (docs/click-through.md). Screens must work at 1280×720 without clipping or truncation.

**Status**: [x] Created — `src/ui/debriefInvoice.test.ts` (11 tests since c85960c); screenshots and click-through note in `production/qa/evidence/sprint-004/ec-022-*` (README + 6 PNGs at 1280x720, re-captured after c85960c)

---

## Dependencies

- Depends on: Story 008, Story 009, Story 010
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 4/4 passing (AC1-AC4 each covered by a unit test in `src/ui/debriefInvoice.test.ts` and a retained 1280x720 screenshot in `production/qa/evidence/sprint-004/`)
**Deviations**: None blocking. Advisory items below.
**Test Evidence**: UI: screenshots `production/qa/evidence/sprint-004/ec-022-{win-collateral0,zero-priced-win,loss,quiet-replay-win}-1280x720.png`, click-through note `production/qa/evidence/sprint-004/ec-022-README.md`; unit test `src/ui/debriefInvoice.test.ts` (8/8 passing when run at story-done, 2026-10-14)
**Run result**: OBSERVED — production/qa/evidence/sprint-004/ec-022-*-1280x720.png
**Code Review**: Ran (/code-review). Verdict NOT ASSESSED: the ui-programmer, lead-programmer and qa-tester specialist reviews could not be spawned (no Agent tool in the workflow subagent). The reviewer's own pass found no Required Changes (would have been APPROVED WITH SUGGESTIONS); ADR-0021 COMPLIANT, Standards 6/6, Architecture CLEAN, SOLID COMPLIANT; vitest 8/8, tsc -b clean, eslint clean. Re-run /code-review in a context that can spawn agents to reach APPROVED.
**Story-done decisions (autonomous mode)**: lean-mode code-review prompt answered "Yes, /code-review ran" with the result above; Phase 7 closed with the recommended "Close the story" option. QL-TEST-COVERAGE skipped (lean mode).

**Advisory findings (from /code-review):**
- Review gap, not a code defect: specialist and qa-tester reviews did not run; re-run /code-review where agents can be spawned.
- Design question for the owner: `src/ui/debriefInvoice.ts:48-61` — on a loss or a quiet replay with optionals completed, `priceOutcome` still stores bonus > 0, so the invoice prints OPTIONAL BONUS `+9,000 CR` (teal) next to PAYOUT 0 CR, and a quiet replay with civiliansHit > 0 prints a red COLLATERAL PENALTY. GDD §7 (edge cases L198-199, AC L282) zeroes the net but does not say whether bonus/collateral lines show the priced value or 0 on unpaid outcomes. The old code hid these lines when quiet; `src/ui/index.tsx` L1545 dropped the `!quiet` guard. Owner to confirm intended presentation.
- Test gap: `src/ui/debriefInvoice.test.ts` has no quiet-replay or loss case with non-zero bonus or non-zero collateral (where line values and payout disagree). Add once the design question is settled.
- `src/ui/debriefInvoice.ts:46`: the five-line guarantee holds only when `outcome` is non-null; with no outcome only PAYOUT and ACCOUNT BALANCE print (tested and documented). Acceptable — there is no priced invoice before an outcome.
- GDD L254 asks for Collateral as "count and CR": met across two rows (COLLATERAL count, `src/ui/index.tsx` ~L1590, and COLLATERAL PENALTY CR). Noted for the Interface epic's layout.
- Evidence README: lead-programmer sign-off still pending (not required for a UI story by the story-done gate); text scales 90/110/125 not captured, deferred to IF-011.

**Follow-up 2026-10-14 — owner decision on unpaid outcomes (option A):** On a loss or quiet replay, Collateral and optional bonus keep their priced values but print dim (`--ink-dim`) with a ` — NOT APPLIED` tag; a paid win keeps red/teal, untagged. Code: `src/ui/debriefInvoice.ts` (`unpaid`, `NOT_APPLIED`), `src/ui/ui.css` (`.db-row b.dim`). Tests: `src/ui/debriefInvoice.test.ts` now 11 (AC2/AC3 expectations updated; added loss and quiet replay with 3 hits + 9,000 CR optional, and the paid-win control) — closes the advisory test gap. GDD: `design/gdd/economy-and-contracts.md` UI Requirements, new AC, Closed Question 4; `design/gdd/interface.md` Rule 18 pointer. Verified: vitest 921/921, lint clean, build OK; Debrief rendered at 1280x720 in the in-app browser for loss, quiet replay and paid win (harness assist: priced outcome injected via `appStore.setState`, no mission played), no clipped rows, no console errors.

**Code review re-run 2026-10-14 (specialists spawned: ui-programmer, lead-programmer, qa-tester; commits c1303ec, c85960c): APPROVED WITH SUGGESTIONS.** No required changes after verification. Two specialist "Required" items were downgraded: localization (no localization system exists in `src/`; every screen hardcodes copy, so this is project-wide) and row label/value association (pre-existing for every Debrief row; the NOT APPLIED text is in the DOM, so colour is not the only signal).
- ADR DRIFT (warning, pre-existing in `src/state/appStore.ts`, not this story's diff): ADR-0021 says the priced `MissionOutcome` stores `collateral` and `netPayout` and the helpers read them; `priceOutcome` stores neither and `collateralFine` / `netPayout` derive them on read. The invoice calls those Economy helpers and prices nothing itself. Follow-up: store both fields or amend the ADR.
- Suggestions (verified): `unpaid()` re-implements Economy's payout gate, export one predicate beside `netPayout`; `debriefInvoiceRows` cyclomatic complexity about 12 (limit 10), split into row helpers; doc comments missing on `InvoiceRow`, `InvoiceInput`, `NOT_APPLIED`; `--ink-dim` (#5d7d75) on the panel is about 4.25:1, under WCAG AA 4.5:1 for the 15px NOT APPLIED values; `.db-row` stagger ignores `:root.s-reduce-motion` (pre-existing); tests to add: loss + quiet together, pyrrhic note on an unpaid outcome, tone/tag absent on paid zero rows, NaN inputs to the builder.
- Owner note: the COLLATERAL count row stays red on unpaid outcomes beside the dim penalty row; Closed Question 4 names only the penalty and bonus lines.
- Closes Sprint 4 QA sign-off condition 2 (lead-programmer review recorded here).
