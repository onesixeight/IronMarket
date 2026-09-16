import assert from 'node:assert/strict'
import test from 'node:test'
import { proposeCornerSet } from '../src/constructor/corners.js'
import {
  createItem,
  createProject,
  getFramePanels,
  getItemBounds,
  mirrorItemInFrame,
} from '../src/constructor/model.js'

const products = [
  { id: 1, name: 'Уголок', widthMm: 200, heightMm: 300, group: 'corners' },
  { id: 2, name: 'Центральный узор', widthMm: 50, heightMm: 50 },
  { id: 3, name: 'Угловой узор', group: 'tube15', requiresDimensions: true, cornerAnchor: 'bottom-left' },
  { id: 6160, name: 'Уголок 6160', group: 'corners', widthMm: 430, heightMm: 700, cornerAnchor: 'bottom-left' },
]
const near = (a, b) => assert.ok(Math.abs(a - b) <= 0.00001, `${a} != ${b}`)
const boundsOf = (item) =>
  getItemBounds(
    item,
    products.find((product) => product.id === item.productId)
  )
function worldPoint(item, [x, y]) {
  const angle = (item.rotation * Math.PI) / 180
  const reflectedX = item.flipX ? -x : x
  return [
    item.x + reflectedX * Math.cos(angle) - y * Math.sin(angle),
    item.y + reflectedX * Math.sin(angle) + y * Math.cos(angle),
  ]
}
function checkNoOp(project, result, options) {
  assert.equal(result.canApply, true, JSON.stringify(result.issues))
  const again = proposeCornerSet({ ...project, items: result.items }, products, options)
  assert.equal(again.canApply, true)
  assert.equal(again.changed, false)
  assert.equal(again.addedCount, 0)
  assert.deepEqual(again.items, result.items)
}

test('two roughly placed 6160 corners are reused and only the two missing corners are added', () => {
  const project = createProject()
  const product = products.find((entry) => entry.id === 6160)
  project.items = [createItem(product, project, { x: 300, y: 410 }), createItem(product, project, { x: 300, y: 1570 })]
  const original = structuredClone(project)
  const result = proposeCornerSet(project, products, { sourceId: project.items[0].id })
  assert.equal(result.canApply, true, JSON.stringify(result.issues))
  assert.equal(result.items.length, 4)
  assert.equal(result.addedCount, 2)
  assert.equal(result.movedCount, 2)
  const upper = result.items.find((item) => item.id === project.items[0].id)
  const lower = result.items.find((item) => item.id === project.items[1].id)
  assert.deepEqual([upper.x, upper.y, upper.rotation, upper.flipX], [275, 410, 180, true])
  assert.deepEqual([lower.x, lower.y, lower.rotation, lower.flipX], [275, 1590, 0, false])
  assert.deepEqual(project, original)
  checkNoOp(project, result, { sourceId: upper.id })
})

test('native corner orientation is independent of the selected corner position and previous transform', () => {
  const product = products.find((entry) => entry.id === 6160)
  const expected = {
    'top-left': [180, true],
    'top-right': [180, false],
    'bottom-left': [0, false],
    'bottom-right': [0, true],
  }
  for (const x of [300, 1700])
    for (const y of [410, 1570])
      for (const rotation of [0, 35, 180]) {
        const project = createProject()
        const source = createItem(product, project, { x, y, rotation, flipX: true })
        project.items = [source]
        const result = proposeCornerSet(project, products, { sourceId: source.id })
        assert.equal(result.canApply, true)
        for (const item of result.items) {
          const corner = `${item.y < 1000 ? 'top' : 'bottom'}-${item.x < 994 ? 'left' : 'right'}`
          assert.deepEqual([((item.rotation % 360) + 360) % 360, item.flipX], expected[corner])
          assert.equal(boundsOf(item).width, 430)
          assert.equal(boundsOf(item).height, 700)
        }
        checkNoOp(project, result, { sourceId: result.items.at(-1).id })
      }
})

