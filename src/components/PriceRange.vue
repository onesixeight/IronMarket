<template>
  <div class="relative select-none">
    <div class="flex items-center gap-3">
      <div class="flex-1 relative h-2 rounded-full bg-iron-100 dark:bg-iron-700">
        <div
          class="absolute h-full rounded-full bg-gold-400"
          :style="{ left: leftPercent + '%', width: widthPercent + '%' }"
        ></div>
        <input
          type="range"
          :min="min"
          :max="max"
          :value="modelMin"
          @input="onMinInput"
          class="range-input range-input-left"
        />
        <input
          type="range"
          :min="min"
          :max="max"
          :value="modelMax"
          @input="onMaxInput"
          class="range-input range-input-right"
        />
      </div>
    </div>
    <div class="flex justify-between mt-2 text-xs text-iron-500 dark:text-iron-400">
      <span>{{ formatPrice(modelMin) }} &#8381;</span>
      <span>{{ formatPrice(modelMax) }} &#8381;</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  min: { type: Number, default: 0 },
  max: { type: Number, default: 10000 },
  modelMin: { type: Number, default: 0 },
  modelMax: { type: Number, default: 10000 },
})

const emit = defineEmits(['update:modelMin', 'update:modelMax'])

function onMinInput(e) {
  let val = Number(e.target.value)
  if (val > props.modelMax - 100) val = props.modelMax - 100
  if (val < props.min) val = props.min
  emit('update:modelMin', val)
}

function onMaxInput(e) {
  let val = Number(e.target.value)
  if (val < props.modelMin + 100) val = props.modelMin + 100
  if (val > props.max) val = props.max
  emit('update:modelMax', val)
}

const leftPercent = computed(() => ((props.modelMin - props.min) / (props.max - props.min)) * 100)
const widthPercent = computed(() => ((props.modelMax - props.modelMin) / (props.max - props.min)) * 100)

function formatPrice(v) {
  return (v ?? 0).toLocaleString()
}
</script>

<style scoped>
.range-input {
  position: absolute;
  top: -6px;
  left: 0;
  width: 100%;
  height: 20px;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  pointer-events: none;
  outline: none;
  margin: 0;
}
.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-amber-500);
  border: 3px solid white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  cursor: pointer;
  pointer-events: auto;
  position: relative;
  z-index: 2;
}
.range-input::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-amber-500);
  border: 3px solid white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  cursor: pointer;
  pointer-events: auto;
}
:deep(html[data-theme="dark"]) .range-input::-webkit-slider-thumb {
  border: 3px solid var(--color-iron-800);
}
:deep(html[data-theme="dark"]) .range-input::-moz-range-thumb {
  border: 3px solid var(--color-iron-800);
}
</style>
