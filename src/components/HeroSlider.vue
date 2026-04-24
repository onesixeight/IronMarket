<template>
  <section
    class="relative min-h-[720px] lg:min-h-[780px] xl:h-[92vh] xl:max-h-[980px] overflow-hidden"
    @mouseenter="pause"
    @mouseleave="resume"
  >
    <div
      v-for="(slide, i) in slides"
      :key="slide.title"
      class="absolute inset-0 transition-opacity duration-1000 ease-in-out"
      :class="current === i ? 'opacity-100 z-10' : 'opacity-0 z-0'"
    >
      <img
        :src="slide.image"
        :alt="slide.title"
        class="w-full h-full object-cover"
        :class="current === i ? 'hero-zoom' : ''"
        :loading="i === 0 ? 'eager' : 'lazy'"
      />
      <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,5,4,0.94)_0%,rgba(6,5,4,0.72)_45%,rgba(6,5,4,0.44)_100%)]"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,150,59,0.18),transparent_28%)]"></div>
    </div>

    <div class="hero-pattern absolute inset-0 z-20 pointer-events-none opacity-[0.05]"></div>
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

    <div class="absolute bottom-4 sm:bottom-5 lg:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
      <button
        v-for="(_, i) in slides"
        :key="i"
        @click="goTo(i)"
        class="h-2 rounded-full transition-all duration-500"
        :class="current === i ? 'bg-gold-300 w-11 shadow-[0_0_18px_rgba(201,150,59,0.35)]' : 'bg-white/18 w-5 hover:bg-white/34'"
        :aria-label="`Слайд ${i + 1}`"
      />
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const current = ref(0)
const isPaused = ref(false)
let timer = null

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
      { value: '7/6', label: 'дней связи' },
    ],
    image: '/images/hero/hero-ornamental-pattern-v2.png',
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
    image: '/images/hero/hero-ornamental-gate-v2.png',
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
    image: '/images/hero/hero-wrought-iron-fence-v2.png',
  },
]

function next() {
  current.value = (current.value + 1) % slides.length
}

function prev() {
  current.value = (current.value - 1 + slides.length) % slides.length
}

function goTo(i) {
  current.value = i
  resetTimer()
}

function pause() {
  isPaused.value = true
}

function resume() {
  isPaused.value = false
  resetTimer()
}

function resetTimer() {
  clearInterval(timer)
  timer = setInterval(() => {
    if (!isPaused.value) next()
  }, 6500)
}

onMounted(() => {
  resetTimer()
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.hero-pattern {
  background-image: repeating-linear-gradient(45deg, transparent, transparent 42px, rgba(201,150,59,0.14) 42px, rgba(201,150,59,0.14) 43px);
}

.hero-zoom {
  animation: kenBurns 18s ease-out forwards;
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
  transition: all 0.28s ease;
}

.slider-btn:hover {
  border-color: rgba(201, 150, 59, 0.42);
  color: var(--color-gold-300);
  background: rgba(201, 150, 59, 0.08);
}

.hero-text-enter-active,
.hero-card-enter-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
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

@keyframes kenBurns {
  from { transform: scale(1); }
  to { transform: scale(1.08); }
}
</style>
