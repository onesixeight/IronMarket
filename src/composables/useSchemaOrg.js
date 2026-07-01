import { toValue, watchEffect, onScopeDispose } from 'vue'

import { DEFAULT_SOCIAL_IMAGE, SITE_NAME, toAbsoluteSiteUrl, toSiteUrl } from '../config/site.js'
import { CONTACTS } from '../config/contacts.js'

const schemaScripts = new Map()

function getSchemaScript(id = 'primary') {
  if (schemaScripts.has(id)) return schemaScripts.get(id)

  let schemaScript = document.querySelector(`script[type="application/ld+json"][data-schema-id="${id}"]`)
  if (!schemaScript) {
    schemaScript = document.createElement('script')
    schemaScript.type = 'application/ld+json'
    schemaScript.dataset.schemaId = id
    document.head.appendChild(schemaScript)
  }
  schemaScripts.set(id, schemaScript)
  return schemaScript
}

export function useSchemaOrg(getData, options = {}) {
  const schemaId = options.id || 'primary'
  const stop = watchEffect(() => {
    const data = toValue(getData)
    const script = getSchemaScript(schemaId)
    if (data) {
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        ...data,
      })
    } else {
      script.textContent = ''
    }
  })
  onScopeDispose(() => {
    stop()
    const script = schemaScripts.get(schemaId)
    if (script) {
      script.remove()
      schemaScripts.delete(schemaId)
    }
  })
}

export function schemaProduct(product) {
  const p = toValue(product)
  if (!p) return null
  const result = {
    '@type': 'Product',
    name: p.name,
    image: p.image,
    description: p.description || p.name,
    url: p.id ? toSiteUrl(`/product/${p.id}`) : toSiteUrl('/catalog'),
    brand: { '@type': 'Brand', name: SITE_NAME },
  }
  if (!p.hidePrice) {
    result.offers = {
      '@type': 'Offer',
      url: result.url,
      priceCurrency: 'KZT',
      price: String(p.price),
      availability: 'https://schema.org/InStock',
    }
  }
  return result
}

export function schemaOrganization() {
  return {
    '@type': 'LocalBusiness',
    name: SITE_NAME,
    url: toSiteUrl('/'),
    logo: toAbsoluteSiteUrl(DEFAULT_SOCIAL_IMAGE),
    telephone: CONTACTS.phone.tel,
    email: CONTACTS.email.value,
    priceRange: 'KZT',
    openingHours: 'Mo-Su 09:00-18:00',
    address: {
      '@type': 'PostalAddress',
      streetAddress: CONTACTS.location.streetAddress,
      addressLocality: CONTACTS.location.city,
      addressCountry: 'KZ',
    },
    areaServed: CONTACTS.location.region,
    description:
      'Продажа и поставка декоративных кованых элементов в Астане и по Казахстану.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      telephone: CONTACTS.phone.tel,
      email: CONTACTS.email.value,
      areaServed: 'KZ',
      availableLanguage: ['Russian', 'Kazakh'],
    },
  }
}

export function schemaItemList(products, listName) {
  const list = toValue(products)
  if (!list || !list.length) return null
  return {
    '@type': 'ItemList',
    name: listName,
    itemListElement: list.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.name,
        image: p.image,
        url: toSiteUrl(`/product/${p.id}`),
        offers: {
          '@type': 'Offer',
          priceCurrency: 'KZT',
          price: p.hidePrice ? '0' : String(p.price),
          availability: p.hidePrice
            ? 'https://schema.org/PreOrder'
            : 'https://schema.org/InStock',
        },
      },
    })),
  }
}

export function schemaFaqPage(items) {
  const list = toValue(items)
  if (!Array.isArray(list) || list.length === 0) return null

  return {
    '@type': 'FAQPage',
    mainEntity: list.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}
