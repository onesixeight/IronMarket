// All positions and dimensions are millimetres. Confirmed dimensions come from
// the catalog; unresolved products require explicit dimensions on each item.
// Changing the frame never stretches an ornament.
import { roundCoordinate as cleanNumber } from './geometry.js'

export const PROJECT_LIMITS = Object.freeze({
  minWidth: 500,
  maxWidth: 8000,
  minHeight: 500,
  maxHeight: 4000,
  minSections: 1,
  maxSections: 50,
  maxItems: 200,
  maxCoordinate: 16000,
  minItemSize: 1,
  maxItemSize: 8000,
  frameMm: 40,
  gateGapMm: 24,
})

const TEMPLATES = Object.freeze({
  gates: { width: 4000, height: 2000, label: 'Двустворчатые ворота' },
  wicket: { width: 1000, height: 2000, label: 'Калитка' },
  fence: { width: 2500, height: 1800, label: 'Секция забора' },
})
let itemSequence = 0

function newItemId() {
  return globalThis.crypto?.randomUUID?.() ?? `item-${Date.now()}-${++itemSequence}`
}

function productMap(products) {
  return new Map(products.map((product) => [product.id, product]))
}

function hasDimensions(product) {
  return (
    product &&
    Number.isFinite(product.widthMm) &&
    product.widthMm > 0 &&
    Number.isFinite(product.heightMm) &&
    product.heightMm > 0
  )
}

export function resolveItemProduct(item, product) {
  if (!product) throw new Error('Элемент отсутствует в доступном каталоге.')
  if (!product.requiresDimensions) {
    if (!hasDimensions(product)) throw new Error('У элемента не указаны корректные размеры.')
    return product
  }
  if (!isRecord(item?.dimensions)) {
    throw new Error('Укажите подтверждённые ширину и высоту элемента перед размещением.')
  }
  const widthMm = assertNumber(
    item.dimensions.widthMm,
    PROJECT_LIMITS.minItemSize,
    PROJECT_LIMITS.maxItemSize,
    'Ширина элемента'
  )
  const heightMm = assertNumber(
    item.dimensions.heightMm,
    PROJECT_LIMITS.minItemSize,
    PROJECT_LIMITS.maxItemSize,
    'Высота элемента'
  )
  return { ...product, widthMm, heightMm }
}

export function createProject(type = 'gates') {
  const template = Object.hasOwn(TEMPLATES, type) ? TEMPLATES[type] : null
  if (!template) throw new Error('Выберите ворота, калитку или секцию забора.')
  return {
    version: 1,
    type,
    width: template.width,
    height: template.height,
    sections: 1,
    items: [],
  }
}

export function getFramePanels(project, { inner = false, insetMm = 0 } = {}) {
  if (
    !project ||
    !Object.hasOwn(TEMPLATES, project.type) ||
    !Number.isFinite(project.width) ||
    project.width <= 0 ||
    !Number.isFinite(project.height) ||
    project.height <= 0
  )
    throw new Error('Для расчёта створок нужны корректные размеры конструкции.')
  if (typeof inner !== 'boolean' || !Number.isFinite(insetMm) || insetMm < 0 || insetMm > 1000)
    throw new Error('Отступ должен быть числом от 0 до 1000 мм.')
  const inset = (inner ? PROJECT_LIMITS.frameMm : 0) + insetMm
  const panels =
    project.type === 'gates'
      ? [
          [0, (project.width - PROJECT_LIMITS.gateGapMm) / 2],
          [(project.width + PROJECT_LIMITS.gateGapMm) / 2, project.width],
        ]
      : [[0, project.width]]
  return panels.map(([outerLeft, outerRight], index) => {
    const left = outerLeft + inset
    const right = outerRight - inset
    const top = inset
    const bottom = project.height - inset
    if (left >= right || top >= bottom) throw new Error('Для выбранного отступа в раме не осталось места.')
    return {
      index,
      left,
      right,
      top,
      bottom,
      width: right - left,
      height: bottom - top,
      centerX: (left + right) / 2,
      centerY: (top + bottom) / 2,
    }
  })
}

export function createItem(product, project, overrides = {}) {
  const effective = resolveItemProduct(overrides, product)
  const metadata = itemMetadata(overrides, 'Элемент')
  return {
    id: newItemId(),
    productId: product.id,
    x: overrides.x ?? getFramePanels(project)[0].centerX,
    y: overrides.y ?? project.height / 2,
    rotation: overrides.rotation ?? 0,
    flipX: overrides.flipX ?? false,
    ...metadata,
    ...(product.requiresDimensions ? { dimensions: { widthMm: effective.widthMm, heightMm: effective.heightMm } } : {}),
  }
}

