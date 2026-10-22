import { Component, memo, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode, RefObject } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei/core/OrbitControls'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import {
  AdditiveBlending, BackSide, BufferGeometry, Color, DirectionalLight,
  Float32BufferAttribute, ImageBitmapLoader, Quaternion, SRGBColorSpace, Texture, Vector3,
} from 'three'
import { CITIES, CORPS, SECTORS, sectorAtGeo, sectorCorp } from '../game/atlas'
import type { CorpId } from '../game/atlas'
import { globeLocation, globePosition, SECTOR_FOCUS, unprojectScan } from '../game/geography'
import type { GeoPoint } from '../game/geography'
import { SECTOR_OUTLINES } from '../game/sectorOutlines'
import { mulberry32 } from '../game/rng'
import type { SectorId } from '../game/types'
import { useWorldStore } from '../state/worldStore'
import { useSettingsStore } from '../state/settingsStore'
import { GLOBE_ATMOSPHERE, GLOBE_SPACE, GLOBE_STAR, GLOBE_SUN } from './tokens'
import { placeGlobeLabels } from './globeLabels'
import { uiClick } from './sound'

export interface GlobeOperation {
  id: string
  name: string
  city: string
  location: GeoPoint
  sector: SectorId
  locked: boolean
  requirement: string
  type: string
  chance: number
  etaDays: number
}

interface Marker {
  id: string
  label: string
  location: GeoPoint
  sector: SectorId
  corp: CorpId
  operation?: GlobeOperation
}

interface ViewCommand {
  serial: number
  target?: GeoPoint
  zoom?: number
  deltaLon?: number
  deltaLat?: number
}

const HOME_DISTANCE = 4.25
const MIN_DISTANCE = 2.05
const MAX_DISTANCE = 6.2
const ZERO = new Vector3()

function coordinates({ lat, lon }: GeoPoint): string {
  return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'} / ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`
}

// The Earth image is 5400x2700. Loaded as an ImageBitmap it is decoded once,
// off the main thread, and the r3f loader cache keeps the decoded bitmap for
// every later World Network visit; an <img> was decoded again on the main
// thread at each upload (frame-time pass 2026-10-22, R1).
const EARTH_URL = '/textures/earth/blue-marble.jpg'
function earthBitmapOptions(loader: ImageBitmapLoader) {
  loader.setOptions({ imageOrientation: 'flipY', premultiplyAlpha: 'none' })
}

class GlobeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return (
      <div className="globe-status" role="alert">
        <b>GLOBE UNAVAILABLE</b><span>The Earth view could not be loaded.</span>
        <button className="btn" onClick={() => {
          useLoader.clear(ImageBitmapLoader, EARTH_URL)
          this.setState({ failed: false })
        }}>RETRY</button>
      </div>
    )
    return this.props.children
  }
}

function GlobeCamera({ command, reducedMotion, onNavigate }: {
  command: ViewCommand; reducedMotion: boolean; onNavigate: () => void
}) {
  const controls = useRef<OrbitControlsImpl>(null)
  const { camera, invalidate } = useThree()
  const flight = useRef<{
    from: Vector3; rotation: Quaternion; fromDistance: number; toDistance: number; elapsed: number
  } | null>(null)
  const turn = useMemo(() => new Quaternion(), [])

  useEffect(() => {
    const current = globeLocation(camera.position.x, camera.position.y, camera.position.z)
    const target = command.target ?? {
      lat: Math.max(-88, Math.min(88, current.lat + (command.deltaLat ?? 0))),
      lon: current.lon + (command.deltaLon ?? 0),
    }
    const fromDistance = camera.position.length()
    const toDistance = command.target ? HOME_DISTANCE
      : Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, fromDistance * (command.zoom ?? 1)))
    const from = camera.position.clone().normalize()
    const to = new Vector3(...globePosition(target))
    if (reducedMotion) {
      camera.position.copy(to).multiplyScalar(toDistance)
      camera.lookAt(ZERO)
      controls.current?.update()
      flight.current = null
    } else {
      flight.current = { from, rotation: new Quaternion().setFromUnitVectors(from, to), fromDistance, toDistance, elapsed: 0 }
    }
    invalidate()
  }, [camera, command, invalidate, reducedMotion])

  useFrame((_, dt) => {
    const active = flight.current
    if (!active) return
    active.elapsed = Math.min(1, active.elapsed + dt / 0.85)
    const t = active.elapsed * active.elapsed * (3 - 2 * active.elapsed)
    turn.identity().slerp(active.rotation, t)
    camera.position.copy(active.from).applyQuaternion(turn)
      .multiplyScalar(active.fromDistance + (active.toDistance - active.fromDistance) * t)
    camera.lookAt(ZERO)
    controls.current?.update()
    if (active.elapsed === 1) flight.current = null
    invalidate()
  }, -0.5)

  return <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping={!reducedMotion}
    dampingFactor={0.12} rotateSpeed={0.55} zoomSpeed={0.7}
    minDistance={MIN_DISTANCE} maxDistance={MAX_DISTANCE} minPolarAngle={0.015} maxPolarAngle={Math.PI - 0.015}
    onStart={() => { flight.current = null; onNavigate() }} />
}

