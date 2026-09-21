<script setup>
import { computed, nextTick, onMounted, onScopeDispose, reactive, ref, watch } from 'vue'
import ConstructorCanvas from '../components/constructor/ConstructorCanvas.vue'
import ConstructorCatalog from '../components/constructor/ConstructorCatalog.vue'
import ConstructorSelection from '../components/constructor/ConstructorSelection.vue'
import ConstructorIcon from '../components/constructor/ConstructorIcon.vue'
import ConstructorTemplates from '../components/constructor/ConstructorTemplates.vue'
import ConstructorDimensions from '../components/constructor/ConstructorDimensions.vue'
import ConstructorArrangement from '../components/constructor/ConstructorArrangement.vue'
import ConstructorChangePreview from '../components/constructor/ConstructorChangePreview.vue'
import ConstructorHandoff from '../components/constructor/ConstructorHandoff.vue'
import ConstructorDrafts from '../components/constructor/ConstructorDrafts.vue'
import { constructorProducts, constructorGroups } from '../constructor/catalog.js'
import {
  createProject,
  getProjectWarnings,
  mirrorItem,
  normalizeProject,
  PROJECT_LIMITS,
} from '../constructor/model.js'
import { buildPreset } from '../constructor/presets.js'
import { proposeCornerSet } from '../constructor/corners.js'
import { saveDraft } from '../constructor/drafts.js'
import { downloadFile } from '../constructor/export.js'
import { useConstructor, CONSTRUCTOR_STORAGE_KEY } from '../composables/useConstructor.js'
import { useConstructorTemplates } from '../composables/useConstructorTemplates.js'
import { trackGoal } from '../composables/useAnalytics.js'
import { useSeo } from '../composables/useSeo.js'
import { useToast } from '../composables/useToast.js'
import '../assets/constructor.css'
import '../assets/constructor-client.css'

