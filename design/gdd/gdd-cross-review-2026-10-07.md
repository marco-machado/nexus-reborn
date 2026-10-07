# Cross-GDD Review Report

Date: 2026-10-07
GDDs Reviewed: 8 of 8 present
Not read: none
Systems Covered: World Network, Economy and contracts, Research, Roster and Assembly, Persistence and validation, Tactical mission, Interface, Audio

Also loaded: `design/gdd/game-concept.md`, `design/gdd/game-pillars.md`, `design/gdd/systems-index.md`, `design/registry/entities.yaml` (conflict baseline), prior report `design/gdd/gdd-cross-review-2026-09-22-v2.md` (PASS).

Focus: full. No GDD carries `## Summary`, so the review failed open and read all eight in full. Changed since the 09-22 reviews: Interface, Roster, Tactical, Audio (mostly the Ledger Amber reconciliation, `f999086`). Phases 2 and 3 ran inline in one context rather than as two sub-agents; both ran in full. Engine pin (context only): React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 (r185); TypeScript 5.8.3; Zustand 5.0.14.

---

## Consistency Issues

### Blocking

None.

### Warnings

**W-01 — Pyrrhic-win presentation is missing from the presenter, and its surface is undefined.**
`economy-and-contracts.md` Core Rule 7: "Interface prints the `PYRRHIC` note on the invoice". `world-network.md` AC: "WHEN the debrief is shown, THEN the CAMPAIGN FAILED banner takes precedence". `interface.md` and `design/ux/*.md` contain no pyrrhic text. World Network Visual/Audio Requirements and the Interface surfaces table put campaign banners on the **World Network** screen only; Debrief is not a Screen and has no banner row. Living spec §10 defines the beat ("posted first and visually dominant"), so this is not Blocking, but the 2026-09-22 resolution aliased it into four GDDs and missed the presenter. Fix: alias the beat in Interface Rule 18 and the Debrief surface row, and name which surface carries the banner on Debrief.

**W-02 — 44 broken ADR links.**
`economy-and-contracts.md` (13), `tactical-mission.md` (26), and `persistence-and-validation.md` (5) link `../architecture/adr-*.md`, which resolves to `design/architecture/` (does not exist). The other five GDDs correctly use `../../docs/architecture/`. Every referenced ADR exists in `docs/architecture/`. Mechanical replace.

**W-03 — Economy Interactions table reverses In/Out on two rows.**
Other rows read In = received by Economy. The **Tactical** row lists "Economy slice" under In and "Outcome DTO" under Out; the **Interface** row lists invoice rows under In and "Select contract" under Out. Swap the cells.

**W-04 — Owner of `reward` / `bonus` on the outcome DTO.**
Economy's Tactical interaction row: Tactical's outcome carries "won, bonus, stored Reward". `tactical-mission.md` Outcome DTO: Tactical emits completed optional **ids** and "does not emit priced `reward` or `bonus` Credits". Economy's own Outcome DTO paragraph sources `reward` from the frozen Economy slice, which agrees with Tactical. Reword Economy's row: completed optional ids in; Economy prices `bonus` and passes `reward` through from its slice.

**W-05 — Roster Deploy CTA is amber after the Ledger Amber reconciliation.**
`roster-and-assembly.md` Event feedback: "Deploy | Amber authorization CTA". `interface.md` Rule 4: "Ledger Amber = price and spend authorization only". Deploy spends nothing (accept is free); `design/ux/interaction-patterns.md` P-02 (spend authorization) does not list Deploy — only P-03 (disabled + reason) does. `f999086` edited this file and missed the row. Fix: Signal Cyan instruction CTA, or record why Deploy is an authorization.

**W-06 — Persistence AC settles a policy Interface holds open.**
Persistence AC: telemetry never enabled → "Balance is not offered". Interface Open Question 9 holds Balance entry while recording is off as unresolved and notes current entry points are unconditional ("do not silently change either policy"). Either the AC is binding and closes OQ9, or the AC should be marked pending OQ9.

**W-07 — Registry `abort_confirm_hold` is stale.**
Registry: "Two-step Abort confirm hold in seconds", `referenced_by: interface.md`. Interface now defines a **3 s arming window — an expiry, not a minimum hold** — shared by Abort, New Operation, and telemetry Clear (P-01). Rename/re-note the entry and add `persistence-and-validation.md` to `referenced_by`.

### Info

- Header drift: `f999086` edited Roster (header 2026-09-22), Tactical (2026-09-16), and Audio (2026-09-16) without bumping Last Updated; Interface did.
- Tactical Tuning Knobs say the result delay's "basis [is] defined in Interface Rule 18"; Interface Rule 18 says "Result timing is Tactical-owned". Same owner, circular pointer.
- Roster Open Question 1 (hire-on-failed) target reads "After Persistence extract"; Persistence was approved 2026-09-15.
- Tooling: `.claude/scripts/review-scope.sh` chose `gdd-cross-review-2026-09-22.md` as prior review instead of `…-09-22-v2.md` (`-` sorts before `.`). Same-day reruns should not use a `-v2` suffix.
- 2a dependency bidirectionality: no asymmetries across all edges, including Audio ↔ Persistence `Hard, cycle`.
- 2d tuning-knob ownership: all-clear.
- 2e formula compatibility: all-clear (mass tiers, `injuryRecoverySec`, reward floor/cap, research gap 447,550 CR vs 15 minimum-reward generated wins, `win_rate` denominator).
- 2f acceptance criteria: no unsatisfiable pair beyond W-06.

