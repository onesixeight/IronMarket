<template>
  <div class="product-page section-shell py-8 bg-obsidian-900 min-h-[80vh]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <AppBreadcrumb :items="breadcrumbItems" />

      <div v-if="product" class="product-detail-grid grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
        <div
          class="product-media-card rounded-2xl p-8 lg:p-12 flex items-center justify-center relative group transition-all duration-300 bg-obsidian-800 border border-gold-400/[0.08] hover:border-gold-400/20"
        >
          <img
            :src="product.image"
            :alt="product.name"
            data-testid="product-detail-image"
            class="max-w-full max-h-[500px] object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            decoding="async"
            sizes="(min-width: 1024px) 50vw, 100vw"
            @error="applyImageFallback"
          />
          <button
            type="button"
            class="absolute bottom-4 right-4 p-2 rounded-lg opacity-100 transition-opacity cursor-zoom-in bg-gold-400/10 border border-gold-400/20 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 focus-visible:opacity-100"
            aria-label="Открыть изображение крупнее"
            @click="lightbox = true"
          >
            <svg class="w-4 h-4 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"/>
            </svg>
          </button>
        </div>

        <div class="product-info-panel">
          <div class="flex items-center gap-3 mb-5">
            <div
              v-if="product.badge"
              class="shimmer inline-block text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-sm bg-gradient-to-br from-gold-400 to-gold-500 text-obsidian-900"
            >
              {{ product.badge }}
            </div>
          </div>

          <h1
            class="text-2xl sm:text-3xl font-bold mb-5 leading-tight font-heading text-cream-100"
          >
            {{ product.name }}
          </h1>

          <div class="flex items-end gap-4 mb-6" v-if="!product.hidePrice">
            <span
              class="text-3xl font-bold font-heading tabular-nums text-gold-400"
            >
              {{ formatPrice(product.price) }}
            </span>
            <span
              v-if="product.oldPrice"
              class="text-lg tabular-nums line-through text-obsidian-500"
            >
              {{ formatPrice(product.oldPrice) }}
            </span>
          </div>
          <div v-else class="mb-6">
            <span
              class="text-xl font-medium font-heading text-gold-500"
            >
              Цена по запросу
            </span>
          </div>

          <div class="product-payment-note mb-6" role="note">
            <div class="product-payment-kicker">Оплата через Kaspi</div>
            <p>
              Оплата производится через Kaspi после подтверждения наличия, количества и доставки.
              На сайте онлайн-оплата не списывается.
            </p>
          </div>

          <div
            v-if="product.material"
            class="product-material-note mb-6 flex items-center gap-3 p-4 rounded-xl"
          >
            <svg class="w-5 h-5 shrink-0 text-gold-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"/>
            </svg>
            <div>
              <div class="product-material-label">Материал</div>
              <div class="font-semibold text-sm text-cream-50">{{ product.material }}</div>
            </div>
          </div>

          <p
            v-if="product.description"
            class="mb-8 leading-relaxed text-[15px] text-cream-100/60"
          >
            {{ product.description }}
          </p>

          <div class="mb-8 rounded-[1.75rem] border border-gold-400/14 bg-[radial-gradient(circle_at_top_left,rgba(201,150,59,0.14),transparent_42%),linear-gradient(180deg,rgba(20,18,16,0.94),rgba(10,9,8,0.96))] p-5 sm:p-6">
            <div class="mb-5">
              <div class="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-300/70">Заявка по позиции</div>
              <p class="text-sm leading-relaxed text-cream-100/62">
                Отправьте запрос, и мы уточним наличие, количество, доставку и поможем собрать элементы под ваш проект.
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <a
                :href="productInquiryLinks.whatsapp"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="product-whatsapp-link"
                class="shimmer inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#C9A96E] via-[#D4AF37] to-[#C9A96E] px-8 py-3 font-medium text-obsidian-900 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                @click="trackProductLead('whatsapp')"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/>
                </svg>
                WhatsApp
              </a>

              <a
                :href="productInquiryLinks.telegram"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="product-telegram-link"
                class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gold-400/18 bg-obsidian-950/64 px-8 py-3 font-medium text-gold-300 transition-all duration-300 hover:border-gold-300/40 hover:bg-gold-400/8 active:scale-[0.98]"
                @click="trackProductLead('telegram')"
              >
                Telegram
              </a>
            </div>

            <router-link
              :to="{ path: '/contacts', query: { product: product.id } }"
              class="mt-4 inline-flex text-sm font-medium text-cream-100/56 transition-colors hover:text-gold-300"
            >
              Или заполнить форму на сайте
            </router-link>

            <div class="product-order-steps mt-5" aria-label="Как проходит заявка по товару">
              <div v-for="step in productOrderSteps" :key="step.title" class="product-order-step">
                <span>{{ step.number }}</span>
                <div>
                  <strong>{{ step.title }}</strong>
                  <p>{{ step.text }}</p>
                </div>
              </div>
            </div>

            <div class="mt-5 grid gap-2 sm:grid-cols-3">
              <div class="rounded-xl border border-gold-400/10 bg-obsidian-950/44 px-3 py-2 text-[11px] text-cream-100/52">Расчёт партии</div>
              <div class="rounded-xl border border-gold-400/10 bg-obsidian-950/44 px-3 py-2 text-[11px] text-cream-100/52">Подбор аналогов</div>
              <div class="rounded-xl border border-gold-400/10 bg-obsidian-950/44 px-3 py-2 text-[11px] text-cream-100/52">Доставка по KZ</div>
            </div>
          </div>

          <div class="product-trust-grid">
            <div v-for="item in productTrustItems" :key="item.title" class="product-trust-card">
              <span class="product-trust-icon">{{ item.icon }}</span>
              <strong>{{ item.title }}</strong>
              <small>{{ item.text }}</small>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-24" v-reveal>
        <div class="w-20 h-20 mx-auto bg-obsidian-800 border border-obsidian-600/50 rounded-2xl flex items-center justify-center mb-8">
          <svg class="w-10 h-10 text-obsidian-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>
          </svg>
        </div>
        <h2 class="font-heading text-2xl font-bold text-cream-100 mb-3">Товар не найден</h2>
        <p class="text-cream-100/50 mb-8">Возможно, он был удалён или ссылка неверна</p>
        <div class="flex items-center justify-center gap-4 flex-wrap">
          <router-link to="/catalog" class="shimmer inline-flex items-center gap-2 bg-gradient-to-r from-gold-500 to-gold-400 text-obsidian-900 px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 hover:shadow-lg hover:shadow-gold-500/25">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
            Вернуться в каталог
          </router-link>
          <router-link to="/" class="inline-flex items-center gap-2 text-sm font-medium text-gold-400 hover:text-gold-300 transition-colors">
            На главную
          </router-link>
        </div>
      </div>

      <div v-if="product && related.length > 0" class="mt-20">
        <div class="text-center mb-10" v-reveal>
          <h2
            class="ornament-line text-2xl font-bold mb-4 justify-center font-heading text-gold-400"
          >
            Похожие товары
          </h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <ProductCard v-for="(p, i) in related" :key="p.id" :product="p" v-reveal="i * 0.05" />
        </div>
      </div>
    </div>

    <ImageLightbox v-if="product" :visible="lightbox" :src="product.image" :alt="product.name" @close="lightbox = false" />

    <RecentlyViewed v-if="product" :exclude-id="Number(route.params.id)" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProductStore } from '../stores/products'
