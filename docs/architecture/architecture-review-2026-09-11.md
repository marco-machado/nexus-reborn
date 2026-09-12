# Architecture Review Report
Date: 2026-09-11 (third full pass; after master architecture landed)
Engine: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 (`WebGPURenderer`, WebGL2 fallback)
GDDs Reviewed: 11 (`design/gdd/` — 8 systems + game-concept, game-pillars, systems-index)
ADRs Reviewed: 20 (all Accepted)
Mode: `/architecture-review` full (`production/review-mode.txt`)
TR registry: `docs/architecture/tr-registry.yaml`
Traceability index: `docs/architecture/traceability-index.md`
Prior review: same-day second pass (architecture.md was missing)

Loaded 11 GDDs, 20 ADRs, engine: React 19.2.8 + three.js 0.185.1 WebGPU. Reused 64 TR-IDs. No new TR-IDs. No `docs/consistency-failures.md`. No stories under `production/epics/` — RTM skipped.

TD-ARCHITECTURE: CONCERNS 2026-09-11 (hygiene; no blockers)
LP-FEASIBILITY: FEASIBLE 2026-09-11
Engine specialist (`lead-programmer`): FEASIBLE 2026-09-11 (17/17 audit items confirmed against lockfile + `node_modules`)

Delta vs earlier 2026-09-11 review: `docs/architecture/architecture.md` now exists; prefs ADR log is 0001–0020 with Forbidden Patterns filled; ADR-0010 References Consulted include `modules/tsl.md`; `game-concept.md` no longer claims engine-reference is missing. Coverage stays **64/0/0**.

---

## Traceability Summary
Total requirements: 64
✅ Covered: 64 (100%)
⚠️ Partial: 0
❌ Gaps: 0

ADRs 0001–0008 still cite `docs/game-design.md`. ADRs 0009–0020 cite `design/gdd/*.md` TR-IDs. Coverage is from ADR decision text (implicit counts as covered). All covering ADRs are Accepted.

Full matrix: `docs/architecture/traceability-index.md`.

---

## Coverage Gaps (no ADR exists)
None.

---

## Cross-ADR Conflicts

Known conflict-prone areas (no `docs/consistency-failures.md`; 2026-09-09/10 list): worn slotted ids; generated-market store vs owner; intel on `campaignStore`; `quietReplay` live restamp vs frozen slice; debrief in-memory vs durable commit.

**Those five remain resolved on paper.** No ADR-vs-ADR 🔴 CONFLICT. The twenty ADRs do not claim exclusive ownership of the same data, do not disagree on DTO direction, and do not allocate a numeric frame budget (`docs/technical-preferences.md` budgets still PENDING).

Complementary, not conflicting:
- Owner ≠ Zustand home: Credits `appStore` (ADR-0013), Influence `worldStore` (ADR-0008), Intel `campaignStore` (ADR-0012), generated contracts `worldStore` (ADR-0012).
- ADR-0010 owns canvas / init / `RenderPipeline` / frame submit; ADR-0016 owns camera pose and does not supersede ADR-0010.
- ADR-0017 clip / never-color-only + ADR-0010 Quality-not-a-lever / no live `createRoot` teardown (joint TR-interface-002).
- ADR-0019 zero-assigned Deploy refuse vs ADR-0020 empty living roster campaign fail — ADR-0020 explicitly does not import the Deploy gate.
- ADR-0018 collision table is World Network only; Research / Roster `sync(t)` stay outside `advanceFlow`.
- ADR-0011 `createRoot` is ReactDOM vs ADR-0010 r3f `createRoot` (homonym, not a conflict).

Doc rot (not conflicts):
- `docs/architecture/architecture.md` ADR Audit still says prefs ADR log stops at 0008 and Forbidden Patterns are empty — **false** after `0bc4822`.
- World Network AC still says “snapshot DTO”; Core Rule 11 forbids that name.
- Several GDDs still say sibling extracts “are not extracted yet.”

Implementation lag vs Accepted ADRs (QQ-02, not an ADR conflict): `DeployParams` is still `{ mods, district, loadout }`; `createWorld` still live-reads stores; Team Deploy still `goto('mission')`; `orderHoldFire` nulls Explicit; `orderAttack` accepts devices.

