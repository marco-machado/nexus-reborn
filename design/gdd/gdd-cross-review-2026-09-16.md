# Cross-GDD Review Report

Date: 2026-09-16
GDDs Reviewed: 8
Systems Covered: World Network, Economy and contracts, Research, Roster and Assembly, Persistence and validation, Tactical mission, Interface, Audio

Also loaded: `design/gdd/game-concept.md`, `design/gdd/game-pillars.md`, `design/gdd/systems-index.md`.

Focus: full (consistency + design theory + cross-system scenarios).

Living spec `docs/game-design.md` remains source of truth. Template GDDs are D2 aliases.

Entity registry (`design/registry/entities.yaml`, last_updated 2026-09-08): formulas and constants are populated; `entities: []` and `items: []`. Formula set is incomplete versus later GDD extracts (missing `tax_yield`, `collateral`, `net_payout`, `generated_reward`, `new_balance`, `endT`, `appliedNodeIds`, `currentIssue`, `squadWeapon`, `crewBonus`, `civilian_first_hits`, `guard_vision`, `grenade_damage`). Run `/consistency-check` after this review to refresh the registry.

Engine pin (context only): React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 (r185); TypeScript 5.8.3; Zustand 5.0.14. See `docs/technical-preferences.md` and `docs/engine-reference/web/VERSION.md`.

Pillars: Command, do not micromanage; Information is operational power; Violence has corporate consequences; The two layers feed each other; One corporate operating system. All five may veto; living spec does not rank a winner.

Anti-pillars: NOT a hero shooter / stealth sim / click-every-shot RTS; NOT character drama; NOT an equipment locker; NOT multiplayer or mobile; NOT mid-mission save and resume; NOT an external art pipeline; NOT spoken VO or a spatial audio model.

---

## Consistency Issues

### Blocking (must resolve before architecture begins)

None.

### Warnings (should resolve, but won't block)

#### W-2a-01 — Interface hardness mismatch (Hard vs Soft)

`interface.md` ## Dependencies lists World Network, Economy, Research, Roster, Tactical, and Persistence as **Hard** upstream. `world-network.md` matches (Hard, downstream | Interface). `economy-and-contracts.md`, `research.md`, `roster-and-assembly.md`, `tactical-mission.md`, and `persistence-and-validation.md` ## Dependencies each list Interface as **Soft**, downstream.

Reciprocals exist; hardness does not. One of these documents has a stale dependency hardness.

#### W-2a-02 — Audio vs Interface/Tactical hardness mismatch

`audio.md` ## Dependencies: Hard, upstream | Interface and Hard, upstream | Tactical. `interface.md` ## Dependencies: Soft, downstream | Audio. `tactical-mission.md` ## Dependencies: Soft, downstream | Audio.

Reciprocals exist; Hard vs Soft does not.

#### W-2a-03 — Persistence↔Audio circular Hard-upstream, omitted from index

`persistence-and-validation.md` ## Dependencies: Hard, upstream | Audio | Settings-slot mixer values. `audio.md` ## Dependencies: Hard, upstream | Persistence | Settings slot. Neither lists the other as downstream.

`systems-index.md` ## Systems Enumeration Depends On: Persistence ← World Network, Economy, Research, Roster (no Audio); Audio ← Interface, Tactical (no Persistence). ## Circular Dependencies names only World Network ↔ Economy ↔ Tactical.

Prose splits store vs mix correctness, but Direction tokens and the index cannot all be true together.

#### W-2a-04 — Tactical↔Persistence both Hard downstream

`tactical-mission.md` ## Dependencies: Hard, downstream | Persistence | Unsaved lifetime. `persistence-and-validation.md` ## Dependencies: Hard, downstream | Tactical | Unsaved lifetime. Each claims the other depends on it; neither lists the other as upstream.

`systems-index.md` lists neither Tactical←Persistence nor Persistence←Tactical. Data columns agree: mission is memory-only; Abort writes nothing.

#### W-2c-01 — System Status headers vs systems-index Approved

