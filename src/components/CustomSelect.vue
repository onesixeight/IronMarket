<template>
  <div class="relative" ref="trigger">
    <button
      @click="toggle"
      class="flex items-center justify-between gap-2 px-4 py-2.5 bg-obsidian-800 border border-obsidian-600 rounded-xl text-sm w-full transition-all"
      :class="open && 'border-gold-400 ring-2 ring-gold-400/20'"
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
          style="z-index: 9999;"
        >
          <button
            v-for="opt in options"
            :key="String(opt.value)"
            @click="select(opt)"
            class="w-full px-4 py-2 text-sm text-left transition-colors"
            :class="modelValue === opt.value ? 'text-gold-400 bg-gold-500/15 font-medium' : 'text-cream-100/70 hover:bg-obsidian-700'"
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
const dropdown = ref(null)
const dropdownStyle = ref({})

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
    nextTick(() => updatePosition())
  }
}

function select(opt) {
  emit('update:modelValue', opt.value)
  open.value = false
}

function onClickOutside(e) {
  if (
    trigger.value && !trigger.value.contains(e.target) &&
    dropdown.value && !dropdown.value.contains(e.target)
  ) {
    open.value = false
  }
}

function onScroll() {
  if (open.value) updatePosition()
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

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
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
