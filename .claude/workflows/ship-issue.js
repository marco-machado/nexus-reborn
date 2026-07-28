export const meta = {
  name: 'ship-issue',
  description: 'Plan a GitHub issue, implement it in a prepared worktree, then review and fix until clean',
  whenToUse: 'Driven by the /ship skill. args: {issue, title, body, comments, dir, maxRounds}',
  phases: [
    { title: 'Plan', detail: 'read the issue and the code it touches, split into workstreams' },
    { title: 'Implement', detail: 'one agent per workstream' },
    { title: 'Verify', detail: 'npm run lint && npm run build' },
    { title: 'Review', detail: 'reviewers across five dimensions' },
    { title: 'Confirm', detail: 'try to refute every finding before fixing it' },
    { title: 'Fix', detail: 'one fixer per file, then re-verify' },
  ],
}

// The caller may hand args through as an object or as a JSON string; accept both.
const input = typeof args === 'string' ? JSON.parse(args) : args

if (!input || !input.dir || !input.issue) throw new Error('ship-issue needs args {issue, title, body, dir}')

const DIR = input.dir
const ISSUE = input.issue
const MAX_ROUNDS = input.maxRounds || 3

const RULES = `
You are working ONLY inside the git worktree at ${DIR}. Every command must be rooted there
(\`git -C ${DIR} ...\`, \`cd ${DIR} && npm ...\`). Never read or edit files under any other
worktree or the main checkout. Do not commit, push, or touch git branches: the caller does that.

Read ${DIR}/CLAUDE.md first and obey it. The load-bearing parts:
- Four layers: src/game (pure TS sim), src/world/citygen.ts, src/scene (three.js under r3f), src/ui (DOM).
- Files whose header starts CONTRACT FILE carry cross-layer agreements; read the header before editing.
- Import from three/webgpu, never three. Node materials from three/tsl.
- The per-frame path allocates nothing: pools and buffers are preallocated and mutated in place.
- Randomness is seeded (mulberry32, hashOf/rngFrom). Screens are checked at 1280x720.
- No external asset files: everything is generated in code.
- Checks are \`npm run lint\` and \`npm run build\`. There is no test suite.
`

const ISSUE_TEXT = `
GitHub issue #${ISSUE}: ${input.title || '(no title)'}

${input.body || '(empty body)'}
${input.comments ? `\nIssue comments:\n${input.comments}` : ''}
`

const PLAN_SCHEMA = {
  type: 'object',
  required: ['summary', 'workstreams', 'acceptance'],
  properties: {
    summary: { type: 'string', description: 'What the issue actually asks for, in two or three sentences' },
    workstreams: {
      type: 'array',
      description: 'Independent chunks of work. Prefer one; split only when the file sets are disjoint.',
      items: {
        type: 'object',
        required: ['id', 'goal', 'files'],
        properties: {
          id: { type: 'string' },
          goal: { type: 'string', description: 'What this workstream changes and why' },
          files: { type: 'array', items: { type: 'string' }, description: 'Repo-relative paths this workstream will touch' },
        },
      },
    },
    acceptance: { type: 'array', items: { type: 'string' }, description: 'Checkable statements that mean the issue is done' },
    risks: { type: 'array', items: { type: 'string' } },
  },
}

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['file', 'summary', 'failure_scenario'],
        properties: {
          file: { type: 'string' },
          line: { type: 'number' },
          severity: { type: 'string', enum: ['blocking', 'major', 'minor'] },
          category: { type: 'string' },
          summary: { type: 'string' },
          failure_scenario: { type: 'string', description: 'Concrete inputs or state leading to the wrong result' },
          suggested_fix: { type: 'string' },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['real', 'reason'],
  properties: {
    real: { type: 'boolean' },
    reason: { type: 'string' },
  },
}

