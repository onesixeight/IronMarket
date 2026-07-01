<template>
  <section
    aria-label="Главный слайдер"
    aria-roledescription="carousel"
    class="relative min-h-[560px] sm:min-h-[640px] lg:min-h-[780px] xl:h-[92vh] xl:max-h-[980px] overflow-hidden"
    :class="{ 'is-hero-motion-ready': isHeroMotionReady }"
    @mouseenter="pauseForPointer"
    @mouseleave="resumeAfterPointer"
    @focusin="pauseForFocus"
  >
    <div
      v-for="{ slide, index: i } in renderedSlides"
      :key="slide.title"
      class="absolute inset-0 transition-opacity duration-1000 ease-in-out"
      :class="current === i ? 'opacity-100 z-10' : 'opacity-0 z-0'"
      role="group"
      aria-roledescription="slide"
      :aria-label="`${i + 1} из ${slides.length}: ${slide.tag}`"
      :aria-hidden="current !== i"
    >
      <img
        :src="slide.image"
        :srcset="slide.srcset"
        :alt="slide.title"
        class="w-full h-full object-cover"
        :class="current === i && isHeroMotionReady ? 'hero-image-breathe' : ''"
        :loading="i === 0 ? 'eager' : 'lazy'"
        :fetchpriority="i === 0 ? 'high' : undefined"
        sizes="100vw"
        decoding="async"
        width="1536"
        height="1024"
      />
      <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,5,4,0.94)_0%,rgba(6,5,4,0.72)_45%,rgba(6,5,4,0.44)_100%)]"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,150,59,0.18),transparent_28%)]"></div>
    </div>

    <div class="hero-pattern absolute inset-0 z-20 pointer-events-none opacity-[0.05]"></div>
    <div class="hero-light-sweep absolute inset-0 z-20 pointer-events-none"></div>
    <div class="absolute inset-0 z-20 pointer-events-none bg-[linear-gradient(180deg,transparent_72%,rgba(6,5,4,0.88)_100%)]"></div>

    <div class="relative z-30 flex min-h-full items-center pt-24 pb-28 sm:pt-28 sm:pb-32 lg:pt-32 lg:pb-36">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div class="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <Transition name="hero-text" mode="out-in">
            <div :key="current" class="max-w-3xl">
              <div class="eyebrow mb-6">{{ slides[current].tag }}</div>

              <h1 class="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.8rem] leading-[0.95] text-cream-100">
                {{ slides[current].title }}
              </h1>

              <p class="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-cream-100/68">
                {{ slides[current].subtitle }}
              </p>

              <div class="mt-8 flex flex-wrap gap-3">
                <router-link to="/catalog" class="metal-button">
                  Открыть каталог
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                  </svg>
                </router-link>
                <router-link to="/contacts" class="metal-button-ghost">
                  Обсудить проект
                </router-link>
              </div>

              <div class="mt-8 flex flex-wrap gap-3">
                <div v-for="fact in slides[current].facts" :key="fact.label" class="metric-chip min-w-[170px]">
                  <div class="text-2xl font-heading text-gold-300">{{ fact.value }}</div>
                  <div class="mt-2 text-xs uppercase tracking-[0.18em] text-cream-100/46">{{ fact.label }}</div>
                </div>
              </div>
            </div>
          </Transition>

          <Transition name="hero-card" mode="out-in">
            <div :key="'card-' + current" class="hidden lg:block justify-self-end w-full max-w-md">
              <div class="surface-panel rounded-[2rem] p-7">
                <div class="text-xs uppercase tracking-[0.22em] text-gold-300 mb-4">Ателье металла</div>
                <div class="font-heading text-2xl leading-tight text-cream-100">{{ slides[current].panelTitle }}</div>
                <p class="text-sm leading-relaxed text-cream-100/56 mt-4">{{ slides[current].panelText }}</p>

                <div class="mt-6 space-y-3">
                  <div
                    v-for="point in slides[current].points"
                    :key="point"
                    class="flex items-start gap-3 rounded-[1rem] border border-gold-400/10 bg-obsidian-900/54 px-4 py-3"
                  >
                    <span class="mt-1 w-2 h-2 rounded-full bg-gold-400 shadow-[0_0_12px_rgba(201,150,59,0.35)]"></span>
                    <span class="text-sm text-cream-100/72 leading-relaxed">{{ point }}</span>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <button
      @click="prev"
      class="slider-btn left-4 lg:left-8"
      aria-label="Предыдущий слайд"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
      </svg>
    </button>

    <button
      @click="next"
      class="slider-btn right-4 lg:right-8"
      aria-label="Следующий слайд"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
      </svg>
    </button>

    <div class="absolute bottom-4 sm:bottom-5 lg:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 sm:gap-3">
      <button
        type="button"
        class="autoplay-toggle"
        :class="{ 'is-running': isAutoPlayRunning }"
        :aria-label="autoPlayLabel"
        :title="autoPlayLabel"
        :disabled="prefersReducedMotion"
        @click.stop="toggleAutoPlay"
      >
        <span class="autoplay-dot" :class="{ 'is-paused': !isAutoPlayRunning }" aria-hidden="true"></span>
      </button>
      <span class="h-5 w-px bg-gold-400/16" aria-hidden="true"></span>
      <button
        v-for="(_, i) in slides"
        :key="i"
        @click="goTo(i)"
        class="flex h-10 items-center justify-center rounded-full px-1"
        :aria-label="`Слайд ${i + 1}`"
      >
        <span
          class="block h-2 rounded-full transition-[width,background-color,box-shadow] duration-500"
          :class="current === i ? 'bg-gold-300 w-11 shadow-[0_0_18px_rgba(201,150,59,0.35)]' : 'bg-white/18 w-5 hover:bg-white/34'"
        ></span>
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const current = ref(0)
const previousSlideIndex = ref(null)
const isAutoPlayActive = ref(true)
const isPointerInside = ref(false)
const prefersReducedMotion = ref(false)

