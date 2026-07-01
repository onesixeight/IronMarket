<template>
  <section class="catalog-shortcuts" aria-labelledby="catalog-shortcuts-title">
    <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div class="max-w-2xl">
        <div class="eyebrow mb-4">Подбор по задаче</div>
        <h2 id="catalog-shortcuts-title" class="font-heading text-2xl sm:text-3xl leading-tight text-cream-100">
          Можно начать не с артикула, а с того, что вы собираете.
        </h2>
        <p class="mt-3 text-sm leading-relaxed text-cream-100/58">
          Выберите сценарий, и мы сразу получим понятный контекст для подбора элементов из каталога.
        </p>
      </div>

      <router-link
        :to="{ path: '/contacts', query: { task: 'gates' } }"
        class="metal-button-ghost justify-center"
      >
        Нужен совет
      </router-link>
    </div>

    <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <router-link
        v-for="scenario in catalogShortcutItems"
        :key="scenario.id"
        :to="{ path: '/contacts', query: { task: scenario.id } }"
        class="shortcut-card group"
        :aria-label="`Открыть заявку: ${scenario.title}`"
      >
        <span class="shortcut-index">{{ scenario.icon }}</span>
        <span class="shortcut-title">{{ scenario.title }}</span>
        <span class="shortcut-desc">{{ scenario.desc }}</span>
      </router-link>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { contactScenarios } from '../composables/useContactPrefill.js'

const catalogShortcutItems = computed(() =>
  contactScenarios.filter((scenario) =>
    ['gates', 'railings', 'fences', 'stairs'].includes(scenario.id)
  )
)
</script>

<style scoped>
.catalog-shortcuts {
  position: relative;
  overflow: hidden;
  margin-bottom: 2rem;
  padding: 1.25rem;
  border-radius: 1.75rem;
  border: 1px solid rgb(var(--rgb-gold-400) / 0.12);
  background:
    radial-gradient(circle at 12% 0%, rgb(var(--rgb-gold-400) / 0.13), transparent 32%),
    linear-gradient(180deg, rgb(var(--rgb-obsidian-800) / 0.96), rgb(var(--rgb-obsidian-900) / 0.96));
}

.shortcut-card {
  display: grid;
  gap: 0.45rem;
  min-height: 9rem;
  padding: 1rem;
  border-radius: 1.25rem;
  border: 1px solid rgb(var(--rgb-gold-400) / 0.1);
  background: rgb(var(--rgb-obsidian-900) / 0.48);
  transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease;
}

.shortcut-card:hover,
.shortcut-card:focus-visible {
  transform: translateY(-2px);
  border-color: rgb(var(--rgb-gold-400) / 0.32);
  background: rgb(var(--rgb-gold-400) / 0.08);
  outline: none;
}

.shortcut-index {
  width: fit-content;
  border-radius: 999px;
  border: 1px solid rgb(var(--rgb-gold-400) / 0.18);
  padding: 0.25rem 0.55rem;
  font-family: var(--font-heading);
  font-size: 0.78rem;
  color: rgb(212, 175, 55);
  background: rgb(var(--rgb-gold-400) / 0.08);
}

.shortcut-title {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  line-height: 1.1;
  color: rgb(248, 241, 224);
}

.shortcut-desc {
  font-size: 0.82rem;
  line-height: 1.55;
  color: rgb(var(--rgb-cream-warm) / 0.54);
}

@media (min-width: 640px) {
  .catalog-shortcuts {
    padding: 1.5rem;
  }
}
</style>
