import { onBeforeUnmount } from 'vue'
import { useEditorStore } from '@/editor/core/store'

type EditorStore = ReturnType<typeof useEditorStore>

const NUDGE_GROUP_DELAY = 500
const ARROW_STEPS: Record<string, [number, number]> = {
  arrowup: [0, -1],
  arrowdown: [0, 1],
  arrowleft: [-1, 0],
  arrowright: [1, 0]
}

export function useEditorShortcuts(store: EditorStore, save: () => void) {
  let nudgeTimer: ReturnType<typeof setTimeout> | null = null
  let nudgeGrouped = false

  function nudgeSelection(dx: number, dy: number) {
    const nodes = store.selectedRootNodes.filter((node) => !node.locked)
    if (!nodes.length) return
    if (!nudgeGrouped) {
      store.pushHistory()
      nudgeGrouped = true
    }
    for (const node of nodes) store.moveNode(node.id, node.x + dx, node.y + dy)
    if (nudgeTimer) clearTimeout(nudgeTimer)
    nudgeTimer = setTimeout(() => {
      nudgeGrouped = false
      nudgeTimer = null
    }, NUDGE_GROUP_DELAY)
  }

  function onKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable
    const mod = event.ctrlKey || event.metaKey
    const key = event.key.toLowerCase()

    if (mod && key === 's') {
      event.preventDefault()
      save()
      return
    }
    if (typing) return

    const step = ARROW_STEPS[key]
    if (step) {
      event.preventDefault()
      const amount = event.shiftKey ? 10 : 1
      nudgeSelection(step[0] * amount, step[1] * amount)
      return
    }

    if (mod && (key === ']' || key === '}')) {
      event.preventDefault()
      const id = store.selectedId
      if (id) store.mutate(() => store.reorderNode(id, key === '}' ? 'front' : 'up'))
      return
    }
    if (mod && (key === '[' || key === '{')) {
      event.preventDefault()
      const id = store.selectedId
      if (id) store.mutate(() => store.reorderNode(id, key === '{' ? 'back' : 'down'))
      return
    }

    if (mod && key === 'z') {
      event.preventDefault()
      if (event.shiftKey) store.redo()
      else store.undo()
      return
    }
    if (mod && key === 'y') {
      event.preventDefault()
      store.redo()
      return
    }
    if (mod && key === 'd') {
      event.preventDefault()
      store.duplicateSelected()
      return
    }
    if (mod && key === 'c') {
      store.copySelected()
      return
    }
    if (mod && key === 'v') {
      store.pasteClipboard()
      return
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      store.removeSelected()
      return
    }
    if (event.key === 'Escape') store.select(null)
  }

  onBeforeUnmount(() => {
    if (nudgeTimer) clearTimeout(nudgeTimer)
  })

  return { onKeydown }
}
