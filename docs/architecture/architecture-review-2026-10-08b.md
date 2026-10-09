# Architecture Review Report
Date: 2026-10-08 (fifth pass — delta after ADR-0021 and ADR-0022; same day as the fourth pass)
Engine: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 (`WebGPURenderer`, WebGL2 fallback); Zustand 5.0.14
GDDs Reviewed: 15 files in `design/gdd/` — all UNCHANGED since the fourth pass (receipt check); requirement set carried forward
ADRs Reviewed: 22 (all Accepted) — ADR-0021 and ADR-0022 NEW and read in full; ADR-0001–0020 UNCHANGED, re-checked against the new ADRs
Mode: `/architecture-review` full, rigor standard, delta scope (owner choice): requirements not re-extracted; Phases 3–6 re-run across all 22 ADRs
TR registry: `docs/architecture/tr-registry.yaml` v7 → v8 (coverage updates only)
Prior review: `architecture-review-2026-10-08.md` (fourth pass, CONCERNS)

Loaded 11 requirement-bearing GDDs (unchanged), 22 ADRs, engine: Web (React 19.2.8 + three.js r185 WebGPU; Zustand 5.0.14 installed). 69 TR-IDs reused. 0 new TR-IDs. No deprecations. No `docs/consistency-failures.md`. No stories under `production/epics/` — RTM skipped.

