import { getFramePanels, getItemBounds, PROJECT_LIMITS, resolveItemProduct } from './model.js'
import { roundCoordinate as rounded, boundsOverlap, unionBounds, isCornerProduct } from './geometry.js'

export { proposeArrangement } from './arrangement.js'

const EPSILON = 0.000001
const CLEARANCE_MM = 10
const midpoint = (start, end) => (start + end) / 2
const rowTolerance = (minimumHeight) => Math.max(40, Math.min(200, minimumHeight * 0.4))
const rowSeparation = (a, b) =>
  Math.max((a.height + b.height) / 2 + CLEARANCE_MM, rowTolerance(Math.min(a.minimumHeight, b.minimumHeight)) + 1)
const overlaps = (a, b) => boundsOverlap(a, b, EPSILON)

function combineBounds(entries) {
  const { left, right, top, bottom } = unionBounds(entries.map((entry) => entry.bounds))
  return { left, right, top, bottom, width: right - left, height: bottom - top }
}

function cornerPosition(entry, area) {
  if (!isCornerProduct(entry.product)) return null
  const bounds = entry.bounds
  const left = Math.abs(bounds.left - area.left)
  const right = Math.abs(area.right - bounds.right)
  const top = Math.abs(bounds.top - area.top)
  const bottom = Math.abs(area.bottom - bounds.bottom)
  if (
    Math.min(left, right) > Math.max(80, area.width * 0.15) ||
    Math.min(top, bottom) > Math.max(80, area.height * 0.15)
  )
    return null
  if (Math.abs(left - right) < EPSILON || Math.abs(top - bottom) < EPSILON) {
    throw new Error('Положение уголка неоднозначно. Переместите его ближе к нужному углу и повторите выравнивание.')
  }
  return `${top < bottom ? 'top' : 'bottom'}-${left < right ? 'left' : 'right'}`
}

function translate(entry, dx, dy) {
  entry.item.x = rounded(entry.item.x + dx)
  entry.item.y = rounded(entry.item.y + dy)
  entry.bounds = getItemBounds(entry.item, entry.product)
}

function compoundGroups(entries) {
  const parents = entries.map((_, index) => index)
  const find = (index) => (parents[index] === index ? index : (parents[index] = find(parents[index])))
  for (let a = 0; a < entries.length; a++) {
    for (let b = a + 1; b < entries.length; b++) {
      // Repeated copies frequently overlap in a draft and still need spacing.
      // Different products that overlap form a composition whose shape is kept.
      if (entries[a].item.productId !== entries[b].item.productId && overlaps(entries[a].bounds, entries[b].bounds)) {
        parents[find(b)] = find(a)
      }
    }
  }
  const groups = new Map()
  entries.forEach((entry, index) => {
    const key = find(index)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(entry)
  })
  return [...groups.values()].map((members) => {
    const bounds = combineBounds(members)
    return {
      members,
      bounds,
      x: midpoint(bounds.left, bounds.right),
      y: midpoint(bounds.top, bounds.bottom),
      index: members[0].index,
    }
  })
}

function groupRows(groups) {
  const rows = []
  for (const group of [...groups].sort((a, b) => a.y - b.y || a.index - b.index)) {
    const last = rows.at(-1)
    const minimumHeight = last
      ? Math.min(group.bounds.height, ...last.groups.map((entry) => entry.bounds.height))
      : group.bounds.height
    const tolerance = rowTolerance(minimumHeight)
    if (last && group.y - last.groups[0].y <= tolerance) last.groups.push(group)
    else rows.push({ groups: [group] })
  }
  return rows.map((row) => ({
    groups: row.groups.sort((a, b) => a.x - b.x || a.index - b.index),
    height: Math.max(...row.groups.map((group) => group.bounds.height)),
    minimumHeight: Math.min(...row.groups.map((group) => group.bounds.height)),
    width: row.groups.reduce((sum, group) => sum + group.bounds.width, 0),
    preferredY: row.groups.reduce((sum, group) => sum + group.y, 0) / row.groups.length,
  }))
}

