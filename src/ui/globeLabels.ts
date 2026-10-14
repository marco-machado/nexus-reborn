export interface LabelBox {
  x: number
  y: number
  width: number
  height: number
}

export interface ProjectedLabel {
  id: string
  x: number
  y: number
  width: number
  height: number
}

function overlaps(a: LabelBox, b: LabelBox): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y
}

// Input order is priority order (contracts, focused cities, remaining cities).
// Only labels move; the location pins always stay on their geographic anchors.
export function placeGlobeLabels(markers: ProjectedLabel[], width: number, height: number): Map<string, LabelBox> {
  const occupied: LabelBox[] = markers.map((m) => ({ x: m.x - 9, y: m.y - 9, width: 18, height: 18 }))
  const placed = new Map<string, LabelBox>()
  const gap = 14
  for (const marker of markers) {
    const { x, y, width: w, height: h } = marker
    const positions = [
      [x + gap, y - h / 2], [x - gap - w, y - h / 2],
      [x + gap, y - h - gap], [x - gap - w, y - h - gap],
      [x + gap, y + gap], [x - gap - w, y + gap],
    ]
    const box = positions.map(([left, top]) => ({ x: left, y: top, width: w + 4, height: h + 4 }))
      .find((candidate) => candidate.x >= 12 && candidate.y >= 44 &&
        candidate.x + candidate.width <= width - 12 && candidate.y + candidate.height <= height - 54 &&
        occupied.every((other) => !overlaps(candidate, other)))
    if (box) {
      occupied.push(box)
      placed.set(marker.id, box)
    }
  }
  return placed
}
