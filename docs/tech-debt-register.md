## Technical Debt Register
Last updated: 2026-10-10
Total items: 4 | Estimated total effort: 3S + 1M

| ID | Category | Description | Files | Effort | Impact | Priority | Status | Added | Sprint |
|----|----------|-------------|-------|--------|--------|----------|--------|-------|--------|
| TD-001 | Test | AC3 (Menu/Mission/Debrief leave `t` unchanged) is covered only by source-text scans, not a runtime phase check; the 1s-stall `advanceDays` spy cannot fail today; constant-pinning asserts are not behavior tests — from production/epics/world-network/story-001-strategic-clock-runs-only-on-the-four-screens.md | src/ui/clock.test.ts, src/state/worldStore.test.ts | M | Med | — | Open | 2026-10-10 | Backlog |
| TD-002 | Test | Untested clock-loop paths: stall after a partial accumulator, 2x/4x speed, stall while paused, `useWorldClock` effect wiring — from production/epics/world-network/story-001-strategic-clock-runs-only-on-the-four-screens.md | src/ui/clock.ts, src/ui/clock.test.ts | S | Med | — | Open | 2026-10-10 | Backlog |
| TD-003 | Code Quality | `startWorldClock` step reads `useWorldStore.getState().t` directly instead of through an injected sink; `CLOCK_BATCH_SEC` lacks a `/** */` doc comment — from production/epics/world-network/story-001-strategic-clock-runs-only-on-the-four-screens.md | src/ui/clock.ts | S | Low | — | Open | 2026-10-10 | Backlog |
| TD-004 | Code Quality | First-frame `dt` may be slightly negative (pre-existing; `last` is taken before the first rAF timestamp). Changing the behavior needs owner sign-off — from production/epics/world-network/story-001-strategic-clock-runs-only-on-the-four-screens.md | src/ui/clock.ts | S | Low | — | Open | 2026-10-10 | Backlog |