export function getItemBounds(item, product) {
  const effective = resolveItemProduct(item, product)
  const radians = (item.rotation * Math.PI) / 180
  const cosine = Math.abs(Math.cos(radians))
  const sine = Math.abs(Math.sin(radians))
  const width = cleanNumber(effective.widthMm * cosine + effective.heightMm * sine)
  const height = cleanNumber(effective.heightMm * cosine + effective.widthMm * sine)
  return {
    left: item.x - width / 2,
    top: item.y - height / 2,
    right: item.x + width / 2,
    bottom: item.y + height / 2,
    width,
    height,
  }
}

export function mirrorItem(item, projectWidth) {
  return {
    ...item,
    id: newItemId(),
    x: projectWidth - item.x,
    rotation: -item.rotation || 0,
    flipX: !item.flipX,
    ...(item.dimensions ? { dimensions: { ...item.dimensions } } : {}),
  }
}

export function mirrorItemInFrame(item, project, { axis = 'horizontal', scope = 'panel' } = {}) {
  if (!['horizontal', 'vertical', 'diagonal'].includes(axis)) {
    throw new Error('Выберите корректное направление отражения.')
  }
  if (!['panel', 'project'].includes(scope)) {
    throw new Error('Выберите корректную область отражения.')
  }
  if (
    !Number.isFinite(project.width) ||
    project.width <= 0 ||
    !Number.isFinite(project.height) ||
    project.height <= 0
  ) {
    throw new Error('Для отражения нужны корректные размеры конструкции.')
  }
  let left = 0
  let right = project.width
  if (scope === 'panel') {
    const panel = getFramePanels(project)[project.type === 'gates' && item.x >= project.width / 2 ? 1 : 0]
    left = panel.left
    right = panel.right
  }
  const rotation =
    axis === 'horizontal' ? -item.rotation : axis === 'vertical' ? 180 - item.rotation : item.rotation + 180
  return {
    ...item,
    id: newItemId(),
    x: axis === 'vertical' ? item.x : left + right - item.x,
    y: axis === 'horizontal' ? item.y : project.height - item.y,
    rotation: ((rotation % 360) + 360) % 360,
    flipX: axis === 'diagonal' ? item.flipX : !item.flipX,
    ...(item.dimensions ? { dimensions: { ...item.dimensions } } : {}),
  }
}

// Keep the first and last centers in place and equalize the free space between
// bounding boxes. A negative gap means there is no room to do this safely.
export function distributeItems(items, products, axis = 'x') {
  const unchanged = () => items.map((item) => ({ ...item }))
  if (items.length < 3 || !['x', 'y'].includes(axis)) return unchanged()
  const catalog = productMap(products)
  const startKey = axis === 'x' ? 'left' : 'top'
  const endKey = axis === 'x' ? 'right' : 'bottom'
  const sizeKey = axis === 'x' ? 'width' : 'height'
  let ordered
  try {
    ordered = items
      .map((item) => ({ item, bounds: getItemBounds(item, catalog.get(item.productId)) }))
      .sort((a, b) => a.item[axis] - b.item[axis])
  } catch {
    return unchanged()
  }
  const start = ordered[0].bounds[startKey]
  const end = ordered.at(-1).bounds[endKey]
  const totalSize = ordered.reduce((sum, entry) => sum + entry.bounds[sizeKey], 0)
  const gap = (end - start - totalSize) / (items.length - 1)
  if (!Number.isFinite(gap) || gap < 0) return unchanged()
  let cursor = start
  const positions = new Map()
  ordered.forEach(({ item, bounds }, index) => {
    positions.set(
      item.id,
      index === 0 || index === ordered.length - 1 ? item[axis] : cleanNumber(cursor + bounds[sizeKey] / 2)
    )
    cursor += bounds[sizeKey] + gap
  })
  return items.map((item) => ({ ...item, [axis]: positions.get(item.id) }))
}

