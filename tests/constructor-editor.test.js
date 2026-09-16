import test from 'node:test'
import assert from 'node:assert/strict'
import { effectScope, nextTick } from 'vue'
import { useConstructor, CONSTRUCTOR_STORAGE_KEY } from '../src/composables/useConstructor.js'
import { constructorProducts } from '../src/constructor/catalog.js'
import { getItemBounds, normalizeProject } from '../src/constructor/model.js'
import { useConstructorTemplates } from '../src/composables/useConstructorTemplates.js'

function editor() {
  const memory = new Map()
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) },
  })
  const scope = effectScope()
  const state = scope.run(useConstructor)
  return {
    state,
    memory,
    cleanup() {
      scope.stop()
      if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor)
      else delete globalThis.localStorage
    },
  }
}

test('whole-drawing alignment keeps both leaves, selection and quantities, and is one undoable saved action', () => {
  const fixture = editor()
  let aligned
  try {
    const state = fixture.state
    const rough = {
      version: 1,
      type: 'gates',
      width: 4000,
      height: 2000,
      sections: 1,
      items: [0, 2012].flatMap((origin, panel) =>
        [
          { x: 200, y: 965 },
          { x: 950, y: 1020 },
          { x: 1770, y: 990 },
        ].map((position, index) => ({
          id: `align-${panel}-${index}`,
          productId: 6199,
          x: origin + position.x,
          y: position.y,
          rotation: 0,
          flipX: index === 2,
        }))
      ),
    }
    state.loadProject(rough)
    state.selectedId.value = 'align-0-1'
    const result = state.alignDrawing(80)
    assert.equal(result.changed, true)
    assert.equal(state.selectedId.value, 'align-0-1')
    assert.equal(state.totalQuantity.value, 6)
    const product = constructorProducts.find((entry) => entry.id === 6199)
    for (const origin of [0, 2012]) {
      const items = state.project.value.items.filter((item) => item.x > origin && item.x < origin + 1988)
      const bounds = items.map((item) => getItemBounds(item, product))
      assert.equal(bounds[0].left, origin + 120)
      assert.equal(bounds[2].right, origin + 1988 - 120)
      assert.equal(bounds[1].left - bounds[0].right, bounds[2].left - bounds[1].right)
      assert.deepEqual(
        items.map((item) => item.y),
        [1000, 1000, 1000]
      )
    }
    aligned = JSON.parse(JSON.stringify(state.project.value))
    assert.equal(aligned.alignmentInsetMm, 80)
    assert.deepEqual(normalizeProject(aligned, constructorProducts), aligned)
    assert.deepEqual(
      aligned.items.map((item) => ({ ...item, x: 0, y: 0 })),
      rough.items.map((item) => ({ ...item, x: 0, y: 0 }))
    )
    assert.equal(state.alignDrawing(80).changed, false, 'a second click is a no-op')
    state.undo()
    assert.deepEqual(state.project.value, rough, 'the repeat does not add an undo step')
    state.redo()
    assert.deepEqual(state.project.value, aligned)
  } finally {
    fixture.cleanup()
  }
  assert.deepEqual(JSON.parse(fixture.memory.get(CONSTRUCTOR_STORAGE_KEY)), aligned)
})

test('alignment without enough space preserves the complete drawing, selection and redo history', () => {
  const fixture = editor()
  try {
    const state = fixture.state
    const rough = {
      version: 1,
      type: 'wicket',
      width: 1000,
      height: 2000,
      sections: 1,
      items: [250, 460, 730].map((x, index) => ({
        id: `tight-${index}`,
        productId: 6199,
        x,
        y: 980 + index * 15,
        rotation: 0,
        flipX: false,
      })),
    }
    state.loadProject(rough)
    state.alignDrawing(0)
    const aligned = JSON.parse(JSON.stringify(state.project.value))
    state.undo()
    state.selectedId.value = 'tight-1'
    assert.throws(() => state.alignDrawing(80), /мест|ширин|помещ|ряд/i)
    assert.deepEqual(state.project.value, rough)
    assert.equal(state.selectedId.value, 'tight-1')
    assert.equal(state.canRedo.value, true)
    state.redo()
    assert.deepEqual(state.project.value, aligned)
  } finally {
    fixture.cleanup()
  }
})

