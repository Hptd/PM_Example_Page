import { describe, expect, it } from 'vitest'
import { exportFrame } from './exportFrame'
import { buildSpec } from './spec'
import { createFrame, createProject } from '@/editor/core/schema'

describe('export', () => {
  it('renders clean and annotated html', async () => {
    const project = createProject('导出测试')
    const frame = createFrame({ name: '首页' })
    frame.tree.push({ id: 'n1', type: 'pm-text', x: 1, y: 2, w: 100, h: 30, props: { content: '你好' }, style: {} })
    project.frames.push(frame)
    project.annotations.n1 = [{ id: 'c1', text: '这里是标题', author: '我', createdAt: 1 }]

    const result = await exportFrame(frame, project)

    expect(result.cleanHtml).toContain('data-pm-id="n1"')
    expect(result.cleanHtml).not.toContain('pm-has-comment')
    expect(result.annotatedHtml).toContain('data-pm-comments="1"')
    expect(result.annotatedHtml).toContain('这里是标题')
    expect(result.annotationMap.n1?.[0]?.text).toBe('这里是标题')
  })

  it('builds a markdown spec with comments', () => {
    const project = createProject('规格')
    const frame = createFrame({ name: '列表页' })
    frame.tree.push({ id: 'n1', type: 'pm-text', x: 0, y: 0, w: 10, h: 10, props: { content: '标题' }, style: {} })
    project.frames.push(frame)
    project.annotations.n1 = [{ id: 'c1', text: '说明文本', author: '我', createdAt: 1 }]

    const spec = buildSpec(project)

    expect(spec).toContain('列表页')
    expect(spec).toContain('说明文本')
  })
})
