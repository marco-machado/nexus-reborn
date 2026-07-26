// Bottom nav strip shared by the strategy screens. Two destinations are built;
// the rest carry the intel lock and say what would open them.
import { useAppStore } from '../state/appStore'
import type { Phase } from '../state/appStore'
import { INTEL_GATE } from '../game/data'
import { LockGlyph, NavGlyph } from './bits'
import type { NavKind } from './bits'
import { uiClick } from './sound'

const TABS: Array<{ key: NavKind; label: string; phase?: Phase }> = [
  { key: 'world', label: 'WORLD MAP', phase: 'world' },
  { key: 'brief', label: 'BRIEFING' },
  { key: 'research', label: 'RESEARCH', phase: 'research' },
  { key: 'operatives', label: 'OPERATIVES' },
  { key: 'archives', label: 'ARCHIVES' },
]

export function NavTabs(props: { current: NavKind }) {
  const goto = useAppStore((s) => s.goto)
  return (
    <nav className="navtabs">
      {TABS.map((tab) => {
        const here = tab.key === props.current
        const open = tab.phase !== undefined
        const cls = 'navtab' + (here ? ' active' : open ? '' : ' locked')
        return (
          <span key={tab.key} className="navtab-wrap" title={open ? undefined : INTEL_GATE}>
            <button
              type="button"
              className={cls}
              aria-current={here ? 'page' : undefined}
              aria-disabled={open ? undefined : true}
              aria-label={open ? tab.label : tab.label + ' // LOCKED // ' + INTEL_GATE}
              onClick={
                open && !here
                  ? () => {
                      uiClick()
                      goto(tab.phase as Phase)
                    }
                  : undefined
              }
            >
              <NavGlyph kind={tab.key} size={here ? 15 : 13} />
              <span className="navtab-label">{tab.label}</span>
              {!open && (
                <span className="navtab-lock">
                  <LockGlyph size={9} />
                </span>
              )}
            </button>
            {!open && <span className="tip nav">{INTEL_GATE}</span>}
          </span>
        )
      })}
    </nav>
  )
}
