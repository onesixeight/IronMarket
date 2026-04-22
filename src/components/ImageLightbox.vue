<template>
  <teleport to="body">
    <transition name="lightbox">
      <div v-if="visible" class="fixed inset-0 z-[80] flex items-center justify-center">
        <button
          type="button"
          class="absolute inset-0 bg-obsidian-950/90 backdrop-blur-md"
          aria-label="Закрыть изображение"
          @click="$emit('close')"
        ></button>
        <div class="relative z-10 max-w-5xl max-h-[90vh] p-4" @click.stop>
          <button @click="$emit('close')" class="absolute -top-1 -right-1 p-2 bg-cream-50/10 hover:bg-cream-50/20 rounded-xl text-cream-100 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <img :src="src" :alt="alt" class="max-w-full max-h-[85vh] object-contain rounded-lg" />
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({ visible: Boolean, src: String, alt: String })
const emit = defineEmits(['close'])

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<style scoped>
.lightbox-enter-active { animation: fadeIn 0.25s ease; }
.lightbox-leave-active { animation: fadeIn 0.2s ease reverse; }
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
