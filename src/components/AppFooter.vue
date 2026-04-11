<template>
  <footer class="bg-gradient-to-b from-iron-900 to-iron-950 dark:from-iron-950 dark:to-black text-iron-300 dark:text-iron-300 relative overflow-hidden">
    <div class="absolute inset-0 opacity-[0.03]" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 20px, currentColor 20px, currentColor 21px);"></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div>
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 border-2 border-amber-400/40 dark:border-amber-400/30 rounded-sm flex items-center justify-center">
              <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <div class="font-heading text-xl font-bold text-cream-100 dark:text-cream-100 tracking-wide">Ковка</div>
              <div class="text-[9px] text-amber-500/70 dark:text-amber-400/70 tracking-[0.25em] uppercase font-semibold">мастерская</div>
            </div>
          </div>
          <p class="text-sm text-iron-400 dark:text-iron-400 leading-relaxed">
            Производство декоративных кованых изделий с 2006 года.
          </p>
        </div>

        <div>
          <h3 class="font-heading text-base font-bold text-cream-200 dark:text-cream-200 mb-5 tracking-wide">Каталог</h3>
          <ul class="space-y-2.5">
            <li v-for="cat in categories.slice(0, 6)" :key="cat.slug">
              <router-link :to="'/catalog/' + cat.slug" class="text-sm text-iron-400 dark:text-iron-400 hover:text-amber-400 dark:hover:text-amber-400 transition-colors">
                {{ cat.name }}
              </router-link>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="font-heading text-base font-bold text-cream-200 dark:text-cream-200 mb-5 tracking-wide">Информация</h3>
          <ul class="space-y-2.5">
            <li><router-link to="/about" class="text-sm text-iron-400 dark:text-iron-400 hover:text-amber-400 dark:hover:text-amber-400 transition-colors">О компании</router-link></li>
            <li><router-link to="/delivery" class="text-sm text-iron-400 dark:text-iron-400 hover:text-amber-400 dark:hover:text-amber-400 transition-colors">Доставка и оплата</router-link></li>
            <li><router-link to="/contacts" class="text-sm text-iron-400 dark:text-iron-400 hover:text-amber-400 dark:hover:text-amber-400 transition-colors">Контакты</router-link></li>
          </ul>
        </div>

        <div>
          <h3 class="font-heading text-base font-bold text-cream-200 dark:text-cream-200 mb-5 tracking-wide">Контакты</h3>
          <div class="space-y-3 text-sm">
            <a href="tel:+70000000000" class="flex items-center gap-2.5 text-iron-400 dark:text-iron-400 hover:text-amber-400 dark:hover:text-amber-400 transition-colors">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
              +7 (000) 000-00-00
            </a>
            <a href="mailto:info@example.com" class="flex items-center gap-2.5 text-iron-400 dark:text-iron-400 hover:text-amber-400 dark:hover:text-amber-400 transition-colors">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
              info@example.com
            </a>
            <p class="text-iron-500 dark:text-iron-500 text-xs pt-1">Пн-Пт: 9:00 - 18:00</p>
          </div>
        </div>
      </div>

      <div class="border-t border-white/10 dark:border-iron-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-iron-500 dark:text-iron-500">
        <span>&copy; {{ new Date().getFullYear() }} Мастерская ковки. Все права защищены.</span>
        <span class="flex items-center gap-1.5">Сделано с <svg class="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg> и мастерством</span>
      </div>
    </div>
  </footer>
</template>

<script setup>
import catalog from '../data/catalog.json'
const categories = catalog.categories
</script>
