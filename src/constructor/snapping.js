const round = (value) => Math.round(value * 1000) / 1000

export { unionBounds } from './geometry.js'

export function translateBounds(bounds, dx, dy) {
  return { left: bounds.left + dx, right: bounds.right + dx, top: bounds.top + dy, bottom: bounds.bottom + dy }
}

// Coordinates are millimetres. The caller converts the visual capture distance
// from screen pixels, so a guide feels equally close at every zoom level.
export function snapBounds(bounds, { frame, neighbors = [], threshold = 0, gridStep = 0, guides = true } = {}) {
  const result = { dx: 0, dy: 0, guides: [] }
  for (const axis of ['x', 'y']) {
    const horizontal = axis === 'x'
    const start = horizontal ? 'left' : 'top'
    const end = horizontal ? 'right' : 'bottom'
    const crossStart = horizontal ? 'top' : 'left'
    const crossEnd = horizontal ? 'bottom' : 'right'
    const middle = (bounds[start] + bounds[end]) / 2
    const anchors = [bounds[start], middle, bounds[end]]
    const candidates = []
    const add = (delta, value, from, to, kind, label) => {
      if (Math.abs(delta) <= threshold + 1e-8) candidates.push({ delta, value, from, to, kind, label })
    }
    if (guides && frame) {
      for (const value of [frame[start], (frame[start] + frame[end]) / 2, frame[end]]) {
        for (const anchor of anchors) add(value - anchor, value, frame[crossStart], frame[crossEnd], 'frame')
      }
    }
    if (guides) {
      for (const neighbor of neighbors) {
        for (const value of [neighbor[start], (neighbor[start] + neighbor[end]) / 2, neighbor[end]]) {
          for (const anchor of anchors) {
            add(
              value - anchor,
              value,
              Math.min(bounds[crossStart], neighbor[crossStart]),
              Math.max(bounds[crossEnd], neighbor[crossEnd]),
              'neighbor'
            )
          }
        }
      }
      const relevant = neighbors.filter(
        (entry) => entry[crossStart] < bounds[crossEnd] && entry[crossEnd] > bounds[crossStart]
      )
      const before = relevant.filter((entry) => entry[end] <= middle).sort((a, b) => b[end] - a[end])[0]
      const after = relevant.filter((entry) => entry[start] >= middle).sort((a, b) => a[start] - b[start])[0]
      if (before && after) {
        const size = bounds[end] - bounds[start]
        const gap = (after[start] - before[end] - size) / 2
        if (gap >= 0) {
          const target = before[end] + gap + size / 2
          add(
            target - middle,
            target,
            Math.min(before[crossStart], after[crossStart]),
            Math.max(before[crossEnd], after[crossEnd]),
            'equal-gap',
            `${Math.round(gap)} мм`
          )
        }
      }
    }
    candidates.sort(
      (a, b) => Math.abs(a.delta) - Math.abs(b.delta) || Number(b.kind === 'equal-gap') - Number(a.kind === 'equal-gap')
    )
    const chosen = candidates[0]
    const delta = chosen ? chosen.delta : gridStep > 0 ? Math.round(middle / gridStep) * gridStep - middle : 0
    result[horizontal ? 'dx' : 'dy'] = round(delta)
    if (chosen) result.guides.push({ axis, ...chosen })
  }
  return result
}
