<template>
  <div class="fixed top-20 right-4 z-[70] flex flex-col gap-2 pointer-events-none">
    <transition-group name="toast">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm min-w-[280px] max-w-sm"
        :class="toastClass(toast.type)"
      >
        <span class="shrink-0" v-html="toastIcon(toast.type)"></span>
        <span class="text-sm font-medium">{{ toast.message }}</span>
        <button @click="toastStore.remove(toast.id)" class="ml-auto shrink-0 opacity-60 hover:opacity-100 transition-opacity">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToastStore } from '../stores/toast'
const toastStore = useToastStore()

function toastClass(type) {
  switch (type) {
    case 'success': return 'bg-obsidian-800/95 border-gold-400/40 text-cream-100'
    case 'error': return 'bg-obsidian-800/95 border-red-500/40 text-cream-100'
    case 'info': return 'bg-obsidian-800/95 border-obsidian-500/60 text-cream-100'
    default: return 'bg-obsidian-800/95 border-obsidian-500/60 text-cream-100'
  }
}

function toastIcon(type) {
  switch (type) {
    case 'success': return '<svg class="w-4 h-4 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
    case 'error': return '<svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>'
    case 'info': return '<svg class="w-4 h-4 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>'
    default: return ''
  }
}
</script>

<style scoped>
.toast-enter-active {
  animation: toastIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-leave-active {
  animation: toastOut 0.25s ease forwards;
}
@keyframes toastIn {
  from { opacity: 0; transform: translateX(40px) scale(0.95); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}
@keyframes toastOut {
  from { opacity: 1; transform: translateX(0) scale(1); }
  to { opacity: 0; transform: translateX(40px) scale(0.95); }
}
</style>
