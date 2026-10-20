// Squad card render gate for the mission HUD. The sim pushes fresh squad rows
// every SYNC_INTERVAL (0.2 s) even when nothing on a card changed; a card
// re-renders only when one of its own values did. Without this gate every push
// re-rendered all four cards and their portrait SVGs (about 10 ms a push in
// dev), and the pushes bunched to a 20 ms task at an objective switch: the
// Sprint 9 smoke r4 live-play hitch (41.7 ms frame against a 25.0 ms limit).
import type { SquadMemberUi } from '../state/missionStore'
import type { PortraitOp } from './portrait'

export interface SquadRowProps {
  r: SquadMemberUi
  op: PortraitOp
  isSel: boolean
  isActive: boolean
  selected: string[]
  setSelected: (ids: string[]) => void
}

// Every field of the row, by value: a new field added to SquadMemberUi is
// compared without a change here.
export function sameRowValues(a: SquadMemberUi, b: SquadMemberUi): boolean {
  if (a === b) return true
  const keys = Object.keys(a) as Array<keyof SquadMemberUi>
  if (keys.length !== Object.keys(b).length) return false
  return keys.every((k) => a[k] === b[k])
}

export function sameSquadRow(a: SquadRowProps, b: SquadRowProps): boolean {
  return (
    a.isSel === b.isSel &&
    a.isActive === b.isActive &&
    a.selected === b.selected &&
    a.setSelected === b.setSelected &&
    a.op.id === b.op.id &&
    a.op.codename === b.op.codename &&
    a.op.accent === b.op.accent &&
    sameRowValues(a.r, b.r)
  )
}