useSeo('Конструктор ковки', 'Соберите эскиз ворот, калитки или забора из кованых элементов и подготовьте подборку для мастера.')
const toast = useToast()
const {
  project,
  editorRevision,
  selectedId,
  selectedIds,
  selectedItems,
  selectedItem,
  selectedProduct,
  bill,
  totalQuantity,
  warnings,
  storageStatus,
  notice,
  canUndo,
  canRedo,
  undo,
  redo,
  addProduct,
  updateSelected,
  moveItem,
  rotateItem,
  removeSelected,
  duplicateSelected,
  mirrorSelected,
  applyPreset,
  loadProject,
  selectItem,
  groupSelected,
  ungroupSelected,
  lockSelected,
  transformSelected,
  applyArrangement,
  addDiscussion,
  removeDiscussion,
  updateComment,
} = useConstructor()
const { activeTemplate, templateCount } = useConstructorTemplates(project, constructorProducts, editorRevision)
const templatesOpen = ref(false)
const draftsOpen = ref(false)
const handoffOpen = ref(false)
const arrangementOptions = ref(null)
const pendingChange = ref(null)
const dimensionProduct = ref(null)
const dimensionTargetId = ref(null)
const elementAddError = ref('')
const mirrorScope = ref('panel')
const multiSelect = ref(false)
const showGrid = ref(true)
const snapToGrid = ref(false)
const zoom = ref(1)
const drawing = ref(null)
const fileInput = ref(null)
const setupElement = ref(null)
const isMobile = ref(false)
const focusedEditor = ref(false)
const mobilePanel = ref(null)
let panelPreviousFocus = null
watch(mobilePanel, async (panel, previous) => {
  if (!isMobile.value) return
  if (panel && !previous) panelPreviousFocus = document.activeElement
  await nextTick()
  if (panel) document.querySelector('.client-sheet .client-sheet-heading button')?.focus({ preventScroll: true })
  else if (panelPreviousFocus?.isConnected) panelPreviousFocus.focus({ preventScroll: true })
})
const hasSaved = ref(false)
const alignmentInset = ref(project.value.cornerInsetMm ?? project.value.alignmentInsetMm ?? 20)
watch(
  () => [project.value.cornerInsetMm, project.value.alignmentInsetMm],
  ([current, legacy]) => {
    alignmentInset.value = current ?? legacy ?? 20
  }
)
const dimensions = reactive({
  width: project.value.width,
  height: project.value.height,
  sections: project.value.sections,
})
watch(
  () => [project.value.width, project.value.height, project.value.sections],
  ([width, height, sections]) => Object.assign(dimensions, { width, height, sections })
)
const dimensionsChanged = computed(() =>
  ['width', 'height', 'sections'].some((key) => dimensions[key] !== project.value[key])
)
const typeTitle = computed(() => ({ gates: 'Ворота', wicket: 'Калитка', fence: 'Секция забора' })[project.value.type])
const types = [
  { id: 'gates', name: 'Ворота' },
  { id: 'wicket', name: 'Калитка' },
  { id: 'fence', name: 'Забор' },
]
const selectionForPanel = computed(() =>
  selectedItem.value ? [selectedItem.value, ...selectedItems.value.filter((item) => item.id !== selectedId.value)] : []
)
const anyModal = computed(
  () =>
    templatesOpen.value ||
    draftsOpen.value ||
    handoffOpen.value ||
    arrangementOptions.value ||
    pendingChange.value ||
    dimensionProduct.value
)
let media
function resize() {
  isMobile.value = media.matches
  if (!media.matches) {
    focusedEditor.value = false
    mobilePanel.value = null
  }
}
onMounted(() => {
  media = window.matchMedia('(max-width: 900px)')
  resize()
  media.addEventListener('change', resize)
  trackGoal('constructor_open', { construction: project.value.type })
  try {
    hasSaved.value = Boolean(localStorage.getItem(CONSTRUCTOR_STORAGE_KEY))
  } catch {
    /* storage status is handled by the editor */
  }
})
onScopeDispose(() => media?.removeEventListener('change', resize))
function attempt(action) {
  try {
    return action()
  } catch (error) {
    toast.error(error.message || 'Не удалось выполнить действие.')
    return undefined
  }
}
function fitView() {
  zoom.value = 1
  drawing.value?.fitView()
}
async function enterEditor() {
  focusedEditor.value = isMobile.value
  await nextTick()
  drawing.value?.getSvgElement()?.scrollIntoView({ block: 'center', behavior: 'instant' })
  fitView()
}
function exitEditor() {
  focusedEditor.value = false
  mobilePanel.value = null
}
function openPanel(panel) {
  mobilePanel.value = mobilePanel.value === panel ? null : panel
  if (isMobile.value) focusedEditor.value = true
}
function openSetup() {
  exitEditor()
  nextTick(() => setupElement.value?.scrollIntoView({ block: 'start', behavior: 'smooth' }))
}
function setDimensions() {
  attempt(() => {
    const next = normalizeProject({ ...project.value, ...dimensions }, constructorProducts)
    if (activeTemplate.value) {
      const preset = buildPreset(next, constructorProducts, activeTemplate.value.id)
      if (preset.available) next.items = preset.items
    }
    pendingChange.value = {
      title: 'Новые размеры конструкции',
      description: 'Проверьте расположение. Размеры самих деталей сохраняются.',
      before: structuredClonePlain(project.value),
      next,
      warnings: getProjectWarnings(next, constructorProducts),
    }
  })
}
function structuredClonePlain(value) {
  return JSON.parse(JSON.stringify(value))
}
function changeType(type) {
  if (type === project.value.type) return
  attempt(() => {
    const next = createProject(type)
    const preset = activeTemplate.value ? buildPreset(next, constructorProducts, activeTemplate.value.id) : null
    if (preset?.available) next.items = preset.items
    next.discussionItems = [...(project.value.discussionItems || [])]
    next.comment = project.value.comment || ''
    pendingChange.value = {
      title: 'Перейти к ' + { gates: 'воротам', wicket: 'калитке', fence: 'забору' }[type],
      description: preset?.available
        ? 'Композиция перестроена под новую основу. Предыдущий рисунок можно вернуть отменой.'
        : 'Текущий вариант будет сохранён отдельно. Новая основа начнётся с пустой рамы: выберите подходящую композицию или соберите свою.',
      before: structuredClonePlain(project.value),
      next,
      backup: !activeTemplate.value && Boolean(project.value.items.length),
      warnings: [],
    }
  })
}
function confirmChange() {
  attempt(() => {
    const change = pendingChange.value
    if (change.canApply === false) throw new Error('Сначала устраните причину, указанную в предпросмотре.')
    if (change.backup) saveDraft(project.value, constructorProducts, { name: typeTitle.value + ' — до смены основы' })
    loadProject(change.next)
    pendingChange.value = null
    fitView()
    toast.success('Изменение применено. Его можно отменить.')
  })
}
function previewAllCorners({ scope }) {
  attempt(() => {
    if (dimensionsChanged.value) throw new Error('Сначала примените новые размеры конструкции.')
    if (selectedItems.value.length !== 1) throw new Error('Выберите один уголок для расстановки.')
    const result = proposeCornerSet(project.value, constructorProducts, {
      sourceId: selectedItem.value.id,
      scope,
      insetMm: alignmentInset.value,
    })
    const count = project.value.type === 'gates' && scope === 'all-panels' ? 8 : 4
    pendingChange.value = {
      title: 'Уголки во все углы',
      description: !result.canApply
        ? 'Расстановке мешают указанные ниже ограничения. Текущий рисунок сохранён.'
        : result.changed
          ? (count === 8 ? '8 уголков' : '4 уголка') +
            ' с отступом ' +
            alignmentInset.value +
            ' мм от внутренней рамы. Будет добавлено: ' +
            result.addedCount +
            '. Уже добавленные уголки будут использованы в расстановке, недостающие — добавлены зеркально.'
          : 'Все уголки уже на своих местах. Новые копии не нужны.',
      before: structuredClonePlain(project.value),
      next: { ...structuredClonePlain(project.value), items: result.items, cornerInsetMm: alignmentInset.value },
      canApply: result.canApply,
      applyLabel: result.canApply ? (result.changed ? 'Расставить уголки' : 'Готово') : 'Не удалось расставить',
      warnings: result.issues,
    }
  })
}
function previewMirror() {
  attempt(() => {
    const source = project.value.items.filter((item) => item.x < project.value.width / 2)
    const replaced = project.value.items.filter((item) => item.x > project.value.width / 2)
    if (!source.length) throw new Error('Сначала разместите детали слева.')
    if (replaced.some((item) => item.locked))
      throw new Error('Справа есть закреплённые детали. Снимите закрепление перед заменой.')
    const centers = project.value.items.filter((item) => item.x === project.value.width / 2)
    if (source.length * 2 + centers.length > PROJECT_LIMITS.maxItems)
      throw new Error(`После отражения получится больше ${PROJECT_LIMITS.maxItems} деталей.`)
    const groups = new Map()
    const copies = source.map((item) => {
      const next = mirrorItem(item, project.value.width)
      if (item.groupId) {
        if (!groups.has(item.groupId)) groups.set(item.groupId, next.id)
        next.groupId = groups.get(item.groupId)
      }
      return next
    })
    const next = { ...structuredClonePlain(project.value), items: [...source, ...centers, ...copies] }
    pendingChange.value = {
      title: 'Повторить левую сторону справа',
      description:
        'Деталей справа будет заменено: ' +
        replaced.length +
        '. Слева рисунок сохранится. Посмотрите результат перед применением.',
      before: structuredClonePlain(project.value),
      next,
      warnings: getProjectWarnings(next, constructorProducts),
    }
  })
}
function beginArrangement(options = { mode: 'auto' }) {
  attempt(() => {
    if (dimensionsChanged.value) throw new Error('Сначала примените новые размеры конструкции.')
    if (
      options.mode === 'corners' &&
      (!Number.isFinite(alignmentInset.value) || alignmentInset.value < 0 || alignmentInset.value > 1000)
    )
      throw new Error('Отступ уголков: укажите число от 0 до 1000 мм.')
    arrangementOptions.value = {
      ...options,
      ...(options.mode === 'center' || options.mode === 'distribute' ? { ids: [...selectedIds.value] } : {}),
      ...(options.mode === 'corners' ? { insetMm: alignmentInset.value } : {}),
    }
    mobilePanel.value = null
  })
}
function confirmArrangement(result) {
  attempt(() => {
    applyArrangement(result, arrangementOptions.value.mode === 'corners' ? alignmentInset.value : undefined)
    arrangementOptions.value = null
    toast.success(
      result.changed
        ? 'Расстановка применена. Можно отменить одним нажатием.'
        : 'Расположение уже соответствует настройкам.'
    )
  })
}
function applyTemplate(id) {
  attempt(() => {
    applyPreset(id)
    templatesOpen.value = false
    selectItem(null)
    fitView()
    trackGoal('constructor_template_apply', { template: id })
    toast.success('Композиция применена. Доступна отмена.')
  })
}
function openHandoff() {
  handoffOpen.value = true
  trackGoal('constructor_handoff_open', { items: project.value.items.length })
}
function addElement(product, itemDimensions) {
  const item = addProduct(product, itemDimensions)
  mobilePanel.value = null
  multiSelect.value = false
  if (isMobile.value) focusedEditor.value = true
  nextTick(() => {
    fitView()
    drawing.value?.getSvgElement()?.focus({ preventScroll: true })
  })
  return item
}
function attemptElement(action) {
  elementAddError.value = ''
  return attempt(() => {
    try {
      return action()
    } catch (error) {
      elementAddError.value = error.message || 'Не удалось добавить деталь.'
      throw error
    }
  })
}
function discussElement(product) {
  attempt(() => {
    addDiscussion(product)
    notice.value = 'Деталь ' + product.id + ' добавлена в подборку для обсуждения с мастером. Размеры уточним отдельно.'
  })
}
function manualDimensions(product) {
  elementAddError.value = ''
  handoffOpen.value = false
  dimensionTargetId.value = null
  dimensionProduct.value = product
}
function closeDimensions() {
  elementAddError.value = ''
  dimensionProduct.value = null
  dimensionTargetId.value = null
}
function confirmElementDimensions({ product, dimensions: itemDimensions }) {
  attemptElement(() => {
    if (dimensionTargetId.value) {
      selectItem(dimensionTargetId.value)
      updateSelected({ dimensions: itemDimensions })
    } else addElement(product, itemDimensions)
    closeDimensions()
  })
}
function onSelect(id, options) {
  selectItem(id, options)
}
function copyToCorner({ axis, scope }) {
  attempt(() => mirrorSelected(axis, scope))
}
function onAction(action) {
  attempt(() => {
    if (!selectedItem.value) return
    if (action === 'delete') removeSelected()
    if (action === 'copy') duplicateSelected()
    if (action === 'flip' || action === 'rotate') transformSelected(action)
    if (action === 'group') {
      groupSelected()
      multiSelect.value = false
    }
    if (action === 'ungroup') ungroupSelected()
    if (action === 'lock') lockSelected()
    if (action === 'dimensions') {
      elementAddError.value = ''
      dimensionTargetId.value = selectedItem.value.id
      dimensionProduct.value = selectedProduct.value
    }
  })
}
function onShortcut(event) {
  if (anyModal.value) return
  if (isMobile.value && mobilePanel.value) {
    if (event.key === 'Escape') {
      event.preventDefault()
      mobilePanel.value = null
      return
    }
    if (event.key === 'Tab') {
      const controls = [
        ...document.querySelectorAll(
          '.client-sheet button:not(:disabled), .client-sheet input, .client-sheet select, .client-sheet summary, .client-sheet [tabindex="0"]'
        ),
      ].filter((element) => element.tabIndex >= 0 && element.getClientRects().length)
      const first = controls[0],
        last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
  }
  if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault()
    if (event.shiftKey) redo()
    else undo()
  }
  if (event.key === 'Delete' || event.key === 'Backspace') {
    if (selectedItem.value) {
      event.preventDefault()
      onAction('delete')
    }
  }
  if (event.key === 'Escape') {
    selectItem(null)
    mobilePanel.value = null
  }
}
function getSvg() {
  return drawing.value?.getSvgElement()
}
function saveProject() {
  downloadFile(JSON.stringify(project.value, null, 2), 'etalon-project.json', 'application/json')
}
function loadDraft(value) {
  attempt(() => {
    loadProject(value)
    draftsOpen.value = false
    fitView()
    toast.success('Вариант открыт. Предыдущий рисунок доступен через отмену.')
  })
}
async function openProject(event) {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    if (file.size > 1_000_000) throw new Error('Файл должен быть меньше 1 МБ.')
    loadProject(JSON.parse(await file.text()))
    fitView()
    toast.success('Проект открыт')
  } catch (error) {
    toast.error(error instanceof SyntaxError ? 'Не удалось прочитать файл проекта.' : error.message)
  }
  event.target.value = ''
}
</script>

