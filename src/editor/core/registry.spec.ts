import { describe, expect, it } from 'vitest'
import { registry } from './registry'
import '../widgets'

describe('widget registry', () => {
  it('registers built-in widgets across categories', () => {
    expect(registry.has('pm-rect')).toBe(true)
    expect(registry.has('pm-button')).toBe(true)
    expect(registry.has('pm-table')).toBe(true)
    expect(registry.has('pm-navbar')).toBe(true)
  })

  it('exposes defaults for each widget', () => {
    const def = registry.get('pm-rect')
    expect(def?.defaultSize.w).toBeGreaterThan(0)
    expect(def?.defaultSize.h).toBeGreaterThan(0)
  })
})
