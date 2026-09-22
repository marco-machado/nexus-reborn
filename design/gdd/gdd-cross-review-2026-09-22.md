# Cross-GDD Review Report

Date: 2026-09-22
GDDs Reviewed: 8
Systems Covered: World Network, Economy and contracts, Research, Roster and Assembly, Persistence and validation, Tactical mission, Interface, Audio

Also loaded: `design/gdd/game-concept.md`, `design/gdd/game-pillars.md`, `design/gdd/systems-index.md`, `design/registry/entities.yaml` (last_updated 2026-09-22, populated — used as conflict baseline), prior report `design/gdd/gdd-cross-review-2026-09-16.md` (checked for recurrence).

Focus: full (consistency + design theory + cross-system scenarios). Living spec `docs/game-design.md` remains source of truth; template GDDs are D2 aliases. Engine pin (context only): React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 (r185); TypeScript 5.8.3; Zustand 5.0.14.

---

## Consistency Issues

### Blocking (must resolve before architecture begins)

None.

### Warnings (should resolve, but won't block)

#### C-01 — Roster status token conflict (GDD header vs systems-index)

`roster-and-assembly.md` header: "**Status**: In Review (2026-09-22 scoring pass: NEEDS REVISION; blockers patched; re-review pending)". `systems-index.md`: "Last Updated: 2026-09-22 (Roster and Assembly approved by `/design-review` pass 2; all eight systems now Approved)", Next Steps claims a scored pass 2 APPROVED 2026-09-22, Progress Tracker counts 8 approved.

Two live statuses for the same system. Either the header was not updated after a patched re-review, or the index stamped Approved on a NEEDS REVISION result. This review does not pick which record is correct; reconcile against the actual 2026-09-22 review log (`design/gdd/reviews/`). Recurrence of 2026-09-16 W-2c-01 (the other four instances are resolved).

#### C-02 — Persistence ↔ Audio: mutual "Hard, upstream" Direction tokens

`persistence-and-validation.md` Dependencies: "Hard, upstream | Audio | Settings-slot mixer values". `audio.md` Dependencies: "Hard, upstream | Persistence and validation | Settings slot". Each claims to receive from the other; neither lists the other as downstream — the literal tokens describe a two-node mutual-upstream cycle. The store-vs-mix prose on both sides and `systems-index.md` (Circular Dependencies; Depends On columns now list both edges) agree. Recurrence of 2026-09-16 W-2a-03 (its index-omission half is fixed; the token half persists). Fix: one directional convention or an explicit cycle marker, mirrored in both tables.

#### C-03 — Interface still lists `progress` as Research data that Research forbids outputting

`interface.md` Interactions: "**Research** | In: States, occupancy, progress, home bay"; Dependencies: "Hard, upstream | Research | Program chrome | States, occupancy, progress, home bay". `research.md`: "`progress` is not a Research output. A 0–1 fraction is banned as Research-owned data or API" and explicitly names the two Interface rows as unsatisfied drift. Stale reference: any UI story built from `interface.md` alone will expect a field Research must never expose. Fix: strike `progress` from both Interface rows, or have living spec author a progress output first. New since the research.md second-pass rewrite.

#### C-04 — tax_yield output sign unproven upstream while Economy types tax_deposits ≥ 0

`world-network.md`: "Do not claim `tax_yield ≥ 0` until §5 names a Control floor." `economy-and-contracts.md` new_balance: tax_deposits "≥ 0"; AC: "GIVEN World Network emits Tax amount **A ≤ 0**, WHEN Economy deposits, THEN Credits are unchanged." Downstream ledger is defensively safe; the sign invariant is unestablished because §5 names no Control floor (code clamps 4–96, unpromoted). Recurrence of 2026-09-16 W-2e-01, now acknowledged on both sides. Resolve at living-spec §5: name a Control floor, or have World Network clamp the emit at 0 and say so.

#### C-05 — Unclamped research folds vs hit_chance "valid shot requires r > 0"

