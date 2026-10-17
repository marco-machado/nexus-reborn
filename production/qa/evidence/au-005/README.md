# AU-005 audio smoke QA — 2026-10-17 (local time)

Partial click-through, "Audio changes" step 4 of [docs/click-through.md](../../../../docs/click-through.md#audio-changes).
Smoke coverage and console diagnostics only. Per the story AC, this is not proof of cue
admission or drop; that proof is the automated evidence in `src/game/audio.test.ts`
(describes "clip-decode freshness evidence (AU-005)" and "module-load freshness evidence (AU-005)").

## Result and scope

- Result: partial — pass for the screens exercised; listening checks not run.
- Requested checks: story `production/epics/audio/story-005-unavailable-and-late-audio-never-burst.md`, click-through note.
- Changed behavior under test: one-shot freshness window (`src/game/audioFreshness.ts`) on clip decode and UI module load.
- Excluded behavior: no listening (unattended run, no audio output observed), no World Network, Brief, Assembly, mission or debrief; Settings sliders not moved (to leave the existing local settings and campaign save untouched).

## Source and environment

| Field | Recorded value |
| --- | --- |
| Tested revision | e59b1cc69975f543dc07aff6d4f5a3586d5464f1 |
| Working-tree changes | Uncommitted AU-005 changes: `src/game/audioFreshness.ts` (new), `src/game/audio.ts`, `src/ui/sound.ts`, `src/game/audio.test.ts`, `inspiration/audio/sfx/README.md` |
| Build and tools | Vite dev server (`npm run dev -- --strictPort`, port 4200); Node v24.16.0 |
| OS and browser | macOS (Darwin 25.5.0); Claude desktop in-app browser, Chrome/152.0.7977.149 |
| Rendering | Not applicable (menu screens only); viewport 1024x768 for Settings, 1280x720 for the menu screenshot; DPR 1 |
| Save and origin | Existing local save at http://localhost:4200 ("Campaign on file"); not modified |
| Cache | Fresh dev-server start; browser HTTP cache not cleared, so a cold cache is not verified |

## Procedure and observations

| Check | Steps | Expected | Observed | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| Module and clip load | Load Menu, click OPEN SETTINGS twice in quick succession | `audioFreshness.ts`, `audio.ts` and SFX clips load without errors | Network: `src/game/audioFreshness.ts`, `src/game/audio.ts` and all `inspiration/audio/sfx/*.mp3` returned 200 | pass | [00-settings-open-1024x768.jpg](00-settings-open-1024x768.jpg) |
| Console diagnostics | Read console filtered on "udio" and "decod", and errors filtered on "audio" | No loading or decoding failures | No matching messages. Only Vite HMR WebSocket reconnect errors from before the server started | pass | — |
| Play not blocked | Close Settings, return to Menu at 1280x720 | Menu stays interactive | Menu rendered with CONTINUE, NEW OPERATION, SETTINGS | pass | [01-menu-after-settings-1280x720.jpg](01-menu-after-settings-1280x720.jpg) |
| No delayed burst (listening) | — | No replayed click burst | Not observed by ear | not run — unattended, no audio output | — |

## Cleanup

Dev server stopped; `lsof -iTCP:4200 -sTCP:LISTEN` returned no listener. Viewport emulation reset.
