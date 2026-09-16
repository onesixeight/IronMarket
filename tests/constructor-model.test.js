import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PROJECT_LIMITS,
  buildProjectText,
  createItem,
  createProject,
  distributeItems,
  getBillOfMaterials,
  getFramePanels,
  getItemBounds,
  getProjectWarnings,
  mirrorItem,
  mirrorItemInFrame,
  normalizeProject,
  resolveItemProduct,
} from '../src/constructor/model.js'

const products = [
  { id: 1, name: 'Корона', widthMm: 600, heightMm: 200, price: 123456, hidePrice: true },
  { id: 2, name: 'Завиток', widthMm: 100, heightMm: 300, price: 2500, hidePrice: false },
  { id: 3, name: 'Узор', widthMm: 200, heightMm: 200, hidePrice: true },
]
const customProducts = [
  { id: 4, name: 'Столб', widthMm: 40, heightMm: null, requiresDimensions: true, hidePrice: true, price: 654321 },
  {
    id: 5,
    name: 'Парный узор',
    widthMm: 400,
    heightMm: 600,
    requiresDimensions: true,
    saleUnit: 'pair',
    piecesPerSaleUnit: 2,
    hidePrice: true,
    price: 987654,
  },
]
const approximately = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.000001)

test('all panel consumers share true leaf centers, the seam and the inner frame boundary', () => {
  const gates = createProject()
  const outer = getFramePanels(gates)
  assert.deepEqual(
    outer.map(({ left, right, centerX }) => [left, right, centerX]),
    [
      [0, 1988, 994],
      [2012, 4000, 3006],
    ]
  )
  const inner = getFramePanels(gates, { inner: true, insetMm: 20 })
  assert.deepEqual(
    inner.map(({ left, right, top, bottom, centerX }) => [left, right, top, bottom, centerX]),
    [
      [60, 1928, 60, 1940, 994],
      [2072, 3940, 60, 1940, 3006],
    ]
  )
  assert.equal(createItem(products[0], gates).x, outer[0].centerX)
  assert.equal(getFramePanels(createProject('wicket'))[0].centerX, 500)
  assert.equal(getFramePanels(createProject('fence'))[0].centerX, 1250)
  assert.throws(() => getFramePanels(gates, { insetMm: -1 }), /Отступ/)
  assert.throws(() => getFramePanels(createProject('wicket'), { inner: true, insetMm: 500 }), /не осталось места/)
})

test('optional groups, locks, corner settings and discussion notes survive version-one imports', () => {
  const project = createProject('fence')
  project.items = [createItem(products[0], project, { groupId: 'flower', locked: true })]
  project.cornerInsetMm = 35
  project.discussionItems = [2, 3]
  project.comment = 'Нужен такой узор\nЦвет обсудим отдельно.'
  const restored = normalizeProject(JSON.parse(JSON.stringify(project)), products)
  assert.deepEqual(restored, project)
  assert.notEqual(restored.discussionItems, project.discussionItems)
  const old = createProject()
  old.alignmentInsetMm = 30
  assert.deepEqual(normalizeProject(old, products), old, 'old projects gain no optional fields')
  assert.equal(createItem(products[0], old).x, 994, 'default placement uses the actual left leaf center')
})

test('invalid group, lock and discussion metadata fail clearly instead of corrupting an import', () => {
  const project = createProject('fence')
  project.items = [createItem(products[0], project)]
  for (const metadata of [
    { groupId: '' },
    { groupId: 'x'.repeat(101) },
    { groupId: 3 },
    { locked: 'yes' },
    { locked: null },
  ])
    assert.throws(
      () => normalizeProject({ ...project, items: [{ ...project.items[0], ...metadata }] }, products),
      /группы|закрепление/
    )
  for (const metadata of [
    { cornerInsetMm: -1 },
    { cornerInsetMm: Infinity },
    { comment: 10 },
    { comment: 'a'.repeat(2001) },
    { discussionItems: [1, 1] },
    { discussionItems: [999] },
    { discussionItems: '1' },
  ])
    assert.throws(() => normalizeProject({ ...project, ...metadata }, products), /Отступ|Комментарий|Список/)
})

