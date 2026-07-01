import { toValue, watchEffect, onScopeDispose } from 'vue'

import { DEFAULT_SOCIAL_IMAGE, SITE_NAME, toAbsoluteSiteUrl, toSiteUrl } from '../config/site.js'
import { CONTACTS } from '../config/contacts.js'

let schemaScript = null

function getSchemaScript() {
  if (schemaScript) return schemaScript
  schemaScript = document.querySelector('script[type="application/ld+json"]')
  if (!schemaScript) {
    schemaScript = document.createElement('script')
    schemaScript.type = 'application/ld+json'
    document.head.appendChild(schemaScript)
  }
  return schemaScript
}

export function useSchemaOrg(getData) {
  const stop = watchEffect(() => {
    const data = toValue(getData)
    const script = getSchemaScript()
    if (data) {
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        ...data,
      })
    } else {
      script.textContent = ''
    }
  })
  onScopeDispose(stop)
}

export function schemaProduct(product) {
  const p = toValue(product)
  if (!p) return null
  const result = {
    '@type': 'Product',
    name: p.name,
    image: p.image,
    description: p.description || p.name,
    brand: { '@type': 'Brand', name: SITE_NAME },
  }
  if (!p.hidePrice) {
    result.offers = {
      '@type': 'Offer',
      url: p.id ? toSiteUrl(`/product/${p.id}`) : toSiteUrl('/catalog'),
      priceCurrency: 'KZT',
      price: String(p.price),
      availability: 'https://schema.org/InStock',
    }
  }
  return result
}

export function schemaOrganization() {
  return {
    '@type': 'Organization',
    name: SITE_NAME,
    url: toSiteUrl('/'),
    logo: toAbsoluteSiteUrl(DEFAULT_SOCIAL_IMAGE),
    telephone: CONTACTS.phone.tel,
    email: CONTACTS.email.value,
    address: {
      '@type': 'PostalAddress',
      streetAddress: CONTACTS.location.streetAddress,
      addressLocality: CONTACTS.location.city,
      addressCountry: 'KZ',
    },
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
