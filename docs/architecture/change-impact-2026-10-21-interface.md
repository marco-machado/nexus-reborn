# Change Impact: Interface (difficulty curve approval)

**Date**: 2026-10-21
**GDD**: `design/gdd/interface.md` (living spec `docs/game-design.md` §12 changed the same day)
**Source decision**: `design/difficulty-curve.md`, approved by the project owner 2026-10-21. Companion run: `change-impact-2026-10-21-world-network.md`.
**Run**: `/propagate-design-change design/gdd/interface.md`, workflow full, automation autonomous. TD-CHANGE-IMPACT: **CONCERNS** (affected set missed ADR-0013; three story notes missing; KIT copy for destroy and escort did not match the sim). Resolution: assessment revised — ADR-0013 added as Still Valid, story notes added, KIT copy corrected in the GDD, living spec and difficulty curve the same day (owner confirmed the four strings 2026-10-22). No ADR revised or superseded.

---

## Change Summary: interface.md

Changed sections:
- **Screens table, Brief row**: a KIT line per objective kind, printed from the same objective list the sim runs; derived from objective data so generated contracts carry it.
- **Core Rule 13 (Tutorial and advisories)**: the first Debrief carries a one-shot Research prompt (names the Research tab and the cheapest available project), fires once per campaign, persists with the tutorial seen-set, and is the only place Research is taught. The orientation card no longer carries a Research row.
- **States table**: Advisories row adds the first-Debrief Research prompt; Overlay row names the orientation card as four rows.
- **UI Requirements, World Network row**: first visit teaches four rows; Influence is taught on the sector panel when first affordable, not on the card.
- **AC27**: four rows, no Influence or Research row; opening Influence reads unaffordable on the sector panel itself.
- **AC31 (new)**: KIT line on every destroy / interact / escort / defend objective, authored or generated; none otherwise; never from notes, mission id, or `notes`; identical across authored missions and every generated type in all three variants.
- **AC32 (new)**: first-Debrief prompt fires once, dismiss marks fired, persists with the seen-set, no later Debrief repeats it.

Unchanged: every other Core Rule, HUD, pause, Settings, Balance, filing status, campaign banners, AC1–26, 28–30.

Key changes affecting architecture:
1. KIT line is Brief presentation from `ObjectiveDef.kind` (and `durationSec` for interact and defend). Brief prints `m.objectives` (`src/ui/index.tsx:855`); the sim runs `mission.objectives` (`src/game/world.ts:281`); both come from one MissionDef. For generated contracts `objectivesFor(c)` (`src/game/contracts.ts:507`) reads only `id`, `type`, `seed`; reclient and Expedite rewrite other fields only, so the kinds cannot drift between Brief and deploy. No slice or data-field change.
2. First-Debrief Research prompt: a standalone seen id appended to `SEEN_IDS` (`WORLD_ONBOARD_ID` pattern), marked with `useTutorialStore.markSeen` on Debrief, in memory until the next Screen autosave. "Cheapest available project" must use `eligibilityText(node, done, labs)` (`src/state/researchStore.ts:121`), the same rule `authorizeResearch` uses; no second "available" rule.
3. Sector-panel Influence moment: its own seen id; trigger is `influenceRefusal(state, focusedSector, action) === null` for any action (`src/state/worldStore.ts:1023`), never `influence >= cost` in Interface (AC27: do not recompute board rules). State alone cannot express once-per-campaign, because Influence and cooldowns recover.
4. Orientation card: four rows, same overlay; Phase unchanged.

Downstream GDDs: `world-network.md` (Core Rule 13, same run day); `research.md` (the prompt reads eligibility, no text change); `tactical-mission.md` (objective kinds unchanged).

---

## ADRs loaded

22 ADRs by scan (workflow full). Affected set: 10 — ADR-0010, 0014, 0015, 0017, 0019, 0021, 0022 reference `interface.md`; ADR-0002 and ADR-0011 for the Debrief boundary and seen-set; ADR-0013 added on the director's review (Research eligibility). The other 12 are out of scope for this cascade.

## Impact Analysis

### ADR-0017: One OS input / audio / phase router — ✅ Still Valid
Assumed: Settings, Balance, pause, tutorial toasts are overlays that do not change Phase; Debrief is not a Screen. Now: the four-row card is the same overlay; the Debrief prompt is an in-phase panel; a Research control exits via `returnFromDebrief` (`src/state/appStore.ts:226`) and then routes to the `research` Screen. Keep.