test('templates have useful defaults and items keep physical dimensions when frame changes', () => {
  assert.deepEqual(createProject(), {
    version: 1,
    type: 'gates',
    width: 4000,
    height: 2000,
    sections: 1,
    items: [],
  })
  assert.equal(createProject('wicket').width, 1000)
  assert.equal(createProject('fence').height, 1800)
  const project = createProject()
  const item = createItem(products[0], project, { x: 800, y: 700, width: 9999 })
  const before = getItemBounds(item, products[0])
  project.width = 6000
  project.height = 3500
  assert.deepEqual(getItemBounds(item, products[0]), before)
  assert.equal(before.width, 600)
  assert.equal(before.height, 200)
  assert.equal(item.width, undefined)
  assert.notEqual(createItem(products[0], project).id, item.id)
})

test('rotated bounds and mirrored items preserve geometry and receive unique IDs', () => {
  const original = createItem(products[0], createProject(), { x: 750, y: 900, rotation: 30 })
  const reflected = mirrorItem(original, 4000)
  const a = getItemBounds(original, products[0])
  const b = getItemBounds(reflected, products[0])
  assert.notEqual(original.id, reflected.id)
  assert.equal(reflected.rotation, -30)
  assert.equal(reflected.flipX, true)
  assert.equal(reflected.y, original.y)
  approximately(b.left, 4000 - a.right)
  approximately(b.right, 4000 - a.left)
  approximately(a.width, 600 * Math.cos(Math.PI / 6) + 200 * Math.sin(Math.PI / 6))
  assert.equal(getItemBounds({ ...original, rotation: 90 }, products[0]).width, 200)
  const restored = mirrorItem(reflected, 4000)
  assert.equal(restored.x, original.x)
  assert.equal(restored.rotation, original.rotation)
  assert.equal(restored.flipX, original.flipX)
})

function transformLocalPoint(item, [localX, localY]) {
  const radians = (item.rotation * Math.PI) / 180
  const x = localX * (item.flipX ? -1 : 1)
  return [
    item.x + Math.cos(radians) * x - Math.sin(radians) * localY,
    item.y + Math.sin(radians) * x + Math.cos(radians) * localY,
  ]
}

test('frame mirrors reflect every transformed point correctly for arbitrary rotation and prior flip', () => {
  const project = createProject()
  const cases = [
    { scope: 'panel', x: 400, centerX: 994 },
    { scope: 'panel', x: 3600, centerX: 3006 },
    { scope: 'project', x: 400, centerX: 2000 },
  ]
  for (const { scope, x, centerX } of cases) {
    for (const rotation of [180, 35]) {
      for (const flipX of [false, true]) {
        const original = createItem(products[0], project, { x, y: 430, rotation, flipX })
        const before = structuredClone(original)
        for (const axis of ['horizontal', 'vertical', 'diagonal']) {
          const result = mirrorItemInFrame(original, project, { axis, scope })
          assert.notEqual(result.id, original.id)
          assert.equal(result.productId, original.productId)
          assert.ok(result.rotation >= 0 && result.rotation < 360)
          for (const point of [
            [-215, -350],
            [127, -291],
            [-83, 233],
            [215, 350],
          ]) {
            const source = transformLocalPoint(original, point)
            const actual = transformLocalPoint(result, point)
            approximately(actual[0], axis === 'vertical' ? source[0] : 2 * centerX - source[0])
            approximately(actual[1], axis === 'horizontal' ? source[1] : project.height - source[1])
          }
        }
        assert.deepEqual(original, before)
      }
    }
  }
})

