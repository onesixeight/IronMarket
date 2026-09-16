<template>
  <aside class="constructor-panel element-library" aria-label="Библиотека элементов">
    <div class="panel-heading">
      <div>
        <span class="panel-kicker">01 / Каталог</span>
        <h2>Элементы ковки</h2>
      </div>
      <span class="quantity-badge">{{ products.length }}</span>
    </div>
    <label class="library-search"
      ><ConstructorIcon name="search" /><input
        v-model="search"
        type="search"
        placeholder="Название, артикул, профиль"
        aria-label="Найти элемент"
    /></label>
    <label class="library-category">
      <span>Категория</span>
      <select v-model="group" aria-label="Категория элементов">
        <option value="all">Все категории · {{ products.length }}</option>
        <option v-for="entry in groups" :key="entry.id" :value="entry.id">
          {{ entry.label }} · {{ groupCounts.get(entry.id) || 0 }}
        </option>
      </select>
    </label>
    <label class="fit-filter"><input v-model="onlyFit" type="checkbox" /> По размеру створки / секции</label>
    <p v-if="onlyFit" class="library-fit-note">Без элементов с размерами на уточнение.</p>
    <div class="library-result-count" aria-live="polite">
      Найдено {{ filteredProducts.length }} из {{ products.length
      }}<button v-if="search || group !== 'all' || onlyFit" type="button" @click="resetFilters">Сбросить</button>
    </div>
    <p v-if="error" ref="errorElement" class="catalog-add-error" role="alert">{{ error }}</p>
    <section
      v-if="pendingProduct"
      ref="dimensionChoice"
      class="catalog-dimension-choice"
      tabindex="-1"
      aria-label="Выбор детали без подтверждённых размеров"
      @keydown.esc.prevent.stop="closeUnknown"
    >
      <button type="button" class="dimension-choice-close" aria-label="Закрыть выбор детали" @click="closeUnknown">
        ×
      </button>
      <strong>{{ pendingProduct.shortName || pendingProduct.name }} · {{ pendingProduct.id }}</strong>
      <p>Размеры этой детали нужно уточнить. Можно оставить её в подборке для обсуждения с мастером.</p>
      <button type="button" class="dimension-choice-primary" @click="chooseUnknown('discuss')">
        Добавить для обсуждения
      </button>
      <button type="button" @click="chooseUnknown('manual-dimensions')">Я знаю размеры — указать</button>
    </section>
    <div ref="libraryElement" class="library-products" data-testid="constructor-library">
      <button
        v-for="(product, index) in filteredProducts"
        :key="product.id"
        type="button"
        class="element-card"
        :aria-label="productLabel(product)"
        :data-product-id="product.id"
        :tabindex="index === activeIndex ? 0 : -1"
        @focus="activeIndex = index"
        @keydown="navigateProducts($event, index)"
        @click="selectProduct(product)"
      >
        <span class="element-picture">
          <svg :viewBox="cropViewBox(product)" aria-hidden="true">
            <defs>
              <clipPath :id="clipId(product)" clipPathUnits="userSpaceOnUse">
                <polygon v-if="product.clipPolygon?.length" :points="polygonPoints(product)" />
                <rect
                  v-else
                  :x="product.crop?.x || 0"
                  :y="product.crop?.y || 0"
                  :width="product.crop?.width || product.imageWidth || 1000"
                  :height="product.crop?.height || product.imageHeight || 1000"
                />
              </clipPath>
            </defs>
            <image
              :href="product.image"
              :width="product.imageWidth"
              :height="product.imageHeight"
              :clip-path="`url(#${clipId(product)})`"
            />
          </svg>
          <span v-if="product.saleUnit === 'pair'" class="element-pair-badge">Продаётся парой</span>
          <span class="element-add"><ConstructorIcon name="plus" /></span>
        </span>
        <span class="element-card-article">Арт. {{ product.id }}</span>
        <span class="element-card-name">{{ product.shortName || product.name }}</span>
        <span class="element-card-material">{{ product.material || 'Профиль уточняется' }}</span>
        <span v-if="needsDimensions(product)" class="element-card-size element-size-pending"
          >Уточнить размеры <span aria-hidden="true">↗</span></span
        >
        <span v-else class="element-card-size">{{ product.widthMm }} × {{ product.heightMm }} <span>мм</span></span>
      </button>
      <div v-if="!filteredProducts.length" class="library-empty">
        Таких элементов не найдено. Попробуйте другое название или категорию.
      </div>
    </div>
    <p class="library-footnote">
      Нажмите на деталь, чтобы добавить её. Детали без размеров можно сохранить для обсуждения с мастером. С клавиатуры:
      стрелки — выбор детали, Enter — добавить.
    </p>
  </aside>
</template>

