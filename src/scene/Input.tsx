// Player input surface: an invisible ground plane for move orders, invisible
// pick cylinders over enemies for attack orders, and window-level hotkeys for
// slot selection, pause and the stop and stance orders.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { getWorld } from '../game/runtime'
import { useMissionStore } from '../state/missionStore'
import type { WorldApi } from '../game/types'
import { pushClickMarker } from './clickMarkers'

const pickGeom = new THREE.CylinderGeometry(0.55, 0.55, 1.9, 8)
const invisibleMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })

function livingAgents(w: WorldApi): string[] {
  const out: string[] = []
  for (const u of w.units) {
    if (u.kind === 'agent' && u.stance !== 'dead' && u.hp > 0) out.push(u.id)
  }
  return out
}

// Current selection filtered to living agents. Read-only.
function selectedAgents(w: WorldApi): string[] {
  return useMissionStore.getState().selected.filter((id) => {
    const u = w.unit(id)
    return !!u && u.kind === 'agent' && u.stance !== 'dead' && u.hp > 0
  })
}

// Click orders fall back to the whole living squad when nothing valid is
// selected. Only a click may do this: it carries a destination, so reviving an
// empty selection is a convenience rather than a surprise.
function resolveSelection(w: WorldApi): string[] {
  const ids = selectedAgents(w)
  if (ids.length > 0) return ids
  const all = livingAgents(w)
  if (all.length > 0) useMissionStore.getState().setSelected(all)
  return all
}

// Physical key codes for the order keys, so they survive a non-Latin layout.
// Some environments deliver synthetic events with an empty code, hence the
// fallback to the produced character.
const ORDER_CODES: Record<string, 'x' | 'h' | 'c'> = { KeyX: 'x', KeyH: 'h', KeyC: 'c' }

// A stance key moves the whole selection together: it releases the flag only
// when every selected agent already carries it, otherwise it sets it on all.
function allSet(w: WorldApi, ids: string[], key: 'holdGround' | 'holdFire'): boolean {
  return ids.every((id) => w.unit(id)?.[key] === true)
}

export default function Input() {
  const world = getWorld()
  const size = world ? world.city.size : 96
  const enemyIds = useMemo(() => {
    if (!world) return []
    return world.units.filter((u) => u.kind === 'enemy').map((u) => u.id)
  }, [world])
  const proxies = useRef<Map<string, THREE.Mesh>>(new Map())

  // Hotkeys: 1..4 select slots, 0 or backquote select all, Escape clears,
  // Space pauses, X stops, H toggles hold ground, C toggles hold fire.
  // Modified presses are left to the browser, so Cmd+C still copies and
  // Shift held for additive card selection issues no orders.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
      const w = getWorld()
      if (!w) return
      const ms = useMissionStore.getState()
      const k = ORDER_CODES[e.code] ?? e.key.toLowerCase()
      if (e.key >= '1' && e.key <= '4') {
        const id = 'a' + e.key
        const u = w.unit(id)
        if (u && u.stance !== 'dead' && u.hp > 0) ms.setSelected([id])
      } else if (e.key === '0' || e.key === '`') {
        ms.setSelected(livingAgents(w))
      } else if (e.key === 'Escape') {
        ms.setSelected([])
      } else if (e.key === ' ') {
        e.preventDefault()
        ms.setPaused(!ms.paused)
      } else if (k === 'x' || k === 'h' || k === 'c') {
        // No fallback to the whole squad here: a bare key carries no target,
        // so an empty selection must stay empty and order nobody.
        const ids = selectedAgents(w)
        if (ids.length === 0) return
        if (k === 'x') w.orderStop(ids)
        else if (k === 'h') w.orderHold(ids, !allSet(w, ids, 'holdGround'))
        else w.orderHoldFire(ids, !allSet(w, ids, 'holdFire'))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Default-select the living squad once on mission start.
  useEffect(() => {
    const w = getWorld()
    if (!w) return
    const ms = useMissionStore.getState()
    if (ms.selected.length === 0) ms.setSelected(livingAgents(w))
    return () => {
      document.body.style.cursor = ''
    }
  }, [])

  // Keep enemy pick proxies glued to their units; sink dead ones.
  useFrame(() => {
    const w = getWorld()
    if (!w) return
    for (const id of enemyIds) {
      const mesh = proxies.current.get(id)
      const u = w.unit(id)
      if (!mesh || !u) continue
      if (u.stance === 'dead' || u.hp <= 0) mesh.position.set(u.pos.x, -60, u.pos.z)
      else mesh.position.set(u.pos.x, 0.95, u.pos.z)
    }
  }, 0)

  const onGround = (e: ThreeEvent<PointerEvent>): void => {
    if (e.button !== 0 && e.button !== 2) return
    const w = getWorld()
    if (!w) return
    const ids = resolveSelection(w)
    if (ids.length === 0) return
    const x = Math.max(2, Math.min(w.city.size - 2, e.point.x))
    const z = Math.max(2, Math.min(w.city.size - 2, e.point.z))
    w.orderMove(ids, { x, z })
    pushClickMarker(x, z)
  }

  const onEnemyDown = (id: string) => (e: ThreeEvent<PointerEvent>): void => {
    const w = getWorld()
    if (!w) return
    const u = w.unit(id)
    if (!u || u.stance === 'dead' || u.hp <= 0) return
    e.stopPropagation()
    if (e.button !== 0 && e.button !== 2) return
    const ids = resolveSelection(w)
    if (ids.length > 0) w.orderAttack(ids, id)
  }

  const onEnemyOver = (e: ThreeEvent<PointerEvent>): void => {
    const w = getWorld()
    const u = w ? w.unit((e.object as THREE.Mesh).name) : undefined
    if (u && u.stance !== 'dead' && u.hp > 0) document.body.style.cursor = 'crosshair'
  }

  const onEnemyOut = (): void => {
    document.body.style.cursor = ''
  }

  return (
    <>
      <mesh
        position={[size / 2, 0, size / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={invisibleMat}
        onPointerDown={onGround}
      >
        <planeGeometry args={[size, size]} />
      </mesh>
      {enemyIds.map((id) => (
        <mesh
          key={id}
          name={id}
          geometry={pickGeom}
          material={invisibleMat}
          position={[0, -60, 0]}
          ref={(mesh: THREE.Mesh | null) => {
            if (mesh) proxies.current.set(id, mesh)
            else proxies.current.delete(id)
          }}
          onPointerDown={onEnemyDown(id)}
          onPointerOver={onEnemyOver}
          onPointerOut={onEnemyOut}
        />
      ))}
    </>
  )
}
