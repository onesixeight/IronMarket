<script setup>
import { computed, nextTick, onMounted, onScopeDispose, ref, useId, watch } from 'vue'
import { getFramePanels, getItemBounds, PROJECT_LIMITS, resolveItemProduct } from '../../constructor/model.js'
import { snapBounds, translateBounds, unionBounds } from '../../constructor/snapping.js'

const props = defineProps({
  project: { type: Object, required: true },
  products: { type: Array, required: true },
  selectedId: { type: String, default: null },
  selectedIds: { type: Array, default: () => [] },
  multiSelect: { type: Boolean, default: false },
  showGrid: { type: Boolean, default: true },
  snapToGrid: { type: Boolean, default: false },
  snapToGuides: { type: Boolean, default: true },
  zoom: { type: Number, default: 1 },
  placement: { type: Object, default: null },
  readonly: { type: Boolean, default: false },
  originalItems: { type: Array, default: () => [] },
  previewGuides: { type: Array, default: () => [] },
  previewSets: { type: Array, default: () => [] },
})
const emit = defineEmits(['select', 'move', 'rotate', 'place', 'update:zoom', 'preview-select'])
const svgElement = ref(null)
const draggingId = ref(null)
const rotatingId = ref(null)
const panning = ref(false)
const viewport = ref({ width: 900, height: 480 })
const pan = ref({ x: 0, y: 0 })
const currentZoom = ref(props.zoom)
const hoverPoint = ref(null)
const snapGuides = ref([])
const patternId = 'constructor-grid-' + useId().replace(/:/g, '')
const majorPatternId = patternId + '-major'
const pointers = new Map()
let drag = null
let rotationDrag = null
let panDrag = null
let pinch = null
let resizeObserver

onMounted(() => {
  const measure = () => {
    const rect = svgElement.value?.getBoundingClientRect()
    if (rect?.width && rect.height) viewport.value = { width: rect.width, height: rect.height }
  }
  measure()
  resizeObserver = new ResizeObserver(measure)
  resizeObserver.observe(svgElement.value)
})
onScopeDispose(() => resizeObserver?.disconnect())

const width = computed(() => Math.max(300, Number(props.project.width) || 4000))
const height = computed(() => Math.max(300, Number(props.project.height) || 2000))
const padding = computed(() => Math.max(width.value * 0.085, height.value * 0.12, 180))
const labelSize = computed(() => Math.max(width.value / 67, height.value / 40, 25))
const exportViewBox = computed(() => ({
  x: -padding.value * 1.25,
  y: -padding.value * 1.05,
  width: width.value + padding.value * 2.25,
  height: height.value + padding.value * 2.1,
}))
const viewBox = computed(() => {
  const zoom = Math.min(4, Math.max(0.5, Number(currentZoom.value) || 1))
  const viewWidth = exportViewBox.value.width / zoom
  const viewHeight = exportViewBox.value.height / zoom
  return {
    x: width.value / 2 - viewWidth / 2 - padding.value * 0.125 + pan.value.x,
    y: height.value / 2 - viewHeight / 2 + pan.value.y,
    width: viewWidth,
    height: viewHeight,
  }
})
const viewBoxAttribute = computed(() => Object.values(viewBox.value).join(' '))
const exportViewBoxAttribute = computed(() => Object.values(exportViewBox.value).join(' '))
const productMap = computed(() => new Map(props.products.map((product) => [product.id, product])))
// Each item has its own dependency-tracked projection. Moving one ornament
// keeps every untouched projection stable; dimensions, rotation and catalogue
// changes still invalidate the affected product, bounds and SVG fragment.
const enrichedItems = new WeakMap()
function enrich(items) {
  return items.flatMap((item) => {
    if (!enrichedItems.has(item)) {
      enrichedItems.set(
        item,
        computed(() => {
          const source = productMap.value.get(item.productId)
          if (!source) return null
          const product = resolveItemProduct(item, source)
          return {
            ...item,
            product: { ...product, crop: product.crop ? { ...product.crop } : undefined },
            bounds: getItemBounds(item, product),
          }
        })
      )
    }
    const enriched = enrichedItems.get(item).value
    return enriched ? [enriched] : []
  })
}
const placedItems = computed(() => enrich(props.project.items))
const oldItems = computed(() => enrich(props.originalItems))
const selectedSet = computed(
  () => new Set(props.selectedIds.length ? props.selectedIds : props.selectedId ? [props.selectedId] : [])
)
const selectedItems = computed(() => placedItems.value.filter((item) => selectedSet.value.has(item.id)))
const selectedItem = computed(
  () => selectedItems.value.find((item) => item.id === props.selectedId) || selectedItems.value[0]
)
const selectionBounds = computed(() => unionBounds(selectedItems.value.map(itemBounds)))
const selectionLocked = computed(() => selectedItems.value.some((item) => item.locked))
const selectionGrouped = computed(
  () =>
    selectedItems.value.length > 1 &&
    selectedItems.value.every((item) => item.groupId && item.groupId === selectedItems.value[0].groupId)
)
const screenUnit = computed(() =>
  Math.max(viewBox.value.width / viewport.value.width, viewBox.value.height / viewport.value.height)
)
const frameName = computed(
  () => ({ gates: 'Ворота', wicket: 'Калитка', fence: 'Секция забора' })[props.project.type] || 'Конструкция'
)
const framePanels = computed(() => getFramePanels(props.project))
const frameRects = computed(() =>
  framePanels.value.map((panel) => ({
    x: panel.left + PROJECT_LIMITS.frameMm / 2,
    width: panel.width - PROJECT_LIMITS.frameMm,
  }))
)
const rulerTicks = computed(() => Array.from({ length: Math.floor(width.value / 100) + 1 }, (_, index) => index * 100))
const rotationCenter = computed(() => {
  if (!selectedItem.value) return null
  if (selectedItems.value.length === 1) return { x: selectedItem.value.x, y: selectedItem.value.y }
  const bounds = selectionBounds.value
  return { x: (bounds.left + bounds.right) / 2, y: (bounds.top + bounds.bottom) / 2 }
})
const rotationHandle = computed(() => {
  const item = selectedItem.value
  if (!item || props.readonly || props.placement || selectionLocked.value) return null
  if (selectedItems.value.length > 1) {
    const x = rotationCenter.value.x
    const edgeY = selectionBounds.value.top
    return { x, y: edgeY - 36 * screenUnit.value, edgeX: x, edgeY }
  }
  const angle = (item.rotation * Math.PI) / 180
  const edgeDistance = item.product.heightMm / 2
  const handleDistance = edgeDistance + 36 * screenUnit.value
  return {
    x: item.x + Math.sin(angle) * handleDistance,
    y: item.y - Math.cos(angle) * handleDistance,
    edgeX: item.x + Math.sin(angle) * edgeDistance,
    edgeY: item.y - Math.cos(angle) * edgeDistance,
  }
})
const ghostItem = computed(() => {
  if (!props.placement || props.readonly) return null
  const product = props.placement.product
  if (!product) return null
  try {
    return {
      id: 'placement-preview',
      productId: product.id,
      product: resolveItemProduct({ dimensions: props.placement.dimensions }, product),
      x: hoverPoint.value?.x ?? framePanels.value[0].centerX,
      y: hoverPoint.value?.y ?? framePanels.value[0].centerY,
      rotation: 0,
      flipX: false,
      dimensions: props.placement.dimensions,
    }
  } catch {
    return null
  }
})
const visibleGuides = computed(() => [...props.previewGuides, ...snapGuides.value])
const previewBoxes = computed(() =>
  props.readonly ? props.previewSets.filter((set) => set.boundsAfter && set.itemIds?.length) : []
)
function previewColor(set) {
  return set.status === 'blocked' ? '#a37030' : set.status === 'skipped' ? '#828577' : '#647744'
}
function selectPreviewSet(event, set) {
  event.preventDefault()
  event.stopPropagation()
  emit('preview-select', set.itemIds[0])
}

