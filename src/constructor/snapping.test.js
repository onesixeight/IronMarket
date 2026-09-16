import test from 'node:test'
import assert from 'node:assert/strict'
import { snapBounds, translateBounds, unionBounds } from './snapping.js'

const frame = { left: 40, right: 1960, top: 40, bottom: 1960 }

test('free movement stays free when grid and nearby guides are absent', () => {
  const result = snapBounds({ left: 213.4, right: 513.4, top: 719.2, bottom: 919.2 }, { frame, threshold: 4 })
  assert.deepEqual(result, { dx: 0, dy: 0, guides: [] })
})

test('frame and neighbor guides capture only inside the visual threshold', () => {
  const bounds = { left: 44, right: 244, top: 705, bottom: 905 }
  const neighbor = { left: 800, right: 1000, top: 700, bottom: 900 }
  const result = snapBounds(bounds, { frame, neighbors: [neighbor], threshold: 6 })
  assert.equal(result.dx, -4)
  assert.equal(result.dy, -5)
  assert.equal(result.guides.length, 2)
  assert.equal(snapBounds(bounds, { frame, neighbors: [neighbor], threshold: 3 }).dy, 0)
})

test('a moved group snaps as one rigid bounding box', () => {
  const group = unionBounds([
    { left: 100, right: 250, top: 200, bottom: 500 },
    { left: 450, right: 600, top: 230, bottom: 510 },
  ])
  const moved = translateBounds(group, -57, 10)
  assert.equal(snapBounds(moved, { frame, threshold: 5 }).dx, -3)
  assert.deepEqual(group, { left: 100, right: 600, top: 200, bottom: 510 })
})

test('equal gaps between two neighboring details are suggested', () => {
  const bounds = { left: 506, right: 706, top: 300, bottom: 500 }
  const neighbors = [
    { left: 100, right: 300, top: 300, bottom: 500 },
    { left: 900, right: 1100, top: 300, bottom: 500 },
  ]
  const result = snapBounds(bounds, { neighbors, threshold: 8 })
  assert.equal(result.dx, -6)
  assert.equal(result.guides.find((entry) => entry.axis === 'x').kind, 'equal-gap')
  assert.equal(result.guides.find((entry) => entry.axis === 'x').label, '200 мм')
})

test('grid is explicit and does not override a precise guide', () => {
  const bounds = { left: 214, right: 415, top: 719, bottom: 920 }
  assert.deepEqual(snapBounds(bounds, { gridStep: 10, guides: false }), { dx: -4.5, dy: 0.5, guides: [] })
  const neighbor = { left: 216, right: 417, top: 1000, bottom: 1200 }
  assert.equal(snapBounds(bounds, { neighbors: [neighbor], threshold: 3, gridStep: 10 }).dx, 2)
})
