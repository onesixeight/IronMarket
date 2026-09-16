<script setup>
import { computed, ref, watch } from 'vue'
import { proposeArrangement } from '../../constructor/alignment.js'
import ConstructorCanvas from './ConstructorCanvas.vue'
import { useConstructorDialog } from '../../composables/useConstructorDialog.js'
const props = defineProps({
  project: { type: Object, required: true },
  products: { type: Array, required: true },
  options: { type: Object, default: null },
})
const emit = defineEmits(['close', 'apply'])
const dialog = ref(null)
const overrides = ref([])
const membershipSet = ref(null)
const zoom = ref(1)
const result = computed(() => {
  if (!props.options) return null
  try {
    return proposeArrangement(props.project, props.products, { ...props.options, overrides: overrides.value })
  } catch (error) {
    return {
      items: props.project.items,
      sets: [],
      guides: [],
      canApply: false,
      issues: [{ id: 'error', message: error.message }],
    }
  }
})
const preview = computed(() => ({ ...props.project, items: result.value?.items || props.project.items }))
const { cancel } = useConstructorDialog(
  dialog,
  () => Boolean(props.options),
  () => emit('close')
)
watch(
  () => props.options,
  () => {
    overrides.value = []
    membershipSet.value = null
    zoom.value = 1
  }
)
function adjust(set, axis, itemIds) {
  const previous = overrides.value.find((entry) => entry.setId === set.id)
  overrides.value = [
    ...overrides.value.filter((entry) => entry.setId !== set.id),
    { ...previous, setId: set.id, axis, ...(itemIds ? { itemIds } : {}) },
  ]
}
function toggleMember(id) {
  const set = result.value?.sets.find((entry) => entry.id === membershipSet.value)
  if (!set) return
  const item = props.project.items.find((entry) => entry.id === id)
  const family = props.project.items
    .filter((entry) => entry.id === id || (item?.groupId && entry.groupId === item.groupId))
    .map((entry) => entry.id)
  const ids = set.itemIds.includes(id)
    ? set.itemIds.filter((entry) => !family.includes(entry))
    : [...new Set([...set.itemIds, ...family])]
  adjust(set, set.axis || 'x', ids)
}
function direction(event, set) {
  adjust(set, event.target.value)
}
</script>
<template>
  <dialog ref="dialog" class="client-dialog arrangement-dialog" aria-labelledby="arrange-title" @cancel="cancel">
    <template v-if="options && result">
      <header class="client-dialog-header">
        <div>
          <p class="client-eyebrow">Предпросмотр расстановки</p>
          <h2 id="arrange-title">
            {{
              options.mode === 'corners'
                ? 'Уголки по раме'
                : options.mode === 'center'
                  ? 'По центру створки'
                  : 'Выровнять рисунок'
            }}
          </h2>
        </div>
        <button type="button" aria-label="Закрыть предпросмотр" @click="emit('close')">×</button>
      </header>
      <p class="client-muted">
        Контуры показывают исходное положение. Размеры деталей сохраняются. Изменения пока не применены.
      </p>
      <div class="arrangement-body">
        <ConstructorCanvas
          :project="preview"
          :products="products"
          :readonly="true"
          :original-items="project.items"
          :preview-guides="result.guides"
          :preview-sets="result.sets"
          :selected-ids="result.sets.find((set) => set.id === membershipSet)?.itemIds || []"
          :show-grid="false"
          v-model:zoom="zoom"
          @preview-select="toggleMember"
        />
        <div class="arrangement-sets">
          <p v-if="!result.sets.length" class="client-muted">
            Подходящих наборов нет. Выделите детали и выберите направление в «Равных промежутках».
          </p>
          <section
            v-for="set in result.sets"
            :key="set.id"
            :class="['arrangement-set', { editing: membershipSet === set.id }]"
          >
            <h3>{{ set.label }}</h3>
            <p v-if="set.gapMm !== undefined" class="client-muted">
              Промежуток: {{ typeof set.gapMm === 'number' ? Math.round(set.gapMm * 100) / 100 : '' }} мм
            </p>
            <label v-if="['row', 'column', 'grid', 'ambiguous'].includes(set.kind)"
              >Расположить
              <select :value="set.status === 'skipped' ? 'skip' : set.axis || ''" @change="direction($event, set)">
                <option disabled value="">Выберите направление</option>
                <option value="x">В ряд</option>
                <option value="y">В колонку</option>
                <option v-if="set.kind === 'grid'" value="both">Сеткой</option>
                <option value="skip">Не менять</option>
              </select>
            </label>
            <button
              v-if="['row', 'column', 'ambiguous'].includes(set.kind)"
              type="button"
              class="text-action"
              @click="membershipSet = membershipSet === set.id ? null : set.id"
            >
              {{ membershipSet === set.id ? 'Завершить выбор' : 'Изменить состав' }}
            </button>
            <button
              v-if="!['row', 'column', 'grid', 'ambiguous'].includes(set.kind)"
              type="button"
              class="text-action"
              @click="adjust(set, set.status === 'skipped' ? set.axis || 'both' : 'skip')"
            >
              {{ set.status === 'skipped' ? 'Включить' : 'Не менять' }}
            </button>
          </section>
          <p v-if="membershipSet" role="status">
            Нажимайте на детали в эскизе, чтобы включить или исключить их из набора.
          </p>
          <div v-if="result.issues.length" class="client-issues" role="status">
            <p v-for="issue in result.issues" :key="issue.id">{{ issue.message }}</p>
          </div>
        </div>
      </div>
      <footer class="client-dialog-actions">
        <button type="button" class="constructor-button outline" @click="emit('close')">Вернуть</button
        ><button
          type="button"
          class="constructor-button primary"
          :disabled="!result.canApply"
          @click="emit('apply', result)"
        >
          {{ !result.canApply ? 'Уточните расстановку' : result.changed ? 'Применить' : 'Готово — уже выровнено' }}
        </button>
      </footer>
    </template>
  </dialog>
</template>
