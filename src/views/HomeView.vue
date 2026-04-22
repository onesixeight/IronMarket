<template>
  <div>
    <HeroSlider />

    <section class="section-shell relative z-20 pt-8 sm:pt-10 pb-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="surface-panel rounded-[2rem] p-5 sm:p-6 lg:p-8">
          <div class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div class="eyebrow mb-4">Подход к проектам</div>
              <h2 class="section-title text-2xl sm:text-3xl leading-tight">Собираем визуально цельные решения, а не просто продаём детали поштучно.</h2>
              <p class="section-lead mt-4 max-w-2xl text-sm sm:text-base">
                Если нужен аккуратный рисунок для ворот, ограждения, лестницы или фасада, помогаем подобрать сочетания элементов так, чтобы металл смотрелся благородно и убедительно.
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div v-for="item in atelierStats" :key="item.label" class="metric-chip">
                <div class="font-heading text-2xl text-gold-300">{{ item.value }}</div>
                <div class="mt-2 text-xs uppercase tracking-[0.18em] text-cream-100/42">{{ item.label }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section-shell py-20 lg:py-28">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-14" v-reveal>
          <div class="max-w-2xl">
            <div class="eyebrow mb-5">Категории</div>
            <h2 class="section-title text-3xl sm:text-4xl">Ключевые группы кованых элементов.</h2>
          </div>
          <p class="section-lead max-w-xl text-sm sm:text-base">
            Быстрый вход в основные направления каталога: от декоративных узоров и балясин до элементов для ворот и секций.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <router-link
            v-for="(cat, i) in featuredCategories"
            :key="cat.id"
            :to="'/catalog/' + cat.slug"
            class="category-card group"
            v-reveal="i * 0.05"
          >
            <div class="flex items-start justify-between gap-4 mb-7">
              <div class="w-14 h-14 rounded-[1.15rem] border border-gold-400/14 bg-gold-400/6 p-2.5">
                <img :src="cat.image" :alt="cat.name" class="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" />
              </div>
              <span class="text-[10px] uppercase tracking-[0.18em] text-gold-300/70">
                {{ String(i + 1).padStart(2, '0') }}
              </span>
            </div>

            <h3 class="font-heading text-xl text-cream-100 leading-tight">{{ cat.name }}</h3>
            <p class="mt-3 text-sm leading-relaxed text-cream-100/56 min-h-[4.5rem]">
              {{ cat.description }}
            </p>

            <div class="mt-6 flex items-center justify-between border-t border-gold-400/10 pt-4">
              <span class="text-xs uppercase tracking-[0.18em] text-cream-100/38">{{ getProductCount(cat.slug) }} позиций</span>
              <span class="inline-flex items-center gap-2 text-sm text-gold-300">
                Смотреть
                <svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                </svg>
              </span>
            </div>
          </router-link>
        </div>
      </div>
    </section>

    <section class="section-shell py-20 lg:py-28">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid gap-10 xl:grid-cols-[0.55fr_1fr] xl:items-start">
          <div v-reveal>
            <div class="eyebrow mb-5">Подборка</div>
            <h2 class="section-title text-3xl sm:text-4xl">Популярные товары для быстрых проектов.</h2>
            <p class="section-lead mt-4 text-sm sm:text-base">
              Часто заказываемые позиции, с которых удобно начинать подбор элементов под ворота, ограждения и декоративные вставки.
            </p>

            <div class="mt-8 flex flex-wrap gap-3">
              <router-link to="/catalog" class="metal-button">Весь каталог</router-link>
              <router-link to="/contacts" class="metal-button-ghost">Нужен совет</router-link>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            <ProductCard
              v-for="(p, i) in popularProducts"
              :key="p.id"
              :product="p"
              v-reveal="i * 0.05"
            />
          </div>
        </div>
      </div>
    </section>

    <ApplicationExamples />

    <section class="section-shell py-20 lg:py-28">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div class="surface-panel rounded-[2rem] p-6 sm:p-8 lg:p-10" v-reveal>
            <div class="eyebrow mb-5">Почему выбирают нас</div>
            <h2 class="section-title text-3xl sm:text-4xl leading-tight">Материал, ритм и композиция работают вместе.</h2>
            <p class="section-lead mt-4 text-sm sm:text-base max-w-xl">
              Мы не перегружаем интерфейс и каталог лишним, а делаем упор на ощущение мастерской: плотные тёмные поверхности, тёплый металл и спокойная премиальная подача.
            </p>

            <div class="mt-8 grid gap-3 sm:grid-cols-2">
              <div v-for="item in principles" :key="item.title" class="rounded-[1.25rem] border border-gold-400/10 bg-obsidian-900/54 p-4">
                <div class="text-xs uppercase tracking-[0.2em] text-gold-300 mb-2">{{ item.kicker }}</div>
                <div class="font-heading text-xl text-cream-100">{{ item.title }}</div>
                <p class="text-sm text-cream-100/56 leading-relaxed mt-2">{{ item.desc }}</p>
              </div>
            </div>
          </div>

          <div class="grid gap-4" v-reveal="0.1">
            <div v-for="feature in features" :key="feature.title" class="feature-card">
              <div class="w-12 h-12 rounded-[1rem] border border-gold-400/12 bg-gold-400/7 flex items-center justify-center shrink-0 text-gold-300" v-html="feature.icon"></div>
              <div>
                <h3 class="font-heading text-2xl text-cream-100">{{ feature.title }}</h3>
                <p class="text-sm text-cream-100/58 leading-relaxed mt-2">{{ feature.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section-shell py-20 lg:py-28">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8" v-reveal>
        <div class="surface-panel rounded-[2rem] p-8 sm:p-10 lg:p-12 text-center">
          <div class="eyebrow mb-5 mx-auto">Сотрудничество</div>
          <h2 class="section-title text-3xl sm:text-4xl lg:text-5xl">Нужен подбор элементов под объект или партию?</h2>
          <p class="section-lead mt-5 max-w-2xl mx-auto text-sm sm:text-base">
            Оставьте заявку, и мы подскажем, как собрать аккуратный и логичный набор позиций под ваш проект.
          </p>

          <div class="mt-10 max-w-2xl mx-auto rounded-[1.75rem] border border-gold-400/12 bg-gold-400/4 p-6 sm:p-8">
            <ContactForm
              button-text="Отправить заявку"
              name-label="Имя"
              name-placeholder="Как к вам обращаться"
              :dark="true"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import catalog from '../data/catalog.json'
import HeroSlider from '../components/HeroSlider.vue'
import ProductCard from '../components/ProductCard.vue'
import ApplicationExamples from '../components/ApplicationExamples.vue'
import ContactForm from '../components/ContactForm.vue'
import { useSeo } from '../composables/useSeo'

useSeo(
  'Кованые элементы в Астане',
  'Декоративные кованые элементы, узоры, балясины и комплектующие с продажей и поставкой в Астане и по Казахстану.'
)

const categories = catalog.categories
const featuredCategories = catalog.categories.slice(0, 8)
const popularProducts = catalog.products.filter(p => p.badge).slice(0, 6)

const atelierStats = [
  { value: '60+', label: 'позиций в каталоге' },
  { value: '20+', label: 'лет в ремесле' },
  { value: 'B2B', label: 'поддержка дилеров' },
]

const principles = [
  {
    kicker: 'Композиция',
    title: 'Никакой случайности',
    desc: 'Подбор элементов строится вокруг общего характера изделия, а не вокруг бессистемной покупки деталей.',
  },
  {
    kicker: 'Практика',
    title: 'Каталог для работы',
    desc: 'Категории и карточки помогают быстро понять, что взять для проекта и как это будет смотреться в композиции.',
  },
]

const features = [
  {
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17l-5.1-5.1m0 0L11.42 4.97m-5.1 5.1H21"/></svg>',
    title: 'Продажа и поставка',
    desc: 'Работаем как поставщик по Астане и Казахстану: держим акцент на понятном каталоге, подборе позиций и аккуратной подаче.',
  },
  {
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>',
    title: 'Премиальное ощущение',
    desc: 'Даже утилитарные позиции в каталоге поданы как часть мастерской среды, а не как случайный прайс-лист.',
  },
  {
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h.008M21 12.75H3.375m0 0V5.625A1.125 1.125 0 014.5 4.5h15A1.875 1.875 0 0121.375 6.375v8.25"/></svg>',
    title: 'Под проект и доставку',
    desc: 'Сайт помогает не только выбрать элемент, но и быстро перейти к обсуждению объёма, задач и комплектации.',
  },
]

function getProductCount(slug) {
  return catalog.products.filter(p => p.categorySlug === slug).length
}
</script>

<style scoped>
.category-card {
  display: block;
  padding: 1.5rem;
  border-radius: 1.75rem;
  border: 1px solid rgba(201, 150, 59, 0.1);
  background: linear-gradient(180deg, rgba(20, 18, 16, 0.96), rgba(10, 9, 8, 0.96));
  transition: transform 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
}

.category-card:hover {
  transform: translateY(-4px);
  border-color: rgba(201, 150, 59, 0.28);
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.42),
    0 0 24px rgba(201, 150, 59, 0.08);
}

.feature-card {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1.5rem;
  border-radius: 1.75rem;
  border: 1px solid rgba(201, 150, 59, 0.1);
  background: linear-gradient(180deg, rgba(20, 18, 16, 0.96), rgba(10, 9, 8, 0.96));
}
</style>
