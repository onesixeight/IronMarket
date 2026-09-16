import { computed, onScopeDispose, ref } from 'vue'
import { constructorProducts } from '../constructor/catalog.js'
import {
  createItem,
  createProject,
  distributeItems,
  getBillOfMaterials,
  getProjectWarnings,
  mirrorItem,
  mirrorItemInFrame,
  normalizeProject,
  resolveItemProduct,
  getItemBounds,
  PROJECT_LIMITS,
} from '../constructor/model.js'
import { buildPreset, createPresetItems } from '../constructor/presets.js'
import { alignProjectItems } from '../constructor/alignment.js'

export const CONSTRUCTOR_STORAGE_KEY = 'etalon-constructor-v1'
const copy = (value) => JSON.parse(JSON.stringify(value))

export function useConstructor() {
  const project = ref(createProject())
  project.value.items = createPresetItems(project.value, constructorProducts)
  const selectedId = ref(null)
  const selection = ref([])
  const selectedIds = computed(() => {
    const ids = selection.value.includes(selectedId.value) ? selection.value : [selectedId.value]
    const groups = new Set(
      project.value.items
        .filter((item) => ids.includes(item.id))
        .map((item) => item.groupId)
        .filter(Boolean)
    )
    return project.value.items
      .filter((item) => ids.includes(item.id) || groups.has(item.groupId))
      .map((item) => item.id)
  })
  const selectedItems = computed(() => project.value.items.filter((item) => selectedIds.value.includes(item.id)))
  const storageStatus = ref('Изменения сохраняются на этом устройстве')
  const notice = ref('')
  try {
    const saved = localStorage.getItem(CONSTRUCTOR_STORAGE_KEY)
    if (saved) project.value = normalizeProject(JSON.parse(saved), constructorProducts)
  } catch {
    notice.value = 'Сохранённый проект не удалось прочитать. Открыт стартовый рисунок.'
  }
  const past = ref([])
  const future = ref([])
  // Geometry stays reactive during a gesture. Expensive document side effects
  // follow completed edits instead of traversing every item on every frame.
  const editorRevision = ref(0)
  let transformGesture = null
  let saveTimer
  const itemsById = computed(() => new Map(project.value.items.map((item) => [item.id, item])))
  const selectedItem = computed(() => itemsById.value.get(selectedId.value))
  const selectedProduct = computed(() => {
    const product = constructorProducts.find((product) => product.id === selectedItem.value?.productId)
    return product ? resolveItemProduct(selectedItem.value, product) : undefined
  })
  const bill = computed(() => getBillOfMaterials(project.value, constructorProducts))
  const totalQuantity = computed(() => bill.value.reduce((sum, row) => sum + row.quantity, 0))
  const warnings = computed(() => getProjectWarnings(project.value, constructorProducts))
  const distributionCount = computed(
    () =>
      project.value.items.filter((item) => !selectedItem.value || item.productId === selectedItem.value.productId)
        .length
  )

  function save() {
    try {
      localStorage.setItem(CONSTRUCTOR_STORAGE_KEY, JSON.stringify(project.value))
      storageStatus.value = 'Сохранено на этом устройстве'
    } catch {
      storageStatus.value = 'Автосохранение недоступно — скачайте проект'
    }
  }
  function completeEdit() {
    editorRevision.value += 1
    storageStatus.value = 'Сохраняем…'
    clearTimeout(saveTimer)
    saveTimer = setTimeout(save, 300)
  }
  // A page reload does not dispose Vue's scope; flush the last debounced edit.
  const flushSave = () => {
    clearTimeout(saveTimer)
    save()
  }
  if (typeof window !== 'undefined') window.addEventListener('pagehide', flushSave)
  onScopeDispose(() => {
    if (typeof window !== 'undefined') window.removeEventListener('pagehide', flushSave)
    flushSave()
  })
  function record(snapshot = project.value) {
    past.value.push(copy(snapshot))
    if (past.value.length > 60) past.value.shift()
    future.value = []
  }
  function finishTransform() {
    const gesture = transformGesture
    transformGesture = null
    if (gesture && JSON.stringify(gesture.snapshot) !== JSON.stringify(project.value)) {
      record(gesture.snapshot)
      completeEdit()
    } else if (gesture) {
      // A pointer can return to its starting point: no history or revision, but
      // an earlier completed edit may still need its pending save flushed.
      clearTimeout(saveTimer)
      saveTimer = setTimeout(save, 300)
    }
  }
  function beginTransform(kind, id) {
    if (transformGesture && (transformGesture.kind !== kind || transformGesture.id !== id)) finishTransform()
    if (!transformGesture) {
      const snapshot = copy(project.value)
      transformGesture = { kind, id, snapshot, itemsById: new Map(snapshot.items.map((item) => [item.id, item])) }
      clearTimeout(saveTimer)
      storageStatus.value = 'Сохраняем…'
    }
  }
  function clearMissingTransform(id, commit) {
    if (commit && transformGesture?.id === id) transformGesture = null
  }
  function change(action) {
    const next = copy(project.value)
    action(next)
    const safe = normalizeProject(next, constructorProducts)
    if (JSON.stringify(safe) === JSON.stringify(project.value)) return
    finishTransform()
    record()
    project.value = safe
    completeEdit()
  }
  function selectItem(id, { additive = false } = {}) {
    if (!id) {
      selection.value = []
      selectedId.value = null
      return
    }
    const item = project.value.items.find((entry) => entry.id === id)
    if (!item) return
    const family = project.value.items
      .filter((entry) => entry.id === id || (item.groupId && entry.groupId === item.groupId))
      .map((entry) => entry.id)
    const current = selectedIds.value
    selection.value = additive
      ? current.includes(id)
        ? current.filter((entry) => !family.includes(entry))
        : [...new Set([...current, ...family])]
      : family
    selectedId.value = selection.value.includes(id) ? id : selection.value[0] || null
  }
  function undo() {
    finishTransform()
    if (!past.value.length) return
    future.value.push(copy(project.value))
    project.value = past.value.pop()
    selectedId.value = null
    completeEdit()
  }
  function redo() {
    finishTransform()
    if (!future.value.length) return
    past.value.push(copy(project.value))
    project.value = future.value.pop()
    selectedId.value = null
    completeEdit()
  }
  function addProduct(product, dimensions, position) {
    if (project.value.items.length >= PROJECT_LIMITS.maxItems)
      throw new Error(`В одном проекте можно разместить до ${PROJECT_LIMITS.maxItems} деталей.`)
    const offset = (project.value.items.length % 5) * 30
    const item = createItem(product, project.value, {
      dimensions,
      x:
        (project.value.type === 'gates'
          ? (project.value.width - PROJECT_LIMITS.gateGapMm) / 4
          : project.value.width / 2) + offset,
      y: project.value.height / 2 + offset,
      ...position,
    })
    change((value) => {
      value.items.push(item)
      if (value.discussionItems?.includes(product.id))
        value.discussionItems = value.discussionItems.filter((id) => id !== product.id)
    })
    selectItem(item.id)
    return item
  }
  function updateSelected(values) {
    if (!selectedItem.value) return
    if (selectedItems.value.some((item) => item.locked) && !Object.hasOwn(values, 'locked'))
      throw new Error('Сначала снимите закрепление выбранного узора.')
    if (selectedItems.value.length > 1 && (Object.hasOwn(values, 'x') || Object.hasOwn(values, 'y'))) {
      const dx = Object.hasOwn(values, 'x') ? values.x - selectedItem.value.x : 0
      const dy = Object.hasOwn(values, 'y') ? values.y - selectedItem.value.y : 0
      change((value) =>
        value.items
          .filter((item) => selectedIds.value.includes(item.id))
          .forEach((item) => {
            item.x += dx
            item.y += dy
          })
      )
      return
    }
    change((value) =>
      Object.assign(
        value.items.find((item) => item.id === selectedId.value),
        values
      )
    )
  }
  function moveItem({ id, x, y, dx, dy, ids, commit }) {
    const item = itemsById.value.get(id)
    if (!item) {
      clearMissingTransform(id, commit)
      return
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) return
    const targets = [...new Set(ids?.length ? ids : [id])].map((key) => itemsById.value.get(key)).filter(Boolean)
    if (!targets.length || targets.some((entry) => entry.locked)) return
    beginTransform('move', id)
    const original = transformGesture.itemsById.get(id)
    const starts = targets.map((entry) => transformGesture.itemsById.get(entry.id))
    const limit = PROJECT_LIMITS.maxCoordinate
    const deltaX = Math.max(
      -limit - Math.min(...starts.map((entry) => entry.x)),
      Math.min(limit - Math.max(...starts.map((entry) => entry.x)), Number.isFinite(dx) ? dx : x - original.x)
    )
    const deltaY = Math.max(
      -limit - Math.min(...starts.map((entry) => entry.y)),
      Math.min(limit - Math.max(...starts.map((entry) => entry.y)), Number.isFinite(dy) ? dy : y - original.y)
    )
    for (const entry of targets) {
      const start = transformGesture.itemsById.get(entry.id)
      entry.x = start.x + deltaX
      entry.y = start.y + deltaY
    }
    if (commit) finishTransform()
  }
  function rotateItem({ id, rotation, delta, center, ids, commit }) {
    const item = itemsById.value.get(id)
    if (!item) {
      clearMissingTransform(id, commit)
      return
    }
    if (!Number.isFinite(rotation)) return
    const targets = [...new Set(ids?.length ? ids : [id])].map((key) => itemsById.value.get(key)).filter(Boolean)
    if (!targets.length || targets.some((entry) => entry.locked)) return
    beginTransform('rotate', id)
    const original = transformGesture.itemsById.get(id)
    const angle = Number.isFinite(delta) ? delta : rotation - original.rotation
    const pivot = center || { x: original.x, y: original.y }
    const radians = (angle * Math.PI) / 180
    const rotated = []
    for (const entry of targets) {
      const start = transformGesture.itemsById.get(entry.id)
      const next = { ...entry, rotation: ((Math.round(start.rotation + angle) % 360) + 360) % 360 }
      if (targets.length > 1) {
        next.x = pivot.x + (start.x - pivot.x) * Math.cos(radians) - (start.y - pivot.y) * Math.sin(radians)
        next.y = pivot.y + (start.x - pivot.x) * Math.sin(radians) + (start.y - pivot.y) * Math.cos(radians)
      }
      rotated.push({ entry, next })
    }
    if (
      rotated.every(
        ({ next }) =>
          Number.isFinite(next.x) &&
          Number.isFinite(next.y) &&
          Math.abs(next.x) <= PROJECT_LIMITS.maxCoordinate &&
          Math.abs(next.y) <= PROJECT_LIMITS.maxCoordinate
      )
    )
      rotated.forEach(({ entry, next }) => Object.assign(entry, next))
    if (commit) finishTransform()
  }
  function removeSelected() {
    if (!selectedItem.value) return
    if (selectedItems.value.some((item) => item.locked))
      throw new Error('Сначала снимите закрепление выбранного узора.')
    const ids = selectedIds.value
    change((value) => {
      value.items = value.items.filter((item) => !ids.includes(item.id))
    })
    selectedId.value = null
  }
  function duplicateSelected(mirrored = false) {
    if (!selectedItem.value) return
    if (selectedItems.value.length > 1) {
      if (project.value.items.length + selectedItems.value.length > PROJECT_LIMITS.maxItems)
        throw new Error(`В одном проекте можно разместить до ${PROJECT_LIMITS.maxItems} деталей.`)
      const groups = new Map()
      const copies = selectedItems.value.map((item) => {
        const product = constructorProducts.find((entry) => entry.id === item.productId)
        const next = mirrored
          ? mirrorItem(item, project.value.width)
          : createItem(product, project.value, { ...item, x: item.x + 80, y: item.y + 80 })
        if (item.groupId) {
          if (!groups.has(item.groupId)) groups.set(item.groupId, next.id)
          next.groupId = groups.get(item.groupId)
        }
        delete next.locked
        return next
      })
      change((value) => value.items.push(...copies))
      selection.value = copies.map((item) => item.id)
      selectedId.value = copies[0].id
      return
    }
    if (project.value.items.length >= PROJECT_LIMITS.maxItems)
      throw new Error(`В одном проекте можно разместить до ${PROJECT_LIMITS.maxItems} деталей.`)
    const item = mirrored
      ? mirrorItem(selectedItem.value, project.value.width)
      : createItem(selectedProduct.value, project.value, {
          ...selectedItem.value,
          x: selectedItem.value.x + 80,
          y: selectedItem.value.y + 80,
        })
    delete item.groupId
    delete item.locked
    change((value) => value.items.push(item))
    selectedId.value = item.id
  }
  function mirrorLeft() {
    const source = project.value.items.filter((item) => item.x < project.value.width / 2)
    if (!source.length) throw new Error('Сначала разместите детали на левой половине.')
    const centers = project.value.items.filter((item) => item.x === project.value.width / 2)
    if (source.length * 2 + centers.length > PROJECT_LIMITS.maxItems)
      throw new Error(`После отражения получится больше ${PROJECT_LIMITS.maxItems} деталей.`)
    change((value) => {
      value.items = [...source, ...centers, ...source.map((item) => mirrorItem(item, value.width))]
    })
    selectedId.value = null
  }
  function mirrorSelected(axis = 'horizontal', scope = 'panel') {
    if (!selectedItem.value) return
    if (project.value.items.length >= PROJECT_LIMITS.maxItems) {
      throw new Error(`В одном проекте можно разместить до ${PROJECT_LIMITS.maxItems} деталей.`)
    }
    const item = mirrorItemInFrame(selectedItem.value, project.value, { axis, scope })
    delete item.groupId
    delete item.locked
    change((value) => value.items.push(item))
    selectedId.value = item.id
  }
  function distribute(axis = 'x') {
    const targetIds = new Set(
      project.value.items
        .filter((item) => !selectedItem.value || item.productId === selectedItem.value.productId)
        .map((item) => item.id)
    )
    const targets = project.value.items.filter((item) => targetIds.has(item.id))
    const distributed = distributeItems(targets, constructorProducts, axis)
    if (JSON.stringify(distributed) === JSON.stringify(targets)) {
      throw new Error(
        'Расстановка не изменилась: детали уже стоят равномерно или между крайними деталями не хватает места.'
      )
    }
    const byId = new Map(distributed.map((item) => [item.id, item]))
    change((value) => {
      value.items = value.items.map((item) => byId.get(item.id) || item)
    })
  }
  function alignDrawing(insetMm = project.value.alignmentInsetMm ?? 20) {
    const result = alignProjectItems(project.value, constructorProducts, { insetMm })
    if (result.changed || (project.value.items.length && insetMm !== (project.value.alignmentInsetMm ?? 20))) {
      change((value) => {
        value.items = result.items
        value.alignmentInsetMm = insetMm
      })
    }
    return result
  }
  function applyDimensions(dimensions) {
    const next = normalizeProject({ ...copy(project.value), ...dimensions }, constructorProducts)
    change((value) => Object.assign(value, next))
  }
  function setType(type) {
    const next = createProject(type)
    next.items = project.value.items.length ? createPresetItems(next, constructorProducts) : []
    change((value) => Object.assign(value, next))
    selectedId.value = null
  }
  function applyPreset(preset) {
    const result = buildPreset(project.value, constructorProducts, preset)
    if (!result.available) throw new Error(result.reason)
    change((value) => {
      value.items = result.items
    })
    selectedId.value = null
  }
  function loadProject(raw) {
    const next = normalizeProject(raw, constructorProducts)
    change((value) => {
      for (const key of Object.keys(value)) delete value[key]
      Object.assign(value, next)
    })
    selectedId.value = null
  }
  function groupSelected() {
    if (selectedItems.value.length < 2) throw new Error('Выберите хотя бы две детали.')
    if (selectedItems.value.some((item) => item.locked)) throw new Error('Сначала снимите закрепление.')
    if (
      project.value.type === 'gates' &&
      new Set(selectedItems.value.map((item) => item.x < project.value.width / 2)).size > 1
    )
      throw new Error('Объединяйте детали внутри одной створки.')
    const id = globalThis.crypto?.randomUUID?.() || `group-${Date.now()}`
    const ids = selectedIds.value
    change((value) =>
      value.items
        .filter((item) => ids.includes(item.id))
        .forEach((item) => {
          item.groupId = id
        })
    )
  }
  function ungroupSelected() {
    const ids = selectedIds.value
    change((value) =>
      value.items
        .filter((item) => ids.includes(item.id))
        .forEach((item) => {
          delete item.groupId
        })
    )
  }
  function lockSelected() {
    const ids = selectedIds.value
    const lock = !selectedItems.value.every((item) => item.locked)
    change((value) =>
      value.items
        .filter((item) => ids.includes(item.id))
        .forEach((item) => {
          item.locked = lock
        })
    )
  }
  function transformSelected(kind) {
    if (!selectedItems.value.length) return
    if (selectedItems.value.some((item) => item.locked))
      throw new Error('Сначала снимите закрепление выбранного узора.')
    const bounds = selectedItems.value.map((item) =>
      getItemBounds(
        item,
        constructorProducts.find((product) => product.id === item.productId)
      )
    )
    const center = {
      x: (Math.min(...bounds.map((b) => b.left)) + Math.max(...bounds.map((b) => b.right))) / 2,
      y: (Math.min(...bounds.map((b) => b.top)) + Math.max(...bounds.map((b) => b.bottom))) / 2,
    }
    if (kind === 'rotate')
      rotateItem({
        id: selectedId.value,
        ids: selectedIds.value,
        rotation: selectedItem.value.rotation + 90,
        delta: 90,
        center,
        commit: true,
      })
    else
      change((value) =>
        value.items
          .filter((item) => selectedIds.value.includes(item.id))
          .forEach((item) => {
            item.x = center.x * 2 - item.x
            item.rotation = -item.rotation
            item.flipX = !item.flipX
          })
      )
  }
  function applyArrangement(result, insetMm) {
    if (!result.canApply || result.issues?.some((issue) => issue.blocking))
      throw new Error('Исправьте отмеченные наборы или выберите «Не менять».')
    change((value) => {
      value.items = copy(result.items)
      if (insetMm !== undefined) value.cornerInsetMm = insetMm
    })
  }
  function addDiscussion(product) {
    change((value) => {
      value.discussionItems = [...new Set([...(value.discussionItems || []), product.id])]
    })
  }
  function removeDiscussion(id) {
    change((value) => {
      value.discussionItems = (value.discussionItems || []).filter((entry) => entry !== id)
    })
  }
  function updateComment(comment) {
    change((value) => {
      value.comment = comment
    })
  }
  return {
    project,
    editorRevision,
    selectedId,
    selectedIds,
    selectedItems,
    selectItem,
    selectedItem,
    selectedProduct,
    bill,
    totalQuantity,
    warnings,
    storageStatus,
    notice,
    distributionCount,
    canUndo: computed(() => past.value.length > 0),
    canRedo: computed(() => future.value.length > 0),
    undo,
    redo,
    addProduct,
    updateSelected,
    moveItem,
    rotateItem,
    removeSelected,
    duplicateSelected,
    mirrorSelected,
    mirrorLeft,
    distribute,
    alignDrawing,
    applyDimensions,
    setType,
    applyPreset,
    loadProject,
    groupSelected,
    ungroupSelected,
    lockSelected,
    transformSelected,
    applyArrangement,
    addDiscussion,
    removeDiscussion,
    updateComment,
  }
}
