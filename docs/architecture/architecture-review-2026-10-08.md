# Architecture Review Report
Date: 2026-10-08 (fourth full pass; after the 2026-09-22, 2026-10-07 and 2026-10-08 GDD cross-reviews)
Engine: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 (`WebGPURenderer`, WebGL2 fallback)
GDDs Reviewed: 15 files in `design/gdd/` — 8 systems + game-concept, game-pillars, systems-index (requirement sources); six `gdd-cross-review-*` records read for decisions only
ADRs Reviewed: 20 (all Accepted)
Mode: `/architecture-review` full, rigor standard
TR registry: `docs/architecture/tr-registry.yaml` v7
Traceability matrix: `docs/architecture/requirements-traceability.md`
Prior review: `architecture-review-2026-09-11.md` (no receipt stamps — every file read as NEW; full re-run)

Loaded 11 requirement-bearing GDDs, 20 ADRs, engine: React 19.2.8 + three.js 0.185.1 WebGPU (installed `node_modules` versions match the pin). Reused 66 TR-IDs. 3 new TR-IDs. No deprecations. No `docs/consistency-failures.md`. No stories under `production/epics/` — RTM skipped.

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
✅ Covered: 66
⚠️ Partial: 3
❌ Gaps: 0

All covering ADRs are Accepted. The three partials are new requirements written into the GDDs on 2026-09-22 and 2026-10-07 after the ADRs they lean on were accepted. The registry v6 refresh (2026-09-22) added only TR-tactical-012 and TR-interface-008 and missed TR-economy-011 and TR-persistence-009 from the same GDD commit (`63d895b`).

Full matrix: `docs/architecture/requirements-traceability.md`.

### New requirements (Partial)

| TR-ID | GDD | Requirement | ADR Coverage | Why partial |
|---|---|---|---|---|
| TR-economy-010 | economy-and-contracts.md (Outcome DTO, 2026-10-07); world-network.md AC | Apply-once key is minted at deploy, carried on the Economy slice, and echoed unchanged on the outcome DTO; an outcome whose key was already applied is a no-op, including Credits and the Tax deposits it triggered | ADR-0002, ADR-0009 | ADR-0002 states apply-once as a principle only. ADR-0009 Key Interfaces `economy` has no key field. ADR-0020 §Context line 45 names `outcomeApplied` vs `outcomeSerial` as the guard; the GDD records that `setOutcome` mints `outcomeSerial` on every call, so that guard covers campaign and World Network apply only, not Credits. Owner chose the deploy-minted key as canonical (cross-review 2026-10-08 W-01). |
| TR-economy-011 | economy-and-contracts.md, tactical-mission.md (2026-09-22) | Tactical emits completed optional objective ids and no priced `reward` / `bonus` CR; Economy prices the optional bonus at debrief from the frozen Economy-slice bonus defs | ADR-0009 | ADR-0009 Decision says "Tactical counts; Economy prices", but its Key Interfaces type `bonusDefs: readonly number[]` carries no ids to match reported completions against, and `architecture.md` `MissionOutcome` still carries mission-side `reward` / `bonus`. |
| TR-persistence-009 | persistence-and-validation.md (AC, 2026-09-22) | Durable-commit (filing) status — unfiled / filed / write-failed — is observable to Interface; a swallowed write failure never reports filed | ADR-0011 | ADR-0011 covers the swallow (`writeSave` catch, no throw) but names no status signal for Interface to read. |

### Superseded requirements (GDD changed after the ADR)

- **ADR-0020** line 45: "The apply-once guard is Debrief `outcomeApplied` vs `outcomeSerial`" — superseded for Credits by the deploy-minted key (TR-economy-010).
- **ADR-0009** Key Interfaces (`economy`) and **architecture.md** lines 264 and 296–311 (`economy` slice, `MissionOutcome`) — predate the apply-once key and id-based bonus pricing (TR-economy-010, TR-economy-011).

Known code divergences already recorded in the GDDs (`quietReplay` live fallback, collateral clamp, pricing owner) are implementation debt against Accepted ADRs or GDD rules, not architecture gaps.

---

## Cross-ADR Conflicts

None. No two ADRs claim the same data, define incompatible interfaces, split a budget, or form a cycle. ADR-0012 / ADR-0013 (Credits on `appStore`; no `economyStore`) and ADR-0009 / ADR-0019 (slices vs gate) scope each other explicitly. The ADR-0020 line above is an ADR-vs-GDD drift, not an ADR-vs-ADR conflict.

## ADR Dependency Order

`adr-dep-graph.sh`: 20 ADRs, 27 edges, no `CYCLE`, no `NO_DEPS_SECTION`. Every depended-on ADR is Accepted.

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

## GDD Revision Flags

None — all GDD assumptions consistent with verified engine behaviour. Systems index unchanged.

## Engine Compatibility Issues

### Engine Audit Results
Engine: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU
ADRs with Engine Compatibility section: 20 / 20

Deprecated API references: none. `<Canvas>`, `renderAsync`, `waitForGPU`, `PostProcessing`, `WebGLRenderer`, and `THREE.Clock` appear only as prohibitions (ADR-0010, ADR-0014).

Stale version references: none. Every ADR names the same pin; ADR-0001–0008 reference it through `docs/technical-preferences.md`.

Post-cutoff API conflicts: none. Only ADR-0010 (`WebGPURenderer`, `await init()`, `createRoot`, `RenderPipeline`, TSL `pass`/`mrt`/`bloom`) and ADR-0016 (`three/webgpu` `PerspectiveCamera`) claim post-cutoff APIs; both agree with `modules/webgpu.md`, `modules/r3f.md`, `modules/tsl.md`.

### Engine Specialist Findings

Not re-run this pass. Carried forward: lead-programmer FEASIBLE 2026-09-11 (17/17 audit items confirmed against lockfile and `node_modules`). Since that pass, ADR edits are three one-line rewordings (ADR-0010 and ADR-0016 budget wording; ADR-0013 research rider), none engine-facing, and the pin is unchanged (`VERSION.md` re-verified 2026-10-07; installed versions re-read 2026-10-08).

## Architecture Document Coverage

All eight systems in `systems-index.md` appear in the `architecture.md` layer map. No orphaned architecture.

Stale against current GDDs:
- API Boundaries: `economy` slice (line 264) and `MissionOutcome` (lines 296–311) lack the apply-once key and completed optional ids (TR-economy-010, TR-economy-011).
- Data Flow §3 Save / load: no durable-commit status path to Interface (TR-persistence-009).
- Document Status and §Traceability still read "66 / 66 covered".
- `traceability-index.md` is a superseded duplicate of `requirements-traceability.md` (hygiene).

---

### Verdict: CONCERNS

Three Core-layer requirements are partially covered, and ADR-0009 / ADR-0020 / `architecture.md` text has drifted from the current Economy and Persistence GDDs. No blocking cross-ADR conflict, no cycle, no Proposed coverage, engine consistent.

### Blocking Issues

None (CONCERNS verdict).

### Required ADRs

1. `/architecture-decision outcome-dto-and-apply-once-key` — TR-economy-010, TR-economy-011. Core. Engine risk LOW. Amends ADR-0009 Key Interfaces (`economy.applyKey`, bonus defs keyed by objective id; `MissionOutcome` carries completed optional ids, Economy prices `bonus`) and supersedes ADR-0020 line 45 for the Credits guard.
2. `/architecture-decision durable-commit-status` (or an ADR-0011 amendment) — TR-persistence-009. Core. Engine risk LOW.

Then refresh `architecture.md` API Boundaries and Data Flow §3.