`systems-index.md` ## Systems Enumeration Status = Approved for all eight; ## Progress Tracker Design docs approved 8; ## Next Steps claims independent `/design-review` APPROVED 2026-09-14 Research, 2026-09-15 Roster, 2026-09-15 Persistence, 2026-09-16 Tactical, while still leaving unchecked “Run `/design-review` on each completed template GDD”.

Headers:

- `world-network.md` Status: In Review (live verdict unscored)
- `research.md` Status: In Review (live verdict unscored)
- `roster-and-assembly.md` Status: In Review (live verdict unscored)
- `persistence-and-validation.md` Status: Designed (pending independent `/design-review`)
- `tactical-mission.md` Status: In Review

Persistence header pending review and index APPROVED 2026-09-15 are two live statuses for the same system. This review does not pick which token is right.

#### W-2c-02 — Economy still calls Interface OQ1 stale

`economy-and-contracts.md` ## Closed Questions #3: “Interface GDD Open Question 1 is stale against this rule; do not fork a second show-rule here.”

`interface.md` ## Open Questions #1 is **Closed** — all five priced money rows are visible, including zeros — matching Economy invoice-zero ACs and Interface AC24.

The five-row rule agrees; the Closed Q3 pointer at an open/stale OQ1 does not.

#### W-2c-03 — systems-index Next Steps still says technical preferences unconfigured

`systems-index.md` ## Next Steps still has “Run `/setup-engine` — technical preferences still unconfigured” after `docs/technical-preferences.md` / `docs/engine-reference/web/VERSION.md` are the stated pin (React 19.2.8 + Vite 6.4.3 + r3f 9.6.1 / three.js r185). Stale tracker line, not a mechanic rename.

#### W-2d-01 — Two-step confirm knobs dual-listed

`persistence-and-validation.md` ## Tuning Knobs lists New Operation two-step (§4) and Telemetry Clear two-step (§17). `interface.md` ## Tuning Knobs lists the same two knobs with the same owners.

Dual-home (persist wipe vs chrome) is described in Interactions; both tables still claim the knob.

#### W-2d-02 — Quality and Difficulty settings knobs dual-listed

`persistence-and-validation.md` ## Tuning Knobs: Quality Auto/High/Medium/Low as a setting; Difficulty in settings slot survives New Operation. `interface.md` ## Tuning Knobs: Quality Auto/High/Medium/Low; Difficulty Standard/Hardened.

Same named settings listed in two Tuning Knobs tables.

#### W-2d-03 — 779,000 CR program/gap total listed in two knob tables

`economy-and-contracts.md` ## Tuning Knobs: “Research total 779,000 CR (gap statement)” owner §6 / Research. `research.md` ## Tuning Knobs: “Program total 779,000 CR” owner §7.

Same constant in two owner tables (Economy frames gap; Research frames program checksum).

#### W-2e-01 — tax_yield unnamed Control range vs Economy tax_deposits ≥ 0

CONCERN, not auto-wrong. `world-network.md` ## Formulas: `tax_yield = round(base × Control/100 × strain)`; Control range unnamed; “Do not claim `tax_yield ≥ 0` until §5 names a Control floor.” `economy-and-contracts.md` ## Formulas `new_balance`: `tax_deposits ≥ 0`; ## Acceptance Criteria: emit A ≤ 0 leaves Credits unchanged.

Downstream assumes non-negative deposits while upstream output sign is unproven.

#### W-2e-02 — civiliansHit/N output range vs Economy expected N

CONCERN, not auto-wrong. `tactical-mission.md` ## Formulas `civilian_first_hits`: N ≥ 0 unbounded; Loss still emits N. `economy-and-contracts.md` ## Formulas collateral: N range 0–deployment civilian count.

Upstream can exceed the downstream stated input range; pricing still `min(Reward, 5000 × N)`.

#### W-2e-03 — Unclamped Research weapon/crew folds vs Tactical assumed valid r

