import test from 'node:test'
import assert from 'node:assert/strict'
import { getLayoutSignature } from '../src/constructor/layoutSignature.js'

test('entered dimensions distinguish layouts while equivalent copies retain their identity', () => {
  const item = {
    id: 'a',
    productId: 6311,
    x: 200,
    y: 300,
    rotation: 0,
    flipX: false,
    dimensions: { widthMm: 160, heightMm: 65 },
  }
  assert.equal(getLayoutSignature([item]), getLayoutSignature([{ ...item, id: 'copy' }]))
  assert.notEqual(
    getLayoutSignature([item]),
    getLayoutSignature([{ ...item, dimensions: { widthMm: 180, heightMm: 65 } }])
  )
})

test('template matching survives changed IDs, stacking order and equivalent angles', () => {
  const first = { id: 'first', productId: 6150, x: 1000, y: 500, rotation: -15, flipX: false }
  const second = { id: 'second', productId: 6179, x: 3000, y: 1200, rotation: 360, flipX: true }
  assert.equal(
    getLayoutSignature([first, second]),
    getLayoutSignature([
      { ...second, id: 'copy-2', rotation: 0 },
      { ...first, id: 'copy-1', rotation: 345 },
    ])
  )
})

test('changed arrangement, catalogue item, reflection or quantity becomes a custom layout', () => {
  const item = { productId: 6150, x: 1000, y: 500, rotation: 0, flipX: false }
  const baseline = getLayoutSignature([item])
  for (const edit of [{ x: 1010 }, { y: 510 }, { rotation: 1 }, { flipX: true }, { productId: 6151 }]) {
    assert.notEqual(getLayoutSignature([{ ...item, ...edit }]), baseline)
  }
  assert.notEqual(getLayoutSignature([item, item]), baseline)
})
