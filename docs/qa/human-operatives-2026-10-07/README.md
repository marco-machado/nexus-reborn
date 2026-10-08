# Human operative model — 2026-10-07, America/Sao_Paulo

## Result and scope

Pass for the requested human reading of the shared procedural model, its
standalone viewer, and a scoped mission movement/combat smoke check.

The previous [reference pass](../agent-reference-2026-10-07/agent-mara.png)
read as a mechanical robot. The new model has continuous shoulders, a rib cage,
waist, hips, clothed limbs, leather boots, and a visible human face and neck.
An open-face helmet, plate carrier, pouches, protective plates and rifle retain
the tactical equipment direction of
[the supplied reference](../../../inspiration/03-team-selection.png). A single
implanted eye and one augmented forearm provide localized cybernetic detail.
This remains stylized procedural geometry, not a photoreal reproduction.

## Source and environment

| Field | Recorded value |
| --- | --- |
| Base revision | `7d849987eea145655fab5110f410261114680268` |
| Working tree | Four modified source files: `src/scene/agentModel.ts`, `src/scene/agentModel.test.ts`, `src/ui/tokens.ts`, `src/index.css`; retained in [source.patch](source.patch). This QA directory is new. |
| Build and tools | Node 22.22.3, npm 10.9.8, Vite 6.4.3, three.js 0.185.1, Vitest 4.1.10 |
| Machine | MacBook Pro Mac17,9; Apple M5 Pro; 15 CPU / 16 GPU cores; 24 GB RAM |
| OS and browser | macOS 26.5.2 (25F84), Codex in-app browser. Embedded browser engine/version unavailable through the inspection API; no cross-browser claim. |
| Rendering | WebGPU; 1280×720; canvas backing width 980 / CSS width 980 (effective DPR 1); mission High; viewer exposure 1.2 |
| Viewer | Production `/tools/asset-viewer.html`, bundle `assetViewer-DP_79MWS.js`; default and MARA accents |
| Mission | Development `/tools/city-review.html` isolated fixture; GLASS VEIL (`m01`), checkpoint Variant 0, seed 20870514, Standard, neutral sector fallback (control 50 / unrest 10), no completed research or experience; first four seed roster operatives and default weapons; no extra loadout items |
| Save | Both tools omit campaign/save bootstraps. No operation started, persisted save edited, or debrief reached. The fixture is initialized by ticking once at 0.05 seconds, then freezing. |

## Procedure and observations

| Check | Steps and observation | Status | Evidence |
| --- | --- | --- | --- |
| Human anatomy and clothing | Inspect perspective, front, side and back. Continuous cloth silhouettes cover the joints; the face has a jaw, nose, mouth and human eye. Armor covers selected areas. | Pass | [Perspective](operative-perspective.png), [front](operative-front.png), [side](operative-side.png), [back](operative-back.png) |
| Cybernetic reading | Inspect the monocular optic, temple interface and metallic right forearm against the fabric left sleeve. | Pass | [Perspective](operative-perspective.png), [unarmed](operative-unarmed.png) |
| Reference equipment | Helmet, chin strap/comms, plate carrier, webbing/pouches, shoulder and knee protection, boots and rifle visible. | Pass | [Perspective](operative-perspective.png) |
| Wireframe restoration | Enable and disable Wireframe; continuous surfaces render and shaded materials restore. | Pass | [Wireframe](operative-wireframe.png) |
| Weapon and markers | Disable Weapon and enable Selection ring & slot tag. Rifle disappears; health and slot markers clear the helmet. Re-enable weapon and disable markers to restore the final view. | Pass | [Unarmed](operative-unarmed.png) |
| Shared mission model | Insertion preset → Run simulation → right-click open street at (695,353). Squad moved from insertion with alternating legs. Combat reduced magazines and Torq health; four operatives remained present. Freeze at 22:14:24. | Pass | [Mission](mission.png) |
| Viewer diagnostics | Final production session contains one WebGPU backend info line and no errors/warnings. | Pass | [Console](viewer-console.json) |
| Mission diagnostics | WebGPU / HIGH; no errors. Pre-existing THREE.Clock deprecation warning during r3f initialization. | Pass with existing warning | [Console](mission-console.json) |
| `npm run lint` | Exit 0, no diagnostics. | Pass | Tool output from this run |
| `npm run test` | Exit 0; 38 files / 599 tests. Model checks cover grounding/height/forward optics, pooled resources and independent leg pivots, complete rifle omission, finite positions, unit normals and bounded triangle/batch counts. | Pass | Tool output from this run |
| `npm run build` | Exit 0; TypeScript and Vite, 163 modules. | Pass | Production bundle inspected above |
| `git diff --check` | Exit 0. | Pass | Tool output from this run |
| Full campaign click-through, victory/debrief/replay, WebGL2, other browsers | Outside this scoped model pass. | Not run | — |
| Mission performance benchmark | No frame/GPU timing comparison collected. | Not run | — |

The final model uses 18,008 triangles, 19 material batches and eight materials;
without the rifle it uses 15,524 triangles / 16 batches. Geometry, textures and
materials are pooled. Height is 2.02 m including the existing rig scale, below
the 2.12 m health marker. The existing mission heading, leg pivots and simulation
remain intact. The model stays within its existing 20,000-triangle / 20-batch
test ceiling; this is not verification of the separate art-bible or mission
performance targets.

## Cleanup

Stopped all three development servers and the production preview started during
this run. Final `lsof -nP -iTCP:4200 -sTCP:LISTEN` returned no output, exit 1.
Closed the mission fixture and reset the viewport override. The viewer tab is
retained with MARA loaded; restart `npm run dev:assets -- --strictPort` before
refreshing it. No commits or pushes were made.
