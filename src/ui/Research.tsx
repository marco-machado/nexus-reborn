// Research Division screen. Three branch columns of hex nodes over one project
// list, a lab per branch, and a detail panel that funds the selected project.
// Every benefit line is generated from the effect the mission applies, so the
// panel cannot promise a change the game does not make.
import { useMemo, useState } from 'react'
import { useAppStore } from '../state/appStore'
import { stamp, useWorldStore } from '../state/worldStore'
import {
  committedFunds,
  labsRunning,
  nodeState,
  runProgress,
  useResearchStore,
} from '../state/researchStore'
import type { LabRun, Labs, NodeState } from '../state/researchStore'
import {
  BRANCHES,
  NODES,
  benefitIsGain,
  benefitOf,
  branchDef,
  nodeById,
  nodeTitle,
  nodesOfBranch,
} from '../game/research'
import type { Branch, ResearchNode } from '../game/research'
import { Chip, LockGlyph, Panel, ScrollBox, SegBar } from './bits'
import { researchShape } from './researchGlyphs'
import { NavTabs } from './Nav'
import { useWorldClock } from './clock'
import { fmt, pad2 } from './util'
import { uiClick } from './sound'
/* ------------------------------- geometry --------------------------------- */
// One branch column is drawn as a single scaled SVG, so the hexes and the
// links between them stay aligned at any panel width.
const VIEW_W = 200
const VIEW_H = 400
const HEX_W = 46
const HEX_H = 32
// The selection ring grows past the outer columns, so the box carries a margin.
const VIEW_PAD = 8
const COL_X = [50, 150, 100]
const ROW_Y = [40, 146, 252, 358]
function nodeXY(n: ResearchNode): { x: number; y: number } {
  return { x: COL_X[n.col], y: ROW_Y[n.row] }
}
function hexPoints(cx: number, cy: number, grow = 0): string {
  const w = HEX_W + grow
  const h = HEX_H + grow
  const pts: Array<[number, number]> = [
    [cx - w, cy],
    [cx - w / 2, cy - h],
    [cx + w / 2, cy - h],
    [cx + w, cy],
    [cx + w / 2, cy + h],
    [cx - w / 2, cy + h],
  ]
  return pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')
}
function linkPath(from: ResearchNode, to: ResearchNode): string {
  const a = nodeXY(from)
  const b = nodeXY(to)
  const y0 = a.y + HEX_H
  const y1 = b.y - HEX_H
  if (Math.abs(a.x - b.x) < 0.5) return 'M' + a.x + ' ' + y0 + 'V' + y1
  const mid = (y0 + y1) / 2
  return 'M' + a.x + ' ' + y0 + 'V' + mid + 'H' + b.x + 'V' + y1
}
/* -------------------------------- helpers --------------------------------- */
function act(fn: () => void): () => void {
  return () => {
    uiClick()
    fn()
  }
}
function spanLabel(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? h + 'H ' + pad2(m) + 'M' : m + 'M'
}
const STATE_LABEL: Record<NodeState, string> = {
  researched: 'RESEARCHED',
  active: 'IN PROGRESS',
  available: 'AVAILABLE',
  locked: 'LOCKED',
}
const STATE_TONE: Record<NodeState, 'green' | 'amber' | 'teal' | 'dim'> = {
  researched: 'green',
  active: 'amber',
  available: 'teal',
  locked: 'dim',
}
/* --------------------------------- tree ----------------------------------- */
// The rising fill of a running project. Subscribes to world time on its own so
// the rest of the tree repaints only when a project state changes.
function HexFill(props: { node: ResearchNode; run: LabRun }) {
  const t = useWorldStore((s) => s.t)
  const p = runProgress(props.run, t)
  const { x, y } = nodeXY(props.node)
  const h = HEX_H * 2 * p
  return (
    <>
      <clipPath id={'rs-clip-' + props.node.id}>
        <polygon points={hexPoints(x, y)} />
      </clipPath>
      <rect
        className="rs-hex-fill"
        x={x - HEX_W}
        y={y + HEX_H - h}
        width={HEX_W * 2}
        height={h}
        clipPath={'url(#rs-clip-' + props.node.id + ')'}
      />
    </>
  )
}
function HexNode(props: {
  node: ResearchNode
  state: NodeState
  run: LabRun | null
  selected: boolean
  onSelect: (id: string) => void
}) {
  const n = props.node
  const { x, y } = nodeXY(n)
  const select = act(() => props.onSelect(n.id))
  return (
    <g
      className={'rs-node ' + props.state + (props.selected ? ' sel' : '')}
      role="button"
      tabIndex={0}
      aria-pressed={props.selected}
      aria-label={nodeTitle(n) + ' // ' + branchDef(n.branch).name + ' // ' + STATE_LABEL[props.state]}
      onClick={select}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        select()
      }}
    >
      {props.selected && <polygon className="rs-hex-ring" points={hexPoints(x, y, 6)} />}
      <polygon className="rs-hex" points={hexPoints(x, y)} />
      {props.run && <HexFill node={n} run={props.run} />}
      <g className="rs-node-glyph" transform={'translate(' + (x - 12) + ' ' + (y - 26) + ')'}>
        {researchShape(n.glyph)}
      </g>
      {n.lines.map((line, i) => (
        <text key={i} className="rs-node-label" x={x} y={y + 10 + i * 11} textAnchor="middle">
          {line}
        </text>
      ))}
      {props.state === 'locked' && (
        <g className="rs-node-lock" transform={'translate(' + (x + 30) + ' ' + (y - 24) + ')'}>
          <path d="M1.4 5V3.6a2.6 2.6 0 0 1 5.2 0V5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <rect x="0" y="5" width="8" height="5.6" fill="currentColor" />
        </g>
      )}
    </g>
  )
}
function BranchColumn(props: {
  branch: Branch
  done: string[]
  labs: Labs
  selected: string
  onSelect: (id: string) => void
}) {
  const nodes = useMemo(() => nodesOfBranch(props.branch.id), [props.branch.id])
  const run = props.labs[props.branch.id]
  return (
    <div className="rs-branch">
      <div className="rs-branch-head">
        <b>{props.branch.name}</b>
        <i className="dim">// {props.branch.sub}</i>
      </div>
      <svg
        className="rs-branch-svg"
        viewBox={-VIEW_PAD + ' 0 ' + (VIEW_W + VIEW_PAD * 2) + ' ' + VIEW_H}
        preserveAspectRatio="xMidYMin meet"
      >
        <g className="rs-links">
          {nodes.map((n) =>
            n.needs.map((id) => {
              const from = nodeById(id)
              const open = props.done.includes(id)
              const lit = open && (props.done.includes(n.id) || run?.id === n.id)
              return (
                <path
                  key={id + '>' + n.id}
                  className={'rs-link' + (lit ? ' live' : open ? ' open' : '')}
                  d={linkPath(from, n)}
                />
              )
            }),
          )}
        </g>
        {nodes.map((n) => (
          <HexNode
            key={n.id}
            node={n}
            state={nodeState(n, props.done, props.labs)}
            run={run && run.id === n.id ? run : null}
            selected={n.id === props.selected}
            onSelect={props.onSelect}
          />
        ))}
      </svg>
    </div>
  )
}
/* -------------------------------- side panels ----------------------------- */
function TimeChips() {
  const t = useWorldStore((s) => s.t)
  const s = stamp(t)
  return (
    <>
      <Chip tone="dim">DATE {s.date}</Chip>
      <Chip tone="dim">TIME {s.clock}</Chip>
    </>
  )
}
function LabRow(props: { branch: Branch; run: LabRun | null; onSelect: (id: string) => void }) {
  const t = useWorldStore((s) => s.t)
  const run = props.run
  if (!run) {
    return (
      <div className="rs-lab">
        <span className="rs-lab-top">
          <b>{props.branch.lab}</b>
          <i className="dim">IDLE</i>
        </span>
        <i className="dim mini">NO PROJECT AUTHORIZED</i>
      </div>
    )
  }
  const node = nodeById(run.id)
  const p = runProgress(run, t)
  return (
    <button
      type="button"
      className="rs-lab live"
      onClick={act(() => props.onSelect(run.id))}
      aria-label={props.branch.lab + ' RUNNING ' + nodeTitle(node) + ' // ' + Math.round(p * 100) + '%'}
    >
      <span className="rs-lab-top">
        <b>{props.branch.lab}</b>
        <i className="amber">{Math.round(p * 100)}%</i>
      </span>
      <span className="rs-lab-name">{nodeTitle(node)}</span>
      <SegBar value={p * 100} tone="amber" mini />
      <i className="dim mini">EST {spanLabel(run.endT - t)} REMAINING</i>
    </button>
  )
}
function ProgressBlock(props: { run: LabRun }) {
  const t = useWorldStore((s) => s.t)
  const p = runProgress(props.run, t)
  return (
    <div className="rs-box rs-prog">
      <div className="rs-prog-top">
        <label>PROGRESS</label>
        <b className="rs-prog-pct">{Math.round(p * 100)}%</b>
        <span className="dim">EST {spanLabel(props.run.endT - t)}</span>
      </div>
      <SegBar value={p * 100} tone="amber" />
    </div>
  )
}
function ReqRow(props: { id: string; met: boolean }) {
  return (
    <div className={'rs-req' + (props.met ? ' met' : '')}>
      <span className="rs-req-mark" aria-hidden="true">
        {props.met ? (
          <svg viewBox="0 0 12 12">
            <path d="M2 6.4 4.8 9.2 10 3.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        ) : (
          <LockGlyph size={8} />
        )}
      </span>
      <span>{nodeTitle(nodeById(props.id))}</span>
    </div>
  )
}
function DetailPanel(props: { node: ResearchNode; done: string[]; labs: Labs }) {
  const credits = useAppStore((s) => s.credits)
  const spendCredits = useAppStore((s) => s.spendCredits)
  const start = useResearchStore((s) => s.start)
  const n = props.node
  const branch = branchDef(n.branch)
  const state = nodeState(n, props.done, props.labs)
  const run = props.labs[n.branch]
  const labBusy = run !== null && run.id !== n.id
  const short = credits < n.cost
  const can = state === 'available' && !labBusy && !short
  let sub = 'COMMITS ' + fmt(n.cost) + ' CR // ' + n.hours + 'H IN ' + branch.lab
  if (state === 'researched') sub = 'PROJECT COMPLETE // APPLIED ON EVERY DEPLOYMENT'
  else if (state === 'active') sub = 'RUNNING IN ' + branch.lab
  else if (state === 'locked') sub = 'PREREQUISITES NOT MET'
  else if (labBusy) sub = branch.lab + ' ENGAGED // ONE PROJECT PER LAB'
  else if (short) sub = 'INSUFFICIENT FUNDS // ' + fmt(n.cost - credits) + ' CR SHORT'
  return (
    <Panel
      title={nodeTitle(n)}
      right={<Chip tone={STATE_TONE[state]}>{STATE_LABEL[state]}</Chip>}
      className="rs-detail"
      bodyClassName="rs-detail-body"
    >
      <ScrollBox className="rs-detail-list" dep={n.id}>
        <div className="rs-schematic">
          <span className={'rs-schematic-art corners ' + state}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {researchShape(n.glyph)}
            </svg>
          </span>
          <span className="rs-spec">
            <span className="kv mini">
              <span>BRANCH</span>
              <b>{branch.name}</b>
            </span>
            <span className="kv mini">
              <span>LABORATORY</span>
              <b>{branch.lab}</b>
            </span>
            <span className="kv mini">
              <span>TIER</span>
              <b>{n.row + 1}</b>
            </span>
            <span className="kv mini">
              <span>RUN TIME</span>
              <b>{n.hours}H</b>
            </span>
            <span className="kv mini">
              <span>FUNDING</span>
              <b className="amber">{fmt(n.cost)} CR</b>
            </span>
            {n.augSlot && (
              <span className="kv mini">
                <span>AUG BAY</span>
                <b>{n.augSlot}</b>
              </span>
            )}
          </span>
        </div>
        <div className="rs-box">
          <label>DESCRIPTION</label>
          <p className="rs-blurb">{n.blurb}</p>
        </div>
        {state === 'active' && run && <ProgressBlock run={run} />}
        <div className="rs-cols">
          <div className="rs-box">
            <label>PREREQUISITES</label>
            {n.needs.length === 0 ? (
              <div className="rs-req met">
                <span className="rs-req-mark" aria-hidden="true">
                  <svg viewBox="0 0 12 12">
                    <path d="M2 6.4 4.8 9.2 10 3.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </span>
                <span>NONE</span>
              </div>
            ) : (
              n.needs.map((id) => <ReqRow key={id} id={id} met={props.done.includes(id)} />)
            )}
          </div>
          <div className="rs-box">
            <label>PROJECTED BENEFIT</label>
            {n.effects.map((e, i) => {
              const b = benefitOf(e)
              return (
                <div key={i} className="rs-benefit">
                  <b className={benefitIsGain(e) ? 'teal' : 'red'}>{b.line}</b>
                  <i className="dim">{b.scope}</i>
                </div>
              )
            })}
          </div>
        </div>
      </ScrollBox>
      <button
        type="button"
        className="cta rs-auth"
        disabled={!can}
        aria-label={'AUTHORIZE ' + nodeTitle(n) + ' // ' + sub}
        onClick={act(() => {
          // Bill only a lab that actually took the project, and only against
          // the balance as it stands now, so the two stores cannot drift.
          if (useAppStore.getState().credits < n.cost) return
          if (start(n, useWorldStore.getState().t)) spendCredits(n.cost)
        })}
      >
        <span className="cta-inner">AUTHORIZE PROJECT</span>
      </button>
      <div className={'rs-auth-sub' + (can ? '' : ' off')}>{sub}</div>
    </Panel>
  )
}
/* -------------------------------- the screen ------------------------------ */
export function Research() {
  const credits = useAppStore((s) => s.credits)
  const done = useResearchStore((s) => s.done)
  const labs = useResearchStore((s) => s.labs)
  const [selected, setSelected] = useState(NODES[0].id)
  useWorldClock()
  const node = nodeById(selected)
  const open = useMemo(
    () => NODES.filter((n) => nodeState(n, done, labs) === 'available').length,
    [done, labs],
  )
  const running = labsRunning(labs)
  const committed = committedFunds(labs)
  return (
    <div className="screen rs">
      <header className="rs-head">
        <div>
          <h1 className="screen-title">RESEARCH DIVISION</h1>
          <div className="screen-sub">CORPORATE R&amp;D NETWORK // ADVANCING TOMORROW</div>
        </div>
        <div className="rs-head-right">
          <div className="rs-chips">
            <TimeChips />
            <Chip tone="dim">USER: RD_ADMIN_01</Chip>
            <Chip tone="teal">FUNDS {fmt(credits)} CR</Chip>
          </div>
          <div className="rs-level">
            <span className="rs-level-label">RESEARCH PROGRAM</span>
            <SegBar value={(done.length / NODES.length) * 100} tone="green" />
            <b className="rs-level-n">
              {done.length} / {NODES.length}
            </b>
          </div>
        </div>
      </header>
      <div className="rs-main">
        <aside className="rs-left">
          <Panel title="DIVISION OVERVIEW" className="rs-overview">
            <div className="kv">
              <span>PROJECTS COMPLETE</span>
              <b className="green">{done.length}</b>
            </div>
            <div className="kv">
              <span>PROJECTS RUNNING</span>
              <b className="amber">{running} / 3</b>
            </div>
            <div className="kv">
              <span>READY TO AUTHORIZE</span>
              <b className="teal">{open}</b>
            </div>
            <div className="kv">
              <span>COMMITTED FUNDS</span>
              <b>{fmt(committed)} CR</b>
            </div>
            <div className="kv">
              <span>AVAILABLE FUNDS</span>
              <b className="teal">{fmt(credits)} CR</b>
            </div>
          </Panel>
          <Panel title="LABORATORY STATUS" className="rs-labs" bodyClassName="rs-labs-body">
            {BRANCHES.map((b) => (
              <LabRow key={b.id} branch={b} run={labs[b.id]} onSelect={setSelected} />
            ))}
          </Panel>
        </aside>
        <section className="rs-tree corners">
          <div className="rs-branches">
            {BRANCHES.map((b) => (
              <BranchColumn
                key={b.id}
                branch={b}
                done={done}
                labs={labs}
                selected={selected}
                onSelect={setSelected}
              />
            ))}
          </div>
          <div className="rs-legend">
            <span className="rs-legend-item researched">
              <i />
              RESEARCHED
            </span>
            <span className="rs-legend-item active">
              <i />
              IN PROGRESS
            </span>
            <span className="rs-legend-item available">
              <i />
              AVAILABLE
            </span>
            <span className="rs-legend-item locked">
              <i />
              LOCKED
            </span>
            <span className="rs-legend-note dim">
              ONE PROJECT PER LAB // PROJECTS RUN ON WORLD TIME
            </span>
          </div>
        </section>
        <aside className="rs-right">
          <DetailPanel node={node} done={done} labs={labs} />
        </aside>
      </div>
      <NavTabs current="research" />
    </div>
  )
}