`research.md` squadWeapon: "**Output Range:** Not clamped. … Tactical `hit_chance` still requires r > 0; a folded range ≤ 0 is not a valid shot. Do not invent a floor here." `tactical-mission.md`: "A valid shot has `0 ≤ d ≤ r` (`r` > 0)." No GDD defines field behaviour for a weapon folded to r ≤ 0 (cannot fire / base fallback / blocks Attack). Recurrence of 2026-09-16 W-2e-03, now cross-referenced by Research. Present at living-spec §7/§10: name a floor, define Tactical r ≤ 0 behaviour, or record the authored table as making r ≤ 0 unreachable.

### Info

#### C-06 — Roster pin wording predates §7 equal-`endT` pin fiction

Roster Core Rule 13 / States table say "pinned older completed" without §7's clause that an equal-`endT` house-order non-issue "counts as an older completed project". research.md asserts no Roster edit is needed; the ambiguity is real for anyone implementing from Roster alone. Low-cost clarifying alias line.

#### C-07 — 2.5 s result→Debrief delay: clock basis defined only in Interface

`tactical-mission.md` Core Rule 15 states the delay with no clock basis and carries no Tuning Knobs row; `interface.md` Rule 18 defines the basis (2.5 s of Tactical elapsed time, pause-stopped, catch-up may cross boundaries) and points the knob at Tactical. An implementer reading Tactical alone could ship a wall-clock timer. Add the row to Tactical's Tuning Knobs.

#### C-08 — injuryRecoverySec D-range vs authored ETAs

D ∈ [43200, 172800] s (12–48 h) vs authored win ETAs 48/96/72 h: min authored ETA equals max D, so every authored win erases every injury — the injury clock bites on losses only. No contradiction; self-parked as Roster OQ8.

**Resolved since 2026-09-16:** W-2a-01/02/04 dependency-hardness asymmetries (Interface/Tactical/Audio edges now consistent; Tactical↔Persistence correctly upstream/downstream); residual W-2c-01 instances on the other four GDDs; Economy Closed Q3; index `/setup-engine` stale line. Registry values all match source GDDs and living spec §5–§9/§22. 2f acceptance-criteria cross-check found no pair of ACs that cannot simultaneously pass. 2d tuning-knob double-claims from the prior report are owner-annotated and resolved.

---

## Game Design Issues

### Blocking

None.

### Warnings

#### D-01 (3c) — Solo 1-operative deploy is a dominant no-trade-off strategy

Authored chance ignores squad size, item pools are squad-shared (a solo body is ~4× richer per head), a solo squad is always light tier (+0.15 m/s) and cannot reach the 400 kg gate; no owned rule makes 3–4 bodies correct (Roster OQ7); 1-Ready deploy is explicitly legal. Optimal play can skip roster, hire, injury and wear systems; failure has little bite (loss spends no ETA; unwon authored work pays in full on retry). Owner: living-spec §8 / Tactical squad-size coupling — do not resolve in D2 aliases.

#### D-02 (3c) — Scout-and-abort strictly dominates taking a loss

Abort has no roster consequence, returns the squad at full HP, the contract stays retryable, and no ETA is spent (Roster OQ6). Loss states and their KIA/injury consequences are nearly unreachable through rational play. Correctly parked as the living-spec §8 abort-cost decision.

#### D-03 (3d) — Credits have no sink after the program completes and the roster sits at cap

Sources run forever (generated market, tax deposits); sinks are exactly research authorization (779,000 CR total) and hiring (16,000–34,000 CR, refused at cap 8, which the campaign opens at). game-concept holism records: "After the program is complete and roster cap 8, Credits have no sink." Living-spec decision: author a post-campaign sink or record end-game Credits as intentionally inert.

#### D-04 (3d) — Positive feedback loop: winning lowers future difficulty and raises income

Win → Control up / Unrest down → garrison bands improve → Threat drops → risk_index falls → unrest extras (+6 civilians/+1 patrol above 20) switch off → collateral exposure drops → tax rises → more research → easier next win. Strain floor 0.25 does not bind inside the unrest clamp 2–96; no upward counter-pressure on CorpSec is permitted by rule (Control cannot add CorpSec HP). Name the intended counterweight at living-spec §5/§10 (dirty-win net Unrest integers, event cadence, or unrest pressure scaling).