---

## ADR Dependency Order

All `Depends On` targets exist. No cycles. No Depends-On target is Proposed.

### Recommended ADR Implementation Order (topologically sorted)
Foundation (no dependencies):
1. ADR-0001: Two clocks, never both (Accepted)
2. ADR-0002: A mission in progress is not saved (Accepted)
3. ADR-0003: Authored and generated contracts are the same kind of work (Accepted)
4. ADR-0005: Research is a program; bays wear blueprints (Accepted)
5. ADR-0006: Weather is a script, not a roll mid-fight (Accepted)
6. ADR-0008: Influence is a wallet; tax is Nexus income (Accepted)
7. ADR-0010: Mission renderer and frame loop (Accepted)

Depends on Foundation:
8. ADR-0007: Opening hour is per-mission, not the look (requires ADR-0001) (Accepted)
9. ADR-0004: A won contract does not pay twice (requires ADR-0003) (Accepted)
10. ADR-0009: Partitioned deploy snapshot (requires ADR-0002, ADR-0005, ADR-0004) (Accepted)
11. ADR-0011: Campaign persistence envelope (requires ADR-0001, ADR-0002) (Accepted)
12. ADR-0018: Catch-up collision order (requires ADR-0001) (Accepted)
13. ADR-0019: Deploy gate (requires ADR-0002) (Accepted)
14. ADR-0020: Campaign fail flags (requires ADR-0002) (Accepted)

Feature layer:
15. ADR-0012: Store placement for Intel and generated contracts (requires ADR-0011, ADR-0003) (Accepted)
16. ADR-0013: Credits never overdraw (requires ADR-0012, ADR-0011, ADR-0002) (Accepted)
17. ADR-0014: Timeline Review is a view, not a clock (requires ADR-0001, ADR-0011) (Accepted)
18. ADR-0015: Telemetry never leaves the machine (requires ADR-0011, ADR-0002) (Accepted)
19. ADR-0016: Tactical sim contract (requires ADR-0001, ADR-0002, ADR-0006, ADR-0007, ADR-0009, ADR-0010) (Accepted)
20. ADR-0017: One OS / input / audio mixer (requires ADR-0011, ADR-0006) (Accepted)

---

## GDD Revision Flags
None — all GDD assumptions are consistent with verified engine behaviour.

World Network AC “snapshot DTO” is leftover wording vs Core Rule 11 / ADR-0009, not a HIGH RISK engine-limitation flag. Systems index was not updated.

---

## Engine Compatibility Issues

### Engine Audit Results
Engine: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU
ADRs with Engine Compatibility section: 20 / 20 total

Deprecated API References: none used as the chosen path. ADR-0010 / 0016 / 0017 name deprecated or project-forbidden APIs only as forbidden (`PostProcessing`, `renderAsync`, `waitForGPU`, `WebGLRenderer`, stock `<Canvas>`, `AnamorphicNode`, `THREE.Clock` as mission clock, `THREE.Audio` family, React 19.2 `<Activity>` / `useEffectEvent`, OrbitControls, physics addons).

Stale Version References: none. ADR-0007 is dated 2026-08-18 but its Engine field is the current pin; lighting is authored/frozen.

Post-Cutoff API Conflicts: none.

Post-Cutoff APIs Used (not None): ADR-0010 (`WebGPURenderer`, r3f `createRoot` + `extend(THREE)`, `RenderPipeline`, `await init()` then sync `render()`, TSL `pass` / `mrt` / `bloom`); ADR-0016 (`three/webgpu` import for CameraRig / GameCanvas). Claims match `modules/webgpu.md`, `modules/r3f.md`, `modules/tsl.md`, and `breaking-changes.md`.

Pin vs reference drift (ADR is right): `modules/webgpu.md` still says `PostProcessing` is “gone”; r185 exports a `warnOnce` wrapper. `deprecated-apis.md` says `waitForGPU` removed; the method remains and `error()`s.

