<template>
  <section class="category-request-panel" aria-labelledby="category-request-title">
    <div>
      <div class="eyebrow mb-4">Заявка по категории</div>
      <h2 id="category-request-title" class="font-heading text-2xl sm:text-3xl leading-tight text-cream-100">
        Нужны позиции из этой группы? Отправьте категорию как готовый запрос.
      </h2>
      <p class="mt-3 max-w-2xl text-sm leading-relaxed text-cream-100/58">
        В категории {{ productCount }} позиций. Мы уточним задачу, размеры, количество и подскажем, какие элементы лучше сочетать.
      </p>
    </div>

    <div class="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
      <div class="rounded-[1.25rem] border border-gold-400/10 bg-obsidian-950/44 p-4">
        <div class="text-[10px] uppercase tracking-[0.2em] text-gold-300/70">В заявке будет</div>
        <div class="mt-1 font-heading text-xl text-cream-100">{{ category.name }}</div>
        <p class="mt-2 text-sm leading-relaxed text-cream-100/52">{{ category.description }}</p>
      </div>

      <router-link
        :to="{ path: '/contacts', query: { category: category.slug } }"
        class="metal-button justify-center"
      >
        Подобрать из категории
      </router-link>
    </div>
  </section>
</template>

<script setup>
defineProps({
  category: { type: Object, required: true },
  productCount: { type: Number, required: true },
})
</script>

<style scoped>
.category-request-panel {
  margin-bottom: 2rem;
  padding: 1.25rem;
  border-radius: 1.75rem;
  border: 1px solid rgba(201, 150, 59, 0.12);
  background:
    radial-gradient(circle at 12% 0%, rgba(201, 150, 59, 0.13), transparent 34%),
    linear-gradient(180deg, rgba(20, 18, 16, 0.96), rgba(10, 9, 8, 0.97));
}

@media (min-width: 640px) {
  .category-request-panel {
    padding: 1.5rem;
  }
}
</style>
