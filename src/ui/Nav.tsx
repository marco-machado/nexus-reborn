// Shared chrome for the four Screens: header (title, subtitle, stats)
// and the destination nav. Brief stays locked until a contract is selected.
import type { ReactNode } from 'react'
import { useAppStore } from '../state/appStore'
import type { Phase } from '../state/appStore'
import { stamp, useWorldStore } from '../state/worldStore'
import { useCampaignStore } from '../state/campaignStore'
import { ROSTER_CAP } from '../game/recruits'
import { Chip, LockGlyph, NavGlyph } from './bits'
import type { NavKind } from './bits'
import { useWorldClock } from './clock'
import { act, fmt } from './util'
import { briefReachable, navTabGate } from './navGates'

const TABS: Array<{ key: NavKind; label: string; phase: Phase }> = [
  { key: 'world', label: 'WORLD NETWORK', phase: 'world' },
  { key: 'research', label: 'RESEARCH', phase: 'research' },
  { key: 'brief', label: 'BRIEF', phase: 'brief' },
  { key: 'assembly', label: 'ASSEMBLY', phase: 'team' },
]

// The clock chip subscribes on its own, so a strategic tick (20 Hz) re-renders
// one chip instead of the whole header, and nothing on World Network, whose
// header shows no clock.
function ClockChip() {
  const t = useWorldStore((s) => s.t)
  const s = stamp(t)
  return (
    <Chip tone="dim">
      {s.date} {s.clock}
    </Chip>
  )
}

function ScreenStats(props: { world: boolean }) {
  const credits = useAppStore((s) => s.credits)
  const influence = useWorldStore((s) => s.influence)
  const intelLevel = useCampaignStore((s) => s.intelLevel)
  const rosterN = useCampaignStore((s) => s.operatives.length)
  if (props.world) {
    return (
      <div className="wm-resources" aria-label="CAMPAIGN RESOURCES">
        <div className="wm-resource"><NavGlyph kind="world" size={22} /><span><small>CREDITS</small><b className="amber">{fmt(credits)} CR</b></span></div>
        <div className="wm-resource"><NavGlyph kind="research" size={22} /><span><small>INFLUENCE</small><b>{influence} PTS</b></span></div>
        <div className="wm-resource"><NavGlyph kind="brief" size={22} /><span><small>INTEL</small><b>{intelLevel}</b></span></div>
        <div className="wm-resource"><NavGlyph kind="assembly" size={22} /><span><small>ROSTER</small><b>{rosterN} <em>/ {ROSTER_CAP}</em></b></span></div>
      </div>
    )
  }
  return (
    <div className="screen-head-right">
      <ClockChip />
      <Chip tone="amber">CREDITS {fmt(credits)} CR</Chip>
      <Chip tone="dim">INFLUENCE {influence}</Chip>
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
  const briefOpen = briefReachable(missionId, contracts)
  return (
    <nav className="navtabs">
      {TABS.map((tab) => {
        const here = tab.key === props.current
        const { open, locked, reason } = navTabGate(tab.key, props.current, briefOpen)
        const cls = 'navtab' + (here ? ' active' : locked ? ' locked' : '')
        return (
          <span key={tab.key} className="navtab-wrap">
            <button
              type="button"
              className={cls}
              aria-current={here ? 'page' : undefined}
              aria-disabled={locked ? true : undefined}
              aria-label={locked ? tab.label + ' // LOCKED // ' + reason : tab.label}
              onClick={open && !here ? act(() => goto(tab.phase)) : undefined}
            >
              {locked ? (
                // P-06: the lock glyph, the word LOCKED and the condition are
                // printed on the tab, not left to a hover tip (IF-002).
                <>
                  <span className="navtab-locked-row">
                    <NavGlyph kind={tab.key} size={13} />
                    <span className="navtab-label">{tab.label}</span>
                    <span className="navtab-lock">
                      <LockGlyph size={9} />
                      LOCKED
                    </span>
                  </span>
                  <span className="navtab-cond">{reason}</span>
                </>
              ) : (
                <>
                  <NavGlyph kind={tab.key} size={here ? 15 : 13} />
                  <span className="navtab-label">{tab.label}</span>
                </>
              )}
            </button>
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
        <ScreenStats world={props.current === 'world'} />
      </header>
      {props.children}
      <NavTabs current={props.current} />
    </div>
  )
}
