import { onBeforeUnmount, ref, watch } from 'vue'

export function useAutosave(isDirty: () => boolean, save: () => Promise<void>, delay = 1200) {
  const saving = ref(false)
  const error = ref('')
  let timer: ReturnType<typeof setTimeout> | null = null

  function cancel() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  function schedule() {
    cancel()
    timer = setTimeout(() => {
      timer = null
      void run()
    }, delay)
  }

  async function run(): Promise<boolean> {
    cancel()
    saving.value = true
    error.value = ''
    try {
      await save()
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '保存失败'
      return false
    } finally {
      saving.value = false
    }
  }

  watch(isDirty, (dirty) => {
    if (dirty) schedule()
  })

  onBeforeUnmount(cancel)

  return { saving, error, run, schedule, cancel }
}
