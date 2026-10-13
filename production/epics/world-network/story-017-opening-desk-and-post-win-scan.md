# Story 017: Opening desk and post-win Scan

> **Epic**: World Network
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-13

## Context

**GDD**: `design/gdd/world-network.md`
**Requirement**: `TR-world-network-004`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0001: Two clocks, never both  
**Secondary ADRs**: ADR-0021: Outcome DTO and apply-once key
**ADR Decision Summary**: Strategic and tactical clocks are independent; a win spends the contract ETA as strategic days, a loss spends none.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules, manifest 2026-10-08).
- Forbidden: Resolving the arrival-failure open question inside this story.
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [x] GIVEN New Operation on World Network, WHEN the first minute is observed without selecting a contract, THEN Focus can change among the six open sectors, four numbers print, Pause/speed change whether `t` advances, and contract select is not the only enabled verb.
- [x] GIVEN a non-quiet win at frozen `t0`, WHEN direct outcome write-back completes at an instrumented boundary before ETA advancement, THEN the mission-result Feed event is appended at `t0`, and awards and sector effects follow the outcome rules. (Not a player-visible World Network screen.)
- [x] GIVEN a first clean non-quiet win starting with Influence 0, WHEN full Debrief write-back and ETA finish and World Network is displayed before another Screen tick, with no other Influence spend or award, THEN the header visibly reads Influence 8 and Scan presents the post-ETA live board.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- The GDD Open Question on arrival failure (“I did not know what to do”) is unclassified by the owner. This story verifies only the stated opening-desk criteria — do not change Core Rule 13 (first-visit overlay) or the desk here.
- Name the screens exercised in the retained click-through evidence (docs/click-through.md).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 008: Influence income rules.
- Story 003: apply order.

---

## QA Test Cases

From `/qa-plan` sprint 2 (2026-10-12). Integration, secondary UI. State half: `src/state/worldStore.test.ts`. Screenshots at 1280×720 in `production/qa/evidence/wn-017/`.

- Non-quiet win at frozen `t0`: before ETA advancement, the mission-result Feed event is appended at `t0`, and awards and sector effects have been applied. This boundary is not a screenshot.
- First clean non-quiet win from Influence 0, after full write-back and ETA, before another Screen tick, with no other Influence spend or award: Influence is 8 and Scan is the post-ETA live board.
- The apply reads the outcome DTO, not the running mission.
- Manual, opening minute with no contract selected: Focus moves among the six open sectors, four numbers print (Control, Unrest, Tax, Garrison), Pause stops `t`, speed changes the advance, and contract select is not the only enabled verb.
- Header screenshot after that first clean win reads Influence 8.
- Do not change the first-visit overlay. The arrival-failure open question is out of scope.

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test beside the module under `src/state/` / `src/game/` for the state half, plus a retained screenshot of each screen touched in `production/qa/evidence/` and the named click-through (docs/click-through.md).

**Status**: [x] `src/state/worldStore.test.ts` (4 tests, WN-017 describe) + `production/qa/evidence/wn-017/`

---

## Dependencies

- Depends on: Story 003, Story 008
- Unlocks: None

## Completion Notes
**Completed**: 2026-10-13
**Criteria**: 3/3 passing. AC1's "four numbers print" and "contract select is not the only enabled verb" are DOM checks, covered by screenshots and the DOM dump in `production/qa/evidence/wn-017/README.md`, not by a store test. AC2 is covered by the "Debrief write-back at frozen t0" win test.
**Deviations**: None against the GDD or ADRs. OUT OF SCOPE files touched: `docs/mission-playbook.md` (new), `docs/click-through.md` (link), `.claude/launch.json` (new, for `preview_start`). Pure tooling and docs. ADR-0001 and ADR-0021 were compared through the story's summary; ADR-0001 has no `## Decision` section, only its opening paragraph and `## Consequences`.
**Test Evidence**: Integration. `src/state/worldStore.test.ts` (WN-017 describe, 4 tests, plus assertions folded into "Debrief write-back at frozen t0"); vitest 756 passed. Screenshots and a real first clean win in the in-app browser: `production/qa/evidence/wn-017/` (Debrief, then World Network header INFLUENCE 8 PTS on the live post-ETA board).
**Code Review**: Complete. `/code-review` verdict APPROVED WITH SUGGESTIONS; the suggestions were implemented.
**Notes**: (1) The in-app captures (`in-app/*.jpg`) are 800x450, not the 1280x720 the QA plan asks for; the 1280x720 headless captures cover the opening desk. (2) `wn-017-04-header-influence-8-1280x720.png` is from a seeded save and is superseded by `in-app/03`. (3) After a 2-day ETA the win's Feed entry is evicted by `MAX_EVENTS = 40`; the GDD accepts this (post-win criterion). (4) The arrival-failure open question was not touched.
