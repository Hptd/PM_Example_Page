import { describe, expect, it } from 'vitest'
import { createFrame, type PMNode } from './schema'
import { nodesInWorldRect, topLevelIds } from './tree'

function makeNode(id: string, x: number, y: number, w: number, h: number, extra: Partial<PMNode> = {}): PMNode {
  return { id, type: 'pm-rect', x, y, w, h, props: {}, style: {}, ...extra }
}

describe('tree selection helpers', () => {
  it('picks top-level nodes intersecting a world rect', () => {
    const frame = createFrame({
      x: 100,
      y: 50,
      w: 800,
      h: 600,
      tree: [
        makeNode('a', 0, 0, 50, 50),
        makeNode('b', 200, 200, 50, 50),
        makeNode('c', 500, 500, 50, 50, { hidden: true })
      ]
    })

    expect(nodesInWorldRect([frame], { x: 100, y: 50, w: 120, h: 120 })).toEqual(['a'])
    expect(nodesInWorldRect([frame], { x: 0, y: 0, w: 1000, h: 1000 })).toEqual(['a', 'b'])
  })

  it('keeps only top-level ids when a parent and its child are hit', () => {
    const child = makeNode('child', 10, 10, 20, 20)
    const parent = makeNode('parent', 0, 0, 100, 100, { children: [child] })
    const frame = createFrame({ x: 0, y: 0, tree: [parent] })

    expect(nodesInWorldRect([frame], { x: 0, y: 0, w: 500, h: 500 })).toEqual(['parent'])
    expect(topLevelIds([frame], ['parent', 'child'])).toEqual(['parent'])
  })
})
