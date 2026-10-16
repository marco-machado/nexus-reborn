# Tautological tests sweep — 2026-10-16

**Scope:** every `src/**/*.test.ts` file (47 files at the start, plus the `*.test.ts` files the parent session added during the sweep). The Sprint 7 test diff (`9dcd4fd^..HEAD`) was read line by line. Older files were read in full or scanned with scripted checks:
- expect-vs-matcher self-comparison
- the same function on both sides of a matcher
- `Math.*` used inside the expected value
- comparisons against unpinned upper-case constants
- `toBeDefined` / `toBeTruthy` / `typeof` / `Array.isArray`
- `vi.mock` of the unit under test
- tests with no reachable `expect`

The leads came from the Sprint 7 commit bodies (`git log --format=%B 9dcd4fd..HEAD`).

**Definition used:** a test is tautological if it cannot fail while the code under test is wrong. That covers four cases:
- its oracle is the code's own constant or expression
- its oracle is a re-derivation of the formula inside the test
- it asserts the test's own fixture
- it checks only a shape that the type already guarantees

**How "can fail now" was shown:** the code under test was broken temporarily (the mutation is named in the table). The fixed test was run and seen to fail, then the source was restored with `git checkout`. Where it says "old passed", the pre-fix test was also run against that same break and passed.

**Concurrent work:** the parent session fixed several Sprint 7 findings in this same checkout during the sweep. Those rows are marked *parent* and name its commit. They are listed here so the table is complete. I did not write those commits.

## Findings

