# Armored Agent reference pass — 2026-10-07, America/Sao_Paulo

## Result and scope

Pass for shared Agent rendering, standalone controls, and a scoped mission
movement/combat smoke check. Visual direction follows
[03-team-selection.png](../../../inspiration/03-team-selection.png): enclosed
helmet and respirator, small optics, plate carrier and pouches, layered shoulders,
segmented limbs, boots, and a rifle across the body. This is a stylized procedural
interpretation, not a photoreal reproduction of the reference.

The existing 224-triangle placeholder is replaced only for Agents. Other unit
kinds retain their original model. The detailed Agent has 17,920 triangles,
19 material batches, and six materials, pooled across the strike team. This is a
deliberate increase in model detail for the supplied reference; it is not a pass
against the separate 200-triangle figure target in the art bible. Full mission
performance budgets were not measured in this run.

## Source and environment

| Field | Value |
| --- | --- |
| Base revision | `c6b364901342c89bcbf894bcef42150ea9c259d3` |
| Source | [source.patch](source.patch) captures viewer plus shared-model work relative to the base; unrelated design/architecture/production edits excluded |
| Changed this pass | `agentModel.ts`, its tests, `unitModel.ts`, the facing comment in `Units.tsx`, and viewer lighting/framing/resource disposal |
| Tools | Node 22.22.3, npm 10.9.8, Vite 6.4.3, three.js 0.185.1, Vitest 4.1.10 |
| Machine | MacBook Pro Mac17,9, Apple M5 Pro, 15 CPU / 16 GPU cores, 24 GB RAM |
| OS/browser | macOS 26.5.2 (25F84); Codex in-app browser; embedded browser version unavailable from the inspection API |
| Rendering | WebGPU, 1280×720, DPR 1; mission quality High; viewer exposure 1.2 |
| Viewer | Production `/tools/asset-viewer.html`, bundle `assetViewer-blDUV6UI.js`; default and MARA accents |
| Mission | Development `/tools/city-review.html`, existing isolated fixture, GLASS VEIL / Variant 0, first four seed roster operatives and their default loadouts; world tick seeded once at 0.05s before the fixture freezes |
| Campaign | No campaign bootstrap in either tool. Fixture-local state only; no new operation or debrief completed |

## Checks

| Check | Observed | Result |
| --- | --- | --- |
| `npm run lint` | Exit 0 | Pass |
| `npm run test` | Exit 0; 38 files / 599 tests; four new tests cover scale and ground contact, forward optics, shared geometry with independent leg pivots, weapon omission, finite geometry, and bounded batches | Pass |
| `npm run build` | Exit 0; TypeScript and Vite; 163 modules | Pass |
| `git diff --check` | Exit 0 | Pass |
| Reference details / default view | Armored proportions, small optics, pouches, gloves, rifle, knees and boots visible | Pass: [MARA](agent-mara.png) |
| Wireframe | Merged geometry renders; shaded mode restores normally | Pass: [wireframe](agent-wireframe.png) |
| Weapon and markers | Entire rifle disappears; 16 batches / 15,436 triangles; slot tag fits above helmet | Pass: [unarmed](agent-unarmed.png) |
| Accents and camera | MARA optics become amber; front and perspective presets work | Pass |
| Production viewer console | No errors or warnings after final reload | Pass: [console](viewer-console.json) |
| Mission rendering | Four detailed Agents render with HUD and selection markers | Pass: [mission](mission.png) |
| Mission movement / combat | Insertion preset → Run simulation → right-click open street; squad moved with alternating legs; firing and health changes observed; froze simulation at 22:14:16, then closed fixture | Pass |
| Mission console | No errors. Existing `THREE.Clock` deprecation warning from r3f dependency initialization | Pass with warning: [console](mission-console.json) |
| Full campaign click-through, victory/debrief, WebGL2, cross-browser checks, performance benchmark | Not executed | Not run |

The development server initially served cached transforms after edits; restarting
it ensured the final model was inspected. A transient duplicate-Three warning
appeared during initial dependency optimization; it did not appear in the final
production viewer run.

## Cleanup

Stopped all three started development sessions and the production preview session
with Ctrl+C. Final `lsof -nP -iTCP:4200 -sTCP:LISTEN` returned no output (exit 1).
Closed the mission fixture, restored the viewport override, and kept the viewer
tab loaded with MARA. Restart the server before refreshing that tab.