<script setup>
import { computed, nextTick, ref, useId, watch } from 'vue'
import ConstructorIcon from './ConstructorIcon.vue'
import { PROJECT_LIMITS } from '../../constructor/model.js'
const props = defineProps({
  products: { type: Array, required: true },
  groups: { type: Array, required: true },
  project: { type: Object, required: true },
  error: { type: String, default: '' },
})
const emit = defineEmits(['add', 'discuss', 'manual-dimensions', 'clear-error'])
const pendingProduct = ref(null)
const dimensionChoice = ref(null)
const search = ref('')
const group = ref('all')
const onlyFit = ref(false)
const libraryElement = ref(null)
const activeIndex = ref(0)
const errorElement = ref(null)
const clipPrefix = `catalog-image-${useId().replace(/:/g, '')}`
function clipId(product) {
  return `${clipPrefix}-${product.id}`
}
function polygonPoints(product) {
  return product.clipPolygon.map((point) => point.join(',')).join(' ')
}
const groupCounts = computed(() => {
  const counts = new Map()
  for (const product of props.products) counts.set(product.group, (counts.get(product.group) || 0) + 1)
  return counts
})
function normalizeText(text) {
  return String(text || '')
    .toLocaleLowerCase('ru-RU')
    .replace(/[×x]/g, 'х')
}
function needsDimensions(product) {
  return (
    product.requiresDimensions ||
    !Number.isFinite(product.widthMm) ||
    !Number.isFinite(product.heightMm) ||
    product.widthMm <= 0 ||
    product.heightMm <= 0
  )
}
function cropViewBox(product) {
  return product.crop
    ? `${product.crop.x} ${product.crop.y} ${product.crop.width} ${product.crop.height}`
    : `0 0 ${product.imageWidth || 1000} ${product.imageHeight || 1000}`
}
function productLabel(product) {
  const action = needsDimensions(product) ? 'Выбрать для обсуждения или указать размеры' : 'Добавить'
  const size = needsDimensions(product) ? '' : `, ${product.widthMm} на ${product.heightMm} мм`
  return `${action} ${product.shortName || product.name}, артикул ${product.id}, ${product.material || 'профиль уточняется'}${size}${product.saleUnit === 'pair' ? ', одна деталь, товар продаётся парами' : ''}`
}
async function selectProduct(product) {
  emit('clear-error')
  if (!needsDimensions(product)) {
    emit('add', product)
    return
  }
  pendingProduct.value = product
  await nextTick()
  dimensionChoice.value?.focus({ preventScroll: true })
  dimensionChoice.value?.scrollIntoView({ block: 'nearest' })
}
function productButtons() {
  return [...(libraryElement.value?.querySelectorAll('.element-card') || [])]
}
function focusProduct(index) {
  const buttons = productButtons()
  if (!buttons.length) return
  activeIndex.value = Math.max(0, Math.min(index, buttons.length - 1))
  const button = buttons[activeIndex.value]
  button.focus({ preventScroll: true })
  button.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}
function navigateProducts(event, index) {
  if (event.altKey || event.ctrlKey || event.metaKey) return
  const buttons = productButtons()
  const firstTop = buttons[0]?.getBoundingClientRect().top
  const columns = Math.max(
    1,
    buttons.filter((button) => Math.abs(button.getBoundingClientRect().top - firstTop) < 1).length
  )
  const destinations = {
    ArrowLeft: index - 1,
    ArrowRight: index + 1,
    ArrowUp: index - columns,
    ArrowDown: index + columns,
    Home: 0,
    End: buttons.length - 1,
  }
  if (!Object.hasOwn(destinations, event.key)) return
  event.preventDefault()
  event.stopPropagation()
  focusProduct(destinations[event.key])
}
async function closeUnknown() {
  pendingProduct.value = null
  await nextTick()
  focusProduct(activeIndex.value)
}
async function chooseUnknown(action) {
  const product = pendingProduct.value
  pendingProduct.value = null
  if (product) emit(action, product)
  if (action === 'discuss') {
    await nextTick()
    focusProduct(activeIndex.value)
  }
}
function resetFilters() {
  search.value = ''
  group.value = 'all'
  onlyFit.value = false
}
const filteredProducts = computed(() =>
  props.products.filter((product) => {
    const tokens = normalizeText(search.value).trim().split(/\s+/).filter(Boolean)
    const searchable = normalizeText(
      `${product.name} ${product.shortName || ''} ${product.id} ${product.material || ''}`
    )
    const width =
      (props.project.type === 'gates' ? (props.project.width - PROJECT_LIMITS.gateGapMm) / 2 : props.project.width) -
      PROJECT_LIMITS.frameMm * 2
    return (
      (group.value === 'all' || group.value === product.group) &&
      tokens.every((token) => searchable.includes(token)) &&
      (!onlyFit.value ||
        (!needsDimensions(product) &&
          product.widthMm <= width &&
          product.heightMm <= props.project.height - PROJECT_LIMITS.frameMm * 2))
    )
  })
)
watch(filteredProducts, async () => {
  const restoreFocus = libraryElement.value?.contains(document.activeElement)
  activeIndex.value = 0
  await nextTick()
  libraryElement.value?.scrollTo({ top: 0 })
  if (restoreFocus) focusProduct(0)
})
watch(
  () => props.error,
  async (error) => {
    if (!error) return
    await nextTick()
    errorElement.value?.scrollIntoView({ block: 'nearest' })
  }
)
</script>

