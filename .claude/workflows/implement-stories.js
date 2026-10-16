export const meta = {
  name: 'implement-stories',
  description: 'Run story-readiness → dev-story → code-review → story-done on each sprint story, in order, committing each one',
  whenToUse: 'Implement the open stories of the current sprint (or a given list) one at a time, stopping on the first story that is not ready or fails.',
  phases: [
    { title: 'Plan', detail: 'clean-tree check; open stories from sprint-status.yaml in order' },
    { title: 'Readiness', detail: '/story-readiness' },
    { title: 'Implement', detail: '/dev-story' },
    { title: 'Review', detail: 'specialist agents, then /code-review; one fix pass and a re-review on blocking findings' },
    { title: 'Done', detail: '/story-done' },
    { title: 'Commit', detail: 'one commit per completed story' },
    { title: 'Finish', detail: 'confirm no dev server is left on port 4200' },
  ],
}

// args (all optional):
//   stories: string[]  story file paths, in order. Default: open stories from
//                      production/sprint-status.yaml in priority order.
//   limit:   number    stop after this many stories.
//   commit:  boolean   commit each completed story to the current branch
//                      before starting the next one. Default: true.
//
// Stories run strictly one after another: they share modules and depend on
// each other, so a failure stops the run rather than skipping ahead. Each
// story is committed before the next starts, so review sees only that story's
// diff and a stopped run leaves earlier stories safely committed. With commit
// on, the run refuses to start on a dirty working tree.

const HEADLESS = `You run unattended inside a workflow; nobody can answer questions.
Where the skill would ask the user, take its recommended/default option and note it.
If a decision genuinely needs the owner (design change, scope cut, missing input), stop and report it as a blocker instead of guessing.`

const VERIFY = 'run npm run lint, npm run test and npm run build'

const PLAN = {
  type: 'object',
  properties: {
    stories: { type: 'array', items: { type: 'string' } },
    blocked: { type: 'array', items: { type: 'string' }, description: 'file paths of stories with status "blocked"' },
  },
  required: ['stories', 'blocked'],
}
const TREE = {
  type: 'object',
  properties: {
    branch: { type: 'string' },
    dirty: { type: 'array', items: { type: 'string' }, description: 'git status --porcelain lines, empty if clean' },
  },
  required: ['branch', 'dirty'],
}
const STEP = {
  type: 'object',
  properties: {
    ok: { type: 'boolean', description: 'true only if this step fully succeeded' },
    summary: { type: 'string' },
    blockers: { type: 'array', items: { type: 'string' } },
  },
  required: ['ok', 'summary', 'blockers'],
}
const BUILD = {
  type: 'object',
  properties: {
    ...STEP.properties,
    files: {
      type: 'array',
      items: { type: 'string' },
      description: 'repo-relative paths of every source and test file this step created or changed; not the story file or production/sprint-status.yaml',
    },
  },
  required: [...STEP.required, 'files'],
}
const REVIEW = {
  type: 'object',
  properties: {
    verdict: { type: 'string', description: 'the verdict line the code-review skill printed' },
    blocking: { type: 'array', items: { type: 'string' }, description: 'findings that must be fixed before the story is done' },
    advisory: { type: 'array', items: { type: 'string' } },
  },
  required: ['verdict', 'blocking', 'advisory'],
}
const COMMIT = {
  type: 'object',
  properties: {
    ok: { type: 'boolean', description: 'true only if the commit landed and the working tree is clean' },
    sha: { type: 'string' },
    summary: { type: 'string' },
    blockers: { type: 'array', items: { type: 'string' } },
  },
  required: ['ok', 'sha', 'summary', 'blockers'],
}
const PORT = {
  type: 'object',
  properties: {
    free: { type: 'boolean', description: 'true if nothing listens on port 4200 when you finish' },
    summary: { type: 'string' },
  },
  required: ['free', 'summary'],
}

const SPECIALIST = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          line: { type: 'number' },
          severity: { type: 'string', enum: ['blocking', 'advisory'] },
          claim: { type: 'string' },
          evidence: { type: 'string' },
        },
        required: ['file', 'line', 'severity', 'claim', 'evidence'],
      },
    },
  },
  required: ['summary', 'findings'],
}

// The code-review skill's Phase 7 specialists, from project.yaml `specialists`:
// code → lead-programmer, ui → ui-programmer, shader → technical-artist,
// additional → gameplay-programmer (simulation code), plus qa-tester for
// testability. Engine "Web" has no primary <engine>-specialist.
function specialistsFor(files) {
  const team = ['lead-programmer', 'qa-tester']
  if (files.some((f) => f.startsWith('src/ui/') || f.endsWith('.tsx'))) team.push('ui-programmer')
  if (files.some((f) => f.startsWith('src/game/'))) team.push('gameplay-programmer')
  if (files.some((f) => /\.(glsl|wgsl|frag|vert)$/.test(f) || /^src\/scene\/.*(shader|material)/i.test(f))) team.push('technical-artist')
  return team
}