#### D-05 (3e) — Difficulty and power curves point in opposite directions

Squad power rises monotonically and uncapped (research folds +12%/+15% damage, +HP, +speed, magazine; Experience uncapped at +2 HP / +0.05 m/s per survivor per win incl. quiet replays) while every difficulty input is player-favorited by winning; CorpSec multipliers are fixed (0.45/0.495 accuracy; 0.7× damage; 1.75× cooldown). No authored convergence point. Author an opposition-scaling lever at living-spec §10/§16 or explicitly own the power-fantasy curve.

#### D-06 (3a) — Two completion arcs of very different length compete

Campaign-complete fires after 3 authored wins; the research program's own fundability predicate implies ~15+ total wins (AC: gap 447,550 CR ≈ 15 minimum-reward generated wins at 30,500). After the banner, the remaining ~12-win grind has no named payoff, and its historic sink evaporates on completion (see D-03). Decide the program's narrative position and author a program-complete beat (Research UI Requirements already flags completion surfacing as an unsatisfied obligation).

#### D-07 (3b) — Mission context exceeds a 4-system attention budget (7 concurrent)

Verbs/stances, kit actives, items/grenades, objectives/timers/VIP, live weather front, opposition AI/Alert, live collateral counting. game-concept explicitly accepts: "Mission attention peak … is accepted; strategy is frozen in the field." Mitigations are chrome-level, not load-reducing. Keep the posture; verify against living-spec §20 playtest thresholds when they exist.

### Info

- **D-08 (3d)** Intel is a sink-less access resource: monotone accumulation, no spend-down after gates (authored gates at intel 2; generated at 1/2/3; forecast at 2+).
- **D-09 (3e)** Injury attrition disengages on wins: all authored ETAs ≥ max D (Roster OQ8). Decide the ETA floor together with the abort-cost decision (OQ6) — one attrition problem.
- **D-10 (3c)** Quiet replay is a near-risk-free XP farm with uncapped returns (+1 XP per survivor per replay, no diminishing return; drift ≈ +2 kg/win toward the 400 kg gate — Roster OQ9).
- **D-11 (3d)** Hire sink is structurally unreachable at campaign start: roster opens at cap 8; candidate market accrues to 3 unusable offers.
- **D-12 (3d)** Perverse mass-gate feedback: max-HP research + filled med-kit slots = 406.1 kg — over the 400 kg gate; only the cell build survives full investment. Name the gate as the intended power tax or decouple plating mass from research HP.
- **D-13 (3d)** Influence economy is sink-heavy early (opening 0) and starves late (dirty wins award 0; quiet replays pay 0). Decide whether Influence intentionally retires post-campaign.
- **D-14 (3e)** Chance readout late-game behaviour is unnamed: clamp 35–95 is code-owned; completed research pushes Chance toward the cap (Tactical OQ6).
- **D-15 (3f)** Pillar coverage is complete — all 8 systems map to pillars; none orphaned. One anti-pillar adjacency: Roster Item slots and bay pins sit next to "NOT an equipment locker"; the GDD's defense (house-issue, shared pools, dossiers as paperwork) holds — add a §20 playtest observation, no document change.
- **D-16 (3g)** Player Fantasy is coherent across all eight systems (one remote Operations Director identity). Single tension: mission micro-input surface (Q/E/R/G/V, stances) vs the "NOT click-every-shot RTS" anti-pillar — unmeasured until §20 thresholds exist.

---

## Cross-System Scenario Issues

Scenarios walked: 5 — Win debrief cascade (payout + sector write-back + roster + ETA catch-up + first durable write) · Loss with civilian casualties · Quiet replay of a won authored contract · Squad death mid-mission and quit-to-desktop · Abort via the 3-second two-step confirm.

### Blockers

#### S-01 — Same-step squad wipe vs required-complete has no tiebreak (Tactical OQ5)

**Scenario:** Squad death mid-mission. **Systems:** Tactical mission, Economy, World Network, Roster. **Failure mode:** undefined behavior. No living operatives remain and the last required objective completes in the same simulation step; the `won` branch of the entire debrief cascade (net_payout vs 0, Control/Unrest shove direction, ownership flip, Experience, campaign-complete/failed flags) is undefined. `tactical-mission.md` itself blocks stories on this step until living spec §10 names the winner. Resolve at living-spec §10 (e.g. required-complete wins) before any epic touches outcome resolution.

