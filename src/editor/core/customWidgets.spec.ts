import { beforeEach, describe, expect, it } from 'vitest'
import { addCustomNode, addCustomSvg, buildCustomNode, customWidgets, removeCustomWidget } from './customWidgets'
import type { PMNode } from './schema'

describe('custom widgets', () => {
  beforeEach(() => {
    customWidgets.value = []
  })

  it('adds and removes svg widgets and builds a pm-custom node', () => {
    const widget = addCustomSvg('logo', 'data:image/svg+xml;charset=utf-8,<svg/>', 80, 40)
    expect(customWidgets.value).toHaveLength(1)
    const node = buildCustomNode(widget, 'n1', 10, 20)
    expect(node.type).toBe('pm-custom')
    expect(node.props.svg).toBe(widget.svg)
    expect(node.w).toBe(80)
    expect(node.h).toBe(40)
    removeCustomWidget(widget.id)
    expect(customWidgets.value).toHaveLength(0)
  })

  it('instantiates saved node templates with fresh ids', () => {
    const template: PMNode = {
      id: 'orig',
      type: 'pm-button',
      x: 0,
      y: 0,
      w: 100,
      h: 40,
      props: { label: '按钮' },
      style: { background: '#000' }
    }
    const widget = addCustomNode('我的按钮', template)
    const node = buildCustomNode(widget, 'copy', 5, 6)
    expect(node.id).toBe('copy')
    expect(node.type).toBe('pm-button')
    expect(node.x).toBe(5)
    expect(node.props.label).toBe('按钮')
  })
})
