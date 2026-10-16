// Assembly row and bay click handlers (RA-008 AC 5). Reading a dossier only
// moves focus; the trailing assign key is the only control that edits the squad.

/** What an Assembly row or bay may do: move focus, or toggle the squad. */
export interface AssemblyActions {
  focus: (id: string) => void
  toggle: (id: string) => void
}

/** Click handlers for one operative: `read` focuses the dossier, `assign` toggles the squad. */
export function assemblyRowHandlers(
  id: string,
  actions: AssemblyActions,
): { read: () => void; assign: () => void } {
  return {
    read: () => actions.focus(id),
    assign: () => actions.toggle(id),
  }
}
