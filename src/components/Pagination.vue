<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-1.5 mt-10">
    <button
      @click="goTo(currentPage - 1)"
      :disabled="currentPage === 1"
      class="page-btn"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
    </button>

    <template v-for="p in visiblePages" :key="p">
      <span v-if="p === '...'" class="px-2 text-iron-400 dark:text-iron-500 text-sm">...</span>
      <button
        v-else
        @click="goTo(p)"
        class="page-btn"
        :class="p === currentPage && 'page-btn-active'"
      >
        {{ p }}
      </button>
    </template>

    <button
      @click="goTo(currentPage + 1)"
      :disabled="currentPage === totalPages"
      class="page-btn"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
})

const emit = defineEmits(['update:currentPage'])

function goTo(page) {
  if (page >= 1 && page <= props.totalPages) {
    emit('update:currentPage', page)
  }
}

const visiblePages = computed(() => {
  const pages = []
  const total = props.totalPages
  const current = props.currentPage

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i)
    }
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages
})
</script>

<style scoped>
.page-btn {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-iron-600);
  transition: all 0.15s;
}
.page-btn:hover:not(:disabled) { background: var(--color-cream-200); }
.page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.page-btn-active {
  background: var(--color-iron-900);
  color: var(--color-cream-100);
}
:deep(html[data-theme="dark"]) .page-btn {
  color: var(--color-iron-300);
}
:deep(html[data-theme="dark"]) .page-btn:hover:not(:disabled) {
  background: var(--color-iron-700);
}
:deep(html[data-theme="dark"]) .page-btn-active {
  background: var(--color-amber-600);
  color: white;
}
</style>
