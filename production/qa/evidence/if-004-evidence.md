# Test Evidence: IF-004 Chance vs Risk bands and World Network owner readouts

> **Story**: `production/epics/interface/story-004-chance-vs-risk-bands-and-world-network-owner-readouts.md`
> **Story Type**: UI
> **Date**: 2026-10-19
> **Tester**: Claude (headless Chrome for Testing, 1280x720, via /team-qa Phase 5, autonomous mode)
> **Build / Commit**: 0dcb87c

---

## What Was Tested

The retained `production/qa/evidence/if-004/capture.mjs` was copied unchanged to `production/qa/evidence/team-qa-2026-10-19-s9/if-004/` and re-run at HEAD, because UI source changed after the story's evidence commit. The run covered:
- the first-visit overlay, the Europe and North America sector readouts, and the Influence action reasons;
- Antarctica, the Timeline Live/Review cue;
- Chance against Risk index at intel 1 and intel 2.

The transcript matches the signed-off original line for line, apart from decimals. Cases: `production/qa/test-cases/if-004-chance-risk-owner-readouts-cases.md` TC-01 to TC-07.

**Acceptance criteria covered**: AC7, AC27

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC7 | GIVEN intel < 2 vs intel ≥ 2 on the same contract, WHEN Brief and World Network chrome are compared, THEN World Network still prints Chance; Brief shows Chance at intel < 2 and Risk index bands (not a percentage) at intel ≥ 2. | PASS | World Network: `CHANCE 36%` at intel 1 and intel 2. Brief at intel 1: `PROJECTED SUCCESS 36%`. Brief at intel 2: `RISK INDEX 89 // SEVERE`, with no percent and no cap label. Overflow `[]` both times. |
| AC27 | GIVEN World Network owner outputs, WHEN the sector readout, Timeline, Influence actions and first-visit overlay are inspected, THEN printed Tax is distinguishable from payment eligibility; Live/Review are distinguishable while Scan numbers remain live; unavailable actions show their owner-reported reason (unaffordable, cooldown, no target, or locked sector); no Influence action for Antarctica; first-visit teaching covers Pause/Clock speed, Influence unaffordable-not-broken and Nexus-held Tax. | PASS WITH NOTES | Tax: Europe `TAX YIELD 2,468 CR / 24H` + `TAX PAID NO // NOT NEXUS-HELD`; North America `TAX YIELD 4,080 CR / 24H` + `TAX PAID YES // NEXUS-HELD`. Reasons: `UNAFFORDABLE` (Stabilize, Lobby), `NO TARGET` (Expedite), `COOLDOWN 24H`, all disabled. Antarctica: `NO SURVEY DATA`, 0 actions, and the click keeps `eu` selected. Review: `REVIEW -6.0H > GO LIVE`, and North America Control/Unrest moved while the pin held. Overlay: all three teaching strings. SECTOR LOCKED has no UI capture. qa-lead R1 accepts `src/ui/worldChrome.test.ts:137-140` as its evidence. |

---

## Screenshots / Video

All files are in `production/qa/evidence/team-qa-2026-10-19-s9/if-004/`.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `01-first-visit-overlay.png` | First-visit orientation with the three teaching points | AC27 |
| 2 | `02-europe-tax-not-paying-unaffordable.png` | Europe: printed Tax not paid; Influence unaffordable | AC27 |
| 3 | `03-north-america-tax-pays.png` | North America: 4,080 CR / 24H, paid | AC27 |
| 4 | `04-europe-cooldown-no-target.png` | Cooldown and no-target reasons | AC27 |
| 5 | `05-antarctica-no-influence-action.png` | Antarctica with no Influence action | AC27 |
| 6 | `06-timeline-live.png` | Timeline Live | AC27 |
| 7 | `07-timeline-review-numbers-live.png` | Review pinned while sector numbers move | AC27 |
| 8 | `08-world-network-intel-1-chance.png` | World Network Chance at intel 1 | AC7 |
| 9 | `09-brief-intel-1.png` | Brief with Chance at intel 1 | AC7 |
| 10 | `10-world-network-intel-2-chance.png` | World Network Chance at intel 2 | AC7 |
| 11 | `11-brief-intel-2.png` | Brief Risk index `89 // SEVERE` at intel 2 | AC7 |

---

## Test Conditions

- **Game state at start**: fresh profile per run; New Operation; Glass Veil (m01) for the Brief checks.
- **Platform / hardware**: macOS, headless Chrome for Testing (chromium-1247), 1280x720; `npm run dev` on port 4200.
- **Framerate during test**: not measured in this run.
- **Any special setup required**: the retained script's named assists. `intelLevel` is set on campaignStore (1, then 2). Influence points, a cooldown and the Review pin are set on worldStore. The Antarctica shot forces `worldStore.selected = 'an'`. Focus, Pause and contract select are real UI clicks.

---

## Observations

- Capture 11: the CIVILIANS row is cut at the top edge of the tactical-stats scroll box, because the box is scrolled to show RISK INDEX. Capture 07 shows the same for North America in the scrolled SECTORS list. qa-lead R2 accepts both as scroll-viewport edges with reachable overflow. Advisory to ux-designer: scroll cues are inconsistent.
- Capture 07 shows `REVIEW -7.7H`, the post-run read (transcript line 16). `-6.0H` is the paused read before the run (line 13).
- Advisory to game-designer (R1): if no sector can be locked in play, the "locked sector" clause of AC27 is dormant.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | Not required: UI story, closed by the retained screenshots | — | — |
| QA lead | qa-lead (agent, /team-qa Phase 5 review, `team-qa-2026-10-19-s9/qa-lead-review.md`) | 2026-10-19 | [x] Approved — SIGNED WITH NOTES |

---

*Template: `.claude/docs/templates/test-evidence.md`*
