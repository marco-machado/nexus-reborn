# Cross-GDD Review Report

Date: 2026-10-08
GDDs Reviewed: 8 of 8 present
Not read: none
Systems Covered: World Network, Economy and contracts, Research, Persistence and validation, Roster and Assembly, Tactical mission, Interface, Audio

Focus: `since-last-review` returned no changed GDDs since `gdd-cross-review-2026-10-07b.md`; the user chose a full review. No GDD carries `## Summary` (failed open). Phase 2 and Phase 3+4 ran as parallel `game-designer` sub-agents that read the files directly (deviation: sections were not pasted). The Phase 3 agent read `tactical-mission.md`, `interface.md`, `persistence-and-validation.md`, `audio.md` by targeted grep only. Engine (context): Web — three.js 0.185.1 r185, React 19.2.8, r3f 9.6.1, Vite 6.4.3, TS 5.8.3, Zustand 5.0.14.

---

## Consistency Issues

### Blocking
None.

### Warnings

**W-01 — Two apply-once mechanisms for the Debrief outcome.** `world-network.md` AC (line ~254): "the existing `outcomeApplied` / `outcomeSerial` guard refuses a second apply … with no repeated … Tax/Credits deposit". `economy-and-contracts.md` Outcome DTO (line ~99): the apply-once key "is minted once per deploy … must not be minted by the apply itself"; "The existing … guard … covers the campaign and World Network apply only, not Credits." Fix: owner picks the canonical key; align World Network's AC (drop "Credits" from what the existing guard covers) or state the shared key in both.

