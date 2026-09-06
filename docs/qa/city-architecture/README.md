# City architecture browser QA — 2026-09-05

Tested at **1280×720** in the Codex in-app browser on this machine, using the actual WebGPU renderer. The development review mounts the production scene, camera, input, units, effects and HUD through `GameCanvas`. It omits campaign save bootstraps. Production checks use a separate `city-review-20260905.localhost:4200` origin so existing campaigns are preserved.

## Record metadata and reproducibility

This is retained historical evidence, not a new run or a current-checkout pass. The observations and measurements below are unchanged. New runs use the [QA record format](../README.md).

| Field | Recorded value |
| --- | --- |
| Run date | 2026-09-05; timezone not recorded |
| Baseline revision | `23b4bab0dc884fdd9505454c758d2004a8b8d214` |
| Tested final revision / working-tree patch | Not recorded; references to “final source” below do not identify an exact checkout |
| Hardware, GPU, OS version | Not recorded; “this machine” is not a portable environment identifier |
| Browser and version | Codex in-app browser; browser/engine version not recorded |
| Node/npm versions | Not recorded |
| Renderer and viewport | WebGPU, 1280×720; device-pixel ratio not recorded |
| Quality and display pacing | High/medium/low samples below; approximately 120Hz pacing |
| Evidence | Repository-relative screenshots and [raw timings](timings.json) |

