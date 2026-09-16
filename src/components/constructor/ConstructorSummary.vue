<template>
  <aside class="constructor-panel constructor-summary" aria-label="Детали проекта">
    <section v-if="selectedItem && selectedProduct" class="selected-detail" data-testid="selected-detail">
      <span class="panel-kicker">Выбранная деталь · {{ selectedProduct.id }}</span>
      <h2>{{ selectedProduct.shortName }}</h2>
      <p class="selected-size">
        {{ selectedProduct.widthMm }} × {{ selectedProduct.heightMm }} мм
        <span>· {{ selectedProduct.requiresDimensions ? 'размеры указаны вами' : 'размер фиксирован' }}</span>
      </p>
      <button
        v-if="selectedProduct.requiresDimensions"
        type="button"
        class="text-action"
        @click="$emit('action', 'dimensions')"
      >
        Изменить указанные размеры <ConstructorIcon name="arrow" />
      </button>
      <p v-if="selectedProduct.saleUnit === 'pair'" class="selected-sale-note">
        На чертеже одна деталь. Продаётся парой из двух деталей.
      </p>
      <div class="position-inputs">
        <label
          >X, мм<input
            :value="selectedItem.x"
            type="number"
            step="10"
            aria-label="Позиция X"
            @change="coordinate('x', $event)"
        /></label>
        <label
          >Y, мм<input
            :value="selectedItem.y"
            type="number"
            step="10"
            aria-label="Позиция Y"
            @change="coordinate('y', $event)"
        /></label>
        <label
          >Поворот, °<input
            :value="selectedItem.rotation"
            type="number"
            step="1"
            aria-label="Угол поворота"
            @change="coordinate('rotation', $event)"
        /></label>
      </div>
      <div class="selected-actions">
        <button
          type="button"
          title="Повернуть на 90°"
          aria-label="Повернуть на 90 градусов"
          @click="$emit('action', 'rotate')"
        >
          <ConstructorIcon name="rotate" />
        </button>
        <button
          type="button"
          title="Отразить деталь на месте"
          aria-label="Отразить деталь на месте"
          @click="$emit('action', 'flip')"
        >
          <ConstructorIcon name="flip" />
        </button>
        <button type="button" title="Копировать" aria-label="Копировать деталь" @click="$emit('action', 'copy')">
          <ConstructorIcon name="copy" />
        </button>
        <button
          type="button"
          title="В центр створки или секции"
          aria-label="Выровнять по центру"
          @click="$emit('action', 'center')"
        >
          <ConstructorIcon name="center" />
        </button>
        <button
          type="button"
          class="delete-action"
          title="Удалить"
          aria-label="Удалить деталь"
          @click="$emit('action', 'delete')"
        >
          <ConstructorIcon name="trash" />
        </button>
      </div>
      <ConstructorMirror
        :type="project.type"
        :scope="mirrorScope"
        @update:scope="$emit('update:mirror-scope', $event)"
        @copy="$emit('mirror-copy', $event)"
      />
    </section>
    <section v-else class="selection-hint">
      <ConstructorIcon name="center" />
      <p>Выберите деталь на чертеже,<br />чтобы настроить её положение.</p>
    </section>

    <div class="panel-heading bill-heading">
      <div>
        <span class="panel-kicker">03 / Ваш подбор</span>
        <h2>Комплектация</h2>
      </div>
      <span class="quantity-badge" data-testid="bill-total">{{ totalQuantity }}</span>
    </div>
    <p v-if="project.type === 'fence' && project.sections > 1" class="bill-multiplier">
      На {{ project.sections }} одинаковых секций
    </p>
    <div class="bill-list" data-testid="bill-list">
      <div v-for="row in bill" :key="row.key" class="bill-row">
        <div>
          <span class="bill-row-name">{{ row.product.shortName || row.product.name }}</span
          ><span class="bill-row-meta"
            >Арт. {{ row.product.id }} · {{ row.product.widthMm }} × {{ row.product.heightMm }} мм</span
          >
          <span v-if="row.product.requiresDimensions" class="bill-row-meta">Размеры указаны вами</span>
          <span v-if="row.saleUnit === 'pair' && row.orderQuantity !== null" class="bill-row-pair">
            К покупке: {{ row.orderQuantity }} {{ pairWord(row.orderQuantity) }}
            <span v-if="row.spareQuantity"> · {{ row.spareQuantity }} шт. в запасе</span>
            <span v-if="row.skuQuantity !== row.quantity"> · всего по артикулу</span>
          </span>
        </div>
        <strong>{{ row.quantity }}<small> шт.</small></strong>
      </div>
      <p v-if="!bill.length" class="bill-empty">Добавленные элементы появятся здесь вместе с количеством.</p>
    </div>
    <div class="bill-pricing"><span>Стоимость элементов</span><strong>По запросу</strong></div>
    <div v-if="warnings.length" class="project-warnings" role="status" data-testid="project-warnings">
      <strong>Проверьте размещение · {{ warnings.length }}</strong>
      <button
        v-for="warning in warnings.slice(0, 3)"
        :key="warning.id"
        type="button"
        @click="$emit('select', warning.itemId)"
      >
        {{ warning.message }}
      </button>
      <span v-if="warnings.length > 3">И ещё {{ warnings.length - 3 }}. Выберите детали для проверки.</span>
    </div>
    <div v-else-if="bill.length" class="placement-valid"><ConstructorIcon name="check" /> Детали в пределах рамы</div>
    <div class="bill-downloads">
      <button type="button" class="constructor-button primary" :disabled="!bill.length" @click="$emit('export-text')">
        <ConstructorIcon name="download" /> Скачать список деталей
      </button>
      <div class="project-file-actions">
        <button type="button" @click="$emit('export-project')">Сохранить проект</button><span>·</span
        ><button type="button" @click="$emit('import-project')">Открыть проект</button>
      </div>
    </div>
    <p class="summary-footnote">
      Рама показана условно и не входит в подбор. Товары, которые продаются парами, округляются до целых пар. Перед
      заказом мастер проверит размеры, крепления и наличие.
    </p>
  </aside>
</template>

<script setup>
import ConstructorIcon from './ConstructorIcon.vue'
import ConstructorMirror from './ConstructorMirror.vue'
const props = defineProps({
  project: { type: Object, required: true },
  selectedItem: Object,
  selectedProduct: Object,
  bill: { type: Array, required: true },
  totalQuantity: { type: Number, required: true },
  warnings: { type: Array, required: true },
  mirrorScope: { type: String, default: 'panel' },
})
const emit = defineEmits([
  'update',
  'action',
  'select',
  'export-text',
  'export-project',
  'import-project',
  'mirror-copy',
  'update:mirror-scope',
])
function pairWord(count) {
  if (count % 10 === 1 && count % 100 !== 11) return 'пара'
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'пары'
  return 'пар'
}
function coordinate(key, event) {
  const value = Number(event.target.value)
  if (event.target.value === '' || !Number.isFinite(value) || Math.abs(value) > 16000) {
    event.target.value = props.selectedItem[key]
    return
  }
  emit('update', { [key]: key === 'rotation' ? ((value % 360) + 360) % 360 : Math.round(value) })
}
</script>
