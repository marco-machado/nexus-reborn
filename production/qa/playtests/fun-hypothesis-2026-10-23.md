# Fun Hypothesis Review — 2026-10-23

> **Gate**: CD-PLAYTEST (`.claude/docs/director-gates/cd-playtest.md`), run by the creative-director agent on 2026-10-23
> **Verdict**: CONCERNS. Hypothesis **revised**.
> **Hypothesis under test** (`design/gdd/game-concept.md`, MVP Definition): "Remote command is fun when information is visible, orders are few, and violence prints on the invoice."
> **Proposed revision** (not yet written into `game-concept.md`; the owner's call): **"Remote command is fun when information is visible on both layers, a few orders can be given in time and are visibly obeyed, and violence (collateral, casualties and the world) prints on the invoice."**
> **Evidence**: agent playtests `playtest-2026-10-23-agent-s2.md`, `-s3.md`, `-s4.md` (this folder); human session `playtest-2026-10-19-marco.md`.
> **Method caveat**: sessions 2–4 are agent testers driving a harness that holds the mission between commands and lets about 120 ms pass per input. No human has played since 2026-10-19. Every timing finding below comes from agents.

---

## Overall

The core fantasy works in the mission. The best moments across the sessions are the officer radio call ("THE CALL NEVER WENT OUT"), the collateral counter with its −5,000 CR line, the research trade-offs, and the Brief-to-deploy rhythm. The human tester (2026-10-19) said losing someone "matters a lot". That rules out a rejection.

The concern is drift away from Pillar 4 (the two layers feed each other) and Pillar 2 (information is operational power) on the strategic layer:

- Session 4: North America went from 68% to 4% Control after a win there. Pillar 4's veto names exactly this: a win that leaves the World Network looking as it did before.
- Control is the number the card taught, but it did not decide ownership. Pillar 2 vetoes numbers the player cannot act on.
- Both testers in sessions 3 and 4 described watching the world burn with no lever that worked.
- Session 3's one-line summary: fun "when it is readable".

## Clause by clause (as of the build tested, before the fixes)

| Clause | Verdict | Evidence |
|---|---|---|
| Information is visible | Validated in the mission; **not** on the strategic layer | Mission: cones, grenade ring, radio advisory, collateral counter. Strategic: ownership, the causes of drift, what Influence did, and the world time a deploy spends were unreadable. Objectives and interactables could not be found in 3D (the Hollow Crown server never found) |
| Orders are few | **Not validated** | Orders are few, but the window to give them was 2–3 seconds (40–80% health to dead). The pause refused orders. Some orders failed silently (a move ignored for 15 s of a 90 s escort). One minute of fighting read as "a burst of chaos, not a tactics puzzle" |
| Violence prints on the invoice | Validated for collateral; **not** for casualties or the world | A KIA was "just a red name" with no cost. The Debrief did not report what the contract moved on the World Network |

## Critical fun issues before the Production → Polish gate, and what was done

All responses below are in `2c73542` (2026-10-23). Decisions: Claude, delegated by the owner's /goal 2026-10-23. None has been played by a human.

| Issue (CD) | Response | Story | Status |
|---|---|---|---|
| A. The strategic layer has no working lever. Asked for numeric criteria and a line showing what the player moved, without freezing the world | Event kind weights retuned: with no action at most 1 crisis sector by day 6, North America held through day 10 on 15 of 20 cursors, some sector still past 40 Unrest on 15 of 20; a crisis at 90 with a Stabilize clears in 2 days. Feed line when a Stabilize or Lobby finishes. Debrief prints the sector's Control and Unrest move and its state after the ETA | WN-021 | Done; tests over 20 RNG cursors |
| A (cont.). Control read as ownership | HELD BY row (city majority and count); the card says Control is not ownership | WN-022 | Done |
| B. Lethality faster than a human can react. CD warned against two pauses with opposite rules and recommended one state the player can also enter | Space is the tactical hold: sim frozen, no menu, orders open. A casualty under 35% enters the same hold once per crossing, banner names them. Escape is the menu, which still refuses orders | TM-019 | Done; whether it fixes the finding needs a human at real-time speed |
| C. Objectives unfindable; must include interact targets | Ground ring on every active objective's zone (required and optional, any kind but extract) and on each living device of a destroy; beam over required ones | TM-020 | Done; no tester has looked for the server with markers on |
| D. Screens that tell untruths | Brief collateral rule instead of `LOW (10%)`; QUATERNARY; the days a win spends on Brief and Assembly; slot-cycle hint; Abort hint says what Abort does; first-arming BLAST RADIUS hint | IF-039, TM-021 | Done |
| Missing 1: KIA cost line on the Debrief | One row per death: XP lost, roster left | IF-039 | Done (no replacement cost printed) |
| Missing 2: reproduce the silently ignored move | No enclosed pocket found in the city. Likely cause: an empty selection (a left click on bare ground clears it). Empty-selection and no-route orders now say so in the log | TM-021 | Done for the likely cause; the original event is not reproduced |
| Missing 3: a human session after the fixes | Not done | — | **Open** (ROADMAP; owner hand-play dated 2026-10-28) |
| Missing 4: "too hard" in 2 of 3 sessions | Cause is time-to-kill on open ground, not threat tier. Judge TM-019 first; do not reopen a third profile | `design/difficulty-curve.md` Open Questions | **Open**, the owner's call after the human session |

## Abort

In the CD's judgment, Abort does **not** block the third clause as Pillar 3 defines it: collateral prints on every filed invoice, and Abort is an exit the player chooses that files nothing. What it wears away is attrition, the one axis the human tester confirmed. Session 4 aborted *because* three deaths came inside two seconds; TM-019 addresses that cause first. Pillars rule 5 forbids reopening living spec §19 #8 to break a tie, and the difficulty curve does not depend on it.

Recommendation: the owner reopens it **in Polish**, with evidence from the post-fix human session. If testers still reach for Abort after readable deaths, the options are Abort-as-loss with KIA kept, or Abort spending ETA. Meanwhile the Abort confirm now says what happens (`PRESS AGAIN WITHIN 3 S TO ABORT // NO INVOICE, CONTRACT STAYS OPEN, ROSTER AS DEPLOYED`).

**Correction to session 4's routing.** The report says REPLAY can undo death. The CD thinks it cannot: `applyDebrief` runs when the Debrief mounts (`src/ui/index.tsx`), before REPLAY can be pressed, and the tester declined REPLAY and never tried it. The CD did not trace the KIA write itself, so this is **unverified**. What misled the tester is `INVOICE UNFILED // COMMITS ON NEXT SCREEN` (`src/ui/filingStatus.ts`), which reads as reversible. Copy fix for Polish, not a design reopen.

## Open for the owner

1. Adopt the revised hypothesis wording in `design/gdd/game-concept.md`, or keep the original.
2. After a human session on the hold: whether "too hard" still needs a third difficulty profile (difficulty curve OQ).
3. In Polish: whether to reopen Abort (§19 #8).
