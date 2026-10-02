import { h, type VNode } from 'vue'
import type { Frame, ID, PMNode } from '../core/schema'
import { registry } from '../core/registry'
import '../widgets'

export interface RenderOptions {
  commentCounts?: Record<ID, number>
}

export function nodeWrapperStyle(node: PMNode): Record<string, string | number> {
  const style: Record<string, string | number> = {
    position: 'absolute',
    left: `${node.x}px`,
    top: `${node.y}px`,
    width: `${node.w}px`,
    height: `${node.h}px`
  }
  if (node.rotation) style.transform = `rotate(${node.rotation}deg)`
  if (node.hidden) style.display = 'none'
  return style
}

export function renderNode(node: PMNode, options: RenderOptions = {}): VNode {
  const def = registry.get(node.type)
  const children = (node.children ?? []).map((child) => renderNode(child, options))
  const content = def ? def.render(node, children) : h('div', { style: { width: '100%', height: '100%' } })
  const props: Record<string, unknown> = {
    class: 'pm-node',
    'data-pm-id': node.id,
    style: nodeWrapperStyle(node)
  }
  const count = options.commentCounts?.[node.id]
  if (count) props['data-pm-comments'] = String(count)
  return h('div', props, [content])
}

export function renderFrameNodes(frame: Frame, options: RenderOptions = {}): VNode[] {
  return frame.tree.map((node) => renderNode(node, options))
}
