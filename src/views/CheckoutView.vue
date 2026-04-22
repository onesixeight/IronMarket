<template>
  <div class="py-8 min-h-screen">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <nav class="flex items-center gap-2 text-sm text-obsidian-500 mb-8">
        <router-link to="/" class="hover:text-gold-400 transition-colors">Главная</router-link>
        <span>/</span>
        <router-link to="/cart" class="hover:text-gold-400 transition-colors">Корзина</router-link>
        <span>/</span>
        <span class="text-cream-100">Оформление заказа</span>
      </nav>

      <div class="text-center mb-10" v-reveal>
        <h1 class="ornament-line font-heading text-3xl sm:text-4xl font-semibold text-cream-50 mb-4">
          Оформление заказа
        </h1>
      </div>

      <div v-if="cart.items.length === 0" class="text-center py-20 animate-fade-in">
        <div class="w-16 h-16 rounded-2xl bg-obsidian-800 border border-obsidian-600 flex items-center justify-center mx-auto mb-5">
          <svg class="w-8 h-8 text-obsidian-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121 0 2.09-.773 2.34-1.867l1.562-6.862c.34-1.493-.894-2.896-2.426-2.896H5.866"/>
          </svg>
        </div>
        <p class="text-cream-100/60 mb-4">Корзина пуста</p>
        <router-link to="/catalog" class="inline-flex items-center gap-2 text-sm font-medium text-gold-400 hover:text-gold-300 transition-colors">
          Перейти в каталог
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
          </svg>
        </router-link>
      </div>

      <form
        v-else
        ref="checkoutForm"
        @submit.prevent="openWhatsAppOrder"
        class="space-y-6"
        v-reveal
      >
        <div class="bg-obsidian-800 rounded-xl border border-obsidian-600 p-6">
          <h2 class="font-heading text-lg font-semibold text-cream-50 mb-5">Контактные данные</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gold-400/70 uppercase tracking-wider mb-1.5">Имя *</label>
              <input v-model="form.name" type="text" required class="form-input" placeholder="Иван Иванов" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gold-400/70 uppercase tracking-wider mb-1.5">Телефон *</label>
              <input v-model="form.phone" type="tel" required class="form-input" placeholder="+7 (___) ___-__-__" @input="onPhoneInput" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-gold-400/70 uppercase tracking-wider mb-1.5">Email</label>
              <input v-model="form.email" type="email" class="form-input" placeholder="your@email.com" />
            </div>
          </div>
        </div>

        <div class="bg-obsidian-800 rounded-xl border border-obsidian-600 p-6">
          <h2 class="font-heading text-lg font-semibold text-cream-50 mb-5">Адрес доставки</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gold-400/70 uppercase tracking-wider mb-1.5">Город *</label>
              <input
                v-model="form.city"
                type="text"
                class="form-input"
                placeholder="Астана"
                :required="form.delivery !== 'pickup'"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gold-400/70 uppercase tracking-wider mb-1.5">Улица *</label>
              <input
                v-model="form.street"
                type="text"
                class="form-input"
                placeholder="пр. Туран, 12"
                :required="form.delivery !== 'pickup'"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-gold-400/70 uppercase tracking-wider mb-1.5">
                Дом, квартира, офис
              </label>
              <input
                v-model="form.addressLine"
                type="text"
                class="form-input"
                placeholder="Подъезд, этаж, квартира или офис"
                :required="form.delivery === 'courier'"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-gold-400/70 uppercase tracking-wider mb-1.5">Комментарий</label>
              <textarea v-model="form.comment" rows="3" class="form-input" placeholder="Дополнительные пожелания к заказу..."></textarea>
            </div>
          </div>
          <p class="text-xs text-cream-100/40 mt-4">
            Для самовывоза можно оставить адрес доставки пустым, но город лучше указать для уточнения заказа.
          </p>
        </div>

        <div class="bg-obsidian-800 rounded-xl border border-obsidian-600 p-6">
          <h2 class="font-heading text-lg font-semibold text-cream-50 mb-5">Способ доставки</h2>
          <div class="space-y-2.5">
            <label
              v-for="d in deliveryOptions"
              :key="d.value"
              class="flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all duration-200"
              :class="form.delivery === d.value
                ? 'border-gold-400/50 bg-gold-400/5'
                : 'border-obsidian-600 hover:border-obsidian-500 hover:bg-obsidian-700/50'"
            >
              <div class="relative flex items-center">
                <input
                  type="radio"
                  v-model="form.delivery"
                  :value="d.value"
                  class="peer sr-only"
                />
                <div class="w-5 h-5 rounded-full border-2 border-obsidian-500 flex items-center justify-center transition-all peer-checked:border-gold-400">
                  <div class="w-2.5 h-2.5 rounded-full bg-gold-400 scale-0 peer-checked:scale-100 transition-transform" :class="form.delivery === d.value ? 'scale-100' : 'scale-0'"></div>
                </div>
              </div>
              <div class="flex-1">
                <div class="font-medium text-cream-100 text-sm">{{ d.label }}</div>
                <div class="text-xs text-cream-100/40 mt-0.5">{{ d.desc }}</div>
              </div>
              <div class="text-xs font-medium text-gold-400/60">{{ d.price }}</div>
            </label>
          </div>
        </div>

        <div class="bg-obsidian-800 rounded-xl border border-obsidian-600 p-6">
          <h2 class="font-heading text-lg font-semibold text-cream-50 mb-5">Способ оплаты</h2>
          <div class="space-y-2.5">
            <label
              v-for="p in paymentOptions"
              :key="p.value"
              class="flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all duration-200"
              :class="form.payment === p.value
                ? 'border-gold-400/50 bg-gold-400/5'
                : 'border-obsidian-600 hover:border-obsidian-500 hover:bg-obsidian-700/50'"
            >
              <div class="relative flex items-center">
                <input
                  type="radio"
                  v-model="form.payment"
                  :value="p.value"
                  class="peer sr-only"
                />
                <div class="w-5 h-5 rounded-full border-2 border-obsidian-500 flex items-center justify-center transition-all peer-checked:border-gold-400">
                  <div class="w-2.5 h-2.5 rounded-full bg-gold-400 scale-0 peer-checked:scale-100 transition-transform" :class="form.payment === p.value ? 'scale-100' : 'scale-0'"></div>
                </div>
              </div>
              <div>
                <div class="font-medium text-cream-100 text-sm">{{ p.label }}</div>
                <div class="text-xs text-cream-100/40 mt-0.5">{{ p.desc }}</div>
              </div>
            </label>
          </div>
        </div>

        <div class="bg-obsidian-800/60 border border-obsidian-600 rounded-xl p-6">
          <h2 class="font-heading text-lg font-semibold text-cream-50 mb-5">Ваш заказ</h2>
          <div class="space-y-3 mb-4">
            <div v-for="item in cart.items" :key="item.id" class="flex justify-between text-sm">
              <span class="text-cream-100/70 line-clamp-1 mr-4">
                {{ item.name }}
                <span class="text-cream-100/40">x {{ item.quantity }}</span>
              </span>
              <span v-if="item.hidePrice" class="text-gold-400 font-medium shrink-0 text-xs">Цена по запросу</span>
              <span v-else class="text-cream-100 font-medium shrink-0">{{ formatPrice(item.price * item.quantity) }}</span>
            </div>
          </div>
          <div class="border-t border-obsidian-600 pt-4 flex justify-between items-center">
            <span class="text-cream-100/60 font-medium">Итого:</span>
            <span v-if="hasHiddenPriceOnly" class="text-xl font-heading font-bold text-gold-400">Цена по запросу</span>
            <span v-else class="text-xl font-heading font-bold text-gold-400">{{ formatPrice(visibleTotal) }}</span>
          </div>
        </div>

        <div class="flex items-start gap-2.5">
          <div class="mt-0.5">
            <input
              type="checkbox"
              v-model="form.agreement"
              required
              class="peer sr-only"
              id="agreement"
            />
            <label
              for="agreement"
              class="block w-5 h-5 rounded border-2 border-obsidian-500 cursor-pointer transition-all flex items-center justify-center"
              :class="form.agreement ? 'bg-gold-400 border-gold-400' : 'hover:border-obsidian-400'"
            >
              <svg v-if="form.agreement" class="w-3 h-3 text-obsidian-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </label>
          </div>
          <label for="agreement" class="text-xs text-cream-100/40 leading-relaxed cursor-pointer">
            Даю согласие на обработку персональных данных для обратной связи по заказу.
          </label>
        </div>

        <div class="space-y-3">
          <p class="text-sm text-cream-100/48 leading-relaxed">
            После нажатия откроется мессенджер с готовым текстом заказа. Корзина останется у вас до подтверждения, ничего не потеряется.
          </p>

          <button
            type="submit"
            class="w-full py-4 rounded-xl font-heading font-semibold text-lg transition-all duration-300 border border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-obsidian-900"
          >
            Оформить через WhatsApp
          </button>

          <button
            type="button"
            class="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-medium text-sm transition-all duration-300 border border-blue-400/40 text-blue-400 hover:bg-blue-500 hover:text-white group"
            @click="openTelegramOrder"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Оформить через Telegram
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useCartStore } from '../stores/cart'
import { useToastStore } from '../stores/toast'
import { usePhoneMask } from '../composables/usePhoneMask'
import { useSeo } from '../composables/useSeo'
import { useMessengerOrder } from '../composables/useMessengerOrder'
import { formatPrice } from '../composables/usePrice.js'

