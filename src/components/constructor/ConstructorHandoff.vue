<script setup>
import { computed, nextTick, onMounted, onScopeDispose, ref, useId, watch } from 'vue'
import ConstructorPreview from './ConstructorPreview.vue'
import { lockScroll, unlockScroll } from '../../composables/useScrollLock.js'
import { buildWhatsAppLink } from '../../composables/messengerConfig.js'
import {
  buildHandoffText,
  discussionProducts,
  downloadFile,
  exportDrawingPng,
  printProjectReport,
} from '../../constructor/export.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  project: { type: Object, required: true },
  products: { type: Array, required: true },
  bill: { type: Array, default: () => [] },
  warnings: { type: Array, default: () => [] },
  getSvg: { type: Function, required: true },
})
const emit = defineEmits(['close', 'update-comment', 'remove-discussion', 'manual-dimensions', 'export-project'])
const dialog = ref(null)
const heading = ref(null)
const titleId = `handoff-${useId().replace(/:/g, '')}`
const busy = ref(false)
const error = ref('')
const status = ref('')
let previousFocus = null
let scrollLocked = false
const discussion = computed(() => discussionProducts(props.project, props.products))
const frameName = computed(
  () => ({ gates: 'Двустворчатые ворота', wicket: 'Калитка', fence: 'Секция забора' })[props.project.type]
)
const quantity = computed(() => props.bill.reduce((sum, row) => sum + row.quantity, 0))
const pairOrders = computed(() => props.bill.filter((row) => row.saleUnit === 'pair' && row.orderQuantity !== null))
const message = computed(() => {
  const full = buildHandoffText(props.project, props.products)
  if (full.length <= 5500) return `${full}\n\nХочу обсудить эту подборку. Эскиз прикреплю отдельным файлом.`
  return `Здравствуйте! Хочу обсудить подборку ковки.\n${frameName.value}: ${props.project.width} × ${props.project.height} мм${props.project.type === 'fence' ? `, секций ${props.project.sections}` : ''}.\nВ подборке ${quantity.value} деталей, ${props.bill.length} позиций.\n${discussion.value.length ? `Дополнительно уточнить артикулы: ${discussion.value.map((product) => product.id).join(', ')}.\n` : ''}${props.project.comment ? `Комментарий: ${props.project.comment}\n` : ''}Полный список и эскиз приложу отдельными файлами.`
})
const whatsappLink = computed(() => buildWhatsAppLink(message.value))

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
  if (!dialog.value) return
  if (props.open && !dialog.value.open) {
    previousFocus = document.activeElement
    error.value = ''
    status.value = ''
    dialog.value.showModal()
    lockScroll()
    scrollLocked = true
    heading.value?.focus({ preventScroll: true })
  } else if (!props.open && dialog.value.open) {
    dialog.value.close()
    releaseDialog()
  }
}
function closed() {
  if (dialog.value?.open) return
  releaseDialog()
  if (props.open) emit('close')
}
async function run(action, success) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  status.value = ''
  try {
    await action()
    status.value = success
  } catch (failure) {
    error.value = failure.message || 'Не удалось сохранить подборку. Попробуйте ещё раз.'
  } finally {
    busy.value = false
  }
}
function png() {
  return run(() => exportDrawingPng(props.getSvg()), 'PNG сохранён. Его можно прикрепить к сообщению.')
}
function print() {
  return run(
    () => printProjectReport(props.getSvg(), props.project, props.products),
    'В окне печати можно выбрать «Сохранить как PDF».'
  )
}
function text() {
  return run(
    () => downloadFile(buildHandoffText(props.project, props.products), 'etalon-podborka.txt'),
    'Список деталей сохранён.'
  )
}
watch(() => props.open, syncDialog, { flush: 'post' })
onMounted(syncDialog)
onScopeDispose(() => {
  if (dialog.value?.open) dialog.value.close()
  releaseDialog()
})
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="handoff-sheet"
      :aria-labelledby="titleId"
      @cancel.prevent="emit('close')"
      @close="closed"
    >
      <header class="handoff-header">
        <div>
          <span class="sheet-eyebrow">Подборка для обсуждения</span>
          <h2 :id="titleId" ref="heading" tabindex="-1">Ваш рисунок готов</h2>
        </div>
        <button type="button" class="sheet-close" aria-label="Закрыть подборку" @click="emit('close')">×</button>
      </header>
      <div class="handoff-body">
        <ConstructorPreview class="handoff-preview" :project="project" :products="products" :items="project.items" />
        <p class="handoff-dimensions">
          <strong>{{ frameName }}</strong> · {{ project.width }} × {{ project.height }} мм<span
            v-if="project.type === 'fence'"
          >
            · {{ project.sections }} секц.</span
          >
        </p>
        <p class="sheet-muted">
          Эскиз для подбора. Каркас и монтаж в комплектацию не входят; возможность изготовления проверит мастер.
        </p>

        <section aria-label="Комплектация">
          <h3>На эскизе — {{ quantity }} шт.<span v-if="project.type === 'fence'"> на все секции</span></h3>
          <p v-if="!bill.length" class="sheet-muted">
            На эскизе пока нет деталей. Ниже можно сохранить выбранное для обсуждения.
          </p>
          <ul v-else class="handoff-parts">
            <li v-for="row in bill" :key="row.key">
              <div>
                <strong>{{ row.product.shortName || row.product.name }}</strong
                ><span>Арт. {{ row.product.id }} · {{ row.product.widthMm }} × {{ row.product.heightMm }} мм</span
                ><small v-if="row.product.requiresDimensions">Размер одной детали указан вручную</small>
              </div>
              <b>{{ row.quantity }} шт.</b>
            </li>
          </ul>
          <div v-if="pairOrders.length" class="handoff-pairs">
            <h4>Товары, которые продаются парами</h4>
            <p v-for="row in pairOrders" :key="row.product.id">
              Арт. {{ row.product.id }} — {{ row.orderQuantity }} пар. ({{ row.skuQuantity }} шт. в подборе<span
                v-if="row.spareQuantity"
                >; запас {{ row.spareQuantity }} шт.</span
              >)
            </p>
          </div>
        </section>

        <section v-if="discussion.length" class="handoff-discussion">
          <h3>Обсудить с мастером</h3>
          <p class="sheet-muted">
            Эти детали пока без подтверждённых размеров. Они не размещены на эскизе и не включены в количество выше.
          </p>
          <ul class="handoff-parts">
            <li v-for="product in discussion" :key="product.id">
              <div>
                <strong>{{ product.shortName || product.name }}</strong
                ><span>Арт. {{ product.id }} · {{ product.material }}</span>
                <div class="discussion-actions">
                  <button type="button" @click="emit('manual-dimensions', product)">Указать размеры</button
                  ><button
                    type="button"
                    :aria-label="`Убрать из обсуждения ${product.shortName || product.name}`"
                    @click="emit('remove-discussion', product.id)"
                  >
                    Убрать
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </section>

        <section v-if="warnings.length" class="handoff-warnings">
          <h3>Проверьте перед изготовлением</h3>
          <ul>
            <li v-for="warning in warnings" :key="warning.id">{{ warning.message }}</li>
          </ul>
        </section>
        <label class="handoff-comment"
          ><span>Комментарий мастеру</span
          ><textarea
            :value="project.comment || ''"
            maxlength="2000"
            rows="3"
            placeholder="Например: подобрать похожий узор для калитки"
            @change="emit('update-comment', $event.target.value)"
          ></textarea
          ><small>До 2000 символов. Комментарий сохранится вместе с проектом.</small></label
        >
        <p v-if="error" class="sheet-error" role="alert">{{ error }}</p>
        <p v-if="status" class="sheet-status" role="status">{{ status }}</p>
      </div>
      <footer class="handoff-footer">
        <div class="handoff-downloads">
          <button type="button" :disabled="busy" @click="png">Скачать PNG</button
          ><button type="button" :disabled="busy" @click="print">Печать / PDF</button
          ><button type="button" :disabled="busy" @click="text">Список деталей</button
          ><button type="button" :disabled="busy" @click="emit('export-project')">
            Файл для продолжения редактирования
          </button>
        </div>
        <a :href="whatsappLink" class="handoff-whatsapp" target="_blank" rel="noopener noreferrer"
          >Обсудить в WhatsApp</a
        >
        <p class="sheet-muted">Откроется сообщение для проверки. PNG или PDF прикрепите вручную.</p>
      </footer>
    </dialog>
  </Teleport>
