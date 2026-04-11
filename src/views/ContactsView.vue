<template>
  <div class="py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <nav class="flex items-center gap-2 text-sm text-iron-400 mb-8">
        <router-link to="/" class="hover:text-gold-500 transition-colors">Главная</router-link>
        <span>/</span>
        <span class="text-iron-700">Контакты</span>
      </nav>

      <div class="text-center mb-12" v-reveal>
        <h1 class="ornament-line font-heading text-3xl sm:text-4xl font-semibold text-iron-900 mb-4">Контакты</h1>
        <p class="text-iron-500 max-w-xl mx-auto text-[15px]">Свяжитесь с нами любым удобным способом</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div v-reveal>
          <div class="space-y-5 mb-10">
            <div class="flex items-start gap-4 p-4 bg-white rounded-xl border border-iron-100/60 transition-all duration-200 hover:shadow-sm">
              <div class="w-11 h-11 bg-gold-50 border border-gold-200/50 rounded-xl flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/>
                </svg>
              </div>
              <div>
                <h3 class="font-medium text-iron-800 text-sm mb-1">Телефон</h3>
                <a href="tel:+70000000000" class="text-iron-600 hover:text-gold-600 transition-colors font-heading text-lg">+7 (000) 000-00-00</a>
                <p class="text-xs text-iron-400 mt-1">Пн-Пт: 9:00 - 18:00</p>
              </div>
            </div>

            <div class="flex items-start gap-4 p-4 bg-white rounded-xl border border-iron-100/60 transition-all duration-200 hover:shadow-sm">
              <div class="w-11 h-11 bg-gold-50 border border-gold-200/50 rounded-xl flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
                </svg>
              </div>
              <div>
                <h3 class="font-medium text-iron-800 text-sm mb-1">Email</h3>
                <a href="mailto:info@example.com" class="text-iron-600 hover:text-gold-600 transition-colors font-heading text-lg">info@example.com</a>
                <p class="text-xs text-iron-400 mt-1">Ответим в течение 24 часов</p>
              </div>
            </div>

            <div class="flex items-start gap-4 p-4 bg-white rounded-xl border border-iron-100/60 transition-all duration-200 hover:shadow-sm">
              <div class="w-11 h-11 bg-gold-50 border border-gold-200/50 rounded-xl flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                </svg>
              </div>
              <div>
                <h3 class="font-medium text-iron-800 text-sm mb-1">Адрес</h3>
                <p class="text-iron-600">Укажите ваш адрес</p>
                <p class="text-xs text-iron-400 mt-1">Производство и склад</p>
              </div>
            </div>
          </div>

          <div class="bg-cream-50/80 rounded-xl border border-iron-100/40 p-5">
            <h3 class="font-heading text-base font-semibold text-iron-900 mb-4">Режим работы</h3>
            <div class="space-y-2.5 text-sm">
              <div class="flex justify-between">
                <span class="text-iron-400">Понедельник - Пятница</span>
                <span class="text-iron-700 font-medium">9:00 - 18:00</span>
              </div>
              <div class="flex justify-between">
                <span class="text-iron-400">Суббота</span>
                <span class="text-iron-700 font-medium">10:00 - 15:00</span>
              </div>
              <div class="flex justify-between">
                <span class="text-iron-400">Воскресенье</span>
                <span class="text-iron-300">Выходной</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-iron-100/60 p-6 h-fit" v-reveal="0.1">
          <h2 class="font-heading text-xl font-semibold text-iron-900 mb-6">Напишите нам</h2>
          <ContactForm
            button-text="Отправить сообщение"
            :show-email="true"
            :show-message="true"
            name-placeholder="Ваше имя"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import ContactForm from '../components/ContactForm.vue'
import { useSeo } from '../composables/useSeo'
useSeo('Контакты', 'Свяжитесь с нами — телефон, email, адрес производства. Режим работы и форма обратной связи.')
</script>
