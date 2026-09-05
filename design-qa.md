# Scoped World Network correction

Final result: passed

The latest user instruction limits visual edits to the annotated sector list,
central Scan and top-right resource readout. The prior whole-screen mockup is
not authorization to restyle surrounding chrome.

## Scope verification

- All original shared CSS is restored verbatim; appended selectors target only
  the three marked regions.
- Original World Network title styling, subtitle, screen frame, grid, right-side
  panel, bottom Time Code/Timeline/Feed/Resource Pool and navigation are restored.
- The name was already WORLD NETWORK before this work.
- Country/city projection changes serve the detailed Scan. The existing right
  inset retains its original 2.5:1 view; sector-list silhouettes use a separate
  square view.
- The right-panel and bottom-strip JSX were compared against HEAD and match.

## Browser evidence

Corrected screenshot:
`/Users/machado/.codex/visualizations/2026/09/04/01a06e7e-cd82-7aa0-852a-37a733110b8d/world-network-scoped.png`

1280 × 720 CSS/pixel viewport, devicePixelRatio 1. No clipped sector labels,
legend names or resource values. All sector rows fit without scrolling.
Earlier full-screen redesign screenshots are superseded by this correction.

## Audio regression

The disposable browser fixture instrumented real AudioBufferSourceNode starts
and stops while rendering App without loading or saving campaign storage.

Before: World Network → Research changed loop starts from 1 to 2 and stops from
0 to 1. Each screen's clock-effect cleanup stopped the strategy bed.

After: World Network → Research → Assembly → World Network → Brief → World
Network retains exactly one loop start and zero stops. The AudioContext remained
running, with time advancing from 0.13 to 1.14 seconds during those transitions.
Strategy music now follows the app's continuous run of those four Screens.
Three regression tests cover cross-screen continuity, mission/debrief boundaries,
return, menu and subscription cleanup. Mission music and audio assets are unchanged.

## Checks

- Lint passed.
- 531 tests across 33 files passed.
- Production build passed.
- git diff --check passed.
- Partial browser click-through: World Network, Research, Brief and Assembly.
- No browser warnings/errors during the exercised flows.
- Temporary audio fixture removed; preview server stopped after verification.
