import { buildProjectText, getBillOfMaterials, getProjectWarnings } from './model.js'

export function downloadFile(content, name, mime = 'text/plain;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function asDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Не удалось подготовить изображение детали.'))
    reader.readAsDataURL(blob)
  })
}

// Clone before awaiting any images: one export always represents one snapshot.
export async function prepareDrawing(element) {
  if (!element) throw new Error('Эскиз ещё загружается.')
  const svg = element.cloneNode(true)
  const fullViewBox = element.getAttribute('data-export-view-box') || element.getAttribute('viewBox')
  const values = fullViewBox
    ?.trim()
    .split(/[\s,]+/)
    .map(Number)
  if (values?.length !== 4 || !values.every(Number.isFinite) || values[2] <= 0 || values[3] <= 0) {
    throw new Error('Не удалось определить размер эскиза.')
  }
  const [x, y, frameWidth, frameHeight] = values
  const scale = Math.min(1800 / frameWidth, 2400 / frameHeight)
  const width = Math.max(1, Math.round(frameWidth * scale))
  const height = Math.max(1, Math.round(frameHeight * scale))
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  svg.setAttribute('viewBox', values.join(' '))
  const background = svg.querySelector('[data-canvas-background]')
  if (background) {
    for (const [key, value] of Object.entries({ x, y, width: frameWidth, height: frameHeight })) {
      background.setAttribute(key, String(value))
    }
  }
  svg.querySelectorAll('[data-editor-only]').forEach((node) => node.remove())
  const cache = new Map()
  await Promise.all(
    [...svg.querySelectorAll('image')].map(async (node) => {
      const href = node.getAttribute('href') || node.getAttribute('xlink:href')
      if (!href) return
      if (!cache.has(href)) {
        cache.set(
          href,
          fetch(href)
            .then((response) => {
              if (!response.ok) throw new Error('Не удалось загрузить фото для эскиза.')
              return response.blob()
            })
            .then(asDataUrl)
        )
      }
      node.setAttribute('href', await cache.get(href))
      node.removeAttribute('xlink:href')
    })
  )
  svg.querySelectorAll('[tabindex]').forEach((node) => node.removeAttribute('tabindex'))
  return { source: new XMLSerializer().serializeToString(svg), width, height }
}

export async function exportDrawing(element, filename = 'etalon-eskiz.svg') {
  const drawing = await prepareDrawing(element)
  downloadFile(drawing.source, filename, 'image/svg+xml;charset=utf-8')
}

async function drawingPng(element) {
  const drawing = await prepareDrawing(element)
  const url = URL.createObjectURL(new Blob([drawing.source], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const image = new Image()
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = () => reject(new Error('Не удалось преобразовать эскиз в изображение.'))
      image.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = drawing.width
    canvas.height = drawing.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Браузер не поддерживает сохранение PNG.')
    context.fillStyle = '#f7f4eb'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0)
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error('Не удалось сохранить PNG.'))),
        'image/png'
      )
    })
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function exportDrawingPng(element, filename = 'etalon-eskiz.png') {
  downloadFile(await drawingPng(element), filename)
}

export function discussionProducts(project, products) {
  const ids = new Set(project.discussionItems || [])
  return products.filter((product) => ids.has(product.id))
}

export function buildHandoffText(project, products) {
  const lines = [buildProjectText(project, products)]
  const discussion = discussionProducts(project, products)
  if (discussion.length) {
    lines.push('', 'Для обсуждения с мастером — не размещены на эскизе:')
    for (const product of discussion)
      lines.push(`• ${product.name} (арт. ${product.id}) — размеры и количество уточнить.`)
  }
  if (project.comment?.trim()) lines.push('', 'Комментарий:', project.comment.trim())
  const warnings = getProjectWarnings(project, products)
  if (warnings.length) {
    lines.push('', 'Проверить размещение:')
    for (const message of new Set(warnings.map((warning) => warning.message))) lines.push(`• ${message}`)
  }
  return lines.join('\n')
}

export function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character]
  )
}

// The print popup inherits the strict style-src CSP of the opener, which drops
// inline <style> text written via document.write. The CSSOM is not restricted,
// so the report ships an empty <style> and the rules are inserted below.
const REPORT_CSS_RULES = [
  '*{box-sizing:border-box}',
  'body{margin:0;padding:28px;color:#24251f;background:#fff;font:14px/1.5 Arial,sans-serif;overflow-wrap:anywhere}',
  'main{max-width:1000px;margin:auto}',
  'h1{font-size:26px;margin:0 0 6px}',
  'h2{font-size:18px;margin:24px 0 8px}',
  'p{margin:8px 0}',
  '.sketch{width:100%;max-height:440px;object-fit:contain;background:#f7f4eb;border:1px solid #ddd;margin-top:16px}',
  'table{width:100%;border-collapse:collapse}',
  'th,td{padding:9px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top}',
  'thead{display:table-header-group}',
  'tr{break-inside:avoid}',
  'small,.note{color:#5d6055}',
  '.comment{white-space:pre-wrap}',
  '.warnings{border-left:3px solid #a27b37;padding-left:14px}',
  '@media print{body{padding:0;font-size:11px}.sketch{max-height:330px}h2{break-after:avoid}a{color:inherit}}',
  '@page{size:A4;margin:14mm}',
]