Reviewed-Content-Hash: docs/architecture/adr-0001-two-clocks.md 7fc596e31dbba37e196bd2533ad6a2d0c9fd584e
Reviewed-Content-Hash: docs/architecture/adr-0002-unsaved-mission.md 00030b0b71ad727d667dc31e48b8c1c1c395ad78
Reviewed-Content-Hash: docs/architecture/adr-0003-one-contract-kind.md 80594289c5b58026c4e6ee219e51b258b2cc512e
Reviewed-Content-Hash: docs/architecture/adr-0004-quiet-replay.md 7e40a62dc0b8fd787c20a51e5c59ce43b9c76123
Reviewed-Content-Hash: docs/architecture/adr-0005-blueprint-assignment.md e22e2a1ed7b43568cc85889d104562955f33a4dd
Reviewed-Content-Hash: docs/architecture/adr-0006-weather-script.md a4fd217a93ce1c272ec2d2f783861d5cef946f5b
Reviewed-Content-Hash: docs/architecture/adr-0007-opening-hour.md 696b642d3f8dd96e0f2ec5fe68d5f6ca717ca872
Reviewed-Content-Hash: docs/architecture/adr-0008-influence-is-a-wallet.md 56ce27c5ef63304a007e4949b5a71f3a9a925301
Reviewed-Content-Hash: docs/architecture/adr-0009-partitioned-deploy-snapshot.md 1092e8a10dd6ae53a980de0df5147cb4101e57b1
Reviewed-Content-Hash: docs/architecture/adr-0010-mission-renderer-and-frame-loop.md efe5a408eac4c4d18898203a3349bd72e9a7bbb0
Reviewed-Content-Hash: docs/architecture/adr-0011-campaign-persistence-envelope.md ea8637ca1b965fab3fca87298672768bb1a5bf80
Reviewed-Content-Hash: docs/architecture/adr-0012-store-placement.md da8cfd4f81ecb407588a56380452591700991e00
Reviewed-Content-Hash: docs/architecture/adr-0013-credits-never-overdraw.md 9d8c2c45af664a1b00eb39edbe0f9eb318ac824f
Reviewed-Content-Hash: docs/architecture/adr-0014-timeline-review-is-a-view.md ac92dba9e271b8b7e2abdc3d4af95c3f49f6bda1
Reviewed-Content-Hash: docs/architecture/adr-0015-telemetry-never-leaves-the-machine.md af616ec38e98b159ece74fe23b7c2ef2b9ba1092
Reviewed-Content-Hash: docs/architecture/adr-0016-tactical-sim-contract.md 0ce789b45bc771f136286ed4d63f5f0f00ffa4ba
Reviewed-Content-Hash: docs/architecture/adr-0017-one-os-input-audio-mixer.md 5c7a788664d0d0aedb19d9cb25bba9f4c596487c
Reviewed-Content-Hash: docs/architecture/adr-0018-catch-up-collision-order.md 10f653e91e252595008ccdaaca4b082952024843
Reviewed-Content-Hash: docs/architecture/adr-0019-deploy-gate.md 25950df14f68422b08b7b64d0bd1b75eb8b0fda0
Reviewed-Content-Hash: docs/architecture/adr-0020-campaign-fail-flags.md 3a4b9d5f8e7f30b4b990867a574f3b005cb8e0b6
Reviewed-Content-Hash: docs/architecture/adr-0021-outcome-dto-and-apply-once-key.md 596aaf4f750b611c954b2581e7dc93aaeef7b205
Reviewed-Content-Hash: docs/architecture/adr-0022-durable-commit-status.md e76fced84875b1883bc3eedc9904406a4ade3652
Reviewed-Content-Hash: design/gdd/audio.md d1ddb60ad2051383d37b21bc914440b02dfcb888
Reviewed-Content-Hash: design/gdd/economy-and-contracts.md 2a011b605fc3fe55312fd35ed5ca9caaa9e23980
Reviewed-Content-Hash: design/gdd/game-concept.md 78057cd4497883778e904591eadb8cbd291b4da5
Reviewed-Content-Hash: design/gdd/game-pillars.md b4c90beafa5da567cc6ae85c8bced798dcfce4bb
Reviewed-Content-Hash: design/gdd/gdd-cross-review-2026-09-16.md 7bb6550e604a80e14d7cb5b126bb38c3d3883309
Reviewed-Content-Hash: design/gdd/gdd-cross-review-2026-09-22-v2.md 619ff2b13807f45816623e839dc3fad13c629329
Reviewed-Content-Hash: design/gdd/gdd-cross-review-2026-09-22.md b4e3275661da8bc0607b96359d8956498e732f00
Reviewed-Content-Hash: design/gdd/gdd-cross-review-2026-10-07.md 500cfa143ae700836e8fd1768077460b76a5b52f
Reviewed-Content-Hash: design/gdd/gdd-cross-review-2026-10-07b.md 586ec9ece51ecb8c4e2be0abd9bf13455e502b12
Reviewed-Content-Hash: design/gdd/gdd-cross-review-2026-10-08.md 5aaa48f2c84bf75ca09f1348df561d7e77f1abf3
Reviewed-Content-Hash: design/gdd/interface.md d14a61031a580f4cddb18cb78d0dd4a107c7c1dc
Reviewed-Content-Hash: design/gdd/persistence-and-validation.md b1f6b2dc3c36170a3cadf9e0fa228575d2502137
Reviewed-Content-Hash: design/gdd/research.md 1e285c09e071b090f9624d3e74c0859ea363fde1
Reviewed-Content-Hash: design/gdd/roster-and-assembly.md f71a05d4a4be90ac46f6ecd0602ad8dc6c7c98f2
Reviewed-Content-Hash: design/gdd/systems-index.md e65d0c6aa6522098bdc55e2f7afeca1c23923b82
Reviewed-Content-Hash: design/gdd/tactical-mission.md 0e9d0cdc6a7549a2a353b1fff1fb0da39879a830
Reviewed-Content-Hash: design/gdd/world-network.md affe7345df7787d04746cc528909a94c0d96f1e9

---

## Traceability Summary
Total requirements: 69
✅ Covered: 69
⚠️ Partial: 0
❌ Gaps: 0

All covering ADRs are Accepted. The three partials from the fourth pass are closed:

| TR-ID | Requirement | Was | Now | Covering ADR |
|---|---|---|---|---|
| TR-economy-010 | Apply-once key minted at deploy, carried on the Economy slice, echoed on the outcome; an already-applied key is a no-op, including Credits and Tax deposits | ⚠️ ADR-0002, ADR-0009 | ✅ | ADR-0021 (§1 key minting, §5 `applyDebrief`), ADR-0002, ADR-0009 |
| TR-economy-011 | Tactical emits completed optional objective ids and no priced reward/bonus; Economy prices the optional bonus from frozen Economy-slice defs | ⚠️ ADR-0009 | ✅ | ADR-0021 (§2 keyed `bonusDefs`, §3 `MissionResult`, §4 `priceOutcome`), ADR-0009 |
| TR-persistence-009 | Durable-commit status (unfiled / filed / write-failed) observable to Interface; a swallowed write failure never reports filed | ⚠️ ADR-0011 | ✅ | ADR-0022 (filing-status store), ADR-0011 |

