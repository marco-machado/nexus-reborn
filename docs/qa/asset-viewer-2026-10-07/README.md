# Standalone asset viewer QA — 2026-10-07, America/Sao_Paulo

## Result and scope

Pass for the standalone Agent viewer. Partial browser coverage: only
`/tools/asset-viewer.html` was exercised. Mission and campaign screens were not
exercised. The viewer uses the mission's procedural builder, extracted without
changing its geometry, materials, or transforms.

## Source and environment

| Field | Recorded value |
| --- | --- |
| Base revision | `c6b364901342c89bcbf894bcef42150ea9c259d3` |
| Changes under test | [source.patch](source.patch): `Units.tsx`, `unitModel.ts`, viewer HTML/TS/CSS, Vite entries, package script, README. Pre-existing design, architecture, production, and test changes excluded from this patch. |
| Build | Production, Vite 6.4.3, three.js 0.185.1; viewer bundle `assetViewer-BJfOVQsq.js` |
| Tools | Node 22.22.3; npm 10.9.8; Vitest 4.1.10 |
| Machine | MacBook Pro Mac17,9, Apple M5 Pro, 15 CPU cores, 16 GPU cores, 24 GB memory |
| OS | macOS 26.5.2 (25F84) |
| Browser | Codex in-app browser; exact embedded browser version unavailable from the browser inspection API |
| Rendering | WebGPU, 1280×720, DPR 1, ACES tone mapping, exposure 1.2, 1024px shadow map |
| Origin and save | `http://localhost:4200/tools/asset-viewer.html`; new viewer tab; no campaign or save bootstrap imported |
| Fixture | Default procedural agent, assault weapon, slot 1; MARA accent selected for marker check. No mission, seed, difficulty, research, or campaign state involved. |

## Procedure and observations

| Check | Observed | Status | Evidence |
| --- | --- | --- | --- |
| `npm run lint` | Exit 0 | Pass | Final run at approximately 18:00 local |
| `npm run test` | Exit 0; 37 files, 595 tests passed | Pass | Vitest duration 1.41s |
| `npm run build` | Exit 0; TypeScript and production build; 160 modules transformed | Pass | Production viewer served with Vite preview |
| `git diff --check` | Exit 0 | Pass | No whitespace errors |
| Extraction parity | Compared original builder text and mission frame loop against HEAD; only exports and the builder's narrowed input type differ | Pass | [source.patch](source.patch) |
| Load viewer | Agent rendered immediately: 8 meshes, 224 triangles, 5 materials, height 1.90m | Pass | [Default agent](agent-default.png) |
| 1280×720 layout | Inspector client height and scroll height both 604px; controls and statistics fit | Pass | [Default agent](agent-default.png) |
| Orbit and zoom | Drag and scroll visibly changed camera angle and model size | Pass | Observed in browser |
| Camera presets and reset | Front, Side, Back, and Perspective controls selected; front view and reset visually checked | Pass | Observed in browser |
| Weapon toggle | Gun disappears; statistics become 7 meshes / 212 triangles / 4 materials; restores on recheck | Pass | Observed in browser |
| Wireframe | Triangle edges render; switching back restores shaded materials and a live canvas | Pass | [Wireframe](agent-wireframe.png) |
| Accent and markers | MARA changes emissive accent to amber; selection ring, glow, and slot/health tag visible and framed | Pass | [Markers](agent-markers.png) |
| Turntable | Camera rotates over time; Reset view stops rotation and restores perspective | Pass | Observed across screenshots |
| Grid and exposure | Grid visibility changes; keyboard input changes exposure readout from 1.2 to 1.3 and lighting responds | Pass | Observed in browser |
| Final console | WebGPU startup message; no errors or warnings after final reload | Pass | [console.json](console.json) |
| Right-drag pan, WebGL2 fallback, other browsers, full game click-through | Outside this scoped run | Not run | No claims about these paths |

## Fixes found during verification

The first wireframe toggle invalidated a WebGPU index buffer without rebuilding
the material pipeline, freezing the rendered frame. Setting `material.needsUpdate`
when switching wireframe fixed it; both directions were retested. The inspector
initially needed scrolling at 720px height, and selection tags could extend above
the viewport. Compact spacing and marker-aware camera framing fixed both.

No performance benchmark was requested or run. The unmodified mission frame loop
was checked by source comparison; this does not establish a mission browser pass.

## Cleanup

Stopped the only started server, `npm run preview -- --port 4200 --strictPort`,
with Ctrl+C (exit 130). `lsof -nP -iTCP:4200 -sTCP:LISTEN` returned no listener
(exit 1). Restored the browser viewport override. The loaded viewer tab was kept
as the deliverable; restarting the server is required to reload it. No campaign
state was created or changed by the viewer.