**W-02 — Program-complete Feed line has no data edge.** `world-network.md` UI Requirements and `interface.md` surfaces table require the 21st-project Feed line (§19 #10), but World Network's Research Interactions row has In = "—" and `research.md`'s World Network row has Out = "—". Fix: add the edge both sides; event name open. One-line each.

**W-03 — Escape-disarm for New Operation / telemetry Clear is GDD-only.** `interface.md` Rule 12 and States table: "timeout or Escape disarms". Living spec §12 and registry `arming_window`: timeout only. Sits beside OQ11 (Escape on Abort, open). Fix: owner decision — write into §12 + registry, or remove from Interface.

**W-04 — Economy hire AC uses an impossible cost.** `economy-and-contracts.md` AC (line 259): "a hire costing **10,000 CR**". `roster-and-assembly.md` AC29 / registry `hire_min_cost`: 16,000–34,000 CR. Fix: use 16,000 CR. One-line.

**W-05 — "Persistence applies once" contradicts Persistence.** `economy-and-contracts.md` Player Fantasy and Rule 10, `tactical-mission.md` UI Requirements, `systems-index.md` CD note. `persistence-and-validation.md` Rule 12: Persistence does not apply the outcome and does not durable-write on Debrief; Interface says "commits once". Fix: "Persistence commits once on the next Screen" at each site.

### Info
- I-01 `interface.md` flagged-list points the 0/0 no-data marker at AC25 (telemetry retention); the AC is Persistence's.
- I-02 `persistence-and-validation.md` OQ2 says Interface OQ2 "should be closed" — it is closed.
- I-03 `tactical-mission.md` sibling conflicts #2, #5 and `interface.md` #7 are resolved but still listed.
- I-04 ETA-day length undefined: Roster Rule 9 / AC73 assume 24 h; `research.md` says it is defined nowhere; §19 #8's recovery claim depends on it.
- I-05 Persistence Rule 15 serializes generated-market RNG; §17 names only World Event and candidate streams.
- I-06 Interface's Research Interactions row omits "remaining strategic time" (present in surfaces table).
- I-07 Registry: `win_rate` `revised:` empty; `injuryRecoverySec` / `remaining_downtime` list `world-network.md` which never names them; several `referenced_by` lists under-filled; `generated_reward`, `new_balance` unregistered.
- I-08 Header drift: Economy status sentence says the third-pass log entry was declined (it exists); Tactical, Roster, Audio Last Updated predate their 2026-10-07/09-29 log entries; Audio status is not an index token.
- I-09 Carry-overs: Tactical ↔ Interface circular result-delay pointer; Roster OQ1 target "After Persistence extract" stale.
- I-10 Persistence "Clear → Balance empty" vs "entry point gone" still agree only by implication.

No findings: 2a (all dependencies reciprocated, match systems-index), 2d (no knob ownership conflicts), 2e (re-derived Tax, generated rewards incl. Severe clamp 95,000, collateral nets, research gap 447,550, mass gate ~57 wins, `injuryRecoverySec(0.175)` = 108,000 s, `hit_chance` Hardened 31.68%, `risk_index` 89 — all agree).

---

## Game Design Issues

### Blocking
None.

### Warnings

**D-10 — World Network attention budget unaccepted.** ~7 concurrently live systems on the strategic screen (clock/speed, Focus + 4×6 numbers, Feed, market expiry timers, 3 Influence spends with cooldowns, Timeline, Event forecast at intel 2+), none pausing. `game-concept.md` "Shipping-cut holism" accepts only the mission peak. Same surface as the D-01 arrival evidence. Recommendation: accept or limit in concept/§19; do not resolve D-01 here.

**D-11 — Debrief reload escapes a seen outcome.** Persistence AC: reload on Debrief → Continue restores S, not invoice mutations; Interface marks the invoice "unfiled". §19 #8 accepts escapes on the grounds that checkpointing the *mission* would violate the anti-pillar; that rationale does not cover a reload after KIA / CAMPAIGN FAILED is shown. Undercuts Pillar 3 and Roster "A kill is permanent". Owner decision: durable write at Debrief apply, or extend §19 #8 explicitly.

**D-12 — Pillar 1 vs Pillar 3 incentive untested.** Any civilian hit costs 5,000 CR and the clean bonus (+2 Influence, +15 intel; clean win is the route to Stabilize). Hold Fire + Attack-through makes permanent Hold Fire and per-target Attack the cheap play, drifting toward the "click-every-shot" anti-pillar. Vertical slice never priced a stray (Tactical OQ10). Recommendation: add a Tactical open question beside OQ10; do not retune.

**D-14 — Intel-1 stall after Glass Veil.** Start 25/100; clean win → 80, dirty → 65; intel stays 1. Hollow Crown / Rust Haven need intel 2; quiet replay gives 0. Market weighting favours South America (41/24) and Africa (37/28) → High threat → locked-hidden but counted in the 3-offer cap. Expedite costs 12 Influence, director holds ≤ 8. Board can show nothing but a quiet Glass Veil with no explanation. Options: exclude locked offers from the cap; raise opening progress; guarantee a Moderate roll while intel < 2; or accept in §19.

### Info
- D-13 Scan Chance rises with any completed research (Research Rule 11) while risk index ignores research — readout only; label on Scan as on Brief.

3a PASS · 3b mission peak accepted, World Network peak D-10 · 3c D-11, D-12 (squad size, Abort, quiet replay, threat-tier reward/day ≈ flat — PASS) · 3d PASS (Influence late surplus, already a WN follow-up) · 3e D-14 · 3f all 8 map; exceptions D-10/11/12 · 3g PASS (weak spot D-11).

---

## Cross-System Scenario Issues

Scenarios walked: 4
1. Reload on Debrief after pyrrhic win / KIA
2. Intel stall after the first authored win
3. 4-day ETA catch-up with mixed dues
4. Collateral reaches its cap mid-mission

### Blockers
None.

### Warnings
⚠️ **S-10 Reload on Debrief** — Tactical, Roster, World Network, Economy, Persistence, Interface. CAMPAIGN FAILED shown, then reload restores the pre-mission snapshot: broken state transition (a shown failure does not persist) and contradictory messaging (CAMPAIGN FAILED beside "unfiled"). Defined behaviour, so Warning; root cause D-11.

⚠️ **S-11 Intel stall** — World Network, Economy, Interface. Folded into D-14; first-visit overlay (WN Rule 13) does not teach intel gates.

### Info
ℹ️ **S-12 ETA catch-up** — World Network (ADR-0018 order), Research (ascending `endT`), Roster (independent). All sync at t1; candidate count (Roster OQ5) and Influence cooldowns vs burst already open. Roster Rule 9 "authored ETA ≥ max D" also holds for generated ETAs — optional wording.
ℹ️ **S-13 Collateral cap** — HUD counts, Economy stops at Reward, World Network keeps Unrest; consistent with concept.

---

## Prior-report verification (2026-10-07b)
Landed: W-01, W-02 (§10, §12, §17), W-03/S-02 split, S-01, D-01 open questions, W-04 (partly), registry `audio.md` removal.
Not landed: registry `win_rate` `revised:`; Roster OQ1 target; Tactical ↔ Interface pointer; Roster/Tactical/Audio header drift (Economy header re-drifted). Code drift (Replay guard, Balance entry points, 0/0 marker) out of scope.

---

## GDDs Flagged for Revision

| GDD | Reason | Type | Priority |
|-----|--------|------|----------|
| economy-and-contracts.md | Apply-once key vs WN (W-01); hire AC cost (W-04); "applies once" (W-05); header (I-08) | Consistency | Warning |
| world-network.md | Apply-once AC (W-01); missing Research edge (W-02); intel stall (D-14); attention budget (D-10) | Consistency / Design | Warning |
| interface.md | Escape-disarm GDD-only (W-03); stale AC pointer (I-01) | Consistency | Warning |
| persistence-and-validation.md | Debrief reload escape (D-11); OQ2 wording (I-02) | Design / Consistency | Warning |
| tactical-mission.md | "applies once" (W-05); Pillar 1 vs 3 OQ (D-12); header (I-08) | Consistency / Design | Warning |
| research.md | Missing World Network edge (W-02) | Consistency | Warning |

---

## Verdict: CONCERNS

No blocking issues. Five consistency warnings, four design warnings, two scenario warnings. W-02, W-04, W-05 and the Info edits are one-liners. W-01, W-03, D-11, D-14 need owner decisions before epics consume these files.

### Decisions recorded (user, 2026-10-08)
- Full review run although no GDD changed since 2026-10-07b.
- Report written to this file.
- Systems index statuses left Approved.

### Fixes applied (2026-10-08, same session; user: "fix all warnings")
- **W-01 (user: deploy-minted key canonical).** `world-network.md` apply-once AC now cites the deploy-minted key on the outcome DTO and states the existing `outcomeApplied` / `outcomeSerial` guard covers campaign and World Network only, not Credits. Code gap remains a story.
- **W-02.** Research → World Network program-complete edge added to `world-network.md` Interactions (Research row, In) and `research.md` Interactions (World Network row, Out); event name open.
- **W-03 (user: drop from Interface).** `interface.md` Rule 12 and New Operation States row now timeout-only, matching §12; OQ11 widened to Escape while Abort, New Operation, or Clear is armed.
- **W-04.** Economy hire AC → 16,000 CR.
- **W-05.** "Persistence applies once" → "Persistence commits once on the next Screen" in `economy-and-contracts.md` (×2), `tactical-mission.md`, `systems-index.md`.
- **D-11 / S-10 (user: accept).** Living spec §19 #8 now names reload-on-Debrief as a deliberate escape and the "unfiled" cue as intended; `persistence-and-validation.md` Overview cites it.
- **D-14 / S-11 (user: open question only).** `world-network.md` Open Questions records the intel-1 stall with candidate fixes; no tuning changed.
- **D-10.** Recorded as a `world-network.md` open question, tied to the D-01 arrival classification (not accepted or limited — owner decision pending).
- **D-12.** `tactical-mission.md` Open Question 11 records the Pillar 1 vs 3 incentive for playtest; no retune.
- **Not done:** Info items I-01–I-10 and D-13. Post-edit GDDs are not re-scored by `/design-review`.