function horizontalSpace(row, y, corners, area) {
  let left = area.left
  let right = area.right
  for (const corner of corners) {
    if (
      corner.bounds.bottom + CLEARANCE_MM <= y - row.height / 2 + EPSILON ||
      corner.bounds.top - CLEARANCE_MM >= y + row.height / 2 - EPSILON
    )
      continue
    if (corner.corner.endsWith('left')) left = Math.max(left, corner.bounds.right + CLEARANCE_MM)
    else right = Math.min(right, corner.bounds.left - CLEARANCE_MM)
  }
  return { left, right }
}

function allowedHeights(row, corners, area) {
  const minimum = area.top + row.height / 2
  const maximum = area.bottom - row.height / 2
  if (minimum > maximum + EPSILON) return []
  const points = [minimum, maximum]
  for (const corner of corners) {
    for (const point of [
      corner.bounds.top - CLEARANCE_MM - row.height / 2,
      corner.bounds.bottom + CLEARANCE_MM + row.height / 2,
    ]) {
      if (point > minimum && point < maximum) points.push(point)
    }
  }
  const sorted = [...new Set(points)].sort((a, b) => a - b)
  const fits = (y) => {
    const space = horizontalSpace(row, y, corners, area)
    return space.right - space.left >= row.width - EPSILON
  }
  const intervals = []
  sorted.forEach((point, index) => {
    if (fits(point)) intervals.push({ min: point, max: point })
    const next = sorted[index + 1]
    if (next !== undefined && fits(midpoint(point, next))) intervals.push({ min: point, max: next })
  })
  const merged = []
  for (const interval of intervals.sort((a, b) => a.min - b.min)) {
    const last = merged.at(-1)
    if (last && interval.min <= last.max + EPSILON) last.max = Math.max(last.max, interval.max)
    else merged.push({ ...interval })
  }
  return merged
}

function nearestHeight(intervals, preferred, minimum = -Infinity, maximum = Infinity) {
  const candidates = intervals.flatMap((interval) => {
    const min = Math.max(minimum, interval.min)
    const max = Math.min(maximum, interval.max)
    return min <= max + EPSILON ? [Math.max(min, Math.min(max, preferred))] : []
  })
  return candidates.sort((a, b) => Math.abs(a - preferred) - Math.abs(b - preferred) || a - b)[0]
}

function arrangeRows(rows, corners, area) {
  const failure = () => {
    throw new Error(
      `В ${area.label} не хватает места для рядов и уголков. Увеличьте размеры, уменьшите отступ или разделите рисунок на ряды.`
    )
  }
  const nearCenter = (y) => Math.abs(y - area.centerY) <= Math.min(100, area.height * 0.08)
  rows.forEach((row) => {
    row.intervals = allowedHeights(row, corners, area)
    if (!row.intervals.length) failure()
    if (nearCenter(row.preferredY)) row.preferredY = area.centerY
  })
  let previous
  for (const row of rows) {
    const minimum = previous ? previous.earliest + rowSeparation(previous, row) : area.top
    row.earliest = nearestHeight(row.intervals, minimum, minimum)
    if (row.earliest === undefined) failure()
    previous = row
  }
  let next
  for (const row of [...rows].reverse()) {
    const maximum = next ? next.latest - rowSeparation(row, next) : area.bottom
    row.latest = nearestHeight(row.intervals, maximum, -Infinity, maximum)
    if (row.latest === undefined || row.latest < row.earliest - EPSILON) failure()
    next = row
  }
  // Packing can move another row into the center's snap range. Settle those
  // targets before moving pieces so repeating the action cannot pull it again.
  let newCenterTarget
  do {
    newCenterTarget = false
    previous = null
    for (const row of rows) {
      const minimum = previous ? previous.y + rowSeparation(previous, row) : row.earliest
      row.y = nearestHeight(row.intervals, row.preferredY, minimum, row.latest)
      if (row.y === undefined) failure()
      if (row.preferredY !== area.centerY && nearCenter(row.y)) {
        row.preferredY = area.centerY
        newCenterTarget = true
      }
      previous = row
    }
  } while (newCenterTarget)
  for (const row of rows) {
    const space = horizontalSpace(row, row.y, corners, area)
    const gap = row.groups.length > 1 ? (space.right - space.left - row.width) / (row.groups.length - 1) : 0
    let cursor = row.groups.length > 1 ? space.left : midpoint(space.left, space.right) - row.width / 2
    for (const group of row.groups) {
      const x = cursor + group.bounds.width / 2
      group.members.forEach((entry) => translate(entry, x - group.x, row.y - group.y))
      cursor += group.bounds.width + gap
    }
  }
}

