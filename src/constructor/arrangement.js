import { getFramePanels, getItemBounds, normalizeProject } from './model.js'
import {
  GEOMETRY_EPSILON as EPSILON,
  roundCoordinate as rounded,
  boundsOverlap as intersects,
  unionBounds,
  isCornerProduct as isCorner,
} from './geometry.js'

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2
}
const tolerance = (size) => Math.max(40, Math.min(200, size * 0.4))
const opposite = (axis) => (axis === 'x' ? 'y' : 'x')
const sizeKey = (axis) => (axis === 'x' ? 'width' : 'height')
const startKey = (axis) => (axis === 'x' ? 'left' : 'top')
const endKey = (axis) => (axis === 'x' ? 'right' : 'bottom')
function union(bounds) {
  const { left, right, top, bottom } = unionBounds(bounds)
  return { left, right, top, bottom, width: right - left, height: bottom - top }
}

function panelBounds(project, panel) {
  return getFramePanels(project, { inner: true })[panel]
}

function makeNodes(project, catalog) {
  const groups = new Map()
  project.items.forEach((item, index) => {
    const key = item.groupId ? `group:${item.groupId}` : `item:${item.id}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push({
      item,
      index,
      product: catalog.get(item.productId),
      bounds: getItemBounds(item, catalog.get(item.productId)),
    })
  })
  return [...groups.entries()].map(([key, members]) => {
    const bounds = union(members.map((entry) => entry.bounds))
    const panels = new Set(
      members.map(({ item }) => (project.type === 'gates' ? (item.x < project.width / 2 ? 0 : 1) : 0))
    )
    return {
      key,
      members,
      bounds,
      x: (bounds.left + bounds.right) / 2,
      y: (bounds.top + bounds.bottom) / 2,
      panel: panels.size === 1 ? [...panels][0] : -1,
      locked: members.some(({ item }) => item.locked),
      corner: members.length === 1 && isCorner(members[0].product),
    }
  })
}

function bands(nodes, coordinate) {
  const result = []
  for (const node of [...nodes].sort((a, b) => a[coordinate] - b[coordinate] || a.key.localeCompare(b.key))) {
    const last = result.at(-1)
    const limit = tolerance(
      Math.min(node.bounds[sizeKey(coordinate)], ...(last || []).map((entry) => entry.bounds[sizeKey(coordinate)]))
    )
    if (last && node[coordinate] - last[0][coordinate] <= limit + EPSILON) last.push(node)
    else result.push([node])
  }
  return result
}

function directional(nodes, axis) {
  if (nodes.length < 2) return false
  const cross = opposite(axis)
  const spread = (coordinate) =>
    Math.max(...nodes.map((node) => node[coordinate])) - Math.min(...nodes.map((node) => node[coordinate]))
  return spread(axis) > EPSILON && spread(axis) + EPSILON >= spread(cross) * 3
}

function gridDefinition(nodes) {
  const rows = bands(nodes, 'y')
  const columns = bands(nodes, 'x')
  if (rows.length < 2 || columns.length < 2 || rows.length * columns.length !== nodes.length) return null
  if (!rows.every((row) => directional(row, 'x')) || !columns.every((column) => directional(column, 'y'))) return null
  const cells = new Set()
  for (const node of nodes) {
    const key = `${rows.findIndex((row) => row.includes(node))}:${columns.findIndex((column) => column.includes(node))}`
    if (cells.has(key)) return null
    cells.add(key)
  }
  const uniform = nodes.every(
    (node) =>
      Math.abs(node.bounds.width - nodes[0].bounds.width) <= EPSILON &&
      Math.abs(node.bounds.height - nodes[0].bounds.height) <= EPSILON
  )
  return { rows, columns, uniform }
}

function descriptor(nodes, kind, axis, reason) {
  const itemIds = nodes.flatMap((node) => node.members.map(({ item }) => item.id))
  return { id: `set:${[...itemIds].sort().join('|')}`, nodes, kind, axis, reason }
}

function components(nodes, connected) {
  const pending = new Set(nodes)
  const result = []
  while (pending.size) {
    const group = [pending.values().next().value]
    pending.delete(group[0])
    for (let index = 0; index < group.length; index++) {
      for (const node of pending) {
        if (connected(group[index], node)) {
          group.push(node)
          pending.delete(node)
        }
      }
    }
    result.push(group)
  }
  return result
}

function detectSets(nodes) {
  const result = []
  const compounds = components(nodes, (a, b) => {
    const sameProduct =
      a.members.length === 1 && b.members.length === 1 && a.members[0].item.productId === b.members[0].item.productId
    return !sameProduct && intersects(a.bounds, b.bounds)
  })
  const remaining = []
  for (const group of compounds) {
    if (group.length > 1) result.push(descriptor(group, 'ambiguous', null, 'overlap'))
    else remaining.push(group[0])
  }
  const grid = gridDefinition(remaining)
  if (grid)
    return [
      ...result,
      descriptor(
        remaining,
        grid.uniform ? 'grid' : 'ambiguous',
        grid.uniform ? 'both' : null,
        grid.uniform ? undefined : 'mixed-grid'
      ),
    ]

  const candidates = [
    ...bands(remaining, 'y')
      .filter((group) => directional(group, 'x'))
      .map((group) => descriptor(group, 'row', 'x')),
    ...bands(remaining, 'x')
      .filter((group) => directional(group, 'y'))
      .map((group) => descriptor(group, 'column', 'y')),
  ]
  const candidateComponents = components(candidates, (a, b) => a.nodes.some((node) => b.nodes.includes(node)))
  const used = new Set()
  for (const component of candidateComponents) {
    const members = [...new Set(component.flatMap((set) => set.nodes))]
    members.forEach((node) => used.add(node))
    result.push(component.length === 1 ? component[0] : descriptor(members, 'ambiguous', null, 'direction'))
  }
  const leftovers = remaining.filter((node) => !used.has(node))
  if (leftovers.length > 1) result.push(descriptor(leftovers, 'ambiguous', null, 'direction'))
  return result
}

function lineArrangement(nodes, axis) {
  const ordered = [...nodes].sort((a, b) => a[axis] - b[axis] || a.key.localeCompare(b.key))
  if (ordered.length < 2) return { moves: new Map(), guides: [] }
  const cross = opposite(axis)
  const first = ordered[0].bounds[startKey(axis)]
  const last = ordered.at(-1).bounds[endKey(axis)]
  const total = ordered.reduce((sum, node) => sum + node.bounds[sizeKey(axis)], 0)
  const gap = (last - first - total) / (ordered.length - 1)
  if (gap < -EPSILON)
    return {
      error: 'space',
      message: `Между крайними деталями не хватает ${Math.ceil(total - (last - first))} мм. Раздвиньте их или уберите одну деталь.`,
    }
  const crossPosition = median(ordered.map((node) => node[cross]))
  const moves = new Map()
  let cursor = first
  for (const [index, node] of ordered.entries()) {
    const position = index === 0 || index === ordered.length - 1 ? node[axis] : cursor + node.bounds[sizeKey(axis)] / 2
    moves.set(node.key, { [axis]: position - node[axis], [cross]: crossPosition - node[cross] })
    cursor += node.bounds[sizeKey(axis)] + Math.max(0, gap)
  }
  const guides = [{ axis: cross, value: crossPosition, from: first, to: last }]
  if (ordered.length > 1) {
    const a = first + ordered[0].bounds[sizeKey(axis)]
    const b = a + Math.max(0, gap)
    guides.push(
      axis === 'x'
        ? { x1: a, y1: crossPosition, x2: b, y2: crossPosition, label: `${Math.round(Math.max(0, gap))} мм` }
        : { x1: crossPosition, y1: a, x2: crossPosition, y2: b, label: `${Math.round(Math.max(0, gap))} мм` }
    )
  }
  return { moves, guides, gapMm: rounded(Math.max(0, gap)) }
}

function gridArrangement(nodes) {
  const grid = gridDefinition(nodes)
  if (!grid?.uniform)
    return {
      error: 'grid',
      message:
        'Для общей сетки нужны одинаковые габариты и по одной детали в каждой ячейке. Выберите ряды или колонки.',
    }
  const bounds = union(nodes.map((node) => node.bounds))
  const width = nodes[0].bounds.width
  const height = nodes[0].bounds.height
  const gapX = (bounds.width - grid.columns.length * width) / (grid.columns.length - 1)
  const gapY = (bounds.height - grid.rows.length * height) / (grid.rows.length - 1)
  if (gapX < -EPSILON || gapY < -EPSILON)
    return { error: 'space', message: 'В исходной области не хватает места для сетки. Раздвиньте крайние детали.' }
  const moves = new Map()
  const guides = []
  grid.rows.forEach((row, rowIndex) => {
    const y = bounds.top + height / 2 + rowIndex * (height + Math.max(0, gapY))
    guides.push({ axis: 'y', value: y, from: bounds.left, to: bounds.right })
    row.forEach((node) => {
      const columnIndex = grid.columns.findIndex((column) => column.includes(node))
      const x = bounds.left + width / 2 + columnIndex * (width + Math.max(0, gapX))
      moves.set(node.key, { x: x - node.x, y: y - node.y })
    })
  })
  return {
    moves,
    guides,
    rows: grid.rows.length,
    columns: grid.columns.length,
    gapX: rounded(Math.max(0, gapX)),
    gapY: rounded(Math.max(0, gapY)),
  }
}

function parallelLinesArrangement(nodes, axis) {
  const moves = new Map()
  const guides = []
  const lines = bands(nodes, opposite(axis))
  for (const line of lines) {
    const result = lineArrangement(line, axis)
    if (result.error) return result
    result.moves.forEach((delta, key) => moves.set(key, delta))
    guides.push(...result.guides)
  }
  return { moves, guides, [axis === 'x' ? 'rows' : 'columns']: lines.length }
}

function cornerArrangement(nodes, frame, insetMm) {
  const area = {
    left: frame.left + insetMm,
    right: frame.right - insetMm,
    top: frame.top + insetMm,
    bottom: frame.bottom - insetMm,
  }
  const occupied = new Set()
  const moves = new Map()
  for (const node of nodes) {
    if (!node.corner)
      return { error: 'corner-group', message: 'Выберите отдельные уголки. Составной узор перемещается целиком.' }
    const left = Math.abs(node.bounds.left - area.left)
    const right = Math.abs(node.bounds.right - area.right)
    const top = Math.abs(node.bounds.top - area.top)
    const bottom = Math.abs(node.bounds.bottom - area.bottom)
    if (Math.abs(left - right) < EPSILON || Math.abs(top - bottom) < EPSILON)
      return {
        error: 'corner-direction',
        message: 'Переместите уголок ближе к нужному углу: сейчас направление неоднозначно.',
      }
    const target = `${left < right}:${top < bottom}`
    if (occupied.has(target))
      return {
        error: 'corner-duplicate',
        message: 'В один угол попадают несколько уголков. Разнесите их или исключите лишний.',
      }
    occupied.add(target)
    const x = left < right ? area.left + node.bounds.width / 2 : area.right - node.bounds.width / 2
    const y = top < bottom ? area.top + node.bounds.height / 2 : area.bottom - node.bounds.height / 2
    moves.set(node.key, { x: x - node.x, y: y - node.y })
  }
  return { moves, guides: [] }
}

function centerArrangement(nodes, frame, axis) {
  const bounds = union(nodes.map((node) => node.bounds))
  const dx = axis === 'y' ? 0 : (frame.left + frame.right - bounds.left - bounds.right) / 2
  const dy = axis === 'x' ? 0 : (frame.top + frame.bottom - bounds.top - bounds.bottom) / 2
  return {
    moves: new Map(nodes.map((node) => [node.key, { x: dx, y: dy }])),
    guides: [
      ...(axis !== 'y'
        ? [{ axis: 'x', value: (frame.left + frame.right) / 2, from: frame.top, to: frame.bottom }]
        : []),
      ...(axis !== 'x'
        ? [{ axis: 'y', value: (frame.top + frame.bottom) / 2, from: frame.left, to: frame.right }]
        : []),
    ],
  }
}

const labels = {
  row: 'Ряд',
  column: 'Колонка',
  grid: 'Сетка',
  corners: 'Уголки',
  center: 'По центру',
  ambiguous: 'Выберите направление',
}

/** Build a reversible preview. Callers must check canApply before committing items. */
export function proposeArrangement(project, products, options = {}) {
  const mode = options.mode ?? 'auto'
  const axis = options.axis ?? (mode === 'center' ? 'both' : 'x')
  const insetMm = options.insetMm ?? 20
  if (!['auto', 'distribute', 'corners', 'center'].includes(mode) || !['x', 'y', 'both'].includes(axis))
    throw new Error('Выберите корректное действие и направление выравнивания.')
  if (!Number.isFinite(insetMm) || insetMm < 0 || insetMm > 1000)
    throw new Error('Отступ должен быть числом от 0 до 1000 мм.')
  const normalized = normalizeProject(project, products)
  const items = normalized.items
  const catalog = new Map(products.map((product) => [product.id, product]))
  const allNodes = makeNodes(normalized, catalog)
  const byId = new Map(allNodes.flatMap((node) => node.members.map(({ item }) => [item.id, node])))
  const resolveIds = (ids) => {
    if (
      !Array.isArray(ids) ||
      ids.some((id) => typeof id !== 'string' || !byId.has(id)) ||
      new Set(ids).size !== ids.length
    )
      throw new Error('Выберите существующие детали без повторов.')
    return [...new Set(ids.map((id) => byId.get(id)))]
  }
  const chosen = options.ids === undefined ? allNodes : resolveIds(options.ids)
  const descriptors = []
  for (const panel of [-1, 0, 1]) {
    let nodes = chosen.filter((node) => node.panel === panel)
    if (!nodes.length) continue
    if (panel === -1) {
      descriptors.push(descriptor(nodes, 'ambiguous', null, 'cross-panel'))
      continue
    }
    if (mode === 'auto') {
      nodes = nodes.filter((node) => !node.corner)
      if (nodes.length) descriptors.push(...detectSets(nodes))
    } else if (mode === 'corners') {
      nodes = nodes.filter((node) => node.corner)
      if (nodes.length) descriptors.push(descriptor(nodes, 'corners', 'both'))
    } else
      descriptors.push(
        descriptor(
          nodes,
          mode === 'center' ? 'center' : axis === 'both' ? 'grid' : axis === 'x' ? 'row' : 'column',
          axis
        )
      )
  }
  if (options.overrides !== undefined && !Array.isArray(options.overrides))
    throw new Error('Некорректные настройки предпросмотра.')
  const overridden = new Set()
  const explicitMembership = new Map()
  for (const override of options.overrides || []) {
    const set = descriptors.find((entry) => entry.id === override?.setId)
    if (!set || overridden.has(set.id) || !['x', 'y', 'both', 'skip'].includes(override.axis))
      throw new Error('Набор для предпросмотра изменился. Откройте выравнивание заново.')
    overridden.add(set.id)
    if (override.itemIds !== undefined) {
      set.nodes = resolveIds(override.itemIds)
      for (const node of set.nodes) {
        if (explicitMembership.has(node.key) && explicitMembership.get(node.key) !== set.id)
          throw new Error('Одна деталь включена в несколько наборов. Уточните состав перед применением.')
        explicitMembership.set(node.key, set.id)
      }
      for (const other of descriptors)
        if (other !== set) other.nodes = other.nodes.filter((node) => !set.nodes.includes(node))
    }
    set.skip = override.axis === 'skip'
    if (!set.skip && !['corners', 'center'].includes(set.kind)) {
      set.parallelLines = (set.kind === 'grid' || set.reason === 'mixed-grid') && override.axis !== 'both'
      set.axis = override.axis
      set.kind = override.axis === 'both' ? 'grid' : override.axis === 'x' ? 'row' : 'column'
      set.reason = undefined
    }
  }
  const issues = []
  const sets = []
  const guides = []
  const changedNodes = new Map()
  const addIssue = (set, kind, message, itemIds = set.itemIds) => {
    if (!issues.some((issue) => issue.setId === set.id && issue.kind === kind))
      issues.push({ id: `${set.id}:${kind}`, setId: set.id, kind, message, itemIds, blocking: true })
    set.status = 'blocked'
  }
  for (const entry of descriptors.filter((set) => set.nodes.length)) {
    const nodes = entry.nodes
    const set = {
      id: entry.id,
      kind: entry.kind,
      axis: entry.axis,
      itemIds: nodes.flatMap((node) => node.members.map(({ item }) => item.id)),
      label: `${labels[entry.kind]} · ${nodes.length}`,
      status: entry.skip ? 'skipped' : 'ready',
      boundsBefore: union(nodes.map((node) => node.bounds)),
    }
    set.boundsAfter = { ...set.boundsBefore }
    sets.push(set)
    if (entry.skip) continue
    const panels = new Set(nodes.map((node) => node.panel))
    if (panels.size !== 1 || panels.has(-1)) {
      addIssue(set, 'cross-panel', 'Группа пересекает створки. Разделите её на две группы перед выравниванием.')
      continue
    }
    if (entry.kind === 'ambiguous') {
      addIssue(
        set,
        entry.reason,
        entry.reason === 'overlap'
          ? 'Перекрывающиеся детали могут быть составным узором. Объедините их, выберите направление или оставьте как есть.'
          : entry.reason === 'mixed-grid'
            ? 'Детали сетки имеют разные габариты. Выберите ряды, колонки или оставьте как есть.'
            : 'Неясно, как расположить эти детали. Выберите ряд, колонку или оставьте как есть.'
      )
      continue
    }
    const frame = panelBounds(normalized, nodes[0].panel)
    const proposal =
      entry.kind === 'corners'
        ? cornerArrangement(nodes, frame, insetMm)
        : entry.kind === 'center'
          ? centerArrangement(nodes, frame, entry.axis)
          : entry.kind === 'grid'
            ? gridArrangement(nodes)
            : entry.parallelLines
              ? parallelLinesArrangement(nodes, entry.axis)
              : lineArrangement(nodes, entry.axis)
    if (proposal.error) {
      addIssue(set, proposal.error, proposal.message)
      continue
    }
    if (
      nodes.some(
        (node) =>
          node.locked && Object.values(proposal.moves.get(node.key) || {}).some((value) => Math.abs(value) > EPSILON)
      )
    ) {
      addIssue(
        set,
        'locked',
        'Закреплённая деталь мешает выровнять набор. Снимите закрепление или оставьте этот набор.'
      )
      continue
    }
    for (const node of nodes) {
      const delta = proposal.moves.get(node.key) || { x: 0, y: 0 }
      if (Math.abs(delta.x) <= EPSILON && Math.abs(delta.y) <= EPSILON) continue
      for (const member of node.members) {
        const item = items[member.index]
        item.x = rounded(item.x + delta.x)
        item.y = rounded(item.y + delta.y)
      }
      changedNodes.set(node.key, set)
    }
    for (const field of ['gapMm', 'rows', 'columns', 'gapX', 'gapY'])
      if (proposal[field] !== undefined) set[field] = proposal[field]
    guides.push(...proposal.guides.map((guide) => ({ ...guide, setId: set.id })))
  }

  const newBounds = new Map(items.map((item) => [item.id, getItemBounds(item, catalog.get(item.productId))]))
  for (const node of allNodes) {
    const set = changedNodes.get(node.key)
    if (!set) continue
    const frame = panelBounds(normalized, node.panel)
    for (const { item } of node.members) {
      const bounds = newBounds.get(item.id)
      if (
        bounds.left < frame.left - EPSILON ||
        bounds.right > frame.right + EPSILON ||
        bounds.top < frame.top - EPSILON ||
        bounds.bottom > frame.bottom + EPSILON
      )
        addIssue(
          set,
          'bounds',
          'После выравнивания деталь выходит за внутренний край рамы или попадает на стык створок.'
        )
    }
  }
  for (let a = 0; a < allNodes.length; a++) {
    for (let b = a + 1; b < allNodes.length; b++) {
      const first = allNodes[a]
      const second = allNodes[b]
      if (!changedNodes.has(first.key) && !changedNodes.has(second.key)) continue
      const newOverlap = first.members.some((left) =>
        second.members.some(
          (right) =>
            intersects(newBounds.get(left.item.id), newBounds.get(right.item.id)) &&
            !intersects(left.bounds, right.bounds)
        )
      )
      if (!newOverlap) continue
      for (const node of [first, second]) {
        const set = changedNodes.get(node.key)
        if (set)
          addIssue(
            set,
            'collision',
            'После выравнивания детали перекрывают другой узор. Измените состав набора или оставьте его на месте.'
          )
      }
    }
  }
  // An approximate row must not absorb an unrelated nearby piece on the next
  // click. Ask for membership explicitly if straightening changes detection.
  if (mode === 'auto' && !options.overrides?.length && !issues.length) {
    const afterNodes = makeNodes({ ...normalized, items }, catalog)
    const signature = (set) =>
      `${set.kind}:${set.nodes
        .map((node) => node.key)
        .sort()
        .join('|')}`
    const originalSignatures = new Set(descriptors.map(signature))
    for (const panel of [0, 1]) {
      for (const after of detectSets(afterNodes.filter((node) => node.panel === panel && !node.corner))) {
        if (originalSignatures.has(signature(after))) continue
        for (const node of after.nodes) {
          const set = changedNodes.get(node.key)
          if (set)
            addIssue(
              set,
              'membership',
              'Рядом находятся другие детали: после выравнивания состав ряда может измениться. Уточните состав набора или оставьте его на месте.'
            )
        }
      }
    }
  }
  for (const set of sets) {
    if (set.status === 'blocked') {
      for (const id of set.itemIds) {
        const index = project.items.findIndex((item) => item.id === id)
        items[index].x = project.items[index].x
        items[index].y = project.items[index].y
      }
    }
    set.boundsAfter = union(
      set.itemIds.map((id) =>
        getItemBounds(
          items.find((item) => item.id === id),
          catalog.get(items.find((item) => item.id === id).productId)
        )
      )
    )
  }
  let changed = false
  items.forEach((item, index) => {
    for (const coordinate of ['x', 'y']) {
      if (Math.abs(item[coordinate] - project.items[index][coordinate]) <= EPSILON)
        item[coordinate] = project.items[index][coordinate]
      else changed = true
    }
  })
  return {
    items,
    sets,
    issues,
    changed,
    canApply: !issues.some((issue) => issue.blocking),
    guides: guides.filter((guide) => sets.find((set) => set.id === guide.setId)?.status === 'ready'),
  }
}