import ProductCard from '../components/ProductCard.vue'
import ImageLightbox from '../components/ImageLightbox.vue'
import { useSeo } from '../composables/useSeo'
import { useSchemaOrg, schemaProduct } from '../composables/useSchemaOrg.js'
import { formatPrice } from '../composables/usePrice.js'
import AppBreadcrumb from '../components/AppBreadcrumb.vue'
import RecentlyViewed from '../components/RecentlyViewed.vue'
import { applyImageFallback } from '../composables/useImageFallback.js'
import { useRecentlyViewed } from '../composables/useRecentlyViewed.js'
import { getProductTelegramLink, getProductWhatsAppLink } from '../composables/useProductInquiry.js'
import { trackLead } from '../composables/useAnalytics.js'

const route = useRoute()
const { add: addRecentlyViewed } = useRecentlyViewed()
const productStore = useProductStore()
const lightbox = ref(false)

const product = computed(() => productStore.getProductById(Number(route.params.id)))

watch(() => route.params.id, (id) => {
  if (id) {
    addRecentlyViewed(Number(id))
  }
}, { immediate: true })
const category = computed(() => {
  if (!product.value) return null
  return productStore.getCategoryBySlug(product.value.categorySlug)
})
const related = computed(() => {
  if (!product.value) return []
  return productStore.getRelatedProducts(product.value.id)
})

