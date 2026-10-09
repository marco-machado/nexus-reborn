# Vertical Slice Report: Nexus Reborn

> **Date**: 2026-10-06
> **Slice Duration**: 1 session, 0 construction days
> **Target Scope**: 3–5 minutes of polished, continuous gameplay
> **Source GDD**: design/gdd/game-concept.md
> **Run type**: First run. Not a re-run after a PIVOT.
> **What was tested**: The shipping cut in `src/`. No slice code was written. `src/` is not throwaway prototype code.

---

## Validation Question

Does a player, starting from New Operation, experience remote command — read the board, spend a few orders, and see stray fire priced on the invoice — within 5 minutes, without developer guidance?

Build feasibility was not re-proven. The shipping cut already existed. This run asked whether that loop still delivers the fantasy at representative quality.

---

## Scope Built

Nothing was built this run. The player chose a playtest of the shipping cut. No `prototypes/` implementation.

**Systems exercised:**

- Interface: New Operation, Brief, Assembly, mission HUD, debrief
- World Network: select Glass Veil only (`m01`, intel 1)
- Economy and contracts: one authored brief and the debrief invoice
- Roster and Assembly: opening squad deploy, no hire
- Tactical mission: Select / Move / Attack / Hold Ground / Hold Fire through Glass Veil (reach gate, eliminate garrison, extract)
- Persistence: unsaved mission, return to the World Network after debrief

**Art/audio quality level:** Intended as representative code-generated terminal and city. The tester judged the visuals still a prototype.

**Shortcuts taken deliberately:** None in code. Research, generated market, timeline review, hire, Hardened, the other authored contracts, and an audio mix audit were out of the pass.

**What was cut from original scope:** A throwaway rebuild under `prototypes/`. Rejected because the systems index marks Vertical Slice unused and the loop already ships in `src/`.

---

## Build Velocity Log

| Day | Completed |
|-----|-----------|
| 2026-10-06 | No code. Scope locked to a Glass Veil playtest of `src/`. One internal session. Debrief collected. Player verdict: PIVOT. |

**Total elapsed:** 0 construction days for a playtest of an already-shipped loop.
**Velocity estimate:** This run has no build rate. Do not use it as hours-per-encounter. The only rate it supports is: validating the existing loop did not require a second implementation.

---

## Playtest Results

| Attribute | Value |
|-----------|-------|
| Total sessions | 1 |
| Internal testers | 1 (project owner) |
| External testers | 0 |
| Avg session length | Not recorded. Do not invent one. |
| Time to first meaningful action | 30 seconds |

The tester completed New Operation → Glass Veil → debrief invoice and said they did it without guidance. During the session they asked what stray fire meant. That question was answered before the debrief. Their later answer was still that they completed the cycle without guidance.

---

## Observations

**Where testers succeeded without guidance:**

- Completed the full New Operation → Glass Veil → debrief invoice cycle.
- First moment of actually playing: 30 seconds.
- Felt remote command at the dashboard and when giving orders to units.

**Where testers were confused or stuck:**

- World Network load: "i did not know what to do, where to start."
- Civilians were not hit. The corporate-cost half of the validation question did not occur.
- Grenades would not launch. Not reproduced in this session, so this is not a confirmed defect. The shipping control is G to arm, then a click, and only when a living operative is selected and the grenade is usable (out of CELL, cooldown, or no selection leaves the HUD slot disabled).

**Emotional reactions observed:**

- Command landed at the desk and at the order.
- The picture still read as a prototype.
- Glass Veil and the other contracts were judged not ready.
- No build time or cost was available to react to. Nothing was built.

---

## Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Time to first meaningful action | Without guidance, inside the 5-minute loop | 30 seconds |
| Session length | 3–5 minutes | Not recorded |
| Critical fun blockers found | 0 | 3 (World Network arrival, no civilian hit, grenades would not launch) |
| Pipeline blockers found | 0 | 0 |
| Architecture surprises | 0 | 0 reported |

**Feel assessment:** The dashboard and unit orders produced the director feeling. The World Network did not say where to start. No civilian was hit, so stray fire was never priced in the experience. Grenade launch failed from the player's side and was not re-tested here. Visuals were called a prototype, not representative shipping quality.

---

## Recommendation: PROCEED (revised 2026-10-08)

> **Owner revision, 2026-10-08**: PIVOT → PROCEED. The 2026-10-06 PIVOT reacted to the state of the build, not the concept. The validation question was met: the player felt remote command at the dashboard and while giving orders, reached it in 30 seconds, and finished Glass Veil without guidance. What remains is build-state work, listed under If Proceeding. The original PIVOT text below is kept as history.
>
> **Correction**: "Civilians were not hit" means civilians the owner placed in the line of fire between agents and enemies were never struck. It was tested; it did not happen. Cause in `src/game/world.ts` `tryFire`: a rolled hit applies damage straight to the target without checking bodies on the line, and only a missed round can stray (`strayVictim`). The miss is also offset past and beside the target, so its lane often clears a body standing directly in between.

