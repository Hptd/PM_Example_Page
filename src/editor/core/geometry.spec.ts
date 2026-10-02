import { describe, expect, it } from 'vitest'
import { clampZoom, resizeRect, screenToWorld, snapRect, worldToScreen } from './geometry'

describe('geometry', () => {
  it('converts between screen and world coordinates', () => {
    const view = { x: 40, y: -20, zoom: 2 }
    const world = screenToWorld({ x: 100, y: 60 }, view)
    expect(world).toEqual({ x: 90, y: 10 })
    expect(worldToScreen(world, view)).toEqual({ x: 100, y: 60 })
  })

  it('clamps zoom into range', () => {
    expect(clampZoom(0.01)).toBe(0.1)
    expect(clampZoom(10)).toBe(4)
  })

  it('resizes from edges', () => {
    const rect = { x: 10, y: 10, w: 100, h: 50 }
    expect(resizeRect(rect, 'se', 10, 10)).toEqual({ x: 10, y: 10, w: 110, h: 60 })
    expect(resizeRect(rect, 'nw', 10, 10)).toEqual({ x: 20, y: 20, w: 90, h: 40 })
  })

  it('keeps aspect ratio from a corner anchored at the opposite corner', () => {
    const rect = { x: 0, y: 0, w: 100, h: 50 }
    const result = resizeRect(rect, 'se', 100, 0, 8, true)
    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    expect(result.w).toBe(200)
    expect(result.h).toBe(100)
  })

  it('snaps to sibling edges', () => {
    const result = snapRect({ x: 103, y: 0, w: 50, h: 20 }, [{ x: 100, y: 0, w: 50, h: 20 }], 6)
    expect(result.x).toBe(100)
    expect(result.guides.vertical.length).toBeGreaterThan(0)
  })
})
