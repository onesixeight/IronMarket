<template>
  <div class="py-8">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <nav class="flex items-center gap-2 text-sm text-iron-400 mb-8">
        <router-link to="/" class="hover:text-gold-500 transition-colors">Главная</router-link>
        <span>/</span>
        <router-link to="/cart" class="hover:text-gold-500 transition-colors">Корзина</router-link>
        <span>/</span>
        <span class="text-iron-700">Оформление заказа</span>
      </nav>

      <div class="text-center mb-10" v-reveal>
        <h1 class="ornament-line font-heading text-3xl sm:text-4xl font-semibold text-iron-900 mb-4">Оформление заказа</h1>
      </div>

      <div v-if="cart.items.length === 0" class="text-center py-20 animate-fade-in">
        <p class="text-iron-400 mb-4">Корзина пуста</p>
        <router-link to="/catalog" class="text-sm font-medium text-gold-600 hover:text-gold-500 transition-colors">Перейти в каталог</router-link>
      </div>

      <form v-else @submit.prevent="submitOrder" class="space-y-6" v-reveal>
        <div class="bg-white rounded-xl border border-iron-100/60 p-6">
          <h2 class="font-heading text-lg font-semibold text-iron-900 mb-5">Контактные данные</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-iron-500 uppercase tracking-wider mb-1.5">Имя *</label>
              <input v-model="form.name" type="text" required class="form-input" placeholder="Иван Иванов" />
            </div>
            <div>
              <label class="block text-xs font-medium text-iron-500 uppercase tracking-wider mb-1.5">Телефон *</label>
              <input v-model="form.phone" type="tel" required class="form-input" placeholder="+7 (___) ___-__-__" @input="onPhoneInput" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-iron-500 uppercase tracking-wider mb-1.5">Email</label>
              <input v-model="form.email" type="email" class="form-input" placeholder="your@email.com" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-iron-500 uppercase tracking-wider mb-1.5">Комментарий</label>
              <textarea v-model="form.comment" rows="3" class="form-input" placeholder="Дополнительные пожелания к заказу..."></textarea>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-iron-100/60 p-6">
          <h2 class="font-heading text-lg font-semibold text-iron-900 mb-5">Способ доставки</h2>
          <div class="space-y-2.5">
            <label v-for="d in deliveryOptions" :key="d.value" class="flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all duration-200" :class="form.delivery === d.value ? 'border-gold-400 bg-gold-50/60' : 'border-iron-100/60 hover:border-iron-200'">
              <input type="radio" v-model="form.delivery" :value="d.value" class="accent-gold-500" />
              <div class="flex-1">
                <div class="font-medium text-iron-800 text-sm">{{ d.label }}</div>
                <div class="text-xs text-iron-400 mt-0.5">{{ d.desc }}</div>
              </div>
              <div class="text-xs font-medium text-iron-500">{{ d.price }}</div>
            </label>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-iron-100/60 p-6">
          <h2 class="font-heading text-lg font-semibold text-iron-900 mb-5">Способ оплаты</h2>
          <div class="space-y-2.5">
            <label v-for="p in paymentOptions" :key="p.value" class="flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all duration-200" :class="form.payment === p.value ? 'border-gold-400 bg-gold-50/60' : 'border-iron-100/60 hover:border-iron-200'">
              <input type="radio" v-model="form.payment" :value="p.value" class="accent-gold-500" />
              <div>
                <div class="font-medium text-iron-800 text-sm">{{ p.label }}</div>
                <div class="text-xs text-iron-400 mt-0.5">{{ p.desc }}</div>
              </div>
            </label>
          </div>
        </div>

        <div class="bg-cream-50/80 border border-iron-100/40 rounded-xl p-6">
          <h2 class="font-heading text-lg font-semibold text-iron-900 mb-5">Ваш заказ</h2>
          <div class="space-y-3 mb-4">
            <div v-for="item in cart.items" :key="item.id" class="flex justify-between text-sm">
              <span class="text-iron-600 line-clamp-1 mr-4">{{ item.name }} <span class="text-iron-400">x {{ item.quantity }}</span></span>
              <span class="text-iron-800 font-medium shrink-0">{{ (item.price * item.quantity).toLocaleString() }} &#8381;</span>
            </div>
          </div>
          <div class="border-t border-iron-200/50 pt-4 flex justify-between">
            <span class="text-iron-700 font-medium">Итого:</span>
            <span class="text-xl font-heading font-bold text-iron-900">{{ cart.totalPrice.toLocaleString() }} &#8381;</span>
          </div>
        </div>

        <div class="flex items-start gap-2.5">
          <input type="checkbox" v-model="form.agreement" required class="mt-1 accent-gold-500" />
          <label class="text-xs text-iron-400 leading-relaxed">
            Даю согласие на обработку персональных данных в соответствии с политикой конфиденциальности
          </label>
        </div>

        <button
          type="submit"
          :disabled="submitted"
          class="w-full bg-iron-900 hover:bg-gold-600 disabled:bg-iron-300 text-cream-100 py-4 rounded-xl font-medium text-lg transition-all duration-200"
        >
          {{ submitted ? 'Заказ оформлен!' : 'Оформить заказ' }}
        </button>
      </form>

      <div v-if="submitted" class="text-center mt-8 p-10 bg-cream-50/80 border border-iron-100/40 rounded-2xl animate-scale-in">
        <div class="w-16 h-16 bg-gold-50 border border-gold-200/50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg class="w-8 h-8 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h2 class="font-heading text-2xl font-semibold text-iron-900 mb-2">Спасибо за заказ!</h2>
        <p class="text-iron-500 mb-6">Мы свяжемся с вами в ближайшее время для подтверждения.</p>
        <router-link to="/catalog" class="inline-flex items-center gap-2 text-sm font-medium text-gold-600 hover:text-gold-500 transition-colors">
          Продолжить покупки
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useCartStore } from '../stores/cart'
import { useToastStore } from '../stores/toast'
import { usePhoneMask } from '../composables/usePhoneMask'
import { useSeo } from '../composables/useSeo'

