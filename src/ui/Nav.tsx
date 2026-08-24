// Shared desk chrome for the four Screens: header (title, subtitle, stats)
// and the destination nav. Brief stays locked until a contract is selected.
import type { ReactNode } from 'react'
import { useAppStore } from '../state/appStore'
import type { Phase } from '../state/appStore'
import { resolveMission, stamp, useWorldStore } from '../state/worldStore'
import { useCampaignStore } from '../state/campaignStore'
import { ROSTER_CAP } from '../game/recruits'
import { Chip, NavGlyph } from './bits'
import type { NavKind } from './bits'
import { useWorldClock } from './clock'
import { act, fmt } from './util'

const TABS: Array<{ key: NavKind; label: string; phase: Phase }> = [
  { key: 'world', label: 'WORLD NETWORK', phase: 'world' },
  { key: 'research', label: 'RESEARCH', phase: 'research' },
  { key: 'brief', label: 'BRIEF', phase: 'brief' },
  { key: 'assembly', label: 'ASSEMBLY', phase: 'team' },
]

const BRIEF_LOCK = 'NO CONTRACT SELECTED'

function ScreenStats() {
  const t = useWorldStore((s) => s.t)
  const credits = useAppStore((s) => s.credits)
  const influence = useWorldStore((s) => s.influence)
  const intelLevel = useCampaignStore((s) => s.intelLevel)
  const rosterN = useCampaignStore((s) => s.operatives.length)
  const s = stamp(t)
  return (
    <div className="screen-head-right">
      <Chip tone="dim">
        {s.date} {s.clock}
      </Chip>
      <Chip tone="teal">CREDITS {fmt(credits)} CR</Chip>
      <Chip tone="amber">INFLUENCE {influence}</Chip>
      <Chip tone="dim">INTEL {intelLevel}</Chip>
      <Chip tone="dim">
        ROSTER {rosterN} / {ROSTER_CAP}
      </Chip>
    </div>
  )
}

export function NavTabs(props: { current: NavKind }) {
  const goto = useAppStore((s) => s.goto)
  const missionId = useAppStore((s) => s.missionId)
  const contracts = useWorldStore((s) => s.contracts)
  const briefOpen =
    missionId != null &&
    (contracts.some((c) => c.id === missionId) || resolveMission(missionId) != null)
  return (
    <nav className="navtabs">
      {TABS.map((tab) => {
        const here = tab.key === props.current
        const open = tab.key === 'brief' ? briefOpen : true
        const locked = !open && !here
        const cls = 'navtab' + (here ? ' active' : locked ? ' locked' : '')
        const reason = locked ? BRIEF_LOCK : undefined
        return (
          <span key={tab.key} className="navtab-wrap" title={reason}>
            <button
              type="button"
              className={cls}
              aria-current={here ? 'page' : undefined}
              aria-disabled={locked ? true : undefined}
              aria-label={locked ? tab.label + ' // LOCKED // ' + BRIEF_LOCK : tab.label}
              onClick={open && !here ? act(() => goto(tab.phase)) : undefined}
            >
              <NavGlyph kind={tab.key} size={here ? 15 : 13} />
              <span className="navtab-label">{tab.label}</span>
            </button>
            {locked && <span className="tip nav">{BRIEF_LOCK}</span>}
          </span>
        )
      })}
    </nav>
  )
}

export function ScreenChrome(props: {
  current: NavKind
  title: string
  subtitle?: ReactNode
  className: string
  children: ReactNode
}) {
  useWorldClock()
  return (
    <div className={'screen ' + props.className}>
      <header className="screen-head">
        <div>
          <h1 className="screen-title">{props.title}</h1>
          {props.subtitle}
        </div>
        <ScreenStats />
      </header>
      {props.children}
      <NavTabs current={props.current} />
    </div>
  )
}
