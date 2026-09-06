# City architecture and tactical visibility

The architecture pass replaces the old uniform boxes and floating roof details
with a shared kit selected by existing building kinds. Towers have stepped
masses, commercial fronts have inset door panels, slabs use repeated structural
bays, and industrial buildings have ribs and loading shutters. Parapets,
ventilation equipment, conduits, and signs remain inside each building's
footprint and height envelope. Thin industrial walls keep their existing spans
and openings.

The [generated reference sheet](../inspiration/architecture/city-kit-reference.png)
and [asset provenance](../inspiration/architecture/README.md) document the art
direction. The runtime continues to generate its assets in code.

## Rendering and visibility

- `cityArchitecture.ts` produces scene-local owner and part descriptors.
  Entrances follow existing neon-facing metadata or the nearest road. Variation
  is deterministic and does not consume the simulation RNG.
- `cityMaterials.ts` paints shared façade, emission, roughness, and sign canvases
  from existing color tokens. World-space UVs keep the six-meter tile scale
  consistent across different building dimensions and tower setbacks.
- `architectureRenderer.ts` instances repeated boxes and planes by material.
  Every part has one owner. When that owner fades, all solid parts disappear
  together and one textured exterior shell replaces them. Roofs, signs, and
  conduit geometry cannot remain floating over the exposed street.
- `cityOcclusion.ts` extracts the previous classification unchanged: up to eight
  living squad probes, the original 6×6 camera-footprint probes, squad priority,
  all intersecting buildings, opacity 0.16 for squad and 0.45 for streets, easing
  rates 10/5, and the original 0.005 snap threshold.
- A browser check at maximum zoom found the original street grid could miss the
  new eastward road's destination behind a solid building. Active movement
  routes therefore append bounded street-tier probes (up to eight points per
  living operative, including its destination). This is an additive refinement
  to the approved plan's visibility behavior: all previous probes and their
  coverage remain intact, and route probes use the same 0.45 opacity. The legacy
  classifier itself is unchanged. With no active route, coverage is identical
  to the original rules.
- The checkpoint's new overhead frame and sign have their own bounds above
  the passage and participate in the same visibility pass. Existing pillars
  and ground-level gate warnings remain visible.
- Architectural meshes do not raycast. The invisible ground plane, unit pick
  proxies, dashed routes, destination rings, and command semantics are unchanged.

## Checkpoints that lead somewhere

The follow-up request to keep checkpoints connected required a narrow generator
change. Glass Veil's avenue now passes through its checkpoint plaza into a paved
six-meter cross street that turns east to join the secondary street. The direct
insertion route still passes through the checkpoint; approaching around the
eastern flank is over 15 meters longer. Buildings, road paint, minimap metadata,
and walkability agree on the new connection.

Physical-obstacle checks also found industrial devices intersecting fences and
generic parking occupying objective interiors on some seeds. Device positions
are now clamped inside their intended sub-yards, and generic parked cars and
alley props avoid reserved compounds and yards. Authored fighting cover remains,
with landmark centers kept clear so connectivity repair does not carve an
unnecessary invisible passage through a fence.
No mission rules, `WorldApi`, stores, campaign save format, or input code changed.

## Verification

Unit coverage includes legacy occlusion parity across all authored variants and
zoom limits, split squads, overlapping occluders, clearing visibility, part
ownership, geometry bounds, deterministic generation, street-facing entrances,
wall openings, and overhead gate clearance. Generator tests cover 39 distinct
seeds for each archetype, including every authored variant: direct gate routing,
the paved onward loop, compound gate/breach access, and both industrial gates
reaching every device without walking through visible obstacles.

An additional one-off audit checked 1,554 generated cities for building/part
bounds, device collisions, and the northern connection, then 2,054 industrial
seeds for walkable cells inside rendered buildings after the landmark fix. Both
sweeps found zero failures. Regression tests retain the previously failing
industrial seeds.

Final command checks: `npm run lint`, `npm run test` (591 tests in 35 files),
`npm run build`, and `git diff --check` pass.

[Browser QA evidence](qa/city-architecture/README.md) records screenshots,
warmed frame times, actual interaction coverage, and remaining limitations.
The development-only [review page](../tools/city-review.html) provides fixed
camera views and mission/variant/quality controls; it does not load campaign
saves and its diagnostics are excluded from the production entry. No mobile,
audio, lighting, post-processing, or UI redesign is included in this pass.

## Workflow references and scope

The graphics workflow used the repository's `threejs-aaa-graphics-builder`
implementation, model, rendering, technical-art, shader, and focused geometry /
material / performance references. The `threejs-qa-release` workflow supplied
the QA/release, visual-verification, player-loop, and visual-harness checklists.
The image-generation workflow supplied the gameplay-reference-to-art-sheet
step. These references guided the implementation; this change makes no claim
that unrelated game systems meet a premium visual scorecard.

| Decision | Result |
| --- | --- |
| External architectural reference | Generated from the gameplay image; provenance in `inspiration/architecture/README.md` |
| Runtime model import | Not used; shared code geometry preserves exact envelopes and ownership |
| Material and geometry budget | Shared canvas maps/materials and instanced boxes/planes; measured frame-time target is ≤10% growth |
| Screenshot harness | Added a separate development entry, fixed poses, fixture labels, and quality/variant controls |
| Gameplay bot | Not added; ordinary pointer commands plus explicitly labeled route fixtures cover this change |
| Mobile and audio QA | Outside the approved desktop architecture scope; neither system changed |
| Production helpers | Review controls and generated reference image are absent from the production bundle |
