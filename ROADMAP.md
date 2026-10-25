# Roadmap

> Keep this file current at all times. Every change of plan, every finished
> step, and every new step updates it in the same turn. It always lists the
> next steps, and at the very least the very next step. Rules: `CLAUDE.md` → Roadmap.

**Last updated:** 2026-10-24
**Stage:** Production (`project.yaml`)
**Sprint:** Sprint 11 (2026-10-23 to 2026-10-28) — all 24 stories Complete 2026-10-23 (IF-016 to IF-035, plus IF-036 to IF-038 and TM-018 added during the sprint); QA sign-off pending
**Goal (owner, 2026-10-23):** pass the Production → Polish `/gate-check`. Open blockers from gate re-run 3 (`gate-check-polish-2026-10-19-r3.md`): five screens without UX specs; playtests 2–3 and the fun hypothesis; smoke at HEAD; plus accessibility compliance and the pattern library.

## Next step

1. **`/smoke-check sprint`** at HEAD, then **`/team-qa sprint`** for Sprint 11.

## After that

2. **`/retrospective`**, then **`/gate-check`** Production → Polish.
3. A human playtest after the fixes (CD-PLAYTEST: every timing finding so far comes from agents; TM-019 needs a person at real-time speed); owner hand-play dated 2026-10-28.
4. Owner decisions from `production/qa/playtests/fun-hypothesis-2026-10-23.md`: adopt the revised hypothesis in `design/gdd/game-concept.md` or keep the original; after the human session, whether "too hard" needs a third profile (difficulty-curve OQ); in Polish, whether to reopen Abort (§19 #8).
5. `/code-review` of the playtest 3–4 fixes (WN-021, WN-022, TM-019 to TM-021, IF-039; not run); Visual/Feel sign-off for TM-020.
6. Harness: import the module URLs the page loaded (the Vite `?t=` stamp split the fixture's tutorial store in session 4).
7. Register TRs at a later `/architecture-review`: hit targets (IF-031 to IF-035 waiver), world event weights (WN-021), in-world objective markers (TM-020).

## Dated commitments (owner, retro 10 action 3)

| Due | Item |
|---|---|
| 2026-10-23 (Fri, Sprint 11 day 1; moved from Sat 24 by the owner) | Audio listening pass |
| 2026-10-28 | Hand-played mission, folded into the EC-023 winnability playtest |
| 2026-10-28 | Re-profile World Network p95 (also sets the open-time budget the World Network spec leaves blank) |
| Polish | BUG-0008 (deferred) |

## Done recently

- 2026-10-24 — Playtest screenshots gitignored (`production/qa/playtests/*/shots/`); session 2's 150 tracked shots untracked, kept on disk (owner).
- 2026-10-24 — Production-build perf run (`perf-2026-10-23/perf-prod.json`): heap max 69.2 MB vs 192, mission entry 4364 ms vs 5 s, menu ready 52 ms vs 1 s; frame time, hitches and draw calls also within budget. RISK-0003 closed. Harness reaches the stores through `src/perfHooks.ts` under `VITE_PERF_HOOKS=1` (absent from normal builds); `preview-perf` launch config added.
- 2026-10-24 — Owner set the memory ceiling (192 MB heap) and load-time budget (mission entry 5 s, menu ready 1 s), both on the production build: `project.yaml`, `docs/technical-preferences.md`, report amended, RISK-0003 updated (still Open until measured).
- 2026-10-24 — `/perf-profile full` report written: `production/polish/full-report-2026-10-24.md`. Frame time (p95 7.2–7.3 ms vs 16.7), hitches (0 over 50 ms live) and draw calls (max 224 vs 300) OK; memory and load time NOT ASSESSED (no budgets). Open: mission-entry hitch trace, production-build load measurement.
- 2026-10-24 — Performance profile run at `ab1cf1e` (Rust Haven fixture, owner 2026-10-24; `technical-preferences.md` updated): p95 7.2–7.4 ms in every phase, World Network 7.3 ms (the p95 re-profile dated 2026-10-28, unless World Network code changes before then); live mission max 25 ms, 0 frames over 50 ms; draw calls max 224 (mission), under 300; heap max 117 MB; 0 errors. Harness fixed: the IF-038 deploy label, resuming the TM-019 casualty hold, and the 10-19 live-mission window and spike timings ported back.
- 2026-10-23 — Playtest 3–4 fixes closed out: story files WN-021, WN-022, TM-019 to TM-021, IF-039 (code in `2c73542`); living spec, Interface, World Network and Tactical GDDs, and the World Network, Brief, Assembly, Debrief, HUD, Settings and pattern-library specs updated (Space is the tactical hold, Escape the menu; HELD BY; drift settles; Debrief KIA and sector rows; Abort hint); `design/difficulty-curve.md` given the playtest evidence (two levers, three cross-system rows, "too hard" still open); `production/qa/playtests/fun-hypothesis-2026-10-23.md` written (CD-PLAYTEST CONCERNS, hypothesis revised, adoption the owner's call). Sweep now waits for finite animations before measuring: all 12 surfaces 0 failures at 1280×720, World Network measured first with the card up, Menu, Research, Settings and Balance re-swept.
- 2026-10-23 — Agent playtests 3 and 4 run; reports for sessions 2–4 written (`production/qa/playtests/playtest-2026-10-23-agent-s{2,3,4}.md`); CD-PLAYTEST: CONCERNS, hypothesis revised. Polish milestone (`production/milestones/polish.md`) and risk register (RISK-0001 to 0005) written. Harness `fixture` command added (`123e323`).
- 2026-10-23 — Five screen UX specs APPROVED by `/ux-review` (Research, Brief, Assembly, Debrief, Settings). Pattern library P-26 to P-28; P-05 / P-13 updated. IF-038 (label in name, Debrief Balance and invoice, no overlapping boxes). Agent playtest 2 run; its mission findings fixed in TM-018 (no destroy soft-lock, blast ring, dark destroyed devices, camera taught); harness fixed (pause ownership, no time leak between commands, grenade targeting kept).
- 2026-10-23 — Five screen UX specs drafted (Research, Brief, Assembly, Debrief, Settings; In Review). IF-037: their committed-tier deltas fixed (no ellipsis anywhere, text-overlap check, P-05 focus for Settings-from-Pause / Balance / Recruitment Market, Debrief focus, reduced-motion overlays, researched check glyph, framed Settings selection).
- 2026-10-23 — Difficulty-curve open questions decided (two wins to Intel 2; grenade centre 80; one-shot RADIO CALL advisory). Pattern library: P-20 / P-23 corrected, P-24 Scan marker and Focus selection and P-25 Inline moment note added (World Network spec OQ15, OQ19 closed).
- 2026-10-23 — IF-036: every surface (Menu, Settings, Research, Brief, Assembly, Debrief, Mission HUD, Pause) meets the 10 px / 4.5:1 / 24×24 floors and lays out at four text scales; sweep 0 failures; Brief recon type moved to an HTML overlay.
- 2026-10-23 — Sprint 11 implemented: IF-016 to IF-035 Complete (World Network to its UX spec; type, ink and hit-target floors; card no longer blocks the clock). Probe `production/qa/evidence/sprint-011/probe.mjs` ALL PASS (152); 1642 tests; code review APPROVED WITH SUGGESTIONS, applied. `npm test` ×3 green before the first story (retro 10 action 4).
- 2026-10-23 — `/qa-plan sprint`: `production/qa/qa-plan-sprint-011-2026-10-23.md` written; five missing guard cases (IF-020, IF-023, IF-026, IF-029, IF-030) added and back-filled into the stories; the four IF-015 gaps carried as Brief cases.
- 2026-10-23 — `/sprint-plan new`: Sprint 11 written (`production/sprints/sprint-011.md`, `production/sprint-status.yaml`). Guard ACs added to IF-016 to IF-035 for the `/story-readiness` minimum; PR-SPRINT CONCERNS → owner Option A (IF-019, IF-025 Nice to Have); TR waiver for IF-031 to IF-035; view-control bar stays.
- 2026-10-23 — `/create-stories interface`: IF-016 to IF-035 written (19 UI, 1 Integration) from the World Network spec's as-built deltas. Owner rulings recorded in the spec and decision log: OQ2 Unrest ink and bar by state; OQ3 left INFLUENCE panel removed, RESOURCE POOL → INTEL; OQ5 `-- CHANNEL OPEN --`; OQ8 effect on its own line; OQ17 Ink Dim and Ink Faint text → Ink, locked rows dim the frame only; IF-026 readout list; IF-035 added.
- 2026-10-23 — `/sprint-plan new` run: BLOCKED, no Ready stories (145 of 145 Complete). No sprint file written.
- 2026-10-23 — World Network spec Open Questions 20 and 21 closed by the owner: failed-banner line replaced (`ROSTER EMPTY // NO CONTRACT CAN BE TAKEN`); minimum hit target 24×24 CSS px (WCAG 2.2 SC 2.5.8 AA). Spec only; code still open.
- 2026-10-23 — World Network spec revised (focus order, measured contrast, character limits, null handling, flagged doc conflicts) and re-reviewed: APPROVED, 3 advisory; header marked Approved and committed.
- 2026-10-23 — `/ux-review` of the World Network spec: NEEDS REVISION (3 blocking, 8 advisory).
- 2026-10-22 — `ROADMAP.md` added, with the rule to keep it current in `CLAUDE.md` (`cf2aa9d`).
- 2026-10-22 — World Network UX spec written; globe Scan recorded as owner decision in the pillars, Interface Rule 5 and the World Network GDD (`bfb72f0`).
