# IF-003 contract navigation gates Brief, Assembly and Deploy — 2026-10-17

## Result and scope

- Result: **partial click-through; capture pass.** Every AC4/AC5/AC6 step below was driven with real UI clicks in headless Chrome at 1280x720 and observed. Unexercised: the failed-campaign Debrief (AC30, Story 011), a played-out mission to a Debrief (the Debrief was reached with a hand-built outcome, see Assists), Hardened difficulty and the replay variant in the browser (covered in `src/state/contractNavigation.test.ts` only).
- Story: `production/epics/interface/story-003-contract-navigation-gates-brief-assembly-and-deploy.md`; QA plan case IF-003.
- Changed behaviour: none visible. The nav gate was extracted unchanged from `src/ui/Nav.tsx` into `src/ui/navGates.ts` so it can be tested.

## Environment

| Field | Value |
| --- | --- |
| Revision | `1d6562c` plus the working-tree changes (`src/ui/navGates.ts`, `src/ui/Nav.tsx`, two test files, this directory, story and sprint-status bookkeeping), uncommitted |
| Tools | `npm run dev -- --strictPort` (port 4200), Node 24, playwright-core from the global `@playwright/cli`, Chrome for Testing headless |
| Rendering | `[scene] renderer backend: WebGPU, quality tier: HIGH`; viewport 1280x720 |
| Save | Fresh context, `localStorage.clear()`, New Operation |
| Console | No page errors, no HTTP >= 400 (`capture-output.txt`) |

## Observations (`capture-output.txt`, `capture.mjs`)

| Step | Observed | Evidence |
| --- | --- | --- |
| No contract: nav | BRIEF `locked`, `aria-disabled`, label "BRIEF // LOCKED // NO CONTRACT SELECTED"; the other three tabs open | `01-nav-no-contract-brief-locked.png` |
| Click locked BRIEF | phase stays `world` | `capture-output.txt` |
| Click ASSEMBLY | phase `team` (Assembly opens) | `02-assembly-reachable-no-contract.png` |
| Click DEPLOY TEAM | phase stays `team`, no mission; button reads "DEPLOY TEAM // NO CONTRACT SELECTED" with "SELECT A CONTRACT ON THE WORLD NETWORK" | `03-deploy-refusal-no-contract.png` |
| Select Glass Veil | phase `brief`, `missionId=m01`; BRIEF tab open | `04-nav-with-contract-brief-open.png` |
| Accept Contract | straight to Assembly (`team`), no second confirm | `capture-output.txt` |
| Deploy | phase `mission`, world built | `05-deployed-mission.png` |
| Brief vs deployed | all nine fields equal | `brief-vs-deployed.md` |
| Debrief, authored, non-failed campaign | REPLAY MISSION offered (count 1) | `06-debrief-authored-replay-offered.png` |
| Replay | phase `brief`, `missionId=m01` kept, no reselect | `07-replay-returns-to-brief.png` |
| Return to World Network | phase `world`, `missionId=null`, BRIEF locked again | `08-nav-after-debrief-return-brief-locked.png` |
| Debrief, generated contract (`gc95de7d1d`) | no REPLAY control (count 0) | `09-debrief-generated-no-replay.png` |

## Assists (named)

- The Debriefs were reached with `setOutcome` and a hand-built won, zero-pay outcome after the real Deploy, not by playing the mission. Debrief content is IF-009/IF-011.
- The Brief-vs-deployed table reads the live Brief DOM stats and the live world (`getWorld`) after the real Deploy click. The Brief column for Insertion, Extraction, Objectives and Opening hour is `buildTacticalMap` / the mission def, the same inputs the Brief renders; owner computation stays Brief/Tactical.
- The generated Debrief sets `missionId` to the board's generated offer id directly.

## Process

Dev server stopped after the run; no listener on 4200 (checked with `lsof`).
