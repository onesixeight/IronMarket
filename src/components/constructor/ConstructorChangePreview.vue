<script setup>
import { computed, ref } from 'vue'
import ConstructorPreview from './ConstructorPreview.vue'
import { useConstructorDialog } from '../../composables/useConstructorDialog.js'
const props = defineProps({ change: { type: Object, default: null }, products: { type: Array, required: true } })
const emit = defineEmits(['close', 'apply'])
const dialog = ref(null)
const { cancel } = useConstructorDialog(
  dialog,
  () => Boolean(props.change),
  () => emit('close')
)
const blocked = computed(() => props.change?.canApply === false)
const catalog = computed(() => new Map(props.products.map((product) => [product.id, product])))
const closeEnough = (a, b) => Math.abs(Number(a ?? 0) - Number(b ?? 0)) <= 0.00001
const angle = (value) => ((Number(value || 0) % 360) + 360) % 360
function itemChanged(before, after) {
  const a = catalog.value.get(before.productId)
  const b = catalog.value.get(after.productId)
  return (
    before.productId !== after.productId ||
    !closeEnough(before.x, after.x) ||
    !closeEnough(before.y, after.y) ||
    !closeEnough(angle(before.rotation), angle(after.rotation)) ||
    Boolean(before.flipX) !== Boolean(after.flipX) ||
    !closeEnough(before.dimensions?.widthMm ?? a?.widthMm, after.dimensions?.widthMm ?? b?.widthMm) ||
    !closeEnough(before.dimensions?.heightMm ?? a?.heightMm, after.dimensions?.heightMm ?? b?.heightMm)
  )
}
const delta = computed(() => {
  const before = props.change?.before
  const after = props.change?.next
  const empty = { addedIds: [], changedIds: [], removedIds: [], basis: [] }
  if (!before || !after) return empty
  const original = new Map(before.items.map((item) => [item.id, item]))
  const next = new Map(after.items.map((item) => [item.id, item]))
  const typeName = { gates: 'Ворота', wicket: 'Калитка', fence: 'Забор' }
  const basis = []
  if (before.type !== after.type) basis.push(typeName[before.type] + ' → ' + typeName[after.type])
  if (before.width !== after.width || before.height !== after.height) {
    basis.push(
      'Размер основы: ' + before.width + ' × ' + before.height + ' → ' + after.width + ' × ' + after.height + ' мм'
    )
  }
  if ((before.sections || 1) !== (after.sections || 1))
    basis.push('Секций: ' + (before.sections || 1) + ' → ' + (after.sections || 1))
  return {
    addedIds: after.items.filter((item) => !original.has(item.id)).map((item) => item.id),
    changedIds: after.items
      .filter((item) => original.has(item.id) && itemChanged(original.get(item.id), item))
      .map((item) => item.id),
    removedIds: before.items.filter((item) => !next.has(item.id)).map((item) => item.id),
    basis,
  }
})
const hasChanges = computed(() =>
  Boolean(
    delta.value.addedIds.length ||
    delta.value.changedIds.length ||
    delta.value.removedIds.length ||
    delta.value.basis.length
  )
)
const unchanged = computed(() => !blocked.value && !hasChanges.value)
const singlePreview = computed(() => blocked.value || unchanged.value)
const beforeHighlights = computed(() => (singlePreview.value ? null : { removedIds: delta.value.removedIds }))
const afterHighlights = computed(() => ({ addedIds: delta.value.addedIds, changedIds: delta.value.changedIds }))
const warnings = computed(() => props.change?.warnings || [])
</script>

