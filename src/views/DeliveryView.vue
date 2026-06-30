<template>
  <div>
    <div class="section-shell py-12 lg:py-16">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <AppBreadcrumb :items="[{ to: '/', label: 'Главная' }, { label: 'Доставка и заявка' }]" />

        <div class="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div v-reveal>
            <div class="eyebrow mb-5">Астана • Казахстан</div>
            <h1 class="section-title text-3xl sm:text-4xl lg:text-5xl leading-tight">
              Доставка и заявка без лишней онлайн-оплаты.
            </h1>
            <p class="section-lead mt-5 max-w-xl text-sm sm:text-base">
              Сайт работает как витрина и канал заявки. Мы сначала уточняем город, объём, вес и состав заказа, а затем подбираем удобный способ доставки.
            </p>

            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <router-link :to="deliveryInquiryRoute" class="metal-button justify-center">
                Уточнить доставку
              </router-link>
              <router-link to="/catalog" class="metal-button-ghost justify-center">
                Смотреть каталог
              </router-link>
            </div>
          </div>

          <div class="surface-panel rounded-[2rem] p-5 sm:p-6 lg:p-8" v-reveal="0.08">
            <div class="text-xs uppercase tracking-[0.2em] text-gold-300/72">Что лучше написать</div>
            <div class="mt-5 grid gap-3">
              <div v-for="item in deliveryChecklist" :key="item" class="check-row">
                <span class="check-mark" aria-hidden="true">✓</span>
                <span>{{ item }}</span>
              </div>
            </div>
          </div>
        </div>

        <section class="mt-16 lg:mt-20">
          <div class="mb-10 text-center" v-reveal>
            <div class="eyebrow mb-5 mx-auto">Варианты доставки</div>
            <h2 class="section-title text-3xl sm:text-4xl">Подбираем способ после заявки.</h2>
            <p class="section-lead mx-auto mt-4 max-w-2xl text-sm sm:text-base">
              Для кованых элементов важны габариты, вес и упаковка. Поэтому условия доставки честно уточняются под конкретный заказ.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
            <article
              v-for="(method, index) in deliveryMethods"
              :key="method.title"
              class="delivery-card group"
              v-reveal="index * 0.08"
            >
              <div class="delivery-icon">
                <component :is="method.icon" />
              </div>
              <h3 class="font-heading text-xl text-cream-100">{{ method.title }}</h3>
              <p class="mt-3 text-sm leading-relaxed text-cream-100/58">{{ method.desc }}</p>
              <div class="mt-5 rounded-full border border-gold-400/12 bg-gold-400/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">
                {{ method.note }}
              </div>
            </article>
          </div>
        </section>

        <section class="mt-16 lg:mt-20">
          <div class="mb-10 text-center" v-reveal>
            <div class="eyebrow mb-5 mx-auto">Как это работает</div>
            <h2 class="section-title text-3xl sm:text-4xl">Сначала понятная заявка, потом точные условия.</h2>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <article
              v-for="(step, index) in deliverySteps"
              :key="step.title"
              class="flow-card"
              v-reveal="index * 0.08"
            >
              <div class="flow-index">{{ step.number }}</div>
              <h3 class="mt-5 font-heading text-xl text-cream-100">{{ step.title }}</h3>
              <p class="mt-3 text-sm leading-relaxed text-cream-100/56">{{ step.desc }}</p>
            </article>
          </div>
        </section>

        <section class="mt-16 lg:mt-20">
          <div class="surface-panel rounded-[2rem] p-6 sm:p-8 lg:p-10" v-reveal>
            <div class="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div>
                <div class="eyebrow mb-5">Частые вопросы</div>
                <h2 class="section-title text-3xl sm:text-4xl leading-tight">Что нужно знать перед доставкой.</h2>
                <p class="section-lead mt-4 text-sm sm:text-base">
                  Мы не прячем условия в корзине: лучше уточнить всё в заявке и избежать сюрпризов по габаритам или маршруту.
                </p>
              </div>

              <div class="space-y-3">
                <details v-for="item in faq" :key="item.q" class="delivery-faq">
                  <summary>
                    <span>{{ item.q }}</span>
                    <span class="delivery-faq-toggle" aria-hidden="true">
                      <svg viewBox="0 0 20 20" fill="none">
                        <path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </span>
                  </summary>
                  <p>{{ item.a }}</p>
                </details>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <section class="relative overflow-hidden bg-obsidian-950 py-20">
      <div class="diagonal-lines absolute inset-0 opacity-[0.03]"></div>
      <div class="relative z-10 mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8" v-reveal>
        <h2 class="font-heading text-2xl font-bold text-cream-50 sm:text-3xl">Поможем рассчитать доставку для вашего заказа.</h2>
        <p class="mb-8 mt-4 text-[15px] text-cream-100/60">
          Откройте форму с готовым текстом заявки. Останется указать город, позиции и примерный объём.
        </p>
        <router-link :to="deliveryInquiryRoute" class="metal-button justify-center">
          Уточнить доставку
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { h } from 'vue'
import { useSeo } from '../composables/useSeo'
import AppBreadcrumb from '../components/AppBreadcrumb.vue'

useSeo(
  'Доставка и заявка',
  'Как уточнить доставку кованых элементов по Астане и Казахстану: заявка, самовывоз, транспортная компания и курьерская доставка.'
)

const deliveryInquiryRoute = { path: '/contacts', query: { topic: 'delivery' } }

const IconExchange = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'stroke-width': '1.5' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5' }),
])
const IconPin = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'stroke-width': '1.5' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z' }),
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z' }),
])
const IconTruck = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'stroke-width': '1.5' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h.008M21 12.75H3.375m0 0V5.625A1.125 1.125 0 014.5 4.5h15A1.875 1.875 0 0121.375 6.375v8.25' }),
])

