import { watchEffect, toValue, onScopeDispose } from 'vue'

let cachedMetaDesc = null

function getMetaDesc() {
  if (cachedMetaDesc) return cachedMetaDesc
  cachedMetaDesc = document.querySelector('meta[name="description"]')
  if (!cachedMetaDesc) {
    cachedMetaDesc = document.createElement('meta')
    cachedMetaDesc.setAttribute('name', 'description')
    document.head.appendChild(cachedMetaDesc)
  }
  return cachedMetaDesc
}

function setOrCreateMeta(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content || '')
}

function setOrCreateMetaName(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content || '')
}

export function useSeo(title, description, image) {
  const stop = watchEffect(() => {
    const t = toValue(title)
    const d = toValue(description)
    const img = toValue(image)

    const fullTitle = t
      ? `${t} | Эталон Ковка`
      : 'Эталон Ковка — кованые элементы в Астане'

    document.title = fullTitle

    getMetaDesc().setAttribute(
      'content',
      d || 'Кованые элементы, узоры, балясины и комплектующие с продажей и поставкой в Астане и по Казахстану.'
    )

    setOrCreateMeta('og:title', t || 'Эталон Ковка — кованые элементы в Астане')
    setOrCreateMeta('og:description', d || 'Каталог кованых элементов, узоров и комплектующих с подбором и поставкой по Астане и Казахстану.')
    setOrCreateMetaName('twitter:title', t || 'Эталон Ковка — кованые элементы в Астане')
    setOrCreateMetaName('twitter:description', d || 'Каталог кованых элементов, узоров и комплектующих с подбором и поставкой по Астане и Казахстану.')

    if (img) {
      setOrCreateMeta('og:image', img)
      setOrCreateMetaName('twitter:image', img)
    }
  })

  onScopeDispose(stop)
}