### Warnings

- **S-02** Reload-on-Debrief (or a swallowed next-Screen write) erases KIA, losses, and payouts while telemetry keeps the row — the apply-once cut is exploitable (Persistence Rule 10; OQ7 accepts the telemetry/campaign mismatch). **Reward conflict.**
- **S-03** Quiet replay is an unpriced compounding farm: free uncapped XP, free Tax via ETA catch-up, and self-erasing injuries — no GDD prices the loop as a whole. **Feedback loop.**
- **S-04** Abort is costless in every ledger and erases in-mission collateral even after heavy civilian harm — pillar 3 suspended for aborted missions (Roster OQ6 names the dominance; no counterweight exists). **Reward conflict.**
- **S-05** A Loss permanently deletes a generated contract (Failed → leaves the market) while Abort returns it intact — honest Loss is strictly dominated. **Compounding interaction.**
- **S-06** Dirty loss feeds Unrest past 20 → +6 civilians/+1 patrol next mission on that sector — harder board and more invoice exposure (N × 5,000 CR) exactly when weakest; dirty-win/loss net Unrest integers unnamed in §5. **Compounding difficulty spike.**
- **S-07** Win-erases-wounds prints "INJURED — recovery 30 h" and Ready in the same debrief (Roster ACs 60/73 print original D after sync(t1) restored Ready) — the injury line always lies on wins. **Contradictory messaging** (deliberate per OQ8; print remaining downtime alongside original D, or suppress the line).
- **S-08** A win can hand the city to Nexus at t0 while an ETA-jump seizure reverts it before first sight; evidence drowns in a Feed that a 2–4 day jump can flood (event interval 15–45 min ⇒ potentially 64–192 events), against the GDD's own "unreadable Feed" warning. **Contradictory messaging** — surface a post-catch-up delta summary or pin mission-result/catch-up events.
- **S-09** Quit-to-desktop mid-mission is an unlogged, unconfirmed free reset that strictly dominates even Abort (no DTO, no telemetry, no confirm; ADR-0002 memory-only). No GDD covers quit-during-mission as a player verb. **Reward conflict** — fold into the abort-counterweight decision (OQ6).

### Info

- **S-10** Cross-owner ordering at t1 is specified only pairwise; no canonical intra-debrief order (Roster AC78 leaves even its own two t1 dues unordered). Harmless today (deploy-time sampling; order-independent Tax sums) but blocks deterministic replay checks. Stamp a canonical order (e.g. Roster t0 → WN t0 → Economy → ETA {WN dues, Research sync, Roster sync}).
- **S-11** Candidate-market refresh under a multi-day ETA jump is unnamed (one offer vs one per 24 h interval) — fires on the very first win. Close Roster OQ5 with the ADR-0001 catch-up protocol.
- **S-12** Loss invoice prints a priced Collateral row (e.g. 10,000 CR) that is never charged, and the retry re-prices from zero — deliberate per Economy Closed Q3, but the copy never says "priced-not-charged".

**Recurring root causes:** the memory-only/apply-once cut is exploitable at three points (S-02, S-03, S-09); abort/reload/quit escape every ledger (Credits, Influence, Intel, Unrest, telemetry) that pillar 3 relies on.

---

## GDDs Flagged for Revision

| GDD | Reason | Type | Priority |
|-----|--------|------|----------|
| tactical-mission.md | Undefined win/loss tiebreak parked as OQ5 (owner: living spec §10); result-delay knob row missing from its Tuning Knobs (C-07) | Scenario/Consistency | Blocking |
| roster-and-assembly.md | Status header (NEEDS REVISION, re-review pending) conflicts with systems-index Approved (C-01) | Consistency | Warning |
| interface.md | Stale `progress` rows vs Research output ban (C-03) | Consistency | Warning |
| persistence-and-validation.md | Mutual "Hard, upstream" Direction token with Audio (C-02) | Consistency | Warning |
| audio.md | Mutual "Hard, upstream" Direction token with Persistence (C-02) | Consistency | Warning |

