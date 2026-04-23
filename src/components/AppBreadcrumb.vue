<template>
  <nav aria-label="Хлебные крошки" class="flex items-center gap-2 text-sm mb-8">
    <ol class="flex items-center gap-2 list-none m-0 p-0">
      <li
        v-for="(item, index) in items"
        :key="item.label"
        class="flex items-center gap-2"
      >
        <router-link
          v-if="item.to"
          :to="item.to"
          class="text-gold-600 hover:text-gold-400 transition-colors duration-200"
        >
          {{ item.label }}
        </router-link>
        <span
          v-else
          :aria-current="index === items.length - 1 ? 'page' : undefined"
          :class="index === items.length - 1 ? 'text-cream-100' : 'text-gold-600'"
        >
          {{ item.label }}
        </span>
        <span v-if="index < items.length - 1" class="text-obsidian-500" aria-hidden="true">/</span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
    validator: (value) => value.every(i => typeof i.label === 'string'),
  },
})
</script>
