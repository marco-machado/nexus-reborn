# Research is a program; bays wear blueprints

The laboratories still fund one program. Ballistics stays unslotted and squad-wide. Cybernetics and Control Systems are slotted: each operative wears at most one completed project per augmentation bay. A project is a blueprint, not an instance — every operative may wear Neural Cache. Unpinned bays follow current issue, including new hires. Pins hold stock issue or an older completed project. Death drops the assignment, not the program. Effects are sampled at deploy from what is worn.

A global label was honest and small. Unique implants would have been a locker, which this game forbids. Assignment from the unlocked program is the cut that lets operatives differ without owning equipment.

## Status
Accepted

## Date
2026-08-18

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Configured in `docs/technical-preferences.md`: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU |
| **Domain** | Core |
| **Knowledge Risk** | HIGH — cutoff May 2025; pin is three.js r185 / React 19.2.8. See `docs/engine-reference/web/VERSION.md` |
| **References Consulted** | `docs/engine-reference/web/VERSION.md`; `docs/technical-preferences.md` |
| **Post-Cutoff APIs Used** | None — this decision is research assignment, not an engine API |
| **Verification Required** | Ballistics is squad-wide. Slotted bays wear at most one completed project. Effects are sampled at deploy from what is worn. Death drops assignment, not the program. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | None |
| **Enables** | None |
| **Blocks** | None |
| **Ordering Note** | Unique implants would be a locker; this game forbids owned equipment. |

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| docs/game-design.md §7–8 | Research is a program; slotted projects are worn blueprints, one per bay | Lets operatives differ without an equipment locker |