function normalizeAngle(value) {
  return ((Math.round(value) % 360) + 360) % 360
}
function itemBounds(item) {
  return item.bounds || getItemBounds(item, item.product)
}
function formatMm(value) {
  return Math.round(value).toLocaleString('ru-RU') + ' мм'
}
function cropViewBox(product) {
  const crop = product.crop
  return crop
    ? [crop.x, crop.y, crop.width, crop.height].join(' ')
    : '0 0 ' + (product.imageWidth || product.widthMm) + ' ' + (product.imageHeight || product.heightMm)
}
function itemTransform(item) {
  return (
    'translate(' +
    item.x +
    ' ' +
    item.y +
    ') rotate(' +
    (item.rotation || 0) +
    ') scale(' +
    (item.flipX ? -1 : 1) +
    ' 1)'
  )
}
function svgPoint(event) {
  const matrix = svgElement.value?.getScreenCTM()
  return matrix ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()) : null
}
function viewPoint(event) {
  const box = svgElement.value?.getBoundingClientRect()
  if (!box?.width || !box.height) return null
  const view = viewBox.value
  const scale = Math.min(box.width / view.width, box.height / view.height)
  return {
    x: view.x + (event.clientX - box.left - (box.width - view.width * scale) / 2) / scale,
    y: view.y + (event.clientY - box.top - (box.height - view.height * scale) / 2) / scale,
  }
}
function clampPosition(value) {
  return Math.min(16000, Math.max(-16000, value))
}
function selectedIdsFor(item) {
  if (selectedSet.value.has(item.id)) return selectedItems.value.map((entry) => entry.id)
  return item.groupId
    ? placedItems.value.filter((entry) => entry.groupId === item.groupId).map((entry) => entry.id)
    : [item.id]
}
function frameFor(bounds) {
  const center = (bounds.left + bounds.right) / 2
  const panels = getFramePanels(props.project, { inner: true })
  return panels.reduce((nearest, panel) =>
    Math.abs(panel.centerX - center) < Math.abs(nearest.centerX - center) ? panel : nearest
  )
}
function snapMoving(bounds, ids, bypass = false) {
  if (bypass) return { dx: 0, dy: 0, guides: [] }
  const frame = frameFor(bounds)
  const neighbors = placedItems.value
    .filter((item) => !ids.includes(item.id))
    .map(itemBounds)
    .filter((entry) => (entry.left + entry.right) / 2 >= frame.left && (entry.left + entry.right) / 2 <= frame.right)
  return snapBounds(bounds, {
    frame,
    neighbors,
    threshold: 7 * screenUnit.value,
    gridStep: props.snapToGrid ? 10 : 0,
    guides: props.snapToGuides,
  })
}
function updateGhost(event) {
  if (!ghostItem.value) return
  const point = viewPoint(event)
  if (!point) return
  const candidate = { ...ghostItem.value, x: point.x, y: point.y }
  const snapped = snapMoving(itemBounds(candidate), [], event.altKey)
  hoverPoint.value = { x: clampPosition(point.x + snapped.dx), y: clampPosition(point.y + snapped.dy) }
  snapGuides.value = snapped.guides
}

