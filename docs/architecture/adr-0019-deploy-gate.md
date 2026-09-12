# ADR-0019: Deploy gate

> **Engine specialist**: APPROVE 2026-09-11
> **Technical Director Review (TD-ADR)**: APPROVED 2026-09-11
> **Lead Programmer Review (LP-FEASIBILITY)**: FEASIBLE 2026-09-11 (re-run; prior CONCERNS closed by Key Interfaces: `canDeploy` bag + `startMission` no-op)

Roster owns the Assembly deploy gate. Every mission deploys one to four Ready operatives. Empty Squad bays do not block. Mass over `MASS_LIMIT_KG` (400) refuses; equal is allowed. Interface shows the reason. Tactical does not re-own the gate.

Key Interfaces name `canDeploy` and `startMission` so extractors do not invent a third start path.

## Status
Accepted

## Date
2026-09-11

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU |
| **Domain** | Gameplay |
| **Knowledge Risk** | HIGH — cutoff May 2025; pin is three.js r185 / React 19.2.8. This domain uses no three.js / r3f APIs. |
| **References Consulted** | `docs/engine-reference/web/VERSION.md`; `breaking-changes.md`; `deprecated-apis.md`; `docs/technical-preferences.md`; `design/gdd/roster-and-assembly.md`; `design/gdd/interface.md`; `design/gdd/tactical-mission.md`; `src/game/mass.ts`; `src/ui/index.tsx`; `src/state/appStore.ts`; `src/game/world.ts` |
| **Post-Cutoff APIs Used** | None — the gate is TypeScript + Zustand, not an engine API |
| **Verification Required** | Deploy refused without a selected contract, with 0 assigned, with any assigned Injured, or with squad mass > 400. 1–4 Ready with mass ≤ 400 allowed. Empty bays do not block. Equal 400 allowed. Button names overage. `createWorld` uses `squadMassKg` for tier/speed only — not `MASS_LIMIT_KG`. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0002 (Accepted — freeze at mission create) |
| **Enables** | Completes TR-roster-001 |
| **Blocks** | None named as epics yet |
| **Ordering Note** | Does not supersede ADR-0002 / ADR-0005 / ADR-0009. Does not own campaign-fail flags (TR-roster-007). Does not own hire Credits refuse (ADR-0013). ADR-0009 is Accepted and owns slices, not this gate. Frozen mass/tier consumption waits on ADR-0009; the four-check gate does not. |

## Context

### Problem Statement

TR-roster-001 is an ADR gap. Without a stamp, stories can require all four bays filled, treat empty bays as a fail, refuse at exactly 400 kg, or make mass-over a warning only.

### Constraints

- Pillar **Command, do not micromanage**: sending fewer than four is a command, not a fail.
- Freeze at mission create (ADR-0002). No live store handles into the sim (ADR-0009).
- Economy owns hire Credits refuse (ADR-0013). This gate is not a Credits check.
- Interface presents Enabled/Refused; Roster owns the rule. Tactical does not re-own 1–4 / 400 kg.
- Brownfield: stamp `mass.ts` + Assembly Deploy + `toggleOperative`. No physics mass system.
- `Physics: None` in `docs/technical-preferences.md`. Do not add Cannon, Rapier, or three.js mass.

### Requirements

- Every mission deploys **one to four Ready** operatives.
- Empty Squad bays do not block.
- Squad mass **not over** 400 kg; **equal is allowed**.
- Selected contract required. Assembly is reachable between contracts; Deploy is refused without one.
- Every assigned operative Ready. Assign Injured / KIA / a fifth / a duplicate is refused.
- Over-mass refuses and the button names the overage.

## Decision

Stamp the existing gate. Do not add a physics or engine mass system.

### Four checks (all required)

1. **Selected contract** — `appStore.missionId` resolves to a mission.
2. **At least one assigned** — `squad.length >= 1`.
3. **Every assigned Ready** — `roster[id].status === 'READY'` for each assigned id.
4. **Mass not over the limit** — `massKg <= MASS_LIMIT_KG` (400). Equal is allowed. `massKg > 400` refuses. No epsilon that would allow 400.1.

