// Player input surface, split by mouse button.
//
// Left selects: a click takes the operative under the pointer, a drag takes
// every living operative inside the marquee, shift adds instead of replacing,
// and a click on bare ground clears. Right commands: move on the ground,
// attack on an enemy. Invisible pick cylinders ride every agent and enemy; an
// invisible ground plane catches everything else. The window level hotkeys are
// the squad group of game/bindings, matched by action id and never by a key
// literal.
//
// An empty selection is a real state: nothing re-selects the squad behind your
// back, so an order given with no one selected does nothing.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { bindingFor, codeOf } from '../game/bindings'
import { getWorld } from '../game/runtime'
import { noteTutorial } from '../state/tutorialStore'
import { useMissionStore } from '../state/missionStore'
import type { Unit, WorldApi } from '../game/types'
import { pushClickMarker } from './clickMarkers'
import { setMarquee } from './marquee'

const pickGeom = new THREE.CylinderGeometry(0.55, 0.55, 1.9, 8)
const invisibleMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
// Pointer travel in pixels that turns a click into a marquee drag.
const DRAG_MIN = 5
// Chest height: the point the box test drops onto the screen.
const PICK_Y = 0.95
const PROJ = new THREE.Vector3()

// A unit under the pointer. Agents are selection targets, enemies are not, but
// both count as something rather than bare ground.
interface Pick {
  id: string
  agent: boolean
}

// Screen space box in canvas pixels, plus the canvas size it was measured in.
interface Box {
  x0: number
  y0: number
  x1: number
  y1: number
  width: number
  height: number
}

function alive(u: Unit | undefined): boolean {
  return !!u && u.stance !== 'dead' && u.hp > 0
}

function livingAgents(w: WorldApi): string[] {
  const out: string[] = []
  for (const u of w.units) {
    if (u.kind === 'agent' && alive(u)) out.push(u.id)
  }
  return out
}

// The selection minus anyone who has died since it was made.
function selectedAgents(w: WorldApi): string[] {
  return useMissionStore.getState().selected.filter((id) => {
    const u = w.unit(id)
    return !!u && u.kind === 'agent' && alive(u)
  })
}

function toggle(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
}

// Living agents whose chest point projects inside the box, squad order. One
// point and no occlusion test: an operative behind a building still boxes, and
// one standing half out of the rectangle does not.
function agentsInBox(w: WorldApi, camera: THREE.Camera, b: Box): string[] {
  const out: string[] = []
  for (const u of w.units) {
    if (u.kind !== 'agent' || !alive(u)) continue
    PROJ.set(u.pos.x, PICK_Y, u.pos.z).project(camera)
    if (PROJ.z > 1) continue
    const sx = (PROJ.x * 0.5 + 0.5) * b.width
    const sy = (0.5 - PROJ.y * 0.5) * b.height
    if (sx >= b.x0 && sx <= b.x1 && sy >= b.y0 && sy <= b.y1) out.push(u.id)
  }
  return out
}

// A stance key moves the whole selection together: it releases the flag only
// when every selected agent already carries it, otherwise it sets it on all.
function allSet(w: WorldApi, ids: string[], key: 'holdGround' | 'holdFire'): boolean {
  return ids.every((id) => w.unit(id)?.[key] === true)
}

