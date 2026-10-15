# Story 018: Write failure never reports filed

> **Epic**: Persistence and validation
> **Status**: Complete
> **Layer**: Core
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-15

## Context

**GDD**: `design/gdd/persistence-and-validation.md`
**Requirement**: `TR-persistence-009`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0022: Durable-commit (filing) status  
**Secondary ADRs**: ADR-0011: Campaign persistence envelope
**ADR Decision Summary**: A session-only status store, written only by save.ts, reports filed / unfiled / write-failed.
**ADR Version**: 2026-10-08 (ADR `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: `getItem` read-back after `setItem`; classifying with `instanceof DOMException`.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [x] GIVEN recorded campaign C0 and the next campaign-blob write is injected to throw (harness; not a named storage key), WHEN New Operation is confirmed, THEN the session does not throw; in-session desk matches new-Operation fixture F; the Interface write-failure indicator is present and the erase is not reported as filed; WHEN the origin reloads to Menu, THEN Continue loads C0.
- [x] GIVEN snapshot S, Debrief applied in this session, and the next Screen campaign-blob write is injected to throw (harness; not a named storage key), WHEN the director returns to the World Network or Replays to Brief, THEN the session does not throw and filing-status does not read filed; WHEN reload then Continue, THEN named campaign fields equal S.
- [x] GIVEN snapshot S, Debrief applied in this session, and every campaign-blob write injected to throw (harness), WHEN the director visits World Network and then Research, THEN the session does not throw and filing status stays unfiled on each Screen; WHEN the injection is removed and the next Screen write succeeds, THEN filing status reads filed and reload + Continue restores the post-apply campaign values. (GDD Edge Cases: "If write storage throws": a swallowed write is not filed.)

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Storage throws swallow at the writer, which marks `write-failed` with a `quota` / `unavailable` / `unknown` reason; `write-failed` is sticky against `markUnfiled`.
- `startNewOperation` sets `filed` or `write-failed` after the in-memory reset. Inject the throw via harness, not a named storage key.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- None beyond the epic boundary.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-006-2026-10-15.md` (Sprint 6). Type: Integration.*

**Automated**: `src/state/save.test.ts`.
- Write throws on New Operation: no throw, desk = F, failure indicator shown, reload loads C0
- Write throws after Debrief: no throw, not filed, reload gives S
- Writes keep throwing: unfiled on each Screen; first success files it
- Edge: Inject the throw through the storage seam, not a named key

**Gap**: **Source change** (needs PV-017's status).

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/state/save.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/save.test.ts` (8 PV-018 tests) + `src/ui/filingStatus.test.ts`

---

## Dependencies

- Depends on: Story 002, Story 007, Story 017
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-15
**Criteria**: 3/3 passing (all covered by automated tests; AC1 indicator also observed in `production/qa/evidence/pv-018/`)
**Deviations**:
- ADVISORY: AC2/AC3 say "does not read filed" / "stays unfiled"; implemented as sticky `write-failed` (never `filed`) per ADR-0022 and this story's Implementation Notes. AC wording could be aligned.
- ADVISORY: Write-failure copy `SAVE FAILED // CAMPAIGN NOT FILED` is a placeholder pending /ux-design. UX P-11 names `ERASE FAILED // SAVE NOT ERASED` for the erase case; the status store does not distinguish erase from write, so one generic sentence covers both (ADR-0022 allows one message for all reasons).
- ADVISORY: The notice is persistent, not dismissible (P-11 toasts are dismissible); it is the Screen's only failure channel and clears on the next successful write.
- OUT OF SCOPE (valid): `src/App.tsx` (CONTRACT FILE, router) mounts `WriteFailureNotice` on world/research/brief/team; new `src/ui/WriteFailureNotice.tsx`; `src/ui/filingStatus.ts` + `src/ui/ui.css` — needed for AC1's Interface indicator.
- Estimate: story header says 1.0 d; sprint-status says 0.5 d.
**Test Evidence**: Integration: `src/state/save.test.ts` (nested describe "write failure never reports filed", 8 tests) and `src/ui/filingStatus.test.ts`; full suite 1146/1146 passed locally, lint and build clean. Screenshots: `production/qa/evidence/pv-018/`.
**Code Review**: Complete — /code-review APPROVED WITH SUGGESTIONS (lead-programmer CLEAN; ui-programmer: live region mounted with its text → fixed, region now always mounted; qa-tester: reason assertions and two edge cases → added). Remaining untested: a quota error name outside the three classified names reads `unknown` (by design).