const deliveryChecklist = [
  'город доставки или самовывоз из Астаны',
  'какие элементы интересуют и примерное количество',
  'есть ли ограничения по срокам или объекту',
  'нужна ли помощь с подбором аналогов',
  'оплата через Kaspi после подтверждения наличия, количества и доставки',
]

const deliveryMethods = [
  {
    title: 'Транспортная компания',
    desc: 'Подходит для отправки по Казахстану. После заявки уточняем город, объём и удобный терминал.',
    note: 'по тарифу ТК',
    icon: IconExchange,
  },
  {
    title: 'Самовывоз',
    desc: 'Можно забрать позиции самостоятельно после подтверждения наличия и комплектации.',
    note: 'по договорённости',
    icon: IconPin,
  },
  {
    title: 'Курьерская доставка',
    desc: 'Актуальна для Астаны и отдельных крупных заказов, когда важно доставить элементы до объекта.',
    note: 'после уточнения',
    icon: IconTruck,
  },
]

const deliverySteps = [
  {
    number: '01',
    title: 'Оставляете заявку',
    desc: 'Указываете город, примерный объём и элементы, которые смотрите в каталоге.',
  },
  {
    number: '02',
    title: 'Уточняем комплектацию',
    desc: 'Проверяем позиции, предлагаем аналоги при необходимости и понимаем габариты заказа.',
  },
  {
    number: '03',
    title: 'Согласуем доставку',
    desc: 'Подбираем удобный способ отправки или самовывоза и объясняем дальнейшие шаги.',
  },
]

const faq = [
  {
    q: 'Сколько стоит доставка?',
    a: 'Стоимость зависит от города, веса, объёма и выбранного способа доставки. Точную сумму лучше считать после заявки.',
  },
  {
    q: 'Какие сроки доставки?',
    a: 'Сроки зависят от региона и наличия позиций. Мы уточняем это после того, как понимаем состав заказа.',
  },
  {
    q: 'Можно ли забрать самостоятельно?',
    a: 'Да, самовывоз возможен после предварительного сообщения или звонка, чтобы мы подтвердили наличие и подготовили позиции.',
  },
  {
    q: 'Почему нет онлайн-оплаты на сайте?',
    a: 'Первый запуск работает как витрина и канал заявки. Для кованых элементов важнее сначала уточнить состав, количество и доставку. Оплата производится через Kaspi после подтверждения наличия, количества и доставки.',
  },
]
</script>

<style scoped>
.check-row {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  border-radius: 1rem;
  border: 1px solid rgba(201, 150, 59, 0.1);
  background: rgba(10, 9, 8, 0.42);
  padding: 0.9rem 1rem;
  color: rgba(248, 241, 224, 0.68);
  font-size: 0.9rem;
  line-height: 1.55;
}

.check-mark {
  color: rgb(212, 175, 55);
  font-weight: 800;
}

.delivery-card,
.flow-card {
  min-height: 100%;
  border-radius: 1.75rem;
  border: 1px solid rgba(201, 150, 59, 0.1);
  background:
    radial-gradient(circle at 16% 0%, rgba(201, 150, 59, 0.11), transparent 34%),
    linear-gradient(180deg, rgba(20, 18, 16, 0.96), rgba(10, 9, 8, 0.97));
  padding: 1.5rem;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.delivery-card:hover,
.flow-card:hover {
  transform: translateY(-3px);
  border-color: rgba(201, 150, 59, 0.28);
  box-shadow: 0 20px 44px rgba(0, 0, 0, 0.32);
}

.delivery-icon,
.flow-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  border: 1px solid rgba(201, 150, 59, 0.16);
  background: rgba(201, 150, 59, 0.08);
  color: rgb(212, 175, 55);
}

.delivery-icon {
  margin-bottom: 1rem;
}

.flow-index {
  font-family: var(--font-heading);
  font-size: 1.15rem;
}

.delivery-faq {
  overflow: hidden;
  border-radius: 1.1rem;
  border: 1px solid rgba(201, 150, 59, 0.1);
  background: rgba(10, 9, 8, 0.38);
}

.delivery-faq summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  cursor: pointer;
  list-style: none;
  padding: 1rem 1.1rem;
  font-family: var(--font-heading);
  color: rgb(248, 241, 224);
}

.delivery-faq summary::-webkit-details-marker {
  display: none;
}

.delivery-faq summary > span:first-child {
  min-width: 0;
}

.delivery-faq-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  border: 1px solid rgba(201, 150, 59, 0.18);
  border-radius: 999px;
  background: rgba(201, 150, 59, 0.08);
  color: rgb(228, 185, 109);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: transform 0.24s ease, border-color 0.24s ease, background 0.24s ease;
}

.delivery-faq-toggle svg {
  width: 1rem;
  height: 1rem;
  transition: transform 0.24s ease;
}

.delivery-faq[open] .delivery-faq-toggle {
  border-color: rgba(201, 150, 59, 0.34);
  background: rgba(201, 150, 59, 0.16);
}

.delivery-faq[open] .delivery-faq-toggle svg {
  transform: rotate(180deg);
}

.delivery-faq p {
  padding: 0 1.1rem 1.1rem;
  color: rgba(248, 241, 224, 0.58);
  font-size: 0.9rem;
  line-height: 1.65;
}

.diagonal-lines {
  background-image: repeating-linear-gradient(-45deg, transparent, transparent 30px, currentColor 30px, currentColor 31px);
}
</style>
