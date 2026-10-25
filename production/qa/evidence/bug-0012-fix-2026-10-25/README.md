# BUG-0012 fix evidence (2026-10-25)

Fix: both World Network campaign banners take their `n / 3` count from one pure helper, `campaignBannerCount(banner, contractsWon)` in `src/ui/campaignBanner.ts`, which counts `campaignStore.contractsWon` (the source the CAMPAIGN COMPLETE banner already used). The failed banner's literal `0` is gone.

| File | What |
|---|---|
| `vitest-red.txt` | `src/ui/campaignBanner.test.ts` with the helper still returning `0 / 3` on a failed banner: 1 failed / 6 passed (`expected '0 / 3' to be '1 / 3'`) |
| `vitest-green.txt` | Same file after the fix: 7 passed |
| `vitest-full.txt` | `npx vitest run`: 68 files, 1672 tests passed |
| `lint.txt`, `build.txt` | `npm run lint`, `npm run build`: both exit 0 |
| `bug-0012-walk.mjs` | Headless re-walk (playwright-core + Chrome for Testing, 1280x720). Header copied from `sprint-011/probe.mjs` lines 22-60; real Debrief path (`reportMission` emptying the roster) as in `sprint-011-head-2026-10-24/if-016/if-016-handwalk.mjs` |
| `walk-output.txt` | Walk output: 4 PASS (the console copy, `run.log`, is gitignored by `*.log`) |
| `bug-0012-failed-no-wins-1280x720.png` | IF-016-04 variant A (wipe on m01): `0 / 3` |
| `bug-0012-failed-one-win-1280x720.png` | IF-016-04 variant B (win m01, wipe on m02): `1 / 3` |
| `bug-0012-complete-1280x720.png` | IF-016-06 (three wins): `3 / 3` |

Run: this worktree's dev server, `npx vite --port 4313 --strictPort`, then
`PROBE_URL=http://localhost:4313/ node production/qa/evidence/bug-0012-fix-2026-10-25/bug-0012-walk.mjs`.
The server was stopped after the walk and port 4313 confirmed free.
