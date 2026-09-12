# Architecture Review Report
Date: 2026-09-10
Engine: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 (`WebGPURenderer`, WebGL2 fallback)
GDDs Reviewed: 11 (`design/gdd/` — 8 systems + game-concept, game-pillars, systems-index)
ADRs Reviewed: 12 (10 Accepted, 2 Proposed: ADR-0009, ADR-0010)
Mode: `/architecture-review` full (`production/review-mode.txt`)
TR registry: `docs/architecture/tr-registry.yaml`
Traceability index: `docs/architecture/traceability-index.md`
Prior review: `docs/architecture/architecture-review-2026-09-09.md`

Loaded 11 GDDs, 12 ADRs, engine: React 19.2.8 + three.js 0.185.1 WebGPU. Reused 64 TR-IDs from the 2026-09-09 registry. No new TR-IDs. No `docs/consistency-failures.md`. No `docs/architecture/architecture.md`. No stories under `production/epics/` — RTM skipped.

TD-ARCHITECTURE skipped — no `docs/architecture/architecture.md`.
LP-FEASIBILITY skipped — no `docs/architecture/architecture.md`.
Engine specialist (`lead-programmer`): APPROVE 2026-09-10.

Delta vs 2026-09-09: +4 ADRs (0009 Proposed, 0010 Proposed, 0011 Accepted, 0012 Accepted). Coverage 31/11/22 → **44/4/16**.

---

## Traceability Summary
Total requirements: 64
✅ Covered: 44 (68.8%)
⚠️ Partial: 4 (6.3%)
❌ Gaps: 16 (25.0%)

ADRs 0001–0008 still cite `docs/game-design.md`. ADRs 0009–0012 cite `design/gdd/*.md` TR-IDs. Coverage is from ADR decision text (implicit counts as covered). Proposed ADRs that explicitly address a TR count as covered, with Status noted in the matrix.

Full matrix: `docs/architecture/traceability-index.md`.

---

## Coverage Gaps (no ADR exists)

### Foundation / Core
- ❌ TR-world-network-011: world-network.md → World Network → Timeline Review is not an advancement path
  Suggested ADR: `/architecture-decision Timeline Review is a view, not a clock`
  Domain: Timing · Engine Risk: LOW
- ❌ TR-economy-001: economy-and-contracts.md → Economy → Credits ledger never negative / overdraft refuse
  Suggested ADR: `/architecture-decision Credits never overdraw`
  Domain: Economy · Engine Risk: LOW
- ❌ TR-persistence-008: persistence-and-validation.md → Persistence → Telemetry opt-in, local, cap 60
  Suggested ADR: `/architecture-decision Telemetry never leaves the machine`
  Domain: Persistence · Engine Risk: LOW
  Note: ADR-0011 names the telemetry envelope and explicitly leaves cap / privacy / New Operation vs log to this gap (OQ1).

### Feature / Presentation
- ❌ TR-roster-001: roster-and-assembly.md → Roster → Deploy gate 1–4 Ready / mass ≤ 400 kg · Domain: Gameplay · LOW
- ❌ TR-roster-007: roster-and-assembly.md → Roster → Empty incomplete roster fails; complete stays complete · Domain: State · LOW
- ❌ TR-tactical-002: tactical-mission.md → Tactical → Five verbs + auto-acquire; custom sim · Domain: Gameplay · LOW
- ❌ TR-tactical-006: tactical-mission.md → Tactical → Fire-lane first-Unit resolve · Domain: Gameplay · LOW
- ❌ TR-tactical-007: tactical-mission.md → Tactical → Deterministic citygen / walk grid · Domain: Geometry · MEDIUM
- ❌ TR-tactical-008: tactical-mission.md → Tactical → Camera / minimap pose contract · Domain: Rendering · MEDIUM
  Note: ADR-0010 stamps runtime camera helpers and explicitly does **not** claim this TR.
- ❌ TR-tactical-009: tactical-mission.md → Tactical → Hardened discrete profile · Domain: Gameplay · LOW
- ❌ TR-interface-001: interface.md → Interface → One OS / tokens / no `public/` art · Domain: Rendering/UI · MEDIUM
- ❌ TR-interface-002: interface.md → Interface → 1280×720 / non-color cues · Domain: UI · LOW
- ❌ TR-interface-003: interface.md → Interface → Phase router · Domain: UI · LOW
- ❌ TR-interface-007: interface.md → Interface → Remap table / input platform · Domain: Input · LOW
- ❌ TR-audio-003: audio.md → Audio → Mixer failure / late-load drop · Domain: Audio · MEDIUM
- ❌ TR-audio-004: audio.md → Audio → No VO / spatial / celebration sting · Domain: Audio · LOW

Remaining partials: TR-world-network-003 (catch-up collision/rearm); TR-research-005 (Economy debit / no research ledger; abort covered, overdraft is TR-economy-001); TR-audio-001 (settings envelope named, four-bus schema not); TR-audio-002 (weather script exists, mixer lifetimes not).

