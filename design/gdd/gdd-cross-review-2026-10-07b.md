# Cross-GDD Review Report

Date: 2026-10-07 (second run of the day; file suffix `b` so `review-scope.sh` `sort | tail -1` picks it after `gdd-cross-review-2026-10-07.md`)
GDDs Reviewed: 8 of 8 present
Not read: none
Systems Covered: World Network, Economy and contracts, Research, Roster and Assembly, Persistence and validation, Tactical mission, Interface, Audio

Also loaded: `design/gdd/game-concept.md`, `design/gdd/game-pillars.md`, `design/gdd/systems-index.md`, `design/registry/entities.yaml`, prior report `design/gdd/gdd-cross-review-2026-10-07.md` (CONCERNS), the uncommitted 2026-10-07 `/design-review` edits (Economy, Interface, Persistence, systems index, registry) and their review-log entries, `prototypes/nexus-reborn-vertical-slice/REPORT.md`, living spec `docs/game-design.md` §10, §17, §19.

Focus: full. No GDD carries `## Summary`; the review failed open and read all eight. Phases 2 and 3 ran inline in one context rather than as two sub-agents; both ran in full. Engine pin (context only): React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 (r185); TypeScript 5.8.3; Zustand 5.0.14.

---

## Consistency Issues

### Blocking

None.

### Warnings

**W-01 — World Network still places campaign banners only on its own screen.**
Interface now places the pyrrhic-win CAMPAIGN FAILED banner on Debrief: surfaces table ("This is the one campaign banner Debrief carries"), Rule 18, AC29. `world-network.md` Visual/Audio Requirements: "Campaign banners live on this screen"; its UI Requirements list no Debrief placement. World Network's own pyrrhic AC ("WHEN the debrief is shown, THEN the CAMPAIGN FAILED banner takes precedence") already implies Debrief. Residue of the morning W-01. Fix: one sentence in World Network naming the Debrief pyrrhic banner.

**W-02 — Four new rules live only in GDDs; living spec and code disagree.**
- Persistence Rule 17: Balance offered iff the retained log has ≥ 1 record.
- Persistence Formulas: `win_rate` at `won + lost = 0` shows a no-data marker.
- Interface Rule 12: 3 s arming window extended to New Operation and telemetry Clear.
- Interface Rule 18: quiet replay + pyrrhic win shows both banners, CAMPAIGN FAILED first.

Living spec §17 says only "A Balance dashboard aggregates those records. Win rate is won / (won + lost)"; §12 names the 3 s for Abort only; §10 has no both-flags order. Code offers Balance unconditionally (`src/ui/Settings.tsx:343`, `src/ui/index.tsx:1684`). Every GDD header says "this file aliases them; do not fork rules" and CLAUDE.md says "Code wins when they disagree", so as written these decisions lose to both. Fix: write them into §17 / §12 / §10 (or record the exception) and open implementation stories.

**W-03 — Interface Open Question 10 conflates two obligations and treats a specified rule as unspecified.**
Living spec §19 #10 specifies a milestone: "a research-program completion line on the Feed (a owed Interface obligation)" — one line when the 21-project program completes. `research.md` UI Requirements obligation (2) is different: a surfacing beat for each project completion, which no spec defines. OQ10 frames the per-laboratory case and lists "treat the concept note as a specified rule" under Do not. The program line is a living-spec rule; only its event and copy are open. Fix: split OQ10. Program-complete Feed line is owed (Feed is World Network's surface); per-project beat stays open.

**W-04 — Status records disagree; two GDDs changed after their approving review.**
- `systems-index.md` marks all 8 Approved; the 2026-10-07 review logs support that (re-reviews APPROVED).
- `interface.md` header: "In Review … awaiting re-review". `persistence-and-validation.md` header: "In Review … re-review decides Approved". `economy-and-contracts.md` header: Status Approved, Last Updated "(/design-review NEEDS REVISION …)".
- `systems-index.md` Last Updated still says "five GDDs marked Needs Revision"; Progress Tracker says "Design docs approved: 3".
- Current content hash ≠ reviewed hash: `economy-and-contracts.md` `4de08a3` vs reviewed `bd1ca27`; `interface.md` `fbe45c8` vs reviewed `4dc00cd`. Post-approval edits are unreviewed.

