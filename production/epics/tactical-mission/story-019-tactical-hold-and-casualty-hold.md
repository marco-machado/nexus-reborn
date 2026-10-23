# Story 019: Tactical hold — Space stops time with orders open; a casualty holds it once

> **Epic**: Tactical mission
> **Status**: Complete
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-23

## Context

**GDD**: `design/gdd/tactical-mission.md` (tactical clock; pause); `design/gdd/interface.md` Rule 12 and AC11 (pause chrome)
**Requirement**: `TR-tactical-005` (in-mission pause freezes the tactical clock), `TR-interface-007` (one remap table; reserved rows)
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: agent playtests 3 and 4: an operative went from 40–80% health to dead in 2–3 game-seconds, CASUALTY RISK fired once per campaign and after the first death, and the menu pause refuses every order, so no order could be given in time. Living spec §16 lists "a tactical pause" as a player advantage. CD-PLAYTEST 2026-10-23 warned that a casualty hold accepting orders beside a player pause refusing them gives two pauses with opposite rules, and recommended one state the player can also enter.

**ADR Governing Implementation**: ADR-0016: Tactical sim contract
**ADR Decision Summary**: Five verbs; deterministic custom sim; the tactical clock is independent of strategic time and stops when the mission is paused.
**ADR Version**: per `docs/architecture/adr-0016-tactical-sim-contract.md`
**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW | **Engine Notes**: the hold is a store flag read by `frameTick`; the banner is DOM.

**Control Manifest Rules (this layer)**:
- Required: deterministic sim (no RNG draw; the hold only stops ticks); per-frame data out of React state.
- Forbidden: a sixth verb.

---

## Acceptance Criteria

- [x] GIVEN a live mission with no result WHEN Space is pressed THEN the sim and its clock stop, no menu opens, move, attack, stance and ability orders are still taken, and Space again resumes; Escape alone opens the pause menu, which still refuses orders. The hold row is fixed (not remappable), as are pause and the operative slots.
- [x] GIVEN a living operative WHEN damage takes them under 35% of max health THEN the sim holds once, the log reads `CASUALTY RISK: <CODENAME> AT n%. TACTICAL HOLD.`, and the banner reads TACTICAL HOLD / CASUALTY RISK: <CODENAME> AT n% / ORDERS OPEN // SPACE RESUMES; the same operative holds again only after healing back over the line. A result releases the hold.

---

## Implementation Notes

- `src/game/bindings.ts` (contract file): `tacticalHold` row on Space; `pause` on Escape only; `remappable` excludes `tacticalHold`.
- `src/state/missionStore.ts` `held`, `holdReason`, `setHeld`; `setResult` clears the hold. `src/game/frameTick.ts` ticks only when not paused and not held.
- `src/game/world.ts`: `CASUALTY_HOLD_FRAC = LOW_HP_HINT_FRAC` (0.35), `casualtyCheck` from `applyDamage`, re-armed in `checkHints`.
- `src/ui/Hud.tsx` `.hud-hold` banner (`role="status"`), placed between the squad and objectives panels and wrapping at 125%.
- A focused dialog or toast button still owns Space (Interface Rule 13).

---

## QA Test Cases

- **AC-1**: `src/ui/abortArm.test.ts` describe "AC11: Escape opens a modal pause that freezes the mission; Space holds with orders open" (three tests); `src/game/bindings.test.ts` "keeps the tactical hold, pause, selectSlot and the mouse rows out of remapping".
- **AC-2**: `src/game/world.test.ts` "TM-019: crossing under 35% holds the sim with orders open, names the operative, and re-arms once healed" (mutation-checked: removing the trigger fails it). Sweep `hold-{90,100,110,125,hc}.png`: 0 failures.

---

## Test Evidence

**Story Type**: Logic
**Status**: [x] Created — tests above; vitest 1664/1664 at `2c73542`.

---

## Dependencies

- Depends on: none
- Unlocks: the human playtest at real-time speed (CD-PLAYTEST)

---

## Completion Notes
**Completed**: 2026-10-23 (code in `2c73542`; story file written after)
**Verdict**: COMPLETE
**Criteria**: 2/2
**Decision**: Claude, delegated by the owner's /goal 2026-10-23, taking CD-PLAYTEST's recommendation (one hold state, player- or casualty-entered). This changes the living spec's "Space or Escape opens a modal pause"; the spec and Interface AC11 are updated to match.
**Not done**: `/code-review` not run. Whether the hold fixes the time-to-kill finding is unverified until a human plays it.
