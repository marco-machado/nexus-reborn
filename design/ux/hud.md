# HUD Design

> **Status**: Approved (/ux-review hud 2026-09-29; 2 advisory items open: objective-mark accessible names, null-data handling)
> **Author**: user + ux-designer
> **Last Updated**: 2026-09-29
> **Template**: HUD Design

---

## HUD Philosophy

The Mission HUD is one terminal window set laid over a live feed, not a shooter HUD on a game (Interface Rule 4; art bible §7.1). It is **information-dense and windowed**: every decision-relevant datum the sim exposes stays visible in a hairline panel, and the feed stays dominant through translucency and layout, not through hiding. Hardened and Quality never strip information (Interface Rules 11, 17). Order of authority: critical state first (Alert, selection, injury/KIA, objective, result), then instruments (minimap, weapons, abilities), then record (Comm log). Nothing decorative animates, and nothing critical rides on color alone. *Decided 2026-09-29.*

---

## Information Architecture

### Full Information Inventory

Sources: Interface Rule 9 (Mission HUD row), Tactical UI Requirements, `src/ui/Hud.tsx`.

| # | Item | Owner | Notes |
|---|---|---|---|
| 1 | District name | Tactical | top bar |
| 2 | District clock | Tactical | HUD ticks; sky does not (ADR-0007) |
| 3 | Live Weather chip | Tactical | follows live weather |
| 4 | Alert 0–3 | Tactical | number plus bars; not Threat, not Awareness |
| 5 | Live Collateral **count** | Tactical | count only; CR is priced at Debrief |
| 6 | Credits | Economy | |
| 7 | Pause control | Interface | |
| 8 | Squad cards (P-09) | Tactical | health, magazine, selection, stances |
| 9 | Objectives | Tactical | required / optional, timers |
| 10 | Comm log (P-16) | Tactical | |
| 11 | Drawn weapons (primary / secondary) | Tactical | |
| 12 | Ability bar (P-12) | Tactical | |
| 13 | Item counts and grenade control | Tactical | |
| 14 | Minimap (P-10) | Tactical | |
| 15 | Result banner (P-18) | Tactical | |
| 16 | Tutorial toasts and advisories (P-11) | Interface | |
| 17 | `13.7C` and `1.2M/S` chips | none (code only) | no GDD source; excluded, Open Question 2 |

### Categorization

| Category | Items |
|---|---|
| **Must Show** (always visible) | 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14 |
| **Contextual** | 5 Collateral — visible once the count is above 0; 15 Result banner — when a result exists; 16 Toasts and advisories — first mission and one-shot advisories only |
| **On Demand** | none |
| **Hidden** | none — no critical channel is audio-only (audio cues are always paired with a visual, accessibility matrix) |
| **Excluded** | 17 — pending Open Question 2 |

Conflict check: the Must Show list is 13 items and matches the approved reference frame (`inspiration/05-gameplay-ui.png`), so it does not conflict with the philosophy.

---

## Layout Zones

**Arrangement A: frame the feed.** Panels sit on the edges; the center and middle band stay open. Sources: `inspiration/05-gameplay-ui.png`, `src/ui/ui.css`, `src/ui/Hud.tsx`. *Decided 2026-09-29.*

```
+--------------------------------------------------------------------------+
| Z1 TOP BAR: district, clock, weather | ALERT: n | [collateral] CREDITS PAUSE |
+------------+---------------------------------------------+---------------+
| Z2 SQUAD   |                                             | Z3 OBJECTIVES |
|  LINK      |         LIVE FEED (3D District)             | (Z9 alert     |
|  cards 1-4 |         nothing docked here                 |  toast below) |
|            |                                             |               |
+------------+   [Z8 toasts, above Z5]                     +---------------+
| Z4 COMM    | Z5 WEAPONS | ABILITIES | ITEMS (center)     | Z6 MINIMAP    |
|  LOG       |                                             |               |
+------------+---------------------------------------------+---------------+
        Z7 RESULT BANNER: centered over the feed, non-blocking
```

| Zone | Position | Contents | Category |
|---|---|---|---|
| Z1 | Top edge, 34 px | District, clock, Weather chip (left); Alert (center); Collateral count when above 0, Credits, Pause (right) | Must Show |
| Z2 | Top-left, 238 px wide | Squad cards (P-09) | Must Show |
| Z3 | Top-right, 288 px wide | Objectives | Must Show |
| Z4 | Bottom-left, up to 312 px by 150 px | Comm log (P-16) | Must Show |
| Z5 | Bottom-center | Primary and secondary weapon, ability bar (P-12), item counts and grenade control | Must Show |
| Z6 | Bottom-right | Minimap (P-10) | Must Show |
| Z7 | Center overlay | Result banner (P-18); `aria-live="polite"`; non-blocking | Contextual |
| Z8 | Center, above Z5 | Tutorial toasts and one-shot advisories (P-11) | Contextual |
| Z9 | Top-right column, directly under Z3 | Red alert toast (P-11); displaces nothing | Contextual |

