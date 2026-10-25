import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeSaveSystem } from './state/save'
import { initSettings } from './state/settingsStore'

// Settings first: binding overrides and accessibility classes must be live
// before any screen renders or any handler reads the table.
initSettings()
initializeSaveSystem()
// Perf harness only; the flag is unset in normal builds, so this is removed.
if (import.meta.env.VITE_PERF_HOOKS === '1') void import('./perfHooks')
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
