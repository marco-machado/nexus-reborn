// Ground-click marker queue: the input surface pushes, the Fx pool drains.
export const markerQueue: Array<{ x: number; z: number }> = []

export function pushClickMarker(x: number, z: number): void {
  markerQueue.push({ x, z })
}
