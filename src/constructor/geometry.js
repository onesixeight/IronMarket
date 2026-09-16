// Geometry is expressed in millimetres. Edge contact is not an overlap.
export const GEOMETRY_EPSILON = 0.00001
export const roundCoordinate = (value) => Math.round(value * 1000000) / 1000000

export function boundsOverlap(a, b, epsilon = GEOMETRY_EPSILON) {
  return (
    Math.min(a.right, b.right) - Math.max(a.left, b.left) > epsilon &&
    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > epsilon
  )
}

export function unionBounds(bounds) {
  if (!bounds.length) return null
  return {
    left: Math.min(...bounds.map((entry) => entry.left)),
    right: Math.max(...bounds.map((entry) => entry.right)),
    top: Math.min(...bounds.map((entry) => entry.top)),
    bottom: Math.max(...bounds.map((entry) => entry.bottom)),
  }
}

export const isCornerProduct = (product) => product?.group === 'corners' || /уголок|угловой/i.test(product?.name || '')
