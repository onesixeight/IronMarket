import {
  createItem,
  getFramePanels,
  getItemBounds,
  mirrorItemInFrame,
  normalizeProject,
  PROJECT_LIMITS,
  resolveItemProduct,
} from './model.js'
import {
  GEOMETRY_EPSILON as EPSILON,
  roundCoordinate as rounded,
  boundsOverlap as overlaps,
  isCornerProduct as isCorner,
} from './geometry.js'

const close = (a, b) => Math.abs(a - b) <= EPSILON
const cloneItems = (items) =>
  items.map((item) => ({ ...item, ...(item.dimensions ? { dimensions: { ...item.dimensions } } : {}) }))
const normalizedAngle = (value) => ((value % 360) + 360) % 360
const sameAngle = (a, b) => {
  const difference = Math.abs(normalizedAngle(a) - normalizedAngle(b))
  return Math.min(difference, 360 - difference) <= EPSILON
}

function independentCopy(item) {
  const copy = { ...item }
  delete copy.groupId
  delete copy.locked
  return copy
}

function samePlacement(a, b, product) {
  if (
    a.productId !== b.productId ||
    a.flipX !== b.flipX ||
    !sameAngle(a.rotation, b.rotation) ||
    !close(a.x, b.x) ||
    !close(a.y, b.y)
  )
    return false
  const first = resolveItemProduct(a, product)
  const second = resolveItemProduct(b, product)
  return close(first.widthMm, second.widthMm) && close(first.heightMm, second.heightMm)
}

function sameSize(a, b, product) {
  if (a.productId !== b.productId) return false
  const first = resolveItemProduct(a, product)
  const second = resolveItemProduct(b, product)
  return close(first.widthMm, second.widthMm) && close(first.heightMm, second.heightMm)
}

const quadrant = (item, panel) =>
  `${item.y <= panel.centerY ? 'top' : 'bottom'}-${item.x <= panel.centerX ? 'left' : 'right'}`
const nearestPanel = (item, panels) =>
  panels.reduce((nearest, panel) =>
    Math.abs(item.x - panel.centerX) < Math.abs(item.x - nearest.centerX) ? panel : nearest
  )

function makeTargets(source, product, project, panels, sourcePanel, scope) {
  const knownAnchor = ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(product.cornerAnchor)
  const anchor = knownAnchor ? product.cornerAnchor : quadrant(source, sourcePanel)
  const basis = { ...source, ...(knownAnchor ? { rotation: 0, flipX: false } : {}) }
  const bounds = getItemBounds(basis, product)
  if (bounds.width > sourcePanel.width + EPSILON || bounds.height > sourcePanel.height + EPSILON) return null
  const base = independentCopy(
    createItem(product, project, {
      ...basis,
      x: rounded(anchor.endsWith('left') ? sourcePanel.left + bounds.width / 2 : sourcePanel.right - bounds.width / 2),
      y: rounded(
        anchor.startsWith('top') ? sourcePanel.top + bounds.height / 2 : sourcePanel.bottom - bounds.height / 2
      ),
    })
  )
  const targets = [
    base,
    ...['horizontal', 'vertical', 'diagonal'].map((axis) =>
      independentCopy(mirrorItemInFrame(base, project, { axis, scope: 'panel' }))
    ),
  ]
  if (scope === 'all-panels' && panels.length > 1)
    targets.push(
      ...targets.map((item) =>
        independentCopy(mirrorItemInFrame(item, project, { axis: 'horizontal', scope: 'project' }))
      )
    )
  return targets
    .map((item) => {
      const panel = nearestPanel(item, panels)
      return { item, panel, quadrant: quadrant(item, panel) }
    })
    .sort((a, b) => a.panel.index - b.panel.index || a.item.y - b.item.y || a.item.x - b.item.x)
}

function occupiesCorner(item, product, target) {
  const panel = target.panel
  if (quadrant(item, panel) !== target.quadrant) return false
  if (Math.abs(item.x - panel.centerX) < panel.width * 0.15 || Math.abs(item.y - panel.centerY) < panel.height * 0.15)
    return false
  const bounds = getItemBounds(item, product)
  const horizontal = target.quadrant.endsWith('left')
    ? Math.abs(bounds.left - panel.left)
    : Math.abs(bounds.right - panel.right)
  const vertical = target.quadrant.startsWith('top')
    ? Math.abs(bounds.top - panel.top)
    : Math.abs(bounds.bottom - panel.bottom)
  return (
    horizontal <= Math.max(80, Math.min(200, panel.width * 0.15)) &&
    vertical <= Math.max(80, Math.min(200, panel.height * 0.15))
  )
}

