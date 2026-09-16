<script setup>
import { nextTick, onMounted, onScopeDispose, ref, useId, watch } from 'vue'
import ConstructorPreview from './ConstructorPreview.vue'
import { MAX_DRAFTS, readDrafts, removeDraft, saveDraft } from '../../constructor/drafts.js'
import { lockScroll, unlockScroll } from '../../composables/useScrollLock.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  project: { type: Object, required: true },
  products: { type: Array, required: true },
})
const emit = defineEmits(['load', 'close'])
const dialog = ref(null)
const heading = ref(null)
const titleId = `drafts-${useId().replace(/:/g, '')}`
const entries = ref([])
const name = ref('')
const error = ref('')
const status = ref('')
const deleteId = ref(null)
let previousFocus = null
let scrollLocked = false
function refresh() {
  try {
    entries.value = readDrafts(props.products)
  } catch (failure) {
    error.value = failure.message
  }
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
  if (!dialog.value) return
  if (props.open && !dialog.value.open) {
    error.value = ''
    status.value = ''
    deleteId.value = null
    refresh()
    name.value = `Вариант ${entries.value.length + 1}`
    previousFocus = document.activeElement
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
  if (!dialog.value?.open) {
    releaseDialog()
    if (props.open) emit('close')
  }
}
function save() {
  error.value = ''
  status.value = ''
  try {
    const entry = saveDraft(props.project, props.products, { name: name.value })
    refresh()
    status.value = `«${entry.name}» сохранён на этом устройстве.`
    name.value = `Вариант ${entries.value.length + 1}`
  } catch (failure) {
    error.value = failure.message
  }
}
function remove(id) {
  error.value = ''
  status.value = ''
  try {
    entries.value = removeDraft(id, props.products)
    deleteId.value = null
    status.value = 'Вариант удалён. Текущий рисунок сохранён.'
  } catch (failure) {
    error.value = failure.message
  }
}
function load(entry) {
  emit('load', JSON.parse(JSON.stringify(entry.project)))
  emit('close')
}
function date(value) {
  return new Date(value).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
watch(() => props.open, syncDialog, { flush: 'post' })
onMounted(syncDialog)
onScopeDispose(() => {
  if (dialog.value?.open) dialog.value.close()
  releaseDialog()
})
</script>

<template>
  <Teleport to="body"
    ><dialog
      ref="dialog"
      class="drafts-sheet"
      :aria-labelledby="titleId"
      @cancel.prevent="emit('close')"
      @close="closed"
    >
      <header>
        <div>
          <span class="drafts-eyebrow">На этом устройстве</span>
          <h2 :id="titleId" ref="heading" tabindex="-1">Мои варианты</h2>
        </div>
        <button type="button" class="drafts-close" aria-label="Закрыть мои варианты" @click="emit('close')">×</button>
      </header>
      <div class="drafts-body">
        <form class="draft-save" @submit.prevent="save">
          <label for="constructor-draft-name">Сохранить текущий рисунок</label>
          <div>
            <input
              id="constructor-draft-name"
              v-model="name"
              maxlength="80"
              required
              placeholder="Название варианта"
            /><button type="submit">Сохранить вариант</button>
          </div>
        </form>
        <p class="drafts-note">
          {{ entries.length }} из {{ MAX_DRAFTS }} вариантов. Открытие заменит текущий рисунок; действие можно отменить.
        </p>
        <p v-if="error" class="drafts-error" role="alert">{{ error }}</p>
        <p v-if="status" class="drafts-status" role="status">{{ status }}</p>
        <p v-if="!entries.length && !error" class="drafts-empty">
          Сохраните первый вариант, чтобы сравнивать рисунки и возвращаться к ним позже.
        </p>
        <div class="draft-grid">
          <article v-for="entry in entries" :key="entry.id" class="draft-card">
            <button type="button" class="draft-open" :aria-label="`Открыть ${entry.name}`" @click="load(entry)">
              <ConstructorPreview :project="entry.project" :products="products" :items="entry.project.items" /><span
                class="draft-title"
                >{{ entry.name }}</span
              ><span class="draft-meta"
                >{{ entry.project.width }} × {{ entry.project.height }} мм<span v-if="entry.project.type === 'fence'">
                  · {{ entry.project.sections }} секц.</span
                >
                · {{ entry.project.items.length }} шт.</span
              ><span class="draft-meta">{{ date(entry.updatedAt) }}</span>
            </button>
            <div class="draft-actions">
              <template v-if="deleteId === entry.id"
                ><span>Удалить вариант?</span><button type="button" @click="remove(entry.id)">Да, удалить</button
                ><button type="button" @click="deleteId = null">Оставить</button></template
              ><template v-else
                ><button type="button" @click="load(entry)">Открыть</button
                ><button type="button" :aria-label="`Удалить ${entry.name}`" @click="deleteId = entry.id">
                  Удалить
                </button></template
              >
            </div>
          </article>
        </div>
        <p class="drafts-note">
          Варианты хранятся в этом браузере. Для переноса на другой телефон или компьютер скачайте файл проекта.
        </p>
      </div>
    </dialog></Teleport
  >
</template>

<style scoped>
.drafts-sheet {
  width: min(880px, calc(100vw - 28px));
  max-width: none;
  max-height: 92dvh;
  margin: auto;
  padding: 0;
  overflow: hidden;
  color: #eadfca;
  background: #1c1812;
  border: 1px solid #6b5536;
  border-radius: 12px;
  font-family: 'Manrope', sans-serif;
  font-size: 14px;
}
.drafts-sheet[open] {
  display: flex;
  flex-direction: column;
}
.drafts-sheet::backdrop {
  background: #080705bc;
  backdrop-filter: blur(4px);
}
.drafts-sheet header {
  display: flex;
  flex: none;
  justify-content: space-between;
  gap: 16px;
  padding: 23px 26px 18px;
  border-bottom: 1px solid #4e3f2a;
}
.drafts-eyebrow {
  color: #c9a873;
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.drafts-sheet h2 {
  margin: 9px 0 0;
  font:
    30px/1.2 Georgia,
    serif;
  outline: none;
}
.drafts-close {
  width: 44px;
  height: 44px;
  flex: none;
  color: #dfc9a9;
  background: #ffffff05;
  border: 1px solid #665032;
  border-radius: 50%;
  font-size: 26px;
  cursor: pointer;
}
.drafts-body {
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 22px 26px;
}
.draft-save label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
}
.draft-save > div {
  display: flex;
  gap: 8px;
}
.draft-save input {
  flex: 1;
  min-width: 0;
  min-height: 44px;
  padding: 11px 12px;
  color: #eee0c6;
  background: #14110d;
  border: 1px solid #6e5531;
  border-radius: 5px;
  font:
    16px 'Manrope',
    sans-serif;
}
.draft-save button {
  min-height: 44px;
  padding: 11px 15px;
  color: #302312;
  background: #d8b679;
  border: 0;
  border-radius: 5px;
  font:
    700 14px 'Manrope',
    sans-serif;
  cursor: pointer;
}
.drafts-note {
  color: #afa087;
  font-size: 12px;
  line-height: 1.7;
  margin: 13px 0;
}
.drafts-error {
  color: #ffc9ad;
  font-size: 14px;
  line-height: 1.6;
}
.drafts-status {
  color: #c6dfb1;
  font-size: 14px;
}
.drafts-empty {
  padding: 30px 10px;
  color: #c3b296;
  text-align: center;
  font-size: 14px;
  line-height: 1.8;
}
.draft-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
}
.draft-card {
  overflow: hidden;
  background: #241e15;
  border: 1px solid #584329;
  border-radius: 7px;
}
.draft-open {
  display: block;
  width: 100%;
  padding: 0;
  color: inherit;
  background: transparent;
  border: 0;
  text-align: left;
  cursor: pointer;
}
.draft-title {
  display: block;
  margin: 12px 14px 7px;
  font:
    20px/1.25 Georgia,
    serif;
  overflow-wrap: anywhere;
}
.draft-meta {
  display: block;
  margin: 4px 14px;
  color: #b9a582;
  font-size: 12px;
}
.draft-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  padding: 10px 14px 13px;
}
.draft-actions span {
  font-size: 14px;
}
.draft-actions button {
  min-height: 44px;
  padding: 5px 7px;
  color: #d7b57e;
  background: transparent;
  border: 1px solid #6c5230;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}
.drafts-sheet button:focus-visible,
.drafts-sheet input:focus-visible {
  outline: 2px solid #ebca8d;
  outline-offset: 3px;
}
@media (max-width: 600px) {
  .drafts-sheet {
    max-height: 95dvh;
  }
  .drafts-sheet header,
  .drafts-body {
    padding: 18px 16px;
  }
  .drafts-sheet h2 {
    font-size: 27px;
  }
  .draft-save > div {
    flex-direction: column;
  }
  .draft-save input,
  .draft-save button {
    min-height: 44px;
  }
  .draft-grid {
    grid-template-columns: 1fr;
  }
}
</style>
