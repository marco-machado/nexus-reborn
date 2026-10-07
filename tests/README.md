# Test Infrastructure

**Engine**: React 19.2.8 + Vite 6.4.3 + three.js 0.185.1
**Test Framework**: Vitest (`npm run test`)
**CI**: `.github/workflows/tests.yml`
**Setup date**: 2026-10-05

The shipping suite stays next to its modules under `src/`. These directories are the gate layout. They hold example tests that import the same modules. Do not move the colocated suite here to satisfy a path.

## Directory Layout

```
tests/
  unit/           # Isolated logic tests
  integration/    # Cross-module tests
```

## Running Tests

```
npm run test     # vitest run — src/**/*.test.ts and tests/**/*.test.ts
npm run lint
npm run build
```

Playwright is not a project runner. Do not add it to CI.
