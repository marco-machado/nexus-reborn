// Canvas minimap. Reads the live world via getWorld() at ~10fps; renders
// building footprints, road bands, mission zones and unit blips. Canvas colors
// are hardcoded hexes matching the design tokens in src/index.css.
import { useEffect, useRef } from 'react'
import { getWorld } from '../game/runtime'

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
  text: 'rgba(93,125,117,0.8)',
}

export default function Minimap({ width = 210, height = 150 }: { width?: number; height?: number }) {
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
      const s = Math.min(width / size, height / size)
      const ox = (width - size * s) / 2
      const oy = (height - size * s) / 2
      ctx.save()
      ctx.translate(ox, oy)

      // map footprint background
      ctx.fillStyle = 'rgba(126,240,212,0.025)'
      ctx.fillRect(0, 0, size * s, size * s)

      // roads: 3 cell wide bands
      ctx.fillStyle = COLOR.road
      for (const rz of city.roadsH) ctx.fillRect(0, rz * s, size * s, 3 * s)
      for (const cxx of city.roadsV) ctx.fillRect(cxx * s, 0, 3 * s, size * s)

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
      ctx.fillStyle = COLOR.checkpoint
      ctx.beginPath()
      ctx.moveTo(px, pz - 4)
      ctx.lineTo(px + 3.2, pz)
      ctx.lineTo(px, pz + 4)
      ctx.lineTo(px - 3.2, pz)
      ctx.closePath()
      ctx.fill()

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
  }, [width, height])

  return <canvas ref={ref} className="minimap-canvas" style={{ width, height }} />
}
