<template>
  <div>
    <HeroSlider />

    <section class="py-24 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16" v-reveal>
          <h2 class="ornament-line font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-iron-900 dark:text-cream-100 mb-4">Каталог продукции</h2>
          <p class="text-iron-600 dark:text-iron-400 max-w-xl mx-auto text-[15px] leading-relaxed">Декоративные кованые элементы и узоры для создания уникальных решений</p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <router-link
            v-for="(cat, i) in categories"
            :key="cat.id"
            :to="'/catalog/' + cat.slug"
            class="group bg-white dark:bg-iron-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 dark:hover:shadow-amber-500/20 hover:-translate-y-1 border border-iron-100/60 dark:border-iron-700/60"
            v-reveal="i * 0.05"
          >
            <div class="p-4 bg-gradient-to-br from-cream-50 to-white dark:from-iron-700 dark:to-iron-800 h-28 flex items-center justify-center">
              <img :src="cat.image" :alt="cat.name" class="max-h-full max-w-full object-contain group-hover:scale-110 group-hover:drop-shadow-md transition-all duration-400" loading="lazy" />
            </div>
            <div class="p-3 text-center border-t border-iron-100/60 dark:border-iron-700/60 bg-white dark:bg-iron-800">
              <h3 class="text-xs font-semibold text-iron-800 dark:text-cream-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug">{{ cat.name }}</h3>
            </div>
          </router-link>
        </div>

        <div class="text-center mt-12">
          <router-link to="/catalog" class="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-600 transition-colors group">
            Весь каталог
            <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
          </router-link>
        </div>
      </div>
    </section>

    <section class="py-24 bg-gradient-to-b from-cream-50 to-white dark:from-iron-900 dark:to-iron-950">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16" v-reveal>
          <h2 class="ornament-line font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-iron-900 dark:text-cream-100 mb-4">Популярные товары</h2>
          <p class="text-iron-600 dark:text-iron-400 text-[15px]">Самые востребованные кованые элементы</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <ProductCard v-for="(p, i) in popularProducts" :key="p.id" :product="p" v-reveal="i * 0.05" />
        </div>
      </div>
    </section>

    <section class="py-24">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16" v-reveal>
          <h2 class="ornament-line font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-iron-900 dark:text-cream-100 mb-4">Почему выбирают нас</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div v-for="(f, i) in features" :key="f.title" class="text-center group" v-reveal="i * 0.08">
            <div class="w-14 h-14 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-800/20 border border-amber-200/60 dark:border-amber-700/40 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-amber-500/20 group-hover:scale-110">
              <span class="text-amber-600 dark:text-amber-400" v-html="f.icon"></span>
            </div>
            <h3 class="font-heading text-lg font-bold text-iron-900 dark:text-cream-100 mb-2 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">{{ f.title }}</h3>
            <p class="text-sm text-iron-600 dark:text-iron-400 leading-relaxed">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-24 bg-gradient-to-br from-iron-900 via-iron-800 to-iron-900 dark:from-iron-950 dark:via-iron-900 dark:to-iron-950 relative overflow-hidden">
      <div class="absolute inset-0 opacity-[0.03]" style="background-image: repeating-linear-gradient(-45deg, transparent, transparent 30px, currentColor 30px, currentColor 31px);"></div>
      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center" v-reveal>
        <h2 class="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-cream-100 mb-4">Станьте дилером</h2>
        <p class="text-iron-300 dark:text-iron-400 mb-10 text-lg leading-relaxed">Подайте заявку и мы предложим взаимовыгодные условия сотрудничества</p>
        <div class="bg-white/5 dark:bg-iron-800/50 backdrop-blur-md border border-white/10 dark:border-iron-700 rounded-2xl p-8 shadow-2xl">
          <ContactForm
            button-text="Отправить заявку"
            name-label="Имя"
            name-placeholder="Как к вам обращаться"
            :dark="true"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import catalog from '../data/catalog.json'
import HeroSlider from '../components/HeroSlider.vue'
import ProductCard from '../components/ProductCard.vue'
import ContactForm from '../components/ContactForm.vue'
import { useSeo } from '../composables/useSeo'

useSeo('Кованые изделия от производителя', 'Декоративные кованые изделия от производителя. Короны, узоры, балясины, решётки и элементы ковки с доставкой по России.')

const categories = catalog.categories
const popularProducts = catalog.products.filter(p => p.badge).slice(0, 4)

const features = [
  { icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17l-5.1-5.1m0 0L11.42 4.97m-5.1 5.1H21"/></svg>', title: 'Собственное производство', desc: 'Производим все изделия сами с 2006 года, контролируя качество на каждом этапе.' },
  { icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>', title: 'Высокое качество', desc: 'Каждое изделие проходит строгий контроль качества перед отправкой.' },
  { icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h.008M21 12.75H3.375m0 0V5.625A1.125 1.125 0 014.5 4.5h15A1.875 1.875 0 0121.375 6.375v8.25"/></svg>', title: 'Доставка по России', desc: 'Быстрая и надёжная доставка транспортными компаниями в любой регион.' },
  { icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>', title: 'Доступные цены', desc: 'Прямые цены от производителя без наценок посредников.' },
]
</script>