const productInquiryLinks = computed(() => ({
  whatsapp: getProductWhatsAppLink(product.value),
  telegram: getProductTelegramLink(product.value),
}))

function trackProductLead(channel) {
  if (!product.value) return

  trackLead(channel, {
    source: 'product_page',
    product_id: product.value.id,
    category_slug: product.value.categorySlug,
  })
}

const productOrderSteps = [
  {
    number: '01',
    title: 'Проверяем наличие',
    text: 'Уточняем позицию, количество и возможные аналоги.',
  },
  {
    number: '02',
    title: 'Согласуем доставку',
    text: 'Считаем город, объём и удобный способ отправки.',
  },
  {
    number: '03',
    title: 'Оплата через Kaspi',
    text: 'После подтверждения заказа отправляем данные для оплаты.',
  },
]

const productTrustItems = [
  {
    icon: 'K',
    title: 'Kaspi после согласования',
    text: 'Оплата только после подтверждения наличия, количества и доставки.',
  },
  {
    icon: '01',
    title: 'Подбор аналогов',
    text: 'Если позиции нет или нужен комплект, подскажем замену.',
  },
  {
    icon: 'KZ',
    title: 'Доставка по KZ',
    text: 'Самовывоз, курьер или транспортная компания после заявки.',
  },
  {
    icon: '✓',
    title: 'Живая консультация',
    text: 'Можно отправить фото, размеры или описание объекта.',
  },
]

useSchemaOrg(() => schemaProduct(product))

const breadcrumbItems = computed(() => {
  const items = [{ to: '/', label: 'Главная' }, { to: '/catalog', label: 'Каталог' }]
  if (product.value && category.value) {
    items.push({ to: '/catalog/' + product.value.categorySlug, label: category.value.name })
    items.push({ label: product.value.name })
  }
  return items
})

const seoName = computed(() => product.value?.name || 'Товар не найден')
const seoImage = computed(() => product.value?.image)
useSeo(seoName, () => product.value?.description || 'Запрашиваемый товар не найден.', seoImage)
</script>

<style scoped>
.product-detail-grid {
  align-items: start;
}

.product-media-card {
  position: relative;
  overflow: hidden;
  min-height: 24rem;
  background:
    radial-gradient(circle at 50% 0%, rgb(var(--rgb-gold-400) / 0.16), transparent 42%),
    linear-gradient(180deg, rgb(var(--rgb-cream-100) / 0.06), rgb(var(--rgb-obsidian-900) / 0.96));
  box-shadow:
    0 28px 70px rgb(var(--rgb-black) / 0.34),
    inset 0 1px 0 rgb(var(--rgb-white) / 0.04);
}

.product-media-card::before {
  content: '';
  position: absolute;
  inset: 1rem;
  pointer-events: none;
  border: 1px solid rgb(var(--rgb-gold-400) / 0.08);
  border-radius: 1.25rem;
}

.product-media-card::after {
  content: '';
  position: absolute;
  inset: auto -18% -28% 18%;
  height: 12rem;
  pointer-events: none;
  border-radius: 999px;
  background: rgb(var(--rgb-gold-400) / 0.1);
  filter: blur(38px);
}

.product-media-card img,
.product-media-card button {
  position: relative;
  z-index: 1;
}

.product-info-panel {
  position: relative;
}

