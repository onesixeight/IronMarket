import assert from 'node:assert/strict'
import test from 'node:test'
import { proposeArrangement } from '../src/constructor/alignment.js'
import { createItem, createProject, getItemBounds } from '../src/constructor/model.js'

const products = [
  { id: 1, name: 'Балясина', widthMm: 100, heightMm: 300 },
  { id: 2, name: 'Завиток', widthMm: 140, heightMm: 200 },
  { id: 3, name: 'Уголок', group: 'tube15', widthMm: 200, heightMm: 300 },
  { id: 4, name: 'Деталь с размером', requiresDimensions: true },
]
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.00001, `${actual} != ${expected}`)
const part = (project, x, y, overrides = {}, product = products[0]) =>
  createItem(product, project, { x, y, ...overrides })
const bounds = (item) =>
  getItemBounds(
    item,
    products.find((product) => product.id === item.productId)
  )
function checkStable(project, result, options = {}) {
  assert.equal(result.canApply, true, JSON.stringify(result.issues))
  const again = proposeArrangement({ ...project, items: result.items }, products, options)
  assert.equal(again.canApply, true)
  assert.equal(again.changed, false)
  assert.deepEqual(again.items, result.items)
}

test('preview preserves a horizontal sketch region and uses its median height, never frame center', () => {
  const project = createProject('fence')
  project.items = [part(project, 400, 650), part(project, 680, 620), part(project, 1200, 660)]
  const original = structuredClone(project)
  const result = proposeArrangement(project, products)
  assert.equal(result.sets[0].kind, 'row')
  assert.deepEqual(
    result.items.map((item) => item.x),
    [400, 800, 1200]
  )
  assert.deepEqual(
    result.items.map((item) => item.y),
    [650, 650, 650]
  )
  assert.equal(result.sets[0].gapMm, 300)
  assert.deepEqual(project, original)
  checkStable(project, result)
})

test('vertical columns preserve their top and bottom and align to median X', () => {
  const project = createProject('fence')
  project.items = [part(project, 650, 300), part(project, 670, 650), part(project, 640, 1500)]
  const result = proposeArrangement(project, products)
  assert.equal(result.sets[0].kind, 'column')
  assert.deepEqual(
    result.items.map((item) => item.y),
    [300, 900, 1500]
  )
  assert.deepEqual(
    result.items.map((item) => item.x),
    [650, 650, 650]
  )
  checkStable(project, result)
})

test('a diagonal requires an explicit direction or skip in preview', () => {
  const project = createProject('fence')
  project.items = [part(project, 400, 400), part(project, 800, 800), part(project, 1200, 1200)]
  const result = proposeArrangement(project, products)
  assert.equal(result.canApply, false)
  assert.equal(result.sets[0].kind, 'ambiguous')
  assert.deepEqual(result.items, project.items)
  const options = { overrides: [{ setId: result.sets[0].id, axis: 'x' }] }
  const horizontal = proposeArrangement(project, products, options)
  assert.equal(horizontal.canApply, true)
  assert.deepEqual(
    horizontal.items.map((item) => item.y),
    [800, 800, 800]
  )
  const skipped = proposeArrangement(project, products, { overrides: [{ setId: result.sets[0].id, axis: 'skip' }] })
  assert.equal(skipped.canApply, true)
  assert.equal(skipped.changed, false)
})

test('a two by three uniform grid preserves its occupied outer bounds on both axes', () => {
  const project = createProject('fence')
  project.items = [
    part(project, 400, 400),
    part(project, 740, 420),
    part(project, 1400, 390),
    part(project, 415, 1300),
    part(project, 760, 1280),
    part(project, 1390, 1320),
  ]
  const result = proposeArrangement(project, products)
  assert.equal(result.sets[0].kind, 'grid')
  assert.equal(result.sets[0].rows, 2)
  assert.equal(result.sets[0].columns, 3)
  assert.deepEqual(
    result.items.map((item) => [item.x, item.y]),
    [
      [400, 390],
      [900, 390],
      [1400, 390],
      [400, 1320],
      [900, 1320],
      [1400, 1320],
    ]
  )
  checkStable(project, result)
})

test('rotated explicit groups move rigidly and selecting a member expands the complete group', () => {
  const project = createProject('fence')
  project.items = [
    part(project, 400, 600, { groupId: 'flower', rotation: 35 }),
    part(project, 425, 620, { groupId: 'flower', flipX: true }, products[1]),
    part(project, 1300, 610),
  ]
  const options = { mode: 'distribute', ids: [project.items[0].id, project.items[2].id], axis: 'x' }
  const result = proposeArrangement(project, products, options)
  assert.equal(result.sets[0].itemIds.length, 3)
  near(result.items[1].x - result.items[0].x, 25)
  near(result.items[1].y - result.items[0].y, 20)
  result.items.forEach((item, index) => {
    assert.equal(item.rotation, project.items[index].rotation)
    assert.equal(item.flipX, project.items[index].flipX)
    assert.equal(item.groupId, project.items[index].groupId)
  })
  checkStable(project, result, options)
})

