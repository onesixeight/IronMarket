import { storeToRefs } from 'pinia'
import { useToastStore } from '../stores/toast'

export function useToast() {
  const toastStore = useToastStore()
  const { toasts } = storeToRefs(toastStore)

  return {
    toasts,
    add: toastStore.add,
    remove: toastStore.remove,
    success: toastStore.success,
    error: toastStore.error,
    info: toastStore.info,
  }
}