function fitView() {
  pan.value = { x: 0, y: 0 }
  currentZoom.value = 1
  emit('update:zoom', 1)
}
function zoomAt(value, event, notify = true) {
  const anchor = viewPoint(event)
  if (!anchor) return
  currentZoom.value = Math.min(4, Math.max(0.5, value))
  const next = viewPoint(event)
  if (next) pan.value = { x: pan.value.x + anchor.x - next.x, y: pan.value.y + anchor.y - next.y }
  if (notify) emit('update:zoom', currentZoom.value)
}
watch(
  () => props.zoom,
  (value) => {
    if (Math.abs(value - currentZoom.value) < 0.00001) return
    const box = svgElement.value?.getBoundingClientRect()
    if (!box) {
      currentZoom.value = value
      return
    }
    const center = rotationCenter.value
    const matrix = svgElement.value.getScreenCTM()
    const focus =
      center && matrix
        ? new DOMPoint(center.x, center.y).matrixTransform(matrix)
        : { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    zoomAt(value, { clientX: focus.x, clientY: focus.y }, false)
  }
)
watch([width, height], fitView)
watch(
  () => [...selectedSet.value].join('|'),
  () => {
    const gesture = drag || rotationDrag
    if (!gesture || gesture.ids.every((id) => selectedSet.value.has(id))) return
    drag = null
    rotationDrag = null
    draggingId.value = null
    rotatingId.value = null
    snapGuides.value = []
    release(gesture.pointerId)
  }
)
watch(
  () => props.placement,
  async (placement) => {
    hoverPoint.value = null
    snapGuides.value = []
    if (placement) {
      await nextTick()
      svgElement.value?.focus({ preventScroll: true })
    }
  }
)
watch(
  () => props.readonly,
  () => finishTransforms()
)

function capture(pointerId) {
  svgElement.value?.setPointerCapture(pointerId)
}
function release(pointerId) {
  if (svgElement.value?.hasPointerCapture(pointerId)) svgElement.value.releasePointerCapture(pointerId)
}
function pointerRecord(event) {
  return { clientX: event.clientX, clientY: event.clientY, pointerType: event.pointerType }
}
function touchPair() {
  return [...pointers.values()].filter((pointer) => pointer.pointerType === 'touch').slice(0, 2)
}
function pairCenter(pair) {
  return { clientX: (pair[0].clientX + pair[1].clientX) / 2, clientY: (pair[0].clientY + pair[1].clientY) / 2 }
}
function pairDistance(pair) {
  return Math.hypot(pair[1].clientX - pair[0].clientX, pair[1].clientY - pair[0].clientY)
}
function registerPointer(event) {
  pointers.set(event.pointerId, pointerRecord(event))
  const pair = touchPair()
  if (pair.length !== 2) return
  finishTransforms()
  panDrag = null
  const center = pairCenter(pair)
  pinch = { zoom: currentZoom.value, distance: Math.max(1, pairDistance(pair)), anchor: svgPoint(center) }
  capture(event.pointerId)
  panning.value = true
  event.preventDefault()
}
function startPan(event) {
  if (pinch || ![0, 1].includes(event.button)) return
  event.preventDefault()
  panDrag = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    pan: { ...pan.value },
    unit: screenUnit.value,
    moved: false,
  }
  capture(event.pointerId)
}
function onWheel(event) {
  if (!event.ctrlKey && !event.metaKey) return
  event.preventDefault()
  zoomAt(currentZoom.value * Math.exp(-event.deltaY * 0.008), event)
}

function startDrag(event, item) {
  if (pinch || event.button !== 0 || !event.isPrimary || drag || rotationDrag) return
  if (props.placement) {
    event.stopPropagation()
    startPan(event)
    updateGhost(event)
    return
  }
  event.preventDefault()
  event.stopPropagation()
  event.currentTarget.focus({ preventScroll: true })
  if (props.readonly) {
    emit('preview-select', item.id)
    return
  }
  const additive = props.multiSelect || event.shiftKey || event.ctrlKey || event.metaKey
  if (additive || !selectedSet.value.has(item.id)) emit('select', item.id, { additive })
  if (additive) return
  const ids = selectedIdsFor(item)
  const items = placedItems.value.filter((entry) => ids.includes(entry.id))
  if (items.some((entry) => entry.locked)) return
  const point = svgPoint(event)
  if (!point) return
  drag = {
    id: item.id,
    ids,
    pointerId: event.pointerId,
    startPoint: point,
    startX: item.x,
    startY: item.y,
    x: item.x,
    y: item.y,
    dx: 0,
    dy: 0,
    items,
    bounds: unionBounds(items.map(itemBounds)),
    moved: false,
    startClientX: event.clientX,
    startClientY: event.clientY,
  }
  capture(event.pointerId)
}
function movePayload(gesture, commit) {
  return { id: gesture.id, ids: gesture.ids, x: gesture.x, y: gesture.y, dx: gesture.dx, dy: gesture.dy, commit }
}
function moveDrag(event) {
  if (!drag || drag.pointerId !== event.pointerId) return
  if (!drag.moved && Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY) < 3) return
  const point = svgPoint(event)
  if (!point) return
  let dx = point.x - drag.startPoint.x
  let dy = point.y - drag.startPoint.y
  const snapped = snapMoving(translateBounds(drag.bounds, dx, dy), drag.ids, event.altKey)
  dx += snapped.dx
  dy += snapped.dy
  dx = Math.max(...drag.items.map((item) => -16000 - item.x), Math.min(dx, ...drag.items.map((item) => 16000 - item.x)))
  dy = Math.max(...drag.items.map((item) => -16000 - item.y), Math.min(dy, ...drag.items.map((item) => 16000 - item.y)))
  if (drag.dx === dx && drag.dy === dy) return
  Object.assign(drag, { x: drag.startX + dx, y: drag.startY + dy, dx, dy, moved: true })
  draggingId.value = drag.id
  snapGuides.value = snapped.guides
  emit('move', movePayload(drag, false))
}

