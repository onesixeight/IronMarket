<template>
  <nav aria-label="Хлебные крошки" class="mb-8 overflow-x-auto pb-2 text-sm">
    <ol class="flex w-max items-center gap-2 whitespace-nowrap list-none m-0 p-0">
      <li
        v-for="(item, index) in items"
        :key="item.label"
        class="flex shrink-0 items-center gap-2"
      >
        <router-link
          v-if="item.to"
          :to="item.to"
          class="inline-block max-w-[11rem] truncate align-bottom text-gold-600 transition-colors duration-200 hover:text-gold-400 sm:max-w-[16rem] lg:max-w-none"
        >
          {{ item.label }}
        </router-link>
        <span
          v-else
          :aria-current="index === items.length - 1 ? 'page' : undefined"
          class="inline-block max-w-[12rem] truncate align-bottom sm:max-w-[18rem] lg:max-w-none"
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
