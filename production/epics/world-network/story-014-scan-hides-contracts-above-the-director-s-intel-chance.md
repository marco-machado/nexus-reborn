# Story 014: Scan hides contracts above the director's Intel; Chance still prints

> **Epic**: World Network
> **Status**: Ready
> **Layer**: Foundation
> **Type**: UI
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/world-network.md`
**Requirement**: `TR-world-network-007`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0012: Store placement for Intel and generated contracts
**ADR Decision Summary**: Owner is not the Zustand module: Intel lives on campaignStore, generated contracts on worldStore; no economyStore.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules, manifest 2026-10-08).
- Forbidden: Deleting or mutating Economy records to hide them.
- Forbidden: Creating `src/state/economyStore.ts`.
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [ ] GIVEN intel < 2 vs intel ≥ 2 on the same contract, WHEN World Network chrome is read, THEN Chance still prints. (Risk index bands are Brief-only.)
- [ ] GIVEN an unexpired generated instance whose required Intel is greater than the director's Intel level, and whose gate is not Expedite-waived, WHEN Scan / OPEN CONTRACTS is read, THEN that instance is absent while Economy still holds its record.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Generated contracts live on `worldStore.contracts` / `contractRngState` / `nextContractT`; Economy owns the instances. Do not create `economyStore`, and do not delete hidden records.
- Hiding is a read-side filter only.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- GDD Open Question: locked offers counting toward the 3-offer cap is unresolved — do not change it here.

---

## QA Test Cases

From `/qa-plan` sprint 2 (2026-10-12). UI. No automated test file. Screenshots at 1280×720 in `production/qa/evidence/wn-014/`, plus a store read in the click-through note. Sign-off: qa-lead.

- The same contract prints Chance below intel 2 and at intel 2 or higher. Risk bands stay on Brief.
- An unexpired generated instance whose required Intel is greater than the director's Intel, and whose gate is not Expedite-waived, is absent from Scan and from OPEN CONTRACTS.
- That instance remains on `worldStore.contracts`. A screenshot of an empty row does not prove this. Record the contract id in the click-through note.
- Required Intel equal to the director's Intel is not hidden by this rule. An Expedite-waived gate is not hidden by this rule.
- Do not change whether locked offers count toward the 3-offer cap.
- Nothing clips or truncates at 1280×720.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each screen touched, in `production/qa/evidence/`, plus a click-through note naming the screens exercised (docs/click-through.md). Screens must work at 1280×720 without clipping or truncation.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 011
- Unlocks: None
