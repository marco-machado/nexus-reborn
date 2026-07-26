// CONTRACT FILE. Top level screen router. Screens live in src/ui.
import { useAppStore } from './state/appStore'
import { MainMenu, WorldMap, Research, MissionBrief, TeamSelect, Debrief } from './ui'
import MissionScreen from './ui/MissionScreen'

export default function App() {
  const phase = useAppStore((s) => s.phase)
  return (
    <div className="app-root">
      {phase === 'menu' && <MainMenu />}
      {phase === 'world' && <WorldMap />}
      {phase === 'research' && <Research />}
      {phase === 'brief' && <MissionBrief />}
      {phase === 'team' && <TeamSelect />}
      {phase === 'mission' && <MissionScreen />}
      {phase === 'debrief' && <Debrief />}
      <div className="crt-overlay" aria-hidden="true" />
    </div>
  )
}
