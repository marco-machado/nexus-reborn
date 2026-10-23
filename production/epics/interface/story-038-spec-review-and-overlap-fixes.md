# Story 038: Spec-review findings — label in name, Debrief Balance and invoice, no overlapping boxes

> **Epic**: Interface
> **Status**: Complete
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-23

## Context

**GDD**: `design/gdd/interface.md` (AC1; AC19; Rule 6)
**Requirement**: `TR-interface-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: the `/ux-review` passes of `design/ux/brief.md`, `debrief.md`, `assembly.md`, `settings.md`, `research.md` (all APPROVED 2026-10-23) and the every-surface sweep's new checks (WCAG 2.2 SC 2.5.3 Label in Name; positioned boxes over each other). Committed rows: contextual accessible labels; no clipping or overlap; pause and Settings focus trap and restore.

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer
**ADR Decision Summary**: One palette; Screens at 1280×720 without clipping; critical state never colour-only; keyboard and mouse.
**ADR Version**: 2026-09-10
**Engine**: React 19.2.8 + Vite 6.4.3 | **Risk**: HIGH (ADR-0017 Knowledge Risk) | **Engine Notes**: DOM and CSS only.

**Control Manifest Rules (this layer)**:
- Required: palette tokens only; no overlap or clipping at four text scales.

---

## Acceptance Criteria

- [x] GIVEN every surface WHEN each button's or slider's first visible line with letters (more than one character) is compared with its accessible name THEN it appears there as whole words (WCAG 2.5.3): UNDERSTOOD ×3, `n UNREAD`, RECRUIT ×2, Item slots, DEPLOY TEAM, OPEN RESEARCH, BALANCE DATA, AUTHORIZE PROJECT, RESET ALL, the Quality segments, EXPORT JSON and SKIP TUTORIAL now start with their visible label.
- [x] GIVEN the Debrief WHEN Balance is open THEN Escape closes it and focus returns to BALANCE DATA; the invoice is a named scroll region (`Mission invoice`) with the P-15 cut-edge fade; the CAMPAIGN FAILED banner is `role="status"`.
- [x] GIVEN every surface at 1280×720 and four text scales WHEN positioned boxes with text are compared THEN none covers another: the Brief recon readouts and target callout share one column on panel ground; the World Network inset tag clears both steppers; the HUD toasts clear the weapons bar and the comms panel gives back width as the weapons bar grows (also at ≤1360 px). The screen write-failure notice prints Red Hot words on a red frame (no amber: amber is money only).

---

## Implementation Notes

- Labels: `WorldMap.tsx`, `index.tsx`, `Research.tsx`, `Settings.tsx`, `Balance.tsx`, `TutorialToasts.tsx`.
- `Balance.tsx` `escapeCloses` prop (Debrief only); `bits.tsx` `ScrollBox` `region` prop; `.db-card` shrink rule excludes the scroll wrap.
- `ui.css`: `.mb-rright` column, panel ground for recon type; `.wm-inset-tag` left 32 px; `.hud-toasts` bottom follows the text scale; `.hud-comms` narrow-window width follows the text scale; `.write-fail-notice` Red Hot.
- `filingStatus.ts`: the write-failure line is adopted copy (comment).

---

## QA Test Cases

- **AC-1 / AC-3**: `production/qa/evidence/screens-2026-10-23/sweep.mjs` (label-in-name, boxoverlap, plus all earlier checks) — 0 on World Network, Menu, Settings, Research, Brief, Assembly, Debrief, Mission HUD, Pause, Balance; World Network probe ALL PASS.
- **AC-2**: `focus.mjs` — 16 checks incl. Debrief Balance Escape and the invoice region.

---

## Test Evidence

**Story Type**: UI
**Status**: [x] Created — `sweep-output.txt`, `focus-output.txt`, `production/qa/evidence/sprint-011/probe-output.txt`.

---

## Dependencies

- Depends on: IF-037
- Unlocks: agent playtests 3 and 4

---

## Completion Notes
**Completed**: 2026-10-23
**Verdict**: COMPLETE
**Criteria**: 3/3
**Test Evidence**: the new label-in-name check found 21 mismatches across 8 surfaces before the fix (first version was too strict on multi-line buttons and was narrowed to the visible label); the box-overlap check found the Brief callout over the readouts at 125%, the World Network stepper over the inset tag at 125%, the HUD toasts over the weapons bar at 110/125 and the comms panel against it at 125%; all 0 after. vitest 1644/1644, lint clean, build OK.
