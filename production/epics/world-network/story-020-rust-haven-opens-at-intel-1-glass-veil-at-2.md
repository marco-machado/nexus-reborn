# Story 020: Rust Haven opens at intel 1; Glass Veil and Hollow Crown at 2

> **Epic**: World Network
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: 0.3 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-22

## Context

**GDD**: `design/gdd/world-network.md` (Core Rule 7; Opening desk ACs), living spec §5 and §9 authored table
**Requirement**: `TR-world-network-007`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/difficulty-curve.md` (approved 2026-10-21): the only authored contract open at intel 1 was the Severe one (Chance 36); the Moderate one (Chance 82) opens first now.
**Change impact**: `docs/architecture/change-impact-2026-10-21-world-network.md` (every ADR Still Valid; note E).

**ADR Governing Implementation**: ADR-0012: Store placement for Intel and generated contracts
**Secondary ADRs**: ADR-0020: Campaign fail flags (`allWon` and `expectedWin` stay the three authored ids)
**ADR Decision Summary**: Owner is not the Zustand module: Intel lives on campaignStore; `missionLocked(mission, intelLevel)` is the contract gate; authored contracts remain `MISSIONS` data.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Static data and pure TypeScript; no React or three.js API involved.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules, manifest 2026-10-08).
- Required: Intel owner is World Network; live home `campaignStore.intelLevel`; the gate stays `missionLocked` (ADR-0012).
- Forbidden: a second intel ledger or a second lock rule in Interface or `appStore`.
- Guardrail: `src/game/data.ts` is a CONTRACT FILE; read its header before editing.

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [x] GIVEN New Operation at intel 1, WHEN Scan / OPEN CONTRACTS is read before `t` advances, THEN Rust Haven is selectable and Glass Veil and Hollow Crown read locked (`missionLocked` true for m01 and m02, false for m03).
- [x] GIVEN intel 2, WHEN the three authored contracts are read, THEN all three are selectable.
- [x] GIVEN the authored table in living spec §9, WHEN `MISSIONS[].intelReq` is read, THEN m03 Rust Haven = 1, m01 Glass Veil = 2, m02 Hollow Crown = 2, and no other field of any authored contract changed.
- [x] GIVEN a saved campaign at intel 1 with Glass Veil in `contractsWon`, WHEN it hydrates, THEN the blob is valid, Glass Veil reads locked for new deploys, and the campaign-complete record is unchanged (ADR-0020 `expectedWin` is the three ids, not the gate order).

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Change only the three `intelReq` values in `src/game/data.ts`. `missionLocked` (`src/state/campaignStore.ts`), `appStore.selectMission` and `WorldMap.tsx` read `intelReq` from data; no other non-test code names m01 or m03 (TD-CHANGE-IMPACT, 2026-10-21).
- Update the data table test and every lock assertion that assumed m01 open at intel 1 and m03 locked: `data.test.ts`, `campaignStore.test.ts`, `appStore.test.ts` and any WorldMap / Scan test fixture. These are fixture changes, not a determinism change; say so in the commit body.
- Do not touch intel awards (+40, +15 clean) or `INTEL_PROGRESS` (25). Difficulty-curve OQ 3 (one clean win to intel 2) is a separate decision.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Economy story 023: the seeded opening market offer.
- Interface story 013: the four-row orientation card and START HERE copy that names the open contract with the highest Chance.
- Any change to the Scan lock chrome itself (World Network story 014 owns hide/lock presentation).

---

## QA Test Cases

QA plan: `production/qa/qa-plan-sprint-010-2026-10-22.md`. Provisional, Logic:

- `src/game/data.test.ts`: intelReq table pinned to 1 / 2 / 2 for m03 / m01 / m02.
- `src/state/campaignStore.test.ts`: `missionLocked` at intel 1 → m03 false, m01 and m02 true; at intel 2 → all false.
- `src/state/appStore.test.ts`: `selectMission('m01')` no-ops at intel 1; `selectMission('m03')` selects.
- `src/state/save.test.ts`: a v10 fixture at intel 1 with `contractsWon: ['m01']` validates and hydrates; `campaignWon` unchanged.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: a passing test file beside the module (`src/game/data.test.ts`, `src/state/campaignStore.test.ts`); the whole suite green.

**Status**: [x] Created — `src/game/data.test.ts` ("WN-020: opens Rust Haven at intel 1 and Glass Veil and Hollow Crown at 2"), `src/state/campaignStore.test.ts` ("WN-020: at intel 1 only Rust Haven is open; at intel 2 all three are"), `src/state/appStore.test.ts` ("WN-020: Glass Veil no-ops at intel 1 while Rust Haven selects"), `src/state/save.test.ts` (describe "WN-020: Glass Veil won before the gate moved"). Retained screens: `production/qa/evidence/wn-020/` (README, intel 1 and intel 2 Scan at 1280×720).

---

## Dependencies

- Depends on: none
- Unlocks: Interface story 013 (START HERE copy assumes Rust Haven is open at intel 1)

---

## Completion Notes
**Completed**: 2026-10-22
**Criteria**: 4/4 passing, none deferred
**Deviations**: None. Manifest Version 2026-10-08 matches the current control manifest. `src/game/data.ts` matches GDD Core Rule 7 and living spec §9 (m03 = 1, m01 = 2, m02 = 2); `git diff -- src/game/data.ts` holds only the two `intelReq` lines. ADR-0012: `missionLocked` stays the gate, `campaignStore.intelLevel` the only ledger (no non-test code changed). ADR-0020: `expectedWin` is still the three authored ids (save.test.ts WN-020). Scope: `data.ts` plus the test fixtures the Implementation Notes name, including `src/state/contractNavigation.test.ts` and `src/ui/navGates.test.ts` (both assumed m01 open at intel 1). These are fixture changes, not a determinism change.
**Test Evidence**: Logic: test files present at `src/game/data.test.ts`, `src/state/campaignStore.test.ts`, `src/state/appStore.test.ts`, `src/state/save.test.ts` (existence verified here; pass/fail per the /code-review run: 61 WN-020-related tests green, 1562 in the suite). Suite reliability note from the review: `src/game/audio.test.ts:1088` (AU-006 AC 3, `audio.unlockAudio is not a function`, dynamic-import race) failed in 2 of 8 `npx vitest run` runs — pre-existing, not in this diff; file via /bug-report or /test-flakiness. Run result: OBSERVED — `production/qa/evidence/wn-020/wn-020-intel1-na-scan-1280x720.png` (INTEL 1: GLASS VEIL and HOLLOW CROWN read LOCKED / REQUIRES INTEL LVL 2, RUST HAVEN open, CHANCE 82%, ETA 3D in OPEN CONTRACTS) and `wn-020-intel2-eu-scan-1280x720.png` (INTEL 2: all three OPEN CONTRACT; GLASS VEIL CHANCE 36%, ETA 2D). Captured during /story-done with headless `playwright-cli` at 1280×720 (the /dev-story checkpoint had `Run result: N/A`); see the folder README. 0 console errors.
**Code Review**: APPROVED WITH SUGGESTIONS — specialists: lead-programmer, qa-tester, ui-programmer, gameplay-programmer (ran in the implement-stories workflow on `src/game/data.ts`, `src/game/data.test.ts`, `src/state/campaignStore.test.ts`, `src/state/appStore.test.ts`, `src/state/save.test.ts`, `src/state/contractNavigation.test.ts`, `src/ui/navGates.test.ts`).
**Mutation Check**: Mutation check: FAILED AS EXPECTED — src/game/data.ts:275 `intelReq: 1` → `2` (m03) → `WN-020: opens Rust Haven at intel 1 and Glass Veil and Hollow Crown at 2` and `WN-020: at intel 1 only Rust Haven is open; at intel 2 all three are` failed; restored (cmp match, test file green)
**Advisory findings (from /code-review, not applied)**:
- `src/game/data.test.ts:153` — the "rest of each authored record is untouched" assertion pins only id/codename/city/sector; AC3's "no other field changed" is proven by the git diff and the living spec §9 table, not by the test. Narrow the comment or extend the projection (threat, reward, etaDays, objective ids).
- `src/state/save.test.ts:1657` — the failed-campaign test's final `selectMission('m01')` at intel 1 is now refused by `missionLocked` alone (loss awards 0 intel), so it no longer isolates the `campaignFailed` guard. Use `'m03'`.
- `src/state/campaignStore.test.ts:90` — no intel 3 case (intel 0 is unreachable; `save.ts:504` rejects intelLevel < 1). One-line addition to the loop.
- `src/state/save.test.ts:3113` — AC4 is tested only with `app.missionId` null; a blob carrying `app.missionId 'm01'` at intel 1 restores it selected (`validSelection`, save.ts:437-441, checks MISSION_IDS only; hydrate restores unconditionally). Persistence Rule 13 accepts restoring a Screen-held selection and AC4 says "locked for new deploys" — **open question for the owner**, not a defect; add a test either way.
- `src/state/save.test.ts:3132-3143` — the second WN-020 test is not a listed story QA case and hard-codes `['m01','m02','m03']` instead of deriving from `MISSIONS`.
- `src/game/audio.test.ts:1088` — pre-existing intermittent failure (see Test Evidence); unrelated to WN-020.
- `production/sprint-status.yaml:17` — `updated:` had lost its quotes (parsed as a YAML date); restored to a quoted string in this close.
**Gates (review_mode full, automation autonomous)**: QL-TEST-COVERAGE and LP-CODE-REVIEW were not spawned — this workflow subagent has no Agent tool; the specialist /code-review record above satisfies the specialist review requirement (lead-programmer and qa-tester returned). Phase 7 took the recommended "Close the story — update file, mark Complete, log notes" (verdict COMPLETE WITH NOTES; no tech-debt rows logged). Code-review Phase 9 default taken earlier in the workflow: "Run /story-done now — suggestions noted for later".