function GlobeLight() {
  const light = useRef<DirectionalLight>(null)
  const offset = useMemo(() => new Vector3(), [])
  useFrame(({ camera }) => {
    if (light.current) {
      offset.set(-3, 4, 5).applyQuaternion(camera.quaternion)
      light.current.position.copy(camera.position).add(offset)
    }
  })
  return <><ambientLight intensity={1.1} /><directionalLight ref={light} color={GLOBE_SUN} intensity={3} /></>
}

const ATMOSPHERE_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`
const ATMOSPHERE_FRAGMENT = `
  uniform vec3 glow;
  uniform float outer;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float facing = dot(normalize(vNormal), viewDir);
    float strength = outer > 0.5
      ? pow(clamp(1.0 + facing, 0.0, 1.0), 7.0) * 0.6
      : pow(1.0 - max(facing, 0.0), 4.5) * 0.32;
    gl_FragColor = vec4(glow * 1.8, strength);
    #include <colorspace_fragment>
  }
`

function Atmosphere() {
  const inner = useMemo(() => ({ glow: { value: new Color(GLOBE_ATMOSPHERE) }, outer: { value: 0 } }), [])
  const outer = useMemo(() => ({ glow: { value: new Color(GLOBE_ATMOSPHERE) }, outer: { value: 1 } }), [])
  return <>
    <mesh raycast={() => null}>
      <sphereGeometry args={[1.002, 128, 96]} />
      <shaderMaterial vertexShader={ATMOSPHERE_VERTEX} fragmentShader={ATMOSPHERE_FRAGMENT}
        uniforms={inner} transparent depthWrite={false} blending={AdditiveBlending} />
    </mesh>
    <mesh raycast={() => null}>
      <sphereGeometry args={[1.016, 128, 96]} />
      <shaderMaterial vertexShader={ATMOSPHERE_VERTEX} fragmentShader={ATMOSPHERE_FRAGMENT}
        uniforms={outer} side={BackSide} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
    </mesh>
  </>
}

function StarField() {
  const geometry = useMemo(() => {
    const rng = mulberry32(0x57a45)
    const positions: number[] = []
    const colors: number[] = []
    const tint = new Color(GLOBE_STAR)
    for (let i = 0; i < 3500; i++) {
      const z = rng() * 2 - 1
      const azimuth = rng() * Math.PI * 2
      const ring = Math.sqrt(1 - z * z)
      positions.push(40 * ring * Math.cos(azimuth), 40 * z, 40 * ring * Math.sin(azimuth))
      const brightness = 0.22 + rng() * 0.65
      colors.push(tint.r * brightness, tint.g * brightness, tint.b * brightness)
    }
    const result = new BufferGeometry()
    result.setAttribute('position', new Float32BufferAttribute(positions, 3))
    result.setAttribute('color', new Float32BufferAttribute(colors, 3))
    return result
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <points geometry={geometry} raycast={() => null}>
    <pointsMaterial size={0.032} sizeAttenuation vertexColors transparent opacity={0.7} depthWrite={false} />
  </points>
}

function SectorOutline({ sector, color }: { sector: SectorId; color: string }) {
  const geometry = useMemo(() => {
    const positions: number[] = []
    for (const territory of SECTOR_OUTLINES) {
      if (territory.sector !== sector) continue
      const points = territory.pts.split(' ').map((p) => {
        const [x, y] = p.split(',').map(Number)
        return unprojectScan(x, y)
      })
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1]
        const b = points[i]
        const deltaLon = ((b.lon - a.lon + 540) % 360) - 180
        const steps = Math.max(1, Math.ceil(Math.max(Math.abs(a.lat - b.lat), Math.abs(deltaLon)) / 1.5))
        for (let step = 0; step < steps; step++) {
          for (const t of [step / steps, (step + 1) / steps]) {
            positions.push(...globePosition({ lat: a.lat + (b.lat - a.lat) * t, lon: a.lon + deltaLon * t }, 1.003))
          }
        }
      }
    }
    const result = new BufferGeometry()
    result.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return result
  }, [sector])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <lineSegments geometry={geometry} raycast={() => null}>
    <lineBasicMaterial color={color} transparent opacity={0.5} depthWrite={false} />
  </lineSegments>
}

function Earth({ onReady, onSelect }: { onReady: () => void; onSelect: (sector: SectorId) => void }) {
  const bitmap = useLoader(ImageBitmapLoader, EARTH_URL, earthBitmapOptions)
  const texture = useMemo(() => {
    const t = new Texture(bitmap)
    // The bitmap is decoded already flipped (earthBitmapOptions); flipY is
    // ignored for bitmaps on WebGL and would flip twice on WebGPU.
    t.flipY = false
    return t
  }, [bitmap])
  const { gl, invalidate } = useThree()
  useLayoutEffect(() => {
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy())
    texture.needsUpdate = true
    onReady()
    invalidate()
  }, [texture, gl, onReady, invalidate])
  const pick = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 4) return
    const sector = sectorAtGeo(globeLocation(event.point.x, event.point.y, event.point.z))
    if (sector && sector !== 'an') onSelect(sector)
  }
  return <mesh onClick={pick}>
    <sphereGeometry args={[1, 192, 128]} />
    <meshStandardMaterial map={texture} roughness={1} metalness={0} />
  </mesh>
}

function MarkerProjection({ markers, layer, readout, enabled, textScale }: {
  markers: Marker[]
  layer: RefObject<HTMLDivElement | null>
  readout: RefObject<HTMLOutputElement | null>
  enabled: boolean
  textScale: number
}) {
  const { invalidate } = useThree()
  const scratch = useMemo(() => new Vector3(), [])
  const entries = useRef<{
    marker: Marker; position: Vector3; element: HTMLButtonElement; label: HTMLElement; width: number; height: number
  }[]>([])
  useLayoutEffect(() => {
    entries.current = markers.flatMap((marker) => {
      const element = layer.current?.querySelector<HTMLButtonElement>(`[data-marker="${marker.id}"]`)
      const label = element?.querySelector<HTMLElement>('.globe-marker-label')
      if (!element || !label) return []
      // Hidden pins still need text measurement once; use visibility for this
      // layout pass and never read layout from the animation loop.
      element.hidden = false
      element.style.visibility = 'hidden'
      return [{ marker, position: new Vector3(...globePosition(marker.location)), element, label,
        width: label.offsetWidth, height: label.offsetHeight }]
    })
    invalidate()
  }, [markers, layer, invalidate, textScale])

  useFrame(({ camera, size }) => {
    if (readout.current) {
      const value = coordinates(globeLocation(camera.position.x, camera.position.y, camera.position.z))
      if (readout.current.textContent !== value) readout.current.textContent = value
    }
    const visible = []
    for (const entry of entries.current) {
      const facing = camera.position.dot(entry.position) > 1.045
      scratch.copy(entry.position).multiplyScalar(1.006).project(camera)
      const x = (scratch.x + 1) / 2 * size.width
      const y = (1 - scratch.y) / 2 * size.height
      const inFrame = x > 12 && x < size.width - 12 && y > 44 && y < size.height - 54
      entry.element.hidden = !enabled || !facing || !inFrame
      entry.element.style.visibility = ''
      if (entry.element.hidden) continue
      entry.element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`
      visible.push({ id: entry.marker.id, x, y, width: entry.width, height: entry.height })
    }
    const labels = placeGlobeLabels(visible, size.width, size.height)
    for (const entry of entries.current) {
      const label = labels.get(entry.marker.id)
      const pin = visible.find((p) => p.id === entry.marker.id)
      entry.label.style.visibility = label ? 'visible' : 'hidden'
      if (label && pin) {
        entry.label.style.left = `${label.x - pin.x + 8}px`
        entry.label.style.top = `${label.y - pin.y + 8}px`
      }
    }
  })
  useEffect(() => { invalidate() }, [enabled, invalidate])
  return null
}

