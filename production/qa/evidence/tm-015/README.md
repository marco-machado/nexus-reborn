# TM-015 Fixed camera and Hardened minimap (manual half of AC 22, minimap half of AC 21) — 2026-10-16

## Result and scope

- Result: **pass** for the three checklist items of the story's manual half.
- Story: `production/epics/tactical-mission/story-015-hardened-profile-and-fixed-camera-pose.md` (GDD `design/gdd/tactical-mission.md` AC 21 / AC 22, ADR-0016).
- Sign-off: the story names qa-lead. This run was captured by an unattended workflow session. **qa-lead sign-off is not recorded here** (see the Sign-Off table).
- This replaces an earlier pair (`01-before-input.jpg`, `02-after-drag-wheel-arrows.jpg`) that was captured at 800x600 in the in-app pane, covered all three inputs in one pair and did not show the difficulty.

## Source and environment

| Field | Recorded value |
| --- | --- |
| Tested revision | 67f2427, with TM-015 test-file edits uncommitted (no source changes; `src/scene/CameraRig.tsx` matches HEAD) |
| Build | Vite dev server (`npm run dev -- --strictPort`, port 4200) |
| Browser | Smoke harness `../smoke-2026-10-15-s6/lib.mjs`: Chrome for Testing driven by Playwright, viewport 1280x720 (`capture.json` → `viewport`) |
| Driver | `capture.mjs` (this folder). Raw readings: `capture.json` |
| Save | Fresh profile, NEW OPERATION, contract GLASS VEIL (heavy rain) |
| Harness assist | Difficulty set to Hardened with `settingsStore.setDifficulty('hardened')` (the action the Settings button calls) before deploy. Shot 06 shows HARDENED pressed in the in-mission Settings panel. Nothing else is constructed. |

## How the pose is read

CameraRig publishes the ground footprint of the four screen corners every frame (`getCameraFootprint()` in `src/game/runtime.ts`). From it the script reads:

- `rightEdgeDeg` / `upDeg`: ground bearing of screen-right and screen-up. These are set by the yaw alone.
- `topOverBottom` / `depthOverBottom`: shape ratios of the footprint. These are set by elevation and FOV alone. Pan moves the footprint and zoom scales it (`bottomWidthM`), but neither changes the ratios.

## Observations

| Check | Expected | Observed | Status | Evidence |
| --- | --- | --- | --- | --- |
| Mission is on Hardened | difficulty hardened, sight Standard + 1 m | `difficulty: hardened`, `vision: 12.2` vs Standard `11.2` (heavy rain), 17 guards on patrol routes | pass | `capture.json` → `mission`; [06](06-settings-hardened-pressed-1280x720.png) |
| Mouse drag leaves the pose unchanged | same bearings and ratios | 01 → 02: right -45°, up -135°, ratios 1.3675 / 0.8129, focus unchanged. The drag box-selected MARA and GHOST; the camera did not move | pass | [01](01-hardened-before-drag-1280x720.png), [02](02-hardened-after-drag-1280x720.png) |
| Wheel leaves the angle unchanged (zoom only) | same bearings and ratios, width changes | 02 → 03: bearings and ratios unchanged; bottom width 49.13 m → 78.47 m (zoom out), focus unchanged | pass | [02](02-hardened-after-drag-1280x720.png), [03](03-hardened-after-wheel-1280x720.png) |
| Arrow keys leave the angle unchanged (pan only) | same bearings and ratios, focus moves | 03 → 04: bearings and ratios unchanged; focus (48, 84.5) → (46.10, 23.70) after Up then Right | pass | [03](03-hardened-after-wheel-1280x720.png), [04](04-hardened-after-arrows-1280x720.png) |
| Minimap up points the same way as screen up | panel up = screen up | In 01 the minimap viewport outline has level top and bottom edges and is wider at the top, like the screen footprint seen from a tilted eye. The off-map dark corner sits lower-left in both the 3D view and the minimap, and the streets run on the same diagonals in both. The yaw maths is pinned by `src/scene/cameraPose.test.ts` | pass | [01](01-hardened-before-drag-1280x720.png), [04](04-hardened-after-arrows-1280x720.png) |
| On Hardened, the minimap still shows patrol cones | cones drawn for guards | GHOST's Pulse Scan fired through the HUD keys (2, Q); comm log reads PULSE SCAN OUT; `scanOn: true`, 15 living guards, all `patrol`. Red sight cones show on the minimap around the guard dots | pass | [05](05-hardened-pulse-scan-cones-1280x720.png), [05b crop](05b-hardened-minimap-cones-crop.png) |

The minimap crop is 210x150 at device scale 1; zoom in to read the cones. Calm guards draw a cone only while painted (Pulse Scan or the recon passive), on Standard and Hardened alike (`src/ui/Minimap.tsx`), so the scan is how a calm-guard cone is shown at all.

Console: only the known `favicon.ico` 404.

## Sign-Off

| Role | Name | Date | Signature |
| --- | --- | --- | --- |
| QA tester (capture, unattended workflow) | Claude | 2026-10-16 | captured, not a sign-off |
| qa-lead (named by the story) | | | [ ] |