| # | file:line (pre-fix) | Why it was tautological | Action | How it was shown to fail now | Commit |
|---|---|---|---|---|---|
| 1 | src/game/experience.test.ts:7-15 | Expected `{maxHp: XP_HP_PER, speed: XP_SPEED_PER}`, and `3 * XP_HP_PER` for 3 points. These are the constants `xpBonus` multiplies by, and the GDD says not to copy them. | Fixed: +2 HP / +0.05 m/s per point (living spec §6) | `XP_HP_PER = 3` → both tests fail | af5288e |
| 2 | src/game/recruits.test.ts:14-17 | `HP_MIN/HP_MAX/SPEED_MIN/SPEED_MAX` were `Math.min/max` over `ROSTER`, the exact expressions in `recruits.ts:32-35`. The envelope and `hireCost` band tests moved with the code. | Fixed: §8 roster bounds 92–132 HP, 4.2–5.6 m/s | `recruits.ts` HP_MIN −20 → 2 fail; Raven maxHp 70 in `data.ts` → 2 fail | 21d804f |
| 3 | src/game/atlas.test.ts:65 | `OPEN_SECTORS` was compared with `SECTORS.filter(!locked).map(id)`, which is `atlas.ts:148` verbatim. | Fixed: literal `['na','sa','eu','af','as','oc']`, Antarctica locked (world-network.md rule 5) | Oceania `locked: true` → fails (old passed) | dd158e7 |
| 4 | src/game/abilities.test.ts:62-82 (RA-011 AC 42) | Only checked shape: two keys, not arrays, `typeof id === 'string'`. The `RoleKit` type already guarantees all of it. | Fixed: §8 active name and authored passive name per role | assault/recon kits swapped in `abilities.ts` → fails (old passed) | 2e2d6c5, then extended by the parent in 4cea907 |
| 5 | src/game/abilities.test.ts:96-98 (RA-011 AC 43) | `expect(operativeKit(op)).toBe(ROLE_ABILITIES[op.role])` restates `operativeKit`'s one-line body. | Fixed: Mara/Ghost/Dart/Torq → OVERDRIVE, PULSE SCAN, GHOST VEIL, FRAG CHARGE | same swap → fails (old passed) | 2e2d6c5 / 4cea907 |
| 6 | src/game/abilities.test.ts:118 (RA-011 duplicate role) | `toBe(ROLE_ABILITIES[base.role])`, the same restatement. | Fixed: literal assault kit names | same swap → fails (old passed) | 2e2d6c5 / 4cea907 |
| 7 | src/game/forecast.test.ts:41 | "Crisis doubles": expected `weight * CRISIS_EVENT_WEIGHT_MUL`, the code's own multiplier. | Fixed: `2 *` (living spec §5) | `CRISIS_EVENT_WEIGHT_MUL = 3` → fails | 04a959b |
| 8 | src/game/deployGate.test.ts:37 | "Allows exactly the mass limit" passed `MASS_LIMIT_KG` back into the gate. | Fixed: literal 400 kg | `MASS_LIMIT_KG = 399.9` → fails | 04a959b |
| 9 | src/game/mass.test.ts:115-118 (AC 69) | `massGateOk(MASS_LIMIT_KG ± 0.1)`: the limit is relative to itself. | Fixed: 399.9 / 400 / 400.1 | `MASS_LIMIT_KG = 399.9` → fails | 25d094b |
| 10 | src/game/mass.test.ts:136-139 | Tier lines were only ordered against each other, so no value was ever checked. The tier tests above it also use the constants as oracles. | Fixed: pins 340 / 380 / 400 kg and 0.15 m/s | `LIGHT_MASS_KG = 345` → pin fails | 25d094b |
| 11 | src/game/mass.test.ts:163-196 (RA-002 AC 46, AC 47) | The `bodyKg` helper re-implemented `operative_mass` inside the test. AC 47 subtracted it again. | Fixed: hand-worked bodies (Mara 73.9, Slate 67.8, Vex 72.4, Kestrel 64.9) and slot kg 0/8/6/16/14/12 | `OPERATIVE_BASE_KG = 61` → AC 46/47 fail; med kit 9 kg → AC 47 fails | 25d094b |
| 12 | src/game/mass.test.ts:321 (RA-005 AC 51) | Deployed "at exactly 400 kg" using `MASS_LIMIT_KG`. | Fixed: literal 400 | `MASS_LIMIT_KG = 399.9` → 4 cases fail | 25d094b |
| 13 | src/game/mass.test.ts:335-340 | The over-400 body expected `overKg = kg - MASS_LIMIT_KG`, a re-derivation. | Fixed: 423.9 kg body, 23.9 kg over | `MASS_LIMIT_KG = 399.9` → fails | 25d094b |
| 14 | src/game/mass.test.ts:330-331 (RA-005 AC 52) | `g.overKg.toFixed(1)` exercised JS `toFixed`, not the button copy. | Deleted the line; the parent tested the real copy in `src/ui/deployRefusal.test.ts` | *parent*: per its commit body, the new test asserts `0.1 KG OVER THE MASS LIMIT` from the real gate | db04a63 (parent) |
| 15 | src/state/campaignStore.test.ts:671-681 (RA-008 AC 5) | Only called lookups, then asserted the squad it had set. A regex over store keys was the only other check. It could not fail. | Deleted; the parent replaced it with `src/ui/assemblyRows.test.ts` against the real click handlers | *parent*: per its commit body, "making `read` also call toggle fails the AC 5 test" | f6a1d1a (parent) |
| 16 | src/state/campaignStore.test.ts:881 (RA-013 AC 19) | `D = injuryRecoverySec(f)` was used on both sides of the matcher. | Fixed: 98743 s for f = 0.2 | `injuryRecoverySec` `Math.round`→`Math.floor` → fails (old passed: both sides moved) | 1a3f655 |
| 17 | src/state/campaignStore.test.ts:900 (RA-013 AC 20) | Asserted that the test's own `survivorHp` fixture has keys op1, op3. | Deleted the line; the sim side ("survivorHp lists survivors only") was added to `world.test.ts` by the parent | *parent*: one real grenade kill → `survivorHp` keys exactly op1, op3, op4 | 1a3f655 (delete); 4545bed (parent, replacement) |
| 18 | src/state/campaignStore.test.ts:1073 (RA-015 AC 26) | Expected `hp + xpBonus(1).maxHp`. | Fixed: Mara 126 after one award, 128 after two | `XP_HP_PER = 3` → fails (old passed) | 1a3f655 |
| 19 | src/state/campaignStore.test.ts:1076-1095 (RA-015 AC 44) | Recomputed mass and speed with `operativeMassKg`, `crewBonus`, `tierSpeedDelta` and `xpBonus`. | Fixed: 124→126 HP, 73.9→74.4 kg, 4.75→4.8 m/s | `XP_HP_PER = 3` and `XP_SPEED_PER = 0.1` → fails (old passed both) | 1a3f655 |
| 20 | src/state/campaignStore.test.ts:1230 (RA-017 AC 72) | Each row's expected value was `Math.max(0, t0 + D - t1)`, recomputed in the test. | Fixed: hand-worked remaining column 0 / 8000 / 33 h / 0 / 1 s | `remainingDowntimeSec` off by one → 3 rows fail | 1a3f655 |
| 21 | src/state/campaignStore.test.ts:1273-1276 (RA-017 rounding edge) | `injuryLineHours(D) === Math.ceil(D / HOUR)` restates the helper. | Fixed: D 98743 s → 28 h | `Math.floor` break above → fails | 1a3f655 |
| 22 | src/state/campaignStore.test.ts:1428-1455 (RA-018 win clears every injury) | D values came from `injuryRecoverySec`, and the line hours were compared with `injuryLineHours` of those same values. | Fixed: 108000 / 169097 s, lines [30, 47] | `Math.floor` break → 169097.14 rounds the same, so this row was **not** independently re-failed; its oracles are literals now | 1a3f655 |
| 23 | src/state/campaignStore.test.ts:1607-1627 (RA-022 AC 27) | The envelope was `Math.min/max` over ROSTER (recruits.ts's own expression). The bays compared `wornAugs` with `currentIssue` (its own rule) inside the candidate loop, and nothing depended on the candidate. | Fixed: §8 92–132 HP / 4.2–5.6 m/s; four unpinned stock bays, checked once | recruit HP_MIN −40 → fails | 1a3f655 |
| 24 | src/state/campaignStore.test.ts:1757 (RA-023 AC 32) | `bay.node toBe currentIssue(done, slot)` restates `wornAugs`. | Fixed: NEURAL k-sensor, CHEST c-synaptic, ARMS k-targeting, LEGS stock | `currentIssue` returns the oldest project → fails (old passed) | 1a3f655 |

## Leads reviewed and not changed (not tautological)

| Lead | Evidence |
|---|---|
| RA-016 "squad assertion cannot fail through sync" (26b9fc8) | I made `campaignStore.sync` re-add a recovered operative to the squad. AC 22 and AC 40 both fail, so the assertion can fail. |
| RA-015 "Abort test does not drive the Hud.tsx abort path" (d43ba1a) | `Hud.onAbort` is `recordAbort` (telemetry) + `goto('world')`, and the test calls the real `goto`. I made `goto` from `mission` award +1 XP. The RA-015 abort test, RA-019 AC 1 and AC 3 all fail. The parent later ran the real abort path in RA-019 (e2a51ab). |
| RA-024 AC 39 "nearly duplicates WN-018" | It duplicates the test, but it can fail. Out of scope for this sweep, left as is. |
| `src/ui/filingStatus.test.ts`, `src/ui/armHints.test.ts` (abort hint) | They compare against `UNFILED_LINE` / `WRITE_FAILED_LINE` / `ABORT_ARM_HINT`. The copy is placeholder with no spec literal (story PV-017/018 notes). The tests do check which line each state routes to, and that part can fail. |
| `rng.test.ts:27-28`, `contracts.test.ts:550,746` | Self-equality is the determinism or identity-cache property under test. Non-seeded randomness or a cache miss fails them. |
| `toBeDefined()` hits (≈60, mostly `world.test.ts`) | Precondition guards before dereferencing a unit or entity. Real assertions follow each one. |
| `strategyAudio.test.ts` `vi.mock('./sound')` | It mocks the audio collaborator, not the unit under test (`bindStrategyBed`). |
| `worldStore.test.ts:1467` tax `Math.round(base × control/100 × strain)` | The strain values are literal per row (the GDD table). It is the formula applied to literal oracles, not the code's own constants. |

## Not covered

- Individual redundant shape lines inside otherwise strong tests (for example `Array.isArray(deploy.research)` after a literal `toEqual`) were left in place. They cannot make a test pass that would otherwise fail.
- Finding 22 has literal oracles now, but no source break specific to it was run.

## Verification

At the end of the sweep, with two uncommitted edits from the parent session present (`abilities.test.ts`, `appStore.test.ts`):
- `npm test`: 50 files, 1276 tests passed
- `npm run lint`: clean
- `npm run build`: built

Each commit body lists its own file-level check.