### Original recommendation (2026-10-06): PIVOT

Player verdict, 2026-10-06. A new player did feel remote command, at the dashboard and when giving orders, and reached that in 30 seconds without a walkthrough. They also finished Glass Veil. That is not enough to PROCEED. They said the visuals are still a prototype and that Glass Veil and the other contracts are not ready. Civilians were not hit, so the invoice never carried the corporate cost the validation question required. The World Network did not tell them where to start. Grenades would not launch.

Not KILL. The command fantasy was felt. One unclear arrival and a missing consequence are not a dead concept. Kill checks that do not apply: no recorded loop over 5 minutes, an emotional high point was reported, this is the first slice attempt, and no architecture rebuild was identified.

Build feasibility was not tested. There is no schedule claim in this report.

> **Creative Director Review (CD-PLAYTEST)**: CONCERNS (accepted) 2026-10-06. Recommendation confirmed: PIVOT. Command landed; the five-verb loop is not the failure. Gaps: World Network arrival did not say where to start; Pillar 3 did not occur (civilians not hit, invoice never priced stray fire; not a reproduced defect); stray fire was explained before debrief rather than lived; visuals still read as a prototype and the contracts were judged not ready; grenade launch failed from the player's side and was not reproduced. No ADR. `src/` is not throwaway slice code.

---

## If Proceeding

Build-state work for Pre-Production. `src/` stays the base. Nothing here reopens the five verbs, the dashboard, or an ADR.

1. **Rounds hit bodies in their path.** Check the shooter→target line for intervening bodies on every shot, not only on misses, so a civilian in the line of fire can be hit and priced on the invoice (Pillar 3). Simulation change in `src/game/world.ts`, with tests.
2. **World Network arrival.** The first strategic screen must tell a new player where to start.
3. **Grenade launch.** Reproduce the player-side failure, then fix it.
4. **Visuals.** Bring the mission and terminal from prototype read to representative quality.
5. **Contracts.** Make Glass Veil and the other contracts ready.

---

## If Pivoting

*Superseded by the 2026-10-08 PROCEED. Kept as history.*

The failure is not the five-verb loop. The tester finished it and felt command. What failed is the first strategic screen, the consequence beat, and the claim that the current picture is production quality.

**Systems requiring GDD revision:**

- World Network / Interface — arrival does not tell a new player where to start. There is no World Network UX spec. `design/player-journey.md` does not exist.
- Economy and contracts / Tactical mission — Pillar 3 did not occur on Glass Veil. Civilians were not hit, so the invoice did not price stray fire. Do not treat that as a proven code defect until it is reproduced.
- Interface — grenade launch was not discoverable or not usable in this session. Binding and HUD gates exist. Reproduce before changing the GDD.

**Architecture decisions to revisit:** None from this session. No architectural surprise was reported.

**Core loop change needed:** Keep Select / Move / Attack / Hold Ground / Hold Fire and the dashboard. Change the World Network's first action so a new player knows where to start. Make a squad-caused civilian hit encounterable and priced on the Glass Veil invoice, or stop claiming this contract proves Pillar 3. Do not call the current visuals representative until the owner says they are.

**Next steps:**

1. `/design-system` on the World Network arrival and on Glass Veil collateral, after the failure is reproduced or the owner accepts the playtest as the evidence.
2. Do not open an architecture decision from this report. Nothing in the session implicated an ADR.
3. `/vertical-slice` again only after those revisions. The next question should prove the first screen and the invoice line, not the five verbs again.

---

## If Killing

Not this verdict. Kill checks met: 0. A targeted PIVOT is the recovery the skill allows when 0–1 kill checks apply.

---

## Lessons Learned

- **What assumptions were broken by building to near-production quality?**
  This run did not build. The broken assumption is that the shipping cut is already a representative vertical slice. The owner still read the visuals as a prototype and the contracts as not ready.

- **What surprised us about the pipeline or architecture?**
  Nothing about architecture. The pipeline surprise is that a brownfield slice produces no construction velocity. Treating `src/` as the slice avoided a second game. It also could not answer "how long does this quality take to build."

- **What would we change about the slice scope if we ran this again?**
  Do not re-test the five verbs. Require a recorded session length. Require one squad-caused civilian hit and the invoice line, or an explicit miss. Reproduce grenade launch before writing a defect. Name the World Network first click as a success criterion.

---

> *No vertical slice code was written. Do not delete or quarantine `src/` because of this report.*
> *Production must not import from `prototypes/`.*
> *A later PROCEED must not be read as an order to rewrite the shipping cut from scratch. That rule applies to slice code. There is none.*
