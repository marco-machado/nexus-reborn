// Standalone inspector: no campaign, mission runtime, or save bootstrap.
import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { buildView, getShared, type View } from '../src/scene/unitModel'
import { ROSTER, WEAPONS } from '../src/game/data'
import { BG, BG_PANEL_SOLID, INK_FAINT, TEAL } from '../src/ui/tokens'
import '../src/index.css'
import './asset-viewer.css'

function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id)
  if (!node) throw new Error(`Missing viewer element: ${id}`)
  return node as T
}

const status = element('status')
const viewport = element('viewport')
const canvas = element<HTMLCanvasElement>('scene')
const operative = element<HTMLSelectElement>('operative')
const weapon = element<HTMLInputElement>('weapon')
const markers = element<HTMLInputElement>('markers')
const wireframe = element<HTMLInputElement>('wireframe')
const rotate = element<HTMLInputElement>('rotate')
const exposure = element<HTMLInputElement>('exposure')
const listeners = new AbortController()
const renderer = new THREE.WebGPURenderer({ canvas, antialias: true })
const scene = new THREE.Scene()
scene.background = new THREE.Color(BG)
const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100)
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.minDistance = 1.3
controls.maxDistance = 15
controls.maxPolarAngle = Math.PI / 2 - 0.02
controls.autoRotateSpeed = 1.5
const timer = new THREE.Timer()
timer.connect(document)
let view: View | undefined
let disposed = false

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: BG_PANEL_SOLID, roughness: 1 }),
)
floor.rotation.x = -Math.PI / 2
floor.position.y = -0.015
floor.receiveShadow = true
const grid = new THREE.GridHelper(8, 16, INK_FAINT, INK_FAINT)
scene.add(floor, grid)

const key = new THREE.DirectionalLight('#ffffff', 3.5)
key.position.set(3, 6, 4)
key.castShadow = true
key.shadow.mapSize.set(1024, 1024)
key.shadow.camera.left = -3
key.shadow.camera.right = 3
key.shadow.camera.top = 3
key.shadow.camera.bottom = -3
key.shadow.camera.near = 0.1
key.shadow.camera.far = 15
key.shadow.normalBias = 0.02
const rim = new THREE.DirectionalLight(TEAL, 0.65)
rim.position.set(-3, 3, -3)
scene.add(new THREE.HemisphereLight('#ffffff', INK_FAINT, 2.5), key, rim)

function setCamera(preset: string) {
  controls.autoRotate = false
  rotate.checked = false
  // Flush pending orbit deltas before setting an exact camera preset.
  controls.enableDamping = false
  controls.update()
  controls.target.set(0, markers.checked ? 1.3 : 1, 0)
  const positions: Record<string, [number, number, number]> = {
    perspective: [4.2, 1.85, 2.35],
    front: [5.3, 1.4, 0],
    side: [0, 1.4, 5.3],
    back: [-5.3, 1.4, 0],
  }
  camera.position.set(...(positions[preset] ?? positions.perspective))
  camera.position.y -= 1
  camera.position.multiplyScalar(markers.checked ? 1.25 : 1).add(controls.target)
  controls.update()
  controls.enableDamping = true
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.view === preset))
  })
}

function updateDisplay() {
  if (!view) return
  view.rig.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    object.castShadow = true
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials) {
      if (material instanceof THREE.MeshStandardMaterial && material.wireframe !== wireframe.checked) {
        material.wireframe = wireframe.checked
        material.needsUpdate = true
      }
    }
  })
  view.faction.visible = markers.checked
  if (view.ring) view.ring.visible = markers.checked
  if (view.glow) view.glow.visible = markers.checked
  if (view.tag) view.tag.visible = markers.checked
}

function loadAgent() {
  if (view) scene.remove(view.root)
  const definition = ROSTER.find((entry) => entry.id === operative.value)
  view = buildView({
    id: 'asset-viewer-agent',
    kind: 'agent',
    operative: definition,
    weapon: weapon.checked ? WEAPONS[definition?.weapon ?? 'assault'] : null,
    agentSlot: 1,
  }, getShared())
  scene.add(view.root)
  updateDisplay()
  element('asset-label').textContent = `AGENT / ${definition?.codename ?? 'DEFAULT'}`

  let meshes = 0
  let triangles = 0
  const materials = new Set<THREE.Material>()
  view.rig.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    meshes++
    triangles += (object.geometry.index?.count ?? object.geometry.getAttribute('position').count) / 3
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material)
  })
  const size = new THREE.Box3().setFromObject(view.rig).getSize(new THREE.Vector3())
  const stats = element('stats')
  stats.replaceChildren()
  for (const [label, value] of [
    ['Meshes', String(meshes)], ['Triangles', triangles.toLocaleString()], ['Materials', String(materials.size)],
    ['Height', `${size.y.toFixed(2)} m`], ['Width × depth', `${size.x.toFixed(2)} × ${size.z.toFixed(2)} m`],
  ]) {
    const term = document.createElement('dt')
    const detail = document.createElement('dd')
    term.textContent = label
    detail.textContent = value
    stats.append(term, detail)
  }
}

