# Review log: Tactical mission

## Review — 2026-10-07 — Verdict: APPROVED
Scope signal: XL
Specialists: none (lean)
Blocking items: 0 | Recommended: 6
Summary: Re-review after the W-02 link rewrite and Ledger Amber edits. Five verbs lead, Stop is not a sixth verb, alias discipline holds, and all formula examples reproduce (64% / 28.8% / 31.68%, risk 89, 76.5 s). Remaining items are a circular result-delay pointer, a missing same-step tiebreak in Rule 15 and its AC, AC coverage gaps for CorpSec states and objective behaviors, and header drift.
Prior verdict resolved: Yes
Findings:
- [RECOMMENDED] Tuning Knobs / Rule 15: result delay basis points at Interface Rule 18, which points back; put sim-elapsed wording in Rule 15.
- [RECOMMENDED] Rule 15 / Acceptance Criteria: same-step tiebreak (resolved OQ5) not in Rule 15 and has no AC, including pyrrhic win.
- [RECOMMENDED] Acceptance Criteria: no ACs for CorpSec state changes, Officer radio, civilian flee, Interact/Defend pause, optional Destroy failure, optional time limit, 2.5 s delay.
- [RECOMMENDED] Acceptance Criteria: AC 21 is compound; split.
- [RECOMMENDED] Header: Last Updated stale after the 10-07 link rewrite.
- [RECOMMENDED] Formulas / Tuning Knobs: hit_chance clamp 0.05-0.95 cannot bind for the stated inputs; say it is a safety net.
Reviewed-Content-Hash: design/gdd/tactical-mission.md 7ae5bedcc5b322770a97b38e3f2b389dac5d1d01
Reviewed-Content-Hash: design/registry/entities.yaml 42c51ca6191edf8d9b1876d27251ece76a78d18e

## Review — 2026-09-15 — Scoring pass: MAJOR REVISION NEEDED (pre-patch)
Scope signal: XL
Specialists: game-designer, systems-designer, qa-lead, economy-designer, ai-programmer, level-designer, ux-designer, gameplay-programmer, creative-director
Blocking items: 7 | Recommended: 8
Patches applied: 7 blockers
Post-patch state: unscored — awaiting re-review at the selected depth
Summary: D2 extract pointed at the right fantasy then forked idle auto-acquire and Hold Fire×Move, claimed the authored three without landmark/VIP/Defend relationships, left Destroy without an apply path, reprinted Economy collateral CR, and parked OQ5 so Win/Loss at climax was undefined. Compound ACs 1/9/18/20 were not independently testable. Patches alias living spec and ADR-0016; OQ5 and Device-as-Unit remainder stay escalated to §10.
Prior verdict resolved: First review

## Review — 2026-09-15 — Scoring pass: NEEDS REVISION (pre-patch)
Scope signal: XL
Specialists: game-designer, systems-designer, qa-lead, economy-designer, ai-programmer, level-designer, ux-designer, gameplay-programmer, creative-director
Blocking items: 6 | Recommended: 6
Patches applied: 6 blockers
Post-patch state: unscored — awaiting re-review at the selected depth
Summary: Pass-2 patches hold (idle auto-acquire, Hold Fire×Move, ADR-0016 Attack/Hold Fire, authored landmarks, count-vs-price, OQ5 story-block). Remaining this-file holes at this score: omitted 9 m awareness propagate, dropped Attack chase, AC6↔OQ8 contradiction, grenade_damage Device-zero wording, Loss DTO leaking net_payout 0, missing ACs for Hold Fire-does-not-null Explicit and Attack-on-Device no-op. Not MAJOR: identity and pillar tests survived. OQ5/OQ3/Device HP stay escalated.
Prior verdict resolved: No

## Review — 2026-09-16 — Verdict: APPROVED
Scope signal: L
Specialists: game-designer, systems-designer, qa-lead, economy-designer, ai-programmer, level-designer, ux-designer, gameplay-programmer, creative-director
Blocking items: 0 | Recommended: 4
Summary: Pass-3 text serves Command, Information, and Violence. Pass-2 this-file holes are closed (9 m awareness, Attack chase, Stop discards parked path, grenade living-unit else, Loss DTO fields, AC 5c/5d). Remaining specialist BLOCKING labels are escalate-to-§10 (OQ5/OQ3/VIP/OQ9) or AC testability recs. D2 alias holds: no copied weapon tables, no invented OQ5 winner, Demolish, or Device HP table.
Prior verdict resolved: Yes
