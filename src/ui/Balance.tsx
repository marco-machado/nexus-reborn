// BALANCE dashboard: dev-facing aggregates over the local telemetry log, in
// the same terminal dress as the rest of the interface. Local only: it reads
// the localStorage records, EXPORT produces a JSON download through a data
// URL, and CLEAR erases the log behind a two-step confirm. No chart library:
// the bars are divs.
import { useEffect, useMemo, useState } from 'react'
import {
  TELEMETRY_CAP,
  aggregate,
  clearRecords,
  exportJson,
  loadRecords,
} from '../state/telemetry'
import { useSettingsStore } from '../state/settingsStore'
import { Panel } from './bits'
import { fmt } from './util'
import { uiClick } from './sound'

function mmss(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
}

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

  useEffect(() => {
    if (!clearArmed) return
    const id = window.setTimeout(() => setClearArmed(false), 3000)
    return () => window.clearTimeout(id)
  }, [clearArmed])

  const onExport = (): void => {
    uiClick()
    const a = document.createElement('a')
    a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(exportJson(records))
    a.download = 'nexus-balance.json'
    a.click()
  }

  const onClear = (): void => {
    uiClick()
    if (!clearArmed) {
      setClearArmed(true)
      return
    }
    clearRecords()
    setClearArmed(false)
    setSerial((s) => s + 1)
  }

  return (
    <div className="hud-menu-panel balance-panel">
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
                <Stat label="MISSIONS" value={String(agg.missions)} />
                <Stat
                  label="WIN RATE"
                  value={Math.round(agg.winRate * 100) + '%'}
                  tone={agg.winRate >= 0.5 ? 'teal' : 'red'}
                />
                <Stat label="MEAN DURATION" value={mmss(agg.meanDurationSec)} />
                <Stat
                  label="MEAN FIRST CONTACT"
                  value={agg.meanFirstContactSec === null ? '--' : mmss(agg.meanFirstContactSec)}
                />
                <Stat
                  label="COLLATERAL RATE"
                  value={Math.round(agg.collateralRate * 100) + '%'}
                  tone={agg.collateralRate > 0.5 ? 'red' : undefined}
                />
                <Stat label="CIVILIANS HIT" value={String(agg.civiliansHitTotal)} />
                <Stat label="OPERATIVES KIA" value={String(agg.kiaTotal)} tone={agg.kiaTotal > 0 ? 'red' : undefined} />
                <Stat label="MED / CELL USED" value={agg.medUsedTotal + ' / ' + agg.cellUsedTotal} />
                <Stat label="MEAN PAYOUT" value={fmt(Math.round(agg.meanPayout)) + ' CR'} />
                <Stat label="TOTAL PAYOUT" value={fmt(agg.totalPayout) + ' CR'} tone="teal" />
                <Stat
                  label="TOTAL FINES"
                  value={fmt(agg.totalFines) + ' CR'}
                  tone={agg.totalFines > 0 ? 'red' : undefined}
                />
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
            className={'btn' + (clearArmed ? ' amber' : '')}
            disabled={records.length === 0}
            aria-label={clearArmed ? 'Confirm erasing every record' : 'Clear the telemetry records'}
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
      </Panel>
    </div>
  )
}
