// BALANCE dashboard: dev-facing aggregates over the local telemetry log, in
// the same terminal dress as the rest of the interface. Local only: it reads
// the localStorage records, EXPORT produces a JSON download through a data
// URL, and CLEAR erases the log behind a two-step confirm. No chart library:
// the bars are divs.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useModalFocus } from './modalFocus'
import { TELEMETRY_CAP, aggregate, loadRecords } from '../state/telemetry'
import { useSettingsStore } from '../state/settingsStore'
import { Panel } from './bits'
import { fmt } from './util'
import { balanceStatRows } from './balanceStats'
import { uiClick } from './sound'
import { CLEAR_ARM_HINT, CLEAR_ARM_TIMEOUT_MS, downloadBalanceJson, pressClear } from './balanceActions'

function Stat(props: { label: string; value: string; tone?: string }) {
  return (
    <div className="bal-stat">
      <label>{props.label}</label>
      <b className={props.tone}>{props.value}</b>
    </div>
  )
}

function ShareBars(props: {
  title: string
  rows: Array<{ key: string; value: number; share: number }>
  format: (value: number) => string
  empty: string
}) {
  const max = props.rows[0]?.value ?? 0
  return (
    <div className="bal-section">
      <div className="hud-menu-group-head">{props.title}</div>
      {props.rows.length === 0 && <div className="dim mini">{props.empty}</div>}
      {props.rows.map((row) => (
        <div key={row.key} className="bal-bar-row">
          <span className="bal-bar-label">{row.key.toUpperCase()}</span>
          <span className="bal-bar-track">
            <i style={{ width: (max > 0 ? (row.value / max) * 100 : 0) + '%' }} />
          </span>
          <b className="bal-bar-val">
            {props.format(row.value)} // {Math.round(row.share * 100)}%
          </b>
        </div>
      ))}
    </div>
  )
}

export default function BalancePanel(props: { onClose: () => void }) {
  const telemetryOn = useSettingsStore((s) => s.telemetry)
  const [serial, setSerial] = useState(0)
  const [clearArmed, setClearArmed] = useState(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- serial invalidates the storage read
  const records = useMemo(() => loadRecords(), [serial])
  const agg = useMemo(() => aggregate(records), [records])
  // P-05 inside Settings: focus enters the dashboard and Tab stays in it.
  // Escape is Settings' (it peels the dashboard first); Settings puts focus
  // back on its OPEN control when the dashboard closes.
  const rootRef = useRef<HTMLDivElement | null>(null)
  useModalFocus(rootRef)

  useEffect(() => {
    if (!clearArmed) return
    const id = window.setTimeout(() => setClearArmed(false), CLEAR_ARM_TIMEOUT_MS)
    return () => window.clearTimeout(id)
  }, [clearArmed])

  const onExport = (): void => {
    uiClick()
    downloadBalanceJson(records)
  }

  const onClear = (): void => {
    uiClick()
    const step = pressClear(clearArmed)
    setClearArmed(step.armed)
    if (step.cleared) setSerial((s) => s + 1)
  }

  return (
    <div className="hud-menu-panel balance-panel" ref={rootRef}>
      <Panel
        title="BALANCE DATA"
        right={
          <span className="dim">
            LOCAL ONLY // {records.length}/{TELEMETRY_CAP} RECORDS
          </span>
        }
      >
        {records.length === 0 ? (
          <div className="bal-empty dim">
            NO MISSION RECORDS ON THIS TERMINAL.
            {telemetryOn
              ? ' COMPLETE A MISSION TO LOG THE FIRST ONE.'
              : ' ENABLE TELEMETRY IN SETTINGS TO START LOGGING.'}
          </div>
        ) : (
          <div className="bal-grid">
            <div className="bal-section">
              <div className="hud-menu-group-head">CAMPAIGN AGGREGATES</div>
              <div className="bal-stats">
                {balanceStatRows(agg).map((row) => (
                  <Stat key={row.label} label={row.label} value={row.value} tone={row.tone} />
                ))}
              </div>
            </div>
            <div className="bal-col">
              <ShareBars
                title="WEAPON DAMAGE SHARE"
                rows={agg.weaponDamage}
                format={(v) => fmt(Math.round(v))}
                empty="NO SQUAD FIRE RECORDED."
              />
              <ShareBars
                title="ABILITY USE BY ROLE"
                rows={agg.abilityUses}
                format={(v) => String(v)}
                empty="NO ROLE ABILITIES TRIGGERED."
              />
            </div>
          </div>
        )}
        <div className="hud-menu-actions">
          <button
            type="button"
            className="btn"
            disabled={records.length === 0}
            aria-label="Export the telemetry records as JSON"
            onClick={onExport}
          >
            EXPORT JSON
          </button>
          <button
            type="button"
            className={'btn' + (clearArmed ? ' armed' : '')}
            disabled={records.length === 0}
            aria-label={clearArmed ? 'CONFIRM // ERASE RECORDS? Erases every record' : 'CLEAR the telemetry records'}
            onClick={onClear}
          >
            {clearArmed ? 'CONFIRM // ERASE RECORDS?' : 'CLEAR'}
          </button>
          <button
            type="button"
            className="hud-btn pause"
            onClick={() => {
              uiClick()
              props.onClose()
            }}
          >
            CLOSE
          </button>
        </div>
        {/* P-01 armed-hint slot: always mounted (a polite live region that
            mounts with its text is not announced); disarm clears it silently. */}
        <div className="bal-arm-hint" role="status" aria-live="polite">
          {clearArmed ? CLEAR_ARM_HINT : ''}
        </div>
      </Panel>
    </div>
  )
}