CONCERN, not auto-wrong. `research.md` ## Formulas `squadWeapon` and `crewBonus`: output not clamped (range/cooldown/damage/speed may fold without a floor). `tactical-mission.md` ## Formulas `hit_chance`: a valid shot has r > 0.

Unclamped folded range 0 would be outside the downstream shot model.

#### W-2e-04 — Registry mass ranges vs Roster no per-body/squad clamp

CONCERN / stale registry baseline. Registry `operative_mass` and `squad_mass` `output_range` [0, 400]. `roster-and-assembly.md` ## Formulas: no named clamp on per-body or squad sum; gate is separate `mass_gate_ok = squad_mass ≤ 400`. ## Acceptance Criteria AC52: `squad_mass = 400.1` kg is a legal mass that fails Deploy.

---

## Game Design Issues

### Blocking

None. No anti-pillar violation as written. Player fantasies agree the player is OPS_DIRECTOR and never walks the street.

### Warnings

#### 3a-01 — Two long-term completion marks can split what the game is about

`game-concept.md` Core Loop / Long-Term Progression names one session loop (World Network → brief → assembly → mission → invoice → reinvest) but two long-term marks: authored three = campaign complete, and the 21-node / 779,000 CR research program.

`systems-index.md` Categories labels Research as Progression while Economy is Economy and Tactical is Gameplay. `economy-and-contracts.md` Core Rules 13: campaign complete is winning Glass Veil / Hollow Crown / Rust Haven only — research is not a gate. `research.md` Overview: without the program Credits have nowhere to go that changes a later firefight.

A player can finish the campaign mark on opening kit plus intel from wins and treat the program as optional, or ignore the spine and farm generated work for the program.

Options (do not pick here): require some research for campaign complete; keep both marks but state a single primary loop in every Player Fantasy; or present generated/research as explicit post-spine support so they cannot be read as a second core.

#### 3b-01 — Typical mission moment exceeds the 4-channel attention budget

Simultaneously active during a typical field beat (`tactical-mission.md` Typical use / Core Rules 4–7, 12–17; `roster-and-assembly.md` kit; `economy-and-contracts.md` live collateral count via Interface HUD):

1. Five verbs plus Stop (active)
2. Cones / patrols / civilians (active)
3. Required objective sequence (active)
4. Alert (active)
5. Weather front timing (active)
6. Kit — Q actives, medkits, grenades (active)
7. Live collateral count (active)

Count: **7** (>4). `world-network.md` Core Rule 2: strategy is frozen in the field, so this is not simultaneous with the strategy desk. Strategy desk is a separate 6-channel peak (Focus/Pause/speed, Influence, contract, research, assembly/mass, clock). Does not by itself falsify Pillar 1 (auto-acquire remains), but it pressures Command toward kit/lane babysitting.

Options: make weather/Alert/collateral passive readouts with no mid-fight decision; fold kit into the five verbs; or accept overload as Hardened-only.

#### 3c-01 — 1-operative light-tier deploy is an allowed dominant path

`roster-and-assembly.md` Edge Cases: always deploying 1 Ready is legal; light-tier cheese is allowed. `mass_tier`: default four (Formulas example 286.1 kg) is already ≤340 and gets +0.15 m/s, so the light bonus is the opening default, not a tradeoff. One body also stays under 340 kg after plating more easily than four.

`tactical-mission.md` `hit_chance`: operatives 64% vs Standard CorpSec 28.8% at half range; CorpSec 70% damage and 1.75× cooldown. Combined with idle auto-acquire (Core Rule 4), a single light operative can be both safer on mass and enough firepower.

Pillar 1 explicitly allows 1–4, so this is not an anti-pillar hit; it can still make 2–4 and heavy kits irrelevant.

Options: keep 1-op as a legal command with a compensating cost (objectives, escort VIP, Defend waves); bind light/heavy so default four is standard; or accept cheese and document it as a known mastery path.

#### 3c-02 — Collateral cap zeros further Credits price for stray fire