function resize() {
  camera.aspect = viewport.clientWidth / viewport.clientHeight
  camera.updateProjectionMatrix()
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(viewport.clientWidth, viewport.clientHeight, false)
}

const observer = new ResizeObserver(resize)
const quaternion = new THREE.Quaternion()

async function start() {
  await renderer.init()
  if (disposed) { renderer.dispose(); return }
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = Number(exposure.value)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  const backend = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend ? 'WebGPU' : 'WebGL2'
  element('backend').textContent = backend
  console.info(`[asset-viewer] renderer backend: ${backend}`)

  for (const entry of ROSTER) operative.add(new Option(entry.codename, entry.id))
  const signal = listeners.signal
  operative.addEventListener('change', loadAgent, { signal })
  weapon.addEventListener('change', loadAgent, { signal })
  markers.addEventListener('change', () => {
    updateDisplay()
    setCamera('perspective')
  }, { signal })
  wireframe.addEventListener('change', updateDisplay, { signal })
  rotate.addEventListener('change', () => { controls.autoRotate = rotate.checked }, { signal })
  element<HTMLInputElement>('grid').addEventListener('change', (event) => {
    grid.visible = (event.target as HTMLInputElement).checked
  }, { signal })
  exposure.addEventListener('input', () => {
    renderer.toneMappingExposure = Number(exposure.value)
    element('exposure-value').textContent = Number(exposure.value).toFixed(1)
  }, { signal })
  element('reset').addEventListener('click', () => setCamera('perspective'), { signal })
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button) => {
    button.addEventListener('click', () => setCamera(button.dataset.view ?? 'perspective'), { signal })
  })
  controls.addEventListener('start', () => {
    document.querySelectorAll('[data-view]').forEach((button) => button.setAttribute('aria-pressed', 'false'))
  })
  canvas.addEventListener('contextmenu', (event) => event.preventDefault(), { signal })
  loadAgent()
  setCamera('perspective')
  resize()
  observer.observe(viewport)
  renderer.setAnimationLoop(() => {
    timer.update()
    controls.update(Math.min(timer.getDelta(), 0.05))
    if (view?.tag) {
      quaternion.copy(view.root.quaternion).invert().multiply(camera.quaternion)
      view.tag.quaternion.copy(quaternion)
    }
    try {
      renderer.render(scene, camera)
      status.hidden = true
    } catch (error) {
      renderer.setAnimationLoop(null)
      showError(error)
    }
  })
}

function dispose() {
  if (disposed) return
  disposed = true
  listeners.abort()
  observer.disconnect()
  controls.dispose()
  timer.dispose()
  renderer.setAnimationLoop(null)
  // The standalone renderer owns its entire resource cache, unlike a mission unit.
  const resources = view ? getShared() : {}
  const released = new Set<unknown>()
  function release(value: unknown) {
    if (released.has(value)) return
    released.add(value)
    if (value instanceof THREE.Material) {
      for (const property of Object.values(value)) if (property instanceof THREE.Texture) release(property)
      value.dispose()
    } else if (value instanceof THREE.BufferGeometry || value instanceof THREE.Texture) value.dispose()
    else if (value instanceof Map || Array.isArray(value)) for (const item of value.values()) release(item)
    else if (value && typeof value === 'object') for (const item of Object.values(value)) release(item)
  }
  for (const value of Object.values(resources)) release(value)
  release(floor.geometry)
  release(floor.material)
  grid.dispose()
  key.dispose()
  renderer.dispose()
}

function showError(error: unknown) {
  console.error('[asset-viewer]', error)
  status.hidden = false
  status.textContent = `Could not render the agent: ${error instanceof Error ? error.message : String(error)}`
}

void start().catch(showError)
window.addEventListener('pagehide', (event) => { if (!event.persisted) dispose() }, { signal: listeners.signal })
if (import.meta.hot) import.meta.hot.dispose(dispose)
