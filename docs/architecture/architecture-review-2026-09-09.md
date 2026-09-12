# Architecture Review Report
Date: 2026-09-09
Engine: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 (`WebGPURenderer`, WebGL2 fallback)
GDDs Reviewed: 11 (`design/gdd/` — 8 systems + game-concept, game-pillars, systems-index)
ADRs Reviewed: 8 (all Accepted)
Mode: `/architecture-review` full
TR registry: `docs/architecture/tr-registry.yaml`
Traceability index: `docs/architecture/traceability-index.md`

Loaded 11 GDDs, 8 ADRs, engine: React 19.2.8 + three.js 0.185.1 WebGPU. No prior TR registry. No `docs/consistency-failures.md`. No `docs/architecture/architecture.md`. No stories under `production/epics/` — RTM skipped.

---

## Traceability Summary
Total requirements: 64
✅ Covered: 31 (48.4%)
⚠️ Partial: 11 (17.2%)
❌ Gaps: 22 (34.4%)

ADRs cite `docs/game-design.md`, not `design/gdd/*.md`. Coverage is from ADR decision text (implicit counts as covered).

Full matrix: `docs/architecture/traceability-index.md`.

---

## Coverage Gaps (no ADR exists)

### Foundation / Core
- ❌ TR-world-network-007: world-network.md → World Network → Intel access resource / store placement
  Suggested ADR: `/architecture-decision Intel lives on the World Network blob`
  Domain: Persistence · Engine Risk: LOW
- ❌ TR-world-network-011: world-network.md → World Network → Timeline Review is not an advancement path
  Suggested ADR: `/architecture-decision Timeline Review is a view, not a clock`
  Domain: Timing · Engine Risk: LOW
- ❌ TR-economy-001: economy-and-contracts.md → Economy → Credits ledger never negative / overdraft refuse
  Suggested ADR: `/architecture-decision Credits never overdraw`
  Domain: Economy · Engine Risk: LOW
- ❌ TR-economy-007: economy-and-contracts.md → Economy → Tactical counts `civiliansHit`; Economy prices
  Suggested ADR: `/architecture-decision Tactical counts civiliansHit; Economy prices`
  Domain: Integration · Engine Risk: LOW
- ❌ TR-persistence-006: persistence-and-validation.md → Persistence → Invalid blob all-or-nothing
  Suggested ADR: `/architecture-decision Campaign hydrate is all-or-nothing`
  Domain: Persistence · Engine Risk: LOW
- ❌ TR-persistence-007: persistence-and-validation.md → Persistence → Serialized strategy RNG
  Suggested ADR: `/architecture-decision Strategy RNG streams are part of the campaign blob`
  Domain: Persistence · Engine Risk: LOW
- ❌ TR-persistence-008: persistence-and-validation.md → Persistence → Telemetry opt-in, local, cap 60
  Suggested ADR: `/architecture-decision Telemetry never leaves the machine`
  Domain: Persistence · Engine Risk: LOW

### Feature / Presentation
- ❌ TR-roster-001: roster-and-assembly.md → Roster → Deploy gate 1–4 Ready / mass ≤ 400 kg · Domain: Gameplay · LOW
- ❌ TR-roster-007: roster-and-assembly.md → Roster → Empty incomplete roster fails; complete stays complete · Domain: State · LOW
- ❌ TR-tactical-002: tactical-mission.md → Tactical → Five verbs + auto-acquire; custom sim · Domain: Gameplay · LOW
- ❌ TR-tactical-006: tactical-mission.md → Tactical → Fire-lane first-Unit resolve · Domain: Gameplay · LOW
- ❌ TR-tactical-007: tactical-mission.md → Tactical → Deterministic citygen / walk grid · Domain: Geometry · MEDIUM
- ❌ TR-tactical-008: tactical-mission.md → Tactical → Camera / minimap pose contract · Domain: Rendering · MEDIUM
- ❌ TR-tactical-009: tactical-mission.md → Tactical → Hardened discrete profile · Domain: Gameplay · LOW
- ❌ TR-interface-001: interface.md → Interface → One OS / tokens / no `public/` art · Domain: Rendering/UI · MEDIUM
- ❌ TR-interface-002: interface.md → Interface → 1280×720 / non-color cues · Domain: UI · LOW
- ❌ TR-interface-003: interface.md → Interface → Phase router · Domain: UI · LOW
- ❌ TR-interface-004: interface.md → Interface → Per-frame data out of React · Domain: Rendering · HIGH
- ❌ TR-interface-005: interface.md → Interface → WebGPU + r3f `createRoot` · Domain: Rendering · HIGH
- ❌ TR-interface-007: interface.md → Interface → Remap table / input platform · Domain: Input · LOW
- ❌ TR-audio-003: audio.md → Audio → Mixer failure / late-load drop · Domain: Audio · MEDIUM
- ❌ TR-audio-004: audio.md → Audio → No VO / spatial / celebration sting · Domain: Audio · LOW

Highest-priority partials: TR-research-004 / TR-roster-005 (worn-ids dual-home); TR-economy-005 (unnamed snapshot slices); TR-economy-006 (generated-market store); TR-world-network-003 (catch-up collision order); TR-persistence-002 / TR-persistence-004 (three-slot schema; memory vs durable debrief); TR-tactical-011 (`quietReplay` stamp source).

---

## Cross-ADR Conflicts

Known conflict-prone areas (no `docs/consistency-failures.md`; from GDD Open Questions): worn slotted ids; generated-market store vs owner; intel on `campaignStore`; `quietReplay` live restamp vs frozen slice; debrief in-memory vs durable commit.

No ADR-vs-ADR 🔴 CONFLICT. The eight Accepted ADRs do not claim the same exclusive data, do not disagree on DTO direction, and do not allocate a frame budget.

