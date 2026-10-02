import { describe, expect, it } from 'vitest'
import { hitTest } from './hitTest'
import type { PMNode } from './schema'

function rect(overrides: Partial<PMNode>): PMNode {
  return { id: 'n', type: 'pm-rect', x: 0, y: 0, w: 100, h: 100, props: {}, style: {}, ...overrides }
}

describe('hitTest', () => {
  it('finds topmost node and descends into containers', () => {
    const container = rect({ id: 'c', type: 'pm-container', children: [rect({ id: 'child', x: 10, y: 10, w: 20, h: 20 })] })
    expect(hitTest([container], { x: 15, y: 15 })?.id).toBe('child')
    expect(hitTest([container], { x: 80, y: 80 })?.id).toBe('c')
    expect(hitTest([container], { x: 200, y: 200 })).toBeNull()
  })
})
