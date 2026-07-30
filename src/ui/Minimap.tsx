// Canvas minimap, and a camera control. Reads the live world via getWorld() at
// ~10fps; renders building footprints, road bands, mission zones, enemy sight
// cones, the camera viewport and unit blips. The map is turned by the camera
// yaw, so up on the panel is up on screen and the viewport reads as an upright
// cone. Clicking and dragging run the same transform backwards to steer the
// camera. Canvas colors are hardcoded hexes matching the tokens in
// src/index.css.
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { getCameraFocus, getCameraFootprint, getWorld, panCameraTo } from '../game/runtime'
import {
  CAMERA_YAW,
  VISION_HALF_ANGLE,
  type CameraFootprint,
  type Vec2,
  type WorldApi,
} from '../game/types'
import { useMissionStore } from '../state/missionStore'
import { uiClick } from './sound'

const ZOOM = [1, 1.7, 2.8]
export const MM_ZOOM_MAX = ZOOM.length - 1

const YAW_SIN = Math.sin(CAMERA_YAW)
const YAW_COS = Math.cos(CAMERA_YAW)

// World XZ turned into the panel frame, in world units.
function turnX(x: number, z: number): number {
  return x * YAW_COS - z * YAW_SIN
}

function turnZ(x: number, z: number): number {
  return x * YAW_SIN + z * YAW_COS
}

// Offset that keeps the focus point centered while the map edge stays pinned
// to the viewport edge; centers the whole map when it fits.
function panOffset(view: number, mapPx: number, focusPx: number): number {
  if (mapPx <= view) return (view - mapPx) / 2
  return Math.min(0, Math.max(view - mapPx, view / 2 - focusPx))
}

// Where the map sits on the canvas: scale in pixels per world unit, the pan
// offset in pixels, and the west corner of the turned square in world units.
interface MapLayout {
  s: number
  ox: number
  oy: number
  originX: number
}

// Pure, so the draw pass and the pointer handlers agree on the frame without
// one of them keeping stale numbers for the other.
function layout(world: WorldApi, width: number, height: number, zoom: number): MapLayout {
  const size = world.city.size
  // A turned square needs its diagonal to fit, not its side. The west corner
  // sits left of the world origin; these hold for a yaw inside the first
  // quarter turn, which the fixed camera yaw is.
  const span = size * (YAW_SIN + YAW_COS)
  const originX = -size * YAW_SIN
  const s = (Math.min(width, height) / span) * (ZOOM[zoom] ?? 1)

  // When zoomed, pan toward the living agents' centroid.
  let fx = size / 2
  let fz = size / 2
  let n = 0
  let sx = 0
  let sz = 0
  for (const u of world.units) {
    if (u.kind !== 'agent' || u.stance === 'dead' || u.hp <= 0) continue
    sx += u.pos.x
    sz += u.pos.z
    n += 1
  }
  if (n > 0) {
    fx = sx / n
    fz = sz / n
  }
  return {
    s,
    ox: panOffset(width, span * s, (turnX(fx, fz) - originX) * s),
    oy: panOffset(height, span * s, turnZ(fx, fz) * s),
    originX,
  }
}

// Canvas pixel back to world XZ: undo the pan translate, then the yaw, then
// the scale. The inverse of the translate/rotate the draw pass sets up.
function toWorld(l: MapLayout, px: number, py: number): Vec2 {
  const u = px - l.ox + l.originX * l.s
  const v = py - l.oy
  return { x: (u * YAW_COS + v * YAW_SIN) / l.s, z: (v * YAW_COS - u * YAW_SIN) / l.s }
}

// Hit test for the camera footprint, a convex quad of unknown winding: inside
// means every edge turns the same way toward the point.
function insideQuad(q: CameraFootprint, x: number, z: number): boolean {
  let neg = false
  let pos = false
  for (let i = 0; i < 4; i++) {
    const a = q[i]
    const b = q[(i + 1) % 4]
    const c = (b.x - a.x) * (z - a.z) - (b.z - a.z) * (x - a.x)
    if (c < 0) neg = true
    else if (c > 0) pos = true
    if (neg && pos) return false
  }
  return true
}

const COLOR = {
  bg: '#030a08',
  grid: 'rgba(126,240,212,0.04)',
  road: 'rgba(126,240,212,0.055)',
  building: 'rgba(126,240,212,0.14)',
  extraction: 'rgba(126,240,212,0.8)',
  extractionFill: 'rgba(126,240,212,0.06)',
  checkpoint: '#f0b445',
  checkpointDim: 'rgba(240,180,69,0.35)',
  agent: '#7ef0d4',
  enemyHot: '#ff6b55',
  enemySuspect: '#f0b445',
  enemyCalm: 'rgba(224,75,60,0.45)',
  coneHot: 'rgba(255,107,85,0.13)',
  coneSuspect: 'rgba(240,180,69,0.11)',
  civilian: 'rgba(184,216,207,0.26)',
  device: '#ffb300',
  deviceDead: 'rgba(255,179,0,0.25)',
  vip: '#9be8ff',
  viewport: 'rgba(184,216,207,0.5)',
  viewportFill: 'rgba(184,216,207,0.045)',
  text: 'rgba(93,125,117,0.8)',
}

