<script setup>
defineProps({
  type: { type: String, required: true },
  scope: { type: String, default: 'panel' },
})
defineEmits(['copy', 'update:scope'])

const directions = [
  { id: 'horizontal', label: 'Слева / справа', path: 'M4 12h16M8 8l-4 4 4 4m8-8 4 4-4 4' },
  { id: 'vertical', label: 'Сверху / снизу', path: 'M12 4v16M8 8l4-4 4 4m-8 8 4 4 4-4' },
  { id: 'diagonal', label: 'По диагонали', path: 'M5 5l14 14M5 11V5h6m2 14h6v-6' },
]
</script>

<template>
  <div class="mirror-copy-controls" aria-label="Копия в другой угол">
    <div class="mirror-copy-heading">Копия в другой угол</div>
    <label v-if="type === 'gates'" class="mirror-copy-scope">
      <span>Относительно</span>
      <select :value="scope" aria-label="Область зеркальной копии" @change="$emit('update:scope', $event.target.value)">
        <option value="panel">Текущей створки</option>
        <option value="project">Всех ворот</option>
      </select>
    </label>
    <div class="mirror-copy-directions">
      <button
        v-for="direction in directions"
        :key="direction.id"
        type="button"
        :data-mirror-direction="direction.id"
        :aria-label="`Создать зеркальную копию: ${direction.label.toLowerCase()}`"
        @click="$emit('copy', { axis: direction.id, scope })"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path :d="direction.path" />
        </svg>
        <span>{{ direction.label }}</span>
      </button>
    </div>
    <p>Оригинал останется на месте. Отступы от рамы сохранятся.</p>
  </div>
</template>

<style scoped>
.mirror-copy-controls {
  margin-top: 14px;
  padding-top: 13px;
  border-top: 1px solid #493b29;
}
.mirror-copy-heading {
  color: #ddc393;
  font-size: 11px;
  font-weight: 600;
}
.mirror-copy-scope {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 9px;
  color: #aa987b;
  font-size: 9px;
}
.mirror-copy-scope select {
  min-width: 0;
  max-width: 155px;
  min-height: 33px;
  padding: 5px 7px;
  border: 1px solid #5a462c;
  border-radius: 4px;
  background: #201a12;
  color: #dec8a1;
  font: inherit;
  font-size: 10px;
}
.mirror-copy-directions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  margin-top: 10px;
}
.mirror-copy-directions button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  min-height: 59px;
  padding: 8px 4px;
  color: #dfc496;
  background: #2b2216;
  border: 1px solid #6b5030;
  border-radius: 5px;
  cursor: pointer;
}
.mirror-copy-directions button:hover {
  background: #44331e;
  border-color: #bc9560;
}
.mirror-copy-directions svg {
  width: 20px;
  height: 20px;
}
.mirror-copy-directions span {
  font-size: 9px;
  line-height: 1.4;
  text-align: center;
}
.mirror-copy-controls p {
  margin: 9px 0 0;
  color: #a39276;
  font-size: 9px;
  line-height: 1.6;
}
.mirror-copy-controls :is(button, select):focus-visible {
  outline: 2px solid #e9ba68;
  outline-offset: 3px;
}
@media (max-width: 760px) {
  .mirror-copy-scope {
    font-size: 10px;
  }
  .mirror-copy-scope select {
    max-width: 185px;
    min-height: 38px;
    font-size: 11px;
  }
  .mirror-copy-directions span {
    font-size: 10px;
  }
}
</style>