`economy-and-contracts.md` Formulas: `collateral = min(Reward, 5000 × N)`; optional bonus sits outside the cap. After N ≥ Reward/5000, extra unique squad first-hits do not change net Credits (still ≥ 0; Loss still pays 0).

Pillar 3 prices squad civilian hits as invoice line items — beyond the cap those hits are counted (`tactical-mission.md` `civilian_first_hits`) but not additionally priced in CR. Clean-win Influence/Intel (+2 / +15) and unnamed dirty-win net Unrest (`world-network.md` Formulas) still trade off, so it is not fully risk-free power; Credits incentive to stay clean dies at the cap.

Options: leave unrest/Influence as the only post-cap price; stop counting N against the invoice once capped and say so; or do not cap CR. Do not treat CorpSec-caused hits as player collateral (all GDDs agree that veto).

#### 3c-03 — Quiet replay is a low-fee XP and clock farm

`economy-and-contracts.md` Core Rules 8–9: quiet authored replay pays 0 CR / 0 Inf / 0 Intel and no sector shove, but a win still spends ETA. `roster-and-assembly.md` Core Rule 10 / Edge Cases: survivors still get Experience, including quiet; KIA/injury still apply. `research.md` Core Rule 4: labs catch up on that win ETA.

After the authored three are won, quiet maps plus generated work are the remaining grind. Quiet is not risk-free (KIA permanent) but it is a resource monopoly on XP and strategic time versus first-time authored fees.

Options: stop XP on quiet; stop ETA on quiet (would stall labs — conflicts with current ADR-0001/0004 alias); or keep roster/ETA cost as the intended quiet price and say XP-on-quiet is the mastery loop.

#### 3c-04 — Generated market can outpay the authored spine

`economy-and-contracts.md` `generated_reward` stamps 30,500–95,000 CR; Severe often saturates 95,000. Authored clean-pass arithmetic cited there is 203,000 CR across three contracts. Opening Credits 128,450. Research program 779,000 CR. Generated always pays (no quiet); authored pays once then 0.

Optimal Credits path is generated High/Severe farming, with the spine used for intel gates and the campaign mark. Economy Tuning Knobs already names this as market-replaces-spine vs gap-unreachable — unresolved as a holism choice.

Options: lower generated ceiling; raise authored fees; gate generated until spine progress; or keep generated as the intended research faucet and do not also sell the spine as the economic point.

#### 3d-01 — Credits: source >> sink after the program and roster cap

Sources: opening 128,450; `net_payout`; Tax deposits (Nexus-held only). Sinks: research authorize (779,000 CR checksum) and hire 16,000–34,000 CR. `research.md` Edge Cases: all 21 researched → further authorize is a no-op, Credits unchanged. `roster-and-assembly.md`: hire refused at cap 8.

Generated market and Tax keep depositing. After program complete and a full roster there is no Credits sink — infinite surplus. During the gap the faucet is intentional.

Options: add a post-program sink; stop generated payouts after program complete; or accept late Credits as flavor and stop putting them on the fantasy-critical invoice.

#### 3d-02 — Experience: unbounded positive feedback with no named cap

`roster-and-assembly.md` Core Rule 10 / Formulas: +1 Experience per survivor per debrief (quiet and Loss included; Abort none). Magnitudes +2 max HP and +0.05 m/s per point, sampled next deploy, enter H and speed. No cap is named.

More XP → easier survival → more XP. Plating mass (0.25 kg per HP above 90) is a weak counter and can be dodged with 1-op light cheese. `research.md` `crewBonus` is also unclamped and stacks with XP. `tactical-mission.md`: Control does not add CorpSec HP, so enemy toughness does not absorb this curve.

Options: cap Experience; diminishing returns; stop XP on quiet/Loss; or scale opposition with XP/research. Do not invent a cap in one GDD without the others.

#### 3d-03 — Intel: source with no spend sink after gates

`world-network.md` Core Rule 7 / Formulas: intel is an access resource (level + progress), not a spend currency. Awards +40 / +15 clean on non-quiet win; each 100 progress → level++. No maximum level is named.

