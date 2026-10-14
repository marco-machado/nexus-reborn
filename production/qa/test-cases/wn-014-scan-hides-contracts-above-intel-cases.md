# WN-014 — Scan hides contracts above the director's Intel; Chance still prints — Manual test cases

**Story**: `production/epics/world-network/story-014-scan-hides-contracts-above-the-director-s-intel-chance.md`
**Story type**: UI | **Evidence output**: `production/qa/evidence/wn-014/` (screenshots + store read in the click-through note) | **Gate**: BLOCKING (qa-lead sign-off)
**Build under test**: commit 41febe7 (flat SVG World Network map; not the uncommitted globe)
**Scope**: QA plan `production/qa/qa-plan-sprint-002-2026-10-12.md` § Manual QA Checklist → WN-014
**Automated coverage**: `src/game/contracts.test.ts` "intel visibility (WN-014)" covers `contractIntelReq` / `visibleContracts`. These cases cover the rendered Scan / OPEN CONTRACTS and the store read.
**Out of scope**: whether locked offers count toward the 3-offer cap. Do not record this as a finding.

## Common setup

- `npm run dev -- --strictPort`, http://localhost:4200, viewport 1280x720. Fresh New Operation → World Network → dismiss the orientation → **pause the clock** so no roll or expiry changes the market mid-test.
- Seed three generated contracts in North America, all unexpired. This is the same fixture as `production/qa/evidence/wn-014/drive.mjs`, but seeded in-session instead of through the save. Seeding via `setState` is acceptable for this UI check:
  ```js
  const { useCampaignStore } = await import('/src/state/campaignStore.ts')
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  const { contractIntelReq } = await import('/src/game/contracts.ts')
  const t = useWorldStore.getState().t
  const mk = (id, threat, expedited) => ({ id, createdT: t, expiresAtT: t + 48 * 3600, sector: 'na', cityId: 'nb', district: 5,
    type: 'SEIZURE', client: 'helix', threat, reward: 50000, seed: 1234 + id.length, priority: false, expedited })
  useWorldStore.setState({ contracts: [mk('gc-high', 'HIGH', false), mk('gc-severe', 'SEVERE', false), mk('gc-sev-exp', 'SEVERE', true)] })
  ```
  Required Intel: `gc-high` 2, `gc-severe` 3, `gc-sev-exp` 1 (Expedite-waived). Verify this with `useWorldStore.getState().contracts.map((c) => [c.id, contractIntelReq(c)])`.
- Focus North America (FOCUS NEXT until the panel reads NORTH AMERICA, or click its sector row).
- Codenames are derived from the seed. Map each row to an id by the row's `GENERATED` chip plus the console list. The prior run saw `gc-high` = IRON VESPER and `gc-sev-exp` = BROKEN LEDGER. Re-confirm, do not assume.

---

## Test Case: WN-014-01 — Chance prints on the same contract below and at/above intel 2

**Preconditions**: Common setup. Run at `useCampaignStore.setState({ intelLevel: 1 })`, then at `intelLevel: 2`, without reseeding.
**Steps**:
1. At intel 1, read the OPEN CONTRACTS rows for North America and record each `CHANCE n%` chip.
2. Set intel 2 and read the rows again.
3. Compare the `gc-sev-exp` row and the RUST HAVEN (authored) row across both levels.
**Expected Result**: `CHANCE n%` prints on every row at both levels, including the authored RUST HAVEN row while it is locked at intel 1. The same contract prints the same Chance at intel 1 and intel 2.
**Pass Criteria**: Chance is present on 100% of rows at both levels, and is equal for `gc-sev-exp` and RUST HAVEN across levels.
**Actual Result**:
**Pass/Fail**:

## Test Case: WN-014-02 — No risk index band on World Network chrome

