# Nexus Reborn

A single-player browser game inspired by Syndicate. As the Operations Director of Nexus Global, inspect the World Network, fund research, accept contracts, and deploy one to four operatives into real-time isometric missions.

React 19 and Vite drive the interface; react-three-fiber and three.js drive the mission scene; Zustand holds campaign and HUD state. Runtime visual assets are generated in code.

## Run locally

### Prerequisites

- Node.js 24+ and npm. The repository does not pin a Node version; dependency versions are locked in [`package-lock.json`](package-lock.json). Use an even-numbered Node release compatible with the locked toolchain.
- A desktop browser with hardware-accelerated graphics, keyboard and mouse, and a viewport of at least 1280×720. Mobile and touch are outside the game's scope.
- No account, API credentials, or backend service is required for local play.

From the repository root:

```sh
npm ci
npm run dev -- --strictPort
```

Open the URL printed by Vite, normally `http://localhost:4200`. [`vite.config.ts`](vite.config.ts) uses `PORT` if set; `--strictPort` makes an occupied port an explicit error instead of silently choosing another. Stop the server with Ctrl+C when finished.

Start a **New Operation**, select an unlocked contract on the World Network, then proceed through Brief → Assembly → mission. The mission pause menu lists the current bindings; the complete control reference is in the [GDD](docs/game-design.md#13-controls).

### Browser and save expectations

- The mission uses three.js `WebGPURenderer`, whose initialization automatically falls back to WebGL2 when needed. The console prints `[scene] renderer backend: ...` and the resolved quality tier after initialization. A menu loading successfully does not verify mission rendering.
- Retained [architecture QA](docs/qa/city-architecture/README.md) covers WebGPU in the Codex in-app browser, not a browser/version compatibility matrix. WebGL2 fallback is implemented but was not exercised in that report. Record the actual backend when reporting a rendering problem.
- First deployment can pause while graphics pipelines initialize. If deployment does not complete, capture the console error, browser/version, GPU, backend if reported, and quality setting rather than assuming a particular cause.
- Campaign data is local to the browser origin. Reloading does not resume a mission in progress. **New Operation erases the current campaign**, but preserves settings. Use a separate browser profile for destructive QA; changing host or port also changes the storage origin.

## Verify a change

```sh
npm run lint
npm run test
npm run build
```

These are the required automated checks. `build` typechecks TypeScript and creates the production bundle in `dist/`; tests live beside their modules.

To inspect that production bundle locally:

```sh
npm run preview -- --port 4200 --strictPort
```

Stop the development server first if it occupies the same port. Preview is a local check, not a deployment service. For rendering, screen flow, input, audio, or persistence changes, also run the [click-through](docs/click-through.md) at 1280×720 and record actual coverage using the [QA record format](docs/qa/README.md). Automated checks alone do not establish a browser pass.

Stop every dev/preview server you start. On macOS, confirm the QA port is clear with:

```sh
lsof -nP -iTCP:4200 -sTCP:LISTEN
```

No listener output means the port is clear. If you used another port, check that one too; do not stop unrelated processes.

## Documentation map

| Need | Read | Authority / scope |
| --- | --- | --- |
| Understand the game and its rules | [Game design](docs/game-design.md) | Living specification, including acceptance criteria and explicitly pending targets |
| Use the right names | [Domain glossary](CONTEXT.md) | Canonical terminology, not a replacement for the rules |
| Understand settled decisions | [ADRs](docs/adr/) | Rationale and consequences; reopen decisions explicitly |
| Change code safely | [Engineering guidance](AGENTS.md) | Module boundaries, state lifetimes, rendering constraints, verification and contribution conventions |
| Exercise the player flow | [Click-through](docs/click-through.md) | Manual procedure; not evidence that a check has passed |
| Record or inspect verification | [QA records](docs/qa/README.md) | Reproducible record format and historical evidence index |
| Work on district rendering | [City architecture](docs/city-architecture.md) | Shared geometry/material kit, visibility behavior and scoped verification |
| Work on sound assets | [Audio sources and preparation](inspiration/audio/sfx/README.md) | Credits, checksums, rebuilding and playback checks |
| Work with issues | [Issue tracker](docs/agents/issue-tracker.md) | GitHub workflow and issue relationships |

The [styled GDD](docs/game-design.html) is a dated snapshot, not the living specification. Historical QA describes the revision and coverage recorded there, not a current whole-game pass. Code establishes implemented behavior; when it disagrees with the living specification, resolve the discrepancy rather than copying stale rules forward.
