# Review log: Persistence and validation

## Review — 2026-10-07 — Verdict: NEEDS REVISION (revised same day, awaiting re-review)
Scope signal: M
Specialists: none (lean)
Blocking items: 2 | Recommended: 6
Summary: Persist model holds (three slots, unsaved mission, apply-once in memory, durable on next Screen). Blockers were two decisions passed between docs: Balance availability (AC vs Interface OQ9) and `win_rate` at zero decided missions (circular OQ2). Decided: Balance offered iff the retained log is nonempty; zero denominator shows a no-data marker. Recommended 3-6 also revised (header/date, autosave trigger, three untestable ACs, knob ranges); Interface OQ2/OQ9 closed to match. Items 7-8 (storage-throw player notice, Fantasy wording) left open.
Prior verdict resolved: Yes (2026-09-15 APPROVED stood for the model, not for Balance implementability)
Findings:
- [BLOCKING] Rule 17 / ACs: Balance "not offered" AC contradicted Interface OQ9 and ignored retained-log-with-recording-off. Fixed.
- [BLOCKING] Formulas / OQ2: win_rate zero denominator owned by neither doc; AC "unspecified" untestable. Fixed.
- [RECOMMENDED] Header: Status Approved vs index Needs Revision; stale Last Updated. Fixed.
- [RECOMMENDED] Rule 9: autosave trigger semantic undefined. Fixed.
- [RECOMMENDED] Acceptance Criteria: three untestable ACs (Brief not locked, "Balance would be opened", durable-erase presentation). Fixed.
- [RECOMMENDED] Tuning Knobs: no ranges; arming window missing. Fixed.
- [RECOMMENDED] Edge Cases: storage-throw New Operation lets the erased house return with no later player notice. Open.
- [RECOMMENDED] Player Fantasy: rules list rather than felt experience. Open.
Reviewed-Content-Hash: design/gdd/persistence-and-validation.md 86feac35f22229d532f7ba35d6e6c4cf84312156
Reviewed-Content-Hash: design/registry/entities.yaml 42c51ca6191edf8d9b1876d27251ece76a78d18e

## Review — 2026-09-15 — Scoring pass: NEEDS REVISION (pre-patch)
Scope signal: M
Specialists: game-designer, systems-designer, qa-lead, ux-designer, creative-director
Blocking items: 2 | Recommended: 7
Patches applied: 2 blockers
Live verdict: unscored — specialists have not read the patched text
Summary: Three slots, unsaved mission, and Debrief-not-a-Screen still stand. Pre-patch text had two extract cuts: selected-contract persistence (Screens vs ACs) and apply-once claimed as both the player-facing invoice and a WN-only durable write. Both were aliased to living spec §4.8–4.9 without forking ADR-0011. Advisory items (storage-throw split-brain, win_rate range, OQ4/OQ7 copy, AC anaphora) were not patched.
Prior verdict resolved: First review

## Review — 2026-09-15 — Scoring pass: NEEDS REVISION (pre-patch)
Scope signal: M
Specialists: game-designer, systems-designer, qa-lead, ux-designer, creative-director
Blocking items: 4 | Recommended: 6
Patches applied: 4 blockers
Live verdict: unscored — specialists have not read the patched text
Summary: Persist model still stands (three envelopes, unsaved mission, Debrief apply-once in memory, durable on next Screen including Brief Replay). Scoring-pass blockers were missing ACs for filing-status, swallowed-write presentation, never-started vs invalid, and the quiet-replay persist-set (`t` / labs / injuries / Tax). Prior selected-contract and apply-once rule forks were already gone.
Prior verdict resolved: Yes

## Review — 2026-09-15 — Scoring pass: NEEDS REVISION (pre-patch)
Scope signal: M
Specialists: game-designer, systems-designer, qa-lead, ux-designer, creative-director
Blocking items: 2 | Recommended: 6
Patches applied: 2 blockers
Live verdict: unscored — specialists have not read the patched text
Summary: Persist model holds (three envelopes, unsaved mission, Debrief apply-once in memory, durable on next Screen including Brief Replay). Scoring-pass blockers were ADR-0020 invalid-set subset (non-failed campaignWon vs three-authored record) and generated-market RNG in Rule 5/ADR-0011 but not Rule 15/ACs. Dual-home chrome is Interface extract gap; OQ 2/4/5/6/8 stay parked.
Prior verdict resolved: Yes

## Review — 2026-09-15 — Scoring pass: NEEDS REVISION (pre-patch)
Scope signal: M
Specialists: game-designer, systems-designer, qa-lead, ux-designer, creative-director
Blocking items: 3 | Recommended: 8
Patches applied: 3 blockers
Post-patch state: unscored — awaiting re-review at the selected depth
Summary: Persist model stands (three envelopes, unsaved mission, Debrief apply-once in memory, durable on next Screen including Brief Replay). Scoring-pass blockers were ADR-0020 do-not-drop KEEP ACs plus states-table re-derive bait, an unsatisfiable quiet-replay persist AC (Tax deposits vs Credits=S; undefined authored-pay flags), and hydrate identity omitting generated-market fire after Rule 15. FILE verb, swallowed-write revert, OQ 8, and sibling/ADR/§17 errata were not this-file blockers.
Prior verdict resolved: Yes

## Review — 2026-09-15 — Verdict: APPROVED
Scope signal: M
Specialists: game-designer, systems-designer, qa-lead, ux-designer, creative-director
Blocking items: 0 | Recommended: 8
Summary: Re-review of patched text. Last-pass extract holes are closed (KEEP ACs + write-time vs stored-flag hydrate, quiet-replay Credits/Tax/contractsWon, generated-contract identity). Persist model unchanged. Newly filed items (paying-win persist-set AC, quiet board fields, KEEP-as-anti-desk, anaphora, New Operation destination write-fail) are recs or sibling-owned, not this-file blockers.
Prior verdict resolved: Yes

## Review — 2026-10-07 — Verdict: APPROVED (re-review of patched text)
Scope signal: M
Specialists: none (lean)
Blocking items: 0 | Recommended: 5
Summary: Re-review of the text patched after the earlier same-day NEEDS REVISION. Both blockers are closed and agree across Persistence, Interface OQ2/OQ9 and the ACs: Balance is offered iff the retained log is nonempty, and `win_rate` at zero decided missions shows a no-data marker. The persist model is unchanged. Remaining items are test determinism and polish. The registry `win_rate` note was updated in this pass, so the hash below is of the updated registry.
Prior verdict resolved: Yes
Findings:
- [RECOMMENDED] Registry win_rate: note still named zero-denominator as open OQ2. Fixed in this pass.
- [RECOMMENDED] Acceptance Criteria 225/227/263/266: reload right after next-Screen commit races with the unspecified autosave delay; add a flush condition.
- [RECOMMENDED] Tuning Knobs: telemetry cap 60 safe range is not measurable.
- [RECOMMENDED] Edge Cases: storage-throw New Operation lets the old house return on reload with no later player notice. Open (Interface-owned copy).
- [RECOMMENDED] Player Fantasy: negative checklist rather than felt experience. Open (advisory).
Reviewed-Content-Hash: design/gdd/persistence-and-validation.md 86feac35f22229d532f7ba35d6e6c4cf84312156
Reviewed-Content-Hash: design/registry/entities.yaml 915c63c38de8f149583e674c2d10499c687847a7
