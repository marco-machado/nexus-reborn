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
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
