# Story 002: Critical state has non-color cues; one OS styling

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: Visual/Feel
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/interface.md`
**Requirement**: `TR-interface-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer  
**ADR Decision Summary**: One palette, one remap table, four audio buses; DOM screens at 1280×720; keyboard and mouse only.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM / Zustand 5 work; the ADR lists no post-cutoff API (its Knowledge Risk HIGH is the project-wide pin note). Select primitives or use `useShallow` in selectors; do not use React 19.2 `<Activity>` / `useEffectEvent` to hide phases.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Required: Named colours are dual-owned by `src/index.css` `:root` and `src/ui/tokens.ts`; TS / SVG / canvas paints import from `tokens.ts`.
- Required: Critical state is never color-only.
- Forbidden: a second palette runtime / CSS-in-JS palette; scattered hex.
- Guardrail: colours from `src/ui/tokens.ts` / `src/index.css` only; screens work at 1280×720 without clipping (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/interface.md`, scoped to this story:*

- [ ] (AC2) GIVEN critical states selection, focus, injury/KIA, lock, objective, Alert, and result, WHEN each is shown, THEN each has a readable non-color cue. Hue, where used, follows living §12: teal for selection and live state, Ledger Amber for price and spend authorization only, red for danger, VIP Ice for the active objective. Nominal Green is not a tactical-feed cue.
- [ ] (AC3) GIVEN Menu and Mission HUD captures, WHEN their styling is checked against living §12/§14, THEN both use the shared near-black ground, the reconciled semantic roles (teal selection, Ledger Amber price and spend authorization, red danger, VIP Ice active objective), monospace uppercase labels, primary values larger than labels, and technical borders. Record the observed elements and deviations; overall visual coherence is a recorded visual-review judgment, not an unnamed numeric gate.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Selection, focus, injury/KIA, lock, objective, Alert and result each get a glyph, label, or border treatment in addition to hue.
- A palette change touches `src/index.css` and `src/ui/tokens.ts` and nothing else; `:root.s-high-contrast` remaps CSS variables only.
- Record observed elements and deviations for the Menu and Mission HUD captures; coherence is a recorded visual-review judgment.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 001: layout and text scale.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**:
- Visual/Feel: a retained screenshot in `production/qa/evidence/` + sign-off in `production/qa/evidence/story-002-critical-state-has-non-color-cues-one-os-styling-evidence.md`. Screens must work at 1280×720 without clipping or truncation.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001
- Unlocks: None
