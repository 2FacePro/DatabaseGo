import { ref } from 'vue'

export function useTwoTap() {
  const armed = ref({})
  const timers = {}

  function twoTap(id, label, action, originalLabel) {
    if (armed.value[id]) {
      action()
      delete armed.value[id]
      clearTimeout(timers[id])
    } else {
      armed.value[id] = label
      timers[id] = setTimeout(() => {
        delete armed.value[id]
      }, 3000)
    }
  }

  return { armed, twoTap }
}
