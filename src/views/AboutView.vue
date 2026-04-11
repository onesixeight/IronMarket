<template>
  <div>
    <div class="py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav class="flex items-center gap-2 text-sm text-iron-400 mb-8">
          <router-link to="/" class="hover:text-gold-500 transition-colors">Главная</router-link>
          <span>/</span>
          <span class="text-iron-700">О компании</span>
        </nav>

        <div class="mb-12" v-reveal>
          <h1 class="ornament-line font-heading text-3xl sm:text-4xl font-semibold text-iron-900 mb-8">О компании</h1>

          <p class="text-iron-600 leading-relaxed text-[15px] mb-8">
            Мы — производственная компания, специализирующаяся на изготовлении высококлассных декоративных кованых изделий, элементов и узоров.
            С 2006 года мы помогаем клиентам создавать уникальные кованые решения для заборов, ворот, лестниц и ограждений.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 my-12">
            <div v-for="(s, i) in stats" :key="s.label" class="text-center p-6 bg-cream-50/80 rounded-xl border border-iron-100/40" v-reveal="i * 0.08">
              <div class="text-3xl font-heading font-bold text-gold-600 mb-1">{{ s.value }}</div>
              <div class="text-xs text-iron-500 uppercase tracking-wider">{{ s.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <section class="py-16 bg-cream-50">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-10" v-reveal>
          <h2 class="ornament-line font-heading text-2xl font-semibold text-iron-900 mb-4">Наша миссия</h2>
        </div>
        <p class="text-iron-600 leading-relaxed text-[15px] text-center max-w-2xl mx-auto">
          Сделать ковку доступной для каждого. Мы верим, что каждый человек может стать художником собственного пространства,
          создавая уникальные кованые решения для своего дома. Наши компоненты позволяют вам самим решать, как будет выглядеть ваш забор,
          лестница или ворота.
        </p>
      </div>
    </section>

    <section class="py-16">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-10" v-reveal>
          <h2 class="ornament-line font-heading text-2xl font-semibold text-iron-900 mb-4">Преимущества</h2>
        </div>
        <div class="space-y-3">
          <div v-for="(a, i) in advantages" :key="a.title" class="flex gap-4 p-5 bg-white rounded-xl border border-iron-100/60" v-reveal="i * 0.06">
            <div class="w-10 h-10 bg-gold-50 border border-gold-200/50 rounded-xl flex items-center justify-center shrink-0">
              <span class="text-gold-600 font-bold text-sm">{{ i + 1 }}</span>
            </div>
            <div>
              <h3 class="font-medium text-iron-800 mb-1 text-sm">{{ a.title }}</h3>
              <p class="text-sm text-iron-400 leading-relaxed">{{ a.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-20 bg-iron-900 relative overflow-hidden">
      <div class="absolute inset-0 opacity-[0.02]" style="background-image: repeating-linear-gradient(-45deg, transparent, transparent 30px, currentColor 30px, currentColor 31px);"></div>
      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center" v-reveal>
        <h2 class="font-heading text-3xl sm:text-4xl font-semibold text-cream-100 mb-4">Станьте нашим дилером</h2>
        <p class="text-iron-400 mb-8 text-[15px]">Мы всегда открыты для сотрудничества и готовы предложить взаимовыгодные условия.</p>
        <router-link to="/contacts" class="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-iron-900 px-8 py-3 rounded-xl font-semibold transition-all duration-200">
          Связаться с нами
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useSeo } from '../composables/useSeo'
useSeo('О компании', 'Производственная компания по изготовлению декоративных кованых изделий с 2006 года.')

const stats = [
  { value: '18+', label: 'Лет на рынке' },
  { value: '90+', label: 'Видов продукции' },
  { value: '5000+', label: 'Довольных клиентов' },
]

const advantages = [
  { title: 'Собственное производство', desc: 'Мы производим все изделия сами, контролируя качество на каждом этапе.' },
  { title: 'Огромный ассортимент', desc: 'Декоративные элементы ковки для ворот, заборов, лестниц, входных дверей, каминов и других конструкций.' },
  { title: 'Быстрая доставка', desc: 'Доставка по всей России транспортными компаниями. Надёжная упаковка.' },
  { title: 'Доступные цены', desc: 'Прямые цены от производителя без наценок посредников.' },
]
</script>
