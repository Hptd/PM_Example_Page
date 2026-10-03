export type SvgColorMode = 'mono' | 'multi' | 'unsupported'

export interface SvgAnalysis {
  mode: SvgColorMode
  colors: string[]
}

export type DecodedImage = { kind: 'svg'; source: string } | { kind: 'raster' }

const IGNORE_COLORS = new Set(['none', 'transparent', 'currentcolor', 'inherit', 'initial', 'unset'])

const COLOR_ATTR = /(fill|stroke|stop-color)\s*=\s*("([^"]*)"|'([^']*)')/gi
const STYLE_ATTR = /style\s*=\s*("([^"]*)"|'([^']*)')/gi
const STYLE_PROP = /(fill|stroke|stop-color)\s*:\s*([^;"']+)/gi

export function normalizeColor(value: string): string {
  return value.trim().toLowerCase()
}

function decodeBase64(value: string): string {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return new TextDecoder().decode(bytes)
}

function safeDecodeUri(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function decodeSvgDataUrl(url: string): DecodedImage | null {
  if (!url.startsWith('data:')) return null
  const comma = url.indexOf(',')
  if (comma < 0) return null
  const header = url.slice(5, comma).toLowerCase()
  const payload = url.slice(comma + 1)
  if (header.includes('image/svg+xml')) {
    const source = header.includes(';base64') ? decodeBase64(payload) : safeDecodeUri(payload)
    return { kind: 'svg', source }
  }
  if (header.startsWith('image/')) return { kind: 'raster' }
  return null
}

export function sanitizeSvg(source: string): string {
  return source
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<script\b[^>]*\/?>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/<foreignObject\b[^>]*\/?>/gi, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/(xlink:href|href)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '')
    .replace(/<!\s*(doctype|entity)[^>]*>/gi, '')
}

const analysisCache = new Map<string, SvgAnalysis>()

export function analyzeSvgColors(source: string): SvgAnalysis {
  const cached = analysisCache.get(source)
  if (cached) return cached

  const result = analyzeSvgColorsUncached(source)
  analysisCache.set(source, result)
  return result
}

function analyzeSvgColorsUncached(source: string): SvgAnalysis {
  if (/<style[\s>]/i.test(source) || /<image[\s>]/i.test(source)) {
    return { mode: 'unsupported', colors: [] }
  }

  const colors: string[] = []
  let hasGradient = /<(?:linear|radial)Gradient/i.test(source)

  const push = (raw: string): void => {
    const value = normalizeColor(raw)
    if (!value || IGNORE_COLORS.has(value)) return
    if (value.startsWith('url(')) {
      hasGradient = true
      return
    }
    if (!colors.includes(value)) colors.push(value)
  }

  for (const match of source.matchAll(COLOR_ATTR)) push(match[3] ?? match[4] ?? '')
  for (const match of source.matchAll(STYLE_ATTR)) {
    const content = match[2] ?? match[3] ?? ''
    for (const prop of content.matchAll(STYLE_PROP)) push(prop[2] ?? '')
  }

  if (hasGradient || colors.length > 1) return { mode: 'multi', colors }
  return { mode: 'mono', colors }
}

export function toColorMap(raw: unknown): Map<string, string> {
  const map = new Map<string, string>()
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof value === 'string' && value) map.set(normalizeColor(key), value)
    }
  }
  return map
}

export function applyColorMap(source: string, map: Map<string, string>): string {
  if (!map.size) return source

  const swap = (raw: string): string => map.get(normalizeColor(raw)) ?? raw

  let output = source.replace(COLOR_ATTR, (match, attr: string, _quoted: string, doubleQuoted: string, singleQuoted: string) => {
    const raw = doubleQuoted ?? singleQuoted ?? ''
    const next = swap(raw)
    if (next === raw) return match
    return `${attr}="${next}"`
  })

  output = output.replace(STYLE_ATTR, (match, _quoted: string, doubleQuoted: string, singleQuoted: string) => {
    const content = doubleQuoted ?? singleQuoted ?? ''
    const nextContent = content.replace(STYLE_PROP, (propMatch, prop: string, color: string) => {
      const raw = color.trim()
      const next = swap(raw)
      return next === raw ? propMatch : `${prop}:${next}`
    })
    return nextContent === content ? match : `style="${nextContent}"`
  })

  return output
}

export function namespaceSvgIds(source: string, key: string): string {
  const safe = key.replace(/[^a-zA-Z0-9_-]/g, '')
  if (!safe || !/(?<![\w:-])id\s*=/i.test(source)) return source

  return source
    .replace(/(?<![\w:-])id\s*=\s*("([^"]*)"|'([^']*)')/gi, (_match, _quoted: string, doubleQuoted: string, singleQuoted: string) => {
      const id = doubleQuoted ?? singleQuoted ?? ''
      return `id="${id}_${safe}"`
    })
    .replace(/url\(\s*#([^)"']+)\s*\)/gi, (_match, id: string) => `url(#${id}_${safe})`)
    .replace(/\b(xlink:href|href)\s*=\s*("|')#([^"']*)\2/gi, (_match, attr: string, quote: string, id: string) => `${attr}=${quote}#${id}_${safe}${quote}`)
}

export function setRootFill(source: string, color: string): string {
  return source.replace(/<svg\b([^>]*)>/i, (_match, attrs: string) => {
    if (/\bfill\s*=/i.test(attrs)) {
      return `<svg${attrs.replace(/\bfill\s*=\s*("[^"]*"|'[^']*')/i, `fill="${color}"`)}>`
    }
    const selfClose = /\/\s*$/.test(attrs)
    const clean = attrs.replace(/\/\s*$/, '')
    return `<svg${clean} fill="${color}"${selfClose ? ' /' : ''}>`
  })
}

export function fitSvgRoot(source: string): string {
  return source.replace(/<svg\b([^>]*)>/i, (_match, attrs: string) => {
    const selfClose = /\/\s*$/.test(attrs)
    const clean = attrs
      .replace(/\s(?:width|height|preserveAspectRatio)\s*=\s*("[^"]*"|'[^']*')/gi, '')
      .replace(/\/\s*$/, '')
    return `<svg${clean} width="100%" height="100%" preserveAspectRatio="xMidYMid meet"${selfClose ? ' /' : ''}>`
  })
}