.product-payment-note {
  display: grid;
  gap: 0.55rem;
  padding: 1rem 1.1rem;
  border: 1px solid rgb(var(--rgb-gold-400) / 0.14);
  border-radius: 1.25rem;
  background:
    radial-gradient(circle at 0% 0%, rgb(var(--rgb-gold-400) / 0.11), transparent 34%),
    rgb(var(--rgb-obsidian-900) / 0.44);
}

.product-payment-kicker {
  width: fit-content;
  border-radius: 999px;
  border: 1px solid rgb(var(--rgb-gold-400) / 0.18);
  background: rgb(var(--rgb-gold-400) / 0.08);
  padding: 0.28rem 0.65rem;
  color: rgb(228, 185, 109);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.product-payment-note p {
  color: rgb(var(--rgb-cream-100) / 0.62);
  font-size: 0.88rem;
  line-height: 1.65;
}

.product-material-note {
  border: 1px solid rgb(var(--rgb-gold-400) / 0.16);
  background:
    radial-gradient(circle at 0% 0%, rgb(var(--rgb-gold-400) / 0.1), transparent 38%),
    rgb(31 28 23 / 0.88);
  box-shadow: inset 0 1px 0 rgb(var(--rgb-white) / 0.04);
}

.product-material-label {
  margin-bottom: 0.18rem;
  color: rgb(var(--rgb-gold-300) / 0.82);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  line-height: 1.1;
  text-transform: uppercase;
}

.product-order-steps {
  display: grid;
  gap: 0.65rem;
}

.product-order-step {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.8rem;
  align-items: start;
  border-radius: 1rem;
  border: 1px solid rgb(var(--rgb-gold-400) / 0.1);
  background: rgb(var(--rgb-obsidian-900) / 0.38);
  padding: 0.85rem;
}

.product-order-step > span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.15rem;
  height: 2.15rem;
  border-radius: 0.8rem;
  border: 1px solid rgb(var(--rgb-gold-400) / 0.18);
  color: rgb(228, 185, 109);
  font-family: var(--font-heading);
  font-size: 0.8rem;
  background: rgb(var(--rgb-gold-400) / 0.08);
}

.product-order-step strong {
  display: block;
  color: rgb(245, 240, 232);
  font-size: 0.88rem;
}

.product-order-step p {
  margin-top: 0.2rem;
  color: rgb(var(--rgb-cream-100) / 0.5);
  font-size: 0.78rem;
  line-height: 1.5;
}

.product-trust-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.product-trust-card {
  min-height: 100%;
  border-radius: 1.15rem;
  border: 1px solid rgb(var(--rgb-gold-400) / 0.1);
  background:
    radial-gradient(circle at 20% 0%, rgb(var(--rgb-gold-400) / 0.08), transparent 42%),
    rgb(var(--rgb-obsidian-800) / 0.74);
  padding: 0.9rem;
  transition:
    transform 0.28s ease,
    border-color 0.28s ease,
    background-color 0.28s ease;
}

.product-trust-card:hover {
  transform: translateY(-2px);
  border-color: rgb(var(--rgb-gold-400) / 0.28);
  background-color: rgb(var(--rgb-gold-400) / 0.06);
}

.product-trust-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  margin-bottom: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid rgb(var(--rgb-gold-400) / 0.16);
  color: rgb(228, 185, 109);
  font-family: var(--font-heading);
  font-size: 0.82rem;
  background: rgb(var(--rgb-gold-400) / 0.08);
}

.product-trust-card strong {
  display: block;
  color: rgb(245, 240, 232);
  font-size: 0.82rem;
  line-height: 1.25;
}

.product-trust-card small {
  display: block;
  margin-top: 0.4rem;
  color: rgb(var(--rgb-cream-100) / 0.48);
  font-size: 0.72rem;
  line-height: 1.45;
}

@media (min-width: 1024px) {
  .product-media-card,
  .product-info-panel {
    position: sticky;
    top: 6.5rem;
  }
}

@media (max-width: 480px) {
  .product-media-card {
    min-height: 19rem;
  }

  .product-trust-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .product-trust-card,
  .product-media-card img {
    transition: none;
  }
}
</style>
