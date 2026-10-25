// Perf-harness hook, loaded only in a build made with VITE_PERF_HOOKS=1
// (src/main.tsx). The harness reaches the stores and runtime by importing
// /src/... paths, which only the dev server serves; in a production bundle it
// calls these loaders instead, keyed by the same paths. Each loader is a
// dynamic import, so it resolves to the app's own module instance and does not
// pull the route-split mission chunk in early.
const loaders: Record<string, () => Promise<unknown>> = {
  '/src/state/appStore.ts': () => import('./state/appStore'),
  '/src/state/campaignStore.ts': () => import('./state/campaignStore'),
  '/src/state/missionStore.ts': () => import('./state/missionStore'),
  '/src/state/worldStore.ts': () => import('./state/worldStore'),
  '/src/game/runtime.ts': () => import('./game/runtime'),
}

;(window as unknown as { __nexus: typeof loaders }).__nexus = loaders
