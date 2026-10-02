import { registry } from '@/editor/core/registry'
import { walkTree } from '@/editor/core/tree'
import type { PMNode, Project } from '@/editor/core/schema'

const TEXT_KEYS = ['content', 'label', 'title', 'body', 'text', 'message', 'placeholder', 'items', 'tabs', 'steps', 'columns', 'src', 'name', 'active']

function formatProps(node: PMNode): string[] {
  const parts: string[] = []
  for (const key of TEXT_KEYS) {
    const value = node.props[key]
    if (value === undefined || value === null || value === '') continue
    const text = String(value).replace(/\n/g, ' / ')
    parts.push(`${key}: ${text}`)
  }
  return parts
}

export function buildSpec(project: Project): string {
  const lines: string[] = [`# ${project.name}`, '']
  for (const frame of project.frames) {
    lines.push(`## 页面：${frame.name}（${frame.w}×${frame.h}）`, '')
    if (!frame.tree.length) {
      lines.push('_（空页面）_', '')
      continue
    }
    walkTree(frame.tree, (node, context) => {
      const indent = '  '.repeat(context.depth)
      const name = node.name || registry.get(node.type)?.name || node.type
      lines.push(`${indent}- [${name}] (${node.x}, ${node.y}) ${node.w}×${node.h}`)
      const details = formatProps(node)
      if (details.length) lines.push(`${indent}  - 属性：${details.join('；')}`)
      const comments = project.annotations[node.id]
      if (comments?.length) {
        for (const comment of comments) {
          lines.push(`${indent}  - 注释（${comment.author}）：${comment.text}`)
        }
      }
    })
    lines.push('')
  }
  return lines.join('\n')
}
