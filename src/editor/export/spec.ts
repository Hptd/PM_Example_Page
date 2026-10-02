import { registry } from '../core/registry'
import type { Comment, PMNode, Project } from '../core/schema'

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

function walk(nodes: PMNode[], annotations: Record<string, Comment[]>, depth: number, lines: string[]): void {
  const indent = '  '.repeat(depth)
  for (const node of nodes) {
    const def = registry.get(node.type)
    const name = node.name || def?.name || node.type
    lines.push(`${indent}- [${name}] (${node.x}, ${node.y}) ${node.w}×${node.h}`)
    const details = formatProps(node)
    if (details.length) lines.push(`${indent}  - 属性：${details.join('；')}`)
    const comments = annotations[node.id]
    if (comments?.length) {
      for (const comment of comments) {
        lines.push(`${indent}  - 注释（${comment.author}）：${comment.text}`)
      }
    }
    if (node.children?.length) walk(node.children, annotations, depth + 1, lines)
  }
}

export function buildSpec(project: Project): string {
  const lines: string[] = [`# ${project.name}`, '']
  for (const frame of project.frames) {
    lines.push(`## 页面：${frame.name}（${frame.w}×${frame.h}）`, '')
    if (!frame.tree.length) {
      lines.push('_（空页面）_', '')
      continue
    }
    walk(frame.tree, project.annotations, 0, lines)
    lines.push('')
  }
  return lines.join('\n')
}