test('overlapping different products are not silently grouped; explicit direction resolves their meaning', () => {
  const project = createProject('fence')
  project.items = [part(project, 400, 600), part(project, 470, 610, {}, products[1]), part(project, 1000, 610)]
  const result = proposeArrangement(project, products)
  assert.equal(result.canApply, false)
  assert.equal(result.issues[0].kind, 'overlap')
  assert.deepEqual(result.items, project.items)
  const fixed = proposeArrangement(project, products, {
    overrides: [{ setId: result.sets[0].id, axis: 'x', itemIds: project.items.map((item) => item.id) }],
  })
  assert.equal(fixed.canApply, true)
  assert.equal(fixed.sets[0].itemIds.length, 3)
  assert.ok(bounds(fixed.items[1]).left >= bounds(fixed.items[0]).right)
})

test('insufficient occupied width is a blocking preview issue, without expanding or mutating the drawing', () => {
  const project = createProject('fence')
  project.items = [part(project, 400, 600), part(project, 430, 610), part(project, 460, 590)]
  const original = structuredClone(project)
  const result = proposeArrangement(project, products, { mode: 'distribute', axis: 'x' })
  assert.equal(result.canApply, false)
  assert.match(result.issues[0].message, /140 мм/)
  assert.deepEqual(result.items, project.items)
  assert.deepEqual(project, original)
})

test('locked internal members block changes while a stationary locked endpoint is a valid anchor', () => {
  const project = createProject('fence')
  project.items = [part(project, 400, 600), part(project, 650, 600, { locked: true }), part(project, 1200, 600)]
  const blocked = proposeArrangement(project, products)
  assert.equal(blocked.issues[0].kind, 'locked')
  assert.deepEqual(blocked.items, project.items)
  project.items[1].locked = false
  project.items[0].locked = true
  checkStable(project, proposeArrangement(project, products))
})

test('center is a separate rigid translation to true gate leaf centers', () => {
  const project = createProject()
  project.items = [part(project, 700, 650), part(project, 900, 650), part(project, 3300, 700)]
  const result = proposeArrangement(project, products, { mode: 'center', axis: 'x' })
  assert.deepEqual(
    result.items.map((item) => [item.x, item.y]),
    [
      [894, 650],
      [1094, 650],
      [3006, 700],
    ]
  )
  checkStable(project, result, { mode: 'center', axis: 'x' })
})

test('corner alignment changes only corner positions and keeps rotations and manual ornament dimensions', () => {
  const project = createProject()
  project.items = [
    part(project, 200, 250, { rotation: 180 }, products[2]),
    part(project, 1700, 1750, { flipX: true }, products[2]),
    part(project, 900, 700, { dimensions: { widthMm: 160, heightMm: 350 } }, products[3]),
  ]
  const result = proposeArrangement(project, products, { mode: 'corners', insetMm: 30 })
  near(bounds(result.items[0]).left, 70)
  near(bounds(result.items[0]).top, 70)
  near(bounds(result.items[1]).right, 1918)
  near(bounds(result.items[1]).bottom, 1930)
  assert.deepEqual(result.items[2], project.items[2])
  checkStable(project, result, { mode: 'corners', insetMm: 30 })
})

test('new collision with an excluded detail blocks the complete set', () => {
  const project = createProject('fence')
  project.items = [
    part(project, 400, 600),
    part(project, 650, 600),
    part(project, 1200, 600),
    part(project, 800, 700, {}, products[1]),
  ]
  const result = proposeArrangement(project, products, {
    mode: 'distribute',
    ids: project.items.slice(0, 3).map((item) => item.id),
    axis: 'x',
  })
  assert.equal(result.canApply, false)
  assert.ok(result.issues.some((issue) => issue.kind === 'collision'))
  assert.deepEqual(result.items, project.items)
})

test('cross-leaf groups and invalid selection or override input are rejected clearly', () => {
  const project = createProject()
  project.items = [part(project, 900, 900, { groupId: 'cross' }), part(project, 2900, 900, { groupId: 'cross' })]
  assert.equal(proposeArrangement(project, products).issues[0].kind, 'cross-panel')
  assert.throws(() => proposeArrangement(project, products, { ids: ['missing'] }), /существующие детали/)
  assert.throws(
    () => proposeArrangement(project, products, { overrides: [{ setId: 'missing', axis: 'x' }] }),
    /изменился/
  )
  assert.throws(() => proposeArrangement(project, products, { insetMm: -1 }), /Отступ/)
})

test('a mixed-size grid can be corrected to separate rows without flattening the whole grid', () => {
  const project = createProject('fence')
  project.items = [
    part(project, 400, 400),
    part(project, 740, 420, {}, products[1]),
    part(project, 1400, 390),
    part(project, 415, 1300),
    part(project, 760, 1280),
    part(project, 1390, 1320),
  ]
  const detected = proposeArrangement(project, products)
  assert.equal(detected.issues[0].kind, 'mixed-grid')
  const options = { overrides: [{ setId: detected.sets[0].id, axis: 'x' }] }
  const result = proposeArrangement(project, products, options)
  assert.equal(result.canApply, true)
  assert.deepEqual(
    result.items.map((item) => item.y),
    [400, 400, 400, 1300, 1300, 1300]
  )
  assert.equal(result.sets[0].rows, 2)
  checkStable(project, result, options)
})

