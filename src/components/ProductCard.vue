<template>
  <article class="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-gold-400/10 bg-obsidian-900/82 shadow-[0_24px_60px_rgba(0,0,0,0.22)] transition-transform duration-300 hover:-translate-y-1">
    <router-link :to="'/product/' + product.id" class="relative block overflow-hidden rounded-t-[1.75rem] aspect-[4/3] bg-[radial-gradient(circle_at_top,rgba(201,150,59,0.14),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(10,9,8,0.02))]">
      <img
        :src="product.image"
        :alt="product.name"
        class="absolute inset-0 h-full w-full object-contain p-5 transition-transform duration-500 ease-out group-hover:scale-[1.05]"
        loading="lazy"
      />
      <div v-if="product.badge" class="absolute left-4 top-4 rounded-full border border-gold-400/18 bg-obsidian-950/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-300">
        {{ product.badge }}
      </div>
    </router-link>

    <div class="flex flex-1 flex-col px-5 pb-5 pt-4">
      <h3 class="min-h-[2.8rem] text-[15px] font-semibold leading-snug text-cream-100">
        <router-link :to="'/product/' + product.id" class="transition-colors duration-200 hover:text-gold-300">
          {{ product.name }}
        </router-link>
      </h3>

      <p v-if="product.material" class="mt-3 text-sm text-cream-100/46">
        {{ product.material }}
      </p>

      <div class="mt-auto flex items-end justify-between gap-3 border-t border-gold-400/10 pt-5">
        <div v-if="!product.hidePrice">
          <div class="mb-1 text-[11px] uppercase tracking-[0.16em] text-cream-100/34">Стоимость</div>
          <div class="font-heading text-2xl text-gold-300">{{ formatPrice(product.price) }}</div>
          <div v-if="product.oldPrice" class="mt-1 text-xs line-through text-cream-100/32">
            {{ formatPrice(product.oldPrice) }}
          </div>
        </div>

        <div v-else>
          <div class="mb-1 text-[11px] uppercase tracking-[0.16em] text-cream-100/34">Стоимость</div>
          <div class="font-heading text-lg text-gold-300">По запросу</div>
        </div>

        <router-link
          :to="'/product/' + product.id"
          class="inline-flex items-center gap-2 rounded-2xl border border-gold-400/18 bg-obsidian-950/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-300 transition-all duration-200 hover:border-gold-300/40 hover:bg-gold-400/8 active:scale-95"
          title="Подробнее"
        >
          Подробнее
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.7">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </router-link>
      </div>
    </div>
  </article>
</template>

<script setup>
import { formatPrice } from '../composables/usePrice.js'

const props = defineProps({
  product: { type: Object, required: true },
})
</script>
