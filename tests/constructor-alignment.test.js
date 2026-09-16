import assert from 'node:assert/strict'
import test from 'node:test'
import { alignProjectItems } from '../src/constructor/alignment.js'
import { createItem, createProject, getItemBounds, getProjectWarnings } from '../src/constructor/model.js'

const products = [
  { id: 1, name: 'Балясина', widthMm: 200, heightMm: 600, group: 'balusters' },
  { id: 2, name: 'Уголок', widthMm: 430, heightMm: 700, group: 'corners' },
  { id: 3, name: 'Узор', widthMm: 830, heightMm: 560, group: 'ornaments' },
  { id: 4, name: 'Медальон', widthMm: 600, heightMm: 600, group: 'ornaments' },
  { id: 5, name: 'Акцент', widthMm: 100, heightMm: 200, group: 'elements' },
  { id: 6, name: 'Стойка', requiresDimensions: true },
]
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.00001, `${actual} != ${expected}`)
const productOf = (item) => products.find((product) => product.id === item.productId)
const boundsOf = (item) => getItemBounds(item, productOf(item))

function verify(project, result, options) {
  assert.deepEqual(getProjectWarnings({ ...project, items: result.items }, products), [])
  const again = alignProjectItems({ ...project, items: result.items }, products, options)
  assert.equal(again.changed, false, 'a second application is a no-op')
  assert.deepEqual(again.items, result.items)
  result.items.forEach((item, index) => {
    const before = { ...project.items[index] }
    const after = { ...item }
    delete before.x
    delete before.y
    delete after.x
    delete after.y
    assert.deepEqual(after, before, 'only coordinates may change')
  })
}

test('three repeated balusters form one centered row with equal internal gaps and exact lateral inset', () => {
  const project = createProject('fence')
  project.items = [
    [450, 840],
    [560, 920],
    [1700, 870],
  ].map(([x, y]) => createItem(products[0], project, { x, y }))
  const original = structuredClone(project)
  const result = alignProjectItems(project, products)
  assert.equal(result.changed, true)
  assert.deepEqual(result.summary, { corners: 0, rows: 1, groups: 0 })
  const bounds = result.items.map(boundsOf)
  near(bounds[0].left, 60)
  near(bounds[2].right, 2440)
  const gaps = [bounds[1].left - bounds[0].right, bounds[2].left - bounds[1].right]
  gaps.forEach((gap) => near(gap, gaps[0]))
  result.items.forEach((item) => near(item.y, 900))
  assert.deepEqual(project, original)
  verify(project, result)
})

test('four corners and three vertical ornaments fit one actual gate leaf with exact frame inset', () => {
  const project = createProject()
  project.items = [
    createItem(products[1], project, { x: 290, y: 440, rotation: 180, flipX: true }),
    createItem(products[1], project, { x: 1700, y: 400, rotation: 180 }),
    createItem(products[1], project, { x: 300, y: 1600 }),
    createItem(products[1], project, { x: 1730, y: 1580, flipX: true }),
    ...[400, 990, 1590].map((y) => createItem(products[2], project, { x: 1050, y })),
  ]
  const result = alignProjectItems(project, products)
  assert.deepEqual(result.summary, { corners: 4, rows: 3, groups: 0 })
  const corners = result.items.slice(0, 4).map(boundsOf)
  near(corners[0].left, 60)
  near(corners[0].top, 60)
  near(corners[1].right, 1928)
  near(corners[1].top, 60)
  near(corners[2].left, 60)
  near(corners[2].bottom, 1940)
  near(corners[3].right, 1928)
  near(corners[3].bottom, 1940)
  result.items.slice(4).forEach((item) => near(item.x, 994))
  verify(project, result)
})

test('different overlapping products keep their composition while a separate ornament is spaced', () => {
  const project = { ...createProject('fence'), width: 3200, height: 2000 }
  project.items = [
    createItem(products[3], project, { x: 650, y: 930 }),
    createItem(products[4], project, { x: 760, y: 960, rotation: 35, flipX: true }),
    createItem(products[3], project, { x: 2400, y: 980 }),
  ]
  const result = alignProjectItems(project, products)
  assert.equal(result.summary.groups, 1)
  near(result.items[1].x - result.items[0].x, 110)
  near(result.items[1].y - result.items[0].y, 30)
  verify(project, result)
})

test('independent gate leaves use 994 and 3006 centers; rotated custom sizes stay fixed', () => {
  const project = createProject()
  project.items = [
    createItem(products[5], project, { x: 750, y: 970, rotation: 35, dimensions: { widthMm: 160, heightMm: 900 } }),
    createItem(products[0], project, { x: 3400, y: 1030 }),
  ]
  const result = alignProjectItems(project, products)
  near(result.items[0].x, 994)
  near(result.items[1].x, 3006)
  result.items.forEach((item) => near(item.y, 1000))
  verify(project, result)
  assert.notEqual(result.items[0].dimensions, project.items[0].dimensions)
})

