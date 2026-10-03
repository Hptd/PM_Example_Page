export interface ClipboardItemLike {
  kind: string
  type: string
  getAsString(cb: (value: string) => void): void
}

export interface ClipboardDataLike {
  getData(type: string): string
  items?: ArrayLike<ClipboardItemLike>
}

export function normalizeSvg(code: string): string | null {
  let svg = code.replace(/^\uFEFF/, '').trim()
  if (!svg) return null
  svg = svg.replace(/^<\?xml[^>]*\?>\s*/i, '').replace(/^<!DOCTYPE[^>]*>\s*/i, '')
  svg = svg.trim()
  if (!/^<svg[\s>]/i.test(svg)) return null
  if (!/<\/svg>\s*$/i.test(svg) && !/\/>\s*$/i.test(svg)) return null
  return svg
}

export function extractSvgFromHtml(html: string): string | null {
  const match = html.match(/<svg[\s\S]*?<\/svg>/i)
  return match ? match[0] : null
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export const SVG_DEFAULT_SIZE = 120

function parseLength(value: string | undefined): number | null {
  const match = value?.trim().match(/^([\d.]+)(?:px)?$/i)
  const parsed = match ? Number(match[1]) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function svgAspectRatio(svg: string): number {
  const viewBox = svg.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)?.[1]
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number)
    const w = parts[2]
    const h = parts[3]
    if (w !== undefined && h !== undefined && w > 0 && h > 0) return w / h
  }
  const width = parseLength(svg.match(/\bwidth\s*=\s*["']([^"']+)["']/i)?.[1])
  const height = parseLength(svg.match(/\bheight\s*=\s*["']([^"']+)["']/i)?.[1])
  if (width && height) return width / height
  return 1
}

export function fallbackSvgSize(svg: string): { w: number; h: number } {
  const ratio = svgAspectRatio(svg)
  if (ratio >= 1) return { w: SVG_DEFAULT_SIZE, h: Math.max(1, Math.round(SVG_DEFAULT_SIZE / ratio)) }
  return { w: Math.max(1, Math.round(SVG_DEFAULT_SIZE * ratio)), h: SVG_DEFAULT_SIZE }
}

export function measureSvg(svg: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(fallbackSvgSize(svg))
      return
    }
    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve({ w: img.naturalWidth, h: img.naturalHeight })
      } else {
        resolve(fallbackSvgSize(svg))
      }
    }
    img.onerror = () => resolve(fallbackSvgSize(svg))
    img.src = svgToDataUrl(svg)
  })
}

function safeGetData(data: ClipboardDataLike, type: string): string {
  try {
    return data.getData(type) || ''
  } catch {
    return ''
  }
}

function findSvgFileItem(data: ClipboardDataLike): Promise<string | null> | null {
  const items = data.items
  if (!items) return null
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]
    if (item && item.kind === 'file' && item.type === 'image/svg+xml') {
      return new Promise((resolve) => {
        try {
          item.getAsString((value) => resolve(value || null))
        } catch {
          resolve(null)
        }
      })
    }
  }
  return null
}

export async function readPastedSvg(data: ClipboardDataLike | null | undefined): Promise<string | null> {
  if (!data) return null
  const plain = safeGetData(data, 'text/plain')
  const html = safeGetData(data, 'text/html')
  const filePromise = findSvgFileItem(data)

  const fromPlain = normalizeSvg(plain)
  if (fromPlain) return fromPlain

  const fromHtml = extractSvgFromHtml(html)
  const normalizedHtml = fromHtml ? normalizeSvg(fromHtml) : null
  if (normalizedHtml) return normalizedHtml

  if (filePromise) return normalizeSvg((await filePromise) ?? '')
  return null
}
