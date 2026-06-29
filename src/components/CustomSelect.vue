<template>
  <div class="relative" ref="trigger">
    <button
      ref="buttonRef"
      @click="toggle"
      @keydown="onTriggerKey"
      class="flex items-center justify-between gap-2 px-4 py-2.5 bg-obsidian-800 border border-obsidian-600 rounded-xl text-sm w-full transition-[border-color,box-shadow,background-color,color]"
      :class="open && 'border-gold-400 ring-2 ring-gold-400/20'"
      role="combobox"
      aria-haspopup="listbox"
      :aria-label="ariaLabel || placeholder"
      :aria-controls="listboxId"
      :aria-expanded="open"
      :aria-activedescendant="highlightedIndex >= 0 ? optionId(highlightedIndex) : undefined"
    >
      <span class="text-cream-100">{{ selectedLabel }}</span>
      <svg class="w-3.5 h-3.5 text-obsidian-500 transition-transform" :class="open && 'rotate-180'" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
      </svg>
    </button>
    <transition name="dropdown">
      <div
        v-if="open"
        ref="dropdown"
        class="absolute left-0 right-0 top-[calc(100%+0.375rem)] z-[100] bg-obsidian-800 border border-obsidian-600 rounded-xl shadow-2xl shadow-black/60 py-1.5 max-h-60 overflow-y-auto"
        role="listbox"
        :id="listboxId"
        :aria-activedescendant="highlightedIndex >= 0 ? optionId(highlightedIndex) : undefined"
      >
        <button
          v-for="(opt, i) in options"
          :key="String(opt.value)"
          :id="optionId(i)"
          @click="select(opt)"
          @mouseenter="highlightedIndex = i"
          @mousemove="highlightedIndex = i"
          role="option"
          :aria-selected="modelValue === opt.value"
          class="w-full px-4 py-2 text-sm text-left transition-colors"
          :class="[
            highlightedIndex === i ? 'bg-gold-400/15 text-gold-300' : 'text-cream-100/70',
            modelValue === opt.value ? 'font-medium' : ''
          ]"
        >
          {{ opt.label }}
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, useId } from 'vue'

const props = defineProps({
  options: { type: Array, required: true },
  modelValue: { type: [String, Number, null], default: null },
  placeholder: { type: String, default: 'Выберите' },
  ariaLabel: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])
const open = ref(false)
const trigger = ref(null)
const buttonRef = ref(null)
const dropdown = ref(null)
const highlightedIndex = ref(-1)
const selectId = useId()
const listboxId = `${selectId}-listbox`

const selectedLabel = computed(() => {
  const opt = props.options.find(o => o.value === props.modelValue)
  return opt ? opt.label : props.placeholder
})

function toggle() {
  open.value = !open.value
  if (open.value) {
    highlightedIndex.value = props.options.findIndex(o => o.value === props.modelValue)
  }
}

function select(opt) {
  emit('update:modelValue', opt.value)
  open.value = false
  highlightedIndex.value = -1
}

function closeList() {
  open.value = false
  highlightedIndex.value = -1
}

function onTriggerKey(e) {
  if (!open.value) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      open.value = true
      highlightedIndex.value = props.options.findIndex(o => o.value === props.modelValue)
      if (highlightedIndex.value < 0 && props.options.length) highlightedIndex.value = 0
    }
    return
  }

  const len = props.options.length
  if (!len) return

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      highlightedIndex.value = (highlightedIndex.value + 1) % len
      scrollToHighlighted()
      break
    case 'ArrowUp':
      e.preventDefault()
      highlightedIndex.value = (highlightedIndex.value - 1 + len) % len
      scrollToHighlighted()
      break
    case 'Home':
      e.preventDefault()
      highlightedIndex.value = 0
      scrollToHighlighted()
      break
    case 'End':
      e.preventDefault()
      highlightedIndex.value = len - 1
      scrollToHighlighted()
      break
    case 'Enter':
    case ' ':
      e.preventDefault()
      if (highlightedIndex.value >= 0 && highlightedIndex.value < len) {
        select(props.options[highlightedIndex.value])
      }
      break
    case 'Escape':
      e.preventDefault()
      closeList()
      break
  }
}

function scrollToHighlighted() {
  nextTick(() => {
    const el = document.getElementById(optionId(highlightedIndex.value))
    el?.scrollIntoView({ block: 'nearest' })
  })
}

function optionId(index) {
  return `${selectId}-option-${index}`
}

function onClickOutside(e) {
  if (
    trigger.value && !trigger.value.contains(e.target) &&
    dropdown.value && !dropdown.value.contains(e.target)
  ) {
    closeList()
  }
}

function onDocKey(e) {
  if (!open.value) return
  if (e.key === 'Tab') {
    closeList()
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onDocKey)
})
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onDocKey)
})
</script>

<style scoped>
.dropdown-enter-active { animation: dropIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.dropdown-leave-active { animation: dropIn 0.15s ease reverse; }
@keyframes dropIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