Gates: Hollow Crown / Rust Haven at 2; generated moderate 1 / high 2 / severe 3; Event forecast at 2+. After those thresholds, further intel has no sink. Economy Core Rule 2: Intel is not Economy and does not convert from Credits.

Options: cap intel at 3; spend intel on foresight; or leave overflow as a dead readout and stop awarding past the last gate.

#### 3d-04 — Control win snowball: more Tax and easier Threat

`world-network.md` Core Rules 5–9 / Formulas: non-quiet win raises Control and lowers Unrest (magnitudes not copied; dirty-win net Unrest unnamed). Tax pays only if Nexus-held. Garrison bands derive from Control. `economy-and-contracts.md` Core Rule 11: Threat from garrison (Secure→Moderate / Strained→High / Critical→Severe). `tactical-mission.md`: Threat sets elite mix and `risk_index` h ∈ {1.0, 1.1, 1.2}; Control does not add CorpSec HP.

Winning therefore increases Tax and tends to lower generated Threat — unbounded positive feedback on the strategy layer, with Stabilize (Influence 8) as a further Control faucet. Catch-up for a losing board is weaker: Loss spends no ETA and lowers Control.

Options: name shove integers so net dirty-win Unrest can oppose the snowball; let Control add opposition; invert Threat vs Secure; or keep snowball and treat Influence spends as the only brake. Unnamed dirty-win Unrest blocks closing this loop.

#### 3d-05 — Loss stall: no ETA catch-up while KIA is permanent

`world-network.md` Core Rule 3 / Edge Cases: Loss spends no ETA; labs, injury, Tax, and candidates do not catch up on that debrief. `research.md`: a loss leaves active projects running but t unchanged. `roster-and-assembly.md`: KIA is permanent; injury recovery needs t; empty incomplete roster fails the campaign; hire-on-failed is an Open Question. Economy: Loss pays 0 CR, no debt.

A struggling director falls behind on research and Ready bodies while a winning director’s ETA finishes labs and injuries — no catch-up. Campaign fail may be unrecoverable depending on the hire-on-failed option.

Options: grant partial ETA or lab tick on Loss; guarantee hire after fail; or keep fail/KIA as the intended hard end and say so in fantasy text. Do not resolve hire-on-failed here.

#### 3e-01 — Player power scales; opposition does not scale with it

What scales up for the player: `research.md` `squadWeapon`/`crewBonus` (unclamped muls/adds, 21 nodes); `roster-and-assembly.md` Experience linear HP/speed; `mass_tier` speed.

What scales opposition: `tactical-mission.md` Hardened discrete extras (player setting, not campaign time); unrest>20 extras (+6 civ, +1 patrol); Threat mix/h. Control does not add CorpSec HP. CorpSec stays 70% damage / 1.75× cooldown / ~half operative accuracy. `missionChance` includes completed research; `risk_index` does not.

Authored three are stepped tactical problems (intel 2 gate), not a numeric curve. Result: Standard generated work gets easier as research/XP/Control rise; Hardened is the only optional global bump and still does not hide information (Pillar 2). Loss stall (3d-05) is the opposite mismatch for players who fall behind.

Options: scale garrison HP/accuracy with research count or Control; stop XP/research from stacking without a ceiling; or keep late trivialization and make Hardened the intended post-spine curve. Do not retune `DIFFICULTY_FX` in one GDD only.

#### 3f-01 — Per-body Experience and bay wear tension with not-a-hero / not-a-locker

Anti-pillars (`game-pillars.md`): not a hero shooter, not character drama, not an equipment locker, not account level. `research.md` Player Fantasy: you do not kit a hero; not a locker. `roster-and-assembly.md` Player Fantasy: wear is house issue; dossiers are paperwork. Those texts align.

