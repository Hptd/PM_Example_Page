import { describe, expect, it } from 'vitest'
import { registry } from './registry'
import '../widgets'

describe('widget registry', () => {
  it('registers built-in widgets across categories', () => {
    expect(registry.has('pm-rect')).toBe(true)
    expect(registry.has('pm-button')).toBe(true)
    expect(registry.has('pm-table')).toBe(true)
    expect(registry.has('pm-navbar')).toBe(true)
    expect(registry.has('pm-modal-confirm')).toBe(true)
    expect(registry.has('pm-custom')).toBe(true)
  })

  it('exposes defaults for each widget', () => {
    const def = registry.get('pm-rect')
    expect(def?.defaultSize.w).toBeGreaterThan(0)
    expect(def?.defaultSize.h).toBeGreaterThan(0)
  })

  it('only declares inline text editors backed by a real prop field', () => {
    const editable = registry.list().filter((def) => def.textEditor)
    expect(editable.some((def) => def.type === 'pm-text')).toBe(true)
    for (const def of editable) {
      const field = def.propSchema.find((item) => item.key === def.textEditor?.key)
      expect(field, `${def.type} 缺少 ${def.textEditor?.key} 属性`).toBeTruthy()
      expect(['text', 'textarea']).toContain(field?.type)
    }
  })
})
