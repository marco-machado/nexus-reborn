# QA records

Use the [click-through](../click-through.md) for the manual procedure and the [GDD acceptance criteria](../game-design.md#20-acceptance) for expected behavior. This page defines how to record evidence; it does not add new release gates or approve the pending playtest/performance targets.

## Existing evidence

| Record | Scope and limitations |
| --- | --- |
| [City architecture](city-architecture/README.md) | Dated visual matrix, route/input checks, raw frame-pacing data, and partial production click-through. No normal victory/debrief/replay coverage; exact hardware/browser versions were not recorded. |
| [World Network correction](../../design-qa.md) | Historical scoped visual/audio report. The screenshot reference is machine-local rather than bundled evidence; revision and exact environment were not recorded. |
| [Audio replacement verification](../../inspiration/audio/sfx/README.md#validation) | Dated asset checks and playback-harness observations. Menu/Settings browser coverage only; no mission playthrough. |

These are historical observations, not verification of the current checkout. Missing metadata must remain **not recorded** unless contemporaneous evidence establishes it. Do not fill an old report with today's machine details or reinterpret fixtures as normal play.

## Recording a run

For a new run, create a uniquely named directory under `docs/qa/` containing a `README.md` and the evidence needed to reproduce or inspect its claims. Use the template below. Keep the scope proportional: for documentation-only work, browser/GPU fields may be **not applicable**, with a reason.

- Record the exact tested revision with `git rev-parse HEAD` and working-tree state with `git status --short`. If uncommitted changes affect the result, identify those files and retain the relevant patch or another durable source reference; a base commit alone is insufficient. Exclude secrets and unrelated user work.
- Record full OS/browser versions, hardware/GPU, renderer backend, viewport/DPR, quality, and toolchain versions when relevant. “This machine” and “latest browser” are not reproducible identifiers.
- Describe save isolation and starting state, then enumerate mission id, seed, variant, Difficulty, sector snapshot, research, squad and loadout where they affect the result. Name developer fixtures and every artificial state change.
- Link evidence relative to the record. A machine-local absolute path is not portable evidence. If a required artifact cannot be retained, mark it unavailable and narrow the claim rather than implying that another contributor can inspect it.
- Separate observed outcomes from expected results and from unexecuted checks. Label each check **pass**, **fail**, **blocked**, or **not run**; explain the latter three. Record the actual command output summary and exit code, not just a checklist tick.
- For performance, capture the metric/tool, warmup, sample duration/count, scene activity, cold/warm cache, and approved comparison budget. Keep raw measurements. Compare like-for-like conditions; frame deltas are not GPU timestamp timings. Pending budgets remain pending, not a performance pass.
- A full click-through covers every required step. Otherwise list the screens/interactions exercised and omissions. Include console errors/warnings and known pre-existing defects without silently declaring them fixed.
- Record cleanup: stopped servers, listener checks for every port used, and removal of temporary test state. Do not stop unrelated services or overwrite a player's campaign.

## Copyable record template

Replace every placeholder; use **not applicable**, **not recorded** (historical evidence only), **blocked**, or **not run** with a reason where appropriate.

```markdown
# <Scope> QA — <date and timezone>

## Result and scope

- Result: <pass / fail / blocked / partial; state the boundary of this verdict>
- Requested checks: <acceptance criteria, issue or procedure links>
- Changed behavior under test: <scope>
- Excluded behavior: <explicit omissions>

## Source and environment

| Field | Recorded value |
| --- | --- |
| Tested revision | <full commit id> |
| Working-tree changes | <clean, or changed paths and retained patch/source reference> |
| Build and tools | <dev/production/fixture; Node/npm and relevant tool versions> |
| Machine | <hardware model, CPU, GPU, memory> |
| OS and browser | <full versions; browser/harness name> |
| Rendering | <actual backend; quality; viewport; DPR; refresh rate if measuring pacing> |
| Save and origin | <isolated profile/origin; fresh or specified starting state> |
| Mission setup | <id, seed, variant, Difficulty, sector, research, squad/loadout> |

## Procedure and observations

| Check | Reproduction steps / command | Expected | Observed | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| <check> | <exact steps, fixture changes, or command> | <observable result> | <actual result; command exit code> | <pass/fail/blocked/not run> | <relative link> |

## Browser coverage

- Screens and interactions exercised: <enumerate>
- Not exercised: <enumerate>
- Console errors and warnings: <observed output>
- Fixture use: <artificial state changes; distinguish from normal play>

## Performance, if in scope

- Protocol: <tool/metric, cold/warm cache, warmup, duration/count, scene activity>
- Baseline and comparison: <exact revisions, matching conditions, approved budget>
- Raw measurements: <relative link>
- Observed result and limits: <do not infer unmeasured hardware/backend results>

## Limitations and follow-up

<Failures, blocked checks, pre-existing issues, missing evidence, pending decisions.>

## Cleanup

<Servers stopped; actual listener-check commands/results for used ports;
temporary state removed; original campaign preserved.>
```
