# Story 013: Four-row orientation card and the sector-panel Influence moment

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-22

## Context

**GDD**: `design/gdd/interface.md` (States: Overlay; UI Requirements: World Network row; AC27), `design/gdd/world-network.md` (Core Rule 13; Opening desk AC), living spec §12
**Requirement**: `TR-interface-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/difficulty-curve.md` (approved 2026-10-21). Playtest 2026-10-19: the nine-row card was "too dense"; Influence actions meant nothing ("I don't even know what that is").
**Change impact**: `docs/architecture/change-impact-2026-10-21-interface.md` (notes B, G, H).

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer
**Secondary ADRs**: ADR-0011: Campaign persistence envelope (seen-set is blob content); ADR-0008: Influence is a wallet (refusal reasons are the owner's)
**ADR Decision Summary**: One palette, one remap table; overlays do not change Phase; DOM screens at 1280×720.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM / Zustand 5. Select primitives or use `useShallow`; do not use React 19.2 `<Activity>` to hide phases. Effects, not render, call store actions.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Required: disabled controls carry visible owner-reported reasons; critical state is never color-only.
- Forbidden: recomputing board rules in Interface (AC27) — affordability comes from `influenceRefusal`, never `influence >= cost`.
- Guardrail: colours from `src/ui/tokens.ts` / `src/index.css` only; 1280×720 at text scale 90–125 without clipping.

---

## Acceptance Criteria

*From GDD `design/gdd/interface.md` and `design/gdd/world-network.md`, scoped to this story:*

- [ ] (AC27) GIVEN the first-visit orientation card, WHEN it is read, THEN it holds four rows — THE JOB, START HERE, STRATEGIC TIME, the four numbers — and no Influence or Research row; START HERE names the open contract with the highest Chance; Pause/Clock speed are identified as control over strategic time; Nexus-held Tax eligibility is stated.
- [ ] (WN Opening desk) GIVEN New Operation, WHEN the card is dismissed with UNDERSTOOD, THEN `hint-worldmap` is marked seen once and the card does not return in that campaign.
- [ ] GIVEN Influence 0 at opening, WHEN the sector panel is read, THEN Stabilize and Lobby show the owner's unaffordable reason and Expedite its no-target reason, and no teaching panel is shown.
- [ ] GIVEN a clean first win (+8 Influence) and the Influence moment unseen, WHEN World Network is shown and `influenceRefusal(state, focusedSector, action) === null` for any of the three actions, THEN one teaching panel on the sector panel names the affordable action, its cost and effect; dismiss marks it seen; it never returns in that campaign, including after Influence is spent and recovers.
- [ ] GIVEN Antarctica focused, WHEN the moment would otherwise fire, THEN it does not (`locked-sector` refusal).
- [ ] (TR-interface-002) GIVEN the card and the teaching panel at 1280×720 and text scales 90 / 100 / 110 / 125, WHEN captured, THEN nothing clips or truncates.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Card copy lives in `src/ui/WorldMap.tsx` (the `WORLD NETWORK // ORIENTATION` panel). Cut to four rows. Row copy is the UX spec's to finalise (`/ux-design` World Network); use the GDD row names until then. START HERE reads the highest-Chance open, unlocked offer from the same list the Scan prints; it does not compute Chance itself.
- Influence moment: a new standalone seen id in `SEEN_IDS` (`src/game/tutorial.ts`, the `WORLD_ONBOARD_ID` pattern — not a `HintId`, which is toast copy). Trigger is the owner's `influenceRefusal(...) === null` on the focused sector. Mark with `useTutorialStore.markSeen` from an effect, guarded by `!seen.includes(id)`; `markSeen` currently calls `set` even when already seen and `scheduleAutosave` subscribes to the store, so an unguarded call on the 20 Hz sector panel would spam autosave (note G). Alternatively make `markSeen` return early when already seen.
- The mark happens on a Screen, so it is durable on the next autosave (ADR-0011). No envelope or `SAVE_VERSION` change; `validateSave` checks membership in `SEEN_IDS` only.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Interface story 014: the first-Debrief Research prompt (the Research row leaves the card here; the prompt arrives there).
- World Network story 020 and Economy story 023: the data that gives START HERE a Moderate contract to name. If they land later, START HERE still names the highest-Chance open offer, whatever it is.
- Sector readout labels for Control / Unrest (art bible §7.3/§7.5; gate recommendation) — a separate story if not covered by `/ux-design`.

---

## QA Test Cases

QA plan: none yet. Provisional, UI:

- Headless capture at 1280×720 × 4 text scales: card (four rows), sector panel at Influence 0, teaching panel at Influence 8 after a clean win fixture, Antarctica focused (no panel).
- Unit seam (`src/ui/*.test.ts`): the START HERE selector returns the highest-Chance unlocked offer; the teaching trigger is `influenceRefusal === null`, not a Credits/Influence compare; `markSeen` is called at most once per id.
- Store read in the click-through note: `tutorialStore.seen` holds `hint-worldmap` and the new id exactly once after dismissals.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each screen touched, in `production/qa/evidence/if-013/`, plus a click-through note naming the screens exercised (docs/click-through.md). Screens must work at 1280×720 without clipping or truncation.

**Status**: [ ] Not created

---

## Dependencies

- Depends on: World Network story 020 and Economy story 023 for the intended START HERE target (soft; the selector works without them)
- Unlocks: playtest 2 onboarding checklist (`design/difficulty-curve.md` Validation Checklist)

---

## Completion Notes
_(filled by `/story-done`)_