export function applyPrintReportStyles(targetDocument) {
  const style = targetDocument.querySelector('style[data-report-styles]')
  if (!style) return
  if (style.sheet) {
    for (const rule of REPORT_CSS_RULES) style.sheet.insertRule(rule, style.sheet.cssRules.length)
  } else {
    style.textContent = REPORT_CSS_RULES.join('\n')
  }
}

export function buildPrintReportHtml(project, products, pngDataUrl) {
  if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/u.test(pngDataUrl)) {
    throw new Error('Для печати нужно подготовить изображение эскиза.')
  }
  const rows = getBillOfMaterials(project, products)
  const types = { gates: 'Двустворчатые ворота', wicket: 'Калитка', fence: 'Секция забора' }
  const body = rows
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.product.name)}<br><small>Арт. ${row.product.id}</small></td><td>${row.product.widthMm} × ${row.product.heightMm} мм${row.product.requiresDimensions ? '<br><small>Размер указан вручную</small>' : ''}</td><td>${row.quantity} шт.${row.saleUnit === 'pair' && row.orderQuantity !== null ? `<br><small>К покупке: ${row.orderQuantity} пар.${row.spareQuantity ? ` Запас: ${row.spareQuantity} шт.` : ''}</small>` : ''}</td></tr>`
    )
    .join('')
  const discussion = discussionProducts(project, products)
  const warnings = getProjectWarnings(project, products)
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Подборка элементов ковки</title><style data-report-styles></style></head><body><main><h1>Подборка элементов ковки</h1><p>${escapeHtml(types[project.type])} · ${project.width} × ${project.height} мм${project.type === 'fence' ? ` · Секций: ${project.sections}` : ''}</p><img class="sketch" src="${pngDataUrl}" alt="Эскиз подобранных элементов"><h2>Комплектация${project.type === 'fence' ? ' на все секции' : ''}</h2>${rows.length ? `<table><thead><tr><th>Элемент</th><th>Размер одной детали</th><th>Количество</th></tr></thead><tbody>${body}</tbody></table>` : '<p>Элементы на эскиз пока не добавлены.</p>'}${discussion.length ? `<h2>Для обсуждения с мастером</h2><p class="note">Эти элементы не размещены на эскизе и не входят в количество деталей. Размеры и количество нужно уточнить.</p><ul>${discussion.map((product) => `<li>${escapeHtml(product.name)} · арт. ${product.id}</li>`).join('')}</ul>` : ''}${project.comment?.trim() ? `<h2>Комментарий</h2><p class="comment">${escapeHtml(project.comment.trim())}</p>` : ''}${warnings.length ? `<section class="warnings"><h2>Проверить размещение</h2><ul>${[...new Set(warnings.map((warning) => warning.message))].map((message) => `<li>${escapeHtml(message)}</li>`).join('')}</ul></section>` : ''}<p class="note">Эскиз для подбора. Каркас, крепёж, изготовление и монтаж не включены в комплектацию. Стоимость и наличие уточняются при заказе. Размеры деталей, крепления и возможность изготовления должен проверить мастер.</p></main></body></html>`
}

// Open synchronously in the click handler so async image work cannot trigger a popup block.
export async function printProjectReport(element, project, products) {
  const popup = window.open('', '_blank')
  if (!popup) throw new Error('Браузер заблокировал окно печати. Разрешите всплывающее окно для этого сайта.')
  popup.opener = null
  popup.document.write(
    '<!doctype html><html lang="ru"><meta charset="utf-8"><title>Подготовка подборки</title><p>Подготавливаем эскиз и комплектацию…</p></html>'
  )
  popup.document.close()
  const snapshot = JSON.parse(JSON.stringify(project))
  try {
    const png = await asDataUrl(await drawingPng(element))
    if (popup.closed) throw new Error('Окно печати закрыто. Откройте подборку ещё раз.')
    popup.document.open()
    popup.document.write(buildPrintReportHtml(snapshot, products, png))
    popup.document.close()
    applyPrintReportStyles(popup.document)
    await Promise.all([...popup.document.images].map((image) => image.decode()))
    if (popup.closed) throw new Error('Окно печати закрыто.')
    popup.focus()
    popup.print()
  } catch (error) {
    if (!popup.closed) {
      popup.document.open()
      popup.document.write(
        `<!doctype html><html lang="ru"><meta charset="utf-8"><title>Не удалось подготовить подборку</title><p>${escapeHtml(error.message || 'Ошибка подготовки эскиза.')}</p></html>`
      )
      popup.document.close()
    }
    throw error
  }
}