test('alignment uses manually confirmed rotated dimensions without changing the pieces', () => {
  const fixture = editor()
  try {
    const state = fixture.state
    state.loadProject({
      version: 1,
      type: 'fence',
      width: 2000,
      height: 1800,
      sections: 3,
      items: [350, 1000, 1510].map((x, index) => ({
        id: `custom-align-${index}`,
        productId: 6311,
        x,
        y: 875 + index * 20,
        rotation: 35,
        flipX: index === 1,
        dimensions: { widthMm: 230 + index * 25, heightMm: 120 },
      })),
    })
    const before = JSON.parse(JSON.stringify(state.project.value))
    assert.equal(state.alignDrawing().changed, true)
    assert.equal(state.totalQuantity.value, 9)
    assert.deepEqual(
      state.project.value.items.map((item) => ({ ...item, x: 0, y: 0 })),
      before.items.map((item) => ({ ...item, x: 0, y: 0 }))
    )
    state.undo()
    assert.deepEqual(state.project.value, before)
  } finally {
    fixture.cleanup()
  }
})

test('opening an older project resets alignment settings and undo restores them', () => {
  const fixture = editor()
  try {
    const state = fixture.state
    const older = { version: 1, type: 'wicket', width: 1500, height: 2000, sections: 1, items: [] }
    state.loadProject({ ...older, alignmentInsetMm: 80 })
    state.loadProject(older)
    assert.deepEqual(state.project.value, older)
    state.undo()
    assert.equal(state.project.value.alignmentInsetMm, 80)
  } finally {
    fixture.cleanup()
  }
})

for (const axis of ['horizontal', 'vertical', 'diagonal']) {
  test(`a ${axis} corner copy keeps its original and explicit sizes, with a single undo step`, () => {
    const fixture = editor()
    try {
      const state = fixture.state
      state.applyPreset('empty')
      state.addProduct(
        constructorProducts.find((product) => product.id === 6311),
        { widthMm: 160, heightMm: 65 }
      )
      state.updateSelected({ x: 230, y: 310, rotation: 35, flipX: true })
      const original = JSON.parse(JSON.stringify(state.selectedItem.value))
      state.mirrorSelected(axis, 'panel')
      const copied = JSON.parse(JSON.stringify(state.selectedItem.value))
      assert.equal(state.project.value.items.length, 2)
      assert.deepEqual(state.project.value.items[0], original)
      assert.notEqual(copied.id, original.id)
      assert.deepEqual(copied.dimensions, original.dimensions)
      assert.equal(state.totalQuantity.value, 2)
      assert.deepEqual(normalizeProject(JSON.parse(JSON.stringify(state.project.value)), constructorProducts).items, [
        original,
        copied,
      ])
      state.undo()
      assert.deepEqual(state.project.value.items, [original])
      assert.equal(state.totalQuantity.value, 1)
      state.redo()
      assert.deepEqual(state.project.value.items, [original, copied])
    } finally {
      fixture.cleanup()
    }
  })
}

test('invalid corner copy or a full project preserves selection, drawing and history', () => {
  const fixture = editor()
  try {
    const state = fixture.state
    state.applyPreset('empty')
    state.addProduct(constructorProducts[0])
    const original = JSON.parse(JSON.stringify(state.selectedItem.value))
    assert.throws(() => state.mirrorSelected('invalid'), /направлен|отражен|копи/i)
    assert.deepEqual(state.project.value.items, [original])
    assert.equal(state.selectedId.value, original.id)
    const full = {
      ...JSON.parse(JSON.stringify(state.project.value)),
      items: Array.from({ length: 200 }, (_, index) => ({ ...original, id: `full-${index}` })),
    }
    state.loadProject(full)
    state.selectedId.value = full.items[0].id
    assert.throws(() => state.mirrorSelected('diagonal'), /200/)
    assert.deepEqual(state.project.value, full)
    assert.equal(state.selectedId.value, full.items[0].id)
    state.undo()
    assert.deepEqual(state.project.value.items, [original], 'rejected copies do not add history')
    state.undo()
    assert.deepEqual(state.project.value.items, [], 'the original addition is still the previous action')
  } finally {
    fixture.cleanup()
  }
})

test('every catalogue product can be placed and reopened in projects within the 200-item limit', () => {
  const fixture = editor()
  try {
    const state = fixture.state
    for (let offset = 0; offset < constructorProducts.length; offset += 200) {
      const batch = constructorProducts.slice(offset, offset + 200)
      state.applyPreset('empty')
      for (const product of batch) {
        const dimensions = product.requiresDimensions
          ? { widthMm: product.widthMm || 200, heightMm: product.heightMm || 600 }
          : undefined
        state.addProduct(product, dimensions)
        assert.equal(state.selectedProduct.value.id, product.id)
        assert.ok(state.selectedProduct.value.widthMm > 0)
        assert.ok(state.selectedProduct.value.heightMm > 0)
      }
      assert.equal(state.project.value.items.length, batch.length)
      assert.equal(state.totalQuantity.value, batch.length)
      const saved = JSON.parse(JSON.stringify(state.project.value))
      state.applyPreset('empty')
      state.loadProject(saved)
      assert.deepEqual(state.project.value, saved)
    }
  } finally {
    fixture.cleanup()
  }
})