### Info

- Registry: `collateral` and `net_payout` list `design/gdd/audio.md` in `referenced_by`; Audio declares both "Not dependencies". `win_rate` notes changed 2026-10-07 but `revised:` is still empty.
- 2a dependency bidirectionality: no new asymmetries.
- 2d tuning-knob ownership: arming window appears in Persistence and Interface knobs; Persistence names Interface as owner. No conflict.
- 2e formula compatibility: new Economy ACs re-derived — Severe, initial priority, u = 0.5 → raw 102,900 → clamp 95,000 CR; civiliansHit 2.7 → N = 2 → 10,000 CR.
- 2f acceptance criteria: Persistence "Clear confirmed → Balance is empty" and "Balance entry point is gone" agree only if the open overlay shows an empty state until closed. Implied, not stated.
- Carry-overs still open: Tactical ↔ Interface circular result-delay pointer; Roster OQ1 target "After Persistence extract" is stale; Roster / Tactical / Audio Last Updated drift.
- Resolved since the morning report: W-01 in Interface; W-04 (outcome-field owner); W-06 (Interface OQ9 closed to Persistence Rule 17). D-01 partly — residue is W-03 above.

---

## Game Design Issues

### Blocking

None.

### Warnings

**D-01 — Approved GDDs carry no record of contrary playtest evidence.**
Vertical slice 2026-10-06 (`prototypes/nexus-reborn-vertical-slice/REPORT.md`): World Network arrival — "i did not know what to do, where to start" — which fails the first-minute test in `world-network.md` Player Fantasy; Core Rule 13 (first-visit overlay) is the owning rule. Pillar 3 did not occur on Glass Veil: no civilian was hit, so stray fire was never priced on the invoice. No GDD, open question, or review log references either finding. This review does not classify the failure (PIVOT-NOTE records the owner declined to); it flags that World Network, Economy, and Tactical read as Approved without at least an open question pointing at the evidence.

### 3a–3g

