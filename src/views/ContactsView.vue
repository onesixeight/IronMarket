<template>
  <div class="section-shell py-12 lg:py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <AppBreadcrumb :items="[{ to: '/', label: 'Главная' }, { label: 'Контакты' }]" />

      <div class="grid gap-8 xl:grid-cols-[0.95fr_1.05fr] xl:items-start">
        <div class="surface-panel rounded-[2rem] p-6 sm:p-8 lg:p-10" v-reveal>
          <div class="eyebrow mb-5">Астана • Казахстан</div>
          <h1 class="section-title text-3xl sm:text-4xl lg:text-5xl leading-tight">Обсудим проект, объём заказа или подбор элементов.</h1>
          <p class="section-lead mt-5 max-w-xl text-sm sm:text-base">
            Если нужен расчёт, консультация по каталогу или подбор позиций под объект, напишите или позвоните. Поможем быстро сориентироваться.
          </p>

          <div class="mt-8 grid gap-4">
            <div class="contact-card">
              <div class="contact-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/>
                </svg>
              </div>
              <div>
                <div class="text-xs uppercase tracking-[0.18em] text-gold-300 mb-2">Телефон</div>
                <a href="tel:+77758537092" class="text-cream-100 text-lg font-semibold hover:text-gold-300 transition-colors">+7 775 853 70 92</a>
                <p class="text-sm text-cream-100/48 mt-2">Быстро подскажем по наличию, количеству и подбору позиций.</p>
              </div>
            </div>

            <div class="contact-card">
              <div class="contact-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
                </svg>
              </div>
              <div>
                <div class="text-xs uppercase tracking-[0.18em] text-gold-300 mb-2">Email</div>
                <a href="mailto:etalonkovka@mail.ru" class="text-cream-100 text-lg font-semibold hover:text-gold-300 transition-colors">etalonkovka@mail.ru</a>
                <p class="text-sm text-cream-100/48 mt-2">Подойдёт для спецификаций, запросов по объёму и коммерческих предложений.</p>
              </div>
            </div>

            <div class="contact-card">
              <div class="contact-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <div class="text-xs uppercase tracking-[0.18em] text-gold-300 mb-2">Режим работы</div>
                <div class="grid gap-1 text-sm text-cream-100/62">
                  <div>Пн-Вс: 9:00-18:00</div>
                  <div>Без выходных</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid gap-6">
          <div class="surface-panel rounded-[2rem] p-6 sm:p-8 lg:p-10" v-reveal="0.08">
            <div class="eyebrow mb-5">Форма связи</div>
            <h2 class="section-title text-2xl sm:text-3xl">Напишите, что именно вы подбираете.</h2>
            <p class="section-lead mt-4 text-sm sm:text-base">
              Чем точнее задача, тем быстрее подскажем категории, позиции и сценарий заказа.
            </p>

            <div class="mt-8 rounded-[1.5rem] border border-gold-400/10 bg-gold-400/4 p-5 sm:p-6">
              <ContactForm
                button-text="Отправить сообщение"
                :show-email="true"
                :show-message="true"
                name-placeholder="Ваше имя"
                :dark="true"
              />
            </div>
          </div>

          <div class="surface-panel rounded-[2rem] p-6 sm:p-8" v-reveal="0.12">
            <div class="text-xs uppercase tracking-[0.18em] text-gold-300 mb-3">Для монтажников и строителей</div>
            <h3 class="font-heading text-2xl text-cream-100">Если нужен не один элемент, а понятный набор под объект — это тоже к нам.</h3>
            <p class="text-sm text-cream-100/58 leading-relaxed mt-4 max-w-2xl">
              Подскажем, как собрать визуально чистую композицию и какие позиции лучше взять в связке, чтобы заказ выглядел цельно.
            </p>
          </div>

          <div class="surface-panel rounded-[2rem] p-6 sm:p-8" v-reveal="0.16">
            <div class="text-xs uppercase tracking-[0.18em] text-gold-300 mb-3">Адрес</div>
            <h3 class="font-heading text-2xl text-cream-100">Астана, просп. Богенбай Батыра, 6/4</h3>
            <p class="text-sm text-cream-100/58 leading-relaxed mt-4">
              Можно заранее написать или позвонить, чтобы мы подготовили ориентиры по наличию и подбору позиций под ваш проект.
            </p>

            <div class="mt-6 overflow-hidden rounded-[1.5rem] border border-gold-400/12 bg-obsidian-950/72 shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
              <iframe
                src="https://yandex.ru/map-widget/v1/?text=%D0%90%D1%81%D1%82%D0%B0%D0%BD%D0%B0%2C%20%D0%BF%D1%80%D0%BE%D1%81%D0%BF.%20%D0%91%D0%BE%D0%B3%D0%B5%D0%BD%D0%B1%D0%B0%D0%B9%20%D0%91%D0%B0%D1%82%D1%8B%D1%80%D0%B0%2C%206%2F4&z=17"
                title="Карта: Астана, просп. Богенбай Батыра, 6/4"
                class="h-[320px] w-full border-0 sm:h-[380px]"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                allowfullscreen
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import ContactForm from '../components/ContactForm.vue'
import { useSeo } from '../composables/useSeo'
import AppBreadcrumb from '../components/AppBreadcrumb.vue'

useSeo(
  'Контакты',
  'Свяжитесь с Эталон Ковка: телефон, email и форма запроса для подбора кованых элементов и комплектующих.'
)
</script>

<style scoped>
.contact-card {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1.25rem;
  border-radius: 1.5rem;
  border: 1px solid rgba(201, 150, 59, 0.1);
  background: rgba(10, 9, 8, 0.38);
}

.contact-icon {
  width: 3rem;
  height: 3rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  border: 1px solid rgba(201, 150, 59, 0.12);
  background: rgba(201, 150, 59, 0.08);
  color: var(--color-gold-300);
}
</style>
