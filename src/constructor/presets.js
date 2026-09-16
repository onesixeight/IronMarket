import { createItem, getItemBounds, mirrorItem } from './model.js'

// Sizes describe one panel including a 60 mm clear perimeter. Recipes use only
// existing catalog parts; a wider frame changes spacing and count, never scale.
export const constructorPresets = [
  {
    id: 'classic',
    name: 'Шанырак',
    description: 'Корона и круглый медальон с боковыми акцентами',
    style: 'Классика',
    density: 'Средний',
    minimumPanelWidth: 970,
    minimumHeight: 1260,
  },
  {
    id: 'rhythm',
    name: 'Тихий ритм',
    description: 'Тонкие балясины и спокойный равномерный шаг',
    style: 'Минимализм',
    density: 'Лёгкий',
    minimumPanelWidth: 860,
    minimumHeight: 920,
  },
  {
    id: 'butterfly',
    name: 'Бабочка',
    description: 'Воздушная корона, парный узор и нижние завитки',
    style: 'Романтика',
    density: 'Средний',
    minimumPanelWidth: 1620,
    minimumHeight: 1080,
  },
  {
    id: 'wave',
    name: 'Волна',
    description: 'Волнистая корона, центральное облако и пояс завитков',
    style: 'Орнамент',
    density: 'Средний',
    minimumPanelWidth: 1370,
    minimumHeight: 1365,
  },
  {
    id: 'palace',
    name: 'Парадный',
    description: 'Четыре угловых узора обрамляют крупный медальон',
    style: 'Классика',
    density: 'Насыщенный',
    minimumPanelWidth: 1960,
    minimumHeight: 1600,
  },
  {
    id: 'lyre',
    name: 'Лира',
    description: 'Ступенчатая арка из балясин под компактной короной',
    style: 'Романтика',
    density: 'Средний',
    minimumPanelWidth: 1000,
    minimumHeight: 1340,
  },
  {
    id: 'braid',
    name: 'Двойная вязь',
    description: 'Два встречных пояса из горизонтальных восьмёрок',
    style: 'Геометрия',
    density: 'Средний',
    minimumPanelWidth: 950,
    minimumHeight: 940,
  },
  {
    id: 'rosette',
    name: 'Розетка',
    description: 'Крестовидный медальон в обрамлении четырёх завитков',
    style: 'Геометрия',
    density: 'Средний',
    minimumPanelWidth: 1340,
    minimumHeight: 1340,
  },
  {
    id: 'empty',
    name: 'С нуля',
    description: 'Чистая рама для своего рисунка',
    style: 'Свободный',
    density: 'Без деталей',
    minimumPanelWidth: 500,
    minimumHeight: 500,
  },
]

const REQUIRED_PRODUCTS = {
  classic: [6150, 6157, 6179, 6199],
  rhythm: [6206],
  butterfly: [6151, 6178, 6210, 6292],
  wave: [6152, 6177, 6301],
  palace: [6160, 6174],
  lyre: [6157, 6210],
  braid: [6192],
  rosette: [6174, 6302],
}
const INSET = 60
const part = (productId, x, y = 0, extra = {}) => ({ productId, x, y, rotation: 0, flipX: false, ...extra })

function oddCount(width, productWidth, gap, maximum, minimum = 3) {
  let count = Math.min(maximum, Math.floor((width - INSET * 2 + gap) / (productWidth + gap)))
  if (count % 2 === 0) count--
  return Math.max(minimum, count)
}

function row(width, product, count, extra = {}) {
  const pitch = count === 1 ? 0 : Math.min(product.widthMm + 140, (width - INSET * 2 - product.widthMm) / (count - 1))
  return Array.from({ length: count }, (_, index) =>
    part(product.id, width / 2 + (index - (count - 1) / 2) * pitch, 0, extra)
  )
}