export default function Minimap({
  width = 210,
  height = 150,
  zoom = 0,
}: {
  width?: number
  height?: number
  zoom?: number
}) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  // Live drag. The offset is what the grab point owes the camera focus, so
  // grabbing the viewport keeps the spot under the cursor; a press on bare map
  // starts at zero and centers the camera on the cursor instead.
  const drag = useRef<{ id: number; dx: number; dz: number } | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1))
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = COLOR.bg
      ctx.fillRect(0, 0, width, height)

      const world = getWorld()
      if (!world) {
        ctx.strokeStyle = COLOR.grid
        ctx.lineWidth = 1
        for (let x = 10; x < width; x += 20) {
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, height)
          ctx.stroke()
        }
        ctx.fillStyle = COLOR.text
        ctx.font = '9px ui-monospace, monospace'
        ctx.textAlign = 'center'
        ctx.fillText('NO SIGNAL', width / 2, height / 2 + 3)
        return
      }

      const { city, units } = world
      const size = city.size
      const { s, ox, oy, originX } = layout(world, width, height, zoom)
      ctx.save()
      ctx.translate(ox - originX * s, oy)
      ctx.rotate(CAMERA_YAW)

      // map footprint background
      ctx.fillStyle = 'rgba(126,240,212,0.025)'
      ctx.fillRect(0, 0, size * s, size * s)

      // roads: the paved bands as generated
      ctx.fillStyle = COLOR.road
      for (const r of city.roadRects) ctx.fillRect(r.x0 * s, r.z0 * s, (r.x1 - r.x0) * s, (r.z1 - r.z0) * s)

      // building footprints
      ctx.fillStyle = COLOR.building
      for (const b of city.buildings) ctx.fillRect(b.x * s, b.z * s, b.w * s, b.d * s)

      // extraction zone: dashed teal circle
      const ex = city.extraction
      ctx.strokeStyle = COLOR.extraction
      ctx.fillStyle = COLOR.extractionFill
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.arc(ex.x * s, ex.z * s, Math.max(3, ex.r * s), 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.setLineDash([])

      // checkpoint: amber diamond + dim ring
      const cp = city.checkpoint
      const px = cp.x * s
      const pz = cp.z * s
      ctx.strokeStyle = COLOR.checkpointDim
      ctx.setLineDash([2, 3])
      ctx.beginPath()
      ctx.arc(px, pz, Math.max(3, cp.r * s), 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      // The glyph turns back out of the map frame so it stands upright.
      ctx.fillStyle = COLOR.checkpoint
      ctx.save()
      ctx.translate(px, pz)
      ctx.rotate(-CAMERA_YAW)
      ctx.beginPath()
      ctx.moveTo(0, -4)
      ctx.lineTo(3.2, 0)
      ctx.lineTo(0, 4)
      ctx.lineTo(-3.2, 0)
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      // active objective: expanding amber pulse on its world zone. A defend
      // objective adds a countdown ring that empties as the timer burns.
      const activeObj = useMissionStore
        .getState()
        .objectives.find((o) => o.active && !o.done && !o.failed && !o.optional)
      const def = activeObj
        ? world.mission.objectives.find((d) => d.id === activeObj.id)
        : undefined
      if (def) {
        const zone =
          def.kind === 'extract'
            ? city.extraction
            : (def.zone ??
              (def.landmark ? city.landmarks[def.landmark] : undefined) ??
              city.checkpoint)
        const phase = (Date.now() % 1400) / 1400
        ctx.save()
        ctx.globalAlpha = 0.85 * (1 - phase)
        ctx.strokeStyle = COLOR.checkpoint
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(zone.x * s, zone.z * s, Math.max(4, zone.r * s) * (0.55 + phase), 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
        if (def.kind === 'defend' && activeObj?.progress !== undefined) {
          ctx.save()
          ctx.strokeStyle = COLOR.checkpoint
          ctx.lineWidth = 1.6
          ctx.beginPath()
          ctx.arc(
            zone.x * s,
            zone.z * s,
            Math.max(4, zone.r * s),
            -Math.PI / 2,
            -Math.PI / 2 + (1 - activeObj.progress) * Math.PI * 2,
          )
          ctx.stroke()
          ctx.restore()
        }
      }

      // camera viewport: the frustum footprint on the ground, a trapezoid under
      // the fixed 45 degree yaw. Clipped to the map so a view hanging over the
      // city edge stops at the border instead of floating on the panel.
      const view = getCameraFootprint()
      if (view) {
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, 0, size * s, size * s)
        ctx.clip()
        ctx.beginPath()
        ctx.moveTo(view[0].x * s, view[0].z * s)
        for (let i = 1; i < view.length; i++) ctx.lineTo(view[i].x * s, view[i].z * s)
        ctx.closePath()
        ctx.fillStyle = COLOR.viewportFill
        ctx.fill()
        ctx.strokeStyle = COLOR.viewport
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.restore()
      }

      // units: civilians under devices and vips under enemies under agents
      for (const u of units) {
        if (u.kind !== 'civilian' || u.stance === 'dead' || u.hp <= 0) continue
        ctx.fillStyle = COLOR.civilian
        ctx.fillRect(u.pos.x * s - 0.8, u.pos.z * s - 0.8, 1.6, 1.6)
      }
      // devices as squares (dimmed once destroyed), the vip as an open ring
      for (const u of units) {
        if (u.kind !== 'device') continue
        ctx.fillStyle = u.stance === 'dead' ? COLOR.deviceDead : COLOR.device
        ctx.fillRect(u.pos.x * s - 1.6, u.pos.z * s - 1.6, 3.2, 3.2)
      }
      for (const u of units) {
        if (u.kind !== 'vip' || u.stance === 'dead' || u.hp <= 0) continue
        ctx.strokeStyle = COLOR.vip
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.arc(u.pos.x * s, u.pos.z * s, 2.6, 0, Math.PI * 2)
        ctx.stroke()
      }
      // Sight cone of every guard that has something to look for. World heading
      // is atan2(dx, dz), so the canvas bearing is a quarter turn less.
      for (const u of units) {
        if (u.kind !== 'enemy' || u.stance === 'dead' || u.hp <= 0) continue
        if (u.aiState !== 'combat' && u.aiState !== 'suspicious') continue
        const a = Math.PI / 2 - u.heading
        ctx.fillStyle = u.aiState === 'combat' ? COLOR.coneHot : COLOR.coneSuspect
        ctx.beginPath()
        ctx.moveTo(u.pos.x * s, u.pos.z * s)
        ctx.arc(
          u.pos.x * s,
          u.pos.z * s,
          world.vision * s,
          a - VISION_HALF_ANGLE,
          a + VISION_HALF_ANGLE,
        )
        ctx.closePath()
        ctx.fill()
      }
      for (const u of units) {
        if (u.kind !== 'enemy' || u.stance === 'dead' || u.hp <= 0) continue
        const hot = u.aiState === 'combat'
        ctx.fillStyle = hot
          ? COLOR.enemyHot
          : u.aiState === 'suspicious'
            ? COLOR.enemySuspect
            : COLOR.enemyCalm
        ctx.beginPath()
        ctx.arc(u.pos.x * s, u.pos.z * s, hot ? 2.2 : 1.8, 0, Math.PI * 2)
        ctx.fill()
      }
      for (const u of units) {
        if (u.kind !== 'agent' || u.stance === 'dead' || u.hp <= 0) continue
        ctx.save()
        ctx.shadowColor = COLOR.agent
        ctx.shadowBlur = 5
        ctx.fillStyle = COLOR.agent
        ctx.beginPath()
        ctx.arc(u.pos.x * s, u.pos.z * s, 2.2, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      ctx.restore()
    }

    draw()
    const id = window.setInterval(draw, 100)
    return () => window.clearInterval(id)
  }, [width, height, zoom])

  // World point under the pointer, or null while no world is running.
  const pointAt = (e: ReactPointerEvent<HTMLCanvasElement>): Vec2 | null => {
    const world = getWorld()
    if (!world) return null
    const r = e.currentTarget.getBoundingClientRect()
    return toWorld(layout(world, width, height, zoom), e.clientX - r.left, e.clientY - r.top)
  }

  // Cursor says what a press would do here: pick the view up, or send it.
  const hover = (el: HTMLCanvasElement, p: Vec2): void => {
    const view = getCameraFootprint()
    el.style.cursor = view && insideQuad(view, p.x, p.z) ? 'grab' : ''
  }

  const onDown = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
    if (e.button !== 0) return
    const p = pointAt(e)
    if (!p) return
    e.preventDefault()
    const view = getCameraFootprint()
    const focus = getCameraFocus()
    if (view && focus && insideQuad(view, p.x, p.z)) {
      drag.current = { id: e.pointerId, dx: focus.x - p.x, dz: focus.z - p.z }
    } else {
      drag.current = { id: e.pointerId, dx: 0, dz: 0 }
      panCameraTo(p.x, p.z)
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.style.cursor = 'grabbing'
    uiClick()
  }

  const onMove = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
    const p = pointAt(e)
    if (!p) return
    const d = drag.current
    if (d && d.id === e.pointerId) panCameraTo(p.x + d.dx, p.z + d.dz)
    else hover(e.currentTarget, p)
  }

  const onUp = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    const p = pointAt(e)
    if (p) hover(e.currentTarget, p)
    else e.currentTarget.style.cursor = ''
  }

  return (
    <canvas
      ref={ref}
      className="minimap-canvas"
      style={{ width, height }}
      role="application"
      tabIndex={0}
      aria-label="Tactical map. Click or drag to move the camera, arrow keys to pan."
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={(e) => {
        if (!drag.current) e.currentTarget.style.cursor = ''
      }}
    />
  )
}