<template>
  <div :class="['constructor-page', 'constructor-client', { 'client-focused': focusedEditor }]" @keydown="onShortcut">
    <header class="constructor-intro">
      <div>
        <div class="constructor-breadcrumb">
          <router-link to="/catalog">Каталог</router-link><span>/</span><span>Конструктор</span>
        </div>
        <h1>Ваш рисунок. <em>Ваша ковка.</em></h1>
        <p>Соберите эскиз из наших деталей — обсудим размеры и изготовление вместе.</p>
      </div>
      <div class="constructor-intro-actions">
        <span class="save-status" role="status"><span></span>{{ storageStatus }}</span>
        <div class="client-button-row">
          <button v-if="hasSaved" type="button" class="constructor-button outline" @click="enterEditor">
            Продолжить эскиз</button
          ><button type="button" class="constructor-button outline" @click="draftsOpen = true">Мои варианты</button>
        </div>
      </div>
    </header>
    <nav class="client-steps" aria-label="Этапы подбора">
      <button type="button" @click="openSetup"><span>1</span>Основа</button
      ><button type="button" @click="templatesOpen = true"><span>2</span>Рисунок</button
      ><button type="button" @click="enterEditor"><span>3</span>Эскиз</button
      ><button type="button" @click="openHandoff"><span>4</span>Подборка</button>
    </nav>
    <form ref="setupElement" class="constructor-setup" @submit.prevent="setDimensions">
      <div class="construction-types" aria-label="Тип конструкции">
        <button
          v-for="type in types"
          :key="type.id"
          type="button"
          :class="{ active: project.type === type.id }"
          :aria-pressed="project.type === type.id"
          @click="changeType(type.id)"
        >
          <ConstructorIcon :name="type.id" /><span>{{ type.name }}</span>
        </button>
      </div>
      <label class="dimension-field"
        ><span>↔ {{ project.type === 'fence' ? 'Ширина секции' : 'Общая ширина' }}</span
        ><span class="dimension-control"
          ><input
            v-model.number="dimensions.width"
            type="number"
            min="500"
            max="8000"
            step="1"
            required
            aria-label="Ширина, мм"
          /><span>мм</span></span
        ></label
      >
      <label class="dimension-field"
        ><span>↕ Высота</span
        ><span class="dimension-control"
          ><input
            v-model.number="dimensions.height"
            type="number"
            min="500"
            max="4000"
            step="1"
            required
            aria-label="Высота, мм"
          /><span>мм</span></span
        ></label
      >
      <label v-if="project.type === 'fence'" class="dimension-field section-count"
        ><span>Секций</span
        ><span class="dimension-control"
          ><input
            v-model.number="dimensions.sections"
            type="number"
            min="1"
            max="50"
            step="1"
            required
            aria-label="Количество секций"
          /><span>шт.</span></span
        ></label
      >
      <button type="submit" class="apply-dimensions" :disabled="!dimensionsChanged">Применить</button
      ><span class="setup-note"
        >{{
          project.type === 'gates'
            ? 'Две равные створки'
            : project.type === 'fence'
              ? 'Эскиз одной секции'
              : 'Одна створка'
        }}<small>Детали показаны в своём размере</small></span
      >
    </form>
    <div v-if="notice" class="constructor-notice" role="status">
      {{ notice }}<button type="button" aria-label="Закрыть уведомление" @click="notice = ''">×</button>
    </div>
    <div class="constructor-layout">
      <section class="constructor-workspace" aria-label="Редактор рисунка" :inert="isMobile && Boolean(mobilePanel)">
        <header class="workspace-title">
          <button v-if="focusedEditor" type="button" class="client-back" @click="exitEditor">← Назад</button>
          <div>
            <p class="client-eyebrow">{{ activeTemplate?.name || 'Свой рисунок' }}</p>
            <h2>
              {{ typeTitle }} <span>{{ project.width }} × {{ project.height }} мм</span>
            </h2>
          </div>
          <button
            v-if="isMobile && !focusedEditor"
            type="button"
            class="constructor-button outline"
            @click="enterEditor"
          >
            К рисунку
          </button>
        </header>
        <div class="preset-row">
          <button
            type="button"
            class="preset-library-launch"
            data-testid="open-template-gallery"
            @click="templatesOpen = true"
          >
            <ConstructorIcon name="grid" />Готовые композиции <small>{{ templateCount }}</small></button
          ><button type="button" class="preset-clear" :disabled="!project.items.length" @click="applyTemplate('empty')">
            Начать с пустого
          </button>
        </div>
        <div class="canvas-toolbar">
          <div class="toolbar-group">
            <button
              type="button"
              aria-label="Отменить действие"
              title="Отменить (Ctrl+Z)"
              :disabled="!canUndo"
              @click="undo"
            >
              <ConstructorIcon name="undo" /></button
            ><button
              type="button"
              aria-label="Повторить действие"
              title="Повторить (Ctrl+Shift+Z)"
              :disabled="!canRedo"
              @click="redo"
            >
              <ConstructorIcon name="redo" /></button
            ><button
              type="button"
              class="labeled-tool"
              :aria-pressed="multiSelect"
              :class="{ active: multiSelect }"
              @click="multiSelect = !multiSelect"
            >
              Выбрать несколько
            </button>
          </div>
          <button
            type="button"
            class="labeled-tool align-drawing-tool"
            :disabled="!project.items.length || dimensionsChanged"
            @click="beginArrangement()"
          >
            <ConstructorIcon name="space" /><span>Выровнять рисунок</span>
          </button>
        </div>
        <div v-if="multiSelect" class="client-placement">
          Нажимайте на детали, чтобы выбрать несколько.
          <button type="button" @click="multiSelect = false">Готово</button>
        </div>
        <ConstructorCanvas
          ref="drawing"
          :project="project"
          :products="constructorProducts"
          :selected-id="selectedId"
          :selected-ids="selectedIds"
          :multi-select="multiSelect"
          :show-grid="showGrid"
          :snap-to-grid="snapToGrid"
          v-model:zoom="zoom"
          @select="onSelect"
          @move="moveItem"
          @rotate="rotateItem"
        />
        <div class="canvas-bottom">
          <span>{{ project.items.length }} деталей</span>
          <div class="zoom-controls">
            <button
              type="button"
              :disabled="zoom <= 0.5"
              aria-label="Уменьшить масштаб"
              @click="zoom = Math.max(0.5, zoom - 0.25)"
            >
              −</button
            ><button type="button" @click="fitView">Показать целиком</button
            ><button
              type="button"
              :disabled="zoom >= 4"
              aria-label="Увеличить масштаб"
              @click="zoom = Math.min(4, zoom + 0.25)"
            >
              +
            </button>
          </div>
        </div>
        <div v-if="isMobile && selectedItem" class="client-mobile-quick">
          <span>{{ selectedItems.length > 1 ? 'Выбрано: ' + selectedItems.length : selectedProduct.shortName }}</span
          ><button
            type="button"
            aria-label="Быстро повернуть деталь"
            :disabled="selectedItems.some((item) => item.locked)"
            @click="onAction('rotate')"
          >
            <ConstructorIcon name="rotate" /></button
          ><button type="button" @click="openPanel('tools')">Настройки</button>
        </div>
        <div class="workspace-hint">
          <span>Перетаскивайте детали. На пустом месте — перемещение обзора.</span
          ><span>Два пальца — масштаб · Ctrl+Z — отмена</span>
        </div>
      </section>
      <div v-if="!isMobile || mobilePanel === 'catalog'" class="client-catalog" :class="{ 'client-sheet': isMobile }">
        <header v-if="isMobile" class="client-sheet-heading">
          <h2>Детали каталога</h2>
          <button type="button" aria-label="Закрыть каталог" @click="mobilePanel = null">×</button>
        </header>
        <ConstructorCatalog
          :products="constructorProducts"
          :groups="constructorGroups"
          :project="project"
          :error="elementAddError"
          @clear-error="elementAddError = ''"
          @add="(product) => attemptElement(() => addElement(product))"
          @discuss="discussElement"
          @manual-dimensions="manualDimensions"
        />
      </div>
      <aside
        v-if="!isMobile || mobilePanel === 'tools'"
        :class="['client-inspector', { 'client-sheet': isMobile }]"
        aria-label="Расстановка и настройки"
      >
        <header v-if="isMobile" class="client-sheet-heading">
          <h2>Расстановка</h2>
          <button type="button" aria-label="Закрыть настройки" @click="mobilePanel = null">×</button>
        </header>
        <ConstructorSelection
          :items="selectionForPanel"
          :product="selectedProduct"
          :type="project.type"
          v-model:mirror-scope="mirrorScope"
          v-model:corner-inset="alignmentInset"
          @action="onAction"
          @update="attempt(() => updateSelected($event))"
          @mirror-copy="copyToCorner"
          @arrange="beginArrangement"
          @fill-corners="previewAllCorners"
        />
        <section class="client-arrange-tools">
          <h3>Весь рисунок</h3>
          <button
            type="button"
            class="constructor-button outline"
            :disabled="!project.items.length || dimensionsChanged"
            @click="beginArrangement()"
          >
            Выровнять рисунок
          </button>
          <details>
            <summary>Уголки и повторение</summary>
            <label class="client-inset"
              >Отступ уголков<span
                ><input
                  v-model.number="alignmentInset"
                  type="number"
                  min="0"
                  max="1000"
                  aria-label="Отступ уголков, мм"
                />
                мм</span
              ></label
            >
            <p class="client-muted">От внутреннего края рамы.</p>
            <button
              type="button"
              class="constructor-button outline"
              :disabled="!project.items.length || dimensionsChanged"
              @click="beginArrangement({ mode: 'corners' })"
            >
              Уголки по раме</button
            ><button
              type="button"
              class="constructor-button outline"
              :disabled="!project.items.length"
              @click="previewMirror"
            >
              Повторить левую сторону справа
            </button>
          </details>
          <details>
            <summary>Сетка и привязки</summary>
            <label class="client-check"><input v-model="showGrid" type="checkbox" />Показать сетку</label
            ><label class="client-check"><input v-model="snapToGrid" type="checkbox" />Привязка к сетке, 10 мм</label>
            <p class="client-muted">Направляющие центра и промежутков появляются при движении.</p>
          </details>
        </section>
      </aside>
    </div>
    <div v-if="isMobile && mobilePanel" class="client-sheet-scrim" @click="mobilePanel = null"></div>
    <nav v-if="isMobile" class="client-mobile-nav" aria-label="Инструменты конструктора">
      <button type="button" :aria-expanded="mobilePanel === 'catalog'" @click="openPanel('catalog')">
        <ConstructorIcon name="grid" />Детали</button
      ><button type="button" :aria-expanded="mobilePanel === 'tools'" @click="openPanel('tools')">
        <ConstructorIcon name="space" />Расстановка</button
      ><button type="button" @click="openHandoff"><ConstructorIcon name="download" />Подборка</button>
    </nav>
    <footer class="client-completion">
      <div>
        <strong>{{ totalQuantity }} деталей в подборке</strong
        ><span
          >{{ project.type === 'fence' ? 'На ' + project.sections + ' секций' : 'Для вашей конструкции'
          }}<template v-if="project.discussionItems?.length">
            · {{ project.discussionItems.length }} позиций для уточнения</template
          ></span
        >
      </div>
      <button type="button" class="constructor-button primary" @click="openHandoff">
        Подготовить подборку для мастера <ConstructorIcon name="arrow" />
      </button>
    </footer>
    <div class="client-file-actions">
      <button type="button" @click="draftsOpen = true">Мои сохранённые варианты</button
      ><button type="button" @click="fileInput.click()">Открыть файл проекта</button
      ><span>Эскиз для подбора. Изготовление согласуется с мастером.</span>
    </div>
    <ConstructorTemplates
      :open="templatesOpen"
      :project="project"
      :products="constructorProducts"
      :active-id="activeTemplate?.id || null"
      @close="templatesOpen = false"
      @apply="applyTemplate"
    />
    <ConstructorDimensions
      :error="elementAddError"
      @clear-error="elementAddError = ''"
      :product="dimensionProduct"
      :editing="Boolean(dimensionTargetId)"
      @close="closeDimensions"
      @confirm="confirmElementDimensions"
    />
    <ConstructorArrangement
      :project="project"
      :products="constructorProducts"
      :options="arrangementOptions"
      @close="arrangementOptions = null"
      @apply="confirmArrangement"
    />
    <ConstructorChangePreview
      :change="pendingChange"
      :products="constructorProducts"
      @close="pendingChange = null"
      @apply="confirmChange"
    />
    <ConstructorHandoff
      :open="handoffOpen"
      :project="project"
      :products="constructorProducts"
      :bill="bill"
      :warnings="warnings"
      :get-svg="getSvg"
      @close="handoffOpen = false"
      @update-comment="updateComment"
      @remove-discussion="removeDiscussion"
      @manual-dimensions="manualDimensions"
      @export-project="saveProject"
    />
    <ConstructorDrafts
      :open="draftsOpen"
      :project="project"
      :products="constructorProducts"
      @close="draftsOpen = false"
      @load="loadDraft"
    />
    <input
      ref="fileInput"
      type="file"
      accept=".json,application/json"
      class="sr-only"
      tabindex="-1"
      aria-label="Файл проекта"
      @change="openProject"
    />
  </div>
</template>
