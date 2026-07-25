// Canvas minimap. Reads the live world via getWorld() at ~10fps; renders
// building footprints, road bands, mission zones, the camera viewport and unit
// blips. The map is turned by the camera yaw, so up on the panel is up on
// screen and the viewport reads as an upright cone. Canvas colors are
// hardcoded hexes matching the tokens in src/index.css.
import { useEffect, useRef } from 'react'
import { getCameraFootprint, getWorld } from '../game/runtime'
import { CAMERA_YAW } from '../game/types'
import { useMissionStore } from '../state/missionStore'

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
  enemyCalm: 'rgba(224,75,60,0.45)',
  civilian: 'rgba(184,216,207,0.26)',
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
      // A turned square needs its diagonal to fit, not its side. The west
      // corner sits left of the world origin; these hold for a yaw inside the
      // first quarter turn, which the fixed camera yaw is.
      const span = size * (YAW_SIN + YAW_COS)
      const originX = -size * YAW_SIN
      const s = (Math.min(width, height) / span) * (ZOOM[zoom] ?? 1)

      // When zoomed, pan toward the living agents' centroid.
      let fx = size / 2
      let fz = size / 2
      let n = 0
      let sx = 0
      let sz = 0
      for (const u of units) {
        if (u.kind !== 'agent' || u.stance === 'dead' || u.hp <= 0) continue
        sx += u.pos.x
        sz += u.pos.z
        n += 1
      }
      if (n > 0) {
        fx = sx / n
        fz = sz / n
      }
      const ox = panOffset(width, span * s, (turnX(fx, fz) - originX) * s)
      const oy = panOffset(height, span * s, turnZ(fx, fz) * s)
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

      // active objective: expanding amber pulse on its world zone
      const activeObj = useMissionStore.getState().objectives.find((o) => o.active && !o.done)
      const def = activeObj
        ? world.mission.objectives.find((d) => d.id === activeObj.id)
        : undefined
      if (def) {
        const zone = def.kind === 'extract' ? city.extraction : (def.zone ?? city.checkpoint)
        const phase = (Date.now() % 1400) / 1400
        ctx.save()
        ctx.globalAlpha = 0.85 * (1 - phase)
        ctx.strokeStyle = COLOR.checkpoint
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(zone.x * s, zone.z * s, Math.max(4, zone.r * s) * (0.55 + phase), 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
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

      // units: civilians under enemies under agents
      for (const u of units) {
        if (u.kind !== 'civilian' || u.stance === 'dead' || u.hp <= 0) continue
        ctx.fillStyle = COLOR.civilian
        ctx.fillRect(u.pos.x * s - 0.8, u.pos.z * s - 0.8, 1.6, 1.6)
      }
      for (const u of units) {
        if (u.kind !== 'enemy' || u.stance === 'dead' || u.hp <= 0) continue
        ctx.fillStyle = u.alerted ? COLOR.enemyHot : COLOR.enemyCalm
        ctx.beginPath()
        ctx.arc(u.pos.x * s, u.pos.z * s, u.alerted ? 2.2 : 1.8, 0, Math.PI * 2)
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

  return <canvas ref={ref} className="minimap-canvas" style={{ width, height }} />
}