const DIMENSIONS = [
  {
    key: 'fidelity',
    prompt: `Does the staged diff actually satisfy every ask in the issue? Check each acceptance statement against the
code. Report anything asked for and not delivered, or delivered differently than asked. Silence on a point you
did not check is a bug in your review, so check them all.`,
  },
  {
    key: 'correctness',
    prompt: `Hunt for defects in the staged diff: wrong logic, off-by-one on grid cells, unhandled null/empty, state that
survives a mission restart, math that breaks at the city edge, ordering assumptions in the tick loop. For each one
give the concrete input or state that produces the wrong result.`,
  },
  {
    key: 'conventions',
    prompt: `Check the staged diff against CLAUDE.md: the four-layer split and its import directions, CONTRACT FILE headers,
three/webgpu vs three imports, the two-tier world/store access rule, seeded randomness, no external asset files,
citygen as the single source of road geometry.`,
  },
  {
    key: 'perf',
    prompt: `Check the per-frame path in the staged diff: allocations inside useFrame or rAF loops (new objects, array
literals, closures, string building), work that should be hoisted or pooled, per-frame store writes, and anything
that grows without bound. Also check that world.tick's catch-up behaviour is intact if it was touched.`,
  },
  {
    key: 'ui',
    prompt: `If the staged diff touches src/ui or CSS, check it at 1280x720: clipping, truncation, overflow, tokens taken
from src/index.css rather than hardcoded, and canvas-drawn UI kept in step with the CSS tokens. If the diff does
not touch UI, return an empty findings array.`,
  },
]

const diffCmd = `git -C ${DIR} add -A && git -C ${DIR} diff --cached origin/main`

// ---------------------------------------------------------------- plan

phase('Plan')
const plan = await agent(
  `${RULES}

${ISSUE_TEXT}

Read the issue above, then read the code it touches in ${DIR} until you know exactly what to change. Do NOT edit
anything: this is the planning pass. Produce workstreams whose file sets do not overlap. One workstream is the
normal answer; split only when the work genuinely lands in separate files. Acceptance statements must be things
a reviewer can check against the diff.`,
  { label: `plan:issue-${ISSUE}`, phase: 'Plan', schema: PLAN_SCHEMA },
)

if (!plan) throw new Error('planning agent returned nothing')
log(`plan: ${plan.workstreams.length} workstream(s), ${plan.acceptance.length} acceptance check(s)`)

const PLAN_TEXT = `
Plan summary: ${plan.summary}

Acceptance checks:
${plan.acceptance.map((a, i) => `${i + 1}. ${a}`).join('\n')}
${plan.risks && plan.risks.length ? `\nKnown risks:\n${plan.risks.map((r) => `- ${r}`).join('\n')}` : ''}
`

// ------------------------------------------------------------ implement

phase('Implement')

const implPrompt = (w) => `${RULES}

${ISSUE_TEXT}
${PLAN_TEXT}

Your workstream (${w.id}): ${w.goal}
Files you own: ${w.files.join(', ')}

Implement it in ${DIR}. Touch only the files you own plus any file that turns out to be strictly necessary for
them to compile. Match the surrounding code: same naming, same comment density, same idiom. Leave the changes
uncommitted. When done, run \`cd ${DIR} && npm run lint\` and fix what your own changes broke.

Return a short plain-text report: files changed and what changed in each.`

const files = plan.workstreams.map((w) => w.files || [])
const overlaps = files.some((a, i) => files.some((b, j) => j > i && a.some((f) => b.includes(f))))

let implReports = []
if (plan.workstreams.length === 1 || overlaps) {
  if (overlaps) log('workstream file sets overlap, implementing sequentially')
  for (const w of plan.workstreams) {
    const r = await agent(implPrompt(w), { label: `impl:${w.id}`, phase: 'Implement' })
    implReports.push(r)
  }
} else {
  implReports = await parallel(
    plan.workstreams.map((w) => () => agent(implPrompt(w), { label: `impl:${w.id}`, phase: 'Implement' })),
  )
}
implReports = implReports.filter(Boolean)

// --------------------------------------------------------------- verify

const verifyPrompt = `${RULES}

Run \`cd ${DIR} && npm run lint\` and \`cd ${DIR} && npm run build\`. Fix every error and warning they report,
then run both again. Repeat until both pass clean or you have made three attempts. Do not paper over a failure by
deleting the code that triggers it.

Return the final exit status of each command and, if either still fails, the verbatim failing output.`

phase('Verify')
const firstVerify = await agent(verifyPrompt, { label: 'verify:initial', phase: 'Verify' })

// ------------------------------------------------------- review and fix

let round = 0
let fixedTotal = 0
let unresolved = []
const history = []

