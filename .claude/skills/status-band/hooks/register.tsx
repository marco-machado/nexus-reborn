import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderNode } from 'claude-code'

import type { Band, FileRef, PaneView, Progress, Sprint, Story } from '../types'

// The band draws .claude/statusline.sh's stage and breadcrumb, less its first
// two segments (context tokens, model), so the script stays the one source of
// those. Sprint progress, timing and the current story come from
// sprint-status.yaml; the next step of a finished sprint from the session state.
const SCRIPT = '.claude/statusline.sh'
const SPRINT_YAML = 'production/sprint-status.yaml'
const SESSION_STATE = 'production/session-state/active.md'
const EPICS = 'production/epics'
const DROPPED_SEGMENTS = 2
const REFRESH_MS = 60_000
const DAY_MS = 86_400_000
const BAR_CELLS = 10
// Below WIDE the epic crumb and the timing go; below NARROW the rigor, the
// bar and the next step go too.
const WIDE = 100
const NARROW = 70
// A story the band names when the Task slot is empty, most urgent first.
const CURRENT_STATUSES = ['in-progress', 'review']
const PANE = 'status-band'
const SEP = ' › '

const band = atom({ plugin: 'status-band', key: 'band' } as const, null)
const pane = atom({ plugin: 'status-band', key: 'pane' } as const, { kind: 'stories' } as PaneView)

export type SprintStory = { id: string; name: string; file: string; status: string }

export type Status = { stage: string; rigor: string | null; crumbs: string[] }

export const parseStatus = (output: string): Status | null => {
  const segments = output.trim().split(' | ').slice(DROPPED_SEGMENTS)
  const [head = '', ...rest] = segments
  const [stage = '', ...rigor] = head.split(' · ')

  if (stage.trim() === '') {
    return null
  }

  const crumbs = rest.join(' | ').split(' > ').map(c => c.trim()).filter(c => c !== '')

  return { stage: stage.trim(), rigor: rigor.length > 0 ? rigor.join(' · ') : null, crumbs }
}

const unquote = (value: string): string => value.trim().replace(/^"(.*)"$/, '$1')

// sprint-status.yaml is written by /sprint-plan in one fixed shape, so a line
// parse of the story keys is enough and keeps the mod free of a yaml library.
export const parseSprint = (yaml: string): SprintStory[] => {
  const stories: SprintStory[] = []

  for (const line of yaml.split('\n')) {
    const match = /^\s*(-\s+)?(id|name|file|status):\s*(.*)$/.exec(line)

    if (match === null) {
      continue
    }

    const [, dash, key, value = ''] = match
    const last = stories.at(-1)

    if (dash !== undefined && key === 'id') {
      stories.push({ id: unquote(value), name: '', file: '', status: '' })
    } else if (dash === undefined && last !== undefined && key !== 'id') {
      last[key as 'name' | 'file' | 'status'] = unquote(value)
    }
  }

  return stories
}

// The sprint's own keys sit unindented at the top of the same file.
export const parseSprintHeader = (yaml: string): { goal: string | null; start: string | null; end: string | null } => {
  const key = (name: string) => {
    const match = new RegExp(`^${name}:\\s*(.*)$`, 'm').exec(yaml)
    const value = match === null ? '' : unquote(match[1] ?? '')

    return value === '' ? null : value
  }

  return { goal: key('goal'), start: key('start'), end: key('end') }
}

export const progressOf = (stories: SprintStory[]): Progress | null => {
  if (stories.length === 0) {
    return null
  }

  const count = (status: string) => stories.filter(s => s.status === status).length

  return {
    done: count('done'),
    review: count('review'),
    inProgress: count('in-progress'),
    blocked: count('blocked'),
    total: stories.length,
  }
}

export const isComplete = (progress: Band['progress']): boolean =>
  typeof progress === 'object' && progress !== null && progress.done === progress.total

// Whole days since the epoch, in the session's own time zone.
export const dayNumber = (ms: number): number =>
  Math.floor((ms - new Date(ms).getTimezoneOffset() * 60_000) / DAY_MS)

const dayOf = (iso: string | null): number | null => {
  const match = iso === null ? null : /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)

  return match === null ? null : Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MS
}