test('explicit sizes can be corrected and mirrored without changing catalogue data or losing undo', () => {
  const fixture = editor()
  try {
    const state = fixture.state
    state.applyPreset('empty')
    const product = constructorProducts.find((entry) => entry.id === 6311)
    const original = JSON.stringify(product)
    assert.throws(() => state.addProduct(product), /размер|ширину/i)
    assert.equal(state.project.value.items.length, 0)
    state.addProduct(product, { widthMm: 160, heightMm: 65 })
    const added = JSON.parse(JSON.stringify(state.selectedItem.value))
    state.updateSelected({ dimensions: { widthMm: 165, heightMm: 70 } })
    assert.equal(state.selectedProduct.value.widthMm, 165)
    state.undo()
    assert.deepEqual(state.project.value.items, [added])
    state.selectedId.value = added.id
    state.duplicateSelected(true)
    assert.deepEqual(state.selectedItem.value.dimensions, added.dimensions)
    assert.notEqual(state.selectedItem.value.id, added.id)
    assert.equal(JSON.stringify(product), original)
  } finally {
    fixture.cleanup()
  }
})

test('pagehide saves an edit before the debounce expires and the listener is removed on disposal', () => {
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const lifecycle = new EventTarget()
  Object.defineProperty(globalThis, 'window', { configurable: true, value: lifecycle })
  const fixture = editor()
  try {
    const state = fixture.state
    state.applyPreset('empty')
    state.addProduct(constructorProducts[0])
    lifecycle.dispatchEvent(new Event('pagehide'))
    const saved = JSON.parse(fixture.memory.get(CONSTRUCTOR_STORAGE_KEY))
    assert.equal(saved.items.length, 1)
    assert.equal(saved.items[0].productId, constructorProducts[0].id)
  } finally {
    fixture.cleanup()
    const savedAfterDisposal = fixture.memory.get(CONSTRUCTOR_STORAGE_KEY)
    fixture.state.project.value.items = []
    lifecycle.dispatchEvent(new Event('pagehide'))
    assert.equal(fixture.memory.get(CONSTRUCTOR_STORAGE_KEY), savedAfterDisposal)
    if (windowDescriptor) Object.defineProperty(globalThis, 'window', windowDescriptor)
    else delete globalThis.window
  }
})

test('applying a composition is one reversible action and its name follows edits and reopening', () => {
  const fixture = editor()
  try {
    const state = fixture.state
    const { activeTemplate, templateCount } = useConstructorTemplates(
      state.project,
      constructorProducts,
      state.editorRevision
    )
    const initial = JSON.parse(JSON.stringify(state.project.value))
    assert.equal(templateCount.value, 8)
    assert.equal(activeTemplate.value.id, 'classic')
    state.applyPreset('palace')
    const applied = JSON.parse(JSON.stringify(state.project.value))
    assert.equal(activeTemplate.value.id, 'palace')
    assert.equal(state.totalQuantity.value, applied.items.length)
    state.undo()
    assert.deepEqual(state.project.value, initial)
    assert.equal(activeTemplate.value.id, 'classic')
    state.redo()
    assert.deepEqual(state.project.value, applied)
    const item = state.project.value.items[0]
    state.moveItem({ id: item.id, x: item.x + 1, y: item.y, commit: true })
    assert.equal(activeTemplate.value, null)
    state.undo()
    assert.equal(activeTemplate.value.id, 'palace')
    state.applyPreset('empty')
    assert.equal(activeTemplate.value, null)
    state.loadProject({ ...applied, items: applied.items.map((item, index) => ({ ...item, id: `import-${index}` })) })
    assert.equal(activeTemplate.value.id, 'palace', 'recognition does not depend on imported IDs')
    state.applyDimensions({ width: 4200, height: 2100, sections: 1 })
    assert.equal(activeTemplate.value, null, 'a resized frame preserves the edited placement')
  } finally {
    fixture.cleanup()
  }
})

