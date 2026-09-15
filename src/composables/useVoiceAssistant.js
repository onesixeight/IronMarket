import { computed, ref } from 'vue'

export const VOICE_AGENT_ID = 'agent_6301m2gg2q8je2m8rgyhw8hj0hcj'

function microphoneError(error) {
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
    return 'Разрешите доступ к микрофону в браузере и попробуйте ещё раз.'
  }
  if (error?.name === 'NotFoundError' || error?.name === 'NotReadableError') {
    return 'Микрофон недоступен. Проверьте подключение и закройте приложения, которые его используют.'
  }
  return 'Не удалось подключиться. Проверьте интернет и попробуйте ещё раз.'
}

export function useVoiceAssistant({
  loadClient = () => import('./voiceAssistantClient.js'),
  supportsVoice = () => window.isSecureContext && Boolean(navigator.mediaDevices?.getUserMedia && window.AudioContext && window.AudioWorkletNode && window.WebSocket),
} = {}) {
  const status = ref('idle')
  const ready = ref(false)
  const error = ref('')
  const muted = ref(false)
  const mode = ref('listening')
  const busy = computed(() => ['loading', 'connecting', 'disconnecting'].includes(status.value))
  let client
  let loading
  let starting
  let ending
  let conversation
  let generation = 0
  let disposed = false

  async function prepare() {
    if (disposed || ready.value) return
    if (loading) return loading
    error.value = ''
    if (!supportsVoice()) {
      status.value = 'error'
      error.value = 'Голосовой разговор недоступен в этом браузере. Откройте сайт в актуальном Chrome или Safari либо напишите нам.'
      return
    }
    status.value = 'loading'
    loading = Promise.resolve().then(loadClient).then((loaded) => {
      client = loaded
      if (!disposed) {
        ready.value = true
        status.value = 'idle'
      }
    }).catch(() => {
      if (!disposed) {
        status.value = 'error'
        error.value = 'Не удалось загрузить помощника. Проверьте интернет и попробуйте ещё раз.'
      }
    }).finally(() => { loading = null })
    return loading
  }

  function end() {
    if (ending) return ending
    generation += 1
    const active = conversation
    const retryingShutdown = status.value === 'disconnect-error'
    conversation = null
    if (!active && !starting) return Promise.resolve(true)
    status.value = 'disconnecting'
    ending = (async () => {
      try {
        if (active) await active.endSession()
        // The SDK returns the session after microphone permission and connection.
        // Keep a cancelled start pending until its session has been closed.
        if (starting) await starting
        muted.value = false
        mode.value = 'listening'
        if (retryingShutdown) error.value = ''
        if (!disposed) status.value = error.value ? 'error' : 'idle'
        return true
      } catch {
        conversation = active || conversation
        error.value = 'Не удалось завершить разговор. Повторите попытку или закройте эту вкладку, чтобы отключить микрофон.'
        status.value = 'disconnect-error'
        return false
      }
    })().finally(() => { ending = null })
    return ending
  }

  function start() {
    if (disposed || !ready.value || busy.value || conversation || starting || ending || status.value === 'disconnect-error') return starting
    const attempt = ++generation
    const current = () => !disposed && attempt === generation
    error.value = ''
    muted.value = false
    status.value = 'connecting'

    starting = (async () => {
      try {
        let created
        try {
          created = await client.Conversation.startSession({
          agentId: VOICE_AGENT_ID,
          connectionType: 'websocket',
          useWakeLock: false,
          workletPaths: client.workletPaths,
          onConnect: () => { if (current()) status.value = 'connected' },
          onDisconnect: (details) => {
            if (!current()) return
            generation += 1
            conversation = null
            muted.value = false
            mode.value = 'listening'
            if (details.reason === 'error') error.value = 'Связь прервалась. Попробуйте начать разговор ещё раз.'
            status.value = error.value ? 'error' : 'idle'
          },
          onModeChange: ({ mode: nextMode }) => { if (current()) mode.value = nextMode },
          onError: () => {
            if (!current()) return
            error.value = 'Разговор прервался. Попробуйте подключиться ещё раз.'
            void end()
          },
          })
        } catch (failure) {
          if (current()) {
            error.value = microphoneError(failure)
            status.value = 'error'
          }
          return
        }
        if (!current()) {
          conversation = created
          await created.endSession()
          conversation = null
          return
        }
        conversation = created
        status.value = 'connected'
      } finally {
        starting = null
      }
    })()
    return starting
  }

  function toggleMute() {
    if (!conversation || status.value !== 'connected') return
    const nextMuted = !muted.value
    try {
      conversation.setMicMuted(nextMuted)
      muted.value = nextMuted
    } catch {
      error.value = 'Не удалось переключить микрофон. Завершите разговор и подключитесь снова.'
      void end()
    }
  }

  function dispose() {
    disposed = true
    return end()
  }

  return { status, ready, busy, error, muted, mode, prepare, start, end, toggleMute, dispose }
}