export const timingOf = (start: string | null, end: string | null, today: number): Sprint['timing'] => {
  const first = dayOf(start)
  const last = dayOf(end)

  if (first !== null && today < first) return { kind: 'starts', days: first - today }
  if (last !== null && today <= last) return { kind: 'left', days: last - today }
  if (last !== null) return { kind: 'over', days: today - last }

  return null
}

export const timingText = (timing: NonNullable<Sprint['timing']>): string => {
  if (timing.kind === 'starts') return `starts in ${timing.days}d`
  if (timing.kind === 'over') return `${timing.days}d over`

  return timing.days === 0 ? 'last day' : `${timing.days}d left`
}

// The first slash command of the **Next step:** line, with its one argument.
export const nextStepOf = (state: string): string | null => {
  const line = /^\*\*Next step:\*\*\s*(.*)$/m.exec(state)?.[1] ?? ''
  const match = /(?:^|\s)(\/[a-z][\w-]*)(?:\s+(?!then\b|and\b|or\b)([a-z][\w-]*))?/.exec(line)

  if (match === null) {
    return null
  }

  return match[2] === undefined ? (match[1] ?? null) : `${match[1]} ${match[2]}`
}

const hrefOf = (path: string) => encodeURI(`file://${path}`)

const markdownFile = (path: string, title: string): FileRef => ({ path, title, format: 'markdown' })

// The Task slot (a third crumb) wins when it names a sprint story: that crumb
// becomes the link. With no Task, the first in-progress or review story is.
export const currentStory = (
  stories: SprintStory[],
  crumbs: string[],
  root: string,
): { crumbs: string[]; story: Story | null } => {
  const byId = new Map(stories.map(s => [s.id, s]))
  const idOf = (crumb: string) => crumb.split(' ')[0] ?? ''
  const storyOf = (label: string, task: SprintStory): Story => {
    const path = `${root}/${task.file}`

    return { label, href: hrefOf(path), file: markdownFile(path, task.id) }
  }
  const label = crumbs.find(c => byId.has(idOf(c)))
  const task = label === undefined ? undefined : byId.get(idOf(label))

  if (label !== undefined && task !== undefined) {
    return { crumbs: crumbs.filter(c => c !== label), story: storyOf(label, task) }
  }

  if (crumbs.length >= 3) {
    return { crumbs, story: null }
  }

  for (const status of CURRENT_STATUSES) {
    const found = stories.find(s => s.status === status)

    if (found !== undefined) {
      return { crumbs, story: storyOf(`${found.id} ${found.name}`, found) }
    }
  }

  return { crumbs, story: null }
}

export const sprintOf = (yaml: string, stories: SprintStory[], root: string, today: number): Sprint => {
  const { goal, start, end } = parseSprintHeader(yaml)

  return {
    file: { path: `${root}/${SPRINT_YAML}`, title: 'sprint-status.yaml', format: 'yaml' },
    goal,
    timing: timingOf(start, end, today),
    rows: stories.map(s => ({
      id: s.id,
      name: s.name,
      status: s.status,
      file: markdownFile(`${root}/${s.file}`, s.id),
    })),
  }
}

export const slugOf = (crumb: string): string =>
  crumb.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const isSprintCrumb = (crumb: string) => /^sprint\b/i.test(crumb)

export type Layout = Band & { bar: boolean; timing: boolean }

export const layout = (value: Band, columns: number): Layout => ({
  ...value,
  rigor: columns < NARROW ? null : value.rigor,
  crumbs: columns < WIDE && value.crumbs.length > 1 ? value.crumbs.slice(1) : value.crumbs,
  nextStep: columns < NARROW ? null : value.nextStep,
  bar: columns >= NARROW,
  timing: columns >= WIDE,
})

// Never a full bar short of done, never an empty one past zero.
export const filledCells = ({ done, total }: Progress): number => {
  const cells = Math.round((done / total) * BAR_CELLS)

  if (done === total) return BAR_CELLS
  if (done === 0) return 0

  return Math.min(BAR_CELLS - 1, Math.max(1, cells))
}

export const SEGMENT_KINDS = ['done', 'review', 'inProgress', 'blocked'] as const