test('corner copies preserve exact edge offsets within the actual gate leaf including its gap', () => {
  const project = createProject()
  const corner = { id: 6, widthMm: 430, heightMm: 700 }
  const original = createItem(corner, project, { x: 275, y: 410, rotation: 180, flipX: true })
  const originalBounds = getItemBounds(original, corner)
  const horizontal = mirrorItemInFrame(original, project)
  const vertical = mirrorItemInFrame(original, project, { axis: 'vertical' })
  const diagonal = mirrorItemInFrame(original, project, { axis: 'diagonal' })
  assert.equal(horizontal.x, 1713, 'left-leaf reflection uses 1988 mm, not the 2000 mm half width')
  assert.equal(horizontal.y, original.y)
  assert.equal(vertical.x, original.x)
  assert.equal(vertical.y, 1590)
  assert.equal(diagonal.x, horizontal.x)
  assert.equal(diagonal.y, vertical.y)
  const diagonalBounds = getItemBounds(diagonal, corner)
  approximately(diagonalBounds.width, originalBounds.width)
  approximately(diagonalBounds.height, originalBounds.height)
  approximately(1988 - diagonalBounds.right, originalBounds.left)
  approximately(project.height - diagonalBounds.bottom, originalBounds.top)
  const onRight = { ...original, x: original.x + 2012 }
  assert.equal(mirrorItemInFrame(onRight, project).x, 3725)
  assert.equal(mirrorItemInFrame(original, project, { scope: 'project' }).x, 3725)
})

test('wicket and fence use the whole frame, manual sizes clone independently, and invalid options fail', () => {
  for (const type of ['wicket', 'fence']) {
    const project = createProject(type)
    const original = createItem(customProducts[0], project, {
      x: 250,
      y: 500,
      rotation: 35,
      flipX: true,
      dimensions: { widthMm: 160, heightMm: 700 },
    })
    const panel = mirrorItemInFrame(original, project, { axis: 'diagonal' })
    const full = mirrorItemInFrame(original, project, { axis: 'diagonal', scope: 'project' })
    const { id: panelId, ...panelGeometry } = panel
    const { id: fullId, ...fullGeometry } = full
    assert.notEqual(panelId, fullId)
    assert.deepEqual(panelGeometry, fullGeometry)
    assert.deepEqual(panel.dimensions, original.dimensions)
    assert.notEqual(panel.dimensions, original.dimensions)
    panel.dimensions.widthMm = 400
    assert.equal(original.dimensions.widthMm, 160)
    assert.throws(() => mirrorItemInFrame(original, project, { axis: 'depth' }), /направлен|отражен/i)
    assert.throws(() => mirrorItemInFrame(original, project, { scope: 'leaf' }), /област|отражен/i)
  }
})

test('equal distribution uses edge gaps for different-sized rotated items and keeps input order', () => {
  const project = createProject()
  const left = createItem(products[0], project, { x: 500, y: 800 })
  const right = createItem(products[1], project, { x: 1700, y: 800, rotation: 90 })
  const middle = createItem(products[2], project, { x: 1200, y: 800 })
  const items = [right, left, middle]
  const result = distributeItems(items, products)
  assert.deepEqual(
    result.map((item) => item.id),
    items.map((item) => item.id)
  )
  assert.equal(result[0].x, right.x)
  assert.equal(result[1].x, left.x)
  const bounds = [result[1], result[2], result[0]].map((item) =>
    getItemBounds(
      item,
      products.find((p) => p.id === item.productId)
    )
  )
  approximately(bounds[1].left - bounds[0].right, bounds[2].left - bounds[1].right)
  assert.equal(middle.x, 1200, 'the input is not mutated')
  const vertical = items.map((item) => ({ ...item, y: item.x }))
  const distributedY = distributeItems(vertical, products, 'y')
  const yBounds = [distributedY[1], distributedY[2], distributedY[0]].map((item) =>
    getItemBounds(
      item,
      products.find((p) => p.id === item.productId)
    )
  )
  approximately(yBounds[1].top - yBounds[0].bottom, yBounds[2].top - yBounds[1].bottom)
})

test('distribution leaves insufficient space and fewer than three elements alone', () => {
  const project = createProject()
  const cramped = [500, 550, 600].map((x) => createItem(products[0], project, { x }))
  assert.deepEqual(distributeItems(cramped, products), cramped)
  assert.deepEqual(distributeItems(cramped.slice(0, 2), products), cramped.slice(0, 2))
})

