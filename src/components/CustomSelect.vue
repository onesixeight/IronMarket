<template>
  <div class="relative" ref="trigger">
    <button
      ref="buttonRef"
      @click="toggle"
      @keydown="onTriggerKey"
      class="flex items-center justify-between gap-2 px-4 py-2.5 bg-obsidian-800 border border-obsidian-600 rounded-xl text-sm w-full transition-all"
      :class="open && 'border-gold-400 ring-2 ring-gold-400/20'"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-activedescendant="highlightedIndex >= 0 ? `option-${highlightedIndex}` : undefined"
    >
      <span class="text-cream-100">{{ selectedLabel }}</span>
      <svg class="w-3.5 h-3.5 text-obsidian-500 transition-transform" :class="open && 'rotate-180'" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
      </svg>
    </button>
    <Teleport to="body">
      <transition name="dropdown">
        <div
          v-if="open"
          ref="dropdown"
          class="fixed bg-obsidian-800 border border-obsidian-600 rounded-xl shadow-2xl shadow-black/60 py-1.5 max-h-60 overflow-y-auto"
          :style="dropdownStyle"
          style="z-index: 100;"
          role="listbox"
          :aria-activedescendant="highlightedIndex >= 0 ? `option-${highlightedIndex}` : undefined"
        >
          <button
            v-for="(opt, i) in options"
            :key="String(opt.value)"
            :id="`option-${i}`"
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
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

const props = defineProps({
  options: { type: Array, required: true },
  modelValue: { type: [String, Number, null], default: null },
  placeholder: { type: String, default: 'Выберите' },
})

const emit = defineEmits(['update:modelValue'])
const open = ref(false)
const trigger = ref(null)
const buttonRef = ref(null)
const dropdown = ref(null)
const dropdownStyle = ref({})
const highlightedIndex = ref(-1)

const selectedLabel = computed(() => {
  const opt = props.options.find(o => o.value === props.modelValue)
  return opt ? opt.label : props.placeholder
})

function updatePosition() {
  if (!trigger.value || !open.value) return
  const rect = trigger.value.getBoundingClientRect()
  dropdownStyle.value = {
    top: `${rect.bottom + 6}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  }
}

function toggle() {
  open.value = !open.value
  if (open.value) {
    highlightedIndex.value = props.options.findIndex(o => o.value === props.modelValue)
    nextTick(() => updatePosition())
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
      nextTick(() => updatePosition())
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
    const el = dropdown.value?.querySelector(`#option-${highlightedIndex.value}`)
    el?.scrollIntoView({ block: 'nearest' })
  })
}

function onClickOutside(e) {
  if (
    trigger.value && !trigger.value.contains(e.target) &&
    dropdown.value && !dropdown.value.contains(e.target)
  ) {
    closeList()
  }
}

function onScroll() {
  if (open.value) updatePosition()
}

function onDocKey(e) {
  if (!open.value) return
  if (e.key === 'Tab') {
    closeList()
  }
}

watch(open, (val) => {
  if (val) {
    nextTick(() => updatePosition())
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
  } else {
    window.removeEventListener('scroll', onScroll, true)
    window.removeEventListener('resize', onScroll)
  }
})

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onDocKey)
})
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onDocKey)
  window.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', onScroll)
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