useSeo('Оформление заказа', 'Оформление заказа на кованые изделия')

const cart = useCartStore()
const toast = useToastStore()
const { formatPhone } = usePhoneMask()
const submitted = ref(false)

const form = reactive({
  name: '',
  phone: '',
  email: '',
  comment: '',
  delivery: 'tk',
  payment: 'cash',
  agreement: false,
})

function onPhoneInput(e) {
  form.phone = formatPhone(e.target.value)
}

const deliveryOptions = [
  { value: 'tk', label: 'Транспортная компания', desc: 'Доставка до терминала ТК в вашем городе', price: 'По тарифу ТК' },
  { value: 'courier', label: 'Курьерская доставка', desc: 'Доставка до двери', price: 'По тарифу' },
  { value: 'pickup', label: 'Самовывоз', desc: 'Забрать со склада производителя', price: 'Бесплатно' },
]

const paymentOptions = [
  { value: 'cash', label: 'Наличные', desc: 'Оплата при получении или самовывозе' },
  { value: 'card', label: 'Банковская карта', desc: 'Оплата картой онлайн' },
  { value: 'transfer', label: 'Банковский перевод', desc: 'Перевод на расчётный счёт' },
]

function submitOrder() {
  submitted.value = true
  toast.success('Заказ успешно оформлен!')
  cart.clearCart()
}
</script>

<style scoped>
.form-input {
  width: 100%;
  padding: 0.625rem 1rem;
  border: 1px solid var(--color-iron-100);
  border-radius: 0.75rem;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s;
  background: var(--color-cream-50);
}
.form-input:focus {
  border-color: var(--color-gold-400);
  box-shadow: 0 0 0 3px rgba(201, 150, 59, 0.1);
}
</style>
