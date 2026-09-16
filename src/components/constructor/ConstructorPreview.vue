<script setup>
import { computed, useId } from 'vue'
import { PROJECT_LIMITS, resolveItemProduct } from '../../constructor/model.js'

const props = defineProps({
  project: { type: Object, required: true },
  products: { type: Array, required: true },
  items: { type: Array, default: () => [] },
  highlights: { type: Object, default: null },
})

const imageClipPrefix = `composition-image-${useId().replace(/:/g, '')}`
const width = computed(() => props.project.width)
const height = computed(() => props.project.height)
const padding = computed(() => Math.max(width.value * 0.025, height.value * 0.025, 40))
const viewBox = computed(
  () => `${-padding.value} ${-padding.value} ${width.value + padding.value * 2} ${height.value + padding.value * 2}`
)
const catalog = computed(() => new Map(props.products.map((product) => [product.id, product])))
const highlightIds = computed(() => ({
  added: new Set(props.highlights?.addedIds || []),
  changed: new Set(props.highlights?.changedIds || []),
  removed: new Set(props.highlights?.removedIds || []),
}))
function highlightKind(id) {
  return ['added', 'changed', 'removed'].find((kind) => highlightIds.value[kind].has(id))
}
function highlightColor(id) {
  return { added: '#4f733d', changed: '#a5711b', removed: '#a05345' }[highlightKind(id)]
}
const accessibleLabel = computed(() => {
  const changes = [
    highlightIds.value.added.size ? `добавлено ${highlightIds.value.added.size}` : '',
    highlightIds.value.changed.size ? `изменено ${highlightIds.value.changed.size}` : '',
    highlightIds.value.removed.size ? `будет убрано ${highlightIds.value.removed.size}` : '',
  ].filter(Boolean)
  return `Эскиз ${width.value} на ${height.value} мм, ${props.items.length} деталей${changes.length ? '. ' + changes.join(', ') : ''}`
})
const elements = computed(() =>
  props.items.flatMap((item) => {
    const product = catalog.value.get(item.productId)
    return product ? [{ ...item, product: resolveItemProduct(item, product) }] : []
  })
)
const frameRects = computed(() => {
  const inset = PROJECT_LIMITS.frameMm / 2
  if (props.project.type === 'gates') {
    const leafWidth = (width.value - PROJECT_LIMITS.gateGapMm) / 2
    return [
      { x: inset, width: leafWidth - PROJECT_LIMITS.frameMm },
      { x: leafWidth + PROJECT_LIMITS.gateGapMm + inset, width: leafWidth - PROJECT_LIMITS.frameMm },
    ]
  }
  return [{ x: inset, width: width.value - PROJECT_LIMITS.frameMm }]
})

function cropViewBox(product) {
  return product.crop
    ? `${product.crop.x} ${product.crop.y} ${product.crop.width} ${product.crop.height}`
    : `0 0 ${product.imageWidth || product.widthMm} ${product.imageHeight || product.heightMm}`
}
</script>

<template>
  <span class="composition-preview">
    <svg :viewBox="viewBox" class="composition-preview__drawing" role="img" :aria-label="accessibleLabel">
      <defs>
        <clipPath
          v-for="product in products.filter((entry) => entry.clipPolygon)"
          :id="`${imageClipPrefix}-${product.id}`"
          :key="product.id"
          clipPathUnits="userSpaceOnUse"
        >
          <polygon :points="product.clipPolygon.map((point) => point.join(',')).join(' ')" />
        </clipPath>
      </defs>
      <g fill="none" stroke="#43473c" :stroke-width="PROJECT_LIMITS.frameMm">
        <rect
          v-for="(frame, index) in frameRects"
          :key="index"
          :x="frame.x"
          :y="PROJECT_LIMITS.frameMm / 2"
          :width="frame.width"
          :height="height - PROJECT_LIMITS.frameMm"
        />
      </g>
      <g
        v-for="item in elements"
        :key="item.id"
        :transform="`translate(${item.x} ${item.y}) rotate(${item.rotation || 0}) scale(${item.flipX ? -1 : 1} 1)`"
        :data-preview-highlight="highlightKind(item.id)"
      >
        <rect
          v-if="highlightKind(item.id)"
          :x="-item.product.widthMm / 2"
          :y="-item.product.heightMm / 2"
          :width="item.product.widthMm"
          :height="item.product.heightMm"
          :fill="highlightColor(item.id)"
          fill-opacity="0.12"
        />
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
            :clip-path="item.product.clipPolygon ? `url(#${imageClipPrefix}-${item.product.id})` : null"
            x="0"
            y="0"
            :width="item.product.imageWidth || item.product.widthMm"
            :height="item.product.imageHeight || item.product.heightMm"
          />
        </svg>
        <rect
          v-if="highlightKind(item.id)"
          :x="-item.product.widthMm / 2"
          :y="-item.product.heightMm / 2"
          :width="item.product.widthMm"
          :height="item.product.heightMm"
          fill="none"
          :stroke="highlightColor(item.id)"
          :stroke-dasharray="
            highlightKind(item.id) === 'changed' ? '6 3' : highlightKind(item.id) === 'removed' ? '2 3' : undefined
          "
          stroke-width="2.5"
          vector-effect="non-scaling-stroke"
        />
      </g>
    </svg>
  </span>
</template>

<style scoped>
.composition-preview {
  display: block;
  width: 100%;
  height: 162px;
  padding: 15px 16px;
  overflow: hidden;
  background: #f1f0e6;
  isolation: isolate;
}
.composition-preview__drawing {
  display: block;
  min-width: 0;
  min-height: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
@media (max-width: 600px) {
  .composition-preview {
    height: 146px;
    padding: 12px;
  }
}
</style>
