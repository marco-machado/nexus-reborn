// Standalone development review at /tools/city-review.html; deliberately omits
// settings/save bootstraps. No review code is imported by the production entrypoint.
/* eslint-disable react-refresh/only-export-components -- standalone development entrypoint */
import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { useFrame, useThree } from '@react-three/fiber'
import type { WebGPURenderer } from 'three/webgpu'
import GameCanvas from '../src/scene/GameCanvas'
import { MISSIONS, ROSTER } from '../src/game/data'
import { createWorld } from '../src/game/world'
import { getWorld, panCameraTo, setWorld } from '../src/game/runtime'
import type { QualityTier } from '../src/game/quality'
import { useSettingsStore } from '../src/state/settingsStore'
import { useMissionStore } from '../src/state/missionStore'
import { useAppStore } from '../src/state/appStore'
import Hud from '../src/ui/Hud'
import '../src/index.css'
import '../src/ui/ui.css'

type Pose = 'insertion' | 'alley' | 'junction' | 'checkpoint' | 'gate approach' | 'east exit'
interface Run { mission: number; variant: number; quality: QualityTier; id: number }
interface Metrics { status: string; samples: number; medianMs: number; p95Ms: number; calls: number; triangles: number; geometries: number; textures: number }
const initial: Metrics = { status: 'Ready', samples: 0, medianMs: 0, p95Ms: 0, calls: 0, triangles: 0, geometries: 0, textures: 0 }
const measurement = { requested: false }

function Probe({ report }: { report: (metrics: Metrics) => void }) {
  const renderer = useThree((s) => s.gl) as unknown as WebGPURenderer
  useEffect(() => {
    renderer.info.autoReset = false
    return () => { renderer.info.autoReset = true }
  }, [renderer])
  useFrame(() => { renderer.info.reset() }, -1)
  const probe = useRef({ elapsed: -1, samples: [] as number[], reported: -1 })
  useFrame((_, dt) => {
    const p = probe.current
    if (measurement.requested) {
      measurement.requested = false
      p.elapsed = 0
      p.samples = []
      p.reported = -1
    }
    if (p.elapsed < 0) return
    p.elapsed += dt
    if (p.elapsed >= 15 && p.elapsed < 45) p.samples.push(dt * 1000)
    const second = Math.floor(p.elapsed)
    if (second === p.reported) return
    p.reported = second
    const sorted = [...p.samples].sort((a, b) => a - b)
    const info = renderer.info
    report({
      status: p.elapsed < 15 ? `Warming ${second}/15s` : p.elapsed < 45 ? `Measuring ${second - 15}/30s` : 'Complete',
      samples: sorted.length,
      medianMs: sorted[Math.floor(sorted.length / 2)] ?? 0,
      p95Ms: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
      calls: info.render.drawCalls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
    })
    if (p.elapsed >= 45) p.elapsed = -1
  }, 2)
  return null
}

// Fixed camera coordinates from the pre-architecture authored layouts. The
// new north road changes road-array indices, so comparisons must not index
// the current road list or choose a different building after generation edits.
const comparisonPoses = [
  [{ junction: [48, 51], alley: [46.5, 5] }, { junction: [48, 48], alley: [43.5, 5] }],
  [{ junction: [48, 52], alley: [50.5, 5] }, { junction: [48, 46], alley: [45.5, 5] }],
  [{ junction: [48, 52], alley: [63.5, 5] }, { junction: [48, 50], alley: [68.5, 5] }],
] as const

function poseCamera(pose: Pose, run: Run) {
  const city = getWorld()?.city
  if (!city) return
  const insertion = city.landmarks.insertion
  const checkpoint = city.checkpoint
  if (pose === 'insertion') panCameraTo(insertion.x, insertion.z - 4)
  if (pose === 'checkpoint') panCameraTo(checkpoint.x, checkpoint.z)
  if (pose === 'gate approach') panCameraTo(checkpoint.x, checkpoint.z + 14)
  if (pose === 'east exit') panCameraTo(city.roadsV.at(-1) ?? 74, city.roadsH[0] ?? 11)
  if (pose === 'junction' || pose === 'alley') {
    const [x, z] = comparisonPoses[run.mission][run.variant][pose]
    panCameraTo(x, z)
  }
}

