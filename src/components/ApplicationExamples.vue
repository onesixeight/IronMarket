<template>
  <section class="section-shell py-20 lg:py-28">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="application-examples-intro surface-panel rounded-[2rem] p-6 sm:p-8 lg:p-10 mb-14" v-reveal>
        <div class="application-examples-copy">
          <div class="eyebrow mb-5">Где это работает</div>
          <h2 class="section-title text-3xl sm:text-4xl leading-tight">Кованые элементы для частных и коммерческих пространств.</h2>
          <p class="section-lead mt-4 max-w-2xl text-sm sm:text-base">
            Наши изделия помогают собрать цельный образ дома, ограждения или фасада: от спокойной классики до насыщенного декоративного рисунка.
          </p>
        </div>

        <div class="application-examples-points" aria-label="Основные сценарии применения">
          <div v-for="point in introPoints" :key="point.label" class="application-examples-point">
            <span class="application-examples-point-value">{{ point.value }}</span>
            <span class="application-examples-point-label">{{ point.label }}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        <article
          v-for="(item, index) in examples"
          :key="item.title"
          v-reveal
          class="example-card group relative overflow-hidden rounded-[1.75rem] border border-gold-400/10"
          :class="index === 0 ? 'lg:col-span-2' : ''"
        >
          <div :class="index === 0 ? 'aspect-[16/9]' : 'aspect-[4/5]'" class="relative overflow-hidden">
            <img
              :src="item.image"
              :srcset="item.srcset"
              :sizes="index === 0 ? '(min-width: 1024px) 66vw, 100vw' : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'"
              :alt="item.title"
              class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              loading="lazy"
              decoding="async"
              width="1024"
              height="1024"
            />

            <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,5,4,0.08)_0%,rgba(6,5,4,0.28)_40%,rgba(6,5,4,0.88)_100%)]"></div>
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[linear-gradient(180deg,transparent_36%,rgba(201,150,59,0.14)_100%)]"></div>

            <div class="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <div class="flex items-center gap-3 mb-3">
                <span class="w-10 h-[2px] rounded-full bg-gold-400 shadow-[0_0_12px_rgba(201,150,59,0.35)]"></span>
                <span class="text-[10px] font-bold uppercase tracking-[0.22em] text-gold-300/72">
                  {{ String(index + 1).padStart(2, '0') }}
                </span>
              </div>

              <h3 class="text-xl sm:text-2xl text-gold-300 leading-tight">
                {{ item.title }}
              </h3>

              <p class="mt-3 text-sm leading-relaxed text-cream-100/64 max-w-md">
                {{ item.desc }}
              </p>
            </div>
          </div>
        </article>
      </div>

      <div class="flex justify-center mt-12" v-reveal>
        <router-link to="/catalog" class="metal-button">
          Смотреть каталог
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
          </svg>
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
const examples = [
  { image: '/images/examples/app-railings.jpg', title: 'Перила и лестницы', desc: 'Аккуратные композиции для интерьеров и входных групп, где важны ритм, тактильность и статусный силуэт.' },
  { image: '/images/examples/app-fences.jpg', title: 'Заборы и секции', desc: 'Практичные ограждения с декоративными акцентами для частных домов, участков и фасадных линий.' },
  { image: '/images/examples/app-balcony.jpg', title: 'Балконы и фасады', desc: 'Кованые элементы, которые делают экстерьер выразительным и собирают композицию в единый образ.' },
  { image: '/images/examples/app-grilles.jpg', title: 'Решётки и проёмы', desc: 'Функциональные решения для окон и ниш с аккуратным декоративным рисунком.' },
  { image: '/images/examples/app-gates.jpg', title: 'Ворота и калитки', desc: 'От строгих линий до более насыщенных орнаментов — под разные стили и типы объектов.' },
].map((example) => ({
  ...example,
  srcset: buildExampleSrcset(example.image),
}))

function buildExampleSrcset(image) {
  const basePath = image.replace(/\.jpg$/, '')
  return `${basePath}-512w.jpg 512w, ${basePath}-768w.jpg 768w, ${image} 1024w`
}

const introPoints = [
  { value: '01', label: 'Интерьеры' },
  { value: '02', label: 'Ограждения' },
  { value: '03', label: 'Фасады' },
]
</script>

<style scoped>
.application-examples-intro {
  display: grid;
  gap: 2rem;
  align-items: end;
}

.application-examples-copy {
  min-width: 0;
}

.application-examples-points {
  display: grid;
  gap: 0.75rem;
}

.application-examples-point {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 4.25rem;
  padding: 1rem 1.15rem;
  border-radius: 1.1rem;
  border: 1px solid rgba(201, 150, 59, 0.12);
  background: rgba(10, 9, 8, 0.44);
}

.application-examples-point-value {
  font-family: var(--font-heading);
  font-size: 1.75rem;
  line-height: 1;
  color: rgba(212, 175, 55, 0.94);
}

.application-examples-point-label {
  color: rgba(248, 241, 224, 0.5);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-align: right;
  text-transform: uppercase;
}

@media (min-width: 1024px) {
  .application-examples-intro {
    grid-template-columns: minmax(0, 1fr) minmax(17rem, 0.42fr);
  }
}

.example-card {
  background: linear-gradient(180deg, rgba(20, 18, 16, 0.92), rgba(10, 9, 8, 0.96));
  transition: transform 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
}

.example-card:hover {
  transform: translateY(-4px);
  border-color: rgba(201, 150, 59, 0.26);
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.42),
    0 0 24px rgba(201, 150, 59, 0.08);
}
</style>
