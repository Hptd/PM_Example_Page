import { registry } from '@/editor/core/registry'
import { basicWidgets } from './basic'
import { formWidgets } from './form'
import { dataWidgets } from './data'
import { navWidgets } from './nav'

let registered = false

export function registerWidgets(): void {
  if (registered) return
  for (const def of [...basicWidgets, ...formWidgets, ...dataWidgets, ...navWidgets]) {
    registry.register(def)
  }
  registered = true
}

registerWidgets()