The retained current-scene harness is opened at `/tools/city-review.html` on the development server; see [local setup](../../../README.md#run-locally). The matching-view coordinates, layout/quality matrix, fixture interventions, and timing protocol are recorded below. Baseline source copies were outside the repository and are not bundled with this record, so the retained harness alone cannot reproduce the original before/after comparison. Missing metadata must not be inferred from a later machine or checkout.

## Matching views

Baseline renderer and generator were copied before implementation from commit `23b4bab0dc884fdd9505454c758d2004a8b8d214`. Both sides use Glass Veil variant 0, high quality, a frozen initial simulation, the same camera yaw and distance 72. Fixed world coordinates avoid changes to road-array indices after the northern connection was added. The city layout itself intentionally changes around that new connection.

| View | Camera focus (x,z) | Before | After |
| --- | --- | --- | --- |
| Insertion | insertion landmark, z − 4 | [Before](baseline-glass-veil-insertion.jpg) | [After](current-glass-veil-insertion.jpg) |
| Alley behind tall buildings | 46.5,5 | [Before](baseline-glass-veil-alley.jpg) | [After](current-glass-veil-alley.jpg) |
| Junction | 48,51 | [Before](baseline-glass-veil-junction.jpg) | [After](current-glass-veil-junction.jpg) |
| Checkpoint | checkpoint landmark | [Before](baseline-glass-veil-checkpoint.jpg) | [After](current-glass-veil-checkpoint.jpg) |

The new architectural fronts remain distinct at gameplay zoom. Broad street and squad cutaways remain visible; solid details disappear with their owner. The [solid CORPSEC sign](current-glass-veil-solid-sign.jpg) was captured from the gate approach (checkpoint z + 14), with normal occlusion enabled. Walls and fences keep their recognizable openings and ground warnings.

## District, layout and quality matrix

All 18 combinations were loaded and captured at the checkpoint pose with the initial simulation frozen. High and medium retain their normal bloom treatment; low uses its normal reduced effects. No WebGPU errors were logged. Rust Haven was also checked with its clear weather; the other two districts start in their authored rain.

| District / layout | High | Medium | Low |
| --- | --- | --- | --- |
| Glass Veil 0 | [View](matrix-m01-v0-high.jpg) | [View](matrix-m01-v0-medium.jpg) | [View](matrix-m01-v0-low.jpg) |
| Glass Veil 1 | [View](matrix-m01-v1-high.jpg) | [View](matrix-m01-v1-medium.jpg) | [View](matrix-m01-v1-low.jpg) |
| Hollow Crown 0 | [View](matrix-m02-v0-high.jpg) | [View](matrix-m02-v0-medium.jpg) | [View](matrix-m02-v0-low.jpg) |
| Hollow Crown 1 | [View](matrix-m02-v1-high.jpg) | [View](matrix-m02-v1-medium.jpg) | [View](matrix-m02-v1-low.jpg) |
| Rust Haven 0 | [View](matrix-m03-v0-high.jpg) | [View](matrix-m03-v0-medium.jpg) | [View](matrix-m03-v0-low.jpg) |
| Rust Haven 1 | [View](matrix-m03-v1-high.jpg) | [View](matrix-m03-v1-medium.jpg) | [View](matrix-m03-v1-low.jpg) |

The review's explicit `Weather +240s` control advanced the real world tick to exercise both authored fronts in variant 0 at all quality tiers. This is fixture stepping, not a claim to have waited 240 wall-clock seconds for every sample. Glass Veil changed from heavy to light rain at 22:16:38; Hollow Crown changed to clear at 22:17:08. HUD and comm-log messages agreed, and gate visibility remained usable.

| Weather front | High | Medium | Low |
| --- | --- | --- | --- |
| Glass Veil | [View](weather-glass-veil-high.jpg) | [View](weather-glass-veil-medium.jpg) | [View](weather-glass-veil-low.jpg) |
| Hollow Crown | [View](weather-hollow-crown-high.jpg) | [View](weather-hollow-crown-medium.jpg) | [View](weather-hollow-crown-low.jpg) |

## Tactical input and onward-route regression

Ordinary live input checks passed: number-key selection and split squads; separate move orders behind ghosted buildings; dashed routes and destination rings; box selection; hostile targeting; minimap dragging; camera movement and both zoom limits; pause, Settings, close, and resume. [Split squad routes](current-split-squad-route.jpg), [box selection](current-box-selection.jpg), and [hostile picking](current-hostile-picking.jpg) record these checks. The hostile click produced an `ENGAGING` acknowledgement. Decorative geometry did not intercept these commands.

For the complete onward route, an explicitly labeled development fixture cleared enemies, then actual right-click move orders sent all four operatives through the checkpoint and east along the new northern cross street. This fixture is **not a normal combat victory** and is marked `VISIBILITY FIXTURE · HOSTILES CLEARED` on every image.

At camera focus **(74,11)** and maximum distance **115**, a right click at viewport **(642,360)** selected the destination near **(74.5,10.5)**. The original 6×6 camera grid missed a foreground slab, hiding the route tail and rings: [before the route fix](current-east-exit-route-fixture.jpg). The same route was visible at approximately normal zoom (distance 73.14): [normal-zoom control](current-east-exit-normal-zoom-fixture.jpg).

The additive active-route probes fix this failure without reducing any previous probe coverage: [maximum zoom after the fix](current-east-exit-route-fixed-fixture.jpg). All four dashed tails and destination rings are visible through one ghost shell. Selecting all and issuing the normal stop command clears the paths and restores the foreground slab to solid: [cleared orders](current-east-exit-cleared-route-fixture.jpg). The exact old-probe prefix, squad priority, route clearing, and this camera/destination regression also have unit coverage.

## Warmed frame pacing

The comparable runs used the same machine/browser, live Glass Veil variant 0 at the initial camera, and no movement orders: 15 seconds warming plus 30 seconds recording r3f frame deltas. Display pacing was approximately 120Hz. These are frame-pacing measurements, not GPU timestamp timings. End-of-sample resource counts vary with active units and effects. Original samples are retained in [timings.json](timings.json).

| Quality | Baseline median / p95 | Current median / p95 | p95 change |
| --- | --- | --- | --- |
| High, original integration sample | 8.30 / 9.20ms | 8.30 / 10.10ms | +9.8% |
| High, final architectural detailing | 8.30 / 9.20ms | 8.30 / 10.00ms | +8.7% |
| Medium | 8.30 / 10.00ms | 8.30 / 10.10ms | +1.0% |
| Low | 8.30 / 10.10ms | 8.30 / 10.10ms | ~0% |

Every comparable median is unchanged within sampling precision and every measured p95 remains within the 10% target. The final high sample reported 164 draw calls, 17,249 triangles, 38 geometries and 41 textures, versus 164 / 7,691 / 39 / 30 for its baseline snapshot. Small sign/depth fixes and material sharing landed before that final high sample. The later active-route helper adds no route probes when there are no paths; the no-order live sample was not repeated after that helper.

A separate final-source **frozen four-active-path stress sample** at focus (74,11), distance 115 measured 8.30ms median and 10.00ms p95 over 3,591 frames after the same warmup. Its renderer snapshot was 248 calls, 19,601 triangles, 40 geometries, 43 textures. It exercises the route probe workload but is not directly comparable with the live insertion baseline. No performance claim is made for unmeasured hardware or WebGL fallback.

## Production click-through

The final production bundle was served with `vite preview`, using a fresh test origin. Actual coverage from [the documented click-through](../../click-through.md):

- Menu → Settings open/close → New Operation. Local mute and telemetry were enabled for this isolated test campaign. [Menu](production-menu.jpg), [Settings](production-settings.jpg).
- World Network: pause/resume, clock speed change, sector focus; confirmed North America opening tax yield 4,080 CR / 24h, Influence 0 points, control/unrest/garrison fields, four navigation tabs, locked Brief before a contract, and the current Scan/Timeline/Feed/Clock wording. [World](production-world.jpg).
- Research: inspected Neural Interface I and returned through navigation. No project was purchased. [Research](production-research.jpg).
- Glass Veil Brief: unlocked nav, reviewed heavy→light rain 22:16:38, entered Assembly through the nav without Accept Contract, and deployed four valid default operatives. No slotted project was complete, so augmentation cycling was unavailable. [Brief](production-brief.jpg), [Assembly](production-assembly.jpg).
- Mission: operative selection, actual right-click move acknowledgement and visible route/ring, minimap drag, pause, Settings open/close, resume, recenter and stop orders. [Mission](production-mission.jpg), [Pause](production-pause.jpg).

- In the production mission, allowed real time to pass through 22:16:38; the comm log reported the front and HUD changed to LIGHT RAIN. [Production weather](production-weather-front.jpg).
- Used the two-step abort control and returned to World Network with 128,450 Credits, 0 Influence and 8/8 roster unchanged. Reloaded the isolated origin, inspected Balance showing one record / one abort / zero payout, then Continue successfully returned to World Network with Brief locked. [Abort return](production-abort-return.jpg), [Abort telemetry](production-abort-telemetry.jpg). This observes resource stability; it is not a byte-for-byte campaign-save comparison.

The production console check returned no errors. All started dev and preview servers were stopped, `lsof -nP -iTCP:4200 -sTCP:LISTEN` found no listener, the temporary browser tab was closed, and the viewport override was reset.

## Limitations and existing observations

This is a partial documented click-through: no normal mission victory, debrief, successful replay, contract fee/Influence settlement, or ETA catch-up was exercised. Those unchanged campaign paths remain outside this browser coverage. Browser interaction checks concentrate on Glass Veil; Hollow Crown and Rust Haven received the complete visual matrix and generator/unit checks, not full objective completion. Weather transitions were exercised on variant 0, while alternate layouts were checked in initial authored weather. Mobile, audio listening and fallback renderer tests were not part of this architecture pass.

The existing `THREE.Clock` deprecation warning appears in both baseline and current runs. No browser error was recorded during the matrix or weather checks. The unchanged Research `AVAILABLE CREDITS 128,450 CR` label extends slightly into the center panel at 1280×720; it is visible in the research screenshot and remains outside this architecture change. The unchanged Brief also lets the long weather-stat line run behind its tactical map; the full front and clock remain readable in Comms and mission notes. These existing UI observations are recorded rather than treated as a full screen-layout pass. Mission and strategy controls remained usable.

Root verification passed lint, 591 unit tests, production build and `git diff --check`. The standalone review entry also passes strict typecheck and lint. Production static checks found no review controls, baseline sources, or reference-sheet image in the shipped bundle. Baseline source copies are outside the repository; the retained review has only current scene diagnostics, gated by `import.meta.env.DEV`.