export function getProjectWarnings(project, products) {
  const catalog = productMap(products)
  const warnings = []
  const add = (item, kind, message) => warnings.push({ id: `${item.id}:${kind}`, itemId: item.id, kind, message })
  const frame = PROJECT_LIMITS.frameMm
  const middleClearance = frame + PROJECT_LIMITS.gateGapMm / 2
  // Rotated bounds and saved coordinates are rounded to micrometre fractions.
  // Touching the frame must not become an overlap due to floating-point noise.
  const tolerance = 0.00001
  for (const item of project.items) {
    const product = catalog.get(item.productId)
    if (!product) {
      add(item, 'unknown-product', 'Элемент отсутствует в доступном каталоге.')
      continue
    }
    const name = product.name || `Элемент ${product.id}`
    let bounds
    try {
      bounds = getItemBounds(item, product)
    } catch {
      add(item, 'missing-dimensions', `${name}: укажите корректные ширину и высоту детали для проверки размещения.`)
      continue
    }
    if (
      bounds.left < -tolerance ||
      bounds.top < -tolerance ||
      bounds.right > project.width + tolerance ||
      bounds.bottom > project.height + tolerance
    ) {
      add(item, 'out-of-bounds', `${name}: габариты выходят за границы конструкции.`)
    } else if (
      bounds.left < frame - tolerance ||
      bounds.top < frame - tolerance ||
      bounds.right > project.width - frame + tolerance ||
      bounds.bottom > project.height - frame + tolerance
    ) {
      add(item, 'frame-overlap', `${name}: габариты заходят в зону каркаса ${frame} мм. Проверьте расположение.`)
    }
    if (
      project.type === 'gates' &&
      bounds.left < project.width / 2 + middleClearance - tolerance &&
      bounds.right > project.width / 2 - middleClearance + tolerance
    ) {
      add(item, 'gate-middle', `${name}: габариты пересекают зону стыка створок. Проверьте расположение.`)
    }
  }
  // Ornamental bounding boxes may overlap without the actual metal touching.
  // These warnings describe layout only; fabrication still needs a master.
  return warnings
}

export function getBillOfMaterials(project, products) {
  const catalog = productMap(products)
  const rows = new Map()
  const multiplier = project.type === 'fence' ? project.sections : 1
  for (const item of project.items) {
    const sourceProduct = catalog.get(item.productId)
    if (!sourceProduct) continue
    const product = resolveItemProduct(item, sourceProduct)
    const key = `${product.id}:${product.widthMm}x${product.heightMm}`
    const saleUnit = product.saleUnit === 'pair' ? 'pair' : 'piece'
    const row = rows.get(key) || { key, product, quantity: 0, saleUnit }
    row.quantity += multiplier
    rows.set(key, row)
  }
  const quantitiesBySku = new Map()
  for (const row of rows.values())
    quantitiesBySku.set(row.product.id, (quantitiesBySku.get(row.product.id) || 0) + row.quantity)
  const orderedSkus = new Set()
  return [...rows.values()].map((row) => {
    const skuQuantity = quantitiesBySku.get(row.product.id)
    const piecesPerSaleUnit = row.saleUnit === 'pair' ? row.product.piecesPerSaleUnit || 2 : 1
    const firstRow = !orderedSkus.has(row.product.id)
    const orderQuantity =
      row.saleUnit === 'pair' ? (firstRow ? Math.ceil(skuQuantity / piecesPerSaleUnit) : null) : row.quantity
    const spareQuantity =
      row.saleUnit === 'pair' ? (firstRow ? orderQuantity * piecesPerSaleUnit - skuQuantity : null) : 0
    orderedSkus.add(row.product.id)
    return { ...row, skuQuantity, piecesPerSaleUnit, orderQuantity, spareQuantity }
  })
}