export type SegmentKind = (typeof SEGMENT_KINDS)[number]

// Cells per status for the terminal bar: done keeps filledCells' rule, every
// other status with a story gets at least one cell, and an empty cell stays
// while any story has not started.
export const segments = (progress: Progress): Record<SegmentKind, number> => {
  const cells: Record<SegmentKind, number> = { done: filledCells(progress), review: 0, inProgress: 0, blocked: 0 }
  const others = ['inProgress', 'review', 'blocked'] as const

  for (const kind of others) {
    if (progress[kind] > 0) {
      cells[kind] = Math.max(1, Math.round((progress[kind] / progress.total) * BAR_CELLS))
    }
  }

  const notStarted = progress.total - SEGMENT_KINDS.reduce((sum, kind) => sum + progress[kind], 0)
  const room = notStarted > 0 ? BAR_CELLS - 1 : BAR_CELLS
  const sum = () => SEGMENT_KINDS.reduce((total, kind) => total + cells[kind], 0)

  if (notStarted === 0 && progress.done < progress.total) {
    while (sum() < BAR_CELLS) {
      const largest = others.reduce((a, b) => (progress[b] > progress[a] ? b : a))
      cells[largest] += 1
    }
  }

  while (sum() > room) {
    const largest = SEGMENT_KINDS.filter(kind => cells[kind] > 1).sort((a, b) => cells[b] - cells[a])[0]

    if (largest === undefined) break
    cells[largest] -= 1
  }

  return cells
}

const THEME_COLORS: Record<SegmentKind, string> = {
  done: 'success',
  review: 'warning',
  inProgress: 'suggestion',
  blocked: 'error',
}

// The desktop bar: raw colors, since an Svg is drawn outside the theme.
const SVG_COLORS: Record<SegmentKind, string> = {
  done: '#4eba65',
  review: '#e5a53b',
  inProgress: '#7c9cf5',
  blocked: '#e5484d',
}