test('bill of materials groups catalog IDs and multiplies repeated fence sections only', () => {
  const project = createProject('fence')
  project.sections = 4
  project.items = [createItem(products[0], project), createItem(products[1], project), createItem(products[0], project)]
  assert.deepEqual(
    getBillOfMaterials(project, products).map(({ product, quantity }) => [product.id, quantity]),
    [
      [1, 8],
      [2, 4],
    ]
  )
  assert.deepEqual(
    getBillOfMaterials({ ...project, type: 'gates' }, products).map((row) => row.quantity),
    [2, 1]
  )
})

test('export text includes measurements and quantities but never hidden prices', () => {
  const project = createProject('fence')
  project.sections = 3
  project.items = [createItem(products[0], project)]
  const text = buildProjectText(project, products)
  assert.match(text, /2500 × 1800 мм/)
  assert.match(text, /600 × 200 мм/)
  assert.match(text, /3 шт\./)
  assert.match(text, /Каркас.*не включ/)
  assert.doesNotMatch(text, /123.?456/)
})

test('geometry warnings identify outside frame, frame rail and gate seam without declaring ornament collisions', () => {
  const project = createProject()
  project.items = [
    createItem(products[0], project, { x: 100, y: 900 }),
    createItem(products[0], project, { x: 320, y: 900 }),
    createItem(products[0], project, { x: 2000, y: 900 }),
    createItem(products[0], project, { x: 1000, y: 900 }),
    createItem(products[0], project, { x: 1000, y: 900 }),
    { id: 'missing', productId: 999, x: 1000, y: 900, rotation: 0, flipX: false },
  ]
  const warnings = getProjectWarnings(project, products)
  assert.ok(warnings.some((w) => w.itemId === project.items[0].id && w.kind === 'out-of-bounds'))
  assert.ok(warnings.some((w) => w.itemId === project.items[1].id && w.kind === 'frame-overlap'))
  assert.ok(warnings.some((w) => w.itemId === project.items[2].id && w.kind === 'gate-middle'))
  assert.ok(warnings.some((w) => w.itemId === 'missing' && w.kind === 'unknown-product'))
  assert.ok(!warnings.some((w) => [project.items[3].id, project.items[4].id].includes(w.itemId)))
  assert.equal(new Set(warnings.map((w) => w.id)).size, warnings.length)
})

test('valid imports round-trip while removing dimensions and unrecognized fields', () => {
  const project = createProject()
  project.items = [createItem(products[0], project, { rotation: 45, flipX: true })]
  const raw = { ...project, extra: 'ignored', items: [{ ...project.items[0], width: 9999, height: 9999, scale: 7 }] }
  assert.deepEqual(normalizeProject(raw, products), project)
})

test('an alignment inset survives project import while invalid values are rejected', () => {
  const project = { ...createProject(), alignmentInsetMm: 80 }
  assert.deepEqual(normalizeProject(project, products), project)
  for (const alignmentInsetMm of [-1, 1001, '20', null, NaN, Infinity]) {
    assert.throws(() => normalizeProject({ ...project, alignmentInsetMm }, products), /Отступ/)
  }
  assert.equal(Object.hasOwn(normalizeProject(createProject(), products), 'alignmentInsetMm'), false)
})

test('gate seam warnings include both center rails and the actual gap', () => {
  const project = createProject()
  const margin = PROJECT_LIMITS.frameMm + PROJECT_LIMITS.gateGapMm / 2
  const safeRightEdge = project.width / 2 - margin
  const touchingRail = createItem(products[0], project, { x: 1955 - products[0].widthMm / 2 })
  const leftClear = createItem(products[0], project, { x: safeRightEdge - products[0].widthMm / 2 })
  const rightClear = mirrorItem(leftClear, project.width)
  project.items = [touchingRail, leftClear, rightClear]
  const warnings = getProjectWarnings(project, products)
  assert.deepEqual(
    warnings.map((warning) => [warning.itemId, warning.kind]),
    [[touchingRail.id, 'gate-middle']]
  )
})