const FIRST_AUTOPLAY_DELAY = 9000
const AUTOPLAY_DELAY = 7000
const SLIDE_TRANSITION_CLEANUP_DELAY = 1100
const HERO_MOTION_DELAY = 3000
let autoplayTimerId = null
let slideCleanupTimerId = null
let heroMotionTimerId = null
let reduceMotionMediaQuery = null
let reduceMotionChangeHandler = null
const isHeroMotionReady = ref(false)

const isAutoPlayRunning = computed(() => (
  isAutoPlayActive.value
  && !prefersReducedMotion.value
  && !isPointerInside.value
))

const autoPlayLabel = computed(() => (
  prefersReducedMotion.value
    ? 'Автоперелистывание отключено из-за настроек уменьшения движения'
    : isAutoPlayActive.value
      ? 'Поставить автоперелистывание на паузу'
      : 'Включить автоперелистывание'
))

const renderedSlides = computed(() => {
  const indexes = previousSlideIndex.value === null || previousSlideIndex.value === current.value
    ? [current.value]
    : [previousSlideIndex.value, current.value]

  return indexes.map((index) => ({
    index,
    slide: slides[index],
  }))
})

const slides = [
  {
    tag: 'Художественная ковка',
    title: 'Кованые элементы с характером и точной геометрией.',
    subtitle: 'Собираем коллекцию деталей для ворот, ограждений, лестниц и фасадов так, чтобы изделие выглядело цельно и дорого уже на этапе проекта.',
    panelTitle: 'Помогаем собрать заказ под объект, а не просто отгружаем позиции.',
    panelText: 'Подскажем по сочетанию элементов, ритму рисунка и комплектованию заказа под реальные размеры и задачи.',
    points: [
      'Подбор декоративных элементов под стиль объекта',
      'Комплектация заказов по всему Казахстану',
      'Понятная консультация по материалам и объёму',
    ],
    facts: [
      { value: '60+', label: 'позиций в каталоге' },
      { value: '20+', label: 'лет в ремесле' },
      { value: '7/7', label: 'без выходных' },
    ],
    image: '/images/hero/hero-ornamental-pattern-v2.webp',
    srcset: '/images/hero/hero-ornamental-pattern-v2-768w.webp 768w, /images/hero/hero-ornamental-pattern-v2-1200w.webp 1200w, /images/hero/hero-ornamental-pattern-v2.webp 1536w',
  },
  {
    tag: 'Ворота и ограждения',
    title: 'Орнамент, который держит форму и собирает внимание.',
    subtitle: 'От лаконичных секций до насыщенного декора: подбираем кованые элементы для ворот, калиток, балконов и фасадных акцентов.',
    panelTitle: 'Сильная сторона — декоративные композиции.',
    panelText: 'Короны, пики, завитки, листья и накладные узоры хорошо сочетаются между собой и дают цельный визуальный ритм.',
    points: [
      'Готовые решения для частных домов и коммерческих объектов',
      'Элементы под классический, строгий и современный рисунок',
      'Удобный выбор позиций без лишней перегрузки',
    ],
    facts: [
      { value: '5', label: 'ключевых сценариев' },
      { value: '1', label: 'единый стиль' },
      { value: '∞', label: 'вариантов сочетаний' },
    ],
    image: '/images/hero/hero-ornamental-gate-v2.webp',
    srcset: '/images/hero/hero-ornamental-gate-v2-768w.webp 768w, /images/hero/hero-ornamental-gate-v2-1200w.webp 1200w, /images/hero/hero-ornamental-gate-v2.webp 1536w',
  },
  {
    tag: 'Комплектация объектов',
    title: 'Надёжная база для проектов, где важны ритм и качество.',
    subtitle: 'Поставляем декоративные элементы и комплектующие партиями, чтобы вы могли быстро собрать проект без визуального шума и компромиссов.',
    panelTitle: 'Подходит для монтажников, мастерских и частных заказчиков.',
    panelText: 'Если нужен не один элемент, а понятный набор под проект, поможем собрать рабочую спецификацию.',
    points: [
      'Партии под монтаж и частные заказы',
      'Быстрая ориентация по каталогу и материалам',
      'Аккуратный визуальный язык без случайных решений',
    ],
    facts: [
      { value: 'KZ', label: 'по Казахстану' },
      { value: 'DIY', label: 'для частных задач' },
      { value: '24/7', label: 'каталог онлайн' },
    ],
    image: '/images/hero/hero-wrought-iron-fence-v2.webp',
    srcset: '/images/hero/hero-wrought-iron-fence-v2-768w.webp 768w, /images/hero/hero-wrought-iron-fence-v2-1200w.webp 1200w, /images/hero/hero-wrought-iron-fence-v2.webp 1536w',
  },
]

