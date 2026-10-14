# Test Evidence: WN-014 Scan hides contracts above the director's Intel; Chance still prints

> **Story**: `production/epics/world-network/story-014-scan-hides-contracts-above-the-director-s-intel-chance.md`
> **Story Type**: UI
> **Date**: 2026-10-13
> **Tester**: Claude (automated click-through via /team-qa, autonomous mode)
> **Build / Commit**: 41febe7

---

## What Was Tested

Three generated contracts were seeded into `worldStore.contracts` in North America, each unexpired (`expiresAtT = t + 48h`):
- `gc-high`: HIGH, needs Intel 2
- `gc-severe`: SEVERE, needs Intel 3
- `gc-sev-exp`: SEVERE, Expedite-waived

The Scan, OPEN CONTRACTS and the store were read at Intel 1, 2 and 3.

**Acceptance criteria covered**: AC-1, AC-2

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | Intel < 2 vs ≥ 2 on the same contract: Chance still prints (Risk bands are Brief-only) | PASS | Glass Veil prints `CHANCE 35%` at Intel 1, 2 and 3, and the Expedite-waived contract prints `CHANCE 35%` at every level too. No `RISK INDEX` or band label appears on the World Network chrome. |
| AC-2 | Unexpired generated instance with required Intel > director Intel, not Expedite-waived: absent from Scan / OPEN CONTRACTS while Economy still holds its record | PASS | **Intel 1:** `gc-high` (req 2) and `gc-severe` (req 3) are absent from Scan and OPEN CONTRACTS. Both are still in `worldStore.contracts` (`held: true`, `expiresAtT 259201 > t 86401`). **Intel 2:** `gc-high` (req = director Intel) is listed as IRON VESPER, so equality is not hidden; `gc-severe` is still hidden and held. **Intel 3:** all three are listed. **Every level:** the Expedite-waived `gc-sev-exp` (BROKEN LEDGER) is listed. |

No clipping at 1280×720.

---

## Screenshots / Video

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `wn-014/wn-014-intel1-na-41febe7-1280x720.png` | Intel 1: only BROKEN LEDGER (Expedite-waived) is listed among the seeded contracts | AC-1, AC-2 |
| 2 | `wn-014/wn-014-intel2-na-41febe7-1280x720.png` | Intel 2: IRON VESPER (`gc-high`) is now listed | AC-2 |
| 3 | `wn-014/wn-014-intel3-na-41febe7-1280x720.png` | Intel 3: all three are listed | AC-2 |

Store reads are in `sprint-002-qa-2026-10-13/ui.json` → `wn014.intelN.store`.

---

## Test Conditions

- **Game state at start**: New Operation on a cleared save (`localStorage.clear()`), orientation dismissed, clock paused. Intel seeded with `useCampaignStore.setState({ intelLevel })` (UI check only).
- **Platform / hardware**: macOS (Darwin 25.5), Playwright driving headed Chrome for Testing 1247, viewport 1280×720, dev server `vite --strictPort --port 4201` from a clean worktree of `41febe7` (the main checkout's globe work excluded).
- **Framerate during test**: not measured (smoke 2026-10-13 path 10 covers frame time).
- **Any special setup required**: driver `sprint-002-qa-2026-10-13/ui.mjs`; raw results `sprint-002-qa-2026-10-13/ui.json`. Console errors: none.

- **Seeding**: `useWorldStore.setState({ contracts })` with the fixture from `wn-014/drive.mjs`, re-stamped to the live `t`.

---

## Observations

- `gc-high` and `gc-severe` derive the same codename (IRON VESPER) from their seeds, so at Intel 3 that name appears twice. This comes from the fixture, not the UI.

---

## Sign-Off

UI story: closed by the retained screenshots above; a lead sign-off is welcome but not required.

| Role | Name | Date | Signature |
|------|------|------|-----------|
| qa-lead | | | [ ] |

