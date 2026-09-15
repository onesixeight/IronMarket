import assert from 'node:assert/strict'
import test from 'node:test'
import { useVoiceAssistant, VOICE_AGENT_ID } from '../src/composables/useVoiceAssistant.js'

function deferred() {
  let resolve
  let reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function setup(startSession) {
  let imports = 0
  const assistant = useVoiceAssistant({
    supportsVoice: () => true,
    loadClient: async () => {
      imports += 1
      return { Conversation: { startSession }, workletPaths: { rawAudioProcessor: '/assets/raw-audio.js', audioConcatProcessor: '/assets/output-audio.js' } }
    },
  })
  return { assistant, get imports() { return imports } }
}

test('loading the assistant is lazy, deduplicated, and never starts a conversation', async () => {
  let starts = 0
  const state = setup(async () => { starts += 1 })
  assert.equal(state.imports, 0)
  await Promise.all([state.assistant.prepare(), state.assistant.prepare()])
  assert.equal(state.imports, 1)
  assert.equal(starts, 0)
  assert.equal(state.assistant.ready.value, true)
})

test('a failed download can be retried without opening the microphone', async () => {
  let attempts = 0
  const assistant = useVoiceAssistant({
    supportsVoice: () => true,
    loadClient: async () => {
      if (++attempts === 1) throw new Error('offline')
      return { Conversation: {} }
    },
  })
  await assistant.prepare()
  assert.equal(assistant.status.value, 'error')
  await assistant.prepare()
  assert.equal(assistant.status.value, 'idle')
  assert.equal(assistant.ready.value, true)
})

test('microphone refusal returns to a retryable state', async () => {
  let attempts = 0
  const { assistant } = setup(async () => {
    attempts += 1
    throw new DOMException('Permission denied', 'NotAllowedError')
  })
  await assistant.prepare()
  await assistant.start()
  assert.equal(assistant.status.value, 'error')
  assert.match(assistant.error.value, /Разрешите доступ к микрофону/)
  await assistant.start()
  assert.equal(attempts, 2)
})

test('an explicit start uses the public voice agent and supports muting and unmuting', async () => {
  let options
  let microphoneMuted
  const session = { endSession: async () => {}, setMicMuted: (value) => { microphoneMuted = value } }
  const { assistant } = setup(async (config) => { options = config; return session })
  await assistant.prepare()
  await assistant.start()
  assert.equal(options.agentId, VOICE_AGENT_ID)
  assert.equal(options.connectionType, 'websocket')
  assert.equal(options.useWakeLock, false)
  assert.deepEqual(options.workletPaths, { rawAudioProcessor: '/assets/raw-audio.js', audioConcatProcessor: '/assets/output-audio.js' })
  assistant.toggleMute()
  assert.equal(microphoneMuted, true)
  assistant.toggleMute()
  assert.equal(microphoneMuted, false)
  options.onModeChange({ mode: 'speaking' })
  assert.equal(assistant.mode.value, 'speaking')
  await assistant.end()
})

test('cancelling a pending start closes its late session and prevents parallel starts', async () => {
  const pending = deferred()
  let starts = 0
  let ends = 0
  const { assistant } = setup(() => { starts += 1; return pending.promise })
  await assistant.prepare()
  const start = assistant.start()
  assistant.start()
  const end = assistant.end()
  assistant.start()
  assert.equal(assistant.status.value, 'disconnecting')
  assert.equal(starts, 1)
  pending.resolve({ endSession: async () => { ends += 1 } })
  await Promise.all([start, end])
  assert.equal(ends, 1)
  assert.equal(assistant.status.value, 'idle')
})

test('concurrent closes share shutdown and do not unlock a new start early', async () => {
  const shutdown = deferred()
  let starts = 0
  let ends = 0
  const { assistant } = setup(async () => {
    starts += 1
    return { endSession: () => { ends += 1; return shutdown.promise } }
  })
  await assistant.prepare()
  await assistant.start()
  const first = assistant.end()
  const second = assistant.end()
  assistant.start()
  assert.equal(assistant.status.value, 'disconnecting')
  assert.equal(starts, 1)
  assert.equal(ends, 1)
  shutdown.resolve()
  assert.deepEqual(await Promise.all([first, second]), [true, true])
})

test('failed cleanup of a cancelled session is visible and can be retried', async () => {
  const pending = deferred()
  let ends = 0
  const { assistant } = setup(() => pending.promise)
  await assistant.prepare()
  const start = assistant.start()
  const startFailure = assert.rejects(start, /cleanup failed/)
  const end = assistant.end()
  pending.resolve({ endSession: async () => { if (++ends === 1) throw new Error('cleanup failed') } })
  await startFailure
  assert.equal(await end, false)
  assert.equal(assistant.status.value, 'disconnect-error')
  assert.match(assistant.error.value, /Не удалось завершить/)
  assert.equal(await assistant.end(), true)
  assert.equal(ends, 2)
  assert.equal(assistant.status.value, 'idle')
  assert.equal(assistant.error.value, '')
})

test('server disconnect and disposed instances ignore late events', async () => {
  let callbacks
  let ends = 0
  const { assistant } = setup(async (options) => {
    callbacks = options
    return { endSession: async () => { ends += 1 } }
  })
  await assistant.prepare()
  await assistant.start()
  callbacks.onDisconnect({ reason: 'error' })
  assert.equal(assistant.status.value, 'error')
  callbacks.onConnect({ conversationId: 'old' })
  assert.equal(assistant.status.value, 'error')
  await assistant.start()
  await assistant.dispose()
  callbacks.onModeChange({ mode: 'speaking' })
  assert.equal(assistant.mode.value, 'listening')
  assert.equal(ends, 1)
})

test('a normal agent end_call returns to idle, resets mute, and allows another call', async () => {
  let callbacks
  let starts = 0
  const { assistant } = setup(async (options) => {
    callbacks = options
    starts += 1
    return { endSession: async () => {}, setMicMuted: () => {} }
  })
  await assistant.prepare()
  await assistant.start()
  assistant.toggleMute()
  callbacks.onModeChange({ mode: 'speaking' })
  callbacks.onDisconnect({ reason: 'agent', context: { type: 'end_call', reason: 'Agent ended the call' } })

  assert.equal(assistant.status.value, 'idle')
  assert.equal(assistant.muted.value, false)
  assert.equal(assistant.mode.value, 'listening')
  assert.equal(assistant.error.value, '')
  await assistant.start()
  assert.equal(starts, 2)
  assert.equal(assistant.status.value, 'connected')
  await assistant.end()
})