---

## Game Design Issues

### Blocking

None.

### Warnings

**D-01 — Research completion (the pillar-4 Hook beat) has no presenting artifact.**
`game-concept.md`: the program "posts a completion Feed line (owed Interface obligation)". `research.md` UI Requirements: "no artifact announces a completion today", and Research is "the Hook beat of the session arc". Neither `interface.md` nor `world-network.md` lists a research-completion Feed line or banner. The obligation lives only in Research and concept notes; the presenter GDD has nothing to implement.

### 3a–3g

- 3a Progression loops: one dominant loop. PASS.
- 3b Attention budget: mission peak of 7 accepted in game-concept. PASS.
- 3c Dominant strategies: scout-and-abort and solo deploy are accepted (§19 #8–9); nothing new. PASS.
- 3d Economic loops: every loop has a recorded disposition. PASS.
- 3e Difficulty curves: divergence authored (§19 #11). PASS.
- 3f Pillar alignment: all 8 map; Ledger Amber reconciliation strengthens pillar 5; W-05 is the only residue. PASS.
- 3g Player fantasy: one Operations Director identity. PASS.

---

## Cross-System Scenario Issues

Scenarios walked: 6

1. Win debrief cascade
2. Pyrrhic win
3. Quiet replay with Tax catch-up
4. Abort → landing
5. Campaign failed → player options
6. Reload on Debrief with telemetry on

### Blockers

None.

### Warnings

⚠️ **Pyrrhic win** — Tactical → Roster → World Network → Economy → Interface. Rules are consistent end to end (Win, full pay, campaign fails). The presentation step has no presenter row and a conflicting surface (W-01): an implementer will either show the banner only on World Network after a "winning" invoice, or invent a Debrief placement.

### Info

ℹ️ **Campaign failed** — Roster + World Network + Persistence + Interface. Contract select is a no-op; hire is undefined (Roster OQ1, open three weeks). Unless hire is legal, the only exit is New Operation. Accepted as an Open Question, but architecture will inherit an undefined hire control.

ℹ️ **Abort landing** — Persistence OQ8 and Interface OQ8 agree; current code lands on World Network.

ℹ️ **Win cascade, quiet replay, reload on Debrief** — consistent. Quiet-replay Tax is covered by Economy's `new_balance` identity and Interface AC24.

---

## GDDs Flagged for Revision

| GDD | Reason | Type | Priority |
|-----|--------|------|----------|
| interface.md | Pyrrhic beat + Debrief banner surface missing (W-01); research-completion surfacing absent (D-01) | Consistency / Design Theory | Warning |
| economy-and-contracts.md | Broken ADR links (W-02); reversed In/Out rows (W-03); outcome-field owner (W-04) | Consistency | Warning |
| tactical-mission.md | Broken ADR links (W-02) | Consistency | Warning |
| persistence-and-validation.md | Broken ADR links (W-02); Balance AC vs Interface OQ9 (W-06) | Consistency | Warning |
| roster-and-assembly.md | Deploy amber CTA (W-05); stale OQ1 target | Consistency | Warning |

---

## Verdict: CONCERNS

No blocking issues: every rule is defined in the living spec or an ADR. Seven consistency warnings and one design warning should be cleared before `/create-architecture` consumes these files. W-02, W-03, W-05, and W-07 are mechanical edits.

### Decisions recorded (user, 2026-10-07)

- Report written to this file.
- The five flagged GDDs are marked `Needs Revision` in `design/gdd/systems-index.md`.

### Fixes applied (2026-10-07, same session)

- **W-02 fixed.** 44 links in `economy-and-contracts.md`, `tactical-mission.md`, `persistence-and-validation.md` rewritten to `../../docs/architecture/`. No `](../architecture/` remains in `design/gdd/`; every linked ADR path exists.
- **W-03 fixed.** Economy Interactions: Tactical and Interface rows now read In = received by Economy.
- **W-05 fixed.** Roster Deploy event: Signal Cyan instruction CTA, not Ledger Amber.
- **W-07 fixed.** Registry `abort_confirm_hold` renamed `arming_window`; notes describe the shared P-01 expiry; Persistence added to `referenced_by`; `last_updated` 2026-10-07. YAML parses (js-yaml).
- **Open:** W-01, W-04, W-06, D-01. `tactical-mission.md`'s only flagged reason (W-02) is now cleared; its index row stays `Needs Revision` until the user restores it.