The other 66 rows are unchanged from `requirements-traceability.md`.

### Superseded requirements (GDD changed after the ADR)
None new. The fourth pass's two superseded notes are now resolved by ADR-0021 at the decision level (ADR-0020 line 45 superseded; ADR-0009 `economy` Key Interfaces amended), but neither older ADR carries an annotation — see Cross-ADR Conflicts.

---

## Cross-ADR Conflicts

### Conflict: ADR-0021 vs ADR-0013
Type: Integration contract (Credits ledger write access)
ADR-0013 claims: `setOutcome` adds `netPayout(o)` (§Deposits; diagram `setOutcome ← +netPayout`; Verification Required "`setOutcome` never subtracts"); `collateralFine` / `netPayout` derive on the fly from `reward × civiliansHit`; `netPayout` does not clamp a negative `bonus`; ADR-0015 line 96 names `MissionOutcome.telemetry` as what `world.ts` emits.
ADR-0021 claims: `setOutcome` must never change `credits`; the payout deposit is `applyDebrief → addCredits(netPayout)`; priced fields are stored once by `priceOutcome`, with `N = max(0, floor(civiliansHit))` and non-finite or negative bonus pricing to 0; `src/game` emits `MissionResult`.
Impact: `/create-control-manifest` reads Accepted ADRs and would emit both "`setOutcome` adds `netPayout`" and "`setOutcome` must never change `credits`". A story built from ADR-0013's text would bring back the double deposit that ADR-0021 removes. ADR-0021 lists ADR-0013 only under Depends On. Its Ordering Note names amendments to ADR-0009 and ADR-0020 but not to ADR-0013. `docs/registry/architecture.yaml` already marks ADR-0013's `credits_ledger` as `superseded_by: ADR-0021`, so the intended winner is not in doubt.
Resolution options:
  1. (Recommended) Add ADR-0013 to ADR-0021's Ordering Note and Related list as "amends ADR-0013 §Deposits (payout writer and pricing helpers)". Add an "Amended by ADR-0021" line to ADR-0013's §Deposits, diagram and Verification Required. Same for ADR-0015 line 96 (`MissionResult.telemetry`).
  2. Supersede ADR-0013 §Deposits with a new ADR. This is heavier and adds nothing that option 1 does not.

Not blocking. The direction is unambiguous (later ADR, registry already records it, ADR-0021 Consequences names the `credits_ledger` change). Fix it before `/create-control-manifest`.

### Annotation drift (same root, not separate conflicts)
- ADR-0009 Key Interfaces line 123 (`bonusDefs: readonly number[]`, no `applyKey`) — amended by ADR-0021 §2; ADR-0009 carries no "Amended by" note.
- ADR-0020 line 45 (`outcomeApplied` vs `outcomeSerial`) — superseded by ADR-0021; ADR-0020 carries no note.

