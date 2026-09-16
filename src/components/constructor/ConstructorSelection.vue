<script setup>
import { computed, ref } from 'vue'
import ConstructorIcon from './ConstructorIcon.vue'
import ConstructorMirror from './ConstructorMirror.vue'
const props = defineProps({
  items: { type: Array, default: () => [] },
  product: { type: Object, default: null },
  type: { type: String, default: 'gates' },
})
const emit = defineEmits(['action', 'update', 'mirror-copy', 'arrange', 'fill-corners'])
const mirrorScope = defineModel('mirrorScope', { type: String, default: 'panel' })
const cornerInset = defineModel('cornerInset', { type: [Number, String], default: 20 })
const cornerScope = ref('panel')
const isCorner = computed(
  () =>
    props.items.length === 1 &&
    (props.product?.group === 'corners' || /уголок|угловой/i.test(props.product?.name || ''))
)
const locked = computed(() => props.items.some((item) => item.locked))
const grouped = computed(() => props.items.some((item) => item.groupId))
function coordinate(key, event) {
  const value = Number(event.target.value)
  if (event.target.value !== '' && Number.isFinite(value)) emit('update', { [key]: value })
}
</script>

<template>
  <section class="client-selection" aria-label="Настройки выбранных деталей" data-testid="selected-detail">
    <template v-if="items.length">
      <p class="client-eyebrow">
        {{ items.length > 1 ? 'Выбрано деталей: ' + items.length : 'Выбранная деталь · ' + product?.id }}
      </p>
      <h2>{{ items.length > 1 ? (grouped ? 'Составной узор' : 'Несколько деталей') : product?.shortName }}</h2>
      <p v-if="items.length === 1" class="client-muted">
        {{ product?.widthMm }} × {{ product?.heightMm }} мм ·
        {{ product?.requiresDimensions ? 'размеры указаны вами' : 'размер фиксирован' }}
      </p>
      <p v-if="locked" class="client-lock-note">Закреплено. Снимите закрепление, чтобы изменить положение.</p>
      <div class="client-quick-actions">
        <button type="button" :disabled="locked" @click="emit('action', 'rotate')">
          <ConstructorIcon name="rotate" />Повернуть
        </button>
        <button type="button" :disabled="locked" @click="emit('action', 'flip')">
          <ConstructorIcon name="flip" />Отразить
        </button>
        <button type="button" @click="emit('action', 'copy')"><ConstructorIcon name="copy" />Копировать</button>
        <button type="button" :disabled="locked" @click="emit('action', 'delete')">
          <ConstructorIcon name="trash" />Удалить
        </button>
      </div>
      <div v-if="isCorner" class="client-selection-section client-fill-corners">
        <h3>Расставить уголки</h3>
        <label v-if="type === 'gates'" class="client-corner-scope"
          >Где разместить
          <select v-model="cornerScope" aria-label="Область расстановки уголков">
            <option value="panel">4 угла текущей створки</option>
            <option value="all-panels">8 углов обеих створок</option>
          </select>
        </label>
        <label class="client-inset"
          >Отступ от внутренней рамы
          <span
            ><input
              v-model.number="cornerInset"
              type="number"
              min="0"
              max="1000"
              step="1"
              aria-label="Отступ уголков от рамы, мм"
            />
            мм</span
          >
        </label>
        <button
          type="button"
          class="constructor-button outline"
          @click="emit('fill-corners', { scope: type === 'gates' ? cornerScope : 'panel' })"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />
          </svg>
          Во все углы
        </button>
        <p class="client-muted">
          Выбранный уголок — образец. Заполним недостающие углы зеркальными копиями. Сначала покажем результат.
        </p>
      </div>
      <div class="client-selection-section">
        <h3>По центру створки</h3>
        <div class="client-segmented">
          <button type="button" :disabled="locked" @click="emit('arrange', { mode: 'center', axis: 'x' })">
            По ширине
          </button>
          <button type="button" :disabled="locked" @click="emit('arrange', { mode: 'center', axis: 'y' })">
            По высоте
          </button>
          <button type="button" :disabled="locked" @click="emit('arrange', { mode: 'center', axis: 'both' })">
            Обе оси
          </button>
        </div>
      </div>
      <div v-if="items.length > 1" class="client-selection-section">
        <h3>Равные промежутки</h3>
        <div class="client-segmented">
          <button type="button" @click="emit('arrange', { mode: 'distribute', axis: 'x' })">По горизонтали</button>
          <button type="button" @click="emit('arrange', { mode: 'distribute', axis: 'y' })">По вертикали</button>
        </div>
        <button
          type="button"
          class="constructor-button outline"
          :disabled="locked"
          @click="emit('action', grouped ? 'ungroup' : 'group')"
        >
          {{ grouped ? 'Разъединить узор' : 'Объединить в узор' }}
        </button>
      </div>
      <details class="client-selection-section">
        <summary>Дополнительно</summary>
        <button type="button" class="constructor-button outline" @click="emit('action', 'lock')">
          {{ locked ? 'Снять закрепление' : 'Закрепить положение' }}
        </button>
        <ConstructorMirror
          v-if="items.length === 1"
          :type="type"
          v-model:scope="mirrorScope"
          @copy="emit('mirror-copy', $event)"
        />
      </details>
      <details class="client-selection-section">
        <summary>Точная настройка</summary>
        <p v-if="items.length > 1" class="client-muted">
          Координаты опорной детали. Весь выбранный узор перемещается вместе.
        </p>
        <div class="position-inputs">
          <label
            >X, мм<input
              :value="Math.round(items[0].x * 100) / 100"
              :disabled="locked"
              type="number"
              aria-label="Позиция X"
              @change="coordinate('x', $event)"
          /></label>
          <label
            >Y, мм<input
              :value="Math.round(items[0].y * 100) / 100"
              :disabled="locked"
              type="number"
              aria-label="Позиция Y"
              @change="coordinate('y', $event)"
          /></label>
          <label v-if="items.length === 1"
            >Угол, °<input
              :value="items[0].rotation"
              :disabled="locked"
              type="number"
              aria-label="Угол поворота"
              @change="coordinate('rotation', $event)"
          /></label>
        </div>
        <button
          v-if="items.length === 1 && product?.requiresDimensions"
          type="button"
          class="constructor-button outline"
          @click="emit('action', 'dimensions')"
        >
          Указать размеры детали
        </button>
      </details>
    </template>
    <template v-else>
      <p class="client-eyebrow">Ваш рисунок</p>
      <h2>Начните с детали</h2>
      <p class="client-muted">
        Нажмите плюс у детали в каталоге — она сразу появится на эскизе. Перетащите её на нужное место или начните с
        готовой композиции.
      </p>
      <ol class="client-tips">
        <li>Перетаскивайте детали за изображение.</li>
        <li>Включите «Выбрать несколько», чтобы собрать узор.</li>
        <li>«Выровнять рисунок» покажет результат до применения.</li>
      </ol>
    </template>
  </section>
</template>
