import type { Frame } from './schema'

export interface FrameSizePreset {
  label: string
  w: number
  h: number
}

export interface FrameSizeGroup {
  label: string
  presets: FrameSizePreset[]
}

export const FRAME_SIZE_GROUPS: FrameSizeGroup[] = [
  {
    label: '常用网页端尺寸',
    presets: [
      { label: '桌面端', w: 1920, h: 1080 },
      { label: '笔记本', w: 1440, h: 900 },
      { label: '笔记本', w: 1366, h: 768 },
      { label: '标准网页', w: 1280, h: 800 }
    ]
  },
  {
    label: '移动端开发尺寸',
    presets: [
      { label: 'iPhone 12/13/14', w: 390, h: 844 },
      { label: 'iPhone 14 Pro/15', w: 393, h: 852 },
      { label: 'iPhone X/11 Pro', w: 375, h: 812 },
      { label: 'Android 常见', w: 360, h: 800 }
    ]
  },
  {
    label: '平板设备开发尺寸',
    presets: [
      { label: 'iPad 竖屏', w: 768, h: 1024 },
      { label: 'iPad 横屏', w: 1024, h: 768 },
      { label: 'iPad Air', w: 820, h: 1180 },
      { label: 'iPad Pro 11', w: 834, h: 1194 }
    ]
  }
]

export const DEFAULT_FRAME_SIZE = { w: 1280, h: 800 }
export const FRAME_GAP = 80

export function nextFramePosition(frames: Frame[]): { x: number; y: number } {
  if (!frames.length) return { x: FRAME_GAP, y: FRAME_GAP }
  const right = Math.max(...frames.map((frame) => frame.x + frame.w))
  const top = Math.min(...frames.map((frame) => frame.y))
  return { x: right + FRAME_GAP, y: top }
}

export function pickDefaultFrameSize(frames: Frame[]): { w: number; h: number } {
  if (!frames.length) return { ...DEFAULT_FRAME_SIZE }
  const counts = new Map<string, { w: number; h: number; count: number }>()
  for (const frame of frames) {
    const entry = counts.get(`${frame.w}x${frame.h}`)
    if (entry) entry.count += 1
    else counts.set(`${frame.w}x${frame.h}`, { w: frame.w, h: frame.h, count: 1 })
  }
  let best = { ...DEFAULT_FRAME_SIZE, count: 0 }
  for (const entry of counts.values()) {
    if (entry.count > best.count) best = entry
  }
  return { w: best.w, h: best.h }
}