GDD-level integration tension (architecture has not picked a winner):

**Worn slotted ids dual-home.** Research GDD puts resolved worn ids on the Research slice. Roster GDD forbids that and puts them on the Roster slice. Tactical consumes Roster wear + Research unslotted and refuses a third cut. ADR-0005 decides wear rules, not which snapshot field owns the ids. Impact: `/create-epics` can generate two incompatible deploy DTOs. Resolution: one ADR that names the partitioned snapshot and the single owner of resolved wear.

Minor doc rot (not conflicts): ADR-0001 links `0007-opening-hour.md` (file is `adr-0007-opening-hour.md`); World Network GDD links `../architecture/` from `design/gdd/` (wrong relative path).

---

## ADR Dependency Order

All listed dependencies exist and are Accepted. No unresolved dependencies. No cycles.

### Recommended ADR Implementation Order (topologically sorted)
Foundation (no dependencies):
1. ADR-0001: Two clocks, never both
2. ADR-0002: A mission in progress is not saved
3. ADR-0003: Authored and generated contracts are the same kind of work
4. ADR-0005: Research is a program; bays wear blueprints
5. ADR-0006: Weather is a script, not a roll mid-fight
6. ADR-0008: Influence is a wallet; tax is Nexus income

Depends on Foundation:
7. ADR-0007: Opening hour is per-mission, not the look (requires ADR-0001)
8. ADR-0004: A won contract does not pay twice (requires ADR-0003)

---

## GDD Revision Flags
None — all GDD assumptions are consistent with verified engine behaviour.

Game-concept still says engine-reference is missing. That is documentation drift versus `docs/engine-reference/` (pinned 2026-09-08), not an engine-limitation flag. Systems index was not updated.

---

## Engine Compatibility Issues

### Engine Audit Results
Engine: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU
ADRs with Engine Compatibility section: 8 / 8 total

Deprecated API References: none

Stale Version References: none

Post-Cutoff API Conflicts: none

All eight ADRs set **Post-Cutoff APIs Used: None** and cite the same pin.

### Engine Specialist Findings
Primary specialist: lead-programmer (`docs/technical-preferences.md`). Audit verdict: confirm. Blockers: none.

- Findings 1–8 of the Phase 5 audit confirmed. ADRs are simulation/economy cuts; they do not decide renderer, r3f root, TSL, input, mixer, Zustand boundaries, or the frame loop.
- Clock vocabulary collision: ADR-0001 / ADR-0006 / ADR-0007 never name `src/ui/clock.ts` versus `THREE.Timer`. Do not migrate game clocks.
- ADR-0007 Domain is Core and does not cite `webgpu.md`; the ADR text itself still forbids a live sky. `Atmosphere.tsx` uses opaque scene background (r185-correct).
- Copy-paste Engine Compatibility on all eight; none cite `breaking-changes.md` or `modules/`.
- No HIGH RISK GDD revision flags. Missing rendering ADRs are coverage gaps, not design/engine contradictions.

`docs/architecture/architecture.md` is absent, so architecture-doc director gates (TD-ARCHITECTURE / LP-FEASIBILITY) were not run.

---

## Architecture Document Coverage
`docs/architecture/architecture.md` does not exist. `docs/city-architecture.md` is city-kit / occlusion, not the master architecture.

- Every systems-index row is missing from architecture layers.
- No data-flow section for snapshot/outcome DTOs.
- No API-boundary doc for the partitioned deploy snapshot.
- No orphaned architecture systems (there is no architecture doc to orphan).
- Layer law today lives in `AGENTS.md` and `docs/engine-reference/`, not in ADRs.

---

## Verdict: CONCERNS

Simulation cuts that make this game this game (two clocks, unsaved mission, one contract kind, quiet replay, blueprints, weather script, Opening hour, Influence wallet) are Accepted and consistent. No blocking ADR-vs-ADR conflict.

Not PASS: 22 gaps, 11 partials, no master architecture doc, no renderer/frame-loop ADR on a HIGH knowledge-risk stack, and the Research vs Roster wear-slice dual-home is unresolved.

Not FAIL: Foundation clocks, persistence cut, and economy identity are covered; remaining Core holes are store placement, ledger/overdraft, and snapshot field ownership — serious, not a missing two-clock cut.

### Blocking Issues (must resolve before PASS)
None at FAIL severity. Before a clean PASS, at least: (1) wear-slice / partitioned-snapshot ADR, (2) renderer + frame-loop ADR, (3) persistence envelope (three slots + hydrate + RNG).

### Required ADRs
1. Partitioned deploy snapshot — names WN / Economy / Research / Roster slices; resolved wear has one owner (closes TR-research-004 / TR-roster-005 / TR-economy-005).
2. Mission renderer and frame loop — `WebGPURenderer` + `await init()` + `createRoot`; per-frame data out of React; game clocks ≠ `THREE.Timer` (TR-interface-004 / TR-interface-005). HIGH engine risk.
3. Campaign persistence envelope — three slots, all-or-nothing hydrate, serialized strategy RNG, debrief memory vs next-Screen durable write (TR-persistence-002 / 004 / 006 / 007).
4. Store placement — Intel blob; generated contracts vs `worldStore` (TR-world-network-007, TR-economy-006).
5. Credits never overdraw (TR-economy-001) + count-vs-price for collateral (TR-economy-007).
6. Tactical sim contract — five verbs, fire lane, citygen seed, camera pose, Hardened (TR-tactical-002 / 006 / 007 / 008 / 009).
7. One OS / input / audio mixer — tokens, remap table, four buses (TR-interface-001 / 007, TR-audio-001–004).
