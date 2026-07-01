<template>
  <span ref="counterEl" class="animated-counter" :aria-label="value">
    <span aria-hidden="true">{{ displayValue }}</span>
  </span>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  value: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    default: 1000,
  },
  delay: {
    type: Number,
    default: 0,
  },
})

const counterEl = ref(null)
const displayValue = ref(props.value)

let observer
let frameId
let delayId

const parsedValue = computed(() => {
  const match = props.value.trim().match(/^(\D*)(\d+)(.*)$/)

  if (!match) {
    return { numeric: false, finalValue: props.value }
  }

  return {
    numeric: true,
    prefix: match[1],
    target: Number(match[2]),
    suffix: match[3],
    finalValue: props.value,
  }
})

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function renderValue(value) {
  const current = Math.round(value)
  displayValue.value = `${parsedValue.value.prefix}${current}${parsedValue.value.suffix}`
}

function showFinalValue() {
  displayValue.value = parsedValue.value.finalValue
}

function easeOutCubic(progress) {
  return 1 - Math.pow(1 - progress, 3)
}

function startCounter() {
  if (!parsedValue.value.numeric || prefersReducedMotion()) {
    showFinalValue()
    return
  }

  const startedAt = performance.now()
  renderValue(0)

  function tick(now) {
    const elapsed = now - startedAt
    const progress = Math.min(elapsed / props.duration, 1)
    renderValue(parsedValue.value.target * easeOutCubic(progress))

    if (progress < 1) {
      frameId = requestAnimationFrame(tick)
    } else {
      showFinalValue()
    }
  }

  frameId = requestAnimationFrame(tick)
}

onMounted(() => {
  if (!counterEl.value || !parsedValue.value.numeric || prefersReducedMotion()) {
    showFinalValue()
    return
  }

  displayValue.value = `${parsedValue.value.prefix}0${parsedValue.value.suffix}`

  observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return

      observer.disconnect()
      delayId = window.setTimeout(startCounter, props.delay)
    },
    { threshold: 0.45 },
  )

  observer.observe(counterEl.value)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  if (frameId) cancelAnimationFrame(frameId)
  if (delayId) window.clearTimeout(delayId)
})
</script>

<style scoped>
.animated-counter {
  display: inline-flex;
  min-width: 2.6ch;
  justify-content: center;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
  text-shadow: 0 0 22px rgb(var(--rgb-gold-400) / 0.2);
}
</style>
