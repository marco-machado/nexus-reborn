# Web stack — Version Reference

Last verified: 2026-09-08

| Field | Value |
|-------|-------|
| **Engine Version** | three.js 0.185.1 (r185); React 19.2.8; @react-three/fiber 9.6.1; Vite 6.4.3; TypeScript 5.8.3; Zustand 5.0.14 |
| **Project Pinned** | 2026-09-08 |
| **LLM Knowledge Cutoff** | May 2025 |
| **Risk Level** | HIGH — pinned three.js r185 published 2026-07-01; React 19.2.0 published 2025-10-01. Both are past cutoff. |

Pins match `package-lock.json` on 2026-09-08. Do not treat npm `latest` as the project version.

npm `latest` the same day (not pinned): three 0.186.0, Vite 8.2.2, @react-three/fiber 9.7.0. Those are upgrades. Use `/setup-engine upgrade`, not this pin.

## Post-Cutoff Version Timeline

three.js releases after the May 2025 cutoff (GitHub `published_at`):

| Tag | Published | In this pin? |
|-----|-----------|--------------|
| r176 | 2025-04-23 | Last release clearly inside cutoff |
| r177 | 2025-05-30 | Edge / treat as post-cutoff |
| r178 | 2025-06-30 | No — historical |
| r179 | 2025-08-02 | No |
| r180 | 2025-09-03 | No |
| r181 | 2025-11-19 | No |
| r182 | 2025-12-10 | No |
| r183 | 2026-02-20 | No |
| r184 | 2026-04-16 | No |
| **r185** | **2026-07-01** | **Yes — 0.185.1** |
| r186 | 2026-09-08 | No — do not use |

React: 19.0.0 (2024-12-05) may be in training data. 19.1.0 (2025-03-28) is near the edge. **19.2.0 (2025-10-01) and 19.2.8 are post-cutoff.**

@react-three/fiber 9.0.0 is React 19 support. Pinned 9.6.1.

## Official sources

- three.js Migration Guide: https://github.com/mrdoob/three.js/wiki/Migration-Guide
- three.js r185 notes: https://github.com/mrdoob/three.js/releases/tag/r185
- r3f changelog: https://github.com/pmndrs/react-three-fiber/blob/master/packages/fiber/CHANGELOG.md
- r3f v9 migration: https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide
- React 19.2 changelog: https://github.com/facebook/react/blob/main/CHANGELOG.md
- React 19.2 post: https://react.dev/blog/2025/10/01/react-19-2

## How to use these docs

1. Read this file for the pin and risk.
2. Check `deprecated-apis.md` before suggesting three.js / r3f APIs.
3. Check `breaking-changes.md` for r176 → r185 and r3f 8 → 9.
4. Read `modules/` for WebGPU, TSL, or r3f work.
5. `web_search` any API that is not in these files or in `src/`.

Run `/setup-engine refresh` after bumping the lockfile. Run `/setup-engine upgrade` to move the pin (does not edit `src/`).
