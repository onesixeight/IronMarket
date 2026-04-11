<template>
  <form @submit.prevent="submit" class="space-y-4">
    <div>
      <label class="block text-sm font-medium mb-1.5" :class="dark ? 'text-cream-200' : 'text-iron-700'">{{ nameLabel }} *</label>
      <input v-model="form.name" type="text" :placeholder="namePlaceholder" required class="form-input" :class="dark && 'form-input-dark'" />
    </div>

    <div v-if="showEmail">
      <label class="block text-sm font-medium mb-1.5" :class="dark ? 'text-cream-200' : 'text-iron-700'">Email</label>
      <input v-model="form.email" type="email" placeholder="your@email.com" class="form-input" :class="dark && 'form-input-dark'" />
    </div>

    <div>
      <label class="block text-sm font-medium mb-1.5" :class="dark ? 'text-cream-200' : 'text-iron-700'">Телефон *</label>
      <input v-model="form.phone" type="tel" placeholder="+7 (___) ___-__-__" required class="form-input" :class="dark && 'form-input-dark'" @input="onPhoneInput" />
    </div>

    <div v-if="showMessage">
      <label class="block text-sm font-medium mb-1.5" :class="dark ? 'text-cream-200' : 'text-iron-700'">Сообщение</label>
      <textarea v-model="form.message" rows="4" placeholder="Ваше сообщение..." class="form-input" :class="dark && 'form-input-dark'"></textarea>
    </div>

    <div class="flex items-start gap-2">
      <input type="checkbox" v-model="form.agreement" required class="mt-1 accent-gold-500" />
      <label class="text-sm" :class="dark ? 'text-iron-400' : 'text-iron-500'">
        Даю согласие на обработку персональных данных
      </label>
    </div>

    <button
      type="submit"
      :disabled="submitted"
      class="w-full py-3 rounded-xl font-medium text-sm tracking-wide transition-all duration-200"
      :class="dark
        ? 'bg-gold-500 hover:bg-gold-400 disabled:bg-iron-600 text-iron-900'
        : 'bg-iron-900 hover:bg-iron-800 disabled:bg-iron-300 text-cream-100'"
    >
      {{ submitted ? 'Отправлено!' : buttonText }}
    </button>
  </form>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { usePhoneMask } from '../composables/usePhoneMask'
import { useToastStore } from '../stores/toast'

const props = defineProps({
  nameLabel: { type: String, default: 'Имя' },
  namePlaceholder: { type: String, default: 'Как к вам обращаться' },
  buttonText: { type: String, default: 'Отправить заявку' },
  showEmail: { type: Boolean, default: false },
  showMessage: { type: Boolean, default: false },
  dark: { type: Boolean, default: false },
})

const toast = useToastStore()
const { formatPhone } = usePhoneMask()
const form = reactive({ name: '', email: '', phone: '', message: '', agreement: false })
const submitted = ref(false)

function onPhoneInput(e) {
  form.phone = formatPhone(e.target.value)
}

function submit() {
  submitted.value = true
  toast.success('Заявка отправлена!')
  setTimeout(() => {
    submitted.value = false
    Object.assign(form, { name: '', email: '', phone: '', message: '', agreement: false })
  }, 3000)
}
</script>

<style scoped>
.form-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-iron-200);
  border-radius: 0.625rem;
  font-size: 0.8125rem;
  outline: none;
  transition: all 0.2s;
  background: white;
}
.form-input:focus {
  border-color: var(--color-gold-400);
  box-shadow: 0 0 0 3px rgba(201, 150, 59, 0.1);
}
.form-input-dark {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.1);
  color: var(--color-cream-100);
}
.form-input-dark::placeholder { color: var(--color-iron-500); }
.form-input-dark:focus {
  border-color: var(--color-gold-400);
  box-shadow: 0 0 0 3px rgba(201, 150, 59, 0.15);
  background: rgba(255,255,255,0.08);
}
</style>
