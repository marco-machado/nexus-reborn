# Review log: Research

## Review — 2026-09-14 — Scoring pass: NEEDS REVISION (pre-patch)
Scope signal: L
Specialists: game-designer, systems-designer, economy-designer, qa-lead, creative-director
Blocking items: 5 | Recommended: 11
Patches applied: 5 blockers
Live verdict: unscored — specialists have not read the patched text
Summary: Identity holds as a D2 program-not-locker alias (pillars 4 and 1; CD-GDD-ALIGN not reopened). Pre-patch extract left same-endT `done` insertion unspecified, contradicted ADR-0013 on spend/start, claimed sibling GDDs were missing, shipped two untestable ACs, and used broken ADR hrefs. Five blockers patched without retuning §7.
Prior verdict resolved: First review

## Review — 2026-09-14 — Scoring pass: NEEDS REVISION (pre-patch)
Scope signal: L
Specialists: game-designer, economy-designer, systems-designer, lead-programmer, qa-lead, ux-designer, ui-programmer, audio-director, creative-director
Blocking items: 1 | Recommended: 5
Patches applied: 1 blocker
Live verdict: unscored — specialists have not read the patched text
Summary: The program-not-locker design holds; no redesign, retuning, or new ADR is warranted. Four prior blocker groups were resolved at scoring, but the revised Chance/Risk acceptance criterion incorrectly required Risk to consume completed Research. With approval, that criterion was replaced by separate full-count Chance, Research-independent Risk, and Research API ownership assertions; text verification addressed the blocker, while advisory and code changes remain outside this pass.
Prior verdict resolved: No

## Review — 2026-09-22 — Scoring pass: NEEDS REVISION (pre-patch)
Scope signal: L (upper end)
Specialists: game-designer, systems-designer, economy-designer, qa-lead, ux-designer, ui-programmer, creative-director
Blocking items: 7 | Recommended: 9
Patches applied: 7 blockers + recommended riders (research.md revision + one pin-rule sentence in living spec §7)
Post-patch state: unscored — awaiting re-review at the selected depth
Summary: Identity and equal-endT insertion rules held under adversarial checking (zero AC contradictions, checksums verified). Blockers: the equal-endT pin hole was an authored fork of §7 (dead paid content in ordinary play), now closed with one §7 sentence; the authorize protocol lacked a read primitive, a single-writer invariant, and honest satisfied-vs-unsatisfied labeling; the paint contract forbade what the code does (inline clamp paints 0, runProgress is the forbidden fraction, no same-t seam); fire-delay/cooldown alias undocumented; 12 of 65 ACs untestable; copy contract put "Credits did not change" on idle inspection; one-click spend asserted without argument (justified in this pass).
Prior verdict resolved: Yes

## Review — 2026-09-22 (re-review) — Verdict: NEEDS REVISION (mechanical patch pass)
Scope signal: L (upper end); downgraded to enumerated mechanical patch + spot-check exit, no third full panel
Specialists: game-designer, systems-designer, economy-designer, qa-lead, ux-designer, ui-programmer, creative-director
Blocking items: 6 (all one-line) | Recommended: 8
Patches applied: 6 blockers + 8 riders (research.md) + one rider sentence in ADR-0013
Summary: All 7 prior blocker groups verified landed; no rule forks; cross-file claims checked true against disk and src/. New blockers were mechanical: paint-AC arithmetic (6199 → 1 at t=7199), unbounded fundability predicate (pinned: ceil(447,550/30,500) = 15 minimum-reward wins), forbidden-list "older" carve-out, single-writer invariant wording + async failsafe, authorize module home, two missing Unsatisfied labels (sort gap, remaining/lastSyncT seam). UX approved the player-facing design outright; verdict split resolved by the creative-director's "blocks when an AC is unrunnable or the spec asserts a falsehood" line.
Prior verdict resolved: Yes

## Review — 2026-09-22 (spot-check exit) — Verdict: APPROVED
Scope signal: L (upper end)
Specialists: qa-lead (spot-check, per creative-director exit criterion)
Blocking items: 0 | Recommended: 0
Patches applied: none (verification only)
Summary: All six mechanical-blocker fixes verified against the current text with independently computed arithmetic (paint AC 1 at t=7199; fundability 447,550 gap, 15-win predicate, 457,500 ≥ gap); forbidden-list carve-out, invariant wording + failsafe, module home, and both Unsatisfied labels confirmed; no leftover contradictions. Approved for handoff. Implementation debt (authorize protocol, remaining/lastSyncT seam, sync sort) is labeled Unsatisfied in the GDD and tracked for the dev story.
Prior verdict resolved: Yes
