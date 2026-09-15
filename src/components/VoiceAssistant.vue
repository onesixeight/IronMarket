<template>
  <aside class="voice-assistant" aria-label="Голосовой ИИ-помощник">
    <section
      v-if="open"
      id="voice-assistant-panel"
      ref="panel"
      class="voice-assistant__panel"
      role="dialog"
      aria-labelledby="voice-assistant-title"
      tabindex="-1"
      @keydown.esc.stop.prevent="closePanel"
    >
      <div class="voice-assistant__heading">
        <div>
          <p class="voice-assistant__eyebrow">ИИ · Тестовая версия</p>
          <h2 id="voice-assistant-title">Голосовой помощник</h2>
        </div>
        <button type="button" class="voice-assistant__close" aria-label="Закрыть помощника и завершить разговор" @click="closePanel">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </div>
      <p class="voice-assistant__intro">Спросите о кованых элементах, подборе и заказе.</p>
      <p class="voice-assistant__notice">Вы общаетесь с ИИ. Голос и сообщения обрабатывает ElevenLabs.</p>

      <p class="voice-assistant__status" role="status" aria-live="polite">
        <span class="voice-assistant__indicator" :class="{ 'is-connected': status === 'connected' }" aria-hidden="true"></span>
        {{ statusText }}
      </p>
      <p v-if="error" class="voice-assistant__error" role="alert">{{ error }}</p>

      <div class="voice-assistant__actions">
        <template v-if="status === 'connected'">
          <button type="button" class="voice-assistant__secondary" :aria-pressed="muted" @click="toggleMute">{{ muted ? 'Включить микрофон' : 'Выключить микрофон' }}</button>
          <button type="button" class="voice-assistant__primary" @click="end">Завершить разговор</button>
        </template>
        <button v-else-if="status === 'disconnect-error'" type="button" class="voice-assistant__primary" @click="end">Завершить разговор</button>
        <button v-else-if="status === 'connecting'" type="button" class="voice-assistant__secondary" @click="end">Отменить подключение</button>
        <button v-else type="button" class="voice-assistant__primary" :disabled="busy" @click="ready ? start() : prepare()">
          {{ busy ? 'Подождите…' : !ready ? 'Попробовать снова' : error ? 'Начать заново' : 'Начать разговор' }}
        </button>
      </div>
      <router-link to="/contacts" class="voice-assistant__contact" @click="closePanel">Связаться с менеджером</router-link>
    </section>

    <button
      ref="launcher"
      type="button"
      class="voice-assistant__launcher"
      :aria-expanded="open"
      aria-controls="voice-assistant-panel"
      @click="togglePanel"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="8.5" y="3" width="7" height="12" rx="3.5" /><path stroke-linecap="round" d="M5 11a7 7 0 0 0 14 0M12 18v3m-3 0h6" /></svg>
      <span>Голосовой помощник<small>ИИ · Тест</small></span>
    </button>
  </aside>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useVoiceAssistant } from '../composables/useVoiceAssistant.js'

const open = ref(false)
const panel = ref(null)
const launcher = ref(null)
const { status, ready, busy, error, muted, mode, prepare, start, end, toggleMute, dispose } = useVoiceAssistant()
const statusText = computed(() => {
  if (status.value === 'loading') return 'Загружаем помощника…'
  if (status.value === 'connecting') return 'Разрешите микрофон для подключения…'
  if (status.value === 'disconnecting') return 'Завершаем подключение…'
  if (status.value === 'disconnect-error') return 'Разговор пока не завершён'
  if (status.value === 'connected') {
    if (mode.value === 'speaking') return 'Помощник отвечает'
    return muted.value ? 'Микрофон выключен' : 'Помощник слушает'
  }
  return 'Микрофон включится после начала разговора'
})

async function closePanel() {
  if (!await end()) return
  open.value = false
  launcher.value?.focus()
}

async function togglePanel() {
  if (open.value) return closePanel()
  open.value = true
  void prepare()
  await nextTick()
  panel.value?.focus()
}

function endOnPageExit() { void end() }
onMounted(() => window.addEventListener('pagehide', endOnPageExit))
onBeforeUnmount(() => {
  window.removeEventListener('pagehide', endOnPageExit)
  void dispose()
})
</script>