Closed since 2026-09-09: TR-world-network-007, TR-economy-005, TR-economy-006, TR-economy-007, TR-research-004, TR-persistence-002, TR-persistence-004, TR-persistence-006, TR-persistence-007, TR-roster-005, TR-tactical-011, TR-interface-004, TR-interface-005.

---

## Cross-ADR Conflicts

Known conflict-prone areas (no `docs/consistency-failures.md`; 2026-09-09 list): worn slotted ids; generated-market store vs owner; intel on `campaignStore`; `quietReplay` live restamp vs frozen slice; debrief in-memory vs durable commit.

**Those five are resolved on paper:**
- Worn ids / snapshot slices → ADR-0009 (Proposed) + GDD sync 2026-09-10.
- Intel home / generated market home → ADR-0012 (Accepted).
- `quietReplay` stamp source → ADR-0009 (Proposed).
- Three envelopes + debrief memory vs next-Screen durable write → ADR-0011 (Accepted).

No ADR-vs-ADR 🔴 CONFLICT. The twelve ADRs do not claim the same exclusive data, do not disagree on DTO direction, and do not allocate a frame budget.

Complementary, not conflicting:
- ADR-0009: Intel is not a WN deploy-slice field. ADR-0012: Intel live home is `campaignStore`.
- ADR-0008: Influence wallet on `worldStore`. ADR-0012: Intel is not Influence.
- ADR-0010: scene reads `getWorld()`. ADR-0009: sim does not live-read campaign stores.
- ADR-0011: do not serialize the ADR-0009 freeze. ADR-0009: freeze is memory-only.
- ADR-0011: settings quality persist must not tear live `createRoot`. ADR-0010: quality step-down is next-mission.

GDD-level leftover (not an ADR conflict): World Network acceptance still says “snapshot DTO” while ADR-0009 forbids that name. GDDs otherwise aligned on four named slices.

Minor doc rot (not conflicts): ADR-0001 still links `0007-opening-hour.md` (file is `adr-0007-opening-hour.md`); several GDDs link `../architecture/` from `design/gdd/` (wrong relative path — should be `../../docs/architecture/`); `docs/technical-preferences.md` ADR log stops at ADR-0008; `design/gdd/game-concept.md` still says engine-reference / `/setup-engine` are missing.

---

## ADR Dependency Order

All `Depends On` targets exist. No cycles.

Unresolved for implementation (Status, not missing files):
- ⚠️ ADR-0009 depends on ADR-0002, ADR-0005, ADR-0004 (all Accepted) — ADR-0009 is still **Proposed** (TD-ADR / LP-FEASIBILITY CONCERNS). Do not schedule deploy-freeze stories as if Accepted.
- ⚠️ ADR-0010 Depends On None — still **Proposed** (LP-FEASIBILITY CONCERNS: Key Interfaces cite live identifiers; tick clamp and HUD sync stay in `world.ts`). Do not schedule mission-canvas stories as if Accepted.
- ADR-0011 (Accepted) cites ADR-0009 / ADR-0010 as must-not-contradict and does **not** wait on their Acceptance. Process coupling, not a blocked Depends On.

### Recommended ADR Implementation Order (topologically sorted)
Foundation (no dependencies):
1. ADR-0001: Two clocks, never both (Accepted)
2. ADR-0002: A mission in progress is not saved (Accepted)
3. ADR-0003: Authored and generated contracts are the same kind of work (Accepted)
4. ADR-0005: Research is a program; bays wear blueprints (Accepted)
5. ADR-0006: Weather is a script, not a roll mid-fight (Accepted)
6. ADR-0008: Influence is a wallet; tax is Nexus income (Accepted)
7. ADR-0010: Mission renderer and frame loop (Proposed — no deps; gate re-run before treating as locked)

Depends on Foundation:
8. ADR-0007: Opening hour is per-mission, not the look (requires ADR-0001) (Accepted)
9. ADR-0004: A won contract does not pay twice (requires ADR-0003) (Accepted)
10. ADR-0009: Partitioned deploy snapshot (requires ADR-0002, ADR-0005, ADR-0004) (Proposed)
11. ADR-0011: Campaign persistence envelope (requires ADR-0001, ADR-0002) (Accepted)

Feature layer:
12. ADR-0012: Store placement for Intel and generated contracts (requires ADR-0011, ADR-0003) (Accepted)

---

## GDD Revision Flags
None — all GDD assumptions are consistent with verified engine behaviour.

Game-concept still says engine-reference is missing and `/setup-engine` is pending. That is documentation drift versus `docs/engine-reference/` (pinned 2026-09-08) and `docs/technical-preferences.md`, not an engine-limitation flag. Systems index was not updated (no HIGH RISK engine finding).

---

## Engine Compatibility Issues

