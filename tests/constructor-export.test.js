import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildHandoffText,
  buildPrintReportHtml,
  discussionProducts,
  escapeHtml,
  prepareDrawing,
  printProjectReport,
} from '../src/constructor/export.js'
import { createItem, createProject } from '../src/constructor/model.js'

const products = [
  { id: 1, name: 'Узор <script>alert(1)</script>', widthMm: 200, heightMm: 300, hidePrice: true, price: 987654 },
  {
    id: 2,
    name: 'Уголок & пара',
    requiresDimensions: true,
    saleUnit: 'pair',
    piecesPerSaleUnit: 2,
    hidePrice: true,
    price: 654321,
  },
  { id: 3, name: '<img src=x onerror=alert(2)>', requiresDimensions: true },
]
function project() {
  const value = createProject('fence')
  value.sections = 3
  value.items = [
    createItem(products[0], value),
    createItem(products[1], value, { dimensions: { widthMm: 400, heightMm: 700 } }),
  ]
  value.discussionItems = [3]
  value.comment = 'Нужна калитка. </p><script>alert("comment")</script>\nВторая строка'
  return value
}

test('handoff text includes all sections, paired ordering, discussion and comment without hidden prices', () => {
  const text = buildHandoffText(project(), products)
  assert.match(text, /Одинаковых секций: 3/)
  assert.match(text, /3 шт\./)
  assert.match(text, /2 пары/)
  assert.match(text, /запас 1 шт\./)
  assert.match(text, /Для обсуждения с мастером — не размещены/)
  assert.match(text, /арт\. 3.*размеры и количество уточнить/)
  assert.match(text, /Вторая строка/)
  assert.doesNotMatch(text, /987654|654321/)
  assert.deepEqual(
    discussionProducts(project(), products).map((product) => product.id),
    [3]
  )
})

test('print report escapes names, comments and warnings; only validated PNG can enter HTML attributes', () => {
  const value = project()
  value.items[0].x = -10
  const html = buildPrintReportHtml(value, products, 'data:image/png;base64,aGVsbG8=')
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  assert.match(html, /&lt;img src=x onerror=alert\(2\)&gt;/)
  assert.match(html, /&quot;comment&quot;/)
  assert.match(html, /Проверить размещение/)
  assert.match(html, /К покупке: 2 пар/)
  assert.match(html, /Запас: 1 шт/)
  assert.doesNotMatch(html, /<script|<img src=x|987654|654321/)
  for (const data of [
    'https://example.com/image.png',
    'data:image/svg+xml,<svg/>',
    'data:image/png;base64,x" onerror="alert(1)',
  ]) {
    assert.throws(() => buildPrintReportHtml(value, products, data), /изображение эскиза/)
  }
  assert.equal(escapeHtml('"\'&<>'), '&quot;&#39;&amp;&lt;&gt;')
})

test('missing or malformed SVG fails clearly before attempting image work', async () => {
  await assert.rejects(prepareDrawing(null), /загружается/)
  for (const viewBox of [null, '0 0 0 100', '0 0 10 NaN', '0 0 1', '0 0 -10 100']) {
    await assert.rejects(prepareDrawing({ cloneNode: () => ({}), getAttribute: () => viewBox }), /размер эскиза/)
  }
})

test('blocked printing window produces an explicit error without waiting for image export', async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { open: () => null } })
  try {
    await assert.rejects(printProjectReport(null, project(), products), /заблокировал окно печати/)
  } finally {
    if (previous) Object.defineProperty(globalThis, 'window', previous)
    else delete globalThis.window
  }
})