function startRotation(event) {
  if (
    pinch ||
    props.readonly ||
    props.placement ||
    selectionLocked.value ||
    event.button !== 0 ||
    !event.isPrimary ||
    drag ||
    rotationDrag ||
    !selectedItem.value
  )
    return
  const point = svgPoint(event)
  if (!point) return
  event.preventDefault()
  event.stopPropagation()
  event.currentTarget.focus({ preventScroll: true })
  const item = selectedItem.value
  const center = { ...rotationCenter.value }
  rotationDrag = {
    id: item.id,
    ids: selectedItems.value.map((entry) => entry.id),
    pointerId: event.pointerId,
    center,
    startAngle: Math.atan2(point.y - center.y, point.x - center.x),
    startRotation: item.rotation,
    rotation: item.rotation,
    delta: 0,
    moved: false,
  }
  rotatingId.value = item.id
  capture(event.pointerId)
}
function rotationPayload(gesture, commit) {
  return {
    id: gesture.id,
    ids: gesture.ids,
    rotation: gesture.rotation,
    delta: gesture.delta,
    center: gesture.center,
    commit,
  }
}
function moveRotation(event) {
  if (!rotationDrag || rotationDrag.pointerId !== event.pointerId) return
  const point = svgPoint(event)
  if (!point) return
  const dx = point.x - rotationDrag.center.x
  const dy = point.y - rotationDrag.center.y
  if (Math.hypot(dx, dy) < screenUnit.value * 4) return
  const angle = Math.atan2(dy, dx)
  const raw = rotationDrag.startRotation + ((angle - rotationDrag.startAngle) * 180) / Math.PI
  const rotation = normalizeAngle(event.shiftKey ? Math.round(raw / 15) * 15 : raw)
  if (rotation === rotationDrag.rotation) return
  Object.assign(rotationDrag, { rotation, delta: rotation - rotationDrag.startRotation, moved: true })
  emit('rotate', rotationPayload(rotationDrag, false))
}
function finishTransforms() {
  const moved = drag
  const rotated = rotationDrag
  drag = null
  rotationDrag = null
  draggingId.value = null
  rotatingId.value = null
  snapGuides.value = []
  if (moved?.moved) emit('move', movePayload(moved, true))
  if (rotated?.moved) emit('rotate', rotationPayload(rotated, true))
}
function onPointerMove(event) {
  if (pointers.has(event.pointerId)) pointers.set(event.pointerId, pointerRecord(event))
  if (pinch) {
    const pair = touchPair()
    if (pair.length !== 2) return
    currentZoom.value = Math.min(4, Math.max(0.5, (pinch.zoom * pairDistance(pair)) / pinch.distance))
    const point = viewPoint(pairCenter(pair))
    if (point && pinch.anchor)
      pan.value = { x: pan.value.x + pinch.anchor.x - point.x, y: pan.value.y + pinch.anchor.y - point.y }
    emit('update:zoom', currentZoom.value)
    return
  }
  if (rotationDrag) {
    moveRotation(event)
    return
  }
  if (drag) {
    moveDrag(event)
    return
  }
  if (panDrag?.pointerId === event.pointerId) {
    const dx = event.clientX - panDrag.x
    const dy = event.clientY - panDrag.y
    if (!panDrag.moved && Math.hypot(dx, dy) < 3) return
    panDrag.moved = true
    panning.value = true
    pan.value = { x: panDrag.pan.x - dx * panDrag.unit, y: panDrag.pan.y - dy * panDrag.unit }
  }
  updateGhost(event)
}
function onPointerEnd(event) {
  const wasPinch = Boolean(pinch)
  pointers.delete(event.pointerId)
  if (wasPinch) {
    pinch = null
    const remaining = [...pointers.entries()][0]
    panDrag = remaining
      ? {
          pointerId: remaining[0],
          x: remaining[1].clientX,
          y: remaining[1].clientY,
          pan: { ...pan.value },
          unit: screenUnit.value,
          moved: true,
        }
      : null
    panning.value = Boolean(remaining)
    release(event.pointerId)
    return
  }
  if (drag?.pointerId === event.pointerId || rotationDrag?.pointerId === event.pointerId) finishTransforms()
  if (panDrag?.pointerId === event.pointerId) {
    const click = !panDrag.moved && event.type === 'pointerup'
    panDrag = null
    panning.value = false
    if (click && ghostItem.value) {
      updateGhost(event)
      emit('place', { x: ghostItem.value.x, y: ghostItem.value.y })
    } else if (click && !props.readonly) emit('select', null)
  }
  release(event.pointerId)
}

