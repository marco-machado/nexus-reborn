# Accessibility Requirements

> **Tier**: Standard
> **Committed**: 2026-09-23
> **Owners referenced**: `docs/game-design.md` §12 (interfaces), §13 (controls), §14 (art), §17 (settings), §19.6 (accessibility backlog); Interface GDD Rule 14; ADR-0017 (one OS / input / audio mixer); ADR-0010 (mission renderer)
> **Consumers**: `/ux-design` (Pre-Production specs must satisfy this tier), `/ux-review` (checks tier compliance), `/qa-plan` (test cases derive from the matrix below)
> **Status**: Active — UX specs reference this tier; feature changes go through the owners above, not this file

## Tier commitment

This project commits to the **Standard** accessibility tier: the designed-in set already specified by living spec §12/§14 and ADR-0017 is the full committed scope. No additional feature is promoted into scope by this document, and nothing the owners above already specify may be relaxed.

**Reference standard.** WCAG 2.1 Level AA is the orientation for the committed features where a web-surface analogue exists (contrast of text and UI, keyboard operability of DOM chrome, focus visibility). The living spec is authoritative where the two differ: this game's readability floor, text-scale set, and non-color-cue rule are §12/§14 requirements, not re-derivable from WCAG.

**Out of scope by standing ADRs** (not tier regressions): gamepad and touch input (ADR-0017 forbids both — no gamepad/touch accessibility work), mobile layouts (smaller-than-minimum windows scroll, §12), spoken dialogue or VO captions as dialogue subtitles (no spoken VO exists — ADR-0017).

## Feature matrix

Status values: **Committed** — designed-in, verifiable at the tier; **Backlog** — product backlog per §19.6, not a ship gate; **N/A** — not applicable to this game's scope.

### Visual

| Feature | Status | Owner / source |
|---|---|---|
| Critical state never conveyed by color alone (selection, focus, injury/KIA, lock, objective, Alert, result get a non-color cue) | Committed | §14; Interface AC 2 |
| Text legible at 1280×720 on every surface; no clipping or truncation | Committed | §12/§17; Interface AC 1 |
| Text scale 90 / 100 / 110 / 125%; overflow scrolls, panels never compress | Committed | §12; Interface text_scale formula |
| High-contrast mode (`:root.s-high-contrast` remaps CSS variables only) | Committed | §14; ADR-0017 |
| Building ghosting survives every Quality tier (readability, not spectacle) | Committed | §14; Interface Rule 17 |
| Minimap information (cones, patrols, civilians, objective pulse) survives Hardened and Quality Low | Committed | §12; Interface AC 10 |
| Color-vision presets (Protanopia/Deuteranopia/Tritanopia palettes) | Backlog | §19.6; Interface Rule 14 |
| Screen-reader pass on the tactical HUD | Backlog | §19.6; Interface Rule 14 |

### Audio

| Feature | Status | Owner / source |
|---|---|---|
| Visual indicators paired with important audio cues (Alert markers, hit flashes, weather chip) | Committed | §14 art language |
| Four mixer buses under master (ui/combat/music/ambience); mute folds into master | Committed | ADR-0017 mixer |
| Captions for audio cues (speaker-identified cue text) | Backlog | §19.6 |
| Dialogue subtitles | N/A | No spoken VO (ADR-0017) |
| Mono audio / per-ear routing | N/A | No spatial audio model; one OS mixer only (ADR-0017) |

### Motor / input

| Feature | Status | Owner / source |
|---|---|---|
| One remap table (`BINDINGS`); every keyboard action except pause and operative slots remappable; mouse reserved | Committed | §13; ADR-0017 |
| Pause, tutorial, and input handlers read the same table — a remap renames itself everywhere | Committed | §13; Interface Rule 15 |
| Full keyboard operability of the committed set: Research node select (pointer/Enter/Space), Timeline (arrows/Home/End), pause and Settings focus trap and restore | Committed | §14; Interface AC 19 |
| Contextual accessible labels on major controls | Committed | §14 |
| Two-step destructive confirms with expiry-as-cancel (Abort, New Operation, telemetry Clear) — no timing pressure | Committed | §12; Interface Rules 12 |
| Pause available at all times in mission; sim and camera freeze; Settings stays inside the freeze | Committed | §12 |
| Full keyboard travel across every panel | Backlog | §19.6 (committed set above is partial travel by design, Interface AC 19 note) |
| One-handed mode, hold-timing adjustments, QTE skip | N/A | No QTEs, no hold-to-repeat inputs in the control scheme (§13); keyboard/mouse only |

### Cognitive

| Feature | Status | Owner / source |
|---|---|---|
| First-mission tutorial toasts naming current bindings; advance on action or dismiss; never block input or pause the sim; Skip Tutorial marks all seen | Committed | §12; Interface AC 13 |
| One-shot advisories (low HP + med kits, first combat Alert, ready ability, heavy tier) — bounded, never spam | Committed | §12 |
| Consistent one-OS chrome; same visual language for menu and gameplay | Committed | §14; Interface Rule 4 |
| Difficulty (Hardened) never strips information channels (minimap stays) | Committed | §12; ADR-0016 |
| Reduced motion: decorative sweeps gone, looping pulses frozen, rain at minimum | Committed | §14 |

## Verification

The tier is verified through existing gates — this document adds no new harness:

- `npm run lint` / `npm run test` / `npm run build` — the workspace gate.
- Click-through at 1280×720 (`docs/click-through.md`) — exercises the layout floor, text scale, non-color cues, focus trap/restore, pause/two-step confirms on the screens actually driven; partial runs name the unexercised set.
- Interface GDD acceptance criteria 1–3, 10–13, 18–19 are the tier's per-feature observable checks; `/qa-plan` derives tier test cases from them.

## Relationship to UX specs (Phase 4)

Every `/ux-design` spec must state how its screen satisfies the Committed rows above; `/ux-review` fails a spec that drops one or that silently promotes a Backlog row into scope. Promoting a Backlog row is a living-spec §19.6 change made through the design docs first — never inside a UX spec.