- 3a Progression loops: one dominant loop. PASS.
- 3b Attention budget: mission peak accepted in game-concept. PASS.
- 3c Dominant strategies: nothing new. PASS.
- 3d Economic loops: every loop has a disposition; the new Economy pacing note (≈447,550 CR from ≈8–9 average generated wins) agrees with §16. PASS.
- 3e Difficulty curves: divergence authored (§19 #11). PASS.
- 3f Pillar alignment: all 8 map. PASS, except D-01.
- 3g Player fantasy: one Operations Director identity. PASS.

---

## Cross-System Scenario Issues

Scenarios walked: 6

1. Pyrrhic win end to end
2. Debrief exits on a failed campaign
3. Quiet replay + pyrrhic win
4. Telemetry off with history → Balance → Clear
5. Abort armed + Escape
6. Win ETA catch-up completes the 21st project

### Blockers

None. See the taxonomy note on S-01.

### Warnings

⚠️ **S-01 — Failed-campaign Debrief offers Replay** — Interface, World Network, Persistence, Roster.
Interface (edge case "If Brief is unlocked and Debrief returns…", AC6): authored Replay returns to Brief without reselecting. Persistence AC: Replay keeps selected contract C. World Network Rule 12: `selectMission` no-op on a failed campaign. No GDD says whether Replay is offered after a pyrrhic win or a loss that wipes the roster. Code offers it with no `campaignFailed` guard (`src/ui/index.tsx:1676`), in amber, beneath CAMPAIGN FAILED. Today the path dead-ends at Assembly (Deploy refused, 0 Ready). If Roster OQ1 makes hire legal on a failed campaign, a failed campaign can deploy again and nothing defines what a win does to the campaign flags. Taxonomy note: contradictory messaging is a Blocker under this skill's taxonomy; rated Warning because no state can change today. Owner decision.

⚠️ **S-02 — 21st project completes during win catch-up** — Research, World Network, Interface.
Research `sync(t)` completes the program; §19 #10 owes a Feed line; neither World Network nor Interface owns emitting or placing it (W-03). An implementer will drop or invent it.

### Info

ℹ️ **Quiet replay + pyrrhic** — consistent: net payout is owner-supplied 0; the invoice note still prints. Both-banners order is Interface-invented (W-02).

ℹ️ **Balance after Clear** — open overlay shows the empty state with the no-data marker; the entry point is absent after close. Implied, not stated.

ℹ️ **Abort + Escape** — Interface OQ11 records it. Escape also toggles the pause modal Abort lives in, so the answer interacts with Rule 12.

ℹ️ **Pyrrhic audio** — "no celebration sting" on Debrief is consistent with the CAMPAIGN FAILED beat.

---

## GDDs Flagged for Revision

| GDD | Reason | Type | Priority |
|-----|--------|------|----------|
| world-network.md | Banner surface excludes Debrief (W-01); arrival playtest evidence unrecorded (D-01) | Consistency / Design Theory | Warning |
| interface.md | OQ10 conflates specified program line with per-project beat (W-03, S-02); Replay on failed campaign undefined (S-01); header In Review; post-approval edits (W-04) | Consistency | Warning |
| persistence-and-validation.md | Balance availability and `win_rate` zero rule are GDD-only (W-02); header In Review (W-04) | Consistency | Warning |
| economy-and-contracts.md | Header self-contradiction; post-approval edits (W-04); Glass Veil pillar-3 evidence unrecorded (D-01) | Consistency / Design Theory | Warning |

---

## Verdict: CONCERNS

No blocking issues. Four consistency warnings, one design warning, and two scenario warnings should be cleared before architecture or epics consume these files. W-01 and the header/index parts of W-04 are one-line edits. W-02 and S-01 need an owner decision.

### Decisions recorded (user, 2026-10-07)

- Report written to this file (`b` suffix, verified to sort after the morning report).
- Systems index statuses left unchanged; the user chose to fix W-01 and W-04 instead of marking rows Needs Revision.

### Fixes applied (2026-10-07, same session)

- **W-01 fixed.** `world-network.md` Visual/Audio Requirements and UI Requirements now name the pyrrhic-win Debrief banner (Interface Rule 18) as the one exception to "campaign banners live on this screen"; World Network keeps precedence and posts the failed banner on return. Last Updated bumped; not a new `/design-review`.
- **W-04 fixed.** Headers aligned to the 2026-10-07 review logs: `interface.md` and `persistence-and-validation.md` Status → Approved; `economy-and-contracts.md` Last Updated and review line no longer read NEEDS REVISION. Interface and Economy headers now state that edits after the reviewed content hash (`4dc00cd`, `bd1ca27`) are not yet re-scored. `systems-index.md` Last Updated rewritten; Progress Tracker approved count 3 → 8.
- **W-03 fixed (clears S-02).** `interface.md` surfaces table splits the old row: the §19 #10 research-program completion line is placed on the World Network Feed (trigger: 21st project researched; copy `/ux-design`; emitting event unnamed). The per-project completion beat (`research.md` obligation 2) stays OQ10, now worded so it cannot absorb the program line.
- **W-02 fixed (user decision: all four).** `docs/game-design.md` §17 now carries Balance availability and the `win_rate` no-data marker; §12 carries the arming window for Abort, New Operation, and telemetry Clear; §10 carries the quiet + pyrrhic both-banners order. Interface Rules 12 and 18 and Persistence Rule 17 / OQ2 now cite the living spec. Interface flagged-list line on disabled-state Balance access removed (stale since OQ9 closed).
- **S-01 fixed (user decision: hide Replay).** Living spec §10: on any failed campaign the debrief offers no Replay; World Network return is the only exit. Interface Rule 18, new edge case, and AC30; World Network failed-campaign edge case.
- **Implementation drift (not GDD work):** `src/ui/index.tsx:1676` offers REPLAY MISSION with no `campaignFailed` guard; Balance entry points in `src/ui/Settings.tsx:343` and `src/ui/index.tsx:1684` are unconditional; Balance has no no-data marker at 0/0. Needs stories.
- **D-01 recorded, not resolved.** `world-network.md` Open Questions: arrival playtest evidence, owned by Core Rule 13, unclassified. `tactical-mission.md` Open Question 10: Glass Veil collateral not encountered, not reproduced, unclassified. Both cite the vertical-slice REPORT and PIVOT-NOTE and forbid resolving before the owner classifies.
- **Open:** no GDD-level warning remains unrecorded. Code drift above still needs stories; Interface and Economy post-approval edits still need a re-score.