test('all eight corners reuse the two existing pieces and changed inset moves the same eight IDs', () => {
  const project = createProject()
  const product = products.find((entry) => entry.id === 6160)
  project.items = [createItem(product, project, { x: 300, y: 410 }), createItem(product, project, { x: 300, y: 1570 })]
  const result = proposeCornerSet(project, products, { sourceId: project.items[0].id, scope: 'all-panels' })
  assert.equal(result.canApply, true)
  assert.equal(result.items.length, 8)
  assert.equal(result.addedCount, 6)
  assert.equal(result.movedCount, 2)
  const next = proposeCornerSet({ ...project, items: result.items }, products, {
    sourceId: result.items[4].id,
    scope: 'all-panels',
    insetMm: 35,
  })
  assert.equal(next.canApply, true)
  assert.equal(next.addedCount, 0)
  assert.equal(next.movedCount, 8)
  assert.deepEqual(
    next.items.map((item) => item.id),
    result.items.map((item) => item.id)
  )
  for (const item of next.items) {
    const panel = getFramePanels(project, { inner: true, insetMm: 35 })[item.x < 2000 ? 0 : 1]
    const bounds = boundsOf(item)
    near(item.x < panel.centerX ? bounds.left : bounds.right, item.x < panel.centerX ? panel.left : panel.right)
    near(item.y < panel.centerY ? bounds.top : bounds.bottom, item.y < panel.centerY ? panel.top : panel.bottom)
  }
  checkNoOp(project, next, { sourceId: next.items[6].id, scope: 'all-panels', insetMm: 35 })
})

test('a centered source on the right leaf fills all panels with unique IDs and remains stable from any copy', () => {
  const project = createProject()
  const product = products.find((entry) => entry.id === 6160)
  const leftSource = createItem(product, project, { x: 300, y: 410 })
  const left = proposeCornerSet({ ...project, items: [leftSource] }, products, { sourceId: leftSource.id })
  const source = createItem(product, project, { x: 3006, y: 1000 })
  project.items = [...left.items, source]
  const result = proposeCornerSet(project, products, { sourceId: source.id, scope: 'all-panels' })
  assert.equal(result.canApply, true)
  assert.equal(result.items.length, 8)
  assert.equal(result.addedCount, 3)
  assert.equal(result.movedCount, 1)
  assert.equal(new Set(result.items.map((item) => item.id)).size, 8)
  assert.deepEqual(result.items.slice(0, 4), left.items)
  const placed = result.items.find((item) => item.id === source.id)
  assert.notEqual(placed.x, 3006)
  assert.notEqual(placed.y, 1000)
  for (const item of result.items) checkNoOp(project, result, { sourceId: item.id, scope: 'all-panels' })
})

test('a selected source in the center fills the remaining slot instead of leaving an extra central copy', () => {
  const project = createProject()
  const product = products.find((entry) => entry.id === 6160)
  const seed = createItem(product, project, { x: 300, y: 410 })
  const complete = proposeCornerSet({ ...project, items: [seed] }, products, { sourceId: seed.id })
  const kept = complete.items.filter((item) => !(item.x > 994 && item.y > 1000))
  const source = createItem(product, project, { x: 994, y: 1000 })
  project.items = [...kept, source]
  const result = proposeCornerSet(project, products, { sourceId: source.id })
  assert.equal(result.canApply, true)
  assert.equal(result.addedCount, 0)
  assert.equal(result.movedCount, 1)
  assert.equal(result.items.length, 4)
  assert.deepEqual(result.items.slice(0, 3), kept)
  const filled = result.items.find((item) => item.id === source.id)
  assert.deepEqual([filled.x, filled.y, filled.rotation, filled.flipX], [1713, 1590, 0, true])
  checkNoOp(project, result, { sourceId: source.id })
})

test('an occupied corner of another SKU is preserved while unrelated central decor stays outside corner assignment', () => {
  const project = createProject()
  const product = products.find((entry) => entry.id === 6160)
  const source = createItem(product, project, { x: 300, y: 410 })
  const occupied = createItem(products[0], project, { x: 1828, y: 210 })
  const central = createItem(products[0], project, { x: 994, y: 1000 })
  project.items = [source, occupied, central]
  const result = proposeCornerSet(project, products, { sourceId: source.id })
  assert.equal(result.canApply, true, JSON.stringify(result.issues))
  assert.equal(result.addedCount, 2)
  assert.deepEqual(
    result.items.filter((item) => item.id === occupied.id || item.id === central.id),
    [occupied, central]
  )
  assert.equal(result.items.filter((item) => item.x > 994 && item.y < 1000).length, 1)
  checkNoOp(project, result, { sourceId: source.id })
})

