<template>
  <footer class="relative overflow-hidden border-t border-gold-400/10 bg-obsidian-950/72">
    <div class="footer-glow absolute inset-0 pointer-events-none opacity-[0.08]"></div>

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <div class="surface-panel rounded-[2rem] px-6 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div class="grid gap-10 lg:grid-cols-[1.35fr_0.9fr_0.9fr_1fr]">
          <div>
            <div class="eyebrow mb-5">{{ CONTACTS.location.region }}</div>
            <h2 class="section-title text-2xl sm:text-3xl leading-tight">Подбираем и поставляем кованые элементы для частных и коммерческих объектов.</h2>
            <p class="section-lead mt-4 max-w-md text-sm sm:text-base">
              Работаем как продавец и поставщик: помогаем выбрать декоративные элементы и комплектуем заказы для ворот, ограждений, лестниц и фасадных решений.
            </p>

            <div class="mt-6 flex flex-wrap gap-3">
              <a :href="CONTACTS.phone.href" class="metal-button">{{ CONTACTS.phone.display }}</a>
              <router-link to="/contacts" class="metal-button-ghost">Написать нам</router-link>
            </div>
          </div>

          <div>
            <h3 class="font-heading text-sm uppercase tracking-[0.18em] text-gold-300 mb-5">Каталог</h3>
            <ul class="space-y-3 text-sm">
              <li v-for="cat in primaryCategories" :key="cat.slug">
                <router-link :to="'/catalog/' + cat.slug" class="footer-link">
                  {{ cat.name }}
                </router-link>
              </li>
            </ul>
          </div>

          <div>
            <h3 class="font-heading text-sm uppercase tracking-[0.18em] text-gold-300 mb-5">Навигация</h3>
            <ul class="space-y-3 text-sm">
              <li><router-link to="/about" class="footer-link">О компании</router-link></li>
              <li><router-link to="/delivery" class="footer-link">Доставка</router-link></li>
              <li><router-link to="/catalog" class="footer-link">Весь каталог</router-link></li>
              <li><router-link to="/contacts" class="footer-link">Контакты</router-link></li>
            </ul>
          </div>

          <div>
            <h3 class="font-heading text-sm uppercase tracking-[0.18em] text-gold-300 mb-5">Контакты</h3>

            <div class="space-y-4 text-sm text-cream-100/70">
              <a :href="CONTACTS.email.href" class="footer-link block">{{ CONTACTS.email.value }}</a>
              <router-link to="/contacts" class="footer-link block leading-relaxed">
                {{ CONTACTS.location.address }}
              </router-link>
              <div>{{ CONTACTS.hours.primary }}</div>
              <div class="text-cream-100/42">{{ CONTACTS.hours.note }}</div>
            </div>

            <div class="mt-6 rounded-[1.25rem] border border-gold-400/12 bg-gold-400/6 p-4">
              <div class="text-xs uppercase tracking-[0.18em] text-gold-300">Для монтажников и строителей</div>
              <p class="text-sm text-cream-100/62 mt-2 leading-relaxed">Подберём позиции под проект и поможем собрать удобную спецификацию.</p>
            </div>
          </div>
        </div>

        <div class="mt-10 pt-6 border-t border-gold-400/10 text-xs text-cream-100/38">
          <span>© {{ year }} Эталон Ковка. Все права защищены.</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { useProductStore } from '../stores/products'
import { CONTACTS } from '../config/contacts.js'

const productStore = useProductStore()
const primaryCategories = productStore.categories.slice(0, 5)
const year = new Date().getFullYear()
</script>

<style scoped>
.footer-glow {
  background:
    radial-gradient(circle at 12% 0%, rgba(201,150,59,0.18), transparent 28%),
    radial-gradient(circle at 88% 20%, rgba(183,118,62,0.14), transparent 24%);
}

.footer-link {
  color: rgba(245, 240, 232, 0.58);
  transition: color 0.28s ease, transform 0.28s ease;
}

.footer-link:hover {
  color: var(--color-gold-300);
  transform: translateX(3px);
}
</style>
