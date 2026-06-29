<template>
  <section class="section-shell py-20 lg:py-28">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-10 text-center" v-reveal>
        <div class="eyebrow mb-5 mx-auto">FAQ</div>
        <h2 class="section-title text-3xl sm:text-4xl">Коротко о заказе без корзины и оплаты.</h2>
        <p class="section-lead mx-auto mt-4 max-w-2xl text-sm sm:text-base">
          Для кованых элементов важнее задача, размеры и количество, поэтому сайт ведёт к живой заявке, а не к случайной покупке в один клик.
        </p>
      </div>

      <div class="space-y-3" v-reveal="0.08">
        <details
          v-for="(item, index) in faqItems"
          :key="item.question"
          class="faq-item group"
          :open="index === 0"
        >
          <summary class="faq-summary">
            <span>{{ item.question }}</span>
            <span class="faq-mark" aria-hidden="true">+</span>
          </summary>
          <p class="faq-answer">{{ item.answer }}</p>
        </details>
      </div>
    </div>
  </section>
</template>

<script setup>
const faqItems = [
  {
    question: 'Почему на сайте нет оплаты онлайн?',
    answer: 'Пока проект работает как витрина и канал заявки. Так безопаснее для первого запуска: клиент уточняет наличие, количество и доставку напрямую, без фальшивой покупки.',
  },
  {
    question: 'Можно ли подобрать элементы без точного артикула?',
    answer: 'Да. Достаточно описать объект: ворота, перила, забор или лестница. Мы подскажем, какие позиции из каталога лучше сочетать между собой.',
  },
  {
    question: 'Что лучше указать в заявке?',
    answer: 'Полезны размеры, примерное количество секций, город доставки и желаемый стиль. Если есть фото или референс, его можно отправить уже в мессенджере.',
  },
  {
    question: 'Доставка остаётся на сайте?',
    answer: 'Да, это информационный раздел. Он помогает понять общий процесс, а точные условия всё равно уточняются по заявке.',
  },
]
</script>

<style scoped>
.faq-item {
  overflow: hidden;
  border-radius: 1.35rem;
  border: 1px solid rgba(201, 150, 59, 0.12);
  background:
    radial-gradient(circle at 10% 0%, rgba(201, 150, 59, 0.09), transparent 32%),
    linear-gradient(180deg, rgba(20, 18, 16, 0.96), rgba(10, 9, 8, 0.97));
}

.faq-summary {
  display: flex;
  cursor: pointer;
  list-style: none;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.2rem 1.35rem;
  font-family: var(--font-heading);
  font-size: 1.2rem;
  color: rgb(248, 241, 224);
}

.faq-summary::-webkit-details-marker {
  display: none;
}

.faq-summary:focus-visible {
  outline: 2px solid rgba(212, 175, 55, 0.72);
  outline-offset: -4px;
}

.faq-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  border-radius: 999px;
  border: 1px solid rgba(201, 150, 59, 0.2);
  color: rgb(212, 175, 55);
  transition: transform 0.25s ease;
}

.faq-item[open] .faq-mark {
  transform: rotate(45deg);
}

.faq-answer {
  max-width: 48rem;
  padding: 0 1.35rem 1.35rem;
  font-size: 0.95rem;
  line-height: 1.7;
  color: rgba(248, 241, 224, 0.58);
}
</style>