function handleKey(event, item) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    if (props.readonly) emit('preview-select', item.id)
    else emit('select', item.id, { additive: props.multiSelect || event.shiftKey || event.ctrlKey || event.metaKey })
    return
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('select', null)
    return
  }
  const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key]
  if (!direction || props.readonly || props.placement) return
  event.preventDefault()
  event.stopPropagation()
  const ids = selectedIdsFor(item)
  const items = placedItems.value.filter((entry) => ids.includes(entry.id))
  if (items.some((entry) => entry.locked)) return
  if (!selectedSet.value.has(item.id)) emit('select', item.id)
  const step = event.shiftKey ? 50 : 10
  const dx = direction[0] * step
  const dy = direction[1] * step
  if (items.some((entry) => Math.abs(entry.x + dx) > 16000 || Math.abs(entry.y + dy) > 16000)) return
  emit('move', { id: item.id, ids, x: item.x + dx, y: item.y + dy, dx, dy, commit: true })
}
function handleRotationKey(event) {
  const item = selectedItem.value
  if (!item || props.readonly || props.placement || selectionLocked.value) return
  let rotation
  if (['ArrowLeft', 'ArrowDown'].includes(event.key)) rotation = item.rotation - (event.shiftKey ? 15 : 1)
  else if (['ArrowRight', 'ArrowUp'].includes(event.key)) rotation = item.rotation + (event.shiftKey ? 15 : 1)
  else if (event.key === 'Home') rotation = 0
  else if (event.key === 'End') rotation = 359
  else return
  event.preventDefault()
  event.stopPropagation()
  emit('rotate', {
    id: item.id,
    ids: selectedItems.value.map((entry) => entry.id),
    rotation: normalizeAngle(rotation),
    delta: rotation - item.rotation,
    center: { ...rotationCenter.value },
    commit: true,
  })
}
function handleCanvasKey(event) {
  if (!ghostItem.value) return
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    event.stopPropagation()
    emit('place', { x: ghostItem.value.x, y: ghostItem.value.y })
    return
  }
  const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key]
  if (!direction) return
  event.preventDefault()
  event.stopPropagation()
  const step = event.shiftKey ? 50 : 10
  hoverPoint.value = {
    x: clampPosition(ghostItem.value.x + direction[0] * step),
    y: clampPosition(ghostItem.value.y + direction[1] * step),
  }
}
function guideLine(guide) {
  if (!guide.axis) return guide
  return guide.axis === 'x'
    ? { x1: guide.value, y1: guide.from, x2: guide.value, y2: guide.to }
    : { x1: guide.from, y1: guide.value, x2: guide.to, y2: guide.value }
}
defineExpose({ getSvgElement: () => svgElement.value, fitView })
</script>