function assertNumber(value, minimum, maximum, name, integer = false) {
  if (!Number.isFinite(value) || value < minimum || value > maximum || (integer && !Number.isInteger(value))) {
    throw new Error(`${name}: укажите ${integer ? 'целое ' : ''}число от ${minimum} до ${maximum}.`)
  }
  return value
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function itemMetadata(item, label) {
  const metadata = {}
  if (Object.hasOwn(item, 'groupId')) {
    if (typeof item.groupId !== 'string' || !item.groupId.trim() || item.groupId.length > 100)
      throw new Error(`${label}: некорректный идентификатор группы.`)
    metadata.groupId = item.groupId
  }
  if (Object.hasOwn(item, 'locked')) {
    if (typeof item.locked !== 'boolean') throw new Error(`${label}: некорректное закрепление детали.`)
    metadata.locked = item.locked
  }
  return metadata
}

export function normalizeProject(raw, products) {
  if (!isRecord(raw) || raw.version !== 1)
    throw new Error('Файл не является проектом конструктора поддерживаемой версии.')
  if (typeof raw.type !== 'string' || !Object.hasOwn(TEMPLATES, raw.type)) {
    throw new Error('В проекте не указан поддерживаемый тип конструкции.')
  }
  const project = createProject(raw.type)
  const limits = PROJECT_LIMITS
  project.width = assertNumber(raw.width, limits.minWidth, limits.maxWidth, 'Ширина')
  project.height = assertNumber(raw.height, limits.minHeight, limits.maxHeight, 'Высота')
  project.sections = assertNumber(
    raw.sections,
    1,
    raw.type === 'fence' ? limits.maxSections : 1,
    'Количество секций',
    true
  )
  if (Object.hasOwn(raw, 'alignmentInsetMm')) {
    project.alignmentInsetMm = assertNumber(raw.alignmentInsetMm, 0, 1000, 'Отступ при выравнивании')
  }
  if (Object.hasOwn(raw, 'cornerInsetMm')) {
    project.cornerInsetMm = assertNumber(raw.cornerInsetMm, 0, 1000, 'Отступ уголков')
  }
  if (Object.hasOwn(raw, 'comment')) {
    if (typeof raw.comment !== 'string' || raw.comment.length > 2000)
      throw new Error('Комментарий должен быть текстом длиной не более 2000 символов.')
    project.comment = raw.comment
  }
  if (!Array.isArray(raw.items) || raw.items.length > limits.maxItems) {
    throw new Error(`Проект должен содержать список не более чем из ${limits.maxItems} элементов.`)
  }
  const catalog = productMap(products)
  if (Object.hasOwn(raw, 'discussionItems')) {
    if (
      !Array.isArray(raw.discussionItems) ||
      raw.discussionItems.length > 172 ||
      new Set(raw.discussionItems).size !== raw.discussionItems.length ||
      raw.discussionItems.some((id) => !Number.isInteger(id) || !catalog.has(id))
    )
      throw new Error('Список для обсуждения должен содержать уникальные артикулы доступного каталога.')
    project.discussionItems = [...raw.discussionItems]
  }
  const usedIds = new Set()
  project.items = raw.items.map((item, index) => {
    const label = `Элемент ${index + 1}`
    if (
      !isRecord(item) ||
      typeof item.id !== 'string' ||
      !item.id.trim() ||
      item.id.length > 100 ||
      usedIds.has(item.id)
    ) {
      throw new Error(`${label}: отсутствует уникальный идентификатор.`)
    }
    usedIds.add(item.id)
    const product = catalog.get(item.productId)
    if (!Number.isInteger(item.productId) || !product) {
      throw new Error(`${label}: товар отсутствует в доступном каталоге.`)
    }
    const effective = resolveItemProduct(item, product)
    if (typeof item.flipX !== 'boolean') throw new Error(`${label}: некорректное значение отражения.`)
    return {
      id: item.id,
      productId: item.productId,
      x: assertNumber(item.x, -limits.maxCoordinate, limits.maxCoordinate, `${label}, X`),
      y: assertNumber(item.y, -limits.maxCoordinate, limits.maxCoordinate, `${label}, Y`),
      rotation: assertNumber(item.rotation, -36000, 36000, `${label}, поворот`),
      flipX: item.flipX,
      ...itemMetadata(item, label),
      ...(product.requiresDimensions
        ? { dimensions: { widthMm: effective.widthMm, heightMm: effective.heightMm } }
        : {}),
    }
  })
  return project
}

export function buildProjectText(project, products) {
  const template = TEMPLATES[project.type]
  const rows = getBillOfMaterials(project, products)
  const lines = [
    'Подборка элементов ковки',
    `Основа: ${template?.label || 'Конструкция'}`,
    `Размер${project.type === 'fence' ? ' одной секции' : ''}: ${project.width} × ${project.height} мм`,
  ]
  if (project.type === 'fence') lines.push(`Одинаковых секций: ${project.sections}`)
  lines.push('', 'Комплектация:')
  if (!rows.length) lines.push('Элементы пока не добавлены.')
  for (const { product, quantity } of rows) {
    const sizeNote = product.requiresDimensions ? ' (размер одной детали указан вручную)' : ''
    lines.push(
      `• ${product.name} (арт. ${product.id}), ${product.widthMm} × ${product.heightMm} мм${sizeNote} — ${quantity} шт.`
    )
  }
  const pairOrders = rows.filter((row) => row.saleUnit === 'pair' && row.orderQuantity !== null)
  if (pairOrders.length) lines.push('', 'К покупке парами:')
  for (const { product, orderQuantity, spareQuantity, skuQuantity } of pairOrders) {
    const pairUnit =
      orderQuantity % 100 >= 11 && orderQuantity % 100 <= 14
        ? 'пар'
        : orderQuantity % 10 === 1
          ? 'пара'
          : [2, 3, 4].includes(orderQuantity % 10)
            ? 'пары'
            : 'пар'
    const spareNote = spareQuantity > 0 ? `; запас ${spareQuantity} шт.` : ''
    lines.push(`• Арт. ${product.id} — ${orderQuantity} ${pairUnit} (${skuQuantity} шт. в подборе${spareNote}).`)
  }
  lines.push(
    '',
    'Каркас, крепёж, изготовление и монтаж не включены в комплектацию.',
    'Стоимость и наличие элементов уточняются при заказе.',
    'Эскиз для подбора: размеры деталей, крепления и возможность изготовления должен проверить мастер.'
  )
  return lines.join('\n')
}