const opts = args ?? {}
const commit = opts.commit ?? true

// Marks the story stopped and says why, so the reason is visible without
// opening the return value.
function stopAt(record, step, result, blockers = result?.blockers) {
  record.stopped = step
  const why = result
    ? [result.summary, ...(blockers ?? [])].filter(Boolean).join(' | ')
    : 'agent returned nothing (skipped or died)'
  log(`✗ ${record.name} stopped at ${step}: ${why}`)
}

phase('Plan')
if (commit) {
  const tree = await agent(
    'Run git branch --show-current and git status --porcelain. Return the branch and every status line verbatim. Change nothing.',
    { schema: TREE, effort: 'low', label: 'check working tree' },
  )
  if (!tree) {
    log('✗ Could not check the working tree; nothing was started.')
    return { completed: [], stopped: { step: 'preflight' }, notAttempted: opts.stories ?? [] }
  }
  if (tree.dirty.length) {
    log(`✗ Working tree on ${tree.branch} is dirty (${tree.dirty.length} paths); commit or stash first, or pass commit: false. Nothing was started.`)
    return { completed: [], stopped: { step: 'preflight', dirty: tree.dirty }, notAttempted: opts.stories ?? [] }
  }
  log(`Committing each story to ${tree.branch}`)
}

let stories = opts.stories
if (!stories?.length) {
  const plan = await agent(
    `Read production/sprint-status.yaml. Return in "stories" the "file" path of every story whose status is neither "done" nor "blocked", ordered must-have, should-have, unplanned, nice-to-have, keeping file order within each priority. A story in "review" status still needs /story-done, so include it. Return the "file" path of every "blocked" story in "blocked".`,
    { schema: PLAN, effort: 'low', label: 'read sprint status' },
  )
  stories = plan?.stories ?? []
  if (plan?.blocked?.length) log(`Skipping blocked: ${plan.blocked.map((s) => s.split('/').pop()).join(', ')}`)
}
if (opts.limit) stories = stories.slice(0, opts.limit)
log(`${stories.length} stories queued: ${stories.map((s) => s.split('/').pop()).join(', ')}`)

