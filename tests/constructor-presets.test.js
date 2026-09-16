import test from 'node:test'
import assert from 'node:assert/strict'
import { constructorProducts } from '../src/constructor/catalog.js'
import { buildPreset, constructorPresets, createPresetItems } from '../src/constructor/presets.js'
import { createProject, getItemBounds, getProjectWarnings, normalizeProject } from '../src/constructor/model.js'

const catalog = new Map(constructorProducts.map((product) => [product.id, product]))
const designs = () => constructorPresets.filter((preset) => preset.id !== 'empty')
const geometry = (items) => items.map(({ productId, x, y, rotation, flipX }) => ({ productId, x, y, rotation, flipX }))
const near = (a, b) => Math.abs(a - b) < 0.001

function assertLayout(project, items, label) {
  const completed = { ...project, items }
  assert.deepEqual(getProjectWarnings(completed, constructorProducts), [], label)
  assert.deepEqual(normalizeProject(completed, constructorProducts), completed, label)
  const bounds = items.map((item) => getItemBounds(item, catalog.get(item.productId)))
  for (const bound of bounds) {
    assert.ok(bound.left >= 60 - 0.001 && bound.right <= project.width - 60 + 0.001, label)
    assert.ok(bound.top >= 60 - 0.001 && bound.bottom <= project.height - 60 + 0.001, label)
  }
  for (let i = 0; i < bounds.length; i++) {
    for (let j = i + 1; j < bounds.length; j++) {
      const a = bounds[i]
      const b = bounds[j]
      const overlaps =
        Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.001 &&
        Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.001
      assert.equal(overlaps, false, `${label}: overlapping products ${items[i].productId}/${items[j].productId}`)
    }
  }
}

test('eight distinct designs support default gates and at least three support a standard wicket', () => {
  assert.equal(designs().length, 8)
  const topologies = new Set()
  for (const preset of designs()) {
    assert.equal(typeof preset.style, 'string')
    assert.equal(typeof preset.density, 'string')
    const project = createProject()
    const result = buildPreset(project, constructorProducts, preset.id)
    assert.equal(result.available, true, preset.id)
    assert.ok(result.items.length > 0, preset.id)
    assertLayout(project, result.items, preset.id)
    topologies.add(JSON.stringify(geometry(result.items)))
  }
  assert.equal(topologies.size, 8)
  const wicket = createProject('wicket')
  assert.ok(designs().filter((preset) => buildPreset(wicket, constructorProducts, preset.id).available).length >= 3)
  assert.ok(
    designs().filter((preset) => buildPreset(createProject('fence'), constructorProducts, preset.id).available)
      .length >= 7
  )
})

test('all supported recipes fit without overlap across narrow, short and large frames', () => {
  for (const type of ['gates', 'wicket', 'fence']) {
    for (const width of [500, 970, 1000, 1800, 2000, 2500, 4000, 8000]) {
      for (const height of [500, 1000, 1400, 1600, 1800, 2000, 4000]) {
        for (const preset of designs()) {
          const project = { ...createProject(type), width, height }
          const result = buildPreset(project, constructorProducts, preset.id)
          const label = `${type} ${width}×${height} ${preset.id}`
          assert.equal(result.available, width >= result.minimum.width && height >= result.minimum.height, label)
          if (result.available) {
            assert.ok(result.items.length > 0, label)
            assertLayout(project, result.items, label)
          } else {
            assert.deepEqual(result.items, [], label)
            assert.match(result.reason, /[А-Яа-я]/, label)
          }
        }
      }
    }
  }
})

test('reported minimum dimensions produce complete recipes and smaller frames explain their limit', () => {
  for (const type of ['gates', 'wicket', 'fence']) {
    for (const preset of designs()) {
      const initial = { ...createProject(type), width: 500, height: 500 }
      const result = buildPreset(initial, constructorProducts, preset.id)
      assert.equal(result.available, false, preset.id)
      assert.ok(result.reason.includes(String(result.minimum.width)), preset.id)
      assert.ok(result.reason.includes(String(result.minimum.height)), preset.id)
      const minimum = { ...initial, ...result.minimum }
      const supported = buildPreset(minimum, constructorProducts, preset.id)
      assert.equal(supported.available, true, `${type} ${preset.id}`)
      assertLayout(minimum, supported.items, `${type} ${preset.id} minimum`)
      assert.equal(
        buildPreset({ ...minimum, width: minimum.width - 1 }, constructorProducts, preset.id).available,
        false
      )
      assert.equal(
        buildPreset({ ...minimum, height: minimum.height - 1 }, constructorProducts, preset.id).available,
        false
      )
    }
  }
})

