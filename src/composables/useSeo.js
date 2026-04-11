export function useSeo(title, description) {
  document.title = title ? `${title} | Ковка — Мастерская` : 'Ковка — Мастерская кованых изделий'

  let metaDesc = document.querySelector('meta[name="description"]')
  if (!metaDesc) {
    metaDesc = document.createElement('meta')
    metaDesc.setAttribute('name', 'description')
    document.head.appendChild(metaDesc)
  }
  metaDesc.setAttribute('content', description || 'Декоративные кованые изделия от производителя. Короны, узоры, балясины, решётки и элементы ковки с доставкой по России.')
}
