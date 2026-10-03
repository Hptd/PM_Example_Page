import { describe, expect, it } from 'vitest'
import {
  analyzeSvgColors,
  applyColorMap,
  decodeSvgDataUrl,
  fitSvgRoot,
  namespaceSvgIds,
  normalizeColor,
  sanitizeSvg,
  setRootFill,
  toColorMap
} from './svgColor'

const MONO = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path fill="#333333" d="M0 0h24v24H0z"/></svg>'
const MULTI = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path fill="#333" d="M0 0h8v8H0z"/><path fill="#e11d48" d="M8 0h8v8H8z"/></svg>'

describe('decodeSvgDataUrl', () => {
  it('解码 utf8 data url', () => {
    const decoded = decodeSvgDataUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(MONO)}`)
    expect(decoded).toEqual({ kind: 'svg', source: MONO })
  })

  it('解码 base64 data url', () => {
    const encoded = Buffer.from(MONO, 'utf-8').toString('base64')
    const decoded = decodeSvgDataUrl(`data:image/svg+xml;base64,${encoded}`)
    expect(decoded).toEqual({ kind: 'svg', source: MONO })
  })

  it('识别位图', () => {
    expect(decodeSvgDataUrl('data:image/png;base64,AAAA')).toEqual({ kind: 'raster' })
  })
})

describe('sanitizeSvg', () => {
  it('移除脚本与事件属性', () => {
    const dirty = '<svg onload="alert(1)"><script>alert(1)</script><rect fill="#000"/></svg>'
    const clean = sanitizeSvg(dirty)
    expect(clean).not.toContain('<script')
    expect(clean).not.toContain('onload')
    expect(clean).toContain('<rect')
  })
})

describe('analyzeSvgColors', () => {
  it('单色', () => {
    expect(analyzeSvgColors(MONO)).toEqual({ mode: 'mono', colors: ['#333333'] })
  })

  it('无显式颜色视为单色', () => {
    expect(analyzeSvgColors('<svg><path d="M0 0"/></svg>')).toEqual({ mode: 'mono', colors: [] })
  })

  it('currentColor 视为单色且不计入颜色', () => {
    expect(analyzeSvgColors('<svg><path fill="currentColor"/></svg>')).toEqual({ mode: 'mono', colors: [] })
  })

  it('多色', () => {
    expect(analyzeSvgColors(MULTI).mode).toBe('multi')
    expect(analyzeSvgColors(MULTI).colors).toHaveLength(2)
  })

  it('渐变视为多色', () => {
    const grad = '<svg><defs><linearGradient id="g"><stop stop-color="#fff"/><stop stop-color="#000"/></linearGradient></defs><rect fill="url(#g)"/></svg>'
    expect(analyzeSvgColors(grad).mode).toBe('multi')
  })

  it('含样式表视为不支持', () => {
    expect(analyzeSvgColors('<svg><style>.a{fill:red}</style><path class="a"/></svg>').mode).toBe('unsupported')
  })
})

describe('applyColorMap', () => {
  it('替换属性与内联样式中的颜色', () => {
    const source = '<svg><rect fill="#333"/><path style="stroke:#333;fill:none"/></svg>'
    const map = new Map([[normalizeColor('#333'), '#ff0000']])
    const output = applyColorMap(source, map)
    expect(output).toContain('fill="#ff0000"')
    expect(output).toContain('stroke:#ff0000')
    expect(output).toContain('fill:none')
  })

  it('toColorMap 归一化键', () => {
    const map = toColorMap({ '#ABC': '#000000' })
    expect(map.get('#abc')).toBe('#000000')
  })
})

describe('namespaceSvgIds', () => {
  it('为 id 与引用加前缀', () => {
    const source = '<svg><defs><linearGradient id="g"><stop/></linearGradient></defs><rect fill="url(#g)"/></svg>'
    const output = namespaceSvgIds(source, 'n1')
    expect(output).toContain('id="g_n1"')
    expect(output).toContain('url(#g_n1)')
  })
})

describe('root helpers', () => {
  it('setRootFill 注入或替换根 fill', () => {
    expect(setRootFill('<svg><path/></svg>', '#ff0000')).toContain('fill="#ff0000"')
    expect(setRootFill('<svg fill="#000"><path/></svg>', '#ff0000')).toBe('<svg fill="#ff0000"><path/></svg>')
  })

  it('fitSvgRoot 强制 100% 尺寸', () => {
    const output = fitSvgRoot('<svg width="24" height="24"><path/></svg>')
    expect(output).toContain('width="100%"')
    expect(output).toContain('height="100%"')
    expect(output).toContain('preserveAspectRatio="xMidYMid meet"')
  })
})