const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// `title` is the hover tooltip: an interactive Svg draws its <title> natively.
export const barSvg = (progress: Progress, title: string): string => {
  const width = 100
  const height = 6
  let x = 0
  const rects = SEGMENT_KINDS.map(kind => {
    const w = (progress[kind] / progress.total) * width
    const rect = w > 0 ? `<rect x="${x.toFixed(2)}" width="${w.toFixed(2)}" height="${height}" fill="${SVG_COLORS[kind]}"/>` : ''
    x += w

    return rect
  }).join('')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<title>${escapeXml(title)}</title>` +
    `<clipPath id="r"><rect width="${width}" height="${height}" rx="3"/></clipPath>` +
    `<g clip-path="url(#r)"><rect width="${width}" height="${height}" fill="#8888884d"/>${rects}</g></svg>`
  )
}

export const progressAlt = (progress: Progress): string => {
  const extra = [
    progress.review > 0 ? `${progress.review} in review` : '',
    progress.inProgress > 0 ? `${progress.inProgress} in progress` : '',
    progress.blocked > 0 ? `${progress.blocked} blocked` : '',
  ].filter(part => part !== '')

  return [`${progress.done} of ${progress.total} stories done`, ...extra].join(', ')
}

const STATUS_MARKS: Record<string, { mark: string; color: string }> = {
  done: { mark: '✓', color: 'success' },
  review: { mark: '◐', color: 'warning' },
  'in-progress': { mark: '▶', color: 'suggestion' },
  blocked: { mark: '✕', color: 'error' },
}

// undefined: the file is absent; null: it is there but could not be read.
const readText = async ($: EngineInterface, path: string): Promise<string | null | undefined> => {
  try {
    if (!(await $.fs.exists(path))) {
      return undefined
    }

    const text = await $.fs.read(path)

    return typeof text === 'string' ? text : null
  } catch {
    return null
  }
}

// A run that cannot start or outlives its timeout rejects; it counts as a
// failed run, so the band hands the draw back instead of the hook throwing.
const runScript = async ($: EngineInterface): Promise<Status | null> => {
  try {
    const { exitCode, stdout } = await $.process.run(['bash', SCRIPT], {
      stdin: JSON.stringify({ model: { display_name: '' } }),
      timeoutMs: 10_000,
    })

    return exitCode === 0 ? parseStatus(stdout) : null
  } catch {
    return null
  }
}

// The first crumb of two or more is the epic when its folder has an EPIC.md.
const epicOf = async ($: EngineInterface, root: string, crumbs: string[]): Promise<Band['epic']> => {
  const crumb = crumbs.length >= 2 ? crumbs[0] : undefined

  if (crumb === undefined) {
    return null
  }

  const path = `${root}/${EPICS}/${slugOf(crumb)}/EPIC.md`
  const exists = await $.fs.exists(path).catch(() => false)

  return exists ? { crumb, file: markdownFile(path, crumb) } : null
}

const refresh = async ($: EngineInterface, root: string) => {
  const status = await runScript($)
  let next: Band | null = null

  if (status !== null) {
    const yaml = await readText($, `${root}/${SPRINT_YAML}`)
    const stories = typeof yaml === 'string' ? parseSprint(yaml) : []
    const { crumbs, story } = currentStory(stories, status.crumbs, root)
    const progress = yaml === null ? 'unreadable' : progressOf(stories)
    const today = dayNumber(await $.clock.now())
    const sprint = typeof yaml === 'string' && stories.length > 0 ? sprintOf(yaml, stories, root, today) : null
    const state = isComplete(progress) ? await readText($, `${root}/${SESSION_STATE}`) : undefined

    next = {
      ...status,
      crumbs,
      epic: await epicOf($, root, crumbs),
      progress,
      sprint,
      story,
      nextStep: typeof state === 'string' ? nextStepOf(state) : null,
    }
  }

  const before = await read($, band)

  if (JSON.stringify(before) !== JSON.stringify(next)) {
    await update($, band, () => next)
  }
}

const openFile = async ($: EngineInterface, file: FileRef) => {
  const text = await readText($, file.path)

  const view: PaneView = { kind: 'file', file, text: typeof text === 'string' ? text : null }

  await update($, pane, () => view)
  await $.ui.open({ id: PANE, title: file.title })
}

const openStories = async ($: EngineInterface) => {
  const view: PaneView = { kind: 'stories' }

  await update($, pane, () => view)
  await $.ui.open({ id: PANE, title: 'Sprint stories' })
}

export const register: Register = on => {
  let root = '.'

  on('session.start', async ($, e, next) => {
    root = e.cwd
    // The interval first, so a first refresh that fails still leaves it running.
    $.clock.every(REFRESH_MS, () => refresh($, root))
    await refresh($, root)

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    await refresh($, root)

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const value = await read($, band)

    if (e.props.hasSurvey || value === null) {
      return next(e)
    }

    const { Box, Button, Link, Text } = $.ui.resolve(e)
    const isTerminal = e.surface === 'terminal'
    const shown = layout(value, e.props.bodyColumns)
    const parts: RenderNode[] = []
    const sep = (key: string) => <Text key={key} dimColor>{SEP}</Text>
    // The terminal opens a file: link in the person's editor; the desktop opens
    // no file: link, so there the crumb is a Button that shows the file in a pane.
    const opener = (key: string, label: string, file: FileRef) =>
      isTerminal
        ? <Text key={key}><Link href={hrefOf(file.path)} label={label} /></Text>
        : <Button key={key} plain label={label} onPress={() => void openFile($, file)} />

    parts.push(<Text key="stage" bold>{shown.stage}</Text>)

    if (shown.rigor !== null) {
      parts.push(<Text key="rigor" dimColor>·{shown.rigor}</Text>)
    }

    shown.crumbs.forEach((crumb, i) => {
      parts.push(sep(`crumb-sep-${i}`))

      if (shown.epic !== null && crumb === shown.epic.crumb) {
        parts.push(opener('epic', crumb, shown.epic.file))
      } else if (shown.sprint !== null && isSprintCrumb(crumb)) {
        parts.push(opener('sprint', crumb, shown.sprint.file))
      } else {
        parts.push(<Text key={`crumb-${i}`}>{crumb}</Text>)
      }
    })

    if (shown.progress === 'unreadable') {
      parts.push(<Text key="progress" dimColor>{'  sprint ?'}</Text>)
    } else if (shown.progress !== null) {
      const progress = shown.progress
      const count = `${progress.done}/${progress.total}`

      parts.push(<Text key="progress-gap">{'  '}</Text>)

      if (isComplete(progress)) {
        parts.push(
          <Button key="progress" plain onPress={() => void openStories($)}>
            <Text color="success">✓ complete</Text>
            <Text dimColor>{` ${count}`}</Text>
          </Button>,
        )
      } else if (shown.bar && isTerminal) {
        const cells = segments(progress)
        const empty = BAR_CELLS - SEGMENT_KINDS.reduce((sum, kind) => sum + cells[kind], 0)

        parts.push(
          <Button key="progress" plain onPress={() => void openStories($)}>
            {SEGMENT_KINDS.filter(kind => cells[kind] > 0).map(kind => (
              <Text color={THEME_COLORS[kind]}>{'▰'.repeat(cells[kind])}</Text>
            ))}
            {empty > 0 && <Text dimColor>{'▱'.repeat(empty)}</Text>}
            {` ${count}`}
          </Button>,
        )
      } else {
        if (shown.bar && e.surface !== 'terminal') {
          const { Svg } = $.ui.resolve(e)

          const alt = progressAlt(progress)
          const goal = shown.sprint?.goal
          const title = goal === null || goal === undefined ? alt : `Goal: ${goal}\n${alt}`

          parts.push(<Svg key="bar" source={barSvg(progress, title)} alt={alt} width={100} height={6} isInteractive />)
          parts.push(<Text key="bar-gap">{' '}</Text>)
        }

        parts.push(<Button key="progress" plain label={count} onPress={() => void openStories($)} />)
      }

      if (progress.blocked > 0) {
        parts.push(<Text key="blocked" color="error">{`  ${progress.blocked} blocked`}</Text>)
      }

      if (!isComplete(progress) && shown.timing && shown.sprint?.timing) {
        const timing = shown.sprint.timing

        parts.push(
          timing.kind === 'over'
            ? <Text key="timing" color="warning">{`  ${timingText(timing)}`}</Text>
            : <Text key="timing" dimColor>{`  ${timingText(timing)}`}</Text>,
        )
      }

      if (isComplete(progress) && shown.nextStep !== null) {
        parts.push(sep('next-sep'))
        parts.push(<Text key="next" dimColor>next </Text>)
        parts.push(<Text key="next-step">{shown.nextStep}</Text>)
      }
    }

    if (shown.story !== null) {
      parts.push(sep('story-sep'))
      parts.push(opener('story', shown.story.label, shown.story.file))
    }

    return <Box flexDirection="row" alignItems="center">{parts}</Box>
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Code, Markdown, Text } = $.ui.resolve(e)
    const view = await read($, pane)
    const sprint = (await read($, band))?.sprint ?? null

    if (view.kind === 'file') {
      return (
        <Box flexDirection="column">
          {sprint !== null && (
            <Button key="back" plain dimColor label="‹ Sprint stories" onPress={() => void openStories($)} />
          )}
          {view.text === null
            ? <Text dimColor>{`Could not read ${view.file.path}`}</Text>
            : view.file.format === 'yaml'
              ? <Code source={view.text} language="yaml" />
              : <Markdown text={view.text} />}
        </Box>
      )
    }

    if (sprint === null) {
      return <Text dimColor>No sprint file.</Text>
    }

    return (
      <Box flexDirection="column">
        {sprint.goal !== null && <Text dimColor wrap="wrap">{sprint.goal}</Text>}
        {sprint.rows.map(row => {
          const mark = STATUS_MARKS[row.status] ?? { mark: '·', color: 'inactive' }

          return (
            <Button key={`story-${row.id}`} plain onPress={() => void openFile($, row.file)}>
              <Text color={mark.color}>{`${mark.mark} `}</Text>
              {`${row.id} ${row.name} `}
              <Text dimColor>{row.status}</Text>
            </Button>
          )
        })}
        <Button key="sprint-file" plain dimColor label="Open sprint-status.yaml" onPress={() => void openFile($, sprint.file)} />
      </Box>
    )
  })
}