No other overlap: ADR-0012 forbids only `economyStore` (ADR-0021 keeps pricing beside the Credits ledger on `appStore`; ADR-0022's `saveStatusStore` is a separate session-only store). ADR-0022 is additive to ADR-0011 and leaves ADR-0021's transaction unchanged. ADR-0018 / ADR-0001 order (write-back then ETA catch-up) is preserved by `applyDebrief` step 8.

---

## ADR Dependency Order

`adr-dep-graph.sh`: 22 ADRs, 36 edges, no `CYCLE`, no `NO_DEPS_SECTION`. Every depended-on ADR is Accepted.

Foundation (no dependencies):
1. ADR-0001 Two clocks
2. ADR-0002 Unsaved mission
3. ADR-0003 One contract kind
4. ADR-0005 Blueprint assignment
5. ADR-0006 Weather script
6. ADR-0008 Influence is a wallet
7. ADR-0010 Mission renderer and frame loop

Depends on Foundation:
8. ADR-0004 Quiet replay (0003)
9. ADR-0007 Opening hour (0001)
10. ADR-0011 Campaign persistence envelope (0001, 0002)
11. ADR-0018 Catch-up collision order (0001)
12. ADR-0019 Deploy gate (0002)
13. ADR-0020 Campaign fail flags (0002)

Third layer:
14. ADR-0009 Partitioned deploy snapshot (0002, 0004, 0005)
15. ADR-0012 Store placement (0003, 0011)
16. ADR-0014 Timeline Review is a view (0001, 0011)
17. ADR-0015 Telemetry never leaves the machine (0002, 0011)
18. ADR-0017 One OS / input / audio mixer (0006, 0011)

Fourth layer:
19. ADR-0013 Credits never overdraw (0002, 0011, 0012)
20. ADR-0016 Tactical sim contract (0001, 0002, 0006, 0007, 0009, 0010)

Fifth layer:
21. ADR-0021 Outcome DTO and apply-once key (0001, 0002, 0004, 0009, 0013, 0020)

Sixth layer:
22. ADR-0022 Durable-commit status (0002, 0011, 0021)

---

## GDD Revision Flags

None. All GDD assumptions are consistent with verified engine behaviour. Systems index unchanged.

---

## Engine Compatibility Issues

### Engine Audit Results
Engine: Web — React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU; Zustand 5.0.14
ADRs with Engine Compatibility section: 22 / 22

Deprecated API references: none new. ADR-0021 and ADR-0022 use no three.js / r3f API.
Stale version references: none. Both new ADRs name the current pin.
Post-cutoff API conflicts: none. Both declare "Post-Cutoff APIs Used: None".

### Engine Specialist Findings
There is no `web-specialist` agent for engine `Web`. Instead, the two version-sensitive claims in the new ADRs were checked directly against installed `node_modules`:
- ADR-0022: the `subscribe` listener receives `(state, previousState)` — confirmed in `zustand/esm/vanilla.mjs` 5.0.14. The prevState comparison the ADR requires is available.
- ADR-0022: `useShallow` is exported from `zustand/react/shallow` in 5.0.14, and `useStore` is built on `React.useSyncExternalStore`, so a selector that builds a new object each call re-renders without end. Confirmed. The primitive-selector rule is correct.
- ADR-0021 / ADR-0022: a synchronous store update inside `useLayoutEffect` flushes before paint under React 19. This is standard React behaviour, not post-cutoff. No finding.
Carried forward: lead-programmer FEASIBLE 2026-09-11 for ADR-0001–0020. Pin unchanged.

---

## Architecture Document Coverage

All eight systems in `systems-index.md` appear in the `architecture.md` layer map. No orphaned architecture.

Stale against Accepted ADRs (both ADRs' Migration Plans call for these edits, and neither is done):
- API Boundaries line 264: `economy` slice lacks `applyKey` and keeps `bonusDefs: readonly number[]` (ADR-0021 §2).
- API Boundaries lines 299–314: `MissionOutcome` still carries mission-side `reward` / `bonus`; no `MissionResult` / `priceOutcome` / `applyDebrief` (ADR-0021 §3–5).
- API Boundaries line ~320: Credits deposits do not name `applyDebrief` as the payout caller.
- Data Flow §3 Save / load: no filing-status path to Interface (ADR-0022).
- ADR Audit / §Traceability line 364: still reads "66 / 66 covered … v6"; ADR count 20.
- `traceability-index.md` is a superseded duplicate of `requirements-traceability.md` (hygiene, carried).

---

### Verdict: CONCERNS

All 69 requirements are covered by Accepted ADRs. There are no cycles, and the engine audit is consistent. Two things keep this from PASS:
1. **ADR-0021 vs ADR-0013 integration-contract conflict.** It is unannotated in ADR text and would produce contradictory control-manifest rules. It is non-blocking because the resolution direction is recorded in the registry.
2. **`architecture.md` is stale** against ADR-0021 and ADR-0022 (API Boundaries, Data Flow §3, Traceability).

### Blocking Issues
None (CONCERNS verdict).

### Required ADRs
None. Required edits (no new decisions):
1. ADR-0021 Ordering Note / Related: name ADR-0013 §Deposits (and ADR-0015 line 96) as amended. Add "Amended by ADR-0021" notes to ADR-0013, ADR-0009 (Key Interfaces) and ADR-0015, and a "Superseded by ADR-0021" note to ADR-0020 line 45.
2. Refresh `architecture.md` API Boundaries, Data Flow §3 and Traceability (69 / 69, registry v8, 22 ADRs).
