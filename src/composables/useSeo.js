export function useSeo(title, description) {
  document.title = title
    ? `${title} | Эталон Ковка`
    : 'Эталон Ковка — кованые элементы в Астане'

  let metaDesc = document.querySelector('meta[name="description"]')
  if (!metaDesc) {
    metaDesc = document.createElement('meta')
    metaDesc.setAttribute('name', 'description')
    document.head.appendChild(metaDesc)
  }

  metaDesc.setAttribute(
    'content',
    description || 'Кованые элементы, узоры, балясины и комплектующие с продажей и поставкой в Астане и по Казахстану.'
  )
}