function stack(rows, height, catalog, minimumGap = 100) {
  const measures = rows.map((items) => {
    const bounds = items.map((item) => getItemBounds(item, catalog.get(item.productId)))
    const top = Math.min(...bounds.map((bound) => bound.top))
    const bottom = Math.max(...bounds.map((bound) => bound.bottom))
    return { items, height: bottom - top, center: (top + bottom) / 2 }
  })
  const totalHeight = measures.reduce((sum, measure) => sum + measure.height, 0)
  const gap = rows.length === 1 ? 0 : Math.min(minimumGap + 100, (height - INSET * 2 - totalHeight) / (rows.length - 1))
  let cursor = (height - totalHeight - gap * (rows.length - 1)) / 2
  return measures.flatMap((measure) => {
    const center = cursor + measure.height / 2
    cursor += measure.height + gap
    return measure.items.map((item) => ({ ...item, y: item.y - measure.center + center }))
  })
}

function layoutClassic(width, height, catalog) {
  const medallion = catalog.get(6179)
  const largeCrown = catalog.get(6150)
  const crown =
    width >= largeCrown.widthMm + 120 && height >= largeCrown.heightMm + medallion.heightMm + 220
      ? largeCrown
      : catalog.get(6157)
  const lower = [part(medallion.id, width / 2)]
  const baluster = catalog.get(6199)
  if (
    width >= medallion.widthMm + 2 * baluster.widthMm + 320 &&
    height >= crown.heightMm + Math.max(medallion.heightMm, baluster.heightMm) + 220
  ) {
    const offset = medallion.widthMm / 2 + 100 + baluster.widthMm / 2
    lower.push(part(baluster.id, width / 2 - offset), part(baluster.id, width / 2 + offset, 0, { flipX: true }))
  }
  return stack([[part(crown.id, width / 2)], lower], height, catalog)
}

function layoutButterfly(width, height, catalog) {
  const crown = catalog.get(6151)
  const ornament = catalog.get(6178)
  const baluster = catalog.get(6210)
  const lower = [part(ornament.id, width / 2)]
  let lowerHeight = ornament.heightMm
  if (width >= ornament.widthMm + 2 * baluster.widthMm + 280 && height >= crown.heightMm + baluster.heightMm + 220) {
    const offset = ornament.widthMm / 2 + 80 + baluster.widthMm / 2
    lower.push(part(baluster.id, width / 2 - offset), part(baluster.id, width / 2 + offset, 0, { flipX: true }))
    lowerHeight = Math.max(lowerHeight, baluster.heightMm)
  }
  const rows = [[part(crown.id, width / 2)], lower]
  const curl = catalog.get(6292)
  if (height >= crown.heightMm + lowerHeight + curl.heightMm + 320) {
    rows.push(row(width, curl, oddCount(width, curl.widthMm, 90, 7)))
  }
  return stack(rows, height, catalog)
}

function layoutPalace(width, height, catalog) {
  const corner = catalog.get(6160)
  const x = INSET + corner.widthMm / 2
  const y = INSET + corner.heightMm / 2
  // The source corner has its vertex at lower left. Vertical reflection is
  // represented with 180° rotation plus horizontal reflection.
  return [
    part(6160, x, y, { rotation: 180, flipX: true }),
    part(6160, width - x, y, { rotation: 180 }),
    part(6160, x, height - y),
    part(6160, width - x, height - y, { flipX: true }),
    part(6174, width / 2, height / 2),
  ]
}

function layoutLyre(width, height, catalog) {
  const baluster = catalog.get(6210)
  const capacity = Math.min(8, Math.floor((width - INSET * 2 + 70) / (baluster.widthMm + 70)))
  const count = Math.max(2, capacity - (capacity % 2))
  const middle = (count - 1) / 2
  const arch = row(width, baluster, count).map((item, index) => ({
    ...item,
    y: count === 2 ? 0 : ((Math.abs(index - middle) - 0.5) / (middle - 0.5)) * 160 - 80,
    flipX: index > middle,
  }))
  return stack([[part(6157, width / 2)], arch], height, catalog)
}

function layoutRosette(width, height, catalog) {
  const center = part(6174, width / 2, height / 2)
  const centerBounds = getItemBounds(center, catalog.get(6174))
  const accent = catalog.get(6302)
  const offsetX = centerBounds.width / 2 + 60 + accent.heightMm / 2
  const offsetY = centerBounds.height / 2 + 60 + accent.heightMm / 2
  return [
    center,
    part(6302, width / 2, height / 2 - offsetY),
    part(6302, width / 2, height / 2 + offsetY, { rotation: 180, flipX: true }),
    part(6302, width / 2 - offsetX, height / 2, { rotation: 90 }),
    part(6302, width / 2 + offsetX, height / 2, { rotation: -90, flipX: true }),
  ]
}

