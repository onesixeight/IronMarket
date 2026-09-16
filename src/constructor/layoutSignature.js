// IDs and stacking order change when a project is copied or imported. The layout
// identity uses catalogue items and geometry so undo/import can recognize a preset.
export function getLayoutSignature(items) {
  const precise = (value) => Math.round(value * 1_000_000) / 1_000_000
  return items
    .map((item) =>
      JSON.stringify([
        item.productId,
        precise(item.x),
        precise(item.y),
        precise(((item.rotation % 360) + 360) % 360),
        Boolean(item.flipX),
        ...(item.dimensions ? [precise(item.dimensions.widthMm), precise(item.dimensions.heightMm)] : []),
      ])
    )
    .sort()
    .join('|')
}