### ADR-0022: Durable commit status — ✅ Still Valid
The prompt is not a filing indicator and sits outside `applyDebrief`; `lastAppliedKey` untouched. Keep.

### ADR-0011: Campaign persistence envelope — ✅ Still Valid
Two new seen ids are blob content under the existing `SEEN_IDS` membership check (`save.ts:443`); no envelope or version change. `scheduleAutosave` refuses in `debrief` (`save.ts:867`, `:874`), so the Debrief mark becomes durable on the next Screen write. Keep.

### ADR-0002: Unsaved mission — ✅ Still Valid
Debrief writes nothing durable; reload on Debrief loses the seen mark with the invoice, which is the accepted behaviour. Keep.

### ADR-0009: Partitioned deploy snapshot — ✅ Still Valid
KIT line reads MissionDef at Brief, not a slice. Keep.

### ADR-0013: Credits never overdraw / AUTHORIZE — ✅ Still Valid (added by the director)
AC32's "cheapest available project" is an eligibility question. The prompt must pick with `eligibilityText`, the rule `authorizeResearch` applies (`appStore.ts:279`). Open for the story: whether "available" also means affordable against post-payout `credits`. Keep.

### ADR-0010, 0014, 0015, 0019, 0021 — ✅ Still Valid, unaffected. Keep.

---

## TD-CHANGE-IMPACT: CONCERNS — items carried into the stories

**F. Pure `kitLine`.** `kitLine(def: ObjectiveDef)` reads `kind` and, for interact and defend, `durationSec` (the sim uses `durationSec` unmodified for defend; `optFailMul` applies only to optional `failSec`). Not keyed on mission id or `notes`. Test against every generated type in all three variants plus the three authored missions; that covers all four kinds (SABOTAGE v1 has destroy + defend; EXTRACTION has interact + escort).

**G. Guard `markSeen`.** `markSeen` (`tutorialStore.ts:57`) calls `set` even when the id is already seen; the partial object is new, so subscribers fire, and `scheduleAutosave` subscribes to `useTutorialStore` (`save.ts:889`). Both new triggers watch state that updates many times a second (sector panel on the 20 Hz clock; Debrief renders). Check `!seen.includes(id)` before calling and call from an effect, never during render; or make `markSeen` return early when already seen. Keeps the ADR-0011 autosave cadence.

**H. Influence trigger.** Seen id plus `influenceRefusal(...) === null` for any of the three actions. Refusal order handles the edges: Antarctica returns `locked-sector` and never teaches; before any spend there are no cooldowns; Expedite with no target is skipped and Stabilize (8) decides. First firing is a clean first win (+8) on return to the World Network, a Screen, so the mark is durable on the next autosave.

**I. KIT copy corrected (owner confirmed 2026-10-22).** Devices "die through the ordinary damage path" (`world.ts:476–477`), so power cells are not required for destroy; the copy now reads "power cells arm grenades, the fast tool; gunfire works, slowly". Escort completes when the VIP is alive in the zone (`world.ts:1638–1643`); holding the console is the interact objective. Copy: interact → "an operative holds the console for N s"; escort → "the asset must reach the pad alive"; defend → "hold the zone for N s". Updated in `interface.md`, living spec §12 and `design/difficulty-curve.md` OQ 6.

Carried from the World Network run: A (seen-id extension point), B (second seen id), C (`returnFromDebrief`), E (test fixtures shift).

---

## Resolution decisions

| ADR | Decision | Autonomous-mode log |
|---|---|---|
| ADR-0002, 0009, 0010, 0011, 0013, 0014, 0015, 0017, 0019, 0021, 0022 | Keep as-is | No ask: every ADR Still Valid; no `architecture_decisions` or `schema_changes` category triggered |
| TD CONCERNS | Revise the impact assessment (ADR-0013 added; notes F–I folded in; KIT copy corrected) | Category: minor; classifications unchanged, so no re-analysis |

ADRs to write or update: none.

## Follow-up actions

1. KIT strings confirmed by the owner 2026-10-22 (item I); the AC31 story can be written.
2. Stories: (v) Brief KIT line with `kitLine` and its test matrix (F); (iv) first-Debrief Research prompt with `eligibilityText`, `returnFromDebrief`, guarded `markSeen` (A, C, G, ADR-0013 note); (iii) four-row card plus sector-panel Influence moment (B, H, G).
3. `/ux-design` World Network and Brief (gate blocker 4) should absorb the four-row copy and the KIT placement.
4. No `/architecture-review` needed: no ADR text changed.

**Verdict: COMPLETE** — change impact report saved.