export default function Input() {
  const world = getWorld()
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const grenadeTargeting = useMissionStore((s) => s.grenadeTargeting)
  const size = world ? world.city.size : 96
  // Wave spawns grow the unit list mid-mission; tracking the count keeps the
  // pick proxies covering them. Devices are attack targets like enemies.
  const [unitCount, setUnitCount] = useState(world ? world.units.length : 0)
  const picks = useMemo(() => {
    if (!world) return []
    void unitCount
    return world.units
      .filter((u) => u.kind === 'agent' || u.kind === 'enemy' || u.kind === 'device')
      .map((u): Pick => ({ id: u.id, agent: u.kind === 'agent' }))
  }, [world, unitCount])
  const proxies = useRef<Map<string, THREE.Mesh>>(new Map())
  // Written by the pick handlers, read by the window pointerdown below: r3f
  // runs the canvas handlers before the same event reaches the window.
  const hitPick = useRef<Pick | null>(null)
  const abilityClick = useRef(false)
  const drag = useRef({
    on: false,
    moved: false,
    add: false,
    pick: null as Pick | null,
    pointerId: -1,
    x0: 0,
    y0: 0,
    x1: 0,
    y1: 0,
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  })

  // Modified presses are left to the browser, so Cmd+C still copies and Shift
  // held for additive card selection issues no orders. While the pause menu is
  // up only the pause key answers: every other action would land on a squad
  // the player cannot see behind the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
      const code = codeOf(e)
      const b = bindingFor(code)
      if (!b || (b.group !== 'squad' && b.group !== 'abilities')) return
      const w = getWorld()
      if (!w) return
      const ms = useMissionStore.getState()
      if (ms.paused && b.id !== 'pause') return
      if (ms.result !== 'none' && b.id !== 'pause') return
      // A focused dialog button owns Space: cancelling the press here would
      // stop it activating, so the menu would close instead of the button
      // under focus firing. Escape still closes the menu from anywhere.
      const focused = document.activeElement
      if (code === 'Space' && focused instanceof HTMLButtonElement && focused.closest('[role="dialog"]')) return
      e.preventDefault()
      switch (b.id) {
        case 'selectSlot': {
          // Slot n is the digit the code ends in, so the number row and the
          // keypad stay one entry.
          const id = 'a' + code.slice(-1)
          if (alive(w.unit(id))) {
            ms.setSelected([id])
            noteTutorial('select')
          }
          break
        }
        case 'selectAll':
          ms.setSelected(livingAgents(w))
          noteTutorial('select')
          break
        case 'clearSelection':
          ms.setSelected([])
          break
        case 'pause':
          ms.setPaused(!ms.paused)
          break
        // The item orders take the whole selection: the sim picks the target
        // and answers a bad selection with a comm fail line.
        case 'useMed':
          w.orderUseMed(selectedAgents(w))
          break
        case 'useCell':
          w.orderUseCell(selectedAgents(w))
          break
        case 'grenade': {
          if (ms.grenadeTargeting) {
            ms.setGrenadeTargeting(false)
            break
          }
          const id = selectedAgents(w)[0]
          if (id && ms.abilities.grenade.availability === 'usable') {
            ms.setGrenadeTargeting(true)
          }
          break
        }
        case 'stop':
        case 'holdGround':
        case 'holdFire':
        case 'swapWeapon':
        case 'useAbility': {
          // No fallback to the whole squad here: a bare key carries no target,
          // so an empty selection must stay empty and order nobody.
          const ids = selectedAgents(w)
          if (ids.length === 0) return
          if (b.id === 'stop') w.orderStop(ids)
          else if (b.id === 'holdGround') w.orderHold(ids, !allSet(w, ids, 'holdGround'))
          else if (b.id === 'holdFire') w.orderHoldFire(ids, !allSet(w, ids, 'holdFire'))
          else if (b.id === 'useAbility') w.orderAbility(ids)
          else w.orderSwapWeapon(ids)
          break
        }
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.cursor = grenadeTargeting ? 'crosshair' : ''
    return () => {
      document.body.style.cursor = ''
    }
  }, [grenadeTargeting])

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

  // Left button select, on window listeners so a drag survives leaving the
  // canvas and so the pick recorded by the r3f handlers is already in.
  useEffect(() => {
    const canvas = gl.domElement
    const d = drag.current

    // Ends the drag from every exit: pointerup, cancel, blur, a fresh press
    // and unmount. Owns the capture release, so no path can leave the canvas
    // holding the pointer.
    const stop = (): void => {
      d.on = false
      d.moved = false
      if (d.pointerId >= 0) {
        if (canvas.hasPointerCapture(d.pointerId)) canvas.releasePointerCapture(d.pointerId)
        d.pointerId = -1
      }
      setMarquee(null)
    }

    const down = (e: PointerEvent): void => {
      const hit = hitPick.current
      hitPick.current = null
      if (d.on) stop()
      if (e.button !== 0 || e.target !== canvas) return
      // R3F's ground/unit handler ran first. An armed grenade click is an
      // ability target, never the start of a select click or marquee.
      if (abilityClick.current || useMissionStore.getState().grenadeTargeting) {
        abilityClick.current = false
        return
      }
      const r = canvas.getBoundingClientRect()
      d.on = true
      d.moved = false
      d.add = e.shiftKey
      d.pick = hit
      d.pointerId = e.pointerId
      d.x0 = d.x1 = e.clientX
      d.y0 = d.y1 = e.clientY
      d.left = r.left
      d.top = r.top
      d.width = r.width
      d.height = r.height
      canvas.setPointerCapture(e.pointerId)
    }

    const move = (e: PointerEvent): void => {
      if (!d.on) return
      d.x1 = e.clientX
      d.y1 = e.clientY
      if (!d.moved && Math.abs(d.x1 - d.x0) + Math.abs(d.y1 - d.y0) >= DRAG_MIN) d.moved = true
      if (!d.moved) return
      setMarquee({
        x: Math.min(d.x0, d.x1) - d.left,
        y: Math.min(d.y0, d.y1) - d.top,
        w: Math.abs(d.x1 - d.x0),
        h: Math.abs(d.y1 - d.y0),
      })
    }

    const up = (e: PointerEvent): void => {
      if (!d.on || e.button !== 0) return
      const moved = d.moved
      const add = d.add
      const pick = d.pick
      stop()
      const w = getWorld()
      if (!w) return
      const ms = useMissionStore.getState()
      // Both additive paths build on the filtered selection, so nobody who has
      // fallen since the last click rides back into the array.
      const base = selectedAgents(w)
      if (moved) {
        const box = agentsInBox(w, camera, {
          x0: Math.min(d.x0, d.x1) - d.left,
          y0: Math.min(d.y0, d.y1) - d.top,
          x1: Math.max(d.x0, d.x1) - d.left,
          y1: Math.max(d.y0, d.y1) - d.top,
          width: d.width,
          height: d.height,
        })
        ms.setSelected(add ? [...base, ...box.filter((id) => !base.includes(id))] : box)
        if (box.length > 0) noteTutorial('select')
      } else if (pick) {
        // An enemy is not a selection target, but it is not bare ground
        // either: clicking one leaves the squad selected to be ordered onto it.
        if (pick.agent) {
          ms.setSelected(add ? toggle(base, pick.id) : [pick.id])
          noteTutorial('select')
        }
      } else if (!add) {
        ms.setSelected([])
      }
    }

    window.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', stop)
    window.addEventListener('blur', stop)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', stop)
      window.removeEventListener('blur', stop)
      stop()
    }
  }, [camera, gl])

  // Keep the pick proxies glued to their units; sink the dead ones.
  useFrame(() => {
    const w = getWorld()
    if (!w) return
    if (w.units.length !== unitCount) setUnitCount(w.units.length)
    for (const p of picks) {
      const mesh = proxies.current.get(p.id)
      const u = w.unit(p.id)
      if (!mesh || !u) continue
      if (u.stance === 'dead' || u.hp <= 0) mesh.position.set(u.pos.x, -60, u.pos.z)
      else mesh.position.set(u.pos.x, PICK_Y, u.pos.z)
    }
  }, 0)

  const throwGrenade = (point: THREE.Vector3): void => {
    const w = getWorld()
    if (!w) return
    const ids = selectedAgents(w)
    if (ids.length === 0) return
    abilityClick.current = true
    if (w.orderGrenade(ids[0], { x: point.x, z: point.z })) {
      useMissionStore.getState().setGrenadeTargeting(false)
      pushClickMarker(point.x, point.z)
    }
  }

  const onGround = (e: ThreeEvent<PointerEvent>): void => {
    if (e.button === 0 && useMissionStore.getState().grenadeTargeting) {
      e.stopPropagation()
      throwGrenade(e.point)
      return
    }
    if (e.button !== 2 || drag.current.on) return
    const w = getWorld()
    if (!w) return
    const ids = selectedAgents(w)
    if (ids.length === 0) return
    const x = Math.max(2, Math.min(w.city.size - 2, e.point.x))
    const z = Math.max(2, Math.min(w.city.size - 2, e.point.z))
    w.orderMove(ids, { x, z })
    pushClickMarker(x, z)
  }

  // Left records the unit under the pointer for the window pointerup above;
  // right falls through to the move order on the ground plane behind.
  const onAgentDown = (id: string) => (e: ThreeEvent<PointerEvent>): void => {
    if (e.button !== 0) return
    if (useMissionStore.getState().grenadeTargeting) {
      e.stopPropagation()
      throwGrenade(e.point)
      return
    }
    const w = getWorld()
    if (!w || !alive(w.unit(id))) return
    e.stopPropagation()
    hitPick.current = { id, agent: true }
  }

  const onEnemyDown = (id: string) => (e: ThreeEvent<PointerEvent>): void => {
    const w = getWorld()
    if (!w || !alive(w.unit(id))) return
    if (e.button === 0) {
      e.stopPropagation()
      if (useMissionStore.getState().grenadeTargeting) {
        throwGrenade(e.point)
        return
      }
      hitPick.current = { id, agent: false }
    } else if (e.button === 2 && !drag.current.on) {
      e.stopPropagation()
      const ids = selectedAgents(w)
      if (ids.length > 0) w.orderAttack(ids, id)
    }
  }

  const onPickOver = (cursor: string) => (e: ThreeEvent<PointerEvent>): void => {
    const w = getWorld()
    const u = w ? w.unit((e.object as THREE.Mesh).name) : undefined
    if (alive(u)) document.body.style.cursor = grenadeTargeting ? 'crosshair' : cursor
  }

  const onPickOut = (): void => {
    document.body.style.cursor = grenadeTargeting ? 'crosshair' : ''
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
      {picks.map((p) => (
        <mesh
          key={p.id}
          name={p.id}
          geometry={pickGeom}
          material={invisibleMat}
          position={[0, -60, 0]}
          ref={(mesh: THREE.Mesh | null) => {
            if (mesh) proxies.current.set(p.id, mesh)
            else proxies.current.delete(p.id)
          }}
          onPointerDown={p.agent ? onAgentDown(p.id) : onEnemyDown(p.id)}
          onPointerOver={onPickOver(p.agent ? 'pointer' : 'crosshair')}
          onPointerOut={onPickOut}
        />
      ))}
    </>
  )
}
