<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4">
    <div class="w-full max-w-md animate-scale-in">
      <div class="bg-obsidian-800 border border-obsidian-600/60 rounded-2xl p-8 sm:p-10 shadow-2xl shadow-black/40">
        <div class="text-center mb-8">
          <div class="shimmer inline-block mb-2">
            <span class="font-heading text-2xl font-bold text-gold-400 tracking-wide">ЭТАЛОН</span>
          </div>
          <div class="text-[10px] text-gold-400/60 tracking-[0.3em] uppercase font-heading mb-6">КОВКА</div>
          <h1 class="ornament-line font-heading text-lg font-semibold text-cream-100 mb-2">Админ-панель</h1>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-xs font-medium text-cream-100/60 uppercase tracking-wider mb-2">Пароль</label>
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input pr-10"
              placeholder="Введите пароль"
              autocomplete="current-password"
              ref="passwordInput"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-[38px] text-obsidian-500 hover:text-gold-400 transition-colors"
            >
              <svg v-if="!showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>
              </svg>
            </button>
          </div>

          <transition name="fade">
            <p v-if="error" class="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">
              {{ error }}
            </p>
          </transition>

          <button
            type="submit"
            :disabled="loading || !password"
            class="shimmer w-full py-3 px-6 rounded-xl font-semibold text-sm tracking-wide text-obsidian-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            :style="{ background: 'linear-gradient(135deg, #C9A96E, #D4AF37)' }"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Вход...
            </span>
            <span v-else>Войти</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin'

const router = useRouter()
const adminStore = useAdminStore()

const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const passwordInput = ref(null)

async function handleLogin() {
  if (!password.value) return
  loading.value = true
  error.value = ''

  const success = await adminStore.login(password.value)

  if (success) {
    router.push('/admin')
  } else {
    error.value = 'Неверный пароль'
    password.value = ''
  }

  loading.value = false
}

onMounted(() => {
  passwordInput.value?.focus()
})
</script>