test('a row that would absorb a nearby unrelated item requires an explicit membership decision', () => {
  const project = createProject('fence')
  project.items = [part(project, 400, 600), part(project, 1000, 720), part(project, 1500, 721)]
  const detected = proposeArrangement(project, products)
  assert.equal(detected.canApply, false)
  assert.equal(detected.issues[0].kind, 'membership')
  assert.deepEqual(detected.items, project.items)
  const result = proposeArrangement(project, products, {
    overrides: [{ setId: detected.sets[0].id, axis: 'x', itemIds: project.items.map((item) => item.id) }],
  })
  assert.equal(result.canApply, true)
  assert.deepEqual(
    result.items.map((item) => item.y),
    [720, 720, 720]
  )
})

test('corners stay in their sketch positions during automatic row arrangement', () => {
  const project = createProject('fence')
  project.items = [
    part(project, 170, 240, { rotation: 180 }, products[2]),
    part(project, 2300, 1510, { flipX: true }, products[2]),
    part(project, 500, 750),
    part(project, 860, 770),
    part(project, 1700, 760),
  ]
  const result = proposeArrangement(project, products)
  assert.deepEqual(result.items.slice(0, 2), project.items.slice(0, 2))
  checkStable(project, result)
})

test('manual dimensions and rotation survive a two-dimensional group center preview', () => {
  const project = createProject('fence')
  project.items = [
    part(
      project,
      800,
      800,
      { rotation: 35, dimensions: { widthMm: 231, heightMm: 123 }, groupId: 'custom' },
      products[3]
    ),
    part(
      project,
      850,
      830,
      { rotation: 75, dimensions: { widthMm: 110, heightMm: 180 }, groupId: 'custom' },
      products[3]
    ),
  ]
  const result = proposeArrangement(project, products, { mode: 'center', ids: [project.items[0].id], axis: 'both' })
  assert.equal(result.canApply, true)
  near(result.items[1].x - result.items[0].x, 50)
  near(result.items[1].y - result.items[0].y, 30)
  result.items.forEach((item, index) => {
    assert.deepEqual(item.dimensions, project.items[index].dimensions)
    assert.equal(item.rotation, project.items[index].rotation)
  })
  checkStable(project, result, { mode: 'center', ids: [project.items[0].id], axis: 'both' })
})

test('a preview that moves a rotated item into the frame is blocked atomically', () => {
  const project = createProject('fence')
  project.items = [part(project, 100, 250), part(project, 200, 650, { rotation: 90 }), part(project, 100, 1350)]
  const result = proposeArrangement(project, products, { mode: 'distribute', axis: 'y' })
  assert.equal(result.canApply, false)
  assert.ok(result.issues.some((issue) => issue.kind === 'bounds'))
  assert.deepEqual(result.items, project.items)
})

test('editing preview membership leaves excluded parts untouched and detects duplicate membership', () => {
  const project = createProject('fence')
  project.items = [
    part(project, 400, 400),
    part(project, 750, 430),
    part(project, 1300, 410),
    part(project, 500, 1300),
    part(project, 1700, 1320),
  ]
  const detected = proposeArrangement(project, products)
  assert.equal(detected.sets.length, 2)
  const first = detected.sets.find((set) => set.itemIds.includes(project.items[0].id))
  const second = detected.sets.find((set) => set.itemIds.includes(project.items[3].id))
  const excluded = project.items[1]
  const result = proposeArrangement(project, products, {
    overrides: [{ setId: first.id, axis: 'x', itemIds: [project.items[0].id, project.items[2].id] }],
  })
  assert.deepEqual(
    result.items.find((item) => item.id === excluded.id),
    excluded
  )
  assert.throws(
    () =>
      proposeArrangement(project, products, {
        overrides: [
          { setId: first.id, axis: 'x', itemIds: [project.items[0].id, project.items[2].id] },
          { setId: second.id, axis: 'x', itemIds: [project.items[0].id, project.items[3].id] },
        ],
      }),
    /несколько наборов/
  )
})

test('a seeded range of successful automatic arrangements has no second-click drift', () => {
  let seed = 58213
  const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296
  let accepted = 0
  for (let trial = 0; trial < 200; trial++) {
    const project = createProject('fence')
    project.items = Array.from({ length: 3 + Math.floor(random() * 4) }, () =>
      part(project, 200 + random() * 2000, 300 + random() * 1100)
    )
    const original = structuredClone(project)
    const result = proposeArrangement(project, products)
    assert.deepEqual(project, original)
    if (!result.canApply) continue
    accepted++
    checkStable(project, result)
  }
  assert.ok(accepted > 25)
})