test('rough existing corners that are locked or grouped block the whole operation and retain every original item', () => {
  for (const protectedState of ['locked', 'grouped']) {
    const project = createProject()
    const product = products.find((entry) => entry.id === 6160)
    const source = createItem(product, project, { x: 300, y: 410 })
    const lower = createItem(product, project, {
      x: 300,
      y: 1570,
      ...(protectedState === 'locked' ? { locked: true } : { groupId: 'protected' }),
    })
    project.items = [source, lower]
    if (protectedState === 'grouped')
      project.items.push(createItem(products[1], project, { x: 994, y: 1000, groupId: 'protected' }))
    const original = structuredClone(project)
    const result = proposeCornerSet(project, products, { sourceId: source.id })
    assert.equal(result.canApply, false)
    assert.equal(result.issues[0].id, protectedState === 'locked' ? 'locked' : 'group')
    assert.equal(result.movedCount, 0)
    assert.deepEqual(result.items, original.items)
    assert.deepEqual(project, original)
  }
})

test('an already correct locked corner is reused unchanged, and excess occupied corners never delete the selected source', () => {
  const project = createProject()
  const product = products.find((entry) => entry.id === 6160)
  const source = createItem(product, project, { x: 300, y: 410 })
  const lower = createItem(product, project, { x: 275, y: 1590, locked: true })
  project.items = [source, lower]
  const result = proposeCornerSet(project, products, { sourceId: source.id })
  assert.equal(result.canApply, true)
  assert.equal(result.addedCount, 2)
  assert.deepEqual(
    result.items.find((item) => item.id === lower.id),
    lower
  )
  const extra = createItem(product, project, { x: 994, y: 1000 })
  const crowded = { ...project, items: [...result.items, extra] }
  const blocked = proposeCornerSet(crowded, products, { sourceId: extra.id })
  assert.equal(blocked.canApply, false)
  assert.equal(blocked.issues[0].id, 'occupied')
  assert.deepEqual(blocked.items, crowded.items)
})

test('all four source quadrants preserve arbitrary rotation and flip through exact point reflections', () => {
  for (const rotation of [35, 180])
    for (const flipX of [false, true])
      for (const side of [-1, 1])
        for (const vertical of [-1, 1]) {
          const project = createProject()
          const frame = getFramePanels(project, { inner: true, insetMm: 20 })[0]
          const source = createItem(products[0], project, {
            x: frame.centerX + side * 550,
            y: frame.centerY + vertical * 500,
            rotation,
            flipX,
          })
          project.items = [source]
          const original = structuredClone(project)
          const result = proposeCornerSet(project, products, { sourceId: source.id })
          assert.equal(result.addedCount, 3)
          assert.equal(result.items.length, 4)
          assert.equal(new Set(result.items.map((item) => item.id)).size, 4)
          const anchored = result.items.find((item) => item.id === source.id)
          assert.equal(anchored.rotation, rotation)
          assert.equal(anchored.flipX, flipX)
          for (const item of result.items) {
            const horizontalSign = item.x < frame.centerX === anchored.x < frame.centerX ? 1 : -1
            const verticalSign = item.y < frame.centerY === anchored.y < frame.centerY ? 1 : -1
            for (const point of [
              [-100, -150],
              [37, -91],
              [100, 150],
            ]) {
              const before = worldPoint(anchored, point)
              const actual = worldPoint(item, point)
              near(actual[0], frame.centerX + horizontalSign * (before[0] - frame.centerX))
              near(actual[1], frame.centerY + verticalSign * (before[1] - frame.centerY))
            }
            const bounds = boundsOf(item)
            near(item.x < frame.centerX ? bounds.left : bounds.right, item.x < frame.centerX ? frame.left : frame.right)
            near(item.y < frame.centerY ? bounds.top : bounds.bottom, item.y < frame.centerY ? frame.top : frame.bottom)
          }
          assert.deepEqual(project, original)
          checkNoOp(project, result, { sourceId: source.id })
        }
})