test('malformed imports, invalid numbers, unknown products and excessive sizes are rejected', () => {
  const project = createProject()
  project.items = [createItem(products[0], project)]
  const invalidProjects = [
    null,
    [],
    {},
    { ...project, version: 2 },
    { ...project, type: 'other' },
    { ...project, type: undefined },
    { ...project, width: '4000' },
    { ...project, width: Infinity },
    { ...project, height: NaN },
    { ...project, width: 499 },
    { ...project, width: 8001 },
    { ...project, height: 4001 },
    { ...project, sections: 2 },
    { ...project, type: 'fence', sections: 51 },
    { ...project, type: 'fence', sections: 1.5 },
    { ...project, items: Array.from({ length: PROJECT_LIMITS.maxItems + 1 }, () => project.items[0]) },
    { ...project, items: [project.items[0], project.items[0]] },
    { ...project, items: [{ ...project.items[0], productId: 999 }] },
    { ...project, items: [{ ...project.items[0], x: Infinity }] },
    { ...project, items: [{ ...project.items[0], x: 1e20 }] },
    { ...project, items: [{ ...project.items[0], rotation: '90' }] },
    { ...project, items: [{ ...project.items[0], flipX: 'false' }] },
  ]
  for (const raw of invalidProjects) assert.throws(() => normalizeProject(raw, products), /[А-Яа-я]/)
})

test('unconfirmed products require explicit dimensions, even when the catalog has candidate numbers', () => {
  const project = createProject()
  for (const product of customProducts) {
    assert.throws(() => createItem(product, project), /размер|ширин/i)
    assert.throws(() => resolveItemProduct({ productId: product.id }, product), /размер|ширин/i)
    const item = createItem(product, project, { dimensions: { widthMm: 700, heightMm: 1200 }, rotation: 90 })
    const effective = resolveItemProduct(item, product)
    assert.equal(effective.widthMm, 700)
    assert.equal(effective.heightMm, 1200)
    assert.equal(effective.saleUnit, product.saleUnit)
    assert.equal(getItemBounds(item, product).width, 1200)
    assert.equal(getItemBounds(item, product).height, 700)
    assert.notEqual(effective, product)
    assert.notEqual(product.widthMm, 700)
  }
})

test('custom dimensions round-trip and remain independent when mirrored; confirmed products ignore overrides', () => {
  const project = createProject()
  const item = createItem(customProducts[0], project, { dimensions: { widthMm: 350.5, heightMm: 2100 } })
  project.items = [item]
  assert.deepEqual(normalizeProject(JSON.parse(JSON.stringify(project)), customProducts), project)
  const mirrored = mirrorItem(item, project.width)
  assert.deepEqual(mirrored.dimensions, item.dimensions)
  mirrored.dimensions.widthMm = 500
  assert.equal(item.dimensions.widthMm, 350.5)
  const confirmed = createItem(products[0], project, { dimensions: { widthMm: 999, heightMm: 999 } })
  assert.equal(confirmed.dimensions, undefined)
  const raw = { ...project, items: [{ ...confirmed, dimensions: { widthMm: 999, heightMm: 999 } }] }
  assert.equal(normalizeProject(raw, products).items[0].dimensions, undefined)
  assert.equal(resolveItemProduct(raw.items[0], products[0]).widthMm, 600)
})

