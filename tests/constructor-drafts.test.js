import assert from 'node:assert/strict'
import test from 'node:test'
import { CONSTRUCTOR_DRAFTS_KEY, MAX_DRAFTS, readDrafts, removeDraft, saveDraft } from '../src/constructor/drafts.js'
import { createItem, createProject } from '../src/constructor/model.js'

const products = [
  { id: 1, widthMm: 200, heightMm: 300 },
  { id: 2, requiresDimensions: true },
]
function memoryStorage() {
  const data = new Map()
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }
}
function project() {
  const value = createProject('fence')
  value.sections = 3
  value.comment = 'Калитка в том же стиле'
  value.discussionItems = [2]
  value.items = [createItem(products[0], value, { rotation: 35, flipX: true, locked: true, groupId: 'motif' })]
  return value
}

test('named variants preserve full normalized snapshots independently of later edits', () => {
  const storage = memoryStorage()
  const original = project()
  const before = structuredClone(original)
  const saved = saveDraft(original, products, { name: '  Для забора  ', storage })
  assert.equal(saved.name, 'Для забора')
  assert.ok(saved.id && Number.isFinite(Date.parse(saved.updatedAt)))
  assert.deepEqual(saved.project, before)
  original.items[0].x = 50
  original.discussionItems.push(1)
  saved.project.comment = 'changed returned value'
  const restored = readDrafts(products, { storage })
  assert.equal(restored.length, 1)
  assert.deepEqual(restored[0].project, before)
  assert.doesNotMatch(storage.getItem(CONSTRUCTOR_DRAFTS_KEY), /base64|thumbnail/)
})

test('updates and deletion target one variant without changing other variants', () => {
  const storage = memoryStorage()
  const first = saveDraft(project(), products, { name: 'Первый', storage })
  const second = saveDraft(project(), products, { name: 'Второй', storage })
  const edited = project()
  edited.comment = 'Новый комментарий'
  saveDraft(edited, products, { id: first.id, name: 'Исправленный', storage })
  assert.equal(readDrafts(products, { storage }).find((entry) => entry.id === first.id).project.comment, edited.comment)
  const remaining = removeDraft(first.id, products, { storage })
  assert.deepEqual(remaining, [second])
  assert.throws(() => removeDraft(first.id, products, { storage }), /не найден/)
})

test('twentieth variant is retained and capacity errors never discard existing work', () => {
  const storage = memoryStorage()
  for (let index = 0; index < MAX_DRAFTS; index++) saveDraft(project(), products, { name: `Вариант ${index}`, storage })
  const before = storage.getItem(CONSTRUCTOR_DRAFTS_KEY)
  assert.throws(() => saveDraft(project(), products, { name: 'Лишний', storage }), /до 20 вариантов/)
  assert.equal(storage.getItem(CONSTRUCTOR_DRAFTS_KEY), before)
  const first = readDrafts(products, { storage })[0]
  saveDraft(project(), products, { name: 'Обновлённый', id: first.id, storage })
  assert.equal(readDrafts(products, { storage }).length, MAX_DRAFTS)
})

test('malformed storage, invalid snapshots, names, and quota failures are explicit and preserve storage', () => {
  const storage = memoryStorage()
  saveDraft(project(), products, { name: 'Исходный', storage })
  const before = storage.getItem(CONSTRUCTOR_DRAFTS_KEY)
  for (const name of ['', '  ', 'a'.repeat(81), null])
    assert.throws(() => saveDraft(project(), products, { name, storage }), /Назовите/)
  assert.throws(() => saveDraft({ ...project(), width: -1 }, products, { name: 'bad', storage }), /Ширина/)
  assert.equal(storage.getItem(CONSTRUCTOR_DRAFTS_KEY), before)
  const malformed = JSON.parse(before)
  malformed.entries[0].project.items[0].productId = 999
  for (const raw of [
    'invalid JSON',
    JSON.stringify(malformed),
    JSON.stringify({ version: 1, entries: [{ id: 'x' }] }),
  ]) {
    storage.setItem(CONSTRUCTOR_DRAFTS_KEY, raw)
    assert.throws(() => readDrafts(products, { storage }), /повреждены/)
    assert.throws(() => saveDraft(project(), products, { name: 'New', storage }), /повреждены/)
    assert.equal(storage.getItem(CONSTRUCTOR_DRAFTS_KEY), raw)
  }
  const quota = {
    getItem: () => before,
    setItem: () => {
      throw new Error('QuotaExceeded')
    },
  }
  assert.throws(() => saveDraft(project(), products, { name: 'Не влез', storage: quota }), /Не удалось сохранить/)
})
