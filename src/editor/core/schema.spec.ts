import { describe, expect, it } from 'vitest'
import { createFrame, createProject, parseProject, serializeProject } from './schema'

describe('schema', () => {
  it('round trips a project through serialization', () => {
    const project = createProject('测试项目')
    const frame = createFrame({ name: '首页', x: 10, y: 20 })
    frame.tree.push({ id: 'n1', type: 'pm-rect', x: 1, y: 2, w: 3, h: 4, props: {}, style: {} })
    project.frames.push(frame)
    project.annotations.n1 = [{ id: 'c1', text: '说明', author: '我', createdAt: 1 }]

    const restored = parseProject(serializeProject(project))

    expect(restored.name).toBe('测试项目')
    expect(restored.frames[0]?.tree[0]?.id).toBe('n1')
    expect(restored.annotations.n1?.[0]?.text).toBe('说明')
  })

  it('rejects payloads without frames', () => {
    expect(() => parseProject('{"name":"x"}')).toThrow()
  })
})