</template>

<style scoped>
.handoff-sheet {
  width: min(780px, calc(100vw - 28px));
  max-width: none;
  max-height: 92dvh;
  margin: auto;
  padding: 0;
  overflow: hidden;
  color: #e9e0cf;
  background: #1e1a14;
  border: 1px solid #695536;
  border-radius: 12px;
  font-family: 'Manrope', sans-serif;
  font-size: 14px;
}
.handoff-sheet[open] {
  display: flex;
  flex-direction: column;
}
.handoff-sheet::backdrop {
  background: #080706bc;
  backdrop-filter: blur(4px);
}
.handoff-header {
  display: flex;
  flex: none;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 26px 18px;
  border-bottom: 1px solid #493d2a;
}
.sheet-eyebrow {
  color: #c6a975;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.handoff-header h2 {
  margin: 9px 0 0;
  font:
    30px/1.15 Georgia,
    serif;
  outline: none;
}
.sheet-close {
  width: 44px;
  height: 44px;
  flex: none;
  color: #decbb0;
  background: #ffffff07;
  border: 1px solid #635033;
  border-radius: 50%;
  font-size: 26px;
  cursor: pointer;
}
.handoff-body {
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 22px 26px;
}
.handoff-preview {
  height: 250px;
  border-radius: 6px;
}
.handoff-dimensions {
  margin: 14px 0 8px;
  font-size: 14px;
}
.sheet-muted {
  color: #b4a68f;
  font-size: 12px;
  line-height: 1.7;
}
.handoff-body section {
  margin-top: 24px;
}
.handoff-body h3 {
  font-size: 15px;
  margin: 0 0 10px;
}
.handoff-parts {
  list-style: none;
  padding: 0;
  margin: 0;
}
.handoff-parts li {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 11px 0;
  border-bottom: 1px solid #403526;
  font-size: 14px;
}
.handoff-parts li > div {
  min-width: 0;
}
.handoff-parts strong {
  display: block;
}
.handoff-parts span,
.handoff-parts small {
  display: block;
  margin-top: 4px;
  color: #baa98c;
  font-size: 12px;
}
.handoff-parts b {
  white-space: nowrap;
}
.handoff-pairs {
  margin-top: 12px;
  padding: 12px;
  background: #ffffff04;
  border-radius: 5px;
}
.handoff-pairs h4 {
  margin: 0;
  font-size: 14px;
}
.handoff-pairs p {
  margin: 7px 0 0;
  font-size: 14px;
}
.discussion-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 9px;
}
.discussion-actions button {
  min-height: 44px;
  padding: 5px 8px;
  color: #e6c48b;
  background: #282015;
  border: 1px solid #6d5532;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}
.handoff-warnings {
  padding: 14px;
  border: 1px solid #887041;
  background: #b28c2720;
  border-radius: 6px;
}
.handoff-warnings ul {
  padding-left: 18px;
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
}
.handoff-comment {
  display: grid;
  gap: 8px;
  margin-top: 22px;
  font-size: 14px;
}
.handoff-comment textarea {
  box-sizing: border-box;
  width: 100%;
  resize: vertical;
  min-height: 88px;
  padding: 12px;
  color: #eee2cc;
  background: #15120e;
  border: 1px solid #685336;
  border-radius: 5px;
  font:
    16px/1.6 'Manrope',
    sans-serif;
}
.handoff-comment small {
  color: #a8987e;
  font-size: 12px;
}
.handoff-footer {
  flex: none;
  padding: 17px 26px;
  border-top: 1px solid #57462f;
  background: #251e14;
}
.handoff-downloads {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.handoff-downloads button {
  min-height: 44px;
  padding: 9px 12px;
  color: #e0c89f;
  background: #211a12;
  border: 1px solid #7a5c34;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}
.handoff-downloads button:disabled {
  opacity: 0.55;
  cursor: wait;
}
.handoff-whatsapp {
  display: block;
  min-height: 44px;
  margin-top: 12px;
  padding: 12px 15px;
  text-align: center;
  color: #2c2315;
  background: #d8b778;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}
.handoff-footer .sheet-muted {
  margin: 8px 0 0;
}
.sheet-error {
  color: #ffc5ac;
  font-size: 14px;
  line-height: 1.6;
}
.sheet-status {
  color: #cae6b2;
  font-size: 14px;
}
.handoff-sheet button:focus-visible,
.handoff-sheet a:focus-visible,
.handoff-sheet textarea:focus-visible {
  outline: 2px solid #ebca8f;
  outline-offset: 3px;
}
@media (max-width: 600px) {
  .handoff-header {
    padding: 19px 16px 14px;
  }
  .handoff-header h2 {
    font-size: 26px;
  }
  .handoff-body {
    padding: 16px;
  }
  .handoff-preview {
    height: 180px;
  }
  .handoff-footer {
    padding: 14px 16px;
  }
  .handoff-downloads {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .handoff-downloads button {
    min-height: 44px;
  }
  .handoff-sheet {
    max-height: 95dvh;
  }
}
</style>
