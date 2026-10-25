# BUG-0013 fix re-walk (IF-037 TC-037-03), 2026-10-25

Headless Chrome for Testing via playwright-core, 1280x720, this worktree's dev
server (`npx vite --port 4314 --strictPort`). All source edits were made before
the run; the server was stopped afterwards.

## Files

- `probe.mjs`: rendered node-label size (computed font-size x the SVG's
  `getScreenCTM().a`) at 90 / 100 / 110 / 125, per branch; node-label overlap
  (the sweep's rule, plus any box intersection between two labels); labels
  inside their SVG; `clipped('body')` at all four scales in default and high
  contrast; `clipped('body')` at 125% with five more selections. Helpers copied
  verbatim from `../screens-2026-10-23/sweep.mjs`.
  Run: `PROBE_URL=http://localhost:4314/ node production/qa/evidence/bug-0013-fix-2026-10-25/probe.mjs`
- `probe-output.txt`, `probe-output.json`: its output. RESULT: PASS.
- `research-<scale>.png`, `research-<scale>-hc.png`: Research at each scale,
  default and high contrast. `research-125-neural-cache.png`: a locked
  selection with two prerequisites at 125%.
- `sweep-sweep-output.txt`, `sweep-sweep-research.json`, `sweep-research-*.png`:
  `SURFACES=research node production/qa/evidence/screens-2026-10-23/sweep.mjs`
  run with `PROBE_URL=http://localhost:4314/` and `PROBE_OUT=<this folder>/sweep-`
  (the prefix is why the names repeat "sweep-").

## Result

| Text scale | Rendered (reference ADV.PROPELLANTS) | Expected (±0.2) |
|---|---|---|
| 90 | 9.632 px | 9.559 px |
| 100 | 10.621 px | 10.621 px |
| 110 | 11.683 px | 11.683 px |
| 125 | 11.683 px | 11.683 px |

Label overlap 0, labels outside their SVG 0, clip counts 0 at every scale in
default and high contrast. Sweep: every count 0, no page errors.
