# Test Evidence: IF-007 Minimap, weather chip, and tutorial toasts in the mission HUD

> **Story**: `production/epics/interface/story-007-minimap-weather-chip-and-tutorial-toasts-in-the-mission.md`
> **Story Type**: UI
> **Date**: 2026-10-19
> **Tester**: Claude (headless Chrome for Testing, 1280x720, via /team-qa Phase 5, autonomous mode)
> **Build / Commit**: 0dcb87c

---

## What Was Tested

Two sources of evidence:
- **The smoke check's re-run of the retained `capture.mjs` on the current tree**, reviewed here, not re-run: `production/qa/evidence/smoke-2026-10-19/if-007/`. The script is byte-identical to the story copy, and there are 0 `src/` commits after the smoke record. Result: 27 PASS, 0 FAIL.
- **A new probe, `production/qa/evidence/team-qa-2026-10-19-s9/if-007/probe.mjs`**, for the checks the retained script lacks. Result: ALL PASS. It covered:
  - a like-for-like Standard vs Hardened minimap at all three zooms, with the objective pulse;
  - minimap up = screen up;
  - reduced motion through the Settings toggle.

Cases: `production/qa/test-cases/if-007-minimap-weather-toasts-cases.md` TC-01 to TC-09.

**Acceptance criteria covered**: AC10, AC13, AC14

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC10 | GIVEN a live mission on Standard and the same contract on Hardened, WHEN minimap contents are compared, THEN Hardened does not strip cones, patrols, civilians, or the objective pulse. Three zoom levels exist. Click/drag steers the camera. Minimap up = screen up. | PASS WITH NOTES | **Probe, Glass Veil:** at each of zooms 3, 2 and 1, both difficulties stroke the VIP Ice objective pulse at identical in-canvas centres (logged `arc()` calls). Counts: Standard 22 civilians / 15 enemies / 15 patrolling, Hardened 28 / 17 / 17. Zoom-in is disabled at the top level and zoom-out at the bottom. Dragging the view box up moves the camera toward screen-up (cos 1.000). **Smoke:** a click moves focus (48,84.5 → 14.68,81.62), and so does a drag, and `minimap draw code never reads difficulty`. Note: no frame shows sight cones (Alert 0), so cones rest on the code read, not a capture (qa-lead). |
| AC13 | GIVEN the first mission with tutorial unseen, WHEN toasts for Select, Move, Attack, stances, role ability, items, weapon swap, and Extraction are shown, THEN they name current bindings, never block input, never pause the sim, and Skip Tutorial marks all steps seen. | PASS WITH NOTES | All 8 required toasts show, plus DIRECTIVES (`TUTORIAL n/9`). Keys: `1-4`, `0 / \``, `H`, `C`, `Q`, `E / M`, `R`, `V`. After the remap, `J holds position`. The sim runs under a toast (t 6.96 → 8.18), a keyboard select lands (`["a1"]`), and a world click reaches the canvas. Skip marks every step seen. qa-lead R5: EXTRACTION and DIRECTIVES have no binding, so they are outside "name current bindings". qa-lead R6: the 9th toast is accepted for QA; game-designer should write it back into AC13/GDD or remove it. |
| AC14 | GIVEN a weather front at its scripted tactical time, WHEN the front hits, THEN the Comm log prints a line and the HUD Weather chip matches live weather. | PASS | `heavy -> light`. The chip reads `HEAVY RAIN` before the front and `LIGHT RAIN` after it. The comm log prints `22:16:38 WEATHER FRONT. RAIN LIFTS. GUARD SIGHT INCREASED.` |

---

## Screenshots / Video

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `team-qa-2026-10-19-s9/if-007/probe-01s-minimap-zoom-3-standard.png`, `probe-01-minimap-zoom-3-hardened.png` | Zoom 3, Standard vs Hardened | AC10 |
| 2 | `team-qa-2026-10-19-s9/if-007/probe-02s-minimap-zoom-2-standard.png`, `probe-02-minimap-zoom-2-hardened.png` | Zoom 2, Standard vs Hardened | AC10 |
| 3 | `team-qa-2026-10-19-s9/if-007/probe-03s-minimap-zoom-1-standard.png`, `probe-03-minimap-zoom-1-hardened.png` | Zoom 1, Standard vs Hardened | AC10 |
| 4 | `team-qa-2026-10-19-s9/if-007/probe-04-main-before.png`, `probe-05-main-after-up.png` | Main view before and after dragging the minimap view up | AC10 |
| 5 | `team-qa-2026-10-19-s9/if-007/probe-06-reduced-motion-a.png`, `probe-06-reduced-motion-b.png` | Reduced motion: steady objective ring 500 ms apart | (qa-lead check) |
| 6 | `smoke-2026-10-19/if-007/05-toast-1-selection.png` … `13-toast-9-extraction.png` | The nine tutorial toasts | AC13 |
| 7 | `smoke-2026-10-19/if-007/01-standard-hud-weather-before-front.png`, `14-standard-hud-weather-after-front.png` | Weather chip before and after the front | AC14 |
| 8 | `team-qa-2026-10-19-s9/if-007/probe-output.txt`, `smoke-2026-10-19/if-007/capture-output.txt` | Run transcripts | all |

Paths are relative to `production/qa/evidence/`.

---

## Test Conditions

- **Game state at start**: fresh profile per mission; Glass Veil (m01); Standard and Hardened; tutorial skipped in the probe so no toast differs between the two runs.
- **Platform / hardware**: macOS, headless Chrome for Testing (chromium-1247), 1280x720; `npm run dev` on port 4200.
- **Framerate during test**: not measured in this run.
- **Any special setup required**:
  - Store jump to a live mission (Team Deploy → startMission).
  - `settingsStore.setDifficulty`, `tutorialStore.skipTutorial` (probe), `setBindingOverride` for the remap (smoke).
  - Extra `world.tick()` calls to reach the front at sim 150 s (smoke).
  - Zoom, drag, pause, the REDUCED MOTION toggle, CLOSE and RESUME are real input.

---

## Observations

- **Reduced motion** (`design/gdd/interface.md` §14: "looping pulses frozen"), enabled through the Settings toggle: one steady ring, radius 18.56 and alpha 0.7. With it off, the radius moves from 15.6 to 21.0 within 500 ms.
- **First probe run:** the pixel-colour filter missed the alpha-blended pulse, and a click inside the camera view box grabs the box instead of panning, which is correct behaviour. The probe was fixed (arc logging, view-box drag) and re-run.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | Not required: UI story, closed by the retained screenshots | — | — |
| QA lead | qa-lead (agent, /team-qa Phase 5 review, `team-qa-2026-10-19-s9/qa-lead-review.md`) | 2026-10-19 | [x] Approved — SIGNED WITH NOTES |

qa-lead also ruled that AC10, AC13 and AC14 may be ticked in the story file. That edit was not made by this run.

---

*Template: `.claude/docs/templates/test-evidence.md`*