test('all-panels produces eight placements with the real center seam from either source leaf', () => {
  for (const panelIndex of [0, 1]) {
    const project = createProject()
    const panels = getFramePanels(project, { inner: true, insetMm: 20 })
    const panel = panels[panelIndex]
    const source = createItem(products[0], project, { x: panel.right - 160, y: 1650, rotation: 35, flipX: true })
    project.items = [source]
    const result = proposeCornerSet(project, products, { sourceId: source.id, scope: 'all-panels' })
    assert.equal(result.addedCount, 7)
    assert.equal(result.items.length, 8)
    const anchored = result.items.find((item) => item.id === source.id)
    for (const targetPanel of panels) {
      const corners = result.items.filter((item) => item.x > targetPanel.left && item.x < targetPanel.right)
      assert.equal(corners.length, 4)
      for (const item of corners) {
        const horizontalSign = item.x < targetPanel.centerX === anchored.x < panel.centerX ? 1 : -1
        const verticalSign = item.y < targetPanel.centerY === anchored.y < panel.centerY ? 1 : -1
        const expected = worldPoint(anchored, [37, -91])
        const actual = worldPoint(item, [37, -91])
        near(actual[0], targetPanel.centerX + horizontalSign * (expected[0] - panel.centerX))
        near(actual[1], targetPanel.centerY + verticalSign * (expected[1] - panel.centerY))
      }
    }
    near(Math.max(...result.items.filter((item) => item.x < 2000).map((item) => boundsOf(item).right)), 1928)
    near(Math.min(...result.items.filter((item) => item.x > 2000).map((item) => boundsOf(item).left)), 2072)
    checkNoOp(project, result, { sourceId: source.id, scope: 'all-panels' })
  }
})

test('wicket and fence create four corners and manually entered dimensions remain independent', () => {
  for (const type of ['wicket', 'fence']) {
    const project = createProject(type)
    const source = createItem(products[2], project, {
      x: 210,
      y: 280,
      rotation: 35,
      dimensions: { widthMm: 120, heightMm: 180 },
    })
    project.items = [source]
    const result = proposeCornerSet(project, products, { sourceId: source.id, scope: 'all-panels', insetMm: 30 })
    assert.equal(result.addedCount, 3)
    result.items.forEach((item) => {
      assert.deepEqual(item.dimensions, source.dimensions)
      assert.notEqual(item.dimensions, source.dimensions)
    })
    assert.notEqual(result.items[0].dimensions, result.items[1].dimensions)
    checkNoOp(project, result, { sourceId: source.id, scope: 'all-panels', insetMm: 30 })
  }
})

test('exact existing corner copies are reused without deleting other items or changing their IDs', () => {
  const project = createProject('fence')
  const source = createItem(products[0], project, { x: 160, y: 210, rotation: -180, flipX: true })
  const matching = mirrorItemInFrame(source, project, { axis: 'horizontal' })
  matching.x += 0.000004
  matching.rotation += 360
  const ornament = createItem(products[1], project, { x: 1250, y: 900 })
  project.items = [source, matching, ornament]
  const result = proposeCornerSet(project, products, { sourceId: source.id })
  assert.equal(result.addedCount, 2)
  assert.deepEqual(
    result.items.find((item) => item.id === matching.id),
    matching
  )
  assert.deepEqual(
    result.items.find((item) => item.id === ornament.id),
    ornament
  )
  checkNoOp(project, result, { sourceId: source.id })
})

test('a same-SKU target with different manual dimensions is not reused as an exact copy', () => {
  const project = createProject('fence')
  const source = createItem(products[2], project, { x: 160, y: 210, dimensions: { widthMm: 200, heightMm: 300 } })
  const wrongSize = mirrorItemInFrame(source, project)
  wrongSize.dimensions.heightMm = 250
  project.items = [source, wrongSize]
  const result = proposeCornerSet(project, products, { sourceId: source.id })
  assert.equal(result.canApply, false)
  assert.equal(result.issues[0].id, 'overlap')
  assert.deepEqual(result.items, project.items)
})

test('a locked source can be copied only when its own position already matches the requested inset', () => {
  const project = createProject('fence')
  const source = createItem(products[0], project, { x: 250, y: 300, locked: true })
  project.items = [source]
  const blocked = proposeCornerSet(project, products, { sourceId: source.id })
  assert.equal(blocked.issues[0].id, 'locked')
  assert.deepEqual(blocked.items, project.items)
  source.x = 160
  source.y = 210
  const result = proposeCornerSet(project, products, { sourceId: source.id })
  assert.equal(result.canApply, true)
  assert.equal(result.items[0].locked, true)
  assert.ok(result.items.slice(1).every((item) => !item.locked))
  checkNoOp(project, result, { sourceId: source.id })
})

