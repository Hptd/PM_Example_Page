import { describe, expect, it } from 'vitest'
import { renderToString } from 'vue/server-renderer'
import { registry } from '../core/registry'
import { renderNode } from '../render/renderNode'
import type { PMNode } from '../core/schema'
import '../widgets'

describe('widget rendering', () => {
  it('renders every registered widget to html without throwing', async () => {
    const widgets = registry.list()
    expect(widgets.length).toBeGreaterThanOrEqual(25)

    for (const def of widgets) {
      const node: PMNode = {
        id: `n_${def.type}`,
        type: def.type,
        x: 0,
        y: 0,
        w: def.defaultSize.w,
        h: def.defaultSize.h,
        props: { ...def.defaultProps },
        style: { ...def.defaultStyle }
      }
      if (def.droppable) node.children = []

      const html = await renderToString(renderNode(node))
      expect(html).toContain(`data-pm-id="${node.id}"`)
      expect(html.length).toBeGreaterThan(0)
    }
  })
})