<style scoped>
.catalog-add-error {
  margin: 4px 14px 12px;
  padding: 12px;
  color: #ffd0b7;
  background: #4b281d;
  border: 1px solid #a66b50;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
}
.catalog-dimension-choice {
  position: relative;
  margin: 4px 14px 12px;
  padding: 14px;
  color: #e6d7bb;
  background: #332719;
  border: 1px solid #997742;
  border-radius: 6px;
  outline: none;
}
.catalog-dimension-choice strong {
  display: block;
  padding-right: 44px;
  font-size: 14px;
  line-height: 1.6;
}
.catalog-dimension-choice p {
  margin: 8px 0;
  color: #c6b593;
  font-size: 14px;
  line-height: 1.7;
}
.catalog-dimension-choice > button:not(.dimension-choice-close) {
  display: block;
  width: 100%;
  min-height: 44px;
  margin-top: 7px;
  padding: 7px;
  color: #e3c591;
  background: #211a12;
  border: 1px solid #806139;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}
.catalog-dimension-choice > button.dimension-choice-primary {
  color: #2c2316;
  background: #d8b77b;
  font-weight: 700;
}
.dimension-choice-close {
  position: absolute;
  top: 6px;
  right: 7px;
  width: 44px;
  height: 44px;
  color: #dac6a6;
  background: transparent;
  border: 0;
  font-size: 21px;
  cursor: pointer;
}
.catalog-dimension-choice button:focus-visible {
  outline: 2px solid #efd098;
  outline-offset: 2px;
}
.library-category {
  display: grid;
  gap: 6px;
  margin: 13px 14px 12px;
}
.library-category > span {
  color: #a99a82;
  font-size: 9px;
}
.library-category select {
  width: 100%;
  min-width: 0;
  min-height: 37px;
  padding: 8px 23px 8px 9px;
  color: #e0cfaf;
  background: #211b13;
  border: 1px solid #50412d;
  border-radius: 5px;
  font:
    10px/1.5 'Manrope',
    sans-serif;
  color-scheme: dark;
  cursor: pointer;
  text-overflow: ellipsis;
}
.library-category select:focus-visible {
  outline: 2px solid #c9a266;
  outline-offset: 2px;
}
.fit-filter {
  padding-bottom: 8px;
}
.library-fit-note {
  margin: -1px 14px 8px;
  color: #ab9676;
  font-size: 9px;
  line-height: 1.5;
}
.library-result-count {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 30px;
  padding: 0 14px 8px;
  color: #9e8e76;
  font-size: 9px;
}
.library-result-count button {
  color: #d5b17c;
  font-size: 9px;
  padding: 2px 0;
}
.element-card-article {
  display: block;
  margin-top: 7px;
  color: #ad997b;
  font-size: 8px;
  line-height: 1.4;
}
.element-card-name {
  margin-top: 3px;
}
.element-card-material {
  display: block;
  margin-top: 3px;
  color: #bba990;
  font-size: 8px;
  line-height: 1.5;
}
.element-card .element-card-size {
  margin-top: 6px;
}
.element-card .element-size-pending {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 2px;
  color: #e0bb7b;
  font-size: 9px;
}
.element-pair-badge {
  position: absolute;
  top: 5px;
  left: 5px;
  right: 5px;
  padding: 2px 3px;
  color: #6e5126;
  background: #f8edcf;
  border: 1px solid #bda476;
  border-radius: 3px;
  font-size: 7px;
  line-height: 1.3;
  text-align: center;
}
.element-card:focus-visible {
  outline: 2px solid #d5b17c;
  outline-offset: 3px;
}
@media (max-width: 760px) {
  .library-category {
    margin-top: 12px;
  }
  .library-category > span,
  .library-result-count {
    font-size: 10px;
  }
  .library-category select {
    min-height: 41px;
    font-size: 12px;
  }
  .library-result-count button {
    min-height: 28px;
    font-size: 10px;
  }
  .element-card-article,
  .element-card-material {
    font-size: 9px;
  }
  .element-card .element-size-pending {
    font-size: 10px;
  }
}
</style>
