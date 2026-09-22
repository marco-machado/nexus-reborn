# Cross-GDD Review Report (v2 — post-resolution verification pass)

Date: 2026-09-22
GDDs Reviewed: 8
Systems Covered: World Network, Economy and contracts, Research, Roster and Assembly, Persistence and validation, Tactical mission, Interface, Audio

Also loaded: `design/gdd/game-concept.md`, `design/gdd/game-pillars.md`, `design/gdd/systems-index.md`, `design/registry/entities.yaml` (populated, used as conflict baseline), prior report `design/gdd/gdd-cross-review-2026-09-22.md` (this morning's FAIL + same-day resolution + decision closures).

Focus: full (consistency + design theory + cross-system scenarios). This run is the verification pass over the morning's five required actions and four decision closures. Living spec `docs/game-design.md` remains source of truth; GDDs are D2 aliases. Engine pin (context only): React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 (r185); TypeScript 5.8.3; Zustand 5.0.14.

---

## Verdict: PASS

All five morning required actions verified in current text. The one new blocker found this run (N4, pyrrhic win) was decided by the user and resolved in-run (living spec §10 + four GDD aliases). All warning-level stale text fixed in-run. No dependency asymmetries; 2d/2e/2f all-clear. Remaining open items are named Open Questions and owed obligations, none blocking.

---

## Consistency Issues

### Resolution verification (morning required actions — all VERIFIED)

1. **S-01/C (same-step tiebreak) — VERIFIED.** `tactical-mission.md` Edge Cases aliases it verbatim ("the required completion wins — a Win… deaths still grade KIA… required VIP death or time-limit expiry in the same step is a Loss. (Open Question 5 resolved 2026-09-22.)") and Open Question 5 is closed. Living spec §10 line 717 carries the source. Sim alignment verified: `checkEnd()` in `src/game/world.ts` evaluates required-complete before wipe, with a comment citing §10.
2. **C-03 (Interface `progress` rows) — VERIFIED.** Neither Interface Research row mentions `progress`; `research.md` marks all three notes resolved.
3. **C-01 (Roster status token) — VERIFIED.** Header reads "Approved (2026-09-22 scoring re-review: APPROVED…)", consistent with systems-index and the review log.
4. **C-02 (Persistence ↔ Audio direction tokens) — VERIFIED.** Both sides now "Hard, cycle", referencing systems-index Circular Dependencies.
5. **C-07 (result-delay knob row) — VERIFIED.** Tactical Tuning Knobs carries "Result delay 2.5 s of Tactical elapsed time"; Interface says "Not an Interface knob" — no double ownership.

Also confirmed touched-and-harmonized: C-04 (tax_yield sign — GDD-level harmonized on both sides; Control floor remains a living-spec §5 follow-up) and C-05 (research folds vs `r > 0` — resolved as a defined boundary).

### Blocking

**N4 — Pyrrhic win: same-step tiebreak Win on an incomplete campaign had no authored presentation.** FOUND AND RESOLVED THIS RUN.

The resolved S-01 tiebreak newly makes a total-squad-wipe Win legal. On an **incomplete** campaign that Win cascades into campaign-failed in the same apply: Roster Rule 14 fires from the same `deadIds` that grade KIA, while Economy pays the full net payout, World Network awards Influence/Intel and spends ETA, and the CAMPAIGN FAILED banner lands on a winning invoice. Every rule was individually defined and the sim is consistent; what no document authored was the combined player-facing beat (banner precedence, invoice copy, recovery pointer). Per the Phase 4c rubric (contradictory player messaging → BLOCKER).

**Decision (user, 2026-09-22): Author the pyrrhic-win beat.** Applied this run:

- `docs/game-design.md` §10: new "**Pyrrhic win.**" paragraph — the mission reads a Win for every rule (full payout, Intel, Influence, ETA, ownership shove, KIA); CAMPAIGN FAILED banner takes precedence; invoice prints `PYRRHIC — SQUAD LOST // CAMPAIGN FAILED`; hire-after-failed stays Roster OQ1.
- Aliased in `tactical-mission.md` (wipe edge case), `world-network.md` (Core Rule 12, failed edge case, new AC), `economy-and-contracts.md` (Core Rule 7), `roster-and-assembly.md` (Core Rule 14).

### Warnings (found and fixed this run)

- **C-08** `research.md` Open Question "Research-screen chrome" still claimed `interface.md` "still lists" `progress`, contradicting the file's own three Resolved notes. **Fixed** (bullet now points at the resolution).
- **C-09** `roster-and-assembly.md` States table and Abort edge case still labeled the roster abort consequence "unresolved, see Open Question 6" although OQ6 is Closed at living spec §19 #8. **Fixed** (both now cite §19 #8, closed 2026-09-22).
- **C-10** Roster stale pointers: "Research header … In Review (unscored)" footnote and bare "(Open Question 8)" mentions. **Fixed** (Research noted Approved; OQ8 pointers marked closed).
- **C-11** Registry `staged_gain` note cited the defunct "Audio Open Question 1". **Fixed**; registry parses clean.

### Info

- **N5** `economy-and-contracts.md` does not alias post-cap Credits inertness (§19 #10) — its Player Fantasy and Core Rule 3 describe only the ongoing market. Not a contradiction; an implementer reading Economy alone would not know post-cap Credits are intentionally score. Suggested one-line alias as follow-up.
- **S-05 status change** — "Loss deletes a generated contract; Abort returns it" is now covered by §19 #8's acceptance framing; recommend the next living-spec pass records it explicitly under #8 so it is not re-raised.
- 2a dependency bidirectionality: no asymmetries. 2d tuning-knob ownership: all-clear. 2e formula compatibility: all-clear (mass_tier boundaries, injuryRecoverySec bounds, reward/collateral minimums, win_rate verified). 2f acceptance criteria: no unsatisfiable pair.

---

## Game Design Issues

### Blocking

None.

### Warnings

None new. All 3a–3g checks pass post-decision:

- **3a Progression loops:** one dominant loop (contract → win → payout/Intel/Influence → research → power); the campaign mark and program-completion Feed line are milestones, not a second loop (§19 #10). PASS.
- **3b Attention budget:** strategy phase ~3 interactive systems + pausable timers; mission-phase peak of 7 is explicitly accepted in game-concept ("strategy is frozen in the field"). PASS.
- **3c Dominant strategies:** no new ones beyond the decided set; optional objectives are a fair trade; Hardened is a self-imposed setting. PASS.
- **3d Economic loops:** every flagged loop now has a recorded disposition (§19 #8–11); no infinite-source-without-a-recorded-disposition remains. One alias gap: N5 above.
- **3e Difficulty curves:** divergence is authored (§19 #11); no GDD text contradicts it. PASS.
- **3f Pillar alignment:** all 8 systems map to pillars with explicit serve/does-not-own sections; no anti-pillar violation. PASS.
- **3g Player fantasy:** one consistent Operations Director identity enforced verbatim across all eight GDDs. PASS.

---

## Cross-System Scenario Issues

Scenarios re-walked: 5 from the morning report plus 1 new scenario enabled by the S-01 tiebreak.

1. Win debrief cascade — all pairwise orders and the apply-once serial guard verified consistent.
2. Loss with civilian casualties — prices from stored Reward, no debit, no ETA; S-12 copy gap unchanged.
3. Quiet replay of a won authored contract — coherent post-§19 #8.
4. Squad death mid-mission → quit-to-desktop — accepted per §19 #8.
5. Abort via 3 s two-step confirm — coherent; landing still OQ8-parked (§19 #8).
6. **NEW: same-step wipe-Win on an incomplete campaign** — rule-consistent end to end; presentation was the only gap. **Resolved this run** by the pyrrhic-win authoring (see N4 above).

### Blockers

None remaining (N4 resolved in-run).

### Warnings

None remaining.

### Info

- S-05 explicitly-recorded-under-#8 recommendation (above).
- Open items unchanged and consistently recorded on both sides: Roster OQ1–OQ5, Tactical OQ3/OQ6, research-completion Feed line (owed Interface obligation), living-spec §5 Control floor (tax_yield sign), §10 dirty-win net Unrest integers.
- Note: the pyrrhic-win **presentation copy** (banner precedence + `PYRRHIC` invoice note) is now authored but not yet implemented in the HUD; that is a small dev task, not a document gap.

---

## GDDs Flagged for Revision

| GDD | Reason | Type | Priority |
|-----|--------|------|----------|
| (none) | All flagged items were fixed or resolved in-run | — | — |

---

## Verdict: PASS

No blocking issues. The morning's FAIL was resolved and verified; this run's one new blocker was decided and resolved in-run. Architecture work is not gated.

### Decisions recorded (user, 2026-09-22)

- **Pyrrhic win beat authored** (N4) — living spec §10; banner precedence + invoice note + OQ1 pointer; aliased in tactical-mission, world-network, economy-and-contracts, roster-and-assembly.
- **systems-index rows stay Approved** — stale-text cleanups applied directly instead of regressing the index; index untouched this run.

### Verified

All edits applied and verified by grep: pyrrhic-win text present in `docs/game-design.md` + 4 GDDs; C-08/C-09/C-10/C-11 stale text gone; `design/registry/entities.yaml` parses (YAML valid).