test('an unavailable composition preserves the current drawing, selection and undo history', () => {
  const fixture = editor()
  try {
    const state = fixture.state
    const initial = JSON.parse(JSON.stringify(state.project.value))
    state.applyDimensions({ width: 500, height: 500, sections: 1 })
    state.selectedId.value = state.project.value.items[0].id
    const selectedId = state.selectedId.value
    const before = JSON.parse(JSON.stringify(state.project.value))
    assert.throws(() => state.applyPreset('palace'), /не менее/)
    assert.throws(() => state.applyPreset('unknown'), /не найден/)
    assert.deepEqual(state.project.value, before)
    assert.equal(state.selectedId.value, selectedId)
    state.undo()
    assert.deepEqual(state.project.value, initial, 'rejected templates did not add history entries')
  } finally {
    fixture.cleanup()
  }
})

test('drag is one undoable action and redo restores the final placement', () => {
  const fixture = editor()
  try {
    const state = fixture.state
    state.applyPreset('empty')
    state.addProduct(constructorProducts[0])
    const original = { ...state.selectedItem.value }
    state.moveItem({ id: original.id, x: 900, y: 700, commit: false })
    state.moveItem({ id: original.id, x: 1000, y: 800, commit: false })
    state.moveItem({ id: original.id, x: 1000, y: 800, commit: true })
    state.undo()
    assert.deepEqual(state.project.value.items, [original])
    state.redo()
    assert.equal(state.project.value.items[0].x, 1000)
    assert.equal(state.project.value.items[0].y, 800)
  } finally {
    fixture.cleanup()
  }
})

test('rotation previews form one undoable action and preserve placement and product size', () => {
  const fixture = editor()
  try {
    const state = fixture.state
    state.applyPreset('empty')
    state.addProduct(constructorProducts[0])
    const original = { ...state.selectedItem.value }
    const productBefore = { ...state.selectedProduct.value }
    state.rotateItem({ id: original.id, rotation: 23.6, commit: false })
    assert.equal(state.selectedItem.value.rotation, 24)
    state.rotateItem({ id: original.id, rotation: 87.2, commit: false })
    assert.equal(state.selectedItem.value.rotation, 87)
    state.rotateItem({ id: original.id, rotation: 91.4, commit: true })
    assert.deepEqual(state.selectedItem.value, { ...original, rotation: 91 })
    assert.deepEqual(state.selectedProduct.value, productBefore)
    state.undo()
    assert.deepEqual(state.project.value.items, [original])
    state.undo()
    assert.equal(state.project.value.items.length, 0, 'one more undo removes the added item')
    state.redo()
    state.redo()
    assert.deepEqual(state.project.value.items, [{ ...original, rotation: 91 }])
    state.rotateItem({ id: original.id, rotation: 180, commit: true })
    state.undo()
    assert.equal(state.project.value.items[0].rotation, 91, 'the completed gesture snapshot was reset')
  } finally {
    fixture.cleanup()
  }
})

test('rotation normalizes negative and wrapped degrees, ignoring invalid input and unchanged angles', () => {
  const fixture = editor()
  try {
    const state = fixture.state
    state.applyPreset('empty')
    state.addProduct(constructorProducts[0])
    const id = state.selectedId.value
    state.rotateItem({ id, rotation: -45.4, commit: true })
    assert.equal(state.selectedItem.value.rotation, 315)
    state.rotateItem({ id, rotation: 765.2, commit: true })
    assert.equal(state.selectedItem.value.rotation, 45)
    state.rotateItem({ id, rotation: 359.6, commit: true })
    assert.equal(state.selectedItem.value.rotation, 0)
    const before = JSON.stringify(state.project.value)
    for (const rotation of [NaN, Infinity, -Infinity, '90']) {
      state.rotateItem({ id, rotation, commit: true })
      assert.equal(JSON.stringify(state.project.value), before)
    }
    state.rotateItem({ id: 'missing', rotation: 90, commit: true })
    state.rotateItem({ id, rotation: 720, commit: true })
    state.undo()
    assert.equal(state.project.value.items[0].rotation, 45, 'invalid and unchanged rotations add no history')
  } finally {
    fixture.cleanup()
  }
})

test('a rotated project saves and reopens with its exact final angle and placement', async () => {
  const fixture = editor()
  let expected
  try {
    const state = fixture.state
    state.applyPreset('empty')
    state.addProduct(constructorProducts[0])
    state.rotateItem({ id: state.selectedId.value, rotation: -102.8, commit: false })
    state.rotateItem({ id: state.selectedId.value, rotation: -101.8, commit: true })
    expected = JSON.parse(JSON.stringify(state.project.value))
    await nextTick()
  } finally {
    fixture.cleanup()
  }
  const stored = JSON.parse(fixture.memory.get(CONSTRUCTOR_STORAGE_KEY))
  assert.equal(stored.items[0].rotation, 258)
  assert.deepEqual(normalizeProject(stored, constructorProducts), expected)
})