// There are at most eight slots. A small assignment search keeps existing
// corners near their current places, while always using the selected source.
function assignExisting(candidates, targets, sourceId) {
  const ordered = [...candidates].sort((a, b) => Number(b.id === sourceId) - Number(a.id === sourceId))
  let states = new Map([[0, { cost: 0, pairs: [] }]])
  for (const item of ordered) {
    const next = item.id === sourceId ? new Map() : new Map(states)
    for (const [mask, state] of states) {
      targets.forEach((target, index) => {
        const bit = 1 << index
        if (mask & bit) return
        const cost = state.cost + (item.x - target.item.x) ** 2 + (item.y - target.item.y) ** 2
        const key = mask | bit
        if (!next.has(key) || cost < next.get(key).cost)
          next.set(key, { cost, pairs: [...state.pairs, { item, target }] })
      })
    }
    states = next
  }
  return [...states.values()].sort((a, b) => b.pairs.length - a.pairs.length || a.cost - b.cost)[0]?.pairs || []
}

/** Propose four mirrored corner placements per target panel, without changing the project. */
export function proposeCornerSet(project, products, { sourceId, scope = 'panel', insetMm = 20 } = {}) {
  const original = Array.isArray(project?.items) ? cloneItems(project.items) : []
  const fail = (id, message) => ({
    items: cloneItems(original),
    addedCount: 0,
    movedCount: 0,
    changed: false,
    issues: [{ id, message, blocking: true }],
    canApply: false,
  })
  if (!['panel', 'all-panels'].includes(scope)) return fail('scope', 'Выберите текущую створку или все створки.')
  if (!Number.isFinite(insetMm) || insetMm < 0 || insetMm > 1000)
    return fail('inset', 'Отступ должен быть числом от 0 до 1000 мм.')
  let normalized
  let panels
  try {
    normalized = normalizeProject(project, products)
    panels = getFramePanels(normalized, { inner: true, insetMm })
  } catch (error) {
    return fail('project', error.message)
  }
  const catalog = new Map(products.map((product) => [product.id, product]))
  const sourceIndex = normalized.items.findIndex((item) => item.id === sourceId)
  if (sourceIndex < 0) return fail('source', 'Сначала выберите уголок на рисунке.')
  const source = normalized.items[sourceIndex]
  const product = catalog.get(source.productId)
  if (!isCorner(product)) return fail('corner', 'Эта команда подходит для уголков. Выберите уголок на рисунке.')
  if (source.groupId && normalized.items.filter((item) => item.groupId === source.groupId).length > 1)
    return fail('group', 'Выбранный уголок входит в составной узор. Сначала отделите его от группы.')

  const panel = nearestPanel(source, panels)
  const targets = makeTargets(source, product, normalized, panels, panel, scope)
  if (!targets)
    return fail(
      'size',
      'Уголок не помещается в створке с выбранным отступом. Уменьшите отступ или выберите другой размер.'
    )
  const targetPanels = new Set(targets.map((target) => target.panel.index))
  const outerPanels = getFramePanels(normalized)
  const inScope = (item) => {
    if (item.id === sourceId) return true
    const outer = nearestPanel(item, outerPanels)
    return (
      targetPanels.has(outer.index) &&
      item.x >= outer.left &&
      item.x <= outer.right &&
      item.y >= outer.top &&
      item.y <= outer.bottom
    )
  }
  const groupCounts = new Map()
  normalized.items.forEach((item) => {
    if (item.groupId) groupCounts.set(item.groupId, (groupCounts.get(item.groupId) || 0) + 1)
  })
  const grouped = (item) => item.groupId && groupCounts.get(item.groupId) > 1
  const compatible = normalized.items.filter((item) => inScope(item) && sameSize(item, source, product))
  const assignments = new Map()
  const usedIds = new Set()
  const occupied = new Set()
  // Exact existing placements are authoritative and retain their IDs and raw
  // transform values, including harmless angle/coordinate rounding differences.
  for (const item of [source, ...compatible.filter((item) => item.id !== sourceId)]) {
    const target = targets.find((entry) => !assignments.has(entry) && samePlacement(item, entry.item, product))
    if (target) {
      assignments.set(target, item)
      usedIds.add(item.id)
    }
  }
  for (const item of normalized.items.filter((item) => inScope(item) && item.productId !== source.productId)) {
    const otherProduct = catalog.get(item.productId)
    if (!isCorner(otherProduct)) continue
    const target = targets.find(
      (entry) =>
        !assignments.has(entry) &&
        entry.panel.index === nearestPanel(item, panels).index &&
        occupiesCorner(item, otherProduct, entry)
    )
    if (target) occupied.add(target)
  }
  const available = targets.filter((target) => !assignments.has(target) && !occupied.has(target))
  if (!usedIds.has(sourceId) && !available.length)
    return fail(
      'occupied',
      'Все целевые углы уже заняты. Уберите лишний уголок из середины или выберите одну из деталей в углах.'
    )
  for (const item of compatible.filter((entry) => !usedIds.has(entry.id) && (entry.locked || grouped(entry)))) {
    if (item.id === sourceId || available.some((target) => occupiesCorner(item, product, target)))
      return fail(
        item.locked ? 'locked' : 'group',
        item.locked
          ? 'Один из уголков закреплён. Снимите закрепление, чтобы выровнять его и заполнить недостающие углы.'
          : 'Один из уголков входит в составной узор. Сначала отделите его от группы или освободите этот угол.'
      )
  }
  const candidates = compatible.filter((item) => !usedIds.has(item.id) && !item.locked && !grouped(item))
  for (const { item, target } of assignExisting(candidates, available, usedIds.has(sourceId) ? null : sourceId)) {
    assignments.set(target, item)
    usedIds.add(item.id)
  }
  const items = cloneItems(normalized.items)
  const affectedIds = new Set()
  let addedCount = 0
  let movedCount = 0
  for (const target of targets) {
    if (occupied.has(target)) continue
    const existing = assignments.get(target)
    if (!existing) {
      items.push(target.item)
      affectedIds.add(target.item.id)
      addedCount++
      continue
    }
    if (samePlacement(existing, target.item, product)) continue
    if (existing.locked || grouped(existing))
      return fail(
        existing.locked ? 'locked' : 'group',
        'Уголок закреплён или входит в группу. Освободите его перед расстановкой.'
      )
    const item = items.find((entry) => entry.id === existing.id)
    item.x = close(item.x, target.item.x) ? item.x : target.item.x
    item.y = close(item.y, target.item.y) ? item.y : target.item.y
    item.rotation = sameAngle(item.rotation, target.item.rotation) ? item.rotation : target.item.rotation
    item.flipX = target.item.flipX
    affectedIds.add(item.id)
    movedCount++
  }
  if (items.length > PROJECT_LIMITS.maxItems)
    return fail(
      'limit',
      `После расстановки получится ${items.length} деталей. В одном проекте допускается не более ${PROJECT_LIMITS.maxItems}.`
    )

  const entries = items.map((item) => ({ item, bounds: getItemBounds(item, catalog.get(item.productId)) }))
  for (const { bounds: placedBounds } of entries.filter(({ item }) => affectedIds.has(item.id))) {
    const targetPanel = panels.find(
      (candidate) =>
        placedBounds.left >= candidate.left - EPSILON &&
        placedBounds.right <= candidate.right + EPSILON &&
        placedBounds.top >= candidate.top - EPSILON &&
        placedBounds.bottom <= candidate.bottom + EPSILON
    )
    if (!targetPanel)
      return fail(
        'bounds',
        'Один из уголков выходит за область с выбранным отступом. Увеличьте конструкцию или выберите меньший уголок.'
      )
  }
  for (let first = 0; first < entries.length; first++) {
    for (let second = first + 1; second < entries.length; second++) {
      const a = entries[first]
      const b = entries[second]
      if (!affectedIds.has(a.item.id) && !affectedIds.has(b.item.id)) continue
      if (!overlaps(a.bounds, b.bounds)) continue
      return fail(
        'overlap',
        'После расстановки уголки перекрывают друг друга или другой узор. Освободите углы, уменьшите отступ или выберите меньшие детали.'
      )
    }
  }
  return { items, addedCount, movedCount, changed: movedCount > 0 || addedCount > 0, issues: [], canApply: true }
}
