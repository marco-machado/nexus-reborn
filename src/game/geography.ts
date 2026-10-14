import type { SectorId } from './types'

export interface GeoPoint {
  lat: number
  lon: number
}

// One complete equirectangular atlas for the globe, insets and contract data.
// The sphere itself is rendered in 3D; these pixels are only a storage format.
export const SCAN_W = 1000
export const SCAN_H = 520

export function projectGeo({ lat, lon }: GeoPoint): { x: number; y: number } {
  return { x: (lon + 180) / 360 * SCAN_W, y: (90 - lat) / 180 * SCAN_H }
}

export function unprojectScan(x: number, y: number): GeoPoint {
  return { lat: 90 - y / SCAN_H * 180, lon: x / SCAN_W * 360 - 180 }
}

// Matches Three's SphereGeometry UVs and a north-up, -180..180 Earth texture.
export function globePosition({ lat, lon }: GeoPoint, radius = 1): [number, number, number] {
  const latitude = lat * Math.PI / 180
  const longitude = lon * Math.PI / 180
  const ring = Math.cos(latitude) * radius
  return [ring * Math.cos(longitude), Math.sin(latitude) * radius, -ring * Math.sin(longitude)]
}

export function globeLocation(x: number, y: number, z: number): GeoPoint {
  const radius = Math.hypot(x, y, z)
  return { lat: Math.asin(y / radius) * 180 / Math.PI, lon: Math.atan2(-z, x) * 180 / Math.PI }
}

export const GLOBE_HOME: GeoPoint = { lat: 18, lon: -65 }

export const SECTOR_FOCUS: Record<SectorId, GeoPoint> = {
  na: { lat: 36, lon: -102 },
  sa: { lat: -18, lon: -60 },
  eu: { lat: 53, lon: 27 },
  af: { lat: 6, lon: 20 },
  as: { lat: 34, lon: 103 },
  oc: { lat: -24, lon: 145 },
  an: { lat: -80, lon: 0 },
}