function clearAutoPlay() {
  if (autoplayTimerId) {
    window.clearTimeout(autoplayTimerId)
    autoplayTimerId = null
  }
}

function clearSlideCleanup() {
  if (slideCleanupTimerId) {
    window.clearTimeout(slideCleanupTimerId)
    slideCleanupTimerId = null
  }
}

function scheduleSlideCleanup() {
  clearSlideCleanup()

  slideCleanupTimerId = window.setTimeout(() => {
    previousSlideIndex.value = null
    slideCleanupTimerId = null
  }, SLIDE_TRANSITION_CLEANUP_DELAY)
}

function setCurrentSlide(index) {
  const nextIndex = (index + slides.length) % slides.length
  if (nextIndex === current.value) return false

  previousSlideIndex.value = current.value
  current.value = nextIndex
  scheduleSlideCleanup()
  return true
}

function next() {
  setCurrentSlide(current.value + 1)
  scheduleAutoPlay()
}

function prev() {
  setCurrentSlide(current.value - 1)
  scheduleAutoPlay()
}

function goTo(i) {
  if (setCurrentSlide(i)) {
    scheduleAutoPlay()
  }
}

function clearHeroMotionDelay() {
  if (heroMotionTimerId) {
    window.clearTimeout(heroMotionTimerId)
    heroMotionTimerId = null
  }
}

function startHeroMotionDelay() {
  clearHeroMotionDelay()

  if (prefersReducedMotion.value) {
    isHeroMotionReady.value = false
    return
  }

  heroMotionTimerId = window.setTimeout(() => {
    isHeroMotionReady.value = true
  }, HERO_MOTION_DELAY)
}

function scheduleAutoPlay(delay = AUTOPLAY_DELAY) {
  clearAutoPlay()

  if (!isAutoPlayRunning.value) {
    return
  }

  autoplayTimerId = window.setTimeout(() => {
    setCurrentSlide(current.value + 1)
    scheduleAutoPlay()
  }, delay)
}

function pauseForPointer() {
  isPointerInside.value = true
  clearAutoPlay()
}

function resumeAfterPointer() {
  isPointerInside.value = false
  scheduleAutoPlay()
}

function pauseForFocus(event) {
  if (event.target?.closest?.('.autoplay-toggle')) {
    return
  }

  isAutoPlayActive.value = false
  clearAutoPlay()
}

function toggleAutoPlay() {
  if (prefersReducedMotion.value) {
    isAutoPlayActive.value = false
    clearAutoPlay()
    return
  }

  isAutoPlayActive.value = !isAutoPlayActive.value

  if (isAutoPlayActive.value) {
    scheduleAutoPlay()
  } else {
    clearAutoPlay()
  }
}

onMounted(() => {
  reduceMotionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion.value = reduceMotionMediaQuery.matches
  isAutoPlayActive.value = !prefersReducedMotion.value

  reduceMotionChangeHandler = (event) => {
    prefersReducedMotion.value = event.matches

    if (event.matches) {
      isAutoPlayActive.value = false
      isHeroMotionReady.value = false
      clearHeroMotionDelay()
      clearAutoPlay()
    } else {
      startHeroMotionDelay()
      scheduleAutoPlay()
    }
  }

  reduceMotionMediaQuery.addEventListener('change', reduceMotionChangeHandler)
  startHeroMotionDelay()
  scheduleAutoPlay(FIRST_AUTOPLAY_DELAY)
})

onBeforeUnmount(() => {
  clearAutoPlay()
  clearSlideCleanup()
  clearHeroMotionDelay()
  reduceMotionMediaQuery?.removeEventListener('change', reduceMotionChangeHandler)
})
</script>