<template>
  <div
    class="constructor-drawing"
    :class="{ 'is-dragging': draggingId, 'is-rotating': rotatingId, 'is-panning': panning, 'is-placing': placement }"
  >
    <svg
      ref="svgElement"
      xmlns="http://www.w3.org/2000/svg"
      class="constructor-drawing__svg"
      data-testid="constructor-canvas"
      :viewBox="viewBoxAttribute"
      :data-export-view-box="exportViewBoxAttribute"
      role="group"
      :aria-label="`${frameName}, ${formatMm(width)} на ${formatMm(height)}. Схема размещения элементов ковки`"
      tabindex="0"
      @pointerdown.capture="registerPointer"
      @pointerdown="startPan"
      @pointermove="onPointerMove"
      @pointerup="onPointerEnd"
      @pointercancel="onPointerEnd"
      @lostpointercapture="onPointerEnd"
      @wheel="onWheel"
      @keydown="handleCanvasKey"
    >
      <title>{{ frameName }} — эскиз подбора ковки</title>
      <desc>
        Выберите элемент и перемещайте мышью или стрелками с шагом 10 мм. Shift и стрелка — 50 мм. Размер деталей
        фиксирован. Для поворота потяните круглую ручку над выделенной деталью. Shift — поворот с шагом 15 градусов.
        Рама показана условно.
      </desc>
      <defs>
        <clipPath
          v-for="product in products.filter((entry) => entry.clipPolygon)"
          :id="`${patternId}-image-${product.id}`"
          :key="product.id"
          clipPathUnits="userSpaceOnUse"
        >
          <polygon :points="product.clipPolygon.map((point) => point.join(',')).join(' ')" />
        </clipPath>
        <pattern :id="patternId" width="100" height="100" patternUnits="userSpaceOnUse">
          <path
            d="M 100 0 L 0 0 0 100"
            fill="none"
            stroke="#777764"
            stroke-opacity="0.13"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
        </pattern>
        <pattern :id="majorPatternId" width="500" height="500" patternUnits="userSpaceOnUse">
          <path
            d="M 500 0 L 0 0 0 500"
            fill="none"
            stroke="#777764"
            stroke-opacity="0.13"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
        </pattern>
      </defs>

      <rect
        data-canvas-background
        :x="viewBox.x"
        :y="viewBox.y"
        :width="viewBox.width"
        :height="viewBox.height"
        fill="#f5f4ec"
      />
      <g v-if="showGrid" pointer-events="none" data-editor-only="grid" data-editor-ui>
        <rect x="0" y="0" :width="width" :height="height" :fill="`url(#${patternId})`" />
        <rect x="0" y="0" :width="width" :height="height" :fill="`url(#${majorPatternId})`" />
      </g>

      <!-- Profile and leaf gap are schematic; the labelled dimensions describe the outer frame. -->
      <g
        pointer-events="none"
        fill="none"
        stroke="#3e453e"
        :stroke-width="PROJECT_LIMITS.frameMm"
        stroke-linejoin="miter"
      >
        <rect
          v-for="(frame, index) in frameRects"
          :key="index"
          :x="frame.x"
          :y="PROJECT_LIMITS.frameMm / 2"
          :width="frame.width"
          :height="height - PROJECT_LIMITS.frameMm"
        />
      </g>
      <g v-if="project.type === 'gates'" fill="#686e61" pointer-events="none">
        <rect x="-13" :y="height * 0.19" width="24" height="100" rx="5" />
        <rect x="-13" :y="height * 0.76" width="24" height="100" rx="5" />
        <rect :x="width - 11" :y="height * 0.19" width="24" height="100" rx="5" />
        <rect :x="width - 11" :y="height * 0.76" width="24" height="100" rx="5" />
      </g>

      <g pointer-events="none" fill="none" stroke="#989a88" stroke-width="1" vector-effect="non-scaling-stroke">
        <path
          :d="`M 0 ${-padding * 0.19} V ${-padding * 0.72} M ${width} ${-padding * 0.19} V ${-padding * 0.72} M 0 ${-padding * 0.52} H ${width}`"
          vector-effect="non-scaling-stroke"
        />
        <path
          :d="`M ${-padding * 0.19} 0 H ${-padding * 0.76} M ${-padding * 0.19} ${height} H ${-padding * 0.76} M ${-padding * 0.55} 0 V ${height}`"
          vector-effect="non-scaling-stroke"
        />
        <path
          v-for="tick in rulerTicks"
          :key="tick"
          :d="`M ${tick} ${-padding * 0.1} v ${tick % 500 === 0 ? -labelSize * 0.24 : -labelSize * 0.12}`"
          vector-effect="non-scaling-stroke"
        />
      </g>
      <g fill="#777d67" pointer-events="none">
        <circle cx="0" :cy="-padding * 0.52" :r="labelSize * 0.065" />
        <circle :cx="width" :cy="-padding * 0.52" :r="labelSize * 0.065" />
        <circle :cx="-padding * 0.55" cy="0" :r="labelSize * 0.065" />
        <circle :cx="-padding * 0.55" :cy="height" :r="labelSize * 0.065" />
      </g>
      <g
        fill="#616653"
        font-family="'Manrope', sans-serif"
        :font-size="labelSize"
        font-weight="500"
        text-anchor="middle"
        pointer-events="none"
      >
        <rect
          :x="width / 2 - labelSize * 2.5"
          :y="-padding * 0.52 - labelSize * 0.75"
          :width="labelSize * 5"
          :height="labelSize * 1.3"
          fill="#f5f4ec"
        />
        <text :x="width / 2" :y="-padding * 0.52 + labelSize * 0.33">{{ formatMm(width) }}</text>
        <g :transform="`translate(${-padding * 0.55} ${height / 2}) rotate(-90)`">
          <rect
            :x="-labelSize * 2.5"
            :y="-labelSize * 0.75"
            :width="labelSize * 5"
            :height="labelSize * 1.3"
            fill="#f5f4ec"
          />
          <text x="0" :y="labelSize * 0.33">{{ formatMm(height) }}</text>
        </g>
        <template v-if="project.type === 'gates'">
          <text :x="framePanels[0].centerX" :y="height + padding * 0.46" :font-size="labelSize * 0.78" fill="#848773">
            Левая створка
          </text>
          <text :x="framePanels[1].centerX" :y="height + padding * 0.46" :font-size="labelSize * 0.78" fill="#848773">
            Правая створка
          </text>
        </template>
        <text v-else :x="width / 2" :y="height + padding * 0.46" :font-size="labelSize * 0.78" fill="#848773">
          {{
            project.type === 'fence' && project.sections > 1
              ? `Одна секция · повторить ${project.sections} раз`
              : frameName
          }}
        </text>
        <text :x="width / 2" :y="height + padding * 0.83" :font-size="labelSize * 0.62" fill="#909480">
          Эскиз размещения декора · рама показана условно
        </text>
      </g>

      <g v-if="oldItems.length" opacity="0.18" pointer-events="none" data-editor-only="original-layout" data-editor-ui>
        <g v-for="item in oldItems" :key="'old-' + item.id" :transform="itemTransform(item)">
          <svg
            :x="-item.product.widthMm / 2"
            :y="-item.product.heightMm / 2"
            :width="item.product.widthMm"
            :height="item.product.heightMm"
            :viewBox="cropViewBox(item.product)"
            preserveAspectRatio="none"
            overflow="hidden"
            style="mix-blend-mode: multiply"
          >
            <image
              :href="item.product.image"
              :width="item.product.imageWidth"
              :height="item.product.imageHeight"
              :clip-path="item.product.clipPolygon ? 'url(#' + patternId + '-image-' + item.product.id + ')' : null"
            />
          </svg>
        </g>
      </g>

      <g
        v-for="item in placedItems"
        :key="item.id"
        v-memo="[item, selectedSet.has(item.id), readonly]"
        :transform="itemTransform(item)"
        class="constructor-drawing__element"
        :class="{ 'is-selected': selectedSet.has(item.id), 'is-locked': item.locked }"
        data-testid="placed-element"
        :data-item-id="item.id"
        tabindex="0"
        role="button"
        :aria-label="`${item.product.name}, ${formatMm(item.product.widthMm)} на ${formatMm(item.product.heightMm)}. ${item.locked ? 'Закреплено' : readonly ? 'Выбрать набор в предпросмотре' : 'Переместить стрелками'}`"
        :aria-pressed="selectedSet.has(item.id)"
        :data-locked="item.locked || undefined"
        @pointerdown="startDrag($event, item)"
        @keydown="handleKey($event, item)"
      >
        <title>
          {{ item.product.name }} · {{ formatMm(item.product.widthMm) }} × {{ formatMm(item.product.heightMm) }}
        </title>
        <svg
          :x="-item.product.widthMm / 2"
          :y="-item.product.heightMm / 2"
          :width="item.product.widthMm"
          :height="item.product.heightMm"
          :viewBox="cropViewBox(item.product)"
          preserveAspectRatio="none"
          overflow="hidden"
          style="mix-blend-mode: multiply; pointer-events: none"
        >
          <image
            :href="item.product.image"
            :clip-path="item.product.clipPolygon ? `url(#${patternId}-image-${item.product.id})` : null"
            x="0"
            y="0"
            :width="item.product.imageWidth || item.product.widthMm"
            :height="item.product.imageHeight || item.product.heightMm"
          />
        </svg>
        <rect
          :x="-item.product.widthMm / 2"
          :y="-item.product.heightMm / 2"
          :width="item.product.widthMm"
          :height="item.product.heightMm"
          fill="transparent"
          stroke="none"
          class="constructor-drawing__hit-area"
        />
        <g v-if="selectedSet.has(item.id)" pointer-events="none" data-editor-only="selection" data-editor-ui>
          <rect
            :x="-item.product.widthMm / 2 - 5"
            :y="-item.product.heightMm / 2 - 5"
            :width="item.product.widthMm + 10"
            :height="item.product.heightMm + 10"
            fill="none"
            :stroke="item.locked ? '#9a6c38' : '#677441'"
            :stroke-dasharray="item.locked ? '5 3' : undefined"
            stroke-width="2"
            vector-effect="non-scaling-stroke"
          />
        </g>
      </g>

      <g v-if="previewBoxes.length" data-editor-only="preview-sets" data-editor-ui>
        <g v-for="set in previewBoxes" :key="set.id" :data-preview-set="set.id">
          <rect
            :x="set.boundsAfter.left - 3 * screenUnit"
            :y="set.boundsAfter.top - 3 * screenUnit"
            :width="set.boundsAfter.right - set.boundsAfter.left + 6 * screenUnit"
            :height="set.boundsAfter.bottom - set.boundsAfter.top + 6 * screenUnit"
            fill="none"
            :stroke="previewColor(set)"
            stroke-width="1.3"
            stroke-dasharray="5 3"
            vector-effect="non-scaling-stroke"
            pointer-events="none"
          />
          <g
            :transform="
              'translate(' +
              set.boundsAfter.left +
              ' ' +
              (set.boundsAfter.top - 8 * screenUnit) +
              ') scale(' +
              screenUnit +
              ')'
            "
            tabindex="0"
            role="button"
            :aria-label="
              set.label +
              (set.status === 'blocked'
                ? ': нужно уточнить'
                : set.status === 'skipped'
                  ? ': оставить на месте'
                  : ': готово')
            "
            class="constructor-drawing__set-label"
            @pointerdown="selectPreviewSet($event, set)"
            @keydown.enter="selectPreviewSet($event, set)"
            @keydown.space="selectPreviewSet($event, set)"
          >
            <rect y="-36" :width="Math.max(90, set.label.length * 7 + 18)" height="44" fill="transparent" />
            <rect
              y="-25"
              :width="Math.max(90, set.label.length * 7 + 18)"
              height="28"
              rx="4"
              fill="#f5f4ec"
              :stroke="previewColor(set)"
            />
            <text x="8" y="-7" font-size="12" font-family="Manrope, sans-serif" :fill="previewColor(set)">
              {{ set.label }}
            </text>
          </g>
        </g>
      </g>
      <g
        v-if="selectionBounds && selectedItems.length > 1"
        pointer-events="none"
        data-editor-only="group-selection"
        data-editor-ui
      >
        <rect
          :x="selectionBounds.left - 4 * screenUnit"
          :y="selectionBounds.top - 4 * screenUnit"
          :width="selectionBounds.right - selectionBounds.left + 8 * screenUnit"
          :height="selectionBounds.bottom - selectionBounds.top + 8 * screenUnit"
          fill="none"
          :stroke="selectionLocked ? '#9a6c38' : '#677441'"
          stroke-dasharray="6 4"
          stroke-width="1.5"
          vector-effect="non-scaling-stroke"
        />
      </g>
      <g
        v-if="selectionBounds && (selectionLocked || selectedItems.length > 1)"
        pointer-events="none"
        data-editor-only="selection-label"
        data-editor-ui
        :transform="
          'translate(' +
          selectionBounds.left +
          ' ' +
          (selectionBounds.bottom + 18 * screenUnit) +
          ') scale(' +
          screenUnit +
          ')'
        "
      >
        <text
          font-size="12"
          fill="#655331"
          font-family="Manrope, sans-serif"
          paint-order="stroke"
          stroke="#f5f4ec"
          stroke-width="4"
        >
          {{
            selectionLocked
              ? 'Закреплено'
              : selectionGrouped
                ? 'Группа · ' + selectedItems.length
                : 'Выбрано: ' + selectedItems.length
          }}
        </text>
      </g>
      <g v-if="visibleGuides.length" pointer-events="none" data-editor-only="guides" data-editor-ui>
        <g v-for="(guide, index) in visibleGuides" :key="index">
          <line
            v-bind="guideLine(guide)"
            stroke="#98743b"
            stroke-width="1.2"
            stroke-dasharray="5 4"
            vector-effect="non-scaling-stroke"
          />
          <text
            v-if="guide.label"
            :x="(guideLine(guide).x1 + guideLine(guide).x2) / 2 + 8 * screenUnit"
            :y="(guideLine(guide).y1 + guideLine(guide).y2) / 2 - 7 * screenUnit"
            :font-size="12 * screenUnit"
            fill="#76562a"
            font-family="Manrope, sans-serif"
            paint-order="stroke"
            stroke="#f5f4ec"
            :stroke-width="4 * screenUnit"
          >
            {{ guide.label }}
          </text>
        </g>
      </g>
      <g
        v-if="ghostItem"
        :transform="itemTransform(ghostItem)"
        pointer-events="none"
        data-testid="placement-ghost"
        data-editor-only="placement"
        data-editor-ui
        opacity="0.65"
      >
        <svg
          :x="-ghostItem.product.widthMm / 2"
          :y="-ghostItem.product.heightMm / 2"
          :width="ghostItem.product.widthMm"
          :height="ghostItem.product.heightMm"
          :viewBox="cropViewBox(ghostItem.product)"
          preserveAspectRatio="none"
          overflow="hidden"
          style="mix-blend-mode: multiply"
        >
          <image
            :href="ghostItem.product.image"
            :width="ghostItem.product.imageWidth"
            :height="ghostItem.product.imageHeight"
            :clip-path="
              ghostItem.product.clipPolygon ? 'url(#' + patternId + '-image-' + ghostItem.product.id + ')' : null
            "
          />
        </svg>
        <rect
          :x="-ghostItem.product.widthMm / 2"
          :y="-ghostItem.product.heightMm / 2"
          :width="ghostItem.product.widthMm"
          :height="ghostItem.product.heightMm"
          fill="none"
          stroke="#967132"
          stroke-width="2"
          stroke-dasharray="6 4"
          vector-effect="non-scaling-stroke"
        />
      </g>

      <g v-if="rotationHandle && selectedItem" data-editor-only="rotation-control" data-editor-ui>
        <line
          :x1="rotationHandle.edgeX"
          :y1="rotationHandle.edgeY"
          :x2="rotationHandle.x"
          :y2="rotationHandle.y"
          stroke="#876631"
          stroke-width="1.5"
          vector-effect="non-scaling-stroke"
          pointer-events="none"
        />
        <g
          :transform="`translate(${rotationHandle.x} ${rotationHandle.y}) scale(${screenUnit})`"
          class="constructor-drawing__rotation"
          data-testid="rotation-handle"
          tabindex="0"
          role="slider"
          aria-label="Повернуть выбранную деталь"
          aria-valuemin="0"
          aria-valuemax="359"
          :aria-valuenow="normalizeAngle(selectedItem.rotation)"
          :aria-valuetext="`${normalizeAngle(selectedItem.rotation)} градусов`"
          @pointerdown="startRotation"
          @keydown="handleRotationKey"
        >
          <title>Потяните, чтобы повернуть. Shift — шаг 15°. Стрелки — шаг 1°.</title>
          <circle r="22" fill="transparent" />
          <circle class="rotation-knob" r="13" fill="#f6ead0" stroke="#98733d" stroke-width="1.5" />
          <path
            d="M6 -1a6 6 0 1 0-1.7 5.2M6-6v5H1"
            fill="none"
            stroke="#725321"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            pointer-events="none"
          />
          <rect x="19" y="-10" width="42" height="20" rx="4" fill="#352b1e" pointer-events="none" />
          <text
            x="40"
            y="4"
            fill="#f8e3bd"
            font-family="'Manrope', sans-serif"
            font-size="11"
            text-anchor="middle"
            pointer-events="none"
          >
            {{ normalizeAngle(selectedItem.rotation) }}°
          </text>
        </g>
      </g>

      <g
        v-if="!placedItems.length && !placement"
        text-anchor="middle"
        pointer-events="none"
        data-editor-only="empty-state"
        data-editor-ui
        font-family="'Manrope', sans-serif"
      >
        <circle :cx="width / 2" :cy="height / 2 - labelSize * 1.5" :r="labelSize * 0.7" fill="#e9ecdf" />
        <path
          :d="`M ${width / 2 - labelSize * 0.26} ${height / 2 - labelSize * 1.5} h ${labelSize * 0.52} M ${width / 2} ${height / 2 - labelSize * 1.76} v ${labelSize * 0.52}`"
          fill="none"
          stroke="#697747"
          stroke-width="1.5"
          vector-effect="non-scaling-stroke"
        />
        <text
          :x="width / 2"
          :y="height / 2 + labelSize * 0.3"
          :font-size="labelSize * 1.08"
          font-weight="600"
          fill="#565e48"
        >
          Начните с одного элемента
        </text>
        <text :x="width / 2" :y="height / 2 + labelSize * 1.65" :font-size="labelSize * 0.77" fill="#828774">
          Выберите деталь в каталоге
        </text>
      </g>
    </svg>
    <div class="constructor-drawing__caption" aria-hidden="true">
      <span><i></i> {{ showGrid ? 'Сетка 100 мм' : 'Сетка скрыта' }}</span>
      <span>{{
        placement
          ? 'Нажмите на место для детали · Enter — разместить'
          : panning
            ? 'Перемещение обзора'
            : 'Рама показана условно'
      }}</span>
    </div>
  </div>
