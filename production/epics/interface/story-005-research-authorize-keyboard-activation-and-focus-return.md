# Story 005: Research Authorize, keyboard activation, and focus return

> **Epic**: Interface
> **Status**: Complete
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-17

## Context

**GDD**: `design/gdd/interface.md`
**Requirement**: `TR-interface-007`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer  
**Secondary ADRs**: ADR-0013: Credits never overdraw; ADR-0014: Timeline Review is a view, not a clock
**ADR Decision Summary**: One palette, one remap table, four audio buses; DOM screens at 1280×720; keyboard and mouse only.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM / Zustand 5 work; the ADR lists no post-cutoff API (its Knowledge Risk HIGH is the project-wide pin note). Select primitives or use `useShallow` in selectors; do not use React 19.2 `<Activity>` / `useEffectEvent` to hide phases.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Required: `BINDINGS` is the only remap table; keyboard and mouse, desktop only.
- Forbidden: gamepad or touch.
- Guardrail: debit/start correctness stays Economy/Research; Interface does not debit.
- Guardrail: colours from `src/ui/tokens.ts` / `src/index.css` only; screens work at 1280×720 without clipping (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/interface.md`, scoped to this story:*

- [x] (AC8) GIVEN an available, unresearched project with prerequisites satisfied and its laboratory idle, WHEN Credits are below its listed cost, THEN Authorize is disabled and its unaffordable reason is visible. In a separate otherwise-identical affordable fixture, activating Authorize starts the project and shows Active rather than merely opening inspection; debit/start correctness stays Economy/Research.
- [x] (AC18) GIVEN Pause then nested Settings then return, WHEN focus is observed, THEN focus restores to the pause modal (§20 nested Settings return).
- [x] (AC19) GIVEN a focused Research project node, WHEN pointer activation, Enter and Space are exercised in separate fixtures, THEN each selects the project and displays its details without starting research or changing Credits or laboratory occupancy. GIVEN the selected available, unresearched project has satisfied prerequisites, an idle laboratory and sufficient Credits, WHEN its focused enabled Authorize control is activated by pointer, Enter or Space in separate fixtures, THEN each starts the project and presents its Active state; debit/start correctness remains Economy/Research. GIVEN the Timeline at a recorded live state, WHEN Left/Right, Home and End are exercised, THEN Left/Right move Review backward/forward within its window, Home selects the oldest point, and End returns Live; the Review action does not mutate live state. GIVEN Pause or Settings, WHEN Tab/Shift+Tab and close are exercised, THEN focus stays trapped while open and returns to the opening context when closed; nested Settings return satisfies AC18. These are separate observable checks, not a requirement for full keyboard travel across every panel.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Node activation (pointer, Enter, Space) selects and inspects only; only the enabled Authorize control starts research.
- Pause and Settings trap focus and restore it to the opening context; nested Settings returns to the pause modal.
- Timeline Left/Right/Home/End drive Review only and never mutate live state.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Research epic story 009: remaining-time label.
- Research epic story 002: authorize debit ordering.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-009-2026-10-17.md` (2026-10-17).*

#### IF-005 — Research Authorize, keyboard activation, and focus return (UI)
**Automated (where a seam exists)**:
- Separate fixtures, each its own test or scripted case: Credits below cost → Authorize disabled with the unaffordable reason; affordable twin → activation starts the project and shows Active
- Node activation by pointer, Enter and Space selects and shows details without starting research or changing Credits or lab occupancy
- Authorize by pointer, Enter and Space each start the project
- Timeline: Left/Right step Review back/forward, Home = oldest, End = Live; Review does not mutate live state
- Pause and Settings trap Tab/Shift+Tab and return focus on close; nested Settings return focuses the pause modal (AC18)
**Verification**: Headless capture at 1280×720; evidence in `production/qa/evidence/if-005/`; sign-off: qa-lead
**Checklist**:
- [ ] Screenshots: disabled Authorize with reason, Active state, focused node ring, pause with focus. Unverified: whether the suite has a DOM test environment — if not, run the cases as a headless Playwright script and keep its transcript as evidence
**Edge cases**: Not a requirement for full keyboard travel across every panel; Debit/start correctness stays Economy/Research

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each screen touched, in `production/qa/evidence/`, plus a click-through note naming the screens exercised (docs/click-through.md). Screens must work at 1280×720 without clipping or truncation.

**Status**: [x] Created — `production/qa/evidence/if-005/` (7 captures at 1280x720, `capture.mjs`, `capture-output.txt` ALL PASS, `README.md` click-through note); tests in `src/ui/researchInput.test.ts`

---

## Dependencies

- Depends on: Story 001
- Unlocks: None

## Completion Notes
**Completed**: 2026-10-17
**Criteria**: 3/3 passing (AC8, AC18, AC19). AC8 disabled state and AC18 nested-Settings focus return confirmed from retained screenshots 01 and 07 (opened and viewed) plus the `capture-output.txt` ALL PASS transcript; AC19 covered by `capture.mjs` and `src/ui/researchInput.test.ts`. No criteria deferred. Workflow run unattended: no manual `AskUserQuestion` confirmations were asked.
**Deviations**: None blocking. Advisory only: (a) Authorize reason strings in `src/ui/researchAuth.ts` are hardcoded English, matching the existing screen; out of IF-005 scope, pass to /localize. Scope: `src/ui/WorldMap.tsx` and `src/ui/timelineKeys.ts` touched alongside Research.tsx (timeline Review keys), consistent with AC19.
**Test Evidence**: UI: 7 retained 1280x720 screenshots, `capture.mjs`, `capture-output.txt` (ALL PASS) and `README.md` click-through note in `production/qa/evidence/if-005/`; unit tests at `src/ui/researchInput.test.ts`. Tests were not re-run by /story-done (existence verified only).
**Code Review**: APPROVED WITH SUGGESTIONS — specialists: lead-programmer, qa-tester, ui-programmer. ADR-0017 governing; ADR-0013/0014 assessed from code and story summaries only, not loaded as files. Review did not re-run tsc, eslint, vitest or capture.mjs.
**Advisory review findings (not fixed here)**:
- `researchInput.test.ts:52` 'node activation selects only' calls only pure `authorizeView`; node handlers (`Research.tsx:123-128` call only `select()`) are covered only by `capture.mjs`. Rename the test or add a component-level test.
- `researchInput.test.ts:47` regex `/^LOCKED|LAB NOT IDLE/` parses as `(^LOCKED)|(LAB NOT IDLE)`; fixture does not isolate prerequisite-locked from lab-busy. Use `/^(LOCKED|LAB NOT IDLE)/` and one fixture per cause.
- `researchInput.test.ts:30` and `:90`: affordable-twin test calls the store action directly, so the Authorize button handler (`Research.tsx` ~370) is covered only by `capture.mjs`; Review-keys test ends on End and asserts only `review === null`. Assert an intermediate pin.
- `timelineKeys.ts:22` returns negative Review times when now < DAY (matches prior inline behavior; not a regression). No unit test for now < DAY or a pin older than now - DAY. Consider clamping to 0 and adding both tests.
- `capture.mjs:150` mixes `||` and `&&` in the Home assertion and accepts a pin up to 120 s off; clock is paused, so assert `s3.review === s3.t - 86400`. Line 155 `s4.t >= s0.t` should be equality; line 148 accepts `s2.review === null` as "moves forward".
- Unverified specialist claims: `capture.mjs` uses machine-specific paths (global @playwright/cli playwright-core, chromium-1247 mac-arm64) and an unused `title` helper; Tab-trap loops press Tab 8 times without counting focusables; nested Settings closed only via Escape; focus restore asserted as "inside the pause modal" not a specific control; Enter/Space/pointer fixtures share one page.
- `researchAuth.ts:25` needless `done as string[]` cast; drop it.
- `timelineKeys.ts` exports `REVIEW_STEP_SEC` and `reviewKey` without `/** */` doc comments; document the three-way return (pin, null = Live, undefined = unhandled).
**Mutation Check**: Mutation check: FAILED AS EXPECTED — src/ui/researchAuth.ts:28 `credits < n.cost` -> `credits <= n.cost` → "AC8: Authorize gating > affordable twin: enabled, and activating starts the project as Active" failed; restored (cmp match, test file green)
