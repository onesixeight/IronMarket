<template>
  <div class="min-h-[60vh] flex items-center justify-center">
    <div class="text-center animate-fade-up">
      <div class="w-20 h-20 mx-auto bg-cream-50 border border-iron-100/40 rounded-2xl flex items-center justify-center mb-6">
        <svg class="w-10 h-10 text-iron-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h1 class="font-heading text-3xl font-semibold text-iron-900 mb-3">Страница не найдена</h1>
      <p class="text-iron-400 mb-8 text-[15px]">Запрашиваемая страница не существует или была удалена</p>
      <div class="flex items-center justify-center gap-3">
        <router-link to="/" class="inline-flex items-center gap-2 bg-iron-900 hover:bg-gold-600 text-cream-100 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>
          На главную
        </router-link>
        <router-link to="/catalog" class="inline-flex items-center gap-2 text-sm font-medium text-gold-600 hover:text-gold-500 transition-colors">
          Каталог
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
        </router-link>
      </div>
    </div>
  </div>
</template>
