<template>
  <Transition name="consent">
    <div v-if="visible" class="consent" role="dialog" aria-label="Согласие на использование cookies" aria-live="polite">
      <div class="consent-body">
        <p class="consent-text">
          Мы используем cookie, чтобы сайт работал удобнее: запоминаем
          выбранные позиции и улучшаем подбор кованых элементов.
          <router-link to="/about" class="consent-link" @click="accept">Подробнее</router-link>.
        </p>
        <div class="consent-actions">
          <button type="button" class="consent-btn consent-decline" @click="decline">Отклонить</button>
          <button type="button" class="consent-btn consent-accept" @click="accept">Принять</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { initAnalytics } from '../composables/useAnalytics.js'

const STORAGE_KEY = 'cookie-consent'
const visible = ref(false)

onMounted(() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'accepted') {
      initAnalytics()
      return
    }
    if (stored === 'declined') {
      return
    }
    visible.value = true
  } catch {
    visible.value = true
  }
})

function accept() {
  try {
    localStorage.setItem(STORAGE_KEY, 'accepted')
  } catch {
    // Cookie consent should not block the form when storage is unavailable.
  }
  initAnalytics()
  visible.value = false
}

function decline() {
  try {
    localStorage.setItem(STORAGE_KEY, 'declined')
  } catch {
    // Cookie consent should still close when storage is unavailable.
  }
  visible.value = false
}
</script>

<style scoped>
.consent {
  position: fixed;
  left: 1rem;
  right: 1rem;
  bottom: 1rem;
  z-index: 80;
  margin: 0 auto;
  max-width: 40rem;
  border-radius: 1.25rem;
  border: 1px solid rgb(var(--rgb-gold-400) / 0.18);
  background: rgb(var(--rgb-obsidian-900) / 0.94);
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 60px rgb(var(--rgb-black) / 0.5);
  padding: 1rem 1.25rem;
}

.consent-body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.consent-text {
  margin: 0;
  color: rgb(var(--rgb-cream-100) / 0.78);
  font-size: 0.82rem;
  line-height: 1.55;
}

.consent-link {
  color: rgb(228, 185, 109);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.consent-actions {
  display: flex;
  gap: 0.6rem;
  justify-content: flex-end;
}

.consent-btn {
  border-radius: 0.75rem;
  padding: 0.55rem 1.1rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
}

.consent-btn:active {
  transform: scale(0.97);
}

.consent-accept {
  border: none;
  background: linear-gradient(135deg, #c9963b, #b8860b);
  color: #090807;
}

.consent-accept:hover {
  filter: brightness(1.08);
}

.consent-decline {
  border: 1px solid rgb(var(--rgb-gold-400) / 0.24);
  background: transparent;
  color: rgb(var(--rgb-cream-100) / 0.7);
}

.consent-decline:hover {
  border-color: rgb(var(--rgb-gold-400) / 0.4);
  color: rgb(var(--rgb-cream-100) / 0.9);
}

.consent-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.consent-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.consent-enter-from,
.consent-leave-to {
  opacity: 0;
  transform: translateY(16px);
}

@media (min-width: 640px) {
  .consent-body {
    flex-direction: row;
    align-items: center;
    gap: 1.5rem;
  }
  .consent-text {
    flex: 1;
  }
}
</style>
