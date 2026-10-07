# Pre-Production sequence

**Date**: 2026-10-05
**Capacity**: The only named approver is the project owner. No external ship date is recorded. Do not invent one.
**Scope**: The closed eight-system cut in `design/gdd/systems-index.md`. The playable game is already in `src/`.

No sprint or epic files yet. Those are outputs of this phase, not inputs. Blocked-story count is not applicable.

## Order

1. Ledger Amber ruling — done in the design docs on 2026-10-05. Interface amber is price and spend authorization only.
2. Traceability matrix — `docs/architecture/requirements-traceability.md` matches registry v6.
3. CI — `.github/workflows/tests.yml` runs lint, test, and build. Tests stay colocated under `src/`; `tests/unit/` and `tests/integration/` hold example tests.
4. Vertical slice — after the amber ruling, not before.
5. QQ-02 — first implementation story. `DeployParams` / `startMission` lag Accepted ADR-0009 / ADR-0019. Not an open architecture question. Do not mint an ADR. Do not start a deploy-dependent story before it.

`docs/architecture/control-manifest.md` already exists. Do not regenerate it to enter this phase.
