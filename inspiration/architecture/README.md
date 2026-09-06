# City architecture reference

`city-kit-reference.png` was generated on 2026-09-05 with OpenAI ImageGen,
using `inspiration/05-gameplay-ui.png` as the visual reference. It is an art
reference, not a runtime texture or a model asset.

The generation brief called for a modular, dark retro-futurist city kit at the
game's isometric tactical scale: stepped corporate towers, recessed commercial
fronts, repeated structural bays on residential slabs, ribbed industrial
buildings with loading shutters, and a framed CORPSEC checkpoint. Supporting
parts included parapets, ventilation units, conduits, entrances, warning panels,
and restrained amber signage. The gameplay image supplied the muted teal/amber
palette, proportions, rain-soaked atmosphere, and camera context.

The implementation follows the repository's code-asset convention:

| Surface | Implementation | Reference use |
| --- | --- | --- |
| Building masses and shared parts | `src/scene/cityArchitecture.ts` | Podiums, setbacks, roof wells, pilasters, shutters, and conduits |
| Façades | `src/scene/cityMaterials.ts` | Five deterministic 512px material tiles; one repeat per six world meters |
| Signs | `src/scene/cityMaterials.ts` | Shared 1024×256 canvas lettering with physical frames |
| Checkpoint gantry | `src/scene/cityArchitecture.ts` | Framed overhead identity and warning strip fitted to the existing pillars |

All runtime colors come from `src/ui/tokens.ts`; the image introduces no palette
constants. Geometry and texture generation use no mission RNG. No imported
model or generated bitmap is downloaded by the game, and no asset is placed in
`public/`.

Asset sourcing was deliberately hybrid: the generated architectural sheet
guides shared procedural geometry and canvas materials. The implementation
must stay inside existing building envelopes and swap every building to one
simple ghost shell. An arbitrary imported model would need to be rebuilt to
meet those constraints. The generator credential preflight also reported
`TRIPO_API_KEY=MISSING`; the built-in image tool provided the external visual
reference successfully.