function ContextHealth({ onState }: { onState: (state: 'loading' | 'ready' | 'recovering') => void }) {
  const { gl, invalidate } = useThree()
  useEffect(() => {
    const canvas = gl.domElement
    const lost = (event: Event) => { event.preventDefault(); onState('recovering') }
    const restored = () => { onState('ready'); invalidate() }
    canvas.addEventListener('webglcontextlost', lost)
    canvas.addEventListener('webglcontextrestored', restored)
    return () => {
      canvas.removeEventListener('webglcontextlost', lost)
      canvas.removeEventListener('webglcontextrestored', restored)
    }
  }, [gl, invalidate, onState])
  return null
}

interface WorldGlobeProps {
  operations: GlobeOperation[]
  onOpen: (id: string) => void
}

function GlobeView({ operations, onOpen }: WorldGlobeProps) {
  const selected = useWorldStore((s) => s.selected)
  const owner = useWorldStore((s) => s.owner)
  const select = useWorldStore((s) => s.select)
  const reducedMotion = useSettingsStore((s) => s.reducedMotion)
  const textScale = useSettingsStore((s) => s.textScale)
  // The globe opens on the Focus sector (Europe on a new campaign); HOME returns there.
  const [opening] = useState(() => SECTOR_FOCUS[selected])
  const [command, setCommand] = useState<ViewCommand>({ serial: 0, target: opening })
  const [showLabels, setShowLabels] = useState(true)
  const [focused, setFocused] = useState<SectorId | null>(selected)
  const [status, setStatus] = useState<'loading' | 'ready' | 'recovering'>('loading')
  const previousSector = useRef(selected)
  const layer = useRef<HTMLDivElement>(null)
  const readout = useRef<HTMLOutputElement>(null)
  const request = useCallback((next: Omit<ViewCommand, 'serial'>) => {
    setFocused(null)
    setCommand((previous) => ({ ...next, serial: previous.serial + 1 }))
  }, [])
  const ready = useCallback(() => setStatus('ready'), [])
  const focus = useCallback((sector: SectorId) => {
    request({ target: SECTOR_FOCUS[sector] })
    setFocused(sector)
  }, [request])
  useEffect(() => {
    if (previousSector.current !== selected) focus(selected)
    previousSector.current = selected
  }, [selected, focus])

  const markers = useMemo<Marker[]>(() => {
    const operationCities = new Set(operations.map((op) => op.city))
    return [
      ...operations.map((operation) => ({ id: `op-${operation.id}`, label: operation.name,
        location: operation.location, sector: operation.sector,
        corp: sectorCorp(operation.sector, owner), operation })),
      ...CITIES.filter((city) => !operationCities.has(city.name))
        .sort((a, b) => Number(b.sector === selected) - Number(a.sector === selected))
        .map((city) => ({ id: `city-${city.id}`, label: city.name, location: city,
          sector: city.sector, corp: owner[city.id] ?? city.corp })),
    ]
  }, [operations, owner, selected])

  const pickSector = useCallback((sector: SectorId) => {
    select(sector)
    focus(sector)
    uiClick()
  }, [select, focus])
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget && (event.target as HTMLElement).tagName !== 'CANVAS') return
    const actions: Record<string, Omit<ViewCommand, 'serial'>> = {
      ArrowLeft: { deltaLon: -15 }, ArrowRight: { deltaLon: 15 },
      ArrowUp: { deltaLat: 12 }, ArrowDown: { deltaLat: -12 },
      '+': { zoom: 0.84 }, '=': { zoom: 0.84 }, '-': { zoom: 1.19 }, Home: { target: SECTOR_FOCUS[selected] },
    }
    if (actions[event.key]) { event.preventDefault(); request(actions[event.key]) }
  }

  return <div className="globe-view" tabIndex={0} onKeyDown={keyDown}
    aria-label="Interactive Earth globe. Drag to rotate, scroll to zoom. Arrow keys rotate; plus and minus zoom; Home resets the view.">
      <Canvas frameloop="demand" dpr={[1, 2]} camera={{ position: globePosition(opening, HOME_DISTANCE), fov: 32, near: 0.05, far: 100 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}>
        <color attach="background" args={[GLOBE_SPACE]} />
        <GlobeCamera command={command} reducedMotion={reducedMotion} onNavigate={() => setFocused(null)} />
        <GlobeLight />
        <StarField />
        <Suspense fallback={null}>
          <Earth onReady={ready} onSelect={pickSector} />
          <Atmosphere />
          {showLabels && focused && <SectorOutline sector={focused} color={CORPS[sectorCorp(focused, owner)].color} />}
        </Suspense>
        <MarkerProjection markers={markers} layer={layer} readout={readout} enabled={showLabels && status === 'ready'} textScale={textScale} />
        <ContextHealth onState={setStatus} />
      </Canvas>

    <div ref={layer} className="globe-marker-layer">
      {markers.map((marker) => <button key={marker.id} type="button" data-marker={marker.id} hidden
        className={'globe-marker corp-' + marker.corp + (marker.operation ? ' contract' : ' city') + (marker.operation?.locked ? ' locked' : '')}
        aria-label={marker.operation
          ? marker.operation.locked ? `${marker.label} // LOCKED // ${marker.operation.requirement}`
            : `OPEN CONTRACT ${marker.label} // ${marker.operation.type} // ${marker.operation.city}`
          : `${marker.label} // FOCUS ${SECTORS.find((s) => s.id === marker.sector)?.name}`}
        aria-disabled={marker.operation?.locked || undefined}
        title={`${marker.operation?.city ?? marker.label} · ${coordinates(marker.location)}`}
        onClick={() => marker.operation
          ? !marker.operation.locked && onOpen(marker.operation.id)
          : pickSector(marker.sector)}>
        <span className="globe-marker-core" aria-hidden="true" />
        <span className="globe-marker-label">
          <b>{marker.label}</b>
          {marker.operation && <small>{marker.operation.city} · {marker.operation.locked ? 'LOCKED' : marker.operation.type}</small>}
        </span>
        {marker.operation && <span className="tip" aria-hidden="true"><b>{marker.label}</b>
          {marker.operation.locked ? <i>{marker.operation.requirement}</i>
            : <><i>{marker.operation.chance}% CHANCE</i><i>ETA {marker.operation.etaDays}D</i></>}
        </span>}
      </button>)}
    </div>

    <output className="globe-coordinates" ref={readout} aria-label="Globe view center" aria-live="off">{coordinates(opening)}</output>
    {status !== 'ready' && <div className="globe-status" role="status"><b>{status === 'loading' ? 'ACQUIRING EARTH IMAGERY' : 'RESTORING ORBITAL VIEW'}</b></div>}
    {focused === 'an' && <div className="globe-polar-caption">ANTARCTICA <span>UNSURVEYED SECTOR</span></div>}
    <div className="globe-hint">DRAG TO ROTATE <span>·</span> SCROLL TO ZOOM</div>
    <div className="globe-toolbar" aria-label="Globe controls">
      <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => request({ zoom: 1.19 })}>−</button>
      <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => request({ zoom: 0.84 })}>+</button>
      <span />
      <button type="button" onClick={() => { request({ target: SECTOR_FOCUS[selected] }); setFocused(null) }}>HOME</button>
      <button type="button" onClick={() => focus(selected)}>FOCUS SECTOR</button>
      <button type="button" onClick={() => focus('an')}>SOUTH POLE</button>
      <span />
      <button type="button" aria-pressed={showLabels} onClick={() => setShowLabels((current) => !current)}>LABELS</button>
    </div>
    <a className="globe-credit" href="https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography-bathymetry/" target="_blank" rel="noreferrer">EARTH IMAGERY · NASA</a>
  </div>
}

// Memoised: WorldScan re-renders on every strategic tick, and the globe only
// needs to when its operations list or handler changes.
export default memo(function WorldGlobe(props: WorldGlobeProps) {
  return <GlobeBoundary><GlobeView {...props} /></GlobeBoundary>
})