function Review() {
  const [run, setRun] = useState<Run>({ mission: 0, variant: 0, quality: 'high', id: 0 })
  const [ready, setReady] = useState(false)
  const [live, setLive] = useState(false)
  const [metrics, setMetrics] = useState(initial)
  const [hud, setHud] = useState(true)
  const [hidden, setHidden] = useState(false)
  const [fixture, setFixture] = useState(false)
  useEffect(() => {
    const m = MISSIONS[run.mission]
    const world = createWorld(m, ROSTER.slice(0, 4), { district: m.variants?.[run.variant] })
    useSettingsStore.setState({ quality: run.quality, muted: true })
    useAppStore.setState({ missionId: m.id, phase: 'mission' })
    useMissionStore.getState().reset()
    setWorld(world)
    useMissionStore.getState().setLive(true)
    world.tick(0.05)
    useMissionStore.getState().setLive(false)
    setReady(true)
    return () => {
      setWorld(null)
      useMissionStore.getState().reset()
    }
  }, [run])
  const change = (partial: Partial<Run>) => {
    setReady(false)
    setLive(false)
    setFixture(false)
    setMetrics(initial)
    setRun((r) => ({ ...r, ...partial, id: r.id + 1 }))
  }
  return <div className="mission-screen">
    {ready && <GameCanvas key={run.id} review={{ diagnostics: <Probe report={setMetrics} /> }} />}
    {hud && <Hud />}
    {fixture && <div style={{ position: 'absolute', top: 37, right: 10, zIndex: 101, color: 'var(--amber)', background: 'var(--panel)', fontSize: 11, padding: 5 }}>VISIBILITY FIXTURE · HOSTILES CLEARED</div>}
    <div style={{ position: 'absolute', top: 48, left: 10, zIndex: 100, background: 'var(--panel)', border: '1px solid var(--teal)', padding: 7, color: 'var(--ink)', fontSize: 11, maxWidth: 1040 }}>
      <button onClick={() => setHidden((v) => !v)}>{hidden ? 'Show review' : 'Hide review'}</button>
      {!hidden && <>
        <span> DEV CITY REVIEW · isolated save </span>
        <select aria-label="Mission" value={run.mission} onChange={(e) => change({ mission: Number(e.target.value) })}>{MISSIONS.map((m, i) => <option key={m.id} value={i}>{m.codename}</option>)}</select>
        <select aria-label="Variant" value={run.variant} onChange={(e) => change({ variant: Number(e.target.value) })}><option value={0}>Variant 0</option><option value={1}>Variant 1</option></select>
        <select aria-label="Quality" value={run.quality} onChange={(e) => change({ quality: e.target.value as QualityTier })}>{(['high', 'medium', 'low'] as const).map((v) => <option key={v}>{v}</option>)}</select>
        <div style={{ marginTop: 5, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {(['insertion', 'alley', 'junction', 'checkpoint', 'gate approach', 'east exit'] as const).map((p) => <button key={p} onClick={() => poseCamera(p, run)}>{p}</button>)}
          <button onClick={() => { useMissionStore.getState().setLive(!live); setLive(!live) }}>{live ? 'Freeze simulation' : 'Run simulation'}</button>
          <button onClick={() => setHud((v) => !v)}>{hud ? 'Hide HUD' : 'Show HUD'}</button>
          <button onClick={() => { measurement.requested = true }}>Measure 45s</button>
          <button onClick={() => { const w = getWorld(); if (w) { for (const u of w.units) { if (u.kind === 'enemy') { u.hp = 0; u.stance = 'dead' } } setFixture(true) } }}>Clear hostiles for route review</button>
          <button onClick={() => { const w = getWorld(); if (w) { useMissionStore.getState().setLive(true); for (let i = 0; i < 240; i++) w.tick(1); useMissionStore.getState().setLive(live) } }}>Weather +240s</button>
        </div>
        <output style={{ display: 'block', marginTop: 5 }}>{JSON.stringify(metrics)}</output>
      </>}
    </div>
  </div>
}

if (import.meta.env.DEV) createRoot(document.getElementById('root')!).render(<Review />)