</template>

<style scoped>
.constructor-drawing {
  position: relative;
  display: flex;
  flex: 1;
  min-width: 0;
  height: 480px;
  overflow: hidden;
  background: #f5f4ec;
  border: 0;
  border-radius: 0;
  isolation: isolate;
}
.constructor-drawing__svg {
  display: block;
  width: 100%;
  height: 480px;
  flex: 1;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.constructor-drawing__element {
  cursor: grab;
  outline: none;
}
.constructor-drawing__element:focus-visible .constructor-drawing__hit-area {
  stroke: #677441;
  stroke-width: 2px;
  stroke-dasharray: 5px 3px;
  vector-effect: non-scaling-stroke;
}
.is-dragging,
.is-dragging .constructor-drawing__element {
  cursor: grabbing;
}
.constructor-drawing__element.is-locked {
  cursor: pointer;
}
.constructor-drawing__set-label {
  cursor: pointer;
  outline: none;
}
.constructor-drawing__set-label:focus-visible rect {
  stroke-width: 2;
}
.constructor-drawing__svg {
  cursor: grab;
}
.is-panning .constructor-drawing__svg {
  cursor: grabbing;
}
.is-placing .constructor-drawing__svg,
.is-placing .constructor-drawing__element {
  cursor: crosshair;
}
.constructor-drawing__rotation {
  cursor: grab;
  outline: none;
}
.constructor-drawing__rotation:focus-visible .rotation-knob {
  stroke: #584019;
  stroke-width: 3;
}
.constructor-drawing__rotation:hover .rotation-knob {
  fill: #edcf96;
}
.is-rotating,
.is-rotating .constructor-drawing__rotation {
  cursor: grabbing;
}
.constructor-drawing__caption {
  position: absolute;
  right: 20px;
  bottom: 15px;
  left: 20px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #868a78;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.025em;
  pointer-events: none;
}
.constructor-drawing__caption span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.constructor-drawing__caption i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #899374;
}
@media (max-width: 720px) {
  .constructor-drawing {
    height: 330px;
  }
  .constructor-drawing__svg {
    height: 330px;
  }
  .constructor-drawing__caption {
    left: 12px;
    right: 12px;
    bottom: 12px;
    font-size: 9px;
  }
}
</style>