**Rules**
- The feed is never docked over: no panel occupies the center or the middle band.
- Panels are hairline, translucent windows (art bible 7.1); no drop shadows.
- Panels never overlap each other at 1280x720 at any text scale. Overflow scrolls inside the panel (P-15); a panel never compresses.
- Two concurrent alarms escalate the frame's red edge glow instead of adding Z9 boxes (art bible 2.8).


---

## HUD Elements

Patterns are referenced from `design/ux/interaction-patterns.md`, not redefined here. Sources: Interface Rules 9-13, art bible 7.4-7.5, `src/ui/Hud.tsx`. Reduced-motion fallbacks follow the art bible rule that every motion-backed cue names its static state.

| Element | Zone | Category | Content and form | Update | Animation (reduced-motion fallback) |
|---|---|---|---|---|---|
| E1 District + clock | Z1 | Must Show | District name; clock in monospace numerals | Ticks each tactical second; freezes on pause | Tick only, no easing |
| E2 Weather chip | Z1 | Must Show | Chip with text label (P-14) | Follows live weather; a front also writes a Comm line | None; label changes in one frame |
| E3 Alert | Z1 | Must Show | `ALERT: n` numeral plus bars; hot state when n above 0 | Follows Tactical Alert 0-3 | ~2 Hz pulse when hot (static hatch, edge glow and printed word when reduced) |
| E4 Collateral | Z1 | Contextual (count above 0) | `COLLATERAL n` count chip, amber; count only, no CR | Event: each first squad-caused civilian hit | Pulse on increment (static when reduced) |
| E5 Credits | Z1 | Must Show | Monospace numeral with `CR` suffix | Event-driven from Economy | None in mission |
| E6 Pause | Z1 | Must Show | Button `PAUSE`; shows disabled `PAUSED` while paused | Input | None |
| E7 Squad card | Z2 | Must Show | P-09 | Real time | Selection breathe (closed double ring when reduced) |
| E8 Objectives | Z3 | Must Show | Required and optional list, timers, a mark per item; active objective in amber | Event plus per-second timers | Active-objective pulse (static marker when reduced) |
| E9 Comm log | Z4 | Must Show | P-16 | Event-driven | None |
| E10 Weapons | Z5 | Must Show | Parts-catalog silhouette, name, magazine and reserve numerals | Real time on fire, reload, swap | None |
| E11 Ability bar | Z5 | Must Show | P-12; key label from the remap table | Real-time cooldown | Ink sweep (numeral only when reduced) |
| E12 Items and grenade | Z5 | Must Show | Counts (MED, CELL); grenade states usable / armed / cooling down / no target / out of stock, each with a reason label (P-03) | Event-driven | None |
| E13 Minimap | Z6 | Must Show | P-10 | Real time | Objective pulse (static marker when reduced) |
| E14 Result banner | Z7 | Contextual | `CONTRACT FULFILLED` or `SQUAD ELIMINATED` plus a sub-line; P-18 | Once, on result | Prints in one frame |
| E15 Toasts and advisories | Z8, Z9 | Contextual | P-11 | Event-driven | Prints in one frame |

Motion budget: at most ~6 chrome readouts animate at once (art bible 7.5). The candidates are Alert, Collateral, selection, the objective pulse, an ability sweep and the minimap pulse; alarm is the only red-cadence motion.

---

## Dynamic Behaviors

**Single density.** The HUD has one density. It does not condense, fade or hide by combat state (follows the information-dense philosophy). Sources: Interface Rules 11-13, 17-18; Tactical Rules 15, 18; art bible 2.8, 7.4, 7.5.

| Trigger | HUD change | Never |
|---|---|---|
| Alert rises from 0 to n | E3 goes hot with the printed number and bars; red edge glow at two or more concurrent alarms | No layout change; nothing else re-flows |
| First combat contact, answered officer call, defend wave | Comm line prints; first-combat one-shot advisory (E15) | No modal, no pause |
| Weather front | E2 label changes; Comm line prints | No re-layout |
| Civilian hit by the squad | E4 appears at count 1, then increments | CR is never shown in mission |
| Operative injured or KIA | Squad card shows pip, glyph and text (P-09); low-HP advisory once per campaign | KIA is never color-only |
| Objective completes or activates | E8 mark changes with a printed check | Amber to green is never the sole cue |
| Pause (Space or Escape) | Modal overlay (P-05); the sim and camera freeze, so no new Comm lines arrive; the HUD stays visible behind the panel | Toasts never pause the sim |
| Result (Win or Loss) | E14 appears in one frame; Debrief follows 2.5 s of Tactical elapsed time | Banner duration is not guaranteed |
| Hardened difficulty | No HUD change | Never strips the minimap or any panel |
| Quality tier | No HUD change. Interface Rule 17 places bloom and ghosting in the scene; not checked against the code | Never hides ghosting or the minimap |
| Opening hour dusk or night | No HUD change | HUD palette is hour-invariant; the clock still ticks |
| High contrast, reduced motion, text scale | CSS-variable remap only; decorative loops freeze; fallbacks per E1-E15 | No layout change beyond internal scroll |

