<script setup>
import { computed, nextTick, onMounted, onScopeDispose, ref, useId, watch } from 'vue'
import { buildPreset, constructorPresets } from '../../constructor/presets.js'
import { getBillOfMaterials } from '../../constructor/model.js'
import { lockScroll, unlockScroll } from '../../composables/useScrollLock.js'
import ConstructorPreview from './ConstructorPreview.vue'

const props = defineProps({
  project: { type: Object, required: true },
  products: { type: Array, required: true },
  open: { type: Boolean, default: false },
  activeId: { type: String, default: null },
})
const emit = defineEmits(['close', 'apply'])
const dialogElement = ref(null)
const headingElement = ref(null)
const selectedId = ref(null)
const style = ref('all')
const titleId = `composition-title-${useId().replace(/:/g, '')}`
const descriptionId = `${titleId}-description`
let previousFocus = null
let scrollLocked = false

const presets = computed(() => constructorPresets.filter((preset) => preset.id !== 'empty'))
const styles = computed(() => [...new Set(presets.value.map((preset) => preset.style).filter(Boolean))])
const geometry = computed(() => ({
  ...props.project,
  items: [],
}))
const entries = computed(() =>
  presets.value.map((preset) => {
    const result = buildPreset(geometry.value, props.products, preset.id)
    const previewProject = result.available
      ? geometry.value
      : {
          ...geometry.value,
          width: Math.max(geometry.value.width, result.minimum.width),
          height: Math.max(geometry.value.height, result.minimum.height),
        }
    const preview = result.available ? result : buildPreset(previewProject, props.products, preset.id)
    return { preset, result, previewProject, previewItems: preview.items }
  })
)
const visibleEntries = computed(() =>
  entries.value.filter((entry) => style.value === 'all' || entry.preset.style === style.value)
)
const selected = computed(() => entries.value.find((entry) => entry.preset.id === selectedId.value))
const selectedBill = computed(() =>
  selected.value
    ? getBillOfMaterials({ ...selected.value.previewProject, items: selected.value.previewItems }, props.products)
    : []
)
const selectedQuantity = computed(() => selectedBill.value.reduce((total, row) => total + row.quantity, 0))
const frameName = computed(() => ({ gates: 'Ворота', wicket: 'Калитка', fence: 'Секция забора' })[props.project.type])

function formatMm(value) {
  return Math.round(value).toLocaleString('ru-RU')
}

function parts(count) {
  const lastTwo = count % 100
  const last = count % 10
  return `${count} ${last === 1 && lastTwo !== 11 ? 'деталь' : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'детали' : 'деталей'}`
}

function minimumText(entry) {
  return `Нужно от ${formatMm(entry.result.minimum.width)} × ${formatMm(entry.result.minimum.height)} мм`
}

function releaseDialog() {
  if (scrollLocked) {
    unlockScroll()
    scrollLocked = false
  }
  if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
  previousFocus = null
}

async function syncDialog() {
  await nextTick()
  const dialog = dialogElement.value
  if (!dialog) return
  if (props.open && !dialog.open) {
    style.value = 'all'
    selectedId.value = entries.value.some((entry) => entry.preset.id === props.activeId)
      ? props.activeId
      : (entries.value.find((entry) => entry.result.available) || entries.value[0])?.preset.id || null
    previousFocus = document.activeElement
    dialog.showModal()
    lockScroll()
    scrollLocked = true
    headingElement.value?.focus({ preventScroll: true })
  } else if (!props.open && dialog.open) {
    dialog.close()
    releaseDialog()
  }
}

function onClosed() {
  if (dialogElement.value?.open) return
  releaseDialog()
  if (props.open) emit('close')
}

function onBackdropClick(event) {
  if (event.target !== dialogElement.value) return
  const bounds = dialogElement.value.getBoundingClientRect()
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  ) {
    emit('close')
  }
}

function applySelected() {
  if (selected.value?.result.available) emit('apply', selected.value.preset.id)
}

