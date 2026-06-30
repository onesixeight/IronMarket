<template>
  <form ref="formElement" @submit.prevent="openWhatsApp" class="space-y-4">
    <div>
      <label :for="fieldIds.name" class="block text-sm font-medium mb-1.5 text-cream-100">{{ nameLabel }} *</label>
      <input :id="fieldIds.name" v-model="form.name" type="text" autocomplete="name" :placeholder="namePlaceholder" required class="form-input" />
    </div>

    <div v-if="showEmail">
      <label :for="fieldIds.email" class="block text-sm font-medium mb-1.5 text-cream-100">Email</label>
      <input :id="fieldIds.email" v-model="form.email" type="email" autocomplete="email" placeholder="your@email.com" class="form-input" />
    </div>

    <div>
      <label :for="fieldIds.phone" class="block text-sm font-medium mb-1.5 text-cream-100">Телефон *</label>
      <input
        :id="fieldIds.phone"
        :value="form.phone"
        type="tel"
        placeholder="+7 (___) ___-__-__"
        required
        autocomplete="tel"
        class="form-input"
        @input="onPhoneInput"
      />
    </div>

    <div v-if="showMessage">
      <label :for="fieldIds.message" class="block text-sm font-medium mb-1.5 text-cream-100">Сообщение</label>
      <textarea
        :id="fieldIds.message"
        v-model="form.message"
        rows="4"
        :placeholder="messagePlaceholder"
        class="form-input"
      ></textarea>
    </div>

    <label class="flex items-start gap-3 text-sm text-cream-100/62 leading-relaxed">
      <input type="checkbox" v-model="form.agreement" required class="mt-1 accent-gold-500" />
      <span>Даю согласие на обработку персональных данных для обратной связи по заявке.</span>
    </label>

    <p class="text-xs text-cream-100/45 leading-relaxed">
      После нажатия откроется мессенджер с уже заполненной заявкой. Так сообщение не потеряется, а вы сразу попадёте в диалог.
    </p>

    <div class="grid gap-3 sm:grid-cols-2">
      <button type="submit" class="w-full metal-button justify-center">
        {{ buttonText }}
      </button>
      <button
        type="button"
        class="w-full metal-button-ghost justify-center"
        @click="openTelegram"
      >
        {{ telegramButtonText }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { computed, reactive, ref, useId, watch } from 'vue'
import { trackLead } from '../composables/useAnalytics.js'
import { usePhoneMask } from '../composables/usePhoneMask'
import { useMessengerLead } from '../composables/useMessengerLead'

const props = defineProps({
  nameLabel: { type: String, default: 'Имя' },
  namePlaceholder: { type: String, default: 'Как к вам обращаться' },
  buttonText: { type: String, default: 'Открыть WhatsApp' },
  telegramButtonText: { type: String, default: 'Написать в Telegram' },
  showEmail: { type: Boolean, default: false },
  showMessage: { type: Boolean, default: false },
  dark: { type: Boolean, default: true },
  sourceLabel: { type: String, default: 'с сайта Эталон Ковка' },
  initialMessage: { type: String, default: '' },
  messagePlaceholder: { type: String, default: 'Расскажите, что вам нужно...' },
})

const { formatPhone } = usePhoneMask()
const { getWhatsAppLeadLink, getTelegramLeadLink } = useMessengerLead()

const syncedInitialMessage = ref(props.initialMessage || '')
const form = reactive({ name: '', email: '', phone: '', message: syncedInitialMessage.value, agreement: false })
const formElement = ref(null)
const formId = useId()
const fieldIds = {
  name: `${formId}-name`,
  email: `${formId}-email`,
  phone: `${formId}-phone`,
  message: `${formId}-message`,
}

const whatsappLink = computed(() =>
  getWhatsAppLeadLink(form, { sourceLabel: props.sourceLabel })
)

const telegramLink = computed(() =>
  getTelegramLeadLink(form, { sourceLabel: props.sourceLabel })
)

watch(
  () => props.initialMessage,
  (message) => {
    const nextMessage = message || ''
    if (!form.message || form.message === syncedInitialMessage.value) {
      form.message = nextMessage
    }
    syncedInitialMessage.value = nextMessage
  }
)

function onPhoneInput(e) {
  form.phone = formatPhone(e.target.value)
}

function ensureValid() {
  return formElement.value?.reportValidity() !== false
}

function openLink(link, channel) {
  if (!ensureValid()) return
  trackLead(channel, { source: 'contact_form' })
  window.open(link, '_blank', 'noopener,noreferrer')
}

function openWhatsApp() {
  openLink(whatsappLink.value, 'whatsapp')
}

function openTelegram() {
  openLink(telegramLink.value, 'telegram')
}
</script>
