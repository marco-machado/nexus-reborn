# Change Impact: World Network (difficulty curve approval)

**Date**: 2026-10-21
**GDD**: `design/gdd/world-network.md` (living spec `docs/game-design.md` §5, §9, §12 and `design/gdd/economy-and-contracts.md` Core Rule 11 changed the same day)
**Source decision**: `design/difficulty-curve.md`, approved by the project owner 2026-10-21. Living-spec §19 closed questions are untouched.
**Run**: `/propagate-design-change design/gdd/world-network.md`, workflow full, automation autonomous. TD-CHANGE-IMPACT: **CONCERNS** (implementation notes only; every classification upheld). Resolution: impact assessment revised with the director's items A–E below; no ADR revised or superseded.

---

## Change Summary: world-network.md

Changed sections:
- **Player Fantasy** (first minute): the open authored contract at intel 1 is Rust Haven; Glass Veil shows locked.
- **Core Rule 7 (Intel)**: authored gates swap. Was "Hollow Crown and Rust Haven require intel 2" (Glass Veil at 1). Now Rust Haven opens at intel 1; Glass Veil and Hollow Crown require intel 2. Generated gates unchanged (moderate 1 / high 2 / severe 3). Intel awards unchanged (+40, +15 clean, from 25/100).
- **Core Rule 10 (Contracts on Scan)**: one Moderate generated offer is open at New Operation in a Secure sector; Economy seeds the instance from the market seed; World Network presents it. Market rules after it unchanged (cap 3, roll every 2–6 h, first checkpoint at `CONTRACT_MIN_SEC`).
- **Core Rule 13 (First-visit overlay)**: nine rows become four (THE JOB, START HERE, STRATEGIC TIME, the four numbers). Influence is taught on the sector panel the first time an action is affordable; Research by a prompt on the first Debrief. Interface owns chrome and copy.
- **Acceptance Criteria, Opening desk**: two new rows (Rust Haven selectable and Glass Veil / Hollow Crown locked at intel 1 with exactly one deterministic Moderate offer open; overlay has four rows and no Influence or Research row).
- **Open Questions**: intel-1 stall narrowed; arrival-evidence item revised.

Unchanged sections: Core Rules 1–6, 8, 9, 11, 12, 14; States and Transitions; Interactions; Formulas; Edge Cases; Dependencies; Tuning Knobs; every other AC group.

Key changes affecting architecture:
1. Authored `intelReq` values in `src/game/data.ts` (CONTRACT FILE): m03 Rust Haven 2 → 1, m01 Glass Veil 1 → 2. `missionLocked(mission, intelLevel)` and `campaignStore.intelLevel` are untouched; `WorldMap.tsx` reads `intelReq` from data, so no other non-test code changes.
2. Initial `worldStore` market state gains one generated record at New Operation, drawn by stepping `contractRngState` from `INITIAL_CONTRACT_RNG`, restricted to Secure sectors. `nextContractT` stays `INITIAL_NEXT_CONTRACT_T`. The record uses the existing `GeneratedContract` shape (`CONTRACT_KEYS`), so `validateSave` accepts it unchanged.
3. Two new one-shot teaching moments (Research on first Debrief; Influence on the sector panel) need standalone seen ids in `SEEN_IDS`.

Downstream GDDs to re-check: `economy-and-contracts.md` (Core Rule 11 updated this run); `interface.md` (own run, `change-impact-2026-10-21-interface.md`); `tactical-mission.md` and `research.md` alias the intel gates and need no text change. `design/registry/entities.yaml` has no entry for the authored intel gates or the first-roll time.

---

## ADRs loaded

22 ADRs by scan (workflow full). Affected set: 8 — ADR-0009, 0012, 0014, 0018, 0020, 0021 reference `world-network.md` (all via requirements table); ADR-0003 (contract pipeline shape) and ADR-0011 (campaign-blob content) by subject. The other 14 are out of scope for this cascade and are not described as verified.

## Impact Analysis

### ADR-0003: Authored and generated contracts are the same kind of work
Status: ✅ Still Valid
Assumed: one pipeline; generated work leaves the market when fulfilled or failed. Now: the seeded Moderate instance is an ordinary generated record through brief → assembly → mission → debrief. Action: keep as-is.

### ADR-0009: Partitioned deploy snapshot
Status: ✅ Still Valid
Assumed: `wn` slice = sector / control / unrest; Intel is not a field; `economy.generated` boolean. Now: slices unchanged; a seeded contract deploys with `generated: true`. Action: keep as-is.

### ADR-0011: Campaign persistence envelope
Status: ✅ Still Valid (implementation notes below)
Assumed: generated-market RNG stream and tutorial progress are campaign-blob content; New Operation erases the campaign envelope only; hydrate restores then syncs. Now: more content of the same kind. `validateSave` checks seen ids for membership in `SEEN_IDS` only, so older blobs stay valid. No envelope key, inner version (10 today) or validator shape change. Action: keep as-is; carry notes A, B, C, D into the stories.

### ADR-0012: Store placement
Status: ✅ Still Valid
Assumed: Intel owner World Network, home `campaignStore.intelLevel`, gate `missionLocked`; generated owner Economy, home `worldStore.contracts` / `contractRngState` / `nextContractT`; authored contracts remain `MISSIONS` data. Now: `intelReq` is `MISSIONS` data (new values, same owner and gate); the seeded record lives in `worldStore.contracts` drawn from `contractRngState`. Seeding is initial state, not catch-up, so nothing splits out of `advanceFlow`. Action: keep as-is.

