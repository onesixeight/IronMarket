<template>
  <div>
    <div class="py-10">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav class="flex items-center gap-2 text-sm text-obsidian-500 mb-10">
          <router-link to="/" class="hover:text-gold-400 transition-colors">Главная</router-link>
          <span class="text-obsidian-600">/</span>
          <span class="text-cream-100">О компании</span>
        </nav>

        <div class="text-center mb-16" v-reveal>
          <h1 class="ornament-line font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-cream-50 mb-6">О компании</h1>
          <p class="text-cream-100/70 max-w-2xl mx-auto text-[15px] leading-relaxed">
            С 2006 года мы продаём и поставляем кованые элементы для ворот, ограждений, лестниц и фасадных решений. Основное направление компании — Астана, при этом работаем и с заказами по Казахстану.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
          <div
            v-for="(s, i) in stats"
            :key="s.label"
            class="text-center p-8 bg-obsidian-800 border border-obsidian-600/50 rounded-2xl transition-all duration-300 hover:border-gold-400/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-gold-500/10"
            v-reveal="i * 0.08"
          >
            <div class="font-heading text-4xl lg:text-5xl font-bold text-gold-400 mb-3">{{ s.value }}</div>
            <div class="text-xs text-cream-100/50 uppercase tracking-widest font-medium">{{ s.label }}</div>
          </div>
        </div>
      </div>
    </div>

    <section class="py-20 bg-obsidian-800 relative overflow-hidden">
      <div class="absolute inset-0 opacity-[0.02]" style="background-image: repeating-linear-gradient(-45deg, transparent, transparent 30px, currentColor 30px, currentColor 31px);"></div>
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="text-center mb-14" v-reveal>
          <h2 class="ornament-line font-heading text-2xl sm:text-3xl font-bold text-cream-50 mb-6">Наша история</h2>
        </div>

        <div class="max-w-3xl mx-auto space-y-6 text-cream-100/70 text-[15px] leading-relaxed" v-reveal>
          <p>
            Мы не являемся производителем. Наша задача — собрать сильный ассортимент кованых элементов, помочь с выбором и предложить понятную поставку для частных заказчиков, монтажников и дилеров.
          </p>
          <p>
            Делаем упор на удобный каталог, понятную консультацию и подбор позиций под конкретный объект. Если нужен не один элемент, а комплект под ворота, ограждение, лестницу или фасад, поможем собрать заказ логично и без лишних позиций.
          </p>
        </div>
      </div>
    </section>

    <section class="py-20">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-14" v-reveal>
          <h2 class="ornament-line font-heading text-2xl sm:text-3xl font-bold text-cream-50 mb-6">Наши ценности</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="(v, i) in values"
            :key="v.title"
            class="group p-8 bg-obsidian-800 border border-obsidian-600/50 rounded-2xl text-center transition-all duration-300 hover:border-gold-400/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-gold-500/10"
            v-reveal="i * 0.1"
          >
            <div class="w-14 h-14 bg-gradient-to-br from-gold-400/20 to-gold-600/10 border border-gold-400/30 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-gold-500/20 group-hover:scale-110">
              <span class="text-gold-400" v-html="v.icon"></span>
            </div>
            <h3 class="font-heading text-lg font-bold text-cream-50 mb-3 group-hover:text-gold-300 transition-colors">{{ v.title }}</h3>
            <p class="text-sm text-cream-100/50 leading-relaxed">{{ v.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-20 bg-obsidian-950 relative overflow-hidden">
      <div class="absolute inset-0 opacity-[0.03]" style="background-image: repeating-linear-gradient(-45deg, transparent, transparent 30px, currentColor 30px, currentColor 31px);"></div>
      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center" v-reveal>
        <h2 class="font-heading text-3xl sm:text-4xl font-bold text-cream-50 mb-4">Свяжитесь с нами</h2>
        <p class="text-cream-100/50 mb-10 text-[15px]">Оставьте заявку и мы перезвоним в ближайшее время</p>
        <div class="bg-obsidian-800/80 backdrop-blur-md border border-obsidian-600/50 rounded-2xl p-8 shadow-2xl">
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
import ContactForm from '../components/ContactForm.vue'
import { useSeo } from '../composables/useSeo'
useSeo('О компании', 'Продажа и поставка декоративных кованых элементов в Астане и по Казахстану. Помогаем с подбором позиций под объект и объём заказа.')

const stats = [
  { value: '18+', label: 'Лет опыта' },
  { value: '5000+', label: 'Изделий' },
  { value: '10+', label: 'Категорий' },
  { value: 'KZ', label: 'География' },
]

const values = [
  {
    title: 'Качество',
    desc: 'Каждое изделие проходит строгий контроль качества перед отправкой заказчику.',
    icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>',
  },
  {
    title: 'Надёжность',
    desc: 'Работаем с понятным ассортиментом и поставкой, поэтому помогаем быстро собирать заказ без путаницы по позициям.',
    icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17l-5.1-5.1m0 0L11.42 4.97m-5.1 5.1H21"/></svg>',
  },
  {
    title: 'Индивидуальный подход',
    desc: 'Поможем подобрать идеальное решение под ваш проект и бюджет.',
    icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>',
  },
]
</script>