for (const kind of ['rotate', 'move']) {
  test(`deleting during a live ${kind} gesture cannot contaminate the next gesture history`, () => {
    const fixture = editor()
    try {
      const state = fixture.state
      state.applyPreset('empty')
      state.addProduct(constructorProducts[0])
      const deletedId = state.selectedId.value
      const gesture = kind === 'rotate' ? state.rotateItem : state.moveItem
      const values = kind === 'rotate' ? { rotation: 45 } : { x: 700, y: 800 }
      gesture({ id: deletedId, ...values, commit: false })
      state.removeSelected()
      gesture({ id: deletedId, ...values, commit: true })
      state.addProduct(constructorProducts[1])
      const added = { ...state.selectedItem.value }
      gesture({ id: added.id, ...values, commit: true })
      state.undo()
      assert.deepEqual(state.project.value.items, [added])
      state.undo()
      assert.deepEqual(state.project.value.items, [])
      state.undo()
      assert.equal(state.project.value.items[0].id, deletedId)
      for (const [key, value] of Object.entries(values)) assert.equal(state.project.value.items[0][key], value)
      state.undo()
      assert.equal(state.project.value.items[0].rotation, 0)
      if (kind === 'move')
        assert.equal(state.project.value.items[0].x, 994, 'the true leaf center accounts for the 24 mm gate gap')
    } finally {
      fixture.cleanup()
    }
  })
}

test('undo during a live transform restores its beginning and redo restores the preview', () => {
  const fixture = editor()
  try {
    const state = fixture.state
    state.applyPreset('empty')
    state.addProduct(constructorProducts[0])
    const original = { ...state.selectedItem.value }
    state.rotateItem({ id: original.id, rotation: 30, commit: false })
    state.undo()
    assert.deepEqual(state.project.value.items, [original])
    state.redo()
    assert.deepEqual(state.project.value.items, [{ ...original, rotation: 30 }])
    state.rotateItem({ id: original.id, rotation: 60, commit: true })
    state.undo()
    assert.equal(state.project.value.items[0].rotation, 30)
  } finally {
    fixture.cleanup()
  }
})

test('starting rotation seals an unfinished move as its own undoable action', () => {
  const fixture = editor()
  try {
    const state = fixture.state
    state.applyPreset('empty')
    state.addProduct(constructorProducts[0])
    const original = { ...state.selectedItem.value }
    state.moveItem({ id: original.id, x: 700, y: 800, commit: false })
    state.rotateItem({ id: original.id, rotation: 45, commit: false })
    state.rotateItem({ id: original.id, rotation: 50, commit: true })
    state.undo()
    assert.deepEqual(state.project.value.items, [{ ...original, x: 700, y: 800 }])
    state.undo()
    assert.deepEqual(state.project.value.items, [original])
  } finally {
    fixture.cleanup()
  }
})

test('rejected copy and import preserve the project and its history; movement remains reopenable', () => {
  const fixture = editor()
  try {
    const state = fixture.state
    state.applyPreset('empty')
    state.addProduct(constructorProducts[0])
    state.updateSelected({ x: 16000 })
    const before = JSON.stringify(state.project.value)
    assert.throws(() => state.duplicateSelected(), /16000/)
    assert.equal(JSON.stringify(state.project.value), before)
    assert.throws(() => state.loadProject({ version: 2 }), /версии/)
    assert.equal(JSON.stringify(state.project.value), before)
    state.moveItem({ id: state.selectedId.value, x: 16010, y: 800, commit: true })
    assert.equal(state.selectedItem.value.x, 16000)
    assert.deepEqual(
      normalizeProject(state.project.value, constructorProducts),
      JSON.parse(JSON.stringify(state.project.value))
    )
  } finally {
    fixture.cleanup()
  }
})

test('fence counts, geometry-preserving resize and save on unmount survive reopening', async () => {
  const fixture = editor()
  try {
    const state = fixture.state
    state.applyPreset('empty')
    state.setType('fence')
    state.addProduct(constructorProducts[0])
    const item = { ...state.selectedItem.value }
    state.applyDimensions({ width: 3500, height: 2200, sections: 4 })
    assert.deepEqual(state.project.value.items[0], item)
    assert.equal(state.totalQuantity.value, 4)
    await nextTick()
  } finally {
    fixture.cleanup()
  }
  const stored = JSON.parse(fixture.memory.get(CONSTRUCTOR_STORAGE_KEY))
  assert.equal(normalizeProject(stored, constructorProducts).sections, 4)
})