const results = []
for (const story of stories) {
  const name = story.split('/').pop().replace(/\.md$/, '')
  const record = { story, name, steps: {} }
  results.push(record)

  const ready = await agent(
    `Invoke the story-readiness skill (Skill tool) on ${story}. ${HEADLESS}
ok=true only if the verdict lets implementation start. If the story is already implemented (status review/in code), say so in summary and set ok=true.`,
    { phase: 'Readiness', schema: STEP, label: `ready:${name}` },
  )
  record.steps.readiness = ready
  if (!ready?.ok) { stopAt(record, 'readiness', ready); break }

  const built = await agent(
    `Invoke the dev-story skill (Skill tool) on ${story}. ${HEADLESS}
If the story is already implemented and its tests pass, verify that instead of rewriting it, and list the files its implementation touched.
Before returning, ${VERIFY}; ok=true only if all three pass. Stop any dev server you started. Do not commit.`,
    { phase: 'Implement', schema: BUILD, label: `dev:${name}` },
  )
  record.steps.implement = built
  if (!built?.ok) { stopAt(record, 'implement', built); break }
  if (!built.files.length) { stopAt(record, 'implement', built, ['dev-story reported no changed files to review']); break }
  let files = built.files

  // Workflow subagents have no Agent tool, so /code-review cannot spawn its
  // Phase 7 specialists itself. Run them here as their own agent types and
  // hand their findings to the review agent.
  const reviewStory = async (label) => {
    const team = specialistsFor(files)
    const found = await parallel(team.map((type) => () => agent(
      `You are the ${type} specialist for the /code-review of ${story}. Review these files: ${files.join(' ')}.
${type === 'qa-tester'
  ? `Read the story's ## Acceptance Criteria and ## QA Test Cases. Check: every AC maps to a test that can fail when the code is wrong (no tautologies: asserting a constant against itself, recomputing the formula in the test, asserting only what the test set up); test hooks are exposed; no AC is untestable as implemented; new edge cases the QA cases miss; side effects that should have a test. For a UI story, check that the manual verification state is reachable.`
  : `Review from your specialty: correctness, the story's ADRs and the CLAUDE.md guardrails (per-frame data out of React state, deterministic RNG, CONTRACT FILE headers, layer boundaries), standards and architecture.`}
Do not edit any file. Every finding must give file, line and evidence (quoted code, or the concrete input that triggers it). Report nothing you cannot point to.`,
      { phase: 'Review', schema: SPECIALIST, agentType: type, label: `${label}:${type}:${name}` },
    ).then((r) => r && { ...r, specialist: type })))
    const ran = found.filter(Boolean)
    const missing = team.filter((t) => !ran.some((r) => r.specialist === t))
    return agent(
      `Invoke the code-review skill (Skill tool) with arguments: ${files.join(' ')} ${story}. ${HEADLESS}
Phase 7 specialists already ran in this workflow as their own agents; do not try to spawn them. Use their findings below as the Phase 7 results, and verify each one as the skill requires (VERIFIED or UNVERIFIED).
${ran.length ? ran.map((r) => `### ${r.specialist}: ${r.summary}\n${r.findings.map((f) => `- ${f.file}:${f.line} [${f.severity}] ${f.claim} — evidence: ${f.evidence}`).join('\n') || '- no findings'}`).join('\n\n') : '(none ran)'}
${missing.length ? `These specialists did not return, so the verdict is NOT ASSESSED; name them: ${missing.join(', ')}.` : ''}
Do not edit files. Classify each finding as blocking (bug, broken acceptance criterion, CLAUDE.md guardrail breach) or advisory.`,
      { phase: 'Review', schema: REVIEW, label: `${label}:${name}` },
    )
  }

  let review = await reviewStory('review')
  record.steps.review = review
  if (!review) { stopAt(record, 'review', null); break }
  if (review.blocking.length) {
    const fixed = await agent(
      `Fix these blocking review findings for ${story}:\n- ${review.blocking.join('\n- ')}\n${HEADLESS}
Then ${VERIFY}; ok=true only if every finding is fixed and all three pass. In files, list every file you changed. Do not commit.`,
      { phase: 'Review', schema: BUILD, label: `fix:${name}` },
    )
    record.steps.fix = fixed
    if (!fixed?.ok) { stopAt(record, 'review fix', fixed); break }
    files = [...new Set([...files, ...fixed.files])]

    review = await reviewStory('re-review')
    record.steps.rereview = review
    if (!review) { stopAt(record, 're-review', null); break }
    if (review.blocking.length) {
      stopAt(record, 're-review', { summary: `still blocking after one fix pass: ${review.verdict}` }, review.blocking)
      break
    }
  }
  const reviewNote = `${record.steps.fix ? 'blocking findings were fixed and the re-review' : '/code-review'} returned "${review.verdict}". Advisory findings: ${review.advisory.length ? `\n- ${review.advisory.join('\n- ')}` : 'none'}`

  const done = await agent(
    `Invoke the story-done skill (Skill tool) on ${story}. ${HEADLESS}
Code review already ran in this workflow on ${files.join(', ')}: ${reviewNote}
Where the skill asks whether /code-review ran, answer that it did with the result above. Record the advisory findings in the story's Completion Notes.
ok=true only if the story is marked Complete in its file and in production/sprint-status.yaml. Do not commit.`,
    { phase: 'Done', schema: STEP, label: `done:${name}` },
  )
  record.steps.done = done
  if (!done?.ok) { stopAt(record, 'story-done', done); break }

  if (commit) {
    const committed = await agent(
      `Commit the changes for ${story} to the current branch. ${HEADLESS}
Stage explicitly: ${files.join(' ')} ${story} production/sprint-status.yaml, plus any QA evidence under production/qa/evidence/ for this story and any other file the summaries below say the skills wrote for it. production/session-state/ is gitignored; never force-add it. Stage nothing else.
Follow the Commit Style section of CLAUDE.md: imperative subject, then a body that says what changed by file, why, and what was verified (lint, test, build, review). Use the summaries below for the body.
Do not push, amend, or skip hooks; if a hook fails, fix the cause and commit again.
ok=true only if the commit exists and git status --porcelain is empty afterwards; if leftover changes remain, list them in blockers instead of committing them. Return the commit's short sha.

Readiness: ${ready.summary}
Implement: ${built.summary}
Review: ${record.steps.fix ? `${record.steps.fix.summary}. ` : ''}${reviewNote}
Done: ${done.summary}`,
      { phase: 'Commit', schema: COMMIT, label: `commit:${name}` },
    )
    record.steps.commit = committed
    if (!committed?.ok) { stopAt(record, 'commit', committed); break }
  }
  log(`✓ ${name}${record.steps.commit ? ` (${record.steps.commit.sha})` : ''}`)
}

let port = null
if (results.length) {
  port = await agent(
    `Check for a listener on port 4200 (lsof -nP -iTCP:4200 -sTCP:LISTEN). If it is this project's vite dev or preview server, stop it and check again. Do not kill any other process. free=true only if nothing listens on 4200 when you finish.`,
    { phase: 'Finish', schema: PORT, effort: 'low', label: 'port 4200' },
  )
  if (!port?.free) log(`⚠ Port 4200 not confirmed free: ${port?.summary ?? 'check did not run'}`)
}

const completed = results.filter((r) => !r.stopped).map((r) => r.story)
const stopped = results.find((r) => r.stopped)
const skipped = stories.slice(results.length)
if (skipped.length) log(`Not attempted (run stopped): ${skipped.length} stories`)
return { completed, stopped: stopped ?? null, notAttempted: skipped, port4200Free: port?.free ?? null }
