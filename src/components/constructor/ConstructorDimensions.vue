<script setup>
import { computed, nextTick, onMounted, onScopeDispose, reactive, ref, useId, watch } from 'vue'
import { lockScroll, unlockScroll } from '../../composables/useScrollLock.js'

const props = defineProps({
  product: { type: Object, default: null },
  editing: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
const emit = defineEmits(['close', 'confirm', 'clear-error'])
const dialogElement = ref(null)
const widthInput = ref(null)
const heightInput = ref(null)
const dimensions = reactive({ widthMm: '', heightMm: '' })
const titleId = `element-dimensions-${useId().replace(/:/g, '')}`
const descriptionId = `${titleId}-description`
let previousFocus = null
let scrollLocked = false
let initializedProduct = null

const isPair = computed(() => props.product?.saleUnit === 'pair')
const clipId = computed(() => `${titleId}-clip-${props.product?.id || 'empty'}`)
const polygonPoints = computed(() => props.product?.clipPolygon?.map((point) => point.join(',')).join(' '))
const cropViewBox = computed(() => {
  const product = props.product
  if (!product) return '0 0 1 1'
  return product.crop
    ? `${product.crop.x} ${product.crop.y} ${product.crop.width} ${product.crop.height}`
    : `0 0 ${product.imageWidth || 1000} ${product.imageHeight || 1000}`
})
const validDimensions = computed(() =>
  [dimensions.widthMm, dimensions.heightMm].every(
    (value) => value !== '' && Number.isFinite(Number(value)) && Number(value) >= 1 && Number(value) <= 8000
  )
)

function knownDimension(value) {
  return Number.isFinite(value) && value >= 1 && value <= 8000 ? value : ''
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
  if (props.product) {
    if (initializedProduct !== props.product) {
      initializedProduct = props.product
      dimensions.widthMm = knownDimension(props.product.widthMm)
      dimensions.heightMm = knownDimension(props.product.heightMm)
    }
    if (!dialog.open) {
      previousFocus = document.activeElement
      dialog.showModal()
      lockScroll()
      scrollLocked = true
      await nextTick()
      const input =
        dimensions.widthMm === '' ? widthInput.value : dimensions.heightMm === '' ? heightInput.value : widthInput.value
      input?.focus({ preventScroll: true })
      input?.select()
    }
  } else {
    initializedProduct = null
    if (dialog.open) dialog.close()
    releaseDialog()
  }
}
function onClosed() {
  if (dialogElement.value?.open) return
  releaseDialog()
  if (props.product) emit('close')
}
function onBackdropClick(event) {
  if (event.target !== dialogElement.value) return
  const bounds = dialogElement.value.getBoundingClientRect()
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  )
    emit('close')
}
function confirmDimensions() {
  emit('clear-error')
  if (!props.product || !validDimensions.value) return
  emit('confirm', {
    product: props.product,
    dimensions: { widthMm: Number(dimensions.widthMm), heightMm: Number(dimensions.heightMm) },
  })
}
watch(() => props.product, syncDialog, { flush: 'post' })
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
      class="element-dimensions"
      data-testid="constructor-dimensions"
      :aria-labelledby="titleId"
      :aria-describedby="descriptionId"
      @cancel.prevent="emit('close')"
      @close="onClosed"
      @click="onBackdropClick"
    >
      <form v-if="product" class="element-dimensions__form" @submit.prevent="confirmDimensions">
        <header class="element-dimensions__header">
          <span class="element-dimensions__eyebrow"
            >{{ editing ? 'Размеры детали' : 'Перед добавлением' }} · арт. {{ product.id }}</span
          >
          <button
            type="button"
            class="element-dimensions__close"
            aria-label="Закрыть уточнение размеров"
            @click="emit('close')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
          <h2 :id="titleId">{{ editing ? 'Размеры детали' : 'Уточните размеры' }}</h2>
          <p>
            {{ product.shortName || product.name }} <span>· {{ product.material || 'Профиль уточняется' }}</span>
          </p>
        </header>
        <div class="element-dimensions__content">
          <div class="element-dimensions__preview">
            <svg
              class="element-dimensions__photo"
              :viewBox="cropViewBox"
              role="img"
              :aria-label="`Фото одной детали: ${product.name}`"
            >
              <defs>
                <clipPath :id="clipId" clipPathUnits="userSpaceOnUse">
                  <polygon v-if="product.clipPolygon?.length" :points="polygonPoints" />
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
                x="0"
                y="0"
                :width="product.imageWidth || 1000"
                :height="product.imageHeight || 1000"
                :clip-path="`url(#${clipId})`"
              />
            </svg>
            <span class="element-dimensions__horizontal"><span aria-hidden="true">↔</span> Ширина на фото</span>
            <span class="element-dimensions__vertical"><span aria-hidden="true">↔</span> Высота</span>
          </div>
          <p v-if="product.dimensionNote" class="element-dimensions__source-note">{{ product.dimensionNote }}</p>
          <p v-if="isPair" class="element-dimensions__pair-note">
            <strong>Размер одной детали.</strong> Товар продаётся парами; количество пар учитывается в комплектации.
            Вторую деталь можно добавить зеркальной копией.
          </p>
          <p :id="descriptionId" class="element-dimensions__instruction">
            Размеры по внешнему контуру детали на фото. Сверьте с изделием.
          </p>
          <div class="element-dimensions__inputs">
            <label
              ><span>Ширина на фото</span
              ><span class="element-dimensions__input-wrap"
                ><input
                  ref="widthInput"
                  v-model="dimensions.widthMm"
                  type="number"
                  inputmode="decimal"
                  min="1"
                  max="8000"
                  step="any"
                  required
                  placeholder="Не указана"
                  aria-label="Ширина детали на фото, мм"
                  data-testid="element-width"
                /><span>мм</span></span
              ></label
            >
            <span class="element-dimensions__times" aria-hidden="true">×</span>
            <label
              ><span>Высота на фото</span
              ><span class="element-dimensions__input-wrap"
                ><input
                  ref="heightInput"
                  v-model="dimensions.heightMm"
                  type="number"
                  inputmode="decimal"
                  min="1"
                  max="8000"
                  step="any"
                  required
                  placeholder="Не указана"
                  aria-label="Высота детали на фото, мм"
                  data-testid="element-height"
                /><span>мм</span></span
              ></label
            >
          </div>
          <p class="element-dimensions__range">От 1 до 8 000 мм. Ориентация соответствует фото.</p>
        </div>
        <p v-if="error" class="element-dimensions__error" role="alert">{{ error }}</p>
        <footer class="element-dimensions__footer">
          <button type="button" class="element-dimensions__cancel" @click="emit('close')">Отмена</button
          ><button
            type="submit"
            class="element-dimensions__confirm"
            data-testid="element-dimensions-confirm"
            :disabled="!validDimensions"
          >
            {{ editing ? 'Сохранить размеры' : 'Добавить с этими размерами' }}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
              <path :d="editing ? 'm5 12 4 4L19 6' : 'M12 5v14M5 12h14'" />
            </svg>
          </button>
        </footer>
      </form>
    </dialog>
  </Teleport>
</template>

<style scoped>
.element-dimensions {
  width: min(590px, calc(100vw - 32px));
  max-width: none;
  max-height: 92dvh;
  margin: auto;
  padding: 0;
  overflow: hidden;
  color: #eee3cf;
  background: #1a160f;
  border: 1px solid #5a472d;
  border-radius: 11px;
  box-shadow: 0 28px 100px #0009;
  font-family: 'Manrope', sans-serif;
}
.element-dimensions::backdrop {
  background: #080705b8;
  backdrop-filter: blur(4px);
}
.element-dimensions__form {
  display: flex;
  flex-direction: column;
  max-height: calc(92dvh - 2px);
}
.element-dimensions__header {
  position: relative;
  flex: none;
  padding: 25px 27px 18px;
  border-bottom: 1px solid #3f3323;
}
.element-dimensions__eyebrow {
  display: block;
  padding-right: 25px;
  color: #bc9a68;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.element-dimensions__close {
  position: absolute;
  top: 17px;
  right: 17px;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  color: #c3b094;
  border: 1px solid #57432c;
  border-radius: 50%;
  cursor: pointer;
}
.element-dimensions__close:hover {
  background: #ffffff0b;
  color: #f7e7c9;
}
.element-dimensions__close svg {
  width: 17px;
  height: 17px;
}
.element-dimensions h2 {
  margin: 11px 0 8px;
  font:
    31px/1.15 Georgia,
    serif;
  letter-spacing: -0.025em;
}
.element-dimensions__header p {
  margin: 0;
  color: #e6cfaa;
  font-size: 12px;
  line-height: 1.6;
}
.element-dimensions__header p span {
  color: #a99577;
  font-size: 10px;
}
.element-dimensions__content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 21px 27px 17px;
  scrollbar-width: thin;
  scrollbar-color: #665035 #1a160f;
}
.element-dimensions__preview {
  position: relative;
  height: 205px;
  padding: 19px 25px 35px 42px;
  border: 1px solid #6c6146;
  border-radius: 6px;
  background: #f0eddf;
  overflow: hidden;
  isolation: isolate;
}
.element-dimensions__photo {
  display: block;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  mix-blend-mode: multiply;
}
.element-dimensions__horizontal {
  position: absolute;
  bottom: 9px;
  right: 15px;
  left: 33px;
  color: #76745e;
  font-size: 10px;
  text-align: center;
}
.element-dimensions__horizontal span {
  display: inline-block;
  margin-right: 4px;
  font-size: 16px;
  line-height: 10px;
}
.element-dimensions__vertical {
  position: absolute;
  top: 50%;
  left: 15px;
  color: #76745e;
  font-size: 9px;
  white-space: nowrap;
  transform: translate(-50%, -50%) rotate(-90deg);
}
.element-dimensions__source-note {
  margin: 15px 0 0;
  padding: 10px 12px;
  color: #e0bb86;
  background: #6e50231c;
  border-left: 2px solid #9e7640;
  font-size: 11px;
  line-height: 1.7;
}
.element-dimensions__pair-note {
  margin: 12px 0 0;
  color: #cdb58c;
  font-size: 10px;
  line-height: 1.7;
}
.element-dimensions__pair-note strong {
  display: block;
  font-weight: 600;
}
.element-dimensions__instruction {
  margin: 15px 0 0;
  color: #bdac90;
  font-size: 11px;
  line-height: 1.7;
}
.element-dimensions__inputs {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 18px minmax(0, 1fr);
  align-items: end;
  gap: 8px;
  margin-top: 16px;
}
.element-dimensions__inputs > label {
  display: grid;
  gap: 7px;
  min-width: 0;
}
.element-dimensions__inputs label > span:first-child {
  color: #d6c4a5;
  font-size: 10px;
}
.element-dimensions__input-wrap {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 11px;
  background: #0f0e0b;
  border: 1px solid #685232;
  border-radius: 5px;
}
.element-dimensions__input-wrap:focus-within {
  border-color: #d5b077;
  box-shadow: 0 0 0 2px #d5b07720;
}
.element-dimensions__input-wrap input {
  width: 100%;
  min-width: 0;
  height: 43px;
  background: transparent;
  color: #f5e7cd;
  border: 0;
  outline: none;
  font-size: 16px;
}
.element-dimensions__input-wrap input::placeholder {
  color: #7f735f;
  font-size: 11px;
}
.element-dimensions__input-wrap > span {
  color: #a58e69;
  font-size: 10px;
}
.element-dimensions__times {
  display: block;
  padding-bottom: 13px;
  text-align: center;
  color: #99815e;
  font-size: 16px;
}
.element-dimensions__range {
  margin: 9px 0 0;
  color: #9d8b6e;
  font-size: 9px;
  line-height: 1.6;
}
.element-dimensions__error {
  flex: none;
  margin: 0;
  padding: 12px 27px;
  color: #ffd0b7;
  background: #4b281d;
  border-top: 1px solid #a66b50;
  font-size: 14px;
  line-height: 1.6;
}
.element-dimensions__footer {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 13px;
  padding: 17px 27px;
  background: #231c12;
  border-top: 1px solid #4f3d26;
}
.element-dimensions__cancel {
  min-height: 43px;
  padding: 9px 3px;
  color: #bba588;
  font-size: 11px;
  cursor: pointer;
}
.element-dimensions__confirm {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 43px;
  padding: 11px 15px;
  color: #312412;
  background: #d3b477;
  border: 1px solid #dcc08a;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}
.element-dimensions__confirm svg {
  width: 16px;
  height: 16px;
  flex: none;
}
.element-dimensions__confirm:hover:not(:disabled) {
  background: #e3c58e;
}
.element-dimensions__confirm:disabled {
  color: #ad9977;
  background: #4c3c26;
  border-color: #6b5333;
  cursor: not-allowed;
}
.element-dimensions button:focus-visible {
  outline: 2px solid #e6c18a;
  outline-offset: 3px;
}
@media (max-width: 600px) {
  .element-dimensions {
    width: calc(100vw - 20px);
    max-height: 94dvh;
    border-radius: 9px;
  }
  .element-dimensions__form {
    max-height: calc(94dvh - 2px);
  }
  .element-dimensions__header {
    padding: 23px 18px 15px;
  }
  .element-dimensions h2 {
    font-size: 28px;
  }
  .element-dimensions__header p {
    font-size: 11px;
  }
  .element-dimensions__content {
    padding: 16px 18px;
  }
  .element-dimensions__preview {
    height: 180px;
  }
  .element-dimensions__source-note {
    font-size: 10px;
  }
  .element-dimensions__instruction {
    font-size: 10px;
  }
  .element-dimensions__inputs {
    gap: 4px;
    grid-template-columns: minmax(0, 1fr) 14px minmax(0, 1fr);
  }
  .element-dimensions__input-wrap {
    padding: 0 8px;
    gap: 3px;
  }
  .element-dimensions__inputs label > span:first-child {
    font-size: 9px;
  }
  .element-dimensions__footer {
    gap: 8px;
    padding: 14px 18px;
  }
  .element-dimensions__confirm {
    padding: 11px;
    font-size: 10px;
    gap: 6px;
  }
  .element-dimensions__cancel {
    font-size: 10px;
  }
}
</style>
