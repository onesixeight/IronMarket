<template>
  <div class="relative" ref="wrapper">
    <button
      @click="open = !open"
      class="flex items-center justify-between gap-2 px-4 py-2.5 bg-white dark:bg-iron-800 border border-iron-100 dark:border-iron-700 rounded-xl text-sm w-full transition-all"
      :class="open && 'border-amber-400 dark:border-amber-400 ring-2 ring-amber-400/20'"
    >
      <span class="text-iron-700 dark:text-cream-100">{{ selectedLabel }}</span>
      <svg class="w-3.5 h-3.5 text-iron-400 dark:text-iron-500 transition-transform" :class="open && 'rotate-180'" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
      </svg>
    </button>
    <transition name="dropdown">
      <div v-if="open" class="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-iron-800 border border-iron-100 dark:border-iron-700 rounded-xl shadow-lg shadow-iron-900/5 dark:shadow-black/30 z-30 py-1.5 max-h-60 overflow-y-auto">
        <button
          v-for="opt in options"
          :key="opt.value"
          @click="select(opt)"
          class="w-full px-4 py-2 text-sm text-left transition-colors"
          :class="modelValue === opt.value ? 'text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-900/20 font-medium' : 'text-iron-600 dark:text-iron-300 hover:bg-cream-50 dark:hover:bg-iron-700'"
        >
          {{ opt.label }}
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  options: { type: Array, required: true },
  modelValue: { type: [String, Number, null], default: null },
  placeholder: { type: String, default: 'Выберите' },
})

const emit = defineEmits(['update:modelValue'])
const open = ref(false)
const wrapper = ref(null)

const selectedLabel = computed(() => {
  const opt = props.options.find(o => o.value === props.modelValue)
  return opt ? opt.label : props.placeholder
})

function select(opt) {
  emit('update:modelValue', opt.value)
  open.value = false
}

function onClickOutside(e) {
  if (wrapper.value && !wrapper.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<style scoped>
.dropdown-enter-active { animation: dropIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.dropdown-leave-active { animation: dropIn 0.15s ease reverse; }
@keyframes dropIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