watch(() => props.open, syncDialog, { flush: 'post' })
onMounted(syncDialog)
onScopeDispose(() => {
  if (dialogElement.value?.open) dialogElement.value.close()
  releaseDialog()
})
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialogElement"
      class="composition-gallery"
      data-testid="template-gallery"
      :aria-labelledby="titleId"
      :aria-describedby="descriptionId"
      @cancel.prevent="emit('close')"
      @close="onClosed"
      @click="onBackdropClick"
    >
      <div class="composition-gallery__layout">
        <header class="composition-gallery__header">
          <div class="composition-gallery__eyebrow">
            <span></span> Библиотека рисунков
            <span class="composition-gallery__edition">{{ String(presets.length).padStart(2, '0') }} композиций</span>
          </div>
          <button
            type="button"
            class="composition-gallery__close"
            aria-label="Закрыть готовые композиции"
            @click="emit('close')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
          <h2 :id="titleId" ref="headingElement" tabindex="-1">Готовые композиции</h2>
          <p :id="descriptionId" class="composition-gallery__intro">
            {{ frameName }} · {{ formatMm(project.width) }} × {{ formatMm(project.height) }} мм. Рисунки собраны из
            реальных деталей каталога.
          </p>
          <div class="composition-gallery__filters" aria-label="Стиль композиции">
            <button
              type="button"
              :aria-pressed="style === 'all'"
              :class="{ active: style === 'all' }"
              @click="style = 'all'"
            >
              Все <span>{{ presets.length }}</span>
            </button>
            <button
              v-for="entry in styles"
              :key="entry"
              type="button"
              :aria-pressed="style === entry"
              :class="{ active: style === entry }"
              @click="style = entry"
            >
              {{ entry }}
            </button>
          </div>
        </header>

        <div class="composition-gallery__scroll">
          <div class="composition-gallery__grid" aria-label="Выберите готовый рисунок">
            <button
              v-for="(entry, index) in visibleEntries"
              :key="entry.preset.id"
              type="button"
              class="composition-card"
              :class="{ 'is-selected': selectedId === entry.preset.id, 'is-unavailable': !entry.result.available }"
              :data-preset-id="entry.preset.id"
              :aria-pressed="selectedId === entry.preset.id"
              :aria-label="`${entry.preset.name}. ${entry.preset.description}. ${entry.result.available ? parts(entry.result.items.length) : minimumText(entry)}`"
              @click="selectedId = entry.preset.id"
            >
              <span class="composition-card__preview">
                <ConstructorPreview
                  :project="entry.previewProject"
                  :products="products"
                  :items="entry.previewItems"
                  aria-hidden="true"
                />
                <span class="composition-card__number">{{ String(index + 1).padStart(2, '0') }}</span>
                <span class="composition-card__selection" aria-hidden="true"
                  ><svg
                    v-if="selectedId === entry.preset.id"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                  >
                    <path d="m5 10 3 3 7-7" /></svg
                ></span>
                <span v-if="!entry.result.available" class="composition-card__size-note"
                  >Показано в подходящем размере</span
                >
              </span>
              <span class="composition-card__body">
                <span class="composition-card__title-row"
                  ><span class="composition-card__name">{{ entry.preset.name }}</span
                  ><span v-if="entry.preset.density" class="composition-card__density">{{
                    entry.preset.density
                  }}</span></span
                >
                <span class="composition-card__description">{{ entry.preset.description }}</span>
                <span class="composition-card__meta" :class="{ 'needs-room': !entry.result.available }">{{
                  entry.result.available
                    ? `${parts(entry.result.items.length)} · ${entry.preset.style}`
                    : minimumText(entry)
                }}</span>
              </span>
            </button>
          </div>
          <p class="composition-gallery__drawing-note">
            Все детали сохраняют размеры по каталогу. Рама на эскизе условная.
          </p>
        </div>

        <footer class="composition-gallery__footer">
          <div class="composition-gallery__summary">
            <div v-if="selected" class="composition-gallery__selected-title">
              <span>{{ selected.preset.name }}</span
              ><span
                >{{ parts(selectedQuantity)
                }}{{ project.type === 'fence' && project.sections > 1 ? ` на ${project.sections} секц.` : '' }}</span
              >
            </div>
            <div v-if="selected && selected.result.available" class="composition-gallery__parts">
              <span v-for="row in selectedBill.slice(0, 2)" :key="row.product.id"
                >{{ row.product.shortName || row.product.name }} × {{ row.quantity }}</span
              ><span v-if="selectedBill.length > 2">+{{ selectedBill.length - 2 }} вида</span>
            </div>
            <p v-else-if="selected" class="composition-gallery__unavailable">
              {{ selected.result.reason || minimumText(selected) }}
            </p>
            <p class="composition-gallery__replace-note">Заменит текущий рисунок. Изменение можно отменить.</p>
          </div>
          <button
            type="button"
            class="composition-gallery__apply"
            data-testid="template-apply"
            :disabled="!selected?.result.available"
            @click="applySelected"
          >
            Применить композицию
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
              <path d="M4 12h16m-6-6 6 6-6 6" />
            </svg>
          </button>
        </footer>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.composition-gallery {
  width: min(1160px, calc(100vw - 48px));
  max-width: none;
  max-height: min(900px, 90dvh);
  margin: auto;
  padding: 0;
  overflow: hidden;
  color: #eee5d4;
  background: #191610;
  border: 1px solid #5b4930;
  border-radius: 12px;
  box-shadow: 0 28px 100px #0009;
  font-family: 'Manrope', sans-serif;
}
.composition-gallery::backdrop {
  background: #090806bc;
  backdrop-filter: blur(5px);
}
.composition-gallery__layout {
  display: flex;
  flex-direction: column;
  max-height: min(898px, calc(90dvh - 2px));
}
.composition-gallery__header {
  position: relative;
  flex: none;
  padding: 27px 30px 0;
  border-bottom: 1px solid #3d3325;
}
.composition-gallery__eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 42px;
  color: #c4a26e;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.composition-gallery__eyebrow > span:first-child {
  width: 17px;
  height: 1px;
  background: #b59260;
}
.composition-gallery__edition {
  margin-left: auto;
  color: #938574;
  letter-spacing: 0.04em;
}
.composition-gallery__close {
  position: absolute;
  top: 18px;
  right: 18px;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  color: #c1b29a;
  background: #ffffff05;
  border: 1px solid #493d2b;
  border-radius: 50%;
  cursor: pointer;
}
.composition-gallery__close:hover {
  color: #fff4dd;
  background: #ffffff0b;
}
.composition-gallery__close svg {
  width: 17px;
  height: 17px;
}
.composition-gallery h2 {
  margin: 13px 0 7px;
  font:
    34px/1.15 Georgia,
    serif;
  letter-spacing: -0.025em;
  outline: none;
}
.composition-gallery__intro {
  margin: 0;
  color: #ad9e87;
  font-size: 11px;
  line-height: 1.8;
}
.composition-gallery__filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 21px;
  padding-bottom: 18px;
}
.composition-gallery__filters button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 32px;
  padding: 7px 14px;
  color: #b7a98f;
  border: 1px solid #493b28;
  border-radius: 5px;
  background: transparent;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 130ms ease,
    color 130ms ease,
    border-color 130ms ease;
}
.composition-gallery__filters button.active {
  color: #f0d4a3;
  background: #77603c37;
  border-color: #9a7845;
}
.composition-gallery__filters button:hover {
  border-color: #9a7845;
}
.composition-gallery__filters button > span {
  color: #9e8a6a;
  font-size: 9px;
}
.composition-gallery__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 22px 30px 15px;
  scrollbar-width: thin;
  scrollbar-color: #635035 #191610;
}
.composition-gallery__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 17px;
  align-items: stretch;
}
.composition-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 0;
  overflow: hidden;
  color: #e9dfcc;
  background: #211c14;
  border: 1px solid #473a28;
  border-radius: 7px;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 130ms ease,
    box-shadow 130ms ease;
}
.composition-card:hover {
  border-color: #a18557;
}
.composition-card.is-selected {
  border-color: #c4a169;
  box-shadow: 0 0 0 2px #c4a16926;
}
.composition-card__preview {
  position: relative;
  display: block;
  width: 100%;
  overflow: hidden;
}
.composition-card__number {
  position: absolute;
  top: 10px;
  left: 12px;
  color: #7d806c;
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.07em;
}
.composition-card__selection {
  position: absolute;
  top: 9px;
  right: 10px;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 1px solid #adae9b;
  border-radius: 50%;
  color: #2b2418;
  background: #f1f0e6;
}
.is-selected .composition-card__selection {
  border-color: #b99a61;
  background: #d7ba82;
}
.composition-card__selection svg {
  width: 17px;
  height: 17px;
}
.composition-card__size-note {
  position: absolute;
  right: 5px;
  bottom: 5px;
  left: 5px;
  padding: 4px;
  color: #6a573b;
  background: #f3eddeea;
  border-radius: 3px;
  font-size: 8px;
  line-height: 1.3;
  text-align: center;
}
.composition-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  padding: 13px 14px 12px;
}
.composition-card__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 5px;
}
.composition-card__name {
  font:
    19px/1.2 Georgia,
    serif;
}
.composition-card__density {
  color: #a19074;
  font-size: 8px;
  white-space: nowrap;
}
.composition-card__description {
  display: block;
  flex: 1;
  margin-top: 6px;
  color: #a7977f;
  font-size: 10px;
  line-height: 1.6;
}
.composition-card__meta {
  display: block;
  margin-top: 10px;
  color: #cfb788;
  font-size: 9px;
  font-weight: 500;
  line-height: 1.5;
}
.composition-card__meta.needs-room {
  color: #c3a282;
}
.composition-gallery__drawing-note {
  margin: 15px 0 0;
  color: #94836b;
  font-size: 9px;
  line-height: 1.6;
}
.composition-gallery__footer {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 18px 30px;
  background: #221c13;
  border-top: 1px solid #54412a;
}
.composition-gallery__summary {
  min-width: 0;
}
.composition-gallery__selected-title {
  display: flex;
  align-items: baseline;
  gap: 13px;
  flex-wrap: wrap;
}
.composition-gallery__selected-title > span:first-child {
  font:
    21px/1.2 Georgia,
    serif;
}
.composition-gallery__selected-title > span:last-child {
  color: #c6aa7b;
  font-size: 10px;
}
.composition-gallery__parts {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 13px;
  margin-top: 7px;
  color: #ab997b;
  font-size: 9px;
}
.composition-gallery__replace-note {
  margin: 7px 0 0;
  color: #aa997f;
  font-size: 10px;
  line-height: 1.5;
}
.composition-gallery__unavailable {
  margin: 6px 0 0;
  color: #d0ad84;
  font-size: 10px;
  line-height: 1.5;
}
.composition-gallery__apply {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  gap: 17px;
  min-height: 46px;
  padding: 12px 18px;
  color: #322514;
  background: #d3b477;
  border: 1px solid #ddc08c;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  /* Availability changes must update text and background together. */
  transition: none;
}
.composition-gallery__apply:hover:not(:disabled) {
  background: #e4c794;
}
.composition-gallery__apply:disabled {
  color: #a5957e;
  background: #4a3d2a;
  border-color: #655236;
  cursor: not-allowed;
}
.composition-gallery__apply svg {
  width: 18px;
  height: 18px;
}
.composition-gallery button:focus-visible {
  outline: 2px solid #ecc989;
  outline-offset: 3px;
}
@media (max-width: 850px) {
  .composition-gallery {
    width: calc(100vw - 32px);
  }
  .composition-gallery__header {
    padding: 25px 22px 0;
  }
  .composition-gallery__scroll {
    padding: 19px 22px 15px;
  }
  .composition-gallery__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }
  .composition-gallery__footer {
    padding: 17px 22px;
    gap: 15px;
  }
  .composition-gallery__parts {
    display: none;
  }
}
@media (max-width: 600px) {
  .composition-gallery {
    width: calc(100vw - 18px);
    max-height: 94dvh;
    border-radius: 9px;
  }
  .composition-gallery__layout {
    max-height: calc(94dvh - 2px);
  }
  .composition-gallery__header {
    padding: 22px 16px 0;
  }
  .composition-gallery__eyebrow {
    font-size: 8px;
    padding-right: 28px;
  }
  .composition-gallery__edition {
    display: none;
  }
  .composition-gallery__close {
    top: 13px;
    right: 12px;
    width: 33px;
    height: 33px;
  }
  .composition-gallery h2 {
    margin-top: 13px;
    font-size: 29px;
  }
  .composition-gallery__intro {
    max-width: 310px;
    font-size: 10px;
    line-height: 1.7;
  }
  .composition-gallery__filters {
    gap: 6px;
    margin-top: 15px;
    padding-bottom: 14px;
  }
  .composition-gallery__filters button {
    min-height: 32px;
    padding: 6px 11px;
    font-size: 9px;
  }
  .composition-gallery__scroll {
    padding: 15px 14px 13px;
  }
  .composition-gallery__grid {
    gap: 12px;
  }
  .composition-card__body {
    padding: 10px;
  }
  .composition-card__title-row {
    flex-wrap: wrap;
    gap: 4px;
  }
  .composition-card__name {
    font-size: 18px;
  }
  .composition-card__density {
    font-size: 8px;
  }
  .composition-card__description {
    font-size: 9px;
  }
  .composition-card__meta {
    margin-top: 8px;
    font-size: 8px;
  }
  .composition-gallery__footer {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 15px 16px;
  }
  .composition-gallery__selected-title {
    justify-content: space-between;
    gap: 7px;
  }
  .composition-gallery__selected-title > span:first-child {
    font-size: 20px;
  }
  .composition-gallery__replace-note {
    font-size: 9px;
  }
  .composition-gallery__apply {
    width: 100%;
    min-height: 44px;
    font-size: 11px;
  }
}
@media (max-width: 430px) {
  .composition-gallery__grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .composition-card__body {
    padding: 12px 14px;
  }
  .composition-card__description {
    font-size: 10px;
  }
  .composition-card__meta {
    font-size: 9px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .composition-gallery button {
    transition: none;
  }
}
</style>
