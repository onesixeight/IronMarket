import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'
import { analyzeConstructorImage, analyzeLowerPairImage } from './analyze-constructor-images.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const metadataPath = path.join(root, 'src/data/constructor-elements.json')
const catalog = JSON.parse(await fs.readFile(path.join(root, 'src/data/catalog.json'), 'utf8'))
const existing = new Map(JSON.parse(await fs.readFile(metadataPath, 'utf8')).map((entry) => [entry.productId, entry]))
const curatedIds = new Set([
  6150, 6151, 6152, 6157, 6168, 6170, 6174, 6177, 6178, 6179, 6180, 6192, 6159, 6160, 6161, 6166, 6199, 6201, 6206,
  6208, 6210, 6292, 6301, 6302,
])
const groups = {
  'korony-na-vorota': 'crowns',
  'nakladnye-dekorativnye-uzory': 'ornaments',
  'kovanye-ugolki': 'corners',
  'kovanye-balyasiny': 'balusters',
  'kovanye-rucki': 'handles',
  'kovanye-elementy': 'elements',
  'uzory-iz-kvadrata-85x85': 'square85',
  'uzory-iz-kvadratnoi-truby-15x15': 'tube15',
  'kovanye-stoiki': 'posts',
  'kovanye-listiki': 'leaves',
}
const pairs = new Set([6167, 6238, 6281, 6282])
// Select one item/view from a montage. These are pixel windows, not physical measurements.
const regionRanges = {
  6260: ['x', 35, 130],
  6261: ['x', 160, 240],
  6262: ['x', 295, 372],
  6263: ['x', 50, 150],
  6264: ['x', 235, 325],
  6265: ['x', 395, 480],
  6270: ['y', 1320, 1560],
  6307: ['y', 580, 820],
  6309: ['x', 260, 460],
  6311: ['x', 0, 195],
  6312: ['x', 740, 1020],
  6313: ['x', 740, 1020],
  6314: ['x', 220, 450],
  6315: ['x', 0, 95],
  6316: ['x', 0, 95],
  6317: ['x', 540, 1210],
  6320: ['x', 665, 1110],
  6321: ['x', 270, 920],
}
const leafLengths = {
  6309: 240,
  6310: 170,
  6311: 160,
  6312: 230,
  6313: 230,
  6314: 135,
  6315: 165,
  6316: 140,
  6317: 170,
  6318: 130,
  6319: 130,
  6320: 130,
  6321: 230,
}
function shortName(product) {
  if (curatedIds.has(product.id)) return existing.get(product.id).shortName
  return (
    product.name.match(/["«]([^"»]+)["»]/u)?.[1] ||
    product.name.replace(/^(Кованый элемент |Кованая |Кованый |кованная |БАЛЯСИНА )/u, '').trim()
  )
}

const entries = []
for (const product of catalog.products) {
  // PDF imports have separately reviewed shared illustrations and dimensions.
  if (product.sourceDocument && existing.has(product.id)) {
    entries.push(existing.get(product.id))
    continue
  }
  const imagePath = path.join(root, 'public', product.image.replace(/^\//, ''))
  const imageMetadata = await sharp(imagePath).metadata()
  const range = regionRanges[product.id]
  const imageRegion = range
    ? range[0] === 'x'
      ? { x: range[1], y: 0, width: range[2] - range[1], height: imageMetadata.height }
      : { x: 0, y: range[1], width: imageMetadata.width, height: range[2] - range[1] }
    : undefined
  const analysis = [6167, 6238].includes(product.id)
    ? await analyzeLowerPairImage(imagePath)
    : await analyzeConstructorImage(imagePath, imageRegion)
  const dimensions = product.size
    ?.match(/^(\d+)\s*[хx×]\s*(\d+)$/u)
    ?.slice(1)
    .map(Number)
  let widthMm = null
  let heightMm = null
  let requiresDimensions = false
  let dimensionNote = ''
  let dimensionSource = 'catalog.size'
  if (dimensions) {
    const [first, second] = dimensions
    const ratio = analysis.crop.width / analysis.crop.height
    const directError = Math.abs(Math.log(ratio / (first / second)))
    const swappedError = Math.abs(Math.log(ratio / (second / first)))
    ;[widthMm, heightMm] = directError <= swappedError ? [first, second] : [second, first]
    if (Math.min(directError, swappedError) > Math.log(1.25)) {
      requiresDimensions = true
      dimensionNote = `Каталог указывает ${product.size} мм, но пропорции фото заметно отличаются. Проверьте ширину и высоту показанной детали перед размещением.`
    }
  }
  if (curatedIds.has(product.id)) {
    const saved = existing.get(product.id)
    widthMm = saved.widthMm
    heightMm = saved.heightMm
    analysis.crop = saved.crop
    requiresDimensions = false
    dimensionNote = ''
  }
  if (product.categorySlug === 'kovanye-stoiki') {
    widthMm = null
    heightMm = product.id <= 6262 ? 1000 : 1200
    requiresDimensions = true
    dimensionSource = 'catalog.description.length'
    dimensionNote =
      'Длина взята из описания. Диаметр трубы не задаёт общую ширину декора стойки; укажите ширину показанного отдельного изделия.'
  }
  if ([6270, 6307].includes(product.id)) {
    widthMm = 980
    heightMm = null
    requiresDimensions = true
    dimensionSource = 'catalog.description.length'
    dimensionNote = `Из общего фото выбрана балясина ${product.id === 6270 ? 'с одной конфеткой' : 'с двумя конфетками'}. На фото она горизонтальна: длина 980 мм, поперечный габарит не указан. Уточните его; после добавления деталь можно повернуть.`
  }
  if (product.id === 6291) {
    widthMm = 500
    heightMm = 500
    dimensionSource = 'catalog.size.circular-diameter'
    dimensionNote = 'Круглый узор: указанные в каталоге 500 мм трактуются как диаметр.'
  }
  if (product.id === 6299) {
    widthMm = null
    heightMm = 500
    requiresDimensions = true
    dimensionSource = 'catalog.description.length'
    dimensionNote =
      'В каталоге указана длина пики 500 мм. Общая ширина шарика и листика не указана; укажите её перед размещением.'
  }
  if (product.categorySlug === 'kovanye-listiki') {
    widthMm = null
    heightMm = leafLengths[product.id]
    requiresDimensions = true
    dimensionSource = 'catalog.description.length-conflict'
    dimensionNote = `Поле размера 270 × 70 мм противоречит длине ${heightMm} мм в описании. Показан один элемент/вид; подтвердите его высоту и укажите ширину.`
  }
  if ([6287, 6290].includes(product.id)) {
    widthMm = null
    heightMm = null
    requiresDimensions = true
    dimensionSource = 'catalog.conflict'
    dimensionNote = `В карточке расходятся размеры: поле ${product.size} мм, описание ${product.id === 6287 ? '830 × 560' : '790 × 300'} мм. Уточните оба габарита перед размещением.`
  }
  if (pairs.has(product.id)) {
    widthMm = null
    heightMm = null
    requiresDimensions = true
    dimensionSource = 'catalog.pair-unverified-piece'
    dimensionNote = `Товар продаётся парами по 2 детали. Каталог указывает ${product.size} мм; подтвердите ширину и высоту одной половины перед размещением. Количество пар для заказа рассчитывается отдельно.`
  }
  entries.push({
    productId: product.id,
    ...(existing.get(product.id)?.cornerAnchor ? { cornerAnchor: existing.get(product.id).cornerAnchor } : {}),
    widthMm,
    heightMm,
    group: groups[product.categorySlug],
    shortName: shortName(product),
    ...analysis,
    ...(imageRegion ? { imageRegion } : {}),
    requiresDimensions,
    ...(dimensionNote ? { dimensionNote } : {}),
    dimensionSource,
    ...(pairs.has(product.id) ? { saleUnit: 'pair', piecesPerSaleUnit: 2 } : {}),
  })
}
await fs.writeFile(metadataPath, `${JSON.stringify(entries, null, 2)}\n`)
console.log(
  JSON.stringify({
    total: entries.length,
    requiresDimensions: entries.filter((entry) => entry.requiresDimensions).length,
    ready: entries.filter((entry) => !entry.requiresDimensions).length,
    groups: [...new Set(entries.map((entry) => entry.group))],
  })
)