test('gates mirror the entire left composition with new IDs and correct rotations', () => {
  const project = createProject()
  for (const preset of designs()) {
    const { items } = buildPreset(project, constructorProducts, preset.id)
    const left = items.filter((item) => item.x < project.width / 2)
    const right = items.filter((item) => item.x > project.width / 2)
    assert.equal(left.length, right.length, preset.id)
    for (const original of left) {
      const counterpart = right.find(
        (item) =>
          item.productId === original.productId &&
          near(item.x, project.width - original.x) &&
          near(item.y, original.y) &&
          near(item.rotation, -original.rotation) &&
          item.flipX === !original.flipX
      )
      assert.ok(counterpart, `${preset.id}: missing reflection of ${original.productId}`)
      assert.notEqual(counterpart.id, original.id)
    }
  }
})

test('missing products never silently simplify a recipe and output never contains prices', () => {
  const project = createProject()
  for (const preset of designs()) {
    const complete = buildPreset(project, constructorProducts, preset.id)
    const missingId = complete.items[0].productId
    const incomplete = buildPreset(
      project,
      constructorProducts.filter((product) => product.id !== missingId),
      preset.id
    )
    assert.equal(incomplete.available, false, preset.id)
    assert.deepEqual(incomplete.items, [], preset.id)
    assert.match(incomplete.reason, /каталог/i)
    assert.doesNotMatch(JSON.stringify(complete), /"(?:price|hidePrice)"/)
    assert.deepEqual(geometry(createPresetItems(project, constructorProducts, preset.id)), geometry(complete.items))
    assert.deepEqual(geometry(buildPreset(project, constructorProducts, preset.id).items), geometry(complete.items))
  }
})

test('rhythm, lyre and braid adapt counts to space without changing catalog dimensions', () => {
  for (const id of ['rhythm', 'lyre', 'braid']) {
    const small = buildPreset(createProject('wicket'), constructorProducts, id)
    const wide = buildPreset({ ...createProject('fence'), width: 4000, height: 2000 }, constructorProducts, id)
    assert.ok(wide.items.length > small.items.length, id)
    for (const item of wide.items) {
      assert.equal(item.width, undefined)
      assert.equal(item.height, undefined)
      assert.equal(item.scale, undefined)
    }
  }
  assert.deepEqual(createPresetItems(createProject(), constructorProducts, 'empty'), [])
  assert.equal(buildPreset(createProject(), constructorProducts, 'unknown').available, false)
})

test('lyre uses mirrored pairs with no asymmetric middle baluster at narrow or wide sizes', () => {
  for (const width of [1000, 2000, 4000]) {
    const project = { ...createProject('wicket'), width }
    const result = buildPreset(project, constructorProducts, 'lyre')
    const balusters = result.items.filter((item) => item.productId === 6210)
    assert.ok(balusters.length >= 2)
    assert.equal(balusters.length % 2, 0)
    assert.ok(balusters.every((item) => !near(item.x, width / 2)))
    for (const left of balusters.filter((item) => item.x < width / 2)) {
      assert.ok(
        balusters.some((right) => near(right.x, width - left.x) && near(right.y, left.y) && right.flipX === !left.flipX)
      )
    }
    if (balusters.length > 2) assert.ok(new Set(balusters.map((item) => item.y)).size > 1)
  }
})

test('rosette keeps its center upright and accents 60 mm from the central bounds', () => {
  const project = { ...createProject('wicket'), width: 1340, height: 1340 }
  const result = buildPreset(project, constructorProducts, 'rosette')
  assert.equal(result.available, true)
  assert.deepEqual(result.minimum, { width: 1340, height: 1340 })
  const center = result.items.find((item) => item.productId === 6174)
  assert.equal(center.rotation, 0)
  const centerBounds = getItemBounds(center, catalog.get(center.productId))
  for (const item of result.items.filter((entry) => entry.productId === 6302)) {
    const bound = getItemBounds(item, catalog.get(item.productId))
    const nearestGap = Math.max(
      centerBounds.left - bound.right,
      bound.left - centerBounds.right,
      centerBounds.top - bound.bottom,
      bound.top - centerBounds.bottom
    )
    assert.ok(near(nearestGap, 60))
  }
  assertLayout(project, result.items, 'compact rosette')
})