### ADR-0014: Timeline Review is a view
Status: ✅ Still Valid. Unaffected. Keep.

### ADR-0018: Catch-up collision order
Status: ✅ Still Valid
Assumed: contract generation is one checkpoint at `nextContractT`, rearm from due; a new due kind needs a new branch. Now: the seed is initial state at t = 0, like `INITIAL_EVENTS`; `nextContractT` unchanged; no new `Math.min` input. Action: keep as-is; the story must not implement the seed as a t = 0 checkpoint inside `advanceFlow`.

### ADR-0020: Campaign fail flags
Status: ✅ Still Valid. `selectMission` no-op on fail unchanged; `allWon` and `validateSave` `expectedWin` remain the three authored ids regardless of gate order. Keep.

### ADR-0021: Outcome DTO and apply-once key
Status: ✅ Still Valid. Unaffected. Keep.

Also checked by the director, no change: ADR-0007 (Rust Haven's 18:14:08 dusk hour is now the first authored mission; presentation only), ADR-0019 (seeded record resolves through `canDeploy` / `startMission` like any generated id), ADR-0002 (Debrief `markSeen` stays in memory; `scheduleAutosave` refuses in `debrief`, `save.ts:867`, `:874`), ADR-0022 (`markSeen` is outside `applyDebrief`; filing status unaffected).

---

## TD-CHANGE-IMPACT: CONCERNS — items carried into the stories

**A. Seen-id extension point.** `HINT_IDS` is toast copy fired by the sim and input layer through `fireHint`. The Debrief Research prompt is not a toast. Use the `WORLD_ONBOARD_ID` pattern: a standalone id appended to `SEEN_IDS` (`src/game/tutorial.ts:149–152`), marked with `useTutorialStore.markSeen` (`src/state/tutorialStore.ts:57`); Interface draws the panel.

**B. Second seen id.** Core Rule 13 moves Influence teaching to the sector panel "the first time an action is affordable". That is also once per campaign: its own standalone id in `SEEN_IDS`, unless Interface derives the moment from state.

**C. Leaving Debrief.** A "go to Research" control on the prompt must exit through `returnFromDebrief` (`src/state/appStore.ts:226`, drops `missionId`) and then route; never a raw `goto('research')`, which would carry the selected contract into the next Screen autosave (ADR-0011 lists it as not in the blob).

**D. Two literal sites and one upgrade path.** Initial market state is a literal in `useWorldStore` create (`src/state/worldStore.ts:799–801`) and in `startNewOperation` (`src/state/save.ts:979–981`); both must call one shared helper (for example `initialMarket()` returning `{ contracts, contractRngState, nextContractT }`). The v3 → v4 upgrade (`save.ts:675–676`) writes `contracts: []` / `INITIAL_CONTRACT_RNG` for an existing campaign and must stay unseeded. Open for the story: whether the seed posts the usual "OPEN CONTRACT … POSTED" Feed line (changes `events` and `unread` at New Operation); the World Network owner decides, it must not happen by accident.

**E. Deterministic fixtures shift.** The seed steps `contractRngState` before the first checkpoint, so every later market roll in a new campaign changes; golden values in `save.test.ts`, `worldStore.test.ts` and `contracts.test.ts` move. The `intelReq` swap breaks m01 / m03 lock assertions in `data.test.ts`, `campaignStore.test.ts`, `appStore.test.ts` and related tests. Determinism is preserved; the fixtures change. The stories must say so, so a reviewer does not read the diffs as a determinism regression.

**Purity and guard (director's answer to the seeding question).** Apply the Secure restriction by narrowing the input list, not by changing `pickSector` weights: a pure `rollOpeningContract(inputs, state)` in `contracts.ts` that filters `garrison === 'SECURE'`, or the filter in `worldStore` before `rollContract`. `contractInputs` is module-private in `worldStore` (`:442`), so the seed helper belongs there. `pickSector` on an empty list returns `undefined`; at static data four open sectors are Secure (control 68, 62, 55, 73 against the `>= 55` line at `worldStore.ts:1051`). Add a test asserting at least one Secure input at initial state so retuning `atlas.ts` cannot crash New Operation.

---

## Resolution decisions

| ADR | Decision | Autonomous-mode log |
|---|---|---|
| ADR-0003, 0009, 0011, 0012, 0014, 0018, 0020, 0021 | Keep as-is | No ask: every ADR Still Valid; no `architecture_decisions` or `schema_changes` category triggered |
| TD CONCERNS | Revise the impact assessment (notes A–E folded in above) | Category: minor; classifications unchanged, so no re-analysis |

ADRs to write or update: none.

## Follow-up actions

1. `/propagate-design-change design/gdd/interface.md` — run the same day; see `change-impact-2026-10-21-interface.md`.
2. Stories for the four approved changes (`/quick-design` or `/create-stories` against Interface and World Network epics), each carrying the relevant notes A–E and the Purity and guard paragraph. Suggested split: (i) `intelReq` swap + test fixture update; (ii) seeded opening offer + `initialMarket()` helper + Secure-input test + Feed-line decision; (iii) four-row orientation card + sector-panel Influence moment; (iv) first-Debrief Research prompt + `returnFromDebrief` routing; (v) Brief KIT line (Interface run).
3. Playtests 2 and 3 on the implemented arc (gate blocker 2), using `design/difficulty-curve.md` Validation Checklist.
4. No `/architecture-review` needed: no ADR text changed.

**Verdict: COMPLETE** — change impact report saved.