test('missing or invalid custom dimensions reject imports and produce a visible placement warning', () => {
  const project = createProject()
  const base = { id: 'custom', productId: 4, x: 1000, y: 1000, rotation: 0, flipX: false }
  for (const dimensions of [
    undefined,
    null,
    {},
    [],
    { widthMm: '400', heightMm: 500 },
    { widthMm: 0, heightMm: 500 },
    { widthMm: 100, heightMm: Infinity },
    { widthMm: 8001, heightMm: 500 },
    { widthMm: 100, heightMm: 8001 },
  ]) {
    project.items = [{ ...base, dimensions }]
    assert.throws(() => normalizeProject(project, customProducts), /размер|ширин|высот/i)
    assert.ok(getProjectWarnings(project, customProducts).some((warning) => warning.kind === 'missing-dimensions'))
  }
  const boundary = createItem(customProducts[0], project, { dimensions: { widthMm: 1, heightMm: 8000 } })
  assert.deepEqual(normalizeProject({ ...project, items: [boundary] }, customProducts).items, [boundary])
})

test('custom sizes have separate physical BOM counts while pair orders aggregate once per SKU', () => {
  const project = { ...createProject('fence'), sections: 3 }
  const large = createItem(customProducts[1], project, { dimensions: { widthMm: 700, heightMm: 800 } })
  const small = createItem(customProducts[1], project, { dimensions: { widthMm: 600, heightMm: 800 } })
  project.items = [large, small, mirrorItem(large, project.width)]
  const bill = getBillOfMaterials(project, customProducts)
  assert.deepEqual(
    bill.map(({ product, quantity }) => [product.id, product.widthMm, product.heightMm, quantity]),
    [
      [5, 700, 800, 6],
      [5, 600, 800, 3],
    ]
  )
  assert.equal(new Set(bill.map((row) => row.key)).size, 2)
  assert.ok(bill.every((row) => row.saleUnit === 'pair'))
  assert.deepEqual(
    bill.map(({ orderQuantity, spareQuantity, skuQuantity, piecesPerSaleUnit }) => [
      orderQuantity,
      spareQuantity,
      skuQuantity,
      piecesPerSaleUnit,
    ]),
    [
      [5, 1, 9, 2],
      [null, null, 9, 2],
    ]
  )
  const text = buildProjectText(project, customProducts)
  assert.match(text, /700 × 800 мм/)
  assert.match(text, /600 × 800 мм/)
  assert.match(text, /6 шт\./)
  assert.match(text, /3 шт\./)
  assert.match(text, /5 пар/)
  assert.match(text, /запас 1 шт\./)
  assert.doesNotMatch(text, /987.?654|654.?321|габариты пары/)
})

test('two differently sized pieces of one paired SKU require one pair instead of two rounded orders', () => {
  const project = createProject()
  project.items = [
    createItem(customProducts[1], project, { dimensions: { widthMm: 700, heightMm: 800 } }),
    createItem(customProducts[1], project, { dimensions: { widthMm: 600, heightMm: 800 } }),
  ]
  const bill = getBillOfMaterials(project, customProducts)
  assert.deepEqual(
    bill.map((row) => row.quantity),
    [1, 1]
  )
  assert.deepEqual(
    bill.map((row) => row.orderQuantity),
    [1, null]
  )
  assert.deepEqual(
    bill.map((row) => row.spareQuantity),
    [0, null]
  )
  const text = buildProjectText(project, customProducts)
  assert.match(text, /1 пара/)
  assert.equal((text.match(/К покупке парами/g) || []).length, 1)
  assert.doesNotMatch(text, /запас|2 пары/)
})

test('distribution uses entered dimensions for products without catalog geometry', () => {
  const project = createProject()
  const items = [
    createItem(customProducts[0], project, { x: 500, dimensions: { widthMm: 100, heightMm: 800 } }),
    createItem(customProducts[0], project, { x: 700, dimensions: { widthMm: 200, heightMm: 800 } }),
    createItem(customProducts[0], project, { x: 1700, dimensions: { widthMm: 300, heightMm: 800 } }),
  ]
  const spaced = distributeItems(items, customProducts)
  const bounds = spaced.map((item) => getItemBounds(item, customProducts[0]))
  approximately(bounds[1].left - bounds[0].right, bounds[2].left - bounds[1].right)
  assert.notEqual(spaced[1].x, items[1].x)
  assert.deepEqual(
    spaced.map((item) => item.dimensions),
    items.map((item) => item.dimensions)
  )
})
