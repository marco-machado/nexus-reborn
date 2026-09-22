# Review log: Persistence and validation

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
