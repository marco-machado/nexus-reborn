// A file the band opens: absolute path, the pane's title, how the pane draws it.
export type FileRef = { path: string; title: string; format: 'markdown' | 'yaml' }

export type Story = { label: string; href: string; file: FileRef }

export type Progress = {
  done: number
  review: number
  inProgress: number
  blocked: number
  total: number
}

export type SprintRow = { id: string; name: string; status: string; file: FileRef }

export type Sprint = {
  file: FileRef
  goal: string | null
  // Whole days, from the yaml's start and end against today.
  timing: { kind: 'starts'; days: number } | { kind: 'left'; days: number } | { kind: 'over'; days: number } | null
  rows: SprintRow[]
}

export type Band = {
  stage: string
  rigor: string | null
  crumbs: string[]
  // The crumb that names the epic, with its EPIC.md when there is one.
  epic: { crumb: string; file: FileRef } | null
  // null: no sprint file; 'unreadable': the file is there but failed to read.
  progress: Progress | 'unreadable' | null
  sprint: Sprint | null
  story: Story | null
  // The first slash command of the session state's **Next step:** line.
  nextStep: string | null
}

// What the band's pane shows: the sprint's stories, or one file.
export type PaneView = { kind: 'stories' } | { kind: 'file'; file: FileRef; text: string | null }

declare module 'claude-code' {
  interface PluginState {
    'status-band': { band: Band | null; pane: PaneView }
  }
}