Tension: Experience is persistent per named body (+HP/+speed), and Assembly still pins four bays plus two Item slots per operative. That is not VO drama and not a shop, but it makes the body the growth object. Kit use (Q, grenades) is declared not a sixth verb (`tactical-mission.md` Core Rule 6) yet is an extra active channel (see 3b).

No GDD tells the player to click every shot, hide the minimap, save mid-mission, speak VO, or use a second visual language — no anti-pillar violation as written.

Options: move growth onto house research only (no per-body XP); keep XP but strip bay-by-bay kitting; or keep both and state they are personnel-management, not hero builds. Do not add relationship tracks to fix Relatedness (`game-pillars.md` forbids it).

#### 3g-01 — 1-op cheese vs Strike Team 04 squad-director identity

Player fantasies agree the player is OPS_DIRECTOR, never walks the street: `world-network.md` sit the desk; `economy-and-contracts.md` authorize/read the invoice; `research.md` authorize the program; `roster-and-assembly.md` assign who walks; `tactical-mission.md` spend few orders; `persistence-and-validation.md` Continue the desk; `interface.md` terminal as character; `audio.md` same OS mix. Coherent.

The strain is identity-narrowing, not contradiction: `game-concept.md` names Strike Team 04 and 1–4 operatives; `roster-and-assembly.md` allows always-1 Ready. If 3c-01 wins, the fantasy becomes remote-sniper director rather than tempo of a squad. Quiet-zero invoices still print paperwork, so Pillar 3 voice holds.

Options: keep 1-op as a legal emergency command; require 2+ for authored spine; or rewrite fantasy to include a lone deniable asset. Do not pick a GDD as wrong — they already agree 1–4 is valid.

---

## Cross-System Scenario Issues

Scenarios walked: 5

1. Non-quiet win debrief (3+ chain)
2. Fire-lane civilian first-hit
3. Quiet-replay win
4. Last living KIA on incomplete campaign
5. Abort from pause

### Blockers

None that fork two GDDs against each other.

Same-step wipe vs required-complete is unnamed in `tactical-mission.md` Open Question 5. Siblings all branch on `won`. Stories covering that step are blocked until living spec §10 names the winner. That is a parked living-spec gap, not a rule contradiction between extracts.

### Warnings

#### Non-quiet win debrief — Tactical, Economy, World Network, Roster, Research, Persistence, Interface

Trigger: last required objective complete → HUD result → 2.5 s of accepted Tactical elapsed time → Debrief.

Activation order: Tactical emits outcome DTO (`won`, `civiliansHit`, completed optional ids, `deadIds`, `survivorHp`) → Economy prices `net_payout` then deposits Tax amounts World Network emits during this apply → World Network write-back at frozen `t0` then ETA jump → Roster t0 KIA/injury/XP then `sync(t1)` on win → Research `sync(t)` → Interface presents invoice as unfiled → Persistence durable-commits on the next Screen (World Network return or Brief Replay).

Data flow: `new_balance − credits_before = net_payout + tax_deposits` is intentional (Tax is not a sixth invoice money line). QuietReplay is frozen on the Economy slice; Tactical OQ4 / Economy AC288: code still restamps from live `contractsWon` — implementation debt, not a GDD rule fork.

Failure modes: ETA burst can complete labs, injury, Tax, and events in one apply (designed compounding). Reload while still on Debrief restores the last Screen snapshot; an opt-in telemetry row may remain (accepted mismatch, ADR-0015). Apply-once is transaction-level (`outcomeApplied` / `outcomeSerial`).

#### Fire-lane civilian first-hit — Tactical, Economy, Interface, World Network

Trigger: squad miss continues down the fire lane into a civilian before cover.

Tactical increments unique squad first-hits (`N`); HUD shows **count** not CR; Economy prices only at debrief (`collateral = min(Reward, 5000 × N)`); World Network Unrest add magnitudes unnamed.

Player experience: tracers / comm log / HUD count, then invoice line. Messaging agrees if chrome stays a count. Post-cap extra hits still count but do not change CR (see 3c-02). CorpSec-caused hits do not increment `N` (all owners agree).