export function alignProjectItems(project, products, { insetMm = 20 } = {}) {
  if (!Number.isFinite(insetMm) || insetMm < 0 || insetMm > 1000)
    throw new Error('Отступ должен быть числом от 0 до 1000 мм.')
  if (
    !project ||
    !['gates', 'wicket', 'fence'].includes(project.type) ||
    !Number.isFinite(project.width) ||
    !Number.isFinite(project.height) ||
    !Array.isArray(project.items)
  ) {
    throw new Error('Для выравнивания нужен корректный проект с размерами конструкции.')
  }
  const catalog = new Map(products.map((product) => [product.id, product]))
  const items = project.items.map((item) => ({
    ...item,
    ...(item.dimensions ? { dimensions: { ...item.dimensions } } : {}),
  }))
  const entries = items.map((item, index) => {
    if (![item.x, item.y, item.rotation].every(Number.isFinite))
      throw new Error('У детали указано некорректное положение. Исправьте координаты перед выравниванием.')
    const product = resolveItemProduct(item, catalog.get(item.productId))
    return { item, product, index, bounds: getItemBounds(item, product) }
  })
  const gap = PROJECT_LIMITS.gateGapMm
  const half = project.width / 2
  if (project.type === 'gates' && entries.some((entry) => Math.abs(entry.item.x - half) < gap / 2)) {
    throw new Error('Деталь находится на стыке створок. Переместите её на нужную створку перед выравниванием.')
  }
  const frames = getFramePanels(project, { inner: true, insetMm }).map((frame) => ({
    ...frame,
    label:
      project.type === 'gates'
        ? frame.index === 0
          ? 'левой створке'
          : 'правой створке'
        : project.type === 'wicket'
          ? 'калитке'
          : 'секции забора',
  }))
  const summary = { corners: 0, rows: 0, groups: 0 }
  for (const [panelIndex, frame] of frames.entries()) {
    const area = frame
    const panel = entries.filter((entry) => frames.length === 1 || (entry.item.x < half ? 0 : 1) === panelIndex)
    if (!panel.length) continue
    const corners = []
    const remaining = []
    const occupiedCorners = new Set()
    for (const entry of panel) {
      entry.corner = cornerPosition(entry, area)
      if (!entry.corner) {
        remaining.push(entry)
        continue
      }
      if (occupiedCorners.has(entry.corner))
        throw new Error(
          `В одном углу ${area.label} несколько уголков. Разнесите их по разным углам и повторите выравнивание.`
        )
      if (entry.bounds.width > area.width || entry.bounds.height > area.height)
        throw new Error(`Уголок не помещается в ${area.label} с выбранным отступом.`)
      occupiedCorners.add(entry.corner)
      const left = entry.corner.endsWith('left') ? area.left : area.right - entry.bounds.width
      const top = entry.corner.startsWith('top') ? area.top : area.bottom - entry.bounds.height
      translate(entry, left - entry.bounds.left, top - entry.bounds.top)
      corners.push(entry)
    }
    if (
      corners.some((corner, index) => corners.slice(index + 1).some((other) => overlaps(corner.bounds, other.bounds)))
    ) {
      throw new Error(`Уголки перекрываются в ${area.label}. Увеличьте конструкцию или уменьшите количество уголков.`)
    }
    const groups = compoundGroups(remaining)
    const rows = groupRows(groups)
    arrangeRows(rows, corners, area)
    if (panel.some((entry) => cornerPosition(entry, area) !== entry.corner)) {
      throw new Error(
        'Положение уголка в составе рисунка неоднозначно. Разместите его ближе к выбранному углу или отдельно от края.'
      )
    }
    summary.corners += corners.length
    summary.rows += rows.length
    summary.groups += groups.filter((group) => group.members.length > 1).length
  }
  let changed = false
  items.forEach((item, index) => {
    for (const axis of ['x', 'y']) {
      if (Math.abs(item[axis] - project.items[index][axis]) <= EPSILON * 10) item[axis] = project.items[index][axis]
      else changed = true
    }
  })
  return { items, changed, summary }
}