### Engine Specialist Findings
Primary specialist: lead-programmer (`docs/technical-preferences.md`). Verdict: **FEASIBLE**. Blockers: none. All 17 coordinator audit items confirmed against lockfile + `node_modules`.

Chosen path is implementable on this pin:
- ADR-0010 References Consulted include `modules/tsl.md`.
- Prefs ADR log is 0001–0020; Forbidden Patterns match ADR-0010 / 0016 / 0017; drei is lockfile-only (no `src/` imports; drei has no `Canvas`).
- Performance budgets still PENDING; do not treat FrameGovernor 28 ms as the project FPS target.
- r3f 9.6.1 still constructs internal `THREE.Clock` and feeds `useFrame` via `getDelta()`. Consume opaque `useFrame` dt; do not `new THREE.Clock()` / `Timer()` in `src/` to silence the r183 warning.
- r3f types `state.gl` as `WebGLRenderer` so `as never` stays.
- No Vite `three` → `three/webgpu` alias (do not add — would break fiber internals that import `'three'`).
- Effects `useFrame` priority 1 is the only GPU submit. A second priority>0 subscriber that calls `render()` is an anti-pattern. `RenderPipeline.render()` forces `NoToneMapping` on the scene pass then applies renderer ACES — a second `gl.render()` can wipe bloom.
- `waitForGPU` still exists and `error()`s; `renderAsync` is a `warnOnce` wrapper like `PostProcessing`.
- `frameloop` default `'always'` means React 19.2 `<Activity>` would keep `useFrame` / GPU submit alive — ADR-0017 forbid is engine-correct.
- ADR-0007 lighting is custom Atmosphere hemisphere lights, not Sky/RoomEnvironment, so the r183 Sky look change does not apply.
- AUTO→MEDIUM on WebGL2 still has `bloom: true`; fallback must keep TSL `RenderPipeline`, not EffectComposer.

No accepted ADR would be wrong to implement on React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1.

---

## Architecture Document Coverage
`docs/architecture/architecture.md` exists (v1.0, 2026-09-11). `docs/city-architecture.md` is city-kit / occlusion, not a ninth GDD.

- Every systems-index row appears in architecture layers. Platform is not a ninth GDD. Persistence stays Core (schema sink).
- Data flow covers frame loop, Zustand + DTO coupling (no event bus), save/load, init order, snapshot/outcome.
- API boundaries name `WorldApi`, four-slice `DeployParams`, `canDeploy`/`startMission`, outcome DTO, Credits/save, canvas invariants. Live code lags ADR-0009/0019 (QQ-02); the doc states the ADR contracts, not the lag as the contract.
- No orphaned architecture systems.
- Stale sentence in ADR Audit: prefs ADR log / Forbidden Patterns — already fixed in `docs/technical-preferences.md`.

---

### Verdict: CONCERNS

64/64 TRs have Accepted ADR coverage. Master architecture exists. No blocking ADR-vs-ADR conflict. Engine pin is consistent. LP: FEASIBLE.

Not PASS: TD-ARCHITECTURE CONCERNS — `architecture.md` still misstates prefs hygiene; QQ-01 budgets PENDING; QQ-02 Accepted contracts not yet in `world.ts` / Team Deploy.

Not FAIL: Foundation clocks, campaign envelope, Intel/generated-market homes, deploy freeze, and renderer contract are covered; remaining work is documentation and implementing Accepted ADRs.

### Blocking Issues (must resolve before PASS)
None at FAIL severity. Before a clean PASS: (1) patch `architecture.md` ADR Audit hygiene to match prefs, (2) keep QQ-02 as implementation debt or implement ADR-0009/0019 (do not re-decide).

### Required ADRs
None to create. Remaining work is documentation and implementing Accepted ADRs:

1. Patch `architecture.md` ADR Audit hygiene (log 0001–0020; Forbidden Patterns filled; budgets still PENDING).
2. Implement ADR-0009 / ADR-0019 / ADR-0016 defect fixes — do not re-decide.
3. Engine-reference hygiene: `modules/webgpu.md` PostProcessing “gone”; `deprecated-apis.md` `waitForGPU` “removed.”