---

## Verdict: FAIL

One or more blocking issues must be resolved before re-running this review.

### Required actions before re-running

1. **`docs/game-design.md` §10** — author the same-step squad-wipe vs required-complete tiebreak (Tactical OQ5). Resolves S-01. No D2 alias edit can fix this.
2. **`design/gdd/interface.md`** — strike `progress` from the Research Interactions row and the Research Dependencies row (C-03).
3. **`design/gdd/roster-and-assembly.md` header vs `design/gdd/systems-index.md`** — reconcile the Roster status token against the actual 2026-09-22 review log (C-01).
4. **`design/gdd/persistence-and-validation.md` + `design/gdd/audio.md`** — fix the mutual Hard-upstream Direction tokens on the settings-slot edge (C-02).
5. *(Recommended, non-blocking)* **`design/gdd/tactical-mission.md`** — add the 2.5 s Tactical-elapsed result-delay row to its Tuning Knobs (C-07).

Systems-index rows were reviewed for flagging but left unchanged at the user's direction (2026-09-22).

---

## Resolution — 2026-09-22 (same day)

All five required actions were applied; verified by lint, `npm run test` (591 passed), and `npm run build`:

1. **S-01 resolved** — living spec §10 now authors the "Same-step tiebreak": required completion wins, deaths still grade KIA at debrief; VIP death or time-limit expiry in the same step is a Loss. `tactical-mission.md` aliases it (edge case + Open Question 5 closed). The sim was aligned: `checkEnd()` in `src/game/world.ts` previously resolved the collision wipe-first; it now checks required-complete first, which only changes the same-step collision case.
2. **C-03 resolved** — `interface.md` Research rows no longer list `progress`; the three corresponding "unsatisfied" notes in `research.md` are marked resolved.
3. **C-01 resolved** — `roster-and-assembly.md` header updated to Approved, matching the 2026-09-22 APPROVED scoring re-review in `reviews/roster-and-assembly-review-log.md` (the header was the stale side).
4. **C-02 resolved** — Persistence ↔ Audio settings-slot edge is now `Hard, cycle` on both sides, referencing systems-index Circular Dependencies; table prose updated to match.
5. **C-07 resolved** — `tactical-mission.md` Tuning Knobs carries the "Result delay 2.5 s of Tactical elapsed time" row.

With the blocker resolved, the standing verdict is **CONCERNS**: the remaining warnings (dominant strategies, end-game sinks, difficulty-curve divergence — D-01…D-07, S-02…S-09) are non-blocking design tensions parked at named living-spec Open Questions and do not gate development.

## Decision closures — 2026-09-22 (user-decided)

The remaining CONCERNS were design decisions, not defects. The user decided them; living spec §19 items 8–11 now record them, and the dependent Open Questions are closed:

- **§19 #9 Squad size is a player choice** — contracts do not scale with squad size; solo deployment is legal Command play. Closes Roster OQ7 (D-01).
- **§19 #8 Attrition and the unsaved mission** — abort, quit, and reload all escape every ledger; accepted consequence of the unsaved-mission cut (pricing abort is theater while reload is free). Win-erases-wounds stands; Experience stays uncapped with the 400 kg gate as its brake. Closes Roster OQ6/OQ8/OQ9 (D-02, D-09, D-10, S-02, S-03, S-04, S-09).
- **§19 #10 No win state** — endless sandbox; milestones only (authored-three campaign mark; research-completion Feed line, still an owed Interface obligation). Post-cap Credits and Intel intentionally inert. Closes D-03, D-06, D-08, D-11, D-13.
- **§19 #11 Difficulty arc** — the house becoming unstoppable is the authored fantasy; no counterweight. Closes D-04, D-05.

Remaining genuinely-open items after these closures: Roster OQ1–OQ5 (hire-on-failed, backfill, item-slot persistence, hire curve, multi-interval candidate refresh), Tactical OQ3/OQ6 (Attack vs Device remainder, Chance formula naming), and the research-completion Feed line as a small dev task.