test('multi-piece groups are blocked, while a singleton group does not make its copies a new implicit group', () => {
  const project = createProject('fence')
  const source = createItem(products[0], project, { x: 160, y: 210, groupId: 'existing' })
  project.items = [source, createItem(products[1], project, { groupId: 'existing' })]
  assert.equal(proposeCornerSet(project, products, { sourceId: source.id }).issues[0].id, 'group')
  project.items = [source]
  const result = proposeCornerSet(project, products, { sourceId: source.id })
  assert.equal(result.canApply, true)
  assert.equal(result.items[0].groupId, 'existing')
  assert.ok(result.items.slice(1).every((item) => !Object.hasOwn(item, 'groupId')))
})

test('the item limit is checked after duplicate reuse and allows an exact no-op at 200 items', () => {
  const project = createProject('fence')
  const source = createItem(products[0], project, { x: 160, y: 210 })
  const complete = proposeCornerSet({ ...project, items: [source] }, products, { sourceId: source.id })
  const fillers = Array.from({ length: 196 }, () => createItem(products[1], project, { x: 1250, y: 900 }))
  project.items = [...complete.items.slice(0, 3), ...fillers]
  const result = proposeCornerSet(project, products, { sourceId: source.id })
  assert.equal(result.canApply, true)
  assert.equal(result.items.length, 200)
  assert.equal(result.addedCount, 1)
  checkNoOp(project, result, { sourceId: source.id })
  const crowded = { ...project, items: [...project.items, createItem(products[1], project, { x: 1250, y: 900 })] }
  const blocked = proposeCornerSet(crowded, products, { sourceId: source.id })
  assert.equal(blocked.issues[0].id, 'limit')
  assert.equal(blocked.addedCount, 0)
  assert.deepEqual(blocked.items, crowded.items)
})

test('size, corner-to-corner and new ornament overlaps return an unchanged atomic result', () => {
  const project = createProject('wicket')
  const source = createItem(products[2], project, { x: 500, y: 500, dimensions: { widthMm: 950, heightMm: 300 } })
  project.items = [source]
  assert.equal(proposeCornerSet(project, products, { sourceId: source.id }).issues[0].id, 'size')
  source.dimensions.widthMm = 500
  assert.equal(proposeCornerSet(project, products, { sourceId: source.id }).issues[0].id, 'overlap')
  source.dimensions.widthMm = 200
  project.items.push(createItem(products[1], project, { x: 840, y: 1790 }))
  const before = structuredClone(project)
  const blocked = proposeCornerSet(project, products, { sourceId: source.id })
  assert.equal(blocked.issues[0].id, 'overlap')
  assert.equal(blocked.changed, false)
  assert.deepEqual(blocked.items, project.items)
  assert.deepEqual(project, before)
})

test('unchanged existing ornamental overlaps do not block adding clear corners elsewhere', () => {
  const project = createProject('fence')
  const source = createItem(products[0], project, { x: 160, y: 210 })
  project.items = [source, createItem(products[1], project, { x: 160, y: 210 })]
  const result = proposeCornerSet(project, products, { sourceId: source.id })
  assert.equal(result.canApply, true)
  assert.equal(result.addedCount, 3)
  assert.deepEqual(result.items.slice(0, 2), project.items)
})

test('center ties choose a deterministic upper-left source corner and invalid requests have clear issues', () => {
  const project = createProject('fence')
  const source = createItem(products[0], project)
  project.items = [source]
  const result = proposeCornerSet(project, products, { sourceId: source.id })
  assert.equal(result.items[0].x, 160)
  assert.equal(result.items[0].y, 210)
  for (const options of [
    { sourceId: 'missing' },
    { sourceId: source.id, scope: 'left' },
    { sourceId: source.id, insetMm: NaN },
    { sourceId: source.id, insetMm: -1 },
    { sourceId: source.id, insetMm: 1001 },
  ]) {
    const blocked = proposeCornerSet(project, products, options)
    assert.equal(blocked.canApply, false)
    assert.ok(blocked.issues[0].blocking)
    assert.deepEqual(blocked.items, project.items)
  }
  project.items = [createItem(products[1], project)]
  assert.equal(proposeCornerSet(project, products, { sourceId: project.items[0].id }).issues[0].id, 'corner')
})
