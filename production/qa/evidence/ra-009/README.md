# RA-009 Assembly empty bays and Injured dossier QA — 2026-10-16 UTC

## Result and scope

- Result: **pass** for the story's six checklist items on the Assembly screen (partial click-through: Assembly only).
- Requested checks: `production/epics/roster-and-assembly/story-009-assembly-opens-without-auto-assign-injured-dossier.md` (GDD `design/gdd/roster-and-assembly.md` AC 7 and AC 23).
- Changed behavior under test: none. The behavior already existed (`src/state/debrief.ts` squad cleanup, `src/state/appStore.ts` `toggleOperative`, `src/ui/index.tsx` `TeamSelect`). This run verifies it in the app.
- Excluded behavior: mission play, the Debrief screen itself, keyboard and gamepad focus order, Settings UI path to text scale.

## Source and environment

| Field | Recorded value |
| --- | --- |
| Tested revision | 0563485f8d52b4d2d7eda21052acc7379cb96b53 (f6a1d1a later moved the Assembly click handlers into `src/ui/assemblyRows.ts` with the same behaviour; re-checked by click-through 2026-10-16, see `../ra-008/`) |
| Working-tree changes | Story header and `production/sprint-status.yaml` status edits only; no source changes |
| Build and tools | Vite dev server (`npm run dev -- --strictPort`, port 4200); Node v24.16.0, npm 11.18.0 |
| Machine | Apple M5 Pro |
| OS and browser | macOS 26.5.2; `playwright-cli` 0.1.22, headless Chromium |
| Rendering | Not applicable (Assembly is DOM); viewport 1280x720, DPR 1 |
| Save and origin | Fresh `playwright-cli` profile; NEW OPERATION from the main menu |
| Mission setup | Contract Glass Veil (`m01`) selected on the World Network |

## Fixture (how the AC 7 state was reached)

Constructed state, not normal play. After selecting `m01`, the page imported the live dev modules (`/src/state/appStore.ts`, `/src/state/debrief.ts`) and:

1. set the Squad to `['op1', 'op2']` (MARA, GHOST);
2. stored a lost outcome with `deadIds: ['op1']` and `survivorHp: { op2: 0.2 }`, `applyKey` one above `lastAppliedKey`;
3. called `applyDebrief('m01')` — the real Debrief apply path.

Result: MARA KIA (removed from the roster), GHOST newly INJURED, Squad `[]`, Ready on roster: DART, TORQ, SLATE, VEX, KESTREL. RAVEN starts INJURED on a new operation. Assembly was then opened from the ASSEMBLY nav tab.

Text scale 125% was set through `useSettingsStore.getState().setTextScale(125)`, the same action the Settings TEXT SCALE buttons call.

## Procedure and observations

| Check | Steps | Expected | Observed | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| AC 1 — no auto-assign | Open Assembly after the fixture | 4 bays empty | Bays 01–04 read EMPTY BAY / AWAITING ASSIGNMENT; header `0 / 4 ASSIGNED`; store Squad `[]` | pass | [01](01-assembly-empty-bays-1280x720.png) |
| Deploy refusal reason | Read the Deploy control | Refused, NO OPERATIVES ASSIGNED | Button disabled, aria-label `DEPLOY TEAM // NO OPERATIVES ASSIGNED`, subline `ASSIGN AT LEAST ONE READY OPERATIVE`; no mass or contract reason | pass | [01](01-assembly-empty-bays-1280x720.png) |
| AC 2 — inspect Injured | Click DART row body, then RAVEN row body | Dossier opens | Dossier panel reads `RAVEN / SNIPER`, `CONDITION: INJURED`, stats, role protocol, augmentations | pass | [02](02-injured-dossier-focused-1280x720.png) |
| AC 2 — assign refused | Read the Injured rows' assign key | Disabled, tooltip text | GHOST and RAVEN `+` keys `disabled`, `title="OPERATIVE INJURED // ADVANCE WORLD TIME TO RECOVER"`; Ready rows enabled, title `ASSIGN` | pass | [02](02-injured-dossier-focused-1280x720.png) |
| Focus leaves bays alone | Focus GHOST (default), DART, RAVEN | Bays unchanged | Squad `[]` and 4 EMPTY BAY after each focus | pass | [02](02-injured-dossier-focused-1280x720.png) |
| No clipping | 1280x720 at 100% and 125% text scale | No clipped row, tooltip or bay text | Visual review of both shots: text wraps (bay labels, Deploy subline), roster list scrolls; DOM scan of roster rows, bays and Deploy found 0 leaf elements overflowing a non-visible box | pass | [01](01-assembly-empty-bays-1280x720.png), [03](03-injured-dossier-125pct-1280x720.png) |

The native `title` tooltip is not drawn in a headless screenshot; its text was read from the DOM.

## Browser coverage

- Screens and interactions exercised: main menu NEW OPERATION, World Network orientation dismiss, contract select, Brief (passed through), Assembly roster row focus.
- Not exercised: mission, Debrief screen, keyboard and gamepad navigation, Settings screen.
- Console errors and warnings: `favicon.ico` 404 (x2); `THREE.Clock: This module has been deprecated` warning. Both pre-existing and unrelated.

## Limitations and follow-up

None for this story.

## Cleanup

`playwright-cli` session closed; dev server stopped; `lsof -iTCP:4200 -sTCP:LISTEN` returned nothing.