test('equal spacing applies to the selected product while other decor stays in place', () => {
  const fixture = editor()
  try {
    const state = fixture.state
    state.applyPreset('empty')
    const repeated = constructorProducts.find((product) => product.id === 6292)
    for (const x of [300, 700, 1700]) {
      state.addProduct(repeated)
      state.updateSelected({ x, y: 900 })
    }
    const selected = state.selectedId.value
    state.addProduct(constructorProducts[0])
    const crown = { ...state.selectedItem.value }
    state.selectedId.value = selected
    assert.equal(state.distributionCount.value, 3)
    state.distribute('x')
    assert.deepEqual(
      state.project.value.items.filter((item) => item.productId === repeated.id).map((item) => item.x),
      [300, 1000, 1700]
    )
    assert.deepEqual(
      state.project.value.items.find((item) => item.id === crown.id),
      crown
    )
    state.undo()
    assert.equal(state.project.value.items[1].x, 700)
  } finally {
    fixture.cleanup()
  }
})

test('multi-selection and explicit groups translate rigidly with one undo step', () => {
  const fixture = editor()
  try {
    const state = fixture.state
    state.applyPreset('empty')
    const product = constructorProducts.find((entry) => entry.id === 6292)
    state.addProduct(product, undefined, { x: 300, y: 500 })
    const first = state.selectedId.value
    state.addProduct(product, undefined, { x: 700, y: 520 })
    const second = state.selectedId.value
    state.selectItem(first, { additive: true })
    state.groupSelected()
    state.selectItem(null)
    state.selectItem(second)
    assert.equal(state.selectedIds.value.length, 2)
    const before = JSON.parse(JSON.stringify(state.project.value))
    state.moveItem({ id: second, ids: state.selectedIds.value, x: 750, y: 550, dx: 50, dy: 30, commit: false })
    state.moveItem({ id: second, ids: state.selectedIds.value, x: 820, y: 610, dx: 120, dy: 90, commit: true })
    assert.deepEqual(
      state.project.value.items.map((item) => [item.x, item.y]),
      [
        [420, 590],
        [820, 610],
      ]
    )
    state.undo()
    assert.deepEqual(state.project.value, before)
    state.redo()
    assert.deepEqual(
      state.project.value.items.map((item) => [item.x, item.y]),
      [
        [420, 590],
        [820, 610],
      ]
    )
  } finally {
    fixture.cleanup()
  }
})

test('group rotation, copying and locks preserve the complete motif', () => {
  const fixture = editor()
  try {
    const state = fixture.state
    state.applyPreset('empty')
    const product = constructorProducts.find((entry) => entry.id === 6292)
    state.addProduct(product, undefined, { x: 300, y: 500 })
    const first = state.selectedId.value
    state.addProduct(product, undefined, { x: 700, y: 500 })
    state.selectItem(first, { additive: true })
    state.groupSelected()
    const originalGroup = state.selectedItem.value.groupId
    state.transformSelected('rotate')
    assert.deepEqual(
      state.project.value.items.map((item) => [Math.round(item.x), Math.round(item.y), item.rotation]),
      [
        [500, 300, 90],
        [500, 700, 90],
      ]
    )
    state.duplicateSelected()
    assert.equal(state.project.value.items.length, 4)
    assert.equal(state.selectedItems.value.length, 2)
    assert.notEqual(state.selectedItem.value.groupId, originalGroup)
    state.lockSelected()
    const locked = JSON.parse(JSON.stringify(state.project.value))
    assert.throws(() => state.transformSelected('rotate'), /закреплен/)
    assert.throws(() => state.removeSelected(), /закреплен/)
    const item = state.selectedItem.value
    state.moveItem({ id: item.id, ids: state.selectedIds.value, x: item.x + 100, y: item.y, commit: true })
    assert.deepEqual(state.project.value, locked)
    state.lockSelected()
    state.ungroupSelected()
    assert.ok(state.selectedItems.value.every((entry) => !entry.groupId && !entry.locked))
  } finally {
    fixture.cleanup()
  }
})

