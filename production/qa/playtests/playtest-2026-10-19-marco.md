# Playtest Report

## Session Info
- **Date**: 2026-10-19
- **Build**: bc2d221 (src at b366721), `npm run dev` on localhost:4200
- **Duration**: not recorded
- **Tester**: Marco Machado (owner, playing as a new player)
- **Platform**: PC — browser (web build)
- **Input Method**: KB+M
- **Session Type**: First time (role-played) — new-player experience, mid-game systems, difficulty

## Test Focus
Production → Polish gate playtest: new-player onboarding on World Network, the contract → Brief → Assembly → Deploy flow, mission verbs and kit, roster attrition, Influence actions, income, difficulty curve.

## First Impressions (First 5 minutes)
- **Understood the goal?** Partially — the orientation overlay was read but not understood.
- **Understood the controls?** Partially — movement and selection yes; reload, abilities and grenades no.
- **Emotional response**: Confused
- **Notes**: "the onboarding is too dense. lots of information that i don't actually understand." The globe opened away from Europe, the first open sector. Control / Unrest numbers and the bar under them meant nothing.

## Gameplay Flow
### What worked well
- Losing an operative "matters a lot" — roster attrition lands as intended.

### Pain points
- Orientation overlay is a nine-row wall of text — Severity: High
- Control / Unrest values and the unlabeled bar are unreadable — High
- Brief screen is cluttered: "a lot of useless info cloging up the screen" — Medium
- No route back from Brief to World Network that a new player finds; tester suggests the Brief be a modal or an in-place panel on World Network — Medium
- Abilities: "no idea what tf are abilities and how to use them" — High
- No manual reload — Low
- Income per 24 h not shown; after a 2-day contract only the contract payment was noticed — Medium
- Grenade damage feels too low: "it should kill those guys" — Medium
- Globe control bar (− / + / HOME / FOCUS SECTOR / SOUTH POLE / LABELS) "should not exist" — Low

### Confusion points
- Stabilize / Lobby / Expedite: "no idea how or why … I don't even know what that is."
- Extraction: not clear that an operative must stand at the console to override the cell locks.
- Sabotage (destroy) mission: did not know extra grenades were needed, nor how to get them.
- Feed announced a contract (FERAL LEDGER, São Paulo) that the South America panel did not show.

### Moments of delight
- None recorded beyond the roster-loss weight.

## Bugs Encountered
| # | Description | Severity | Reproducible |
|---|-------------|----------|-------------|
| 1 | Extraction: the asset is freed before the cell-lock override completes. `updateVips` (`src/game/world.ts:1364`) releases a VIP when any agent is within `VIP_ACQUIRE_R`, with no check on the OVERRIDE objective; the escort then completes while objective 2 still blocks, so the mission reads as stuck. | S2 | Yes (code path confirmed) |
| 2 | Grenade with several operatives selected throws from `ids[0]` only (`src/scene/Input.tsx:345`); when that operative is out of range or cannot act, nothing happens and nothing explains it. Conflicts with `tactical-mission.md` Core Rule 6 ("fires actives of the current selection"). | S3 | Yes (code path confirmed) |
| 3 | Globe opens away from Europe. `world-network.md:21`: "Focus opens on **Europe**". | S3 | Yes |
| 4 | Feed reports a contract posted in São Paulo while the South America panel shows 0 / 0 (intel level 2 required). The Feed leaks a contract that intel visibility hides. | S3 | Seen once |
| 5 | Strategy music restarts before the clip ends (tester confirmed it never reaches the clip end). `audio.md`: one loop, "same source across Screen nav". Trigger not isolated. | S3 | Seen; trigger unknown |

## Feature-Specific Feedback
### World Network onboarding
- **Understood purpose?** No
- **Found engaging?** No
- **Suggestions**: Fewer rows; teach in context.

### Brief
- **Understood purpose?** Partially
- **Found engaging?** No
- **Suggestions**: Make it a modal or in-place panel on World Network; cut recon noise; state required kit (grenades for destroy objectives).

### Abilities and kit
- **Understood purpose?** No
- **Found engaging?** No
- **Suggestions**: Show what abilities are and how to fire them; show where grenades come from.

### Influence actions (Stabilize / Lobby / Expedite)
- **Understood purpose?** No
- **Found engaging?** No
- **Suggestions**: Explain how and why.

### Roster attrition
- **Understood purpose?** Yes
- **Found engaging?** Yes — "losing someone matters a lot".

## Quantitative Data (if available)
- **Deaths**: at least one operative lost (count not recorded)
- **Time per area**: not recorded
- **Items used**: grenades (too few for the destroy mission)
- **Features discovered vs missed**: missed — abilities, manual reload, Influence actions, how to get grenades, per-day Tax income

## Overall Assessment
- **Would play again?** Maybe — "i would play again if i understand the game better."
- **Difficulty**: Too Hard — "difficulty seems to be high from the beginning. there isn't a curve at all."
- **Pacing**: not recorded
- **Session length preference**: not recorded

## Top 3 Priorities from this session
1. Comprehension: onboarding, sector numbers, abilities/kit, Influence actions and Brief clarity. The tester would return "if i understand the game better".
2. Difficulty: no curve; high from the first contract.
3. Extraction sequencing bug (asset freed before the locks) and the multi-select grenade failure.

## Design-intent conflicts
- `world-network.md:21` — Focus opens on Europe; the globe does not.
- `world-network.md:21` — the first minute should teach Focus, Pause/speed, the four numbers and the Feed; the four numbers were not understood.
- `interface.md:298` — the sector readout must be readable and distinguish printed Tax from Nexus-held eligibility; per-24 h income was not legible.
- `interface.md:89` — Tax catch-up is folded into "new balance" with no row; the tester could not tell whether the 2-day ETA paid Tax (not verified in a repro).
- `tactical-mission.md` Core Rule 6 — kit fires for the current selection; grenade uses the first selected only.
- `audio.md` — strategy bed is one loop, same source across Screen nav; it restarts.
- No `design/difficulty-curve.md` exists to compare the "no curve" finding against.

## Action Routing
- **Bugs** (1–5): `/bug-report` for each.
- **Design changes**: onboarding density; sector readout labels; Brief layout and navigation; ability and kit discoverability (including where grenades come from and required kit on the Brief); Influence action explanation; income readability; manual reload decision. Run `/propagate-design-change design/gdd/interface.md` and `/propagate-design-change design/gdd/world-network.md` before changing them.
- **Balance**: grenade damage and the missing difficulty curve. `/balance-check tactical-mission`; author `design/difficulty-curve.md` from `.claude/docs/templates/difficulty-curve.md`.
- **Polish**: remove the globe control bar.

## Creative Director Assessment
CD-PLAYTEST skipped — Lean mode.