Empty bays do not block. 1–4 Ready is valid. Inspection ≠ assignment. While editing, `toggleOperative` will not empty the last assigned bay; that is an edit constraint, not a post-KIA invariant. A kill may empty all four; Deploy then refuses zero assigned.

Cannot assign Injured, KIA, a fifth bay, or the same operative twice.

### Mass authority

`src/game/mass.ts` owns `MASS_LIMIT_KG`, `squadMassKg`, `operativeMassKg`, and `massTier`. Assembly uses `squadMassKg` for the gate. `createWorld` uses `squadMassKg` **only** to feed `massTier` / `tierSpeedDelta`. It does **not** read `MASS_LIMIT_KG`. Light ≤ 340 / standard / heavy > 380 is not the gate; the 400 kg hard refuse is.

Base and role-granted item pools do not add Deployment mass; explicit Item slots do. The whole squad shares one tier. Do not put `MASS_LIMIT_KG` in `world.ts`. Tactical must not re-check or relax the gate.

After ADR-0009 is Accepted, `createWorld` should consume frozen Roster mass/tier rather than a second live-store read. Kilogram **functions** stay in `mass.ts`.

### Enforcement

Today the four checks live in Assembly UI (`deployable`). `createWorld` assumes a legal squad. That is the brownfield stamp, not the long-term contract.

- `goto('mission')` is **not** a public start API. It must not remain the way a second caller starts a fight.
- Any start-mission path must apply the same four checks. Extract a pure `canDeploy` (or `deployGate`) in `src/game` — never `src/scene`, never a Zustand `getState()` helper that secretly reads three stores.
- Add `startMission()` on `appStore` that **no-ops** unless `canDeploy` is ok (same pattern as `spendCredits`). Team Deploy calls `startMission`, not raw `goto('mission')`.

Zero-assigned currently sharing Injured aria/subtitle copy is Interface presentation, not this gate. When extracting `canDeploy`, split `none-assigned` vs `not-ready` so a post-KIA empty squad does not show the injured refusal.

Not this ADR: campaign fail on empty roster (TR-roster-007); hire Credits; wear/pins (ADR-0005); partitioned slices (ADR-0009); quiet replay roster (ADR-0004).

### Architecture Diagram

```
Assembly (Interface presents)
  mass.ts.squadMassKg(assigned, hpBonus, loadout)
  canDeploy({ missionSelected, assignedIds, statusById, massKg })
    → { ok, reason, overKg }
  startMission()                // no-op unless canDeploy.ok
    → freeze DeployParams (ADR-0009)
    → createWorld(frozen)       // squadMassKg → massTier only; no MASS_LIMIT
    → phase mission

toggleOperative                 // edit: keep ≥1, READY only, cap 4
  ≠ post-KIA empty bays         // Deploy then fails none-assigned
```

### Key Interfaces

Pure helper in `src/game` (name `canDeploy` or `deployGate`; extract allowed later, signature is now):

```
canDeploy({
  missionSelected: boolean,
  assignedIds: readonly string[],
  statusById: Readonly<Record<string, 'READY' | 'INJURED' | …>>,
  massKg: number,
}): {
  ok: boolean,
  reason: 'no-contract' | 'none-assigned' | 'not-ready' | 'over-mass' | null,
  overKg: number,
}
```

- `ok` is true iff all four checks pass. `reason` is null when `ok`.
- `overKg` is `massKg - MASS_LIMIT_KG` (may be ≤ 0 when ok).
- UI presents `reason` / overage. Tactical / `createWorld` must not call this to relax or re-own the gate.
- Do not put the helper in `src/scene`.

Start path:

- `startMission(): void` — identity no-op unless `canDeploy.ok`; then freeze + `phase: 'mission'`.
- `goto('mission')` is not a public start API.

Also:

- `MASS_LIMIT_KG = 400` in `src/game/mass.ts`.
- `squadMassKg` / `massTier` — Assembly (gate) and `createWorld` (tier only).
- `appStore.squad` (1–4 ids), `missionId`, `loadout`.
- `campaignStore.roster[id].status`.
- `toggleOperative` assignment constraints.

## Alternatives Considered