test('arrangement preview is read-only until applied and reverts with one undo', async () => {
  const { proposeArrangement } = await import('../src/constructor/alignment.js')
  const fixture = editor()
  try {
    const state = fixture.state
    state.loadProject({
      version: 1,
      type: 'fence',
      width: 2500,
      height: 1800,
      sections: 2,
      items: [300, 800, 1900].map((x, index) => ({
        id: 'preview-' + index,
        productId: 6292,
        x,
        y: 800 + index * 10,
        rotation: 0,
        flipX: false,
      })),
    })
    const before = JSON.parse(JSON.stringify(state.project.value))
    const proposal = proposeArrangement(state.project.value, constructorProducts)
    assert.equal(proposal.canApply, true)
    assert.equal(proposal.changed, true)
    assert.deepEqual(state.project.value, before)
    state.applyArrangement(proposal)
    assert.equal(state.project.value.items[0].x, 300)
    assert.equal(state.project.value.items[2].x, 1900)
    assert.deepEqual(
      state.project.value.items.map((item) => item.y),
      [810, 810, 810]
    )
    state.undo()
    assert.deepEqual(state.project.value, before)
    state.redo()
    assert.equal(state.project.value.items[1].x, 1100)
    const after = JSON.parse(JSON.stringify(state.project.value))
    assert.throws(() => state.applyArrangement({ ...proposal, canApply: false }), /Исправьте/)
    assert.deepEqual(state.project.value, after)
  } finally {
    fixture.cleanup()
  }
})

test('unknown-size interests and notes survive save without inventing a placed item', () => {
  const fixture = editor()
  try {
    const state = fixture.state
    const product = constructorProducts.find((entry) => entry.requiresDimensions)
    const count = state.project.value.items.length
    state.addDiscussion(product)
    state.addDiscussion(product)
    state.updateComment('Согласовать высоту и крепления')
    assert.deepEqual(state.project.value.discussionItems, [product.id])
    assert.equal(state.project.value.items.length, count)
    const raw = JSON.parse(JSON.stringify(state.project.value))
    state.loadProject({ version: 1, type: 'wicket', width: 1000, height: 2000, sections: 1, items: [] })
    assert.equal(state.project.value.comment, undefined)
    assert.equal(state.project.value.discussionItems, undefined)
    state.undo()
    assert.deepEqual(state.project.value, raw)
  } finally {
    fixture.cleanup()
  }
})

test('placing a discussed product clears its interest in the same undo transaction', () => {
  const fixture = editor()
  try {
    const state = fixture.state
    state.applyPreset('empty')
    const product = constructorProducts.find((entry) => entry.requiresDimensions)
    state.addDiscussion(product)
    state.addProduct(product, { widthMm: 100, heightMm: 150 }, { x: 300, y: 400 })
    assert.equal(state.project.value.items.length, 1)
    assert.deepEqual(state.project.value.discussionItems, [])
    state.undo()
    assert.equal(state.project.value.items.length, 0)
    assert.deepEqual(state.project.value.discussionItems, [product.id])
  } finally {
    fixture.cleanup()
  }
})

test('completed revisions recognize templates without following intermediate drag and rotation frames', async () => {
  const fixture = editor()
  const scope = effectScope()
  try {
    const state = fixture.state
    const templates = scope.run(() => useConstructorTemplates(state.project, constructorProducts, state.editorRevision))
    const original = JSON.parse(JSON.stringify(state.project.value.items[0]))
    const revision = state.editorRevision.value
    assert.equal(templates.activeTemplate.value.id, 'classic')
    for (let frame = 1; frame <= 120; frame++) {
      state.moveItem({ id: original.id, x: original.x + frame, y: original.y, commit: false })
      await nextTick()
      assert.equal(state.selectedItem.value, undefined)
      assert.equal(state.project.value.items[0].x, original.x + frame, 'the drawing remains live')
      assert.equal(state.editorRevision.value, revision)
      assert.equal(templates.activeTemplate.value.id, 'classic')
    }
    state.moveItem({ id: original.id, x: original.x + 120, y: original.y, commit: true })
    assert.equal(state.editorRevision.value, revision + 1)
    assert.equal(templates.activeTemplate.value, null)
    state.undo()
    assert.equal(state.editorRevision.value, revision + 2)
    assert.equal(templates.activeTemplate.value.id, 'classic')
    state.redo()
    assert.equal(state.editorRevision.value, revision + 3)
    assert.equal(templates.activeTemplate.value, null)
    state.undo()
    const beforeRotation = state.editorRevision.value
    state.rotateItem({ id: original.id, rotation: original.rotation + 25, commit: false })
    await nextTick()
    assert.equal(state.editorRevision.value, beforeRotation)
    assert.equal(templates.activeTemplate.value.id, 'classic')
    state.rotateItem({ id: original.id, rotation: original.rotation + 25, commit: true })
    assert.equal(state.editorRevision.value, beforeRotation + 1)
    assert.equal(templates.activeTemplate.value, null)
    state.undo()
    const beforeNoop = state.editorRevision.value
    state.moveItem({ id: original.id, x: original.x + 50, y: original.y, commit: false })
    state.moveItem({ id: original.id, x: original.x, y: original.y, commit: true })
    assert.equal(state.editorRevision.value, beforeNoop, 'returning to the original placement adds no revision')
    assert.equal(templates.activeTemplate.value.id, 'classic')
  } finally {
    scope.stop()
    fixture.cleanup()
  }
})

