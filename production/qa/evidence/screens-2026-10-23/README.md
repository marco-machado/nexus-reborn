# Every-surface accessibility sweep, 2026-10-23 (IF-036, and the base for the screen UX specs)

**Harness**: `sweep.mjs`, headless Chrome for Testing at exactly 1280×720 against the dev server on port 4200. Never the in-app pane or the user's Chrome. Harness assists are named in the script header.
**Surfaces**: Menu, Settings (from the menu), Research, Brief (Rust Haven), Assembly, Debrief (won), Mission HUD, Pause.
**Per surface**: text runs under 10 px and under 4.5:1 as rendered (default and high contrast); Ink Dim / Ink Faint text; SVG text at its rendered size (font-size × screen scale) and fill contrast; pointer targets under 24×24; Tab order; clip / truncation / spill / sideways scroll / panel overlap at text scales 90 / 100 / 110 / 125. Outputs: `sweep-output.txt`, `sweep-<surface>.json` (incl. every text box's width and size, for the specs' localization limits), `<surface>-{90,100,110,125,hc}.png`.

## Result (final run)

Every count is 0 on every surface. Exempt and listed by the sweep: inactive controls under 4.5:1 (Settings RESET / RESET ALL while at defaults; the minimap zoom at its limit), per WCAG 1.4.3.

## Watched failing

- First run, before IF-036: Settings 87 sub-10 px runs / 70 sub-4.5:1 / 40 targets under 24; Research 52 / 36; Brief 76 / 72 (+14 Ink Faint); Assembly 124 / 105; Debrief 1 / 24; Mission HUD 95 / 75 / 5 targets / 4 clips at 110 and 125; Pause 136 / 113.
- SVG text check: Brief recon labels at 6.2–8.6 px, briefing lines 4.19:1; Research node labels 9.5 px; portrait serial ≈2 px.
- Sideways-overflow check: a reverted tactical-rail mutation reported `hscroll … 377 in 335` at every scale.

## Not exercised

- Screen-reader output (labels read from the DOM only).
- Windows below 1280×720; resolutions above it.
- The Mission HUD in a live firefight (measured a few seconds after deploy).
