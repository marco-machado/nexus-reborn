# Architecture Review Report
Date: 2026-09-11 (second full pass; overwrites the 03:18 review)
Engine: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 (`WebGPURenderer`, WebGL2 fallback)
GDDs Reviewed: 11 (`design/gdd/` — 8 systems + game-concept, game-pillars, systems-index)
ADRs Reviewed: 20 (all Accepted)
Mode: `/architecture-review` full (`production/review-mode.txt`)
TR registry: `docs/architecture/tr-registry.yaml`
Traceability index: `docs/architecture/traceability-index.md`
Prior review: `docs/architecture/architecture-review-2026-09-10.md`

Loaded 11 GDDs, 20 ADRs, engine: React 19.2.8 + three.js 0.185.1 WebGPU. Reused 64 TR-IDs from the 2026-09-10 registry. No new TR-IDs. No `docs/consistency-failures.md`. No `docs/architecture/architecture.md`. No stories under `production/epics/` — RTM skipped.

TD-ARCHITECTURE skipped — no `docs/architecture/architecture.md`.
LP-FEASIBILITY skipped — no `docs/architecture/architecture.md`.
Engine specialist (`lead-programmer`): CONCERNS 2026-09-11 (no blockers).

Delta vs 03:18 same-day review: ADR-0013, ADR-0016, ADR-0017, ADR-0019, ADR-0020 are **Accepted**. Stale “Proposed” Depends-On labels are gone. World Network no longer calls the WN slice “the Snapshot DTO.” Coverage stays **64/0/0**.

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
- ADR-0017 clip / non-color + ADR-0010 Quality-not-a-lever / no live `createRoot` teardown (joint TR-interface-002).
- ADR-0019 zero-assigned Deploy refuse vs ADR-0020 empty living roster campaign fail — ADR-0020 explicitly does not import the Deploy gate.
- ADR-0018 collision table is World Network only; Research / Roster `sync(t)` stay outside `advanceFlow`.

Stale process labels from the 03:18 pass are **fixed** (ADR-0011 / ADR-0016 / ADR-0017 Ordering Notes now mark 0009 / 0010 / 0016 as Accepted).

GDD leftover from 03:18 is **fixed**: World Network forbids calling the WN slice “the Snapshot DTO.”

Doc rot (not conflicts):
- `docs/technical-preferences.md` ADR log stops at ADR-0008.
- Allowed Libraries still lists `@react-three/drei` while ADR-0010/0016 forbid drei View / OrbitControls / MapControls / CameraControls (drei 10.7.7 has no `Canvas`; that forbid is r3f).
- `design/gdd/game-concept.md` still says engine-reference / `/setup-engine` are missing.
- Some GDD footnotes still say sibling extracts “are not extracted yet.”

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

`design/gdd/game-concept.md` still says engine-reference / `/setup-engine` are missing. That is documentation drift versus `docs/engine-reference/` (pinned 2026-09-08) and `docs/technical-preferences.md`, not a HIGH RISK engine-limitation flag. Systems index was not updated.

---

## Engine Compatibility Issues

### Engine Audit Results
Engine: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU
ADRs with Engine Compatibility section: 20 / 20 total

Deprecated API References: none used as the chosen path. ADR-0010 / 0016 / 0017 name deprecated or project-forbidden APIs only as forbidden (`PostProcessing`, `renderAsync`, `waitForGPU`, `WebGLRenderer`, stock `<Canvas>`, `AnamorphicNode`, `THREE.Clock` as mission clock, `THREE.Audio` family, React 19.2 `<Activity>` / `useEffectEvent`, OrbitControls, physics addons).

Stale Version References: none. ADR-0007 is dated 2026-08-18 but its Engine field is the current pin; lighting is authored/frozen.

Post-Cutoff API Conflicts: none.

Post-Cutoff APIs Used (not None): ADR-0010 (`WebGPURenderer`, r3f `createRoot` + `extend(THREE)`, `RenderPipeline`, `await init()` then sync `render()`, TSL `pass` / `mrt` / `bloom`); ADR-0016 (`three/webgpu` import for CameraRig / GameCanvas). Claims match `modules/webgpu.md`, `modules/r3f.md`, `modules/tsl.md`, and `breaking-changes.md`. `webgpu.md` overstates “`PostProcessing` is gone”; r185 still exports a `warnOnce` subclass — ADR-0010 is the accurate pin fact.

### Engine Specialist Findings
Primary specialist: lead-programmer (`docs/technical-preferences.md`). Verdict: **CONCERNS**. Blockers: none.

Audit items 1–6 and 10–14 confirmed against lockfile + `node_modules`. Chosen path is implementable on this pin. Challenges / extras vs the 03:18 APPROVE:
- ADR-0010 References Consulted still omit `modules/tsl.md` despite `pass` / `mrt` / `bloom`.
- `technical-preferences.md` Allowed Libraries lists drei (lockfile 10.7.7) while ADR-0010/0016 forbid drei View / OrbitControls / MapControls / CameraControls; drei has no `Canvas` (`Canvas` is r3f).
- Performance budgets still PENDING; do not treat FrameGovernor 28 ms as the project FPS target.
- r3f 9.6.1 still constructs internal `THREE.Clock` and feeds `useFrame` via `getDelta()`. Consume opaque `useFrame` dt; do not `new THREE.Clock()` / `Timer()` in `src/` to silence the r183 warning.
- ADR-0011 `createRoot` is ReactDOM vs ADR-0010 r3f `createRoot` (homonym, not a conflict).
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
`docs/architecture/architecture.md` does not exist. `docs/city-architecture.md` is city-kit / occlusion, not the master architecture.

- Every systems-index row is missing from architecture layers.
- No data-flow section for snapshot/outcome DTOs (ADRs name slices; the master doc does not exist to host them).
- No API-boundary chapter beyond individual ADRs.
- No orphaned architecture systems (there is no architecture doc to orphan).
- Layer law today lives in `AGENTS.md` and `docs/engine-reference/`, not in a master architecture doc.

---

### Verdict: CONCERNS

All 64 TRs have Accepted ADR coverage. Simulation cuts, persistence envelope, store placement, deploy snapshot, renderer, Timeline Review, telemetry, catch-up order, Credits ledger, tactical sim, OS/input/audio, deploy gate, and campaign fail flags are Accepted. No blocking ADR-vs-ADR conflict.

Not PASS: no master `docs/architecture/architecture.md`, and engine/prefs hygiene is still open (drei allow-list vs ADR forbids, ADR-0010 missing `modules/tsl.md`, PENDING frame budgets, game-concept engine-reference drift). Engine specialist CONCERNS, not APPROVE.

Not FAIL: Foundation clocks, campaign envelope, Intel/generated-market homes, deploy freeze, and renderer contract are covered; remaining work is documentation, not a missing two-clock cut.

### Blocking Issues (must resolve before PASS)
None at FAIL severity. Before a clean PASS: (1) master `docs/architecture/architecture.md` or an explicit decision to defer it, (2) prefs/ADR hygiene listed under Required ADRs / remaining work.

### Required ADRs
None to create. Remaining work is documentation, not new decisions:

1. Master architecture doc (`/create-architecture`) or an explicit deferral.
2. ADR-0010: add `modules/tsl.md` to References Consulted.
3. `docs/technical-preferences.md`: extend the ADR log past ADR-0008; narrow Allowed Libraries / fill Forbidden Patterns to match ADR-0010 / 0016 / 0017.