### Alternative 1: Require all four bays filled

- **Description**: Deploy refused unless every Squad bay has a Ready operative.
- **Pros**: Always a full fireteam.
- **Cons**: Contradicts GDD and the command pillar; empty bays would be a fail.
- **Rejection Reason**: Sending fewer than four is a command, not a fail.

### Alternative 2: Soft-cap mass

- **Description**: Allow mass over 400; apply only the heavy speed tier.
- **Pros**: Never blocks Deploy for kilograms.
- **Cons**: GDD says over refuses and the button names the overage.
- **Rejection Reason**: The 400 kg hard refuse is the gate; tier is a separate speed band.

## Consequences

### Positive

- 1–4 Ready is a command. Empty bays do not block.
- Kilograms the player reads are the kilograms `mass.ts` applies.
- Equal 400 kg is legal. Over names the overage.

### Negative

- Until `canDeploy` / `startMission` are extracted, the four checks live in Assembly JSX and `goto('mission')` can skip them.
- Mass is IEEE float; do not invent a milligram epsilon. `massKg <= 400` is the rule.

### Risks

- A second start-mission path that calls `goto('mission')` skips the gate. Mitigation: `startMission` no-op.
- Forking a second `MASS_LIMIT` or treating `massTier` as the refuse.
- Physics-engine mass or three.js mass.
- React 19.2 `<Activity>` / `useEffectEvent` keeping Assembly mounted across Deploy (ADR-0017 already forbids Activity for phase hide).
- After ADR-0009, live-recomputing mass inside `createWorld` from stores.

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| roster-and-assembly.md | TR-roster-001: 1–4 Ready; empty bays legal; mass ≤ 400 kg | Four-check gate; empty bays do not block; `MASS_LIMIT_KG` 400; equal allowed |
| roster-and-assembly.md | Core Rules 2–4, 19; AC 1–4, 8–10, 52, 69 | Selected contract; ≥1 assigned; all assigned Ready; over refuses and names overage |
| interface.md | Assembly Deploy Enabled / Refused; show the reason | Interface presents; Roster owns; `reason` + `overKg` |
| tactical-mission.md | 1–4 Ready and mass gate are not Tactical knobs | Tactical consumes the frozen squad; no `MASS_LIMIT` in `world.ts` |

## Performance Implications

- **CPU**: Negligible (sum of ≤4 operatives).
- **Memory**: None claimed.
- **Load Time**: None.
- **Network**: None.

## Migration Plan

Stamp the live Assembly predicate and `mass.ts`. Extract `canDeploy` in `src/game` and `startMission` on `appStore` so Team Deploy does not call raw `goto('mission')`. Do not move `MASS_LIMIT_KG` into `world.ts`. Do not wait on ADR-0009 to stamp the four checks; wait on ADR-0009 only to stop live mass recompute in `createWorld`.

## Validation Criteria

- GIVEN a selected contract, mass ≤ 400, and exactly 1 / 2 / 3 / 4 assigned Ready (other bays empty), WHEN Deploy is requested, THEN it is allowed (AC 1–4).
- GIVEN no selected contract, 0 assigned, or any assigned Injured, WHEN Deploy is requested, THEN it is refused (AC 8–10).
- GIVEN `squad_mass = 400.1` kg, THEN refused and the overage is named (AC 52). GIVEN `squad_mass ≤ 400`, THEN `mass_gate_ok` (AC 69).
- `mass.test.ts` covers kg and tier; it does not replace the composite-gate ACs.
- `createWorld` does not import `MASS_LIMIT_KG`.

## Related Decisions

- [ADR-0002](adr-0002-unsaved-mission.md) — freeze at create
- [ADR-0005](adr-0005-blueprint-assignment.md) — wear / pins
- [ADR-0009](adr-0009-partitioned-deploy-snapshot.md) — slices; frozen mass/tier later
- [ADR-0013](adr-0013-credits-never-overdraw.md) — hire Credits, not this gate
- [ADR-0016](adr-0016-tactical-sim-contract.md) — Tactical does not re-own the gate
- [ADR-0017](adr-0017-one-os-input-audio-mixer.md) — no `<Activity>` for phase hide