test('failure is atomic for duplicate corner targets, oversized rows, seam ambiguity and invalid inset', () => {
  const project = createProject('wicket')
  project.items = [
    createItem(products[1], project, { x: 260, y: 420 }),
    createItem(products[1], project, { x: 270, y: 430 }),
  ]
  const original = structuredClone(project)
  assert.throws(() => alignProjectItems(project, products), /несколько уголков/)
  assert.deepEqual(project, original)
  project.items = [400, 1000, 1600].map((y) => createItem({ ...products[3], heightMm: 900 }, project, { x: 500, y }))
  const tallProducts = products.map((product) => (product.id === 4 ? { ...product, heightMm: 900 } : product))
  assert.throws(() => alignProjectItems(project, tallProducts), /не хватает места/)
  const gates = createProject()
  gates.items = [createItem(products[0], gates, { x: 2000 })]
  assert.throws(() => alignProjectItems(gates, products), /стыке створок/)
  for (const insetMm of [-1, 1001, NaN, Infinity])
    assert.throws(() => alignProjectItems(project, products, { insetMm }), /Отступ/)
})

test('a single ornament centers, inset is respected, and an empty project stays unchanged', () => {
  const project = createProject('wicket')
  assert.deepEqual(alignProjectItems(project, products), {
    items: [],
    changed: false,
    summary: { corners: 0, rows: 0, groups: 0 },
  })
  project.items = [createItem(products[3], project, { x: 420, y: 990 })]
  const result = alignProjectItems(project, products, { insetMm: 100 })
  near(result.items[0].x, 500)
  near(result.items[0].y, 1000)
  verify(project, result, { insetMm: 100 })
})

test('tiny manually sized rows stay separate on repeated alignment, including the 40 mm grouping boundary', () => {
  for (const separation of [40, 40.001, 80]) {
    const project = createProject('fence')
    project.items = [
      createItem(products[5], project, { x: 600, y: 860, dimensions: { widthMm: 10, heightMm: 10 } }),
      createItem(products[5], project, { x: 1700, y: 860 + separation, dimensions: { widthMm: 10, heightMm: 10 } }),
    ]
    const result = alignProjectItems(project, products)
    assert.equal(result.summary.rows, separation === 40 ? 1 : 2)
    if (result.summary.rows === 2) assert.ok(Math.abs(result.items[0].y - result.items[1].y) > 40)
    verify(project, result)
  }
})

test('a roughly drawn row with 150 mm vertical variation aligns as one row', () => {
  const project = { ...createProject('wicket'), width: 3600, height: 2600 }
  project.items = [
    [792, 1220, 1000, 400],
    [1872, 1370, 860, 570],
    [2988, 1280, 830, 560],
  ].map(([x, y, widthMm, heightMm]) => createItem(products[5], project, { x, y, dimensions: { widthMm, heightMm } }))
  const result = alignProjectItems(project, products)
  assert.equal(result.summary.rows, 1)
  result.items.forEach((item) => near(item.y, 1300))
  verify(project, result)
})

test('packing settles rows that enter the center snap zone in the same action', () => {
  const project = { ...createProject('fence'), width: 2500, height: 2000 }
  project.items = [
    [700, 100],
    [800, 300],
  ].map(([y, heightMm]) => createItem(products[5], project, { x: 650, y, dimensions: { widthMm: 100, heightMm } }))
  const result = alignProjectItems(project, products)
  assert.equal(result.summary.rows, 2)
  near(result.items[0].y, 700)
  near(result.items[1].y, 1000)
  verify(project, result)
})

test('zero inset on rotated manual pieces touches the inner frame without false overlap warnings', () => {
  const project = { ...createProject('fence'), width: 2000, height: 1800 }
  project.items = [350, 900, 1600].map((x, index) =>
    createItem(products[5], project, {
      x,
      y: 900,
      rotation: 35,
      dimensions: { widthMm: 230 + index * 25, heightMm: 120 },
    })
  )
  const result = alignProjectItems(project, products, { insetMm: 0 })
  near(boundsOf(result.items[0]).left, 40)
  near(boundsOf(result.items[2]).right, 1960)
  verify(project, result, { insetMm: 0 })
})

test('varied rotated manual dimensions remain bounded and stable after one action', () => {
  let seed = 49213
  const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296
  let accepted = 0
  for (let trial = 0; trial < 200; trial++) {
    const project = {
      ...createProject('fence'),
      width: 1000 + random() * 3000,
      height: 1000 + random() * 2500,
    }
    project.items = Array.from({ length: 1 + Math.floor(random() * 8) }, () =>
      createItem(products[5], project, {
        x: random() * project.width,
        y: random() * project.height,
        rotation: Math.floor(random() * 360),
        dimensions: { widthMm: 10 + random() * 400, heightMm: 10 + random() * 500 },
      })
    )
    const original = structuredClone(project)
    let result
    try {
      result = alignProjectItems(project, products)
    } catch (error) {
      assert.match(error.message, /не хватает места/)
      assert.deepEqual(project, original)
      continue
    }
    accepted++
    assert.deepEqual(project, original)
    result.items.forEach((item) => {
      const bounds = boundsOf(item)
      assert.ok(bounds.left >= 60 - 0.00001 && bounds.top >= 60 - 0.00001)
      assert.ok(bounds.right <= project.width - 60 + 0.00001 && bounds.bottom <= project.height - 60 + 0.00001)
    })
    verify(project, result)
  }
  assert.ok(accepted > 150, 'exercise many successfully packed configurations')
})
