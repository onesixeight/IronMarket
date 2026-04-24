<template>
  <div>
    <div class="py-10">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <AppBreadcrumb :items="[{ to: '/', label: 'Главная' }, { label: 'Доставка и оплата' }]" />

        <div class="text-center mb-16" v-reveal>
          <h1 class="ornament-line font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-cream-50 mb-6">Доставка и оплата</h1>
          <p class="text-cream-100/70 max-w-xl mx-auto text-[15px]">Удобные способы получения и оплаты заказов</p>
        </div>

        <div class="mb-20">
          <div class="text-center mb-10" v-reveal>
            <h2 class="ornament-line font-heading text-2xl sm:text-3xl font-bold text-cream-50 mb-4">Способы доставки</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div
              v-for="(d, i) in deliveryMethods"
              :key="d.title"
              class="group p-7 bg-obsidian-800 border border-obsidian-600/50 rounded-2xl transition-all duration-300 hover:border-gold-400/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-gold-500/10"
              v-reveal="i * 0.08"
            >
              <div class="w-12 h-12 bg-gradient-to-br from-gold-400/20 to-gold-600/10 border border-gold-400/30 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-gold-500/20 group-hover:scale-110">
                <span class="text-gold-400"><component :is="d.icon" /></span>
              </div>
              <h3 class="font-heading text-base font-bold text-cream-50 mb-2 group-hover:text-gold-300 transition-colors">{{ d.title }}</h3>
              <p class="text-sm text-cream-100/60 leading-relaxed mb-4">{{ d.desc }}</p>
              <div class="text-sm font-semibold" :class="d.free ? 'text-gold-400' : 'text-cream-100/70'">{{ d.price }}</div>
            </div>
          </div>
        </div>

        <div class="mb-20">
          <div class="text-center mb-10" v-reveal>
            <h2 class="ornament-line font-heading text-2xl sm:text-3xl font-bold text-cream-50 mb-4">Способы оплаты</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div
              v-for="(p, i) in paymentMethods"
              :key="p.title"
              class="group p-7 bg-obsidian-800 border border-obsidian-600/50 rounded-2xl transition-all duration-300 hover:border-gold-400/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-gold-500/10"
              v-reveal="i * 0.08"
            >
              <div class="w-12 h-12 bg-gradient-to-br from-gold-400/20 to-gold-600/10 border border-gold-400/30 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-gold-500/20 group-hover:scale-110">
                <span class="text-gold-400"><component :is="p.icon" /></span>
              </div>
              <h3 class="font-heading text-base font-bold text-cream-50 mb-2 group-hover:text-gold-300 transition-colors">{{ p.title }}</h3>
              <p class="text-sm text-cream-100/60 leading-relaxed">{{ p.desc }}</p>
            </div>
          </div>
        </div>

        <div>
          <div class="text-center mb-10" v-reveal>
            <h2 class="ornament-line font-heading text-2xl sm:text-3xl font-bold text-cream-50 mb-4">Частые вопросы</h2>
          </div>

          <div class="max-w-3xl mx-auto space-y-4">
            <div
              v-for="(q, i) in faq"
              :key="i"
              class="p-6 bg-obsidian-800 border border-obsidian-600/50 rounded-2xl"
              v-reveal="i * 0.06"
            >
              <h3 class="font-heading text-base font-bold text-cream-50 mb-2">{{ q.q }}</h3>
              <p class="text-sm text-cream-100/60 leading-relaxed">{{ q.a }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <section class="py-20 bg-obsidian-950 relative overflow-hidden">
      <div class="diagonal-lines absolute inset-0 opacity-[0.03]"></div>
      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center" v-reveal>
        <h2 class="font-heading text-2xl sm:text-3xl font-bold text-cream-50 mb-4">Остались вопросы?</h2>
        <p class="text-cream-100/60 mb-8 text-[15px]">Свяжитесь с нами, и мы поможем выбрать оптимальный способ доставки</p>
        <router-link to="/contacts" class="shimmer inline-flex items-center gap-2 bg-gradient-to-r from-gold-500 to-gold-400 text-obsidian-900 px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 hover:shadow-lg hover:shadow-gold-500/25">
          Связаться с нами
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { h } from 'vue'
import { useSeo } from '../composables/useSeo'
import AppBreadcrumb from '../components/AppBreadcrumb.vue'
useSeo('Доставка и оплата', 'Способы доставки и оплаты кованых изделий. Транспортные компании, самовывоз, курьерская доставка.')

const IconExchange = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'stroke-width': '1.5' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5' })
])
const IconPin = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'stroke-width': '1.5' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z' }),
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z' })
])
const IconTruck = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'stroke-width': '1.5' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h.008M21 12.75H3.375m0 0V5.625A1.125 1.125 0 014.5 4.5h15A1.875 1.875 0 0121.375 6.375v8.25' })
])
const IconCash = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'stroke-width': '1.5' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z' })
])
const IconCard = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'stroke-width': '1.5' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z' })
])
const IconGlobe = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'stroke-width': '1.5' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418' })
])

const deliveryMethods = [
  {
    title: 'Транспортная компания',
    desc: 'Доставка до терминала ТК в вашем городе.',
    price: 'По тарифу ТК',
    free: false,
    icon: IconExchange,
  },
  {
    title: 'Самовывоз',
    desc: 'Заберите заказ самостоятельно со склада. Предварительно уточните наличие.',
    price: 'Бесплатно',
    free: true,
    icon: IconPin,
  },
  {
    title: 'Курьерская доставка',
    desc: 'Доставка до двери. Удобно для крупных заказов и массивных изделий.',
    price: 'По тарифу',
    free: false,
    icon: IconTruck,
  },
]

const paymentMethods = [
  {
    title: 'Наличные',
    desc: 'Оплата наличными при получении заказа или при самовывозе со склада.',
    icon: IconCash,
  },
  {
    title: 'Банковская карта',
    desc: 'Оплата картой онлайн через защищённый платёжный шлюз.',
    icon: IconCard,
  },
  {
    title: 'Банковский перевод',
    desc: 'Перевод на расчётный счёт для юридических и физических лиц.',
    icon: IconGlobe,
  },
]

const faq = [
  { q: 'Сколько стоит доставка?', a: 'Стоимость зависит от города и веса заказа. Самовывоз со склада — бесплатно. Доставка ТК — по тарифу транспортной компании.' },
  { q: 'Какие сроки доставки?', a: 'Сроки зависят от региона. В среднем 3–10 рабочих дней после отгрузки. Точную информацию уточнит менеджер.' },
  { q: 'Можно ли оплатить при получении?', a: 'Да, оплата наличными возможна при самовывозе. При оформлении заказа удаленно, оплата 100%.' },
  { q: 'Возможен ли возврат?', a: 'Да, в течение 14 дней с момента получения. Изделие должно быть в оригинальной упаковке без повреждений.' },
]
</script>

<style scoped>
.diagonal-lines {
  background-image: repeating-linear-gradient(-45deg, transparent, transparent 30px, currentColor 30px, currentColor 31px);
}
</style>