### Engine Audit Results
Engine: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU
ADRs with Engine Compatibility section: 12 / 12 total

Deprecated API References: none used. ADR-0010 names deprecated APIs only as forbidden (`PostProcessing`, `renderAsync`, `waitForGPU`, `WebGLRenderer`, stock `<Canvas>`, `AnamorphicNode`, `THREE.Clock` as mission clock).

Stale Version References: none

Post-Cutoff API Conflicts: none

Only ADR-0010 lists **Post-Cutoff APIs Used** (not None). Claims match `modules/webgpu.md`, `modules/r3f.md`, `modules/tsl.md`, and `breaking-changes.md`: `WebGPURenderer` from `three/webgpu`; r3f 9.6.1 `createRoot` + `extend(THREE)`; `RenderPipeline` (r183); `await renderer.init()` then sync `render()` (r181); TSL `pass` / `mrt` / `bloom`.

### Engine Specialist Findings
Primary specialist: lead-programmer (`docs/technical-preferences.md`). Verdict: **APPROVE**. Blockers: none.

Audit findings 1–8 confirmed.
- r3f 9.6.1 still constructs internal `THREE.Clock` and feeds `useFrame` via `getDelta()`. Consuming opaque `useFrame` dt is required on this pin. Do not `new THREE.Clock()` / `new THREE.Timer()` in `src/`. Do not migrate r3f internals to `Timer` (would be r3f 9.7+ / a fork).
- Effects `useFrame` priority 1 as the only GPU submit is correct for 9.6.1 (`internal.priority` disables auto `gl.render()`).
- Residuals (non-blocking): ADR-0011 `createRoot` is ReactDOM vs ADR-0010 r3f `createRoot` (name collision); r3f types `state.gl` as `WebGLRenderer` so `as never` stays; no Vite `three` → `three/webgpu` alias (do not add one); `technical-preferences.md` Allowed Libraries lists drei while ADR-0010 forbids drei `Canvas` / `View`; ADR-0010 omits `modules/tsl.md` from References Consulted; LOW tier still submits via `pipeline.render()` (bloom omitted only); performance budgets still PENDING; ADR-0001 Accepted text does not itself name the `THREE.Timer` forbid (0009/0010 do).

---

## Architecture Document Coverage
`docs/architecture/architecture.md` does not exist. `docs/city-architecture.md` is city-kit / occlusion, not the master architecture.

- Every systems-index row is missing from architecture layers.
- No data-flow section for snapshot/outcome DTOs (ADR-0009 names slices; the master doc does not exist to host them).
- No API-boundary chapter beyond individual ADRs.
- No orphaned architecture systems (there is no architecture doc to orphan).
- Layer law today lives in `AGENTS.md` and `docs/engine-reference/`, not in a master architecture doc.

---

## Verdict: CONCERNS

Simulation cuts that make this game this game (two clocks, unsaved mission, one contract kind, quiet replay, blueprints, weather script, Opening hour, Influence wallet) remain Accepted and consistent. Persistence envelope and store placement are now Accepted. Partitioned deploy snapshot and mission renderer exist as Proposed ADRs and close the previous HIGH RISK coverage holes on paper. No blocking ADR-vs-ADR conflict. Engine specialist APPROVE.

Not PASS: 16 gaps, 4 partials, no master architecture doc, and ADR-0009 / ADR-0010 still Proposed (gates CONCERNS).

Not FAIL: Foundation clocks, campaign envelope, and Intel/generated-market homes are covered; remaining Core holes are Credits overdraft, Timeline Review, and telemetry policy — serious, not a missing two-clock cut.

### Blocking Issues (must resolve before PASS)
None at FAIL severity. Before a clean PASS, at least: (1) Accept ADR-0009 and ADR-0010 after gate re-run, (2) Credits-never-overdraw ADR, (3) master `docs/architecture/architecture.md` or an explicit decision to defer it.

### Required ADRs
1. Re-run TD-ADR / LP-FEASIBILITY on ADR-0009 and ADR-0010 until Status is Accepted (closes TR-research-004 / TR-roster-005 / TR-economy-005 / TR-tactical-011 / TR-interface-004 / TR-interface-005 as locked, not paper).
2. Credits never overdraw (TR-economy-001) — leftover of TR-research-005.
3. Tactical sim contract — five verbs, fire lane, citygen seed, camera pose, Hardened (TR-tactical-002 / 006 / 007 / 008 / 009).
4. One OS / input / audio mixer — tokens, remap table, four buses, late-load drop, no VO (TR-interface-001 / 002 / 003 / 007, TR-audio-001–004).
5. Telemetry never leaves the machine (TR-persistence-008) — cap, opt-in, eviction, New Operation vs log.
6. Timeline Review is a view, not a clock (TR-world-network-011).
7. Deploy gate + campaign fail flags (TR-roster-001 / TR-roster-007).