<template>
  <dialog ref="dialog" class="client-dialog change-dialog" aria-labelledby="change-title" @cancel="cancel">
    <template v-if="change">
      <header class="client-dialog-header">
        <h2 id="change-title">{{ change.title }}</h2>
        <button type="button" aria-label="Закрыть предпросмотр" @click="emit('close')">×</button>
      </header>
      <div v-if="singlePreview" class="change-result" :class="{ 'change-result--blocked': blocked }" role="status">
        <h3>{{ blocked ? 'Расстановка не выполнена' : 'Ничего менять не нужно' }}</h3>
        <p>
          {{
            blocked
              ? 'Показан текущий эскиз. Его детали и размеры сохранены.'
              : 'Расположение деталей и основа уже соответствуют результату.'
          }}
        </p>
      </div>
      <p v-if="change.description && !unchanged" class="client-muted change-description">{{ change.description }}</p>
      <div v-if="blocked" class="client-issues change-reason">
        <strong>Причина</strong>
        <p v-for="(warning, index) in warnings" :key="warning.id || index">{{ warning.message }}</p>
        <p v-if="!warnings.length">
          {{ change.reason || 'Не удалось получить подходящую расстановку. Проверьте размеры и положение деталей.' }}
        </p>
      </div>
      <section v-if="!singlePreview" class="change-summary" aria-label="Изменения в эскизе">
        <p v-for="entry in delta.basis" :key="entry" class="change-basis">{{ entry }}</p>
        <ul v-if="delta.addedIds.length || delta.changedIds.length || delta.removedIds.length" class="change-legend">
          <li v-if="delta.addedIds.length">
            <span class="change-swatch change-swatch--added" aria-hidden="true"></span>Добавлено:
            <strong>{{ delta.addedIds.length }}</strong>
          </li>
          <li v-if="delta.changedIds.length">
            <span class="change-swatch change-swatch--changed" aria-hidden="true"></span>Переставлено / изменено:
            <strong>{{ delta.changedIds.length }}</strong>
          </li>
          <li v-if="delta.removedIds.length">
            <span class="change-swatch change-swatch--removed" aria-hidden="true"></span>Убрано:
            <strong>{{ delta.removedIds.length }}</strong>
          </li>
        </ul>
        <p v-if="delta.changedIds.length" class="change-explanation">
          Пунктиром отмечены детали, у которых меняются положение, поворот, отражение или размеры.
        </p>
      </section>
      <div class="change-comparison" :class="{ 'change-comparison--single': singlePreview }">
        <figure>
          <figcaption>{{ singlePreview ? 'Текущий эскиз' : 'Сейчас' }}</figcaption>
          <ConstructorPreview
            :project="change.before"
            :items="change.before.items"
            :products="products"
            :highlights="beforeHighlights"
          />
        </figure>
        <figure v-if="!singlePreview">
          <figcaption>
            После применения <span v-if="delta.addedIds.length || delta.changedIds.length">· изменения выделены</span>
          </figcaption>
          <ConstructorPreview
            :project="change.next"
            :items="change.next.items"
            :products="products"
            :highlights="afterHighlights"
          />
        </figure>
      </div>
      <div v-if="!blocked && warnings.length" class="client-issues">
        <p v-for="(warning, index) in warnings" :key="warning.id || index">{{ warning.message }}</p>
      </div>
      <footer class="client-dialog-actions">
        <button v-if="singlePreview" type="button" class="constructor-button outline" @click="emit('close')">
          {{ unchanged ? 'Готово' : 'Вернуться к эскизу' }}
        </button>
        <template v-else>
          <button type="button" class="constructor-button outline" @click="emit('close')">Вернуть</button>
          <button type="button" class="constructor-button primary" @click="emit('apply')">
            {{ change.applyLabel || 'Применить' }}
          </button>
        </template>
      </footer>
    </template>
  </dialog>
</template>

<style scoped>
.change-result {
  margin: 12px 0 16px;
  padding: 14px 16px;
  border: 1px solid #687448;
  border-radius: 8px;
  background: #23291c;
}
.change-result h3 {
  margin: 0 0 5px;
  color: #e0e7c8;
  font-size: 17px;
  line-height: 1.4;
}
.change-result p {
  margin: 0;
  color: #c4cbb4;
  font-size: 14px;
  line-height: 1.5;
}
.change-result--blocked {
  border-color: #886538;
  background: #302619;
}
.change-result--blocked h3 {
  color: #edcd99;
}
.change-result--blocked p {
  color: #d0bea2;
}
.change-description {
  margin-bottom: 16px;
}
.change-reason {
  margin: 0 0 18px;
}
.change-reason strong {
  display: block;
  margin-bottom: 6px;
}
.change-summary {
  margin: 16px 0 8px;
  color: #e0cfb6;
}
.change-basis {
  margin: 4px 0;
  font-size: 14px;
  line-height: 1.5;
}
.change-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  padding: 0;
  margin: 12px 0 0;
  list-style: none;
}
.change-legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  line-height: 1.5;
}
.change-swatch {
  width: 15px;
  height: 15px;
  border: 2px solid #95b77a;
  background: #34432b;
}
.change-swatch--changed {
  border-color: #d9ad66;
  border-style: dashed;
  background: #4b3820;
}
.change-swatch--removed {
  border-color: #d99a8e;
  border-style: dotted;
  background: #4f2f29;
}
.change-explanation {
  margin: 9px 0 0;
  color: #b7aa95;
  font-size: 12px;
  line-height: 1.5;
}
.change-comparison figure {
  min-width: 0;
  margin: 0;
}
.change-comparison figcaption span {
  font-size: 12px;
  color: #b6c592;
}
.change-comparison--single {
  grid-template-columns: minmax(0, 1fr);
}
.change-comparison--single figure {
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
}
@media (max-width: 600px) {
  .change-comparison {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
  .change-comparison :deep(.composition-preview) {
    height: 210px;
  }
  .change-comparison--single :deep(.composition-preview) {
    height: 270px;
  }
  .change-legend {
    gap: 8px 14px;
  }
  .change-legend li {
    font-size: 13px;
  }
  .change-result {
    padding: 12px;
  }
  .change-result h3 {
    font-size: 16px;
  }
}
</style>
