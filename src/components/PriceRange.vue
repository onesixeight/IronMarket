<template>
  <div class="flex items-center gap-2">
    <div class="relative flex-1">
      <input
        type="number"
        :value="modelMin"
        @input="onMinInput"
        :min="min"
        :max="max"
        placeholder="от"
        class="price-input"
      />
    </div>
    <span style="color: var(--color-obsidian-500);">—</span>
    <div class="relative flex-1">
      <input
        type="number"
        :value="modelMax"
        @input="onMaxInput"
        :min="min"
        :max="max"
        placeholder="до"
        class="price-input"
      />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  min: { type: Number, default: 0 },
  max: { type: Number, default: 10000 },
  modelMin: { type: Number, default: 0 },
  modelMax: { type: Number, default: 10000 },
})

const emit = defineEmits(['update:modelMin', 'update:modelMax'])

function onMinInput(e) {
  let val = Number(e.target.value)
  if (isNaN(val)) val = props.min
  if (val < props.min) val = props.min
  emit('update:modelMin', val)
}

function onMaxInput(e) {
  let val = Number(e.target.value)
  if (isNaN(val)) val = props.max
  if (val > props.max) val = props.max
  emit('update:modelMax', val)
}
</script>

<style scoped>
.price-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: var(--color-obsidian-800);
  border: 1px solid var(--color-obsidian-600);
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-cream-100);
  outline: none;
  transition: border-color 0.2s;
  font-family: var(--font-body);
  -moz-appearance: textfield;
}
.price-input::-webkit-outer-spin-button,
.price-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.price-input::placeholder {
  color: var(--color-obsidian-500);
}
.price-input:focus {
  border-color: var(--color-gold-400);
  box-shadow: 0 0 0 3px rgba(201, 150, 59, 0.12);
}
</style>