test('autosave runs after a completed gesture, never traversing or serializing live frames', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const fixture = editor()
  try {
    const state = fixture.state
    let writes = 0
    globalThis.localStorage.setItem = (key, value) => {
      writes++
      fixture.memory.set(key, value)
    }
    state.applyPreset('empty')
    const product = constructorProducts.find((entry) => entry.id === 6199)
    state.addProduct(product)
    const item = { ...state.selectedItem.value }
    // A gesture starts before the pending add is saved. Even a long pause must
    // not serialize an intermediate placement through that older save timer.
    state.moveItem({ id: item.id, x: 300, y: 500, commit: false })
    for (let frame = 0; frame < 30; frame++) {
      t.mock.timers.tick(500)
      state.moveItem({ id: item.id, x: 300 + frame, y: 500, commit: false })
      await nextTick()
    }
    assert.equal(writes, 0)
    state.moveItem({ id: item.id, x: 329, y: 500, commit: true })
    t.mock.timers.tick(299)
    assert.equal(writes, 0)
    t.mock.timers.tick(1)
    assert.equal(writes, 1)
    assert.equal(JSON.parse(fixture.memory.get(CONSTRUCTOR_STORAGE_KEY)).items[0].x, 329)
    state.undo()
    t.mock.timers.tick(300)
    assert.equal(writes, 2)
    assert.deepEqual(JSON.parse(fixture.memory.get(CONSTRUCTOR_STORAGE_KEY)).items, [item])
    state.redo()
    t.mock.timers.tick(300)
    assert.equal(writes, 3)
    assert.equal(JSON.parse(fixture.memory.get(CONSTRUCTOR_STORAGE_KEY)).items[0].x, 329)
    state.updateComment('Размеры уточнить')
    state.addDiscussion(constructorProducts.find((entry) => entry.requiresDimensions))
    t.mock.timers.tick(300)
    const saved = JSON.parse(fixture.memory.get(CONSTRUCTOR_STORAGE_KEY))
    assert.equal(saved.comment, 'Размеры уточнить')
    assert.equal(saved.discussionItems.length, 1)
  } finally {
    fixture.cleanup()
  }
})

test('pagehide and disposal flush the latest unfinished transform without waiting for a commit', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const lifecycle = new EventTarget()
  Object.defineProperty(globalThis, 'window', { configurable: true, value: lifecycle })
  const fixture = editor()
  try {
    const state = fixture.state
    const item = state.project.value.items[0]
    state.moveItem({ id: item.id, x: 700, y: 800, commit: false })
    lifecycle.dispatchEvent(new Event('pagehide'))
    assert.equal(JSON.parse(fixture.memory.get(CONSTRUCTOR_STORAGE_KEY)).items[0].x, 700)
    state.rotateItem({ id: item.id, rotation: 37, commit: false })
    fixture.cleanup()
    const saved = JSON.parse(fixture.memory.get(CONSTRUCTOR_STORAGE_KEY))
    assert.equal(saved.items[0].x, 700)
    assert.equal(saved.items[0].rotation, 37)
  } finally {
    fixture.cleanup()
    if (descriptor) Object.defineProperty(globalThis, 'window', descriptor)
    else delete globalThis.window
  }
})

test('grouped or locked preset pieces count as a custom drawing and cannot be silently rebuilt', () => {
  const fixture = editor()
  try {
    const state = fixture.state
    const scope = effectScope()
    const templates = scope.run(() => useConstructorTemplates(state.project, constructorProducts, state.editorRevision))
    assert.equal(templates.activeTemplate.value.id, 'classic')
    state.selectItem(state.project.value.items[0].id)
    state.lockSelected()
    assert.equal(templates.activeTemplate.value, null)
    state.undo()
    assert.equal(templates.activeTemplate.value.id, 'classic')
    state.selectItem(state.project.value.items[0].id)
    state.selectItem(state.project.value.items[1].id, { additive: true })
    state.groupSelected()
    assert.equal(templates.activeTemplate.value, null)
    scope.stop()
  } finally {
    fixture.cleanup()
  }
})