---

## Platform & Input Variants

**Platforms.** Desktop browser only, 1280x720 minimum. Keyboard and mouse; gamepad and touch are out of scope (ADR-0017; `docs/technical-preferences.md`). No mobile layout is designed. Windows smaller than the minimum keep the minimum layout and scroll rather than compress panels (Interface Rule 6).

**Input on the HUD.** The HUD is pointer-transparent except its panels: only panels and the top bar take pointer events, and everything else passes through to the canvas. The box-select marquee draws over the feed. Key labels printed on the HUD (squad slot keys, ability keys, item keys, toast binding names) are read from the same remap table the input handlers use (Interface Rule 15), so a remap renames itself everywhere at once. Not remappable: Pause, operative slots 1-4, and mouse actions.

**Pointer targets.** Pause; squad cards (click selects, double-click centers the camera on that operative); ability, item and grenade buttons; minimap (click or drag steers the camera); toast dismiss controls. Everything else is read-only.

**Width variants.** Below 1360 px viewport width the code tightens the Comm log and weapon panels. That is a size compaction only: zones, contents and order do not change (Open Question 5).

**Not designed:** gamepad focus order, touch hit-target sizing, safe zones.

---

## Accessibility

Tier: Standard (`design/accessibility-requirements.md`). Every Committed row that touches the HUD is stated below; Backlog rows stay Backlog and are not promoted here.

| Requirement | HUD treatment |
|---|---|
| Non-color cue for critical state | Selection: closed double ring. Focus: corner brackets. Injury and KIA: pip, glyph and text. Objective: mark shape plus printed check. Alert: printed number, bars and edge glow. Result: printed title. Grenade or item unavailable: label plus reason (P-03) |
| Text legibility | Readouts at least 12 px, absolute floor 10 px, at text scales 90 / 100 / 110 / 125%. Panels scroll internally and never compress (P-15) |
| Contrast | Body and readout text at least 4.5:1 composited over the worst-case scene; state strokes at least 3:1 and at least 2 px (art bible 7.5) |
| Keyboard | Every HUD action has a remappable key: squad slots 1-4, Q, E, R, G, camera W A S D, F and zoom. Pause is always available. Minimap drag-steer is covered by the camera keys. **Double-clicking a squad card to center the camera on one operative is pointer-only:** `F` recenters on the whole living squad, and no key centers a single operative (Open Question 7). Full keyboard travel across every panel is Backlog, not committed |
| Accessible labels | Pause, grenade state, toast dismiss and the Collateral chip carry labels; Collateral and the result banner use `aria-live="polite"` |
| Audio paired with visuals | Alert marker, hit flash and Weather chip accompany their audio cues. Captions for audio cues are Backlog |
| Reduced motion | Static fallbacks per E1-E15; semantic motion (alarm pulse, selection breathe, money tick) reduces to a distinct static state, never removed |
| High contrast | CSS-variable remap only; no layout change |
| Not in scope | Screen-reader pass on the tactical HUD; color-vision presets (both Backlog) |

---

## Open Questions

1. The code prints Collateral as a running CR figure (`src/ui/Hud.tsx`, `COLLATERAL n · −x CR` / `NOT BILLED`). The Tactical, Economy and Interface GDDs say the HUD shows a **count** only and CR is priced at Debrief. Decided 2026-09-29: the spec follows the GDDs; the code diverges and needs a story.
2. The fixed `13.7C` and `1.2M/S` chips in the top bar have no GDD source. Excluded from the inventory; decide whether they are removed, kept as non-semantic flavor, or given a source.
3. Z9 (alert toast under Z3) was decided 2026-09-29 to honor the art bible's top-right toast position; the code has no separate alert toast today. A story is needed.
4. Whether four squad cards fit between Z1 and Z4 at 125% text scale at 1280x720 without internal scroll is unverified; the rule is that Z2 scrolls internally if not.
5. Below 1360 px viewport width the code narrows the Comm log to 286 px and the weapon panels to 188 px and 146 px (`src/ui/ui.css`). No GDD specifies those sizes; the spec records the behavior as size-only compaction and does not adopt the numbers.
6. The code sets the Comm log body at `calc(9.5px * var(--text-scale))` (`src/ui/ui.css`), below the 10 px floor at 100% scale. Art bible 7.2 raised the floor from 9.5 px to 10 px. The spec follows the art bible; the code needs a fix story.
7. Should a key center the camera on the selected operative? `F` recenters on the whole living squad only (`src/game/bindings.ts:66`), so single-operative centering is pointer-only (double-click a squad card). Partial keyboard travel is a Backlog row, not a committed one.