**Preconditions**: As WN-014-01, intel 2.
**Steps**:
1. Read every OPEN CONTRACTS row's chips, the sector panel, and the Scan contract marker labels (hover / `aria-label`).
**Expected Result**: Rows carry only GENERATED/PRIORITY, CHANCE, ETA, and EXPIRY chips. No risk index band (LOW / GUARDED / HIGH / SEVERE risk label) appears on World Network. Risk bands are Brief-only.
**Pass Criteria**: Zero risk-band labels on the World Network screen.
**Actual Result**:
**Pass/Fail**:

## Test Case: WN-014-03 — Above-intel generated instance is absent, and its record remains (store read)

**Preconditions**: Common setup, `useCampaignStore.setState({ intelLevel: 2 })`. Target: `gc-severe` (required Intel 3 > director 2, not expedited, `expiresAtT > t`).
**Steps**:
1. Read the North America OPEN CONTRACTS rows and the counter (`open / total`).
2. Read the Scan contract markers (`.wm-marker` labels) for North America.
3. With the World Network still rendered, run:
   ```js
   const w = useWorldStore.getState(), c = useCampaignStore.getState()
   ;({ ids: w.contracts.map((x) => x.id), held: w.contracts.some((x) => x.id === 'gc-severe'),
      directorIntel: c.intelLevel, requiredIntel: contractIntelReq(w.contracts.find((x) => x.id === 'gc-severe')), t: w.t,
      expiresAtT: w.contracts.find((x) => x.id === 'gc-severe').expiresAtT })
   ```
4. Paste the output into the click-through note: contract id `gc-severe`, director Intel 2, required Intel 3, `held: true`.
5. Repeat steps 1–4 at `intelLevel: 1` with target `gc-high` (required 2 > 1).
6. Capture `wn-014-intel1-na-1280x720.png` and `wn-014-intel2-na-1280x720.png`.
**Expected Result**: The target instance has no OPEN CONTRACTS row and no Scan marker. `worldStore.contracts` still contains its id, unchanged (`expiresAtT > t`). The store read was taken after the Scan render.
**Pass Criteria**: The target is absent from both surfaces and `held === true` at both intel levels. A screenshot alone does not pass this case.
**Actual Result**:
**Pass/Fail**:

## Test Case: WN-014-04 — Required Intel equal to director Intel is not hidden

**Preconditions**: Common setup, `intelLevel: 2`. Target: `gc-high` (required 2 = director 2).
**Steps**:
1. Read the North America OPEN CONTRACTS rows and Scan markers.
2. Set `intelLevel: 3` and confirm `gc-severe` (required 3 = director 3) now shows. Capture `wn-014-intel3-na-1280x720.png`.
**Expected Result**: `gc-high` is listed at intel 2, and `gc-severe` is listed at intel 3. Each row is selectable (not locked) and prints Chance.
**Pass Criteria**: Equal-intel instances are present on both surfaces at both levels.
**Actual Result**:
**Pass/Fail**:

## Test Case: WN-014-05 — Expedite-waived gate is not hidden

**Preconditions**: Common setup, `intelLevel: 1`. Target: `gc-sev-exp` (SEVERE, `expedited: true`, required 1).
**Steps**:
1. Read the North America OPEN CONTRACTS rows and Scan markers.
2. Compare with `gc-severe`, which is identical except `expedited: false`.
**Expected Result**: `gc-sev-exp` is listed and has a marker. `gc-severe` is absent.
**Pass Criteria**: The waived instance is visible at intel 1 while its non-waived twin is hidden.
**Actual Result**:
**Pass/Fail**:

## Test Case: WN-014-06 — No clipping at 1280x720

**Preconditions**: The captures from WN-014-03 and WN-014-04.
**Steps**:
1. Inspect the OPEN CONTRACTS rows (codename, chips), the counter, and the Scan markers at intel 1, 2, and 3.
**Expected Result**: All row text and chips are fully visible, and the list scrolls rather than overflowing. The EXPIRY chip reads about 48H with this seed.
**Pass Criteria**: No truncated or overlapping text in any capture.
**Actual Result**:
**Pass/Fail**:

> Known advisory (story Completion Notes, not a failure here): the counter total counts shown offers only, and `NO CONTRACTS POSTED IN …` would be untrue if every offer in a sector were hidden.
