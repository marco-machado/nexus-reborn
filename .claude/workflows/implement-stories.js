export const meta = {
  name: 'implement-stories',
  description: 'Run story-readiness → dev-story → code-review → story-done on each sprint story, in order',
  whenToUse: 'Implement the open stories of the current sprint (or a given list) one at a time, stopping on the first story that is not ready or fails.',
  phases: [
    { title: 'Plan', detail: 'read sprint-status.yaml for open stories in order' },
    { title: 'Readiness', detail: '/story-readiness' },
    { title: 'Implement', detail: '/dev-story' },
    { title: 'Review', detail: '/code-review, one fix pass on blocking findings' },
    { title: 'Done', detail: '/story-done' },
  ],
}

// args (all optional):
//   stories: string[]  story file paths, in order. Default: open stories from
//                      production/sprint-status.yaml in priority order.
//   limit:   number    stop after this many stories.
//   commit:  boolean   commit each completed story to the current branch.
//
// Stories run strictly one after another: they share modules and depend on
// each other, so a failure stops the run rather than skipping ahead.

const HEADLESS = `You run unattended inside a workflow; nobody can answer questions.
Where the skill would ask the user, take its recommended/default option and note it.
If a decision genuinely needs the owner (design change, scope cut, missing input), stop and report it as a blocker instead of guessing.`

const PLAN = {
  type: 'object',
  properties: { stories: { type: 'array', items: { type: 'string' } } },
  required: ['stories'],
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
const REVIEW = {
  type: 'object',
  properties: {
    blocking: { type: 'array', items: { type: 'string' }, description: 'findings that must be fixed before the story is done' },
    advisory: { type: 'array', items: { type: 'string' } },
  },
  required: ['blocking', 'advisory'],
}

const opts = args ?? {}

phase('Plan')
let stories = opts.stories
if (!stories?.length) {
  const plan = await agent(
    `Read production/sprint-status.yaml. Return the "file" path of every story whose status is not "done", ordered must-have, should-have, unplanned, nice-to-have, keeping file order within each priority. A story in "review" status still needs /story-done, so include it.`,
    { schema: PLAN, effort: 'low', label: 'read sprint status' },
  )
  stories = plan?.stories ?? []
}
if (opts.limit) stories = stories.slice(0, opts.limit)
log(`${stories.length} stories queued: ${stories.map((s) => s.split('/').pop()).join(', ')}`)

const results = []
for (const story of stories) {
  const name = story.split('/').pop().replace(/\.md$/, '')
  const record = { story, steps: {} }
  results.push(record)

  const ready = await agent(
    `Invoke the story-readiness skill (Skill tool) on ${story}. ${HEADLESS}
ok=true only if the verdict lets implementation start. If the story is already implemented (status review/in code), say so in summary and set ok=true.`,
    { phase: 'Readiness', schema: STEP, label: `ready:${name}` },
  )
  record.steps.readiness = ready
  if (!ready?.ok) { record.stopped = 'readiness'; break }

  const built = await agent(
    `Invoke the dev-story skill (Skill tool) on ${story}. ${HEADLESS}
If the story is already implemented and its tests pass, verify that instead of rewriting it.
Before returning, run npm run lint, npm run test and npm run build; ok=true only if all three pass. Stop any dev server you started. Do not commit.`,
    { phase: 'Implement', schema: STEP, label: `dev:${name}` },
  )
  record.steps.implement = built
  if (!built?.ok) { record.stopped = 'implement'; break }

  const review = await agent(
    `Invoke the code-review skill (Skill tool) on the uncommitted changes for ${story}. ${HEADLESS}
Do not edit files. Classify each finding as blocking (bug, broken acceptance criterion, CLAUDE.md guardrail breach) or advisory.`,
    { phase: 'Review', schema: REVIEW, label: `review:${name}` },
  )
  record.steps.review = review
  if (review?.blocking?.length) {
    const fixed = await agent(
      `Fix these blocking review findings for ${story}:\n- ${review.blocking.join('\n- ')}\n${HEADLESS}
Then run npm run lint, npm run test and npm run build; ok=true only if every finding is fixed and all three pass. Do not commit.`,
      { phase: 'Review', schema: STEP, label: `fix:${name}` },
    )
    record.steps.fix = fixed
    if (!fixed?.ok) { record.stopped = 'review'; break }
  }

  const done = await agent(
    `Invoke the story-done skill (Skill tool) on ${story}. ${HEADLESS}
ok=true only if the story is marked Complete in its file and in production/sprint-status.yaml.${
      opts.commit
        ? ` Then commit the story's changes to the current branch, following the Commits section of CLAUDE.md (imperative subject, body by file, what was verified). Do not push.`
        : ' Do not commit.'
    }`,
    { phase: 'Done', schema: STEP, label: `done:${name}` },
  )
  record.steps.done = done
  if (!done?.ok) { record.stopped = 'story-done'; break }
  log(`✓ ${name}`)
}

const completed = results.filter((r) => !r.stopped && r.steps.done?.ok).map((r) => r.story)
const stopped = results.find((r) => r.stopped)
const skipped = stories.slice(results.length)
if (skipped.length) log(`Not attempted (run stopped): ${skipped.length} stories`)
return { completed, stopped: stopped ?? null, notAttempted: skipped }