<style scoped>
.voice-assistant {
  position: fixed;
  right: 1rem;
  bottom: calc(6.5rem + env(safe-area-inset-bottom));
  z-index: 60;
  color: var(--color-cream-100);
}
.voice-assistant__launcher {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 3.5rem;
  padding: 0.65rem 0.9rem;
  border: 1px solid rgb(var(--rgb-gold-400) / 0.4);
  border-radius: 1rem;
  background: linear-gradient(145deg, #292219, #12100d);
  box-shadow: 0 10px 30px rgb(var(--rgb-black) / 0.35);
  text-align: left;
  font-size: 0.76rem;
  font-weight: 700;
}
.voice-assistant__launcher svg { width: 1.35rem; height: 1.35rem; color: var(--color-gold-300); }
.voice-assistant__launcher small { display: block; margin-top: 0.15rem; color: var(--color-gold-300); font-size: 0.65rem; font-weight: 500; }
.voice-assistant__panel {
  position: absolute;
  right: 0;
  bottom: calc(100% + 0.75rem);
  width: min(22rem, calc(100vw - 2rem));
  max-height: calc(100dvh - 12rem - env(safe-area-inset-bottom));
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1.25rem;
  border: 1px solid rgb(var(--rgb-gold-400) / 0.22);
  border-radius: 1.5rem;
  background: rgb(var(--rgb-obsidian-900) / 0.98);
  box-shadow: 0 20px 65px rgb(var(--rgb-black) / 0.55);
}
.voice-assistant__heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
.voice-assistant__eyebrow { margin: 0 0 0.35rem; color: var(--color-gold-300); font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; }
.voice-assistant__heading h2 { margin: 0; font-family: var(--font-heading); font-size: 1.3rem; line-height: 1.2; }
.voice-assistant__close { display: grid; flex: 0 0 2.75rem; width: 2.75rem; height: 2.75rem; place-items: center; border-radius: 0.7rem; }
.voice-assistant__close svg { width: 1.1rem; height: 1.1rem; }
.voice-assistant__intro { margin: 0.9rem 0 0; font-size: 0.85rem; line-height: 1.5; }
.voice-assistant__notice { margin: 0.6rem 0 0; color: rgb(var(--rgb-cream-100) / 0.65); font-size: 0.74rem; line-height: 1.5; }
.voice-assistant__status { display: flex; align-items: center; gap: 0.5rem; margin: 1rem 0; font-size: 0.78rem; }
.voice-assistant__indicator { flex: 0 0 0.45rem; width: 0.45rem; height: 0.45rem; border-radius: 50%; background: rgb(var(--rgb-cream-100) / 0.4); }
.voice-assistant__indicator.is-connected { background: #8ed4a3; }
.voice-assistant__error { margin: 0 0 1rem; color: #f5b4a5; font-size: 0.78rem; line-height: 1.5; }
.voice-assistant__actions { display: grid; gap: 0.6rem; }
.voice-assistant__primary, .voice-assistant__secondary { min-height: 2.75rem; padding: 0.65rem 1rem; border-radius: 0.8rem; font-size: 0.8rem; font-weight: 700; }
.voice-assistant__primary { background: linear-gradient(135deg, #c9963b, #e4b96d); color: #090807; }
.voice-assistant__secondary { border: 1px solid rgb(var(--rgb-gold-400) / 0.3); background: transparent; }
.voice-assistant button:disabled { opacity: 0.6; cursor: wait; }
.voice-assistant button:not(:disabled):hover { filter: brightness(1.15); }
.voice-assistant button:focus-visible, .voice-assistant a:focus-visible, .voice-assistant__panel:focus-visible { outline: 2px solid var(--color-gold-300); outline-offset: 3px; }
.voice-assistant__contact { display: block; margin-top: 1rem; text-align: center; color: var(--color-gold-300); font-size: 0.74rem; text-decoration: underline; text-underline-offset: 3px; }
@media (min-width: 1024px) {
  .voice-assistant { right: 1.5rem; bottom: 5.5rem; }
  .voice-assistant__panel { max-height: calc(100dvh - 11rem); }
}
</style>