while (round < MAX_ROUNDS) {
  round += 1
  phase('Review')

  const reviews = await parallel(
    DIMENSIONS.map((d) => () =>
      agent(
        `${RULES}

${ISSUE_TEXT}
${PLAN_TEXT}

Review round ${round}. Read the staged diff with:
  ${diffCmd}

${d.prompt}

Report only defects in the changed code, ranked most severe first. No praise, no style preferences, no findings
about code the diff did not touch. If you find nothing, return an empty findings array: that is a valid answer.`,
        { label: `review:${d.key}#${round}`, phase: 'Review', schema: FINDINGS_SCHEMA },
      ),
    ),
  )

  const found = reviews.filter(Boolean).flatMap((r) => r.findings || [])
  log(`round ${round}: ${found.length} raw finding(s)`)
  if (!found.length) {
    history.push({ round, raw: 0, confirmed: 0 })
    unresolved = []
    break
  }

  phase('Confirm')
  const judged = await parallel(
    found.map((f, i) => () =>
      agent(
        `${RULES}

A reviewer claims this defect exists in the staged diff (\`${diffCmd}\`):

  file: ${f.file}${f.line ? `:${f.line}` : ''}
  claim: ${f.summary}
  how it fails: ${f.failure_scenario}

Try to REFUTE it. Read the actual code and the code around it. The claim is refuted if the code already handles
the case, if the failing path cannot be reached, if the reviewer misread the control flow, or if it is a taste
preference rather than a defect. Default to real=false when you are not sure the defect is real.`,
        { label: `confirm:${f.file.split('/').pop()}#${round}-${i}`, phase: 'Confirm', schema: VERDICT_SCHEMA },
      ).then((v) => ({ finding: f, verdict: v })),
    ),
  )

  const confirmed = judged.filter(Boolean).filter((j) => j.verdict && j.verdict.real).map((j) => j.finding)
  history.push({ round, raw: found.length, confirmed: confirmed.length })
  log(`round ${round}: ${confirmed.length} confirmed after refutation`)

  if (!confirmed.length) {
    unresolved = []
    break
  }

  phase('Fix')
  const byFile = {}
  for (const f of confirmed) (byFile[f.file] = byFile[f.file] || []).push(f)

  await parallel(
    Object.keys(byFile).map((file) => () =>
      agent(
        `${RULES}

Fix these confirmed review findings in ${DIR}/${file}. Touch that file only, unless a fix genuinely requires a
matching change elsewhere, in which case make the smallest one that works.

${byFile[file]
  .map((f, i) => `${i + 1}. ${f.line ? `line ${f.line}: ` : ''}${f.summary}\n   how it fails: ${f.failure_scenario}${f.suggested_fix ? `\n   suggested: ${f.suggested_fix}` : ''}`)
  .join('\n\n')}

Fix the defect, not the symptom. Return one line per finding: what you changed, or why the finding needed no change.`,
        { label: `fix:${file.split('/').pop()}#${round}`, phase: 'Fix' },
      ),
    ),
  )

  fixedTotal += confirmed.length
  unresolved = confirmed

  phase('Verify')
  await agent(verifyPrompt, { label: `verify:round-${round}`, phase: 'Verify' })
}

if (unresolved.length) {
  log(`stopped at the ${MAX_ROUNDS}-round cap with ${unresolved.length} finding(s) fixed but not re-reviewed`)
}

// --------------------------------------------------------------- report

phase('Verify')
const finalCheck = await agent(
  `${RULES}

Run \`cd ${DIR} && npm run lint\` then \`cd ${DIR} && npm run build\`. Do not fix anything. Report the exit status
of each and, on failure, the verbatim failing output. Then run \`${diffCmd} --stat\` and report the file list.`,
  { label: 'verify:final', phase: 'Verify' },
)

return {
  issue: ISSUE,
  dir: DIR,
  planSummary: plan.summary,
  acceptance: plan.acceptance,
  workstreams: plan.workstreams.map((w) => ({ id: w.id, goal: w.goal, files: w.files })),
  implementation: implReports,
  reviewRounds: history,
  findingsFixed: fixedTotal,
  cappedWithUnreviewedFixes: unresolved.map((f) => `${f.file}: ${f.summary}`),
  initialVerify: firstVerify,
  finalVerify: finalCheck,
}
