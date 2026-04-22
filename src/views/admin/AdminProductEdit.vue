<template>
  <div class="py-8">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-4 mb-8">
        <button
          @click="router.push('/admin/products')"
          class="p-2 rounded-lg text-cream-100/50 hover:text-gold-400 hover:bg-gold-400/10 transition-all"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
          </svg>
        </button>
        <div>
          <h1 class="font-heading text-2xl sm:text-3xl font-bold text-cream-100">
            {{ isEdit ? 'Редактирование' : 'Новый товар' }}
          </h1>
          <p v-if="isEdit" class="text-cream-100/50 text-sm mt-1">{{ form.name }}</p>
        </div>
      </div>

      <form @submit.prevent="handleSave" class="space-y-6">
        <div class="bg-obsidian-800 border border-obsidian-600/60 rounded-2xl p-6 sm:p-8 space-y-5">
          <div>
            <label class="block text-xs font-medium text-cream-100/60 uppercase tracking-wider mb-2">Название *</label>
            <input v-model="form.name" type="text" class="form-input" placeholder="Название товара" required />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-medium text-cream-100/60 uppercase tracking-wider mb-2">Цена ₸ *</label>
              <input v-model.number="form.price" type="number" min="0" class="form-input" placeholder="0" required />
            </div>
            <div>
              <label class="block text-xs font-medium text-cream-100/60 uppercase tracking-wider mb-2">Категория *</label>
              <select v-model="form.categorySlug" class="form-input" required>
                <option value="" disabled>Выберите категорию</option>
                <option v-for="cat in productStore.categories" :key="cat.slug" :value="cat.slug">
                  {{ cat.name }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-cream-100/60 uppercase tracking-wider mb-2">Описание</label>
            <textarea v-model="form.description" class="form-input min-h-[120px] resize-y" placeholder="Описание товара"></textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-medium text-cream-100/60 uppercase tracking-wider mb-2">Материал</label>
              <input v-model="form.material" type="text" class="form-input" placeholder="Сталь, чугун..." />
            </div>
            <div>
              <label class="block text-xs font-medium text-cream-100/60 uppercase tracking-wider mb-2">Изображение</label>
              <input v-model="form.image" type="text" class="form-input" placeholder="/images/products/..." />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-medium text-cream-100/60 uppercase tracking-wider mb-2">Бейдж (опционально)</label>
              <input v-model="form.badge" type="text" class="form-input" placeholder="Хит, Новинка..." />
            </div>
            <div>
              <label class="block text-xs font-medium text-cream-100/60 uppercase tracking-wider mb-2">Slug (URL)</label>
              <input v-model="form.slug" type="text" class="form-input" placeholder="auto-generated" />
            </div>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <button
              type="button"
              @click="form.hidePrice = !form.hidePrice"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 shrink-0"
              :class="form.hidePrice ? 'bg-gold-400' : 'bg-obsidian-600'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
                :class="form.hidePrice ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
            <div>
              <span class="text-sm text-cream-100">Скрыть цену</span>
              <p class="text-xs text-cream-100/40">Покупатели увидят «Цена по запросу»</p>
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="submit"
            :disabled="saving || !form.name || !form.categorySlug"
            class="shimmer w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-sm text-obsidian-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            :style="{ background: 'linear-gradient(135deg, #C9A96E, #D4AF37)' }"
          >
            <span v-if="saving" class="flex items-center justify-center gap-2">
              <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Сохранение...
            </span>
            <span v-else>{{ isEdit ? 'Сохранить изменения' : 'Создать товар' }}</span>
          </button>

          <button
            type="button"
            @click="router.push('/admin/products')"
            class="w-full sm:w-auto px-8 py-3 rounded-xl border border-obsidian-500 text-sm text-cream-100/70 hover:text-cream-100 hover:border-obsidian-400 transition-all"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductStore } from '../../stores/products'
import { useAdminStore } from '../../stores/admin'
import { useToastStore } from '../../stores/toast'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const adminStore = useAdminStore()
const toast = useToastStore()

const isEdit = computed(() => !!route.params.id)
const saving = ref(false)

const form = ref({
  name: '',
  price: 0,
  description: '',
  material: '',
  categorySlug: '',
  image: '',
  badge: '',
  slug: '',
  hidePrice: false,
})

onMounted(() => {
  if (isEdit.value) {
    const product = productStore.getProductById(Number(route.params.id))
    if (product) {
      form.value = {
        name: product.name || '',
        price: product.price || 0,
        description: product.description || '',
        material: product.material || '',
        categorySlug: product.categorySlug || '',
        image: product.image || '',
        badge: product.badge || '',
        slug: product.slug || '',
        hidePrice: product.hidePrice || false,
      }
    } else {
      toast.error('Товар не найден')
      router.push('/admin/products')
    }
  }
})

function generateSlug(name) {
  const map = { 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya' }
  return name.toLowerCase().split('').map(c => map[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function handleSave() {
  if (!form.value.name || !form.value.categorySlug) return
  saving.value = true

  const slug = form.value.slug || generateSlug(form.value.name)
  const data = { ...form.value, slug }

  if (isEdit.value) {
    const result = adminStore.updateProduct(Number(route.params.id), data)
    if (result) {
      toast.success('Товар обновлён')
      router.push('/admin/products')
    } else {
      toast.error('Ошибка при обновлении')
    }
  } else {
    adminStore.addProduct(data)
    toast.success('Товар создан')
    router.push('/admin/products')
  }

  saving.value = false
}
</script>