useSeo('Оформление заказа', 'Оформление заказа на кованые изделия')

const cart = useCartStore()
const toast = useToastStore()
const { formatPhone } = usePhoneMask()
const { getWhatsAppLink, getTelegramLink } = useMessengerOrder()
const checkoutForm = ref(null)

const form = reactive({
  name: '',
  phone: '',
  email: '',
  city: '',
  street: '',
  addressLine: '',
  comment: '',
  delivery: 'tk',
  payment: 'cash',
  agreement: false,
})

function onPhoneInput(e) {
  form.phone = formatPhone(e.target.value)
}

const visibleTotal = computed(() =>
  cart.items.reduce((sum, item) => {
    if (item.hidePrice) return sum
    return sum + item.price * item.quantity
  }, 0)
)

const hasHiddenPriceOnly = computed(() =>
  cart.items.length > 0 && cart.items.every((i) => i.hidePrice)
)

const whatsappLink = computed(() =>
  getWhatsAppLink(cart.items, visibleTotal.value, form)
)

const telegramLink = computed(() =>
  getTelegramLink(cart.items, visibleTotal.value, form)
)

const deliveryOptions = [
  { value: 'tk', label: 'Транспортная компания', desc: 'Доставка до терминала ТК в вашем городе', price: 'По тарифу ТК' },
  { value: 'courier', label: 'Курьерская доставка', desc: 'Доставка до двери по указанному адресу', price: 'По тарифу' },
  { value: 'pickup', label: 'Самовывоз', desc: 'Забрать заказ самостоятельно по согласованию', price: 'Бесплатно' },
]

const paymentOptions = [
  { value: 'cash', label: 'Наличные', desc: 'Оплата при получении или самовывозе' },
  { value: 'card', label: 'Банковская карта', desc: 'Оплата картой онлайн' },
  { value: 'transfer', label: 'Банковский перевод', desc: 'Перевод на расчётный счёт' },
]

function ensureValid() {
  return checkoutForm.value?.reportValidity() !== false
}

function openLink(link, label) {
  if (!ensureValid()) return
  toast.info(`Откроем ${label} с готовым текстом заказа.`)
  window.open(link, '_blank', 'noopener,noreferrer')
}

function openWhatsAppOrder() {
  openLink(whatsappLink.value, 'WhatsApp')
}

function openTelegramOrder() {
  openLink(telegramLink.value, 'Telegram')
}
</script>
