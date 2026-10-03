import { describe, expect, it } from 'vitest'
import {
  extractSvgFromHtml,
  fallbackSvgSize,
  normalizeSvg,
  readPastedSvg,
  svgToDataUrl,
  type ClipboardDataLike,
  type ClipboardItemLike
} from './pasteSvg'

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="24"><rect width="48" height="24" /></svg>'

function clipboard(map: Record<string, string>, items?: ClipboardItemLike[]): ClipboardDataLike {
  return {
    getData: (type: string) => map[type] ?? '',
    items
  }
}

describe('normalizeSvg', () => {
  it('接受合法 svg 代码', () => {
    expect(normalizeSvg(SVG)).toBe(SVG)
  })

  it('剥离 xml 声明与 BOM', () => {
    expect(normalizeSvg(`\uFEFF<?xml version="1.0"?>\n${SVG}`)).toBe(SVG)
  })

  it('拒绝非 svg 文本', () => {
    expect(normalizeSvg('hello world')).toBeNull()
    expect(normalizeSvg('')).toBeNull()
  })

  it('拒绝缺少结束标签的片段', () => {
    expect(normalizeSvg('<svg xmlns="http://www.w3.org/2000/svg">')).toBeNull()
  })
})

describe('extractSvgFromHtml', () => {
  it('从 html 中抽取第一段 svg', () => {
    expect(extractSvgFromHtml(`<p>before</p>${SVG}<p>after</p>`)).toBe(SVG)
  })

  it('没有 svg 时返回 null', () => {
    expect(extractSvgFromHtml('<p>none</p>')).toBeNull()
  })
})

describe('fallbackSvgSize', () => {
  it('缺少尺寸信息时退回正方形', () => {
    expect(fallbackSvgSize('<svg xmlns="http://www.w3.org/2000/svg"></svg>')).toEqual({ w: 120, h: 120 })
  })

  it('按 viewBox 比例限制长边为 120', () => {
    expect(fallbackSvgSize('<svg viewBox="0 0 48 24"></svg>')).toEqual({ w: 120, h: 60 })
    expect(fallbackSvgSize('<svg viewBox="0 0 24 48"></svg>')).toEqual({ w: 60, h: 120 })
  })

  it('按 width/height 比例限制长边为 120', () => {
    expect(fallbackSvgSize('<svg width="400" height="100"></svg>')).toEqual({ w: 120, h: 30 })
  })
})

describe('svgToDataUrl', () => {
  it('生成 svg data url', () => {
    expect(svgToDataUrl(SVG)).toBe(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG)}`)
  })
})

describe('readPastedSvg', () => {
  it('优先读取 text/plain', async () => {
    expect(await readPastedSvg(clipboard({ 'text/plain': `  ${SVG}  ` }))).toBe(SVG)
  })

  it('回退读取 text/html', async () => {
    expect(await readPastedSvg(clipboard({ 'text/html': `<div>${SVG}</div>` }))).toBe(SVG)
  })

  it('读取 image/svg+xml 文件项', async () => {
    const item: ClipboardItemLike = {
      kind: 'file',
      type: 'image/svg+xml',
      getAsString: (cb) => cb(SVG)
    }
    expect(await readPastedSvg(clipboard({}, [item]))).toBe(SVG)
  })

  it('非 svg 内容返回 null', async () => {
    expect(await readPastedSvg(clipboard({ 'text/plain': 'just text' }))).toBeNull()
    expect(await readPastedSvg(null)).toBeNull()
  })
})