<style scoped>
.hero-pattern {
  background-image: repeating-linear-gradient(45deg, transparent, transparent 42px, rgba(201,150,59,0.14) 42px, rgba(201,150,59,0.14) 43px);
  background-size: 120px 120px;
}

.is-hero-motion-ready .hero-pattern {
  animation: heroPatternDrift 18s linear infinite;
}

.hero-image-breathe {
  animation: heroImageBreathe 16s ease-in-out forwards;
  transform-origin: center;
  will-change: transform;
}

.hero-light-sweep {
  opacity: 0.16;
  background:
    radial-gradient(circle at 24% 22%, rgba(230, 188, 103, 0.18), transparent 19rem),
    linear-gradient(112deg, transparent 24%, rgba(245, 240, 232, 0.08) 46%, transparent 64%);
  transform: translate3d(-2rem, 0, 0) scale(1);
}

.is-hero-motion-ready .hero-light-sweep {
  animation: heroLightWake 10s ease-in-out infinite alternate;
}

.autoplay-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.35rem;
  height: 2.35rem;
  border: 1px solid rgba(201, 150, 59, 0.18);
  border-radius: 9999px;
  background: rgba(10, 9, 8, 0.52);
  color: rgba(245, 240, 232, 0.76);
  backdrop-filter: blur(14px);
  transition:
    border-color 0.28s ease,
    background-color 0.28s ease,
    color 0.28s ease,
    transform 0.28s ease;
}

.autoplay-toggle::after {
  content: '';
  position: absolute;
  inset: 0.55rem;
  border: 1px solid rgba(228, 185, 109, 0.22);
  border-radius: inherit;
  opacity: 0;
  pointer-events: none;
  transform: scale(1);
}

.autoplay-toggle.is-running::after {
  animation: autoplayRing 2.2s ease-out infinite;
}

.autoplay-toggle:hover,
.autoplay-toggle:focus-visible {
  border-color: rgba(201, 150, 59, 0.44);
  background: rgba(201, 150, 59, 0.1);
  color: var(--color-gold-300);
  transform: translateY(-1px);
}

.autoplay-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.autoplay-dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 9999px;
  background: var(--color-gold-300);
  box-shadow: 0 0 18px rgba(201, 150, 59, 0.48);
  animation: autoplayPulse 1.8s ease-in-out infinite;
}

.autoplay-dot.is-paused {
  background: rgba(245, 240, 232, 0.38);
  box-shadow: none;
  animation: none;
}

.autoplay-toggle:disabled .autoplay-dot {
  background: rgba(245, 240, 232, 0.3);
}

.slider-btn {
  position: absolute;
  top: 50%;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  transform: translateY(-50%);
  border-radius: 9999px;
  border: 1px solid rgba(201, 150, 59, 0.18);
  background: rgba(10, 9, 8, 0.42);
  color: rgba(245, 240, 232, 0.82);
  backdrop-filter: blur(12px);
  transition:
    border-color 0.28s ease,
    background-color 0.28s ease,
    color 0.28s ease,
    transform 0.28s ease;
}

.slider-btn:hover {
  border-color: rgba(201, 150, 59, 0.42);
  color: var(--color-gold-300);
  background: rgba(201, 150, 59, 0.08);
}

.hero-text-enter-active,
.hero-card-enter-active {
  transition:
    opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-text-leave-active,
.hero-card-leave-active {
  transition: opacity 0.3s ease;
}

.hero-text-enter-from,
.hero-card-enter-from {
  opacity: 0;
  transform: translateY(18px);
}

.hero-text-leave-to,
.hero-card-leave-to {
  opacity: 0;
}

@keyframes heroLightWake {
  0% {
    opacity: 0.1;
    transform: translate3d(-2rem, 0, 0) scale(1);
  }

  100% {
    opacity: 0.28;
    transform: translate3d(2rem, -1rem, 0) scale(1.03);
  }
}

@keyframes heroPatternDrift {
  0% {
    transform: translate3d(0, 0, 0);
  }

  100% {
    transform: translate3d(42px, 42px, 0);
  }
}

@keyframes heroImageBreathe {
  0% {
    transform: scale(1);
  }

  100% {
    transform: scale(1.026);
  }
}

@keyframes autoplayPulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.38);
  }
}

@keyframes autoplayRing {
  0% {
    opacity: 0.44;
    transform: scale(0.72);
  }

  100% {
    opacity: 0;
    transform: scale(2.15);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-light-sweep,
  .hero-pattern,
  .hero-image-breathe,
  .autoplay-toggle::after,
  .autoplay-dot {
    animation: none;
  }

  .hero-light-sweep {
    opacity: 0.12;
    transform: none;
  }

  .hero-image-breathe {
    transform: none;
  }
}

</style>
