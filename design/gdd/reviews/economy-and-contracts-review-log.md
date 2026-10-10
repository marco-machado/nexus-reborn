# Review log: Economy and contracts

## Review — 2026-09-12 — Verdict: APPROVED
Scope signal: M
Specialists: game-designer, economy-designer, systems-designer, qa-lead, creative-director
Blocking items: 0 (after A-bucket patch) | Recommended: living-spec balance items left advisory
Summary: First independent /design-review was NEEDS REVISION on owned ACs, `new_balance` vs Tax, false Open Questions, HUD live-CR contradiction, unnamed `round` half-mode, and unclamped N/bonus. Document patched without forking living-spec numbers. Creative-director: not MAJOR REVISION; core loop and three formulas stand.
Prior verdict resolved: Yes — header 2026-09-12 NEEDS REVISION (blockers patched; re-review required)

## Review — 2026-10-07 — Verdict: APPROVED
Scope signal: M
Specialists: none (lean mode, single-session analysis)
Blocking items: 0 | Recommended: 6
Summary: Re-review after the 2026-10-07 cross-GDD review fixes (W-02 ADR links, W-03 In/Out rows, W-04 outcome-field owner). All formulas and worked examples re-derived by hand and match; no boundary produces negative or degenerate output. Remaining items are tightening and AC gap-filling. No independent specialist or creative-director pass was run.
Prior verdict resolved: Yes — header 2026-10-07 NEEDS REVISION (outcome DTO ownership, AC coverage); never logged, now closed
Findings:
- [RECOMMENDED] Detailed Rules 10 / ACs: apply-once duplicate-detection key is unspecified
- [RECOMMENDED] Interactions (Known divergence): code still restamps quietReplay from live contractsWon; no issue linked
- [RECOMMENDED] Acceptance Criteria: "Credits ≥ 0" property AC and "both use Brief→Assembly→Mission→Debrief" are not concretely testable
- [RECOMMENDED] Acceptance Criteria: no AC for Locked-hidden, 2–6h cadence, Hollow Crown N=13 / Rust Haven N=8 examples, generated optional-id pricing
- [RECOMMENDED] Dependencies: Audio (registry consumer of collateral/net_payout) not listed
- [RECOMMENDED] Header / review log: 2026-10-07 verdict was absent from the log
Reviewed-Content-Hash: design/gdd/economy-and-contracts.md bd1ca2717e742cf96886ac55864a9dfda60622c6
Reviewed-Content-Hash: design/registry/entities.yaml 42c51ca6191edf8d9b1876d27251ece76a78d18e

## Review — 2026-10-07 (second pass) — Verdict: APPROVED
Scope signal: M
Specialists: none (lean mode, single-session analysis)
Blocking items: 0 | Recommended: 9
Summary: Full re-review after the pacing note, six added ACs, and DTO-ownership wording. All worked examples re-derived and match; no degenerate boundary in the spec. Main gap is code divergence: `collateralFine` in appStore.ts has no max(0, floor()) clamp, and the code DTO carries mission-priced reward/bonus. No creative-director pass was run.
Prior verdict resolved: Partly — apply-once key, Audio dependency, Locked-hidden and cadence ACs still open
Findings:
- [RECOMMENDED] Interactions (Known divergence): also cover un-clamped civiliansHit in `collateralFine` (−1 inflates payout, 2.7 → 13,500) and mission-priced reward/bonus on the code DTO; file an issue
- [RECOMMENDED] Detailed Rules 10 / ACs: apply-once duplicate-detection key unspecified; `setOutcome` has no guard
- [RECOMMENDED] Dependencies: Audio (registry consumer of collateral/net_payout) not listed
- [RECOMMENDED] Acceptance Criteria: "both use Brief→Assembly→Mission→Debrief" not concretely testable; "Credits ≥ 0" is a property; expiry AC bundles two GIVENs
- [RECOMMENDED] Acceptance Criteria: no AC for Locked-hidden, 2–6h cadence, Hollow Crown N=13 / Rust Haven N=8 examples, generated optional-id pricing
- [RECOMMENDED] Formulas: non-finite civiliansHit (NaN/Infinity) result unspecified
- [RECOMMENDED] Detailed Rules 13: whether any generated contract has optionals is unstated
- [RECOMMENDED] Tuning Knobs: pacing note uses the High/u=0.5 point as an "average" and ignores Tax and Collateral
- [RECOMMENDED] Header: Status line carries a hash caveat inline
Reviewed-Content-Hash: design/gdd/economy-and-contracts.md 1e0a4c70425a2cc67bcd812bccb2778302db7ae1
Reviewed-Content-Hash: design/registry/entities.yaml 915c63c38de8f149583e674c2d10499c687847a7

## Review — 2026-10-07 (third pass) — Verdict: APPROVED
Scope signal: L (rubric: 4 formulas, 7 dependencies; earlier passes said M)
Specialists: none (lean mode, single-session analysis)
Blocking items: 1 (resolved in session) | Recommended: 7 (4 resolved, 3 open)
Summary: First read was NEEDS REVISION: the apply-once key was minted by `setOutcome` itself (outcomeSerial + 1 per call), so a duplicate apply looked new. Patched so the key is minted at deploy, carried on the Economy slice and echoed on the DTO; same-session re-read APPROVED. Worked examples, generated-reward arithmetic and the 447,550 CR pacing figure re-derived and match. No creative-director pass was run.
Prior verdict resolved: Yes — Audio dependency, apply-once key, divergence note closed
Findings:
- [BLOCKING, resolved] Detailed Rules (Outcome DTO) / AC: apply-once key minted by the apply cannot detect a duplicate
- [RECOMMENDED, resolved] Interactions (Known divergence 1): setOutcome falls back to live contractsWon only when quietReplay is undefined
- [RECOMMENDED, resolved] Interactions: "the spec stands" conflicted with CLAUDE.md precedence; reworded as owner decision
- [RECOMMENDED, resolved] Formulas / Edge Cases: non-finite civiliansHit and completed_bonus now treated as 0, with AC
- [RECOMMENDED, resolved] Acceptance Criteria: vague/bundled ACs rewritten; added Hollow Crown, Rust Haven, key, Locked-hidden, roll cadence ACs
- [RECOMMENDED, open] Core Rule 13: whether any generated contract has optionals is unstated
- [RECOMMENDED, open] Tuning Knobs: pacing note uses High/u=0.5 as the average and ignores Tax and collateral
- [RECOMMENDED, open] tactical-mission.md Outcome DTO should list the apply-once key; three code divergences have no GitHub issues
Reviewed-Content-Hash: design/gdd/economy-and-contracts.md a2da809ea655f5318b90ed10c7cef33101f28e37
Reviewed-Content-Hash: design/registry/entities.yaml 55642407349375e8aaacc1440796a944ee5a62f7
