import catalog from '../data/catalog.json' with { type: 'json' }
import elementMetadata from '../data/constructor-elements.json' with { type: 'json' }

export const constructorGroups = [
  { id: 'crowns', label: 'Короны' },
  { id: 'ornaments', label: 'Узоры' },
  { id: 'corners', label: 'Уголки' },
  { id: 'balusters', label: 'Балясины' },
  { id: 'handles', label: 'Ручки' },
  { id: 'elements', label: 'Отдельные элементы' },
  { id: 'square85', label: 'Квадрат 8,5 мм' },
  { id: 'tube15', label: 'Труба 15 × 15 мм' },
  { id: 'posts', label: 'Стойки' },
  { id: 'leaves', label: 'Листики' },
]

const productsById = new Map(catalog.products.map((product) => [product.id, product]))

// Physical sizes are catalogue data oriented to the photo. Entries with missing
// or conflicting dimensions require an explicit size before they can be placed.
// Crops select the pictured product without modifying source images.
export const constructorProducts = elementMetadata.map((metadata) => {
  const product = productsById.get(metadata.productId)
  if (!product) throw new Error(`Constructor product ${metadata.productId} is missing from the catalogue`)
  return { ...product, ...metadata }
})

const constructorProductsById = new Map(constructorProducts.map((product) => [product.id, product]))

export function getConstructorProduct(id) {
  return constructorProductsById.get(Number(id))
}