#### Quiet-replay win — Economy, World Network, Roster, Research, Interface

Trigger: already-won authored contract played to a win.

Invoice zeros + stored Reward + `REPLAY // FEE ALREADY COLLECTED`; Tax may still land because ETA catch-up still runs; XP/KIA/injury/ETA apply; labs `sync(t)`; no direct Control/Unrest/ownership shove at `t0`.

Quiet wipe of last living on an **incomplete** campaign still fails (quiet is per-contract, not campaign-complete). A completed campaign stays complete after a roster wipe.

#### Last living KIA on incomplete campaign — Roster, World Network, Persistence, Interface

Trigger: debrief removes the last living operative while campaign is not complete.

Roster sets failed-empty-roster; World Network posts CAMPAIGN FAILED and `selectMission` no-op; Persistence stores flags and does not re-derive fail from living count 0 on hydrate; Interface presents the banner.

Hire-on-failed (Roster OQ1 / World Network Edge Cases / Persistence OQ6) is **undefined** if the director tries to hire after fail.

#### Abort from pause — Interface, Tactical, Persistence, Audio

Trigger: pause → Abort first activation arms 3 real seconds; second while armed confirms.

No outcome DTO, no campaign write, thin telemetry if enabled, no mission-end sting on arm. In-session landing (Menu vs Screen) is unnamed (Persistence OQ8 / Interface OQ8). Current code routes to World Network; that source fact does not close the parked question.

### Info

- Continue always opens World Network; a Screen-held selected contract may restore; Brief is not locked by the reload.
- Authored Replay vs generated no-Replay is agreed.
- Chance always prints on Scan; Risk bands are Brief intel 2+ only. Tactical still computes both.
- Research Chance uses full completed program `researchedCount`, not the worn or unslotted-only set. Risk index does not take completed Research.
- Opening Influence 0 disables Stabilize/Lobby/Expedite; first dirty win +6 cannot afford Stabilize 8; clean +8 equals exactly one Stabilize — designed first-minute gate.
- Relatedness is intentionally thin. Missing companion drama is not a holism failure.

Parked Open Questions that agree across GDDs (not issues): hire-on-failed-campaign; `win_rate` at `won + lost = 0`; `abort_rate` named not specified; Abort in-session landing; Item-slot persistence across Assembly visits; Interface OQ7 do not silently equate tutorial 35% with `injury_hp_frac` 0.35; Tactical OQ3 Attack vs Device remainder; Tactical OQ5 same-step wipe vs required-complete.

---

## GDDs Flagged for Revision

| GDD | Reason | Type | Priority |
|-----|--------|------|----------|
| systems-index.md | Approved vs In Review/Designed headers; omitted Persistence↔Audio; stale Next Steps | Consistency | Warning |
| persistence-and-validation.md | Header pending review vs index Approved; Audio upstream cycle; dual-listed knobs | Consistency | Warning |
| economy-and-contracts.md | Closed Q3 still calls Interface OQ1 stale; 779k dual-listed | Consistency | Warning |
| world-network.md | Header In Review vs index Approved; unnamed Control floor / dirty-win Unrest | Consistency | Warning |
| research.md | Header In Review vs index; unclamped folds; 779k dual-listed | Consistency | Warning |
| roster-and-assembly.md | Header In Review vs index; 1-op cheese / unbounded XP (design options) | Design Theory | Warning |
| tactical-mission.md | Header In Review vs index; Persistence edge inverted | Consistency | Warning |
| interface.md | Hard vs Soft with five siblings; knobs dual-listed with Persistence | Consistency | Warning |
| audio.md | Hard-upstream Persistence not in index | Consistency | Warning |

`systems-index.md` Status tokens were **not** changed by this review. Findings are warning-level; setting `Needs Revision` would pick a winner between header In Review and index Approved.

---

## Verdict: CONCERNS

No blocking issues. Warnings should be resolved but do not prevent architecture.

### If FAIL — required actions before re-running

N/A