const LAYOUTS = {
  classic: layoutClassic,
  rhythm: (width, height, catalog) =>
    row(width, catalog.get(6206), oddCount(width, catalog.get(6206).widthMm, 100, 9)).map((item) => ({
      ...item,
      y: height / 2,
    })),
  butterfly: layoutButterfly,
  wave: (width, height, catalog) =>
    stack(
      [
        [part(6152, width / 2)],
        [part(6177, width / 2)],
        row(width, catalog.get(6301), oddCount(width, catalog.get(6301).widthMm, 80, 7)),
      ],
      height,
      catalog,
      80
    ),
  palace: layoutPalace,
  lyre: layoutLyre,
  braid: (width, height, catalog) => {
    const product = catalog.get(6192)
    const count = Math.max(1, Math.min(4, Math.floor((width - 120 + 120) / (product.widthMm + 120))))
    return stack(
      [row(width, product, count), row(width, product, count, { rotation: 180, flipX: true })],
      height,
      catalog,
      120
    )
  },
  rosette: layoutRosette,
}

function fitsLayout(items, width, height, catalog) {
  const bounds = items.map((item) => getItemBounds(item, catalog.get(item.productId)))
  if (
    bounds.some(
      (bound) =>
        bound.left < INSET - 0.001 ||
        bound.right > width - INSET + 0.001 ||
        bound.top < INSET - 0.001 ||
        bound.bottom > height - INSET + 0.001
    )
  )
    return false
  return bounds.every((a, index) =>
    bounds
      .slice(index + 1)
      .every(
        (b) =>
          Math.min(a.right, b.right) - Math.max(a.left, b.left) <= 0.001 ||
          Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) <= 0.001
      )
  )
}

export function buildPreset(project, products, id = 'classic') {
  const preset = constructorPresets.find((entry) => entry.id === id)
  const panels = project.type === 'gates' ? 2 : 1
  const minimum = {
    width: preset && id !== 'empty' ? preset.minimumPanelWidth * panels : 500,
    height: preset?.minimumHeight || 500,
  }
  const unavailable = (reason) => ({ items: [], available: false, reason, minimum, preset: preset || null })
  if (!preset) return unavailable('Рисунок не найден. Выберите другой вариант.')
  if (id === 'empty') return { items: [], available: true, reason: '', minimum, preset }
  if (
    !Number.isFinite(project.width) ||
    !Number.isFinite(project.height) ||
    project.width < minimum.width ||
    project.height < minimum.height
  ) {
    return unavailable(
      `Для рисунка «${preset.name}» нужна конструкция не менее ${minimum.width} × ${minimum.height} мм.`
    )
  }
  const catalog = new Map(products.map((product) => [product.id, product]))
  const missing = REQUIRED_PRODUCTS[id].filter((productId) => {
    const product = catalog.get(productId)
    return (
      !product ||
      !Number.isFinite(product.widthMm) ||
      product.widthMm <= 0 ||
      !Number.isFinite(product.heightMm) ||
      product.heightMm <= 0
    )
  })
  if (missing.length)
    return unavailable(`В каталоге недоступны детали рисунка: ${missing.join(', ')}. Выберите другой вариант.`)
  const panelWidth = project.width / panels
  const layout = LAYOUTS[id](panelWidth, project.height, catalog)
  if (!fitsLayout(layout, panelWidth, project.height, catalog)) {
    return unavailable(
      `Не удалось разместить рисунок целиком. Нужна конструкция не менее ${minimum.width} × ${minimum.height} мм с подходящими размерами деталей каталога.`
    )
  }
  const left = layout.map((item) => createItem(catalog.get(item.productId), project, item))
  const items = panels === 2 ? [...left, ...left.map((item) => mirrorItem(item, project.width))] : left
  return { items, available: true, reason: '', minimum, preset }
}

// Legacy callers receive either a complete composition or an empty array.
export function createPresetItems(project, products, id = 'classic') {
  return buildPreset(project, products, id).items
}
