import { normalizeProject } from './model.js'

export const CONSTRUCTOR_DRAFTS_KEY = 'etalon-constructor-drafts-v1'
export const MAX_DRAFTS = 20

function getStorage(storage) {
  try {
    const target = storage ?? globalThis.localStorage
    if (!target) throw new Error()
    return target
  } catch {
    throw new Error('Локальное хранилище недоступно. Скачайте файл проекта, чтобы сохранить работу.')
  }
}

function normalizeName(name) {
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) {
    throw new Error('Назовите вариант: от 1 до 80 символов.')
  }
  return name.trim()
}

export function readDrafts(products, { storage } = {}) {
  const target = getStorage(storage)
  let raw
  try {
    raw = target.getItem(CONSTRUCTOR_DRAFTS_KEY)
  } catch {
    throw new Error('Не удалось прочитать сохранённые варианты. Скачайте текущий проект.')
  }
  if (!raw) return []
  try {
    const data = JSON.parse(raw)
    if (data.version !== 1 || !Array.isArray(data.entries) || data.entries.length > MAX_DRAFTS) throw new Error()
    const ids = new Set()
    return data.entries.map((entry) => {
      if (!entry || typeof entry.id !== 'string' || !entry.id.trim() || entry.id.length > 100 || ids.has(entry.id))
        throw new Error()
      if (typeof entry.updatedAt !== 'string' || !Number.isFinite(Date.parse(entry.updatedAt))) throw new Error()
      ids.add(entry.id)
      return {
        id: entry.id,
        name: normalizeName(entry.name),
        updatedAt: entry.updatedAt,
        project: normalizeProject(entry.project, products),
      }
    })
  } catch {
    throw new Error(
      'Сохранённые варианты повреждены или содержат неподдерживаемый проект. Они оставлены без изменений; скачайте текущий проект.'
    )
  }
}

function persist(entries, storage) {
  try {
    getStorage(storage).setItem(CONSTRUCTOR_DRAFTS_KEY, JSON.stringify({ version: 1, entries }))
  } catch {
    throw new Error('Не удалось сохранить варианты на этом устройстве. Возможно, хранилище заполнено. Скачайте проект.')
  }
}

export function saveDraft(project, products, { name, id, storage } = {}) {
  const safeProject = normalizeProject(project, products)
  const safeName = normalizeName(name)
  const entries = readDrafts(products, { storage })
  const index = id === undefined ? -1 : entries.findIndex((entry) => entry.id === id)
  if (id !== undefined && index === -1) throw new Error('Этот сохранённый вариант больше не найден.')
  if (index === -1 && entries.length >= MAX_DRAFTS) {
    throw new Error(`Можно сохранить до ${MAX_DRAFTS} вариантов. Удалите ненужный вариант или скачайте проект.`)
  }
  const entry = {
    id: id ?? (globalThis.crypto?.randomUUID?.() || `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`),
    name: safeName,
    updatedAt: new Date().toISOString(),
    project: safeProject,
  }
  if (index === -1) entries.unshift(entry)
  else entries[index] = entry
  persist(entries, storage)
  return entry
}

export function removeDraft(id, products, { storage } = {}) {
  const entries = readDrafts(products, { storage })
  const remaining = entries.filter((entry) => entry.id !== id)
  if (remaining.length === entries.length) throw new Error('Этот сохранённый вариант больше не найден.')
  persist(remaining, storage)
  return remaining
}
