import { buildTelegramLink, buildWhatsAppLink } from './messengerConfig.js'

const DEFAULT_SITE_ORIGIN = 'https://etalon-kovka.vercel.app'

function getSiteOrigin(options = {}) {
  if (options.origin) return options.origin.replace(/\/$/, '')
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin
  return DEFAULT_SITE_ORIGIN
}

export function getProductUrl(product, options = {}) {
  const productId = product?.id ? encodeURIComponent(String(product.id)) : ''
  return productId ? `${getSiteOrigin(options)}/product/${productId}` : `${getSiteOrigin(options)}/catalog`
}

export function buildProductInquiryMessage(product, options = {}) {
  const name = product?.name || 'товар из каталога'
  const material = product?.material || 'уточнить'
  const lines = [
    'Здравствуйте! Интересует позиция:',
    name,
    `Материал: ${material}`,
    `Ссылка: ${getProductUrl(product, options)}`,
    '',
    'Подскажите наличие, количество и доставку.',
  ]

  if (options.note) {
    lines.push('', `Комментарий: ${options.note}`)
  }

  return lines.join('\n')
}

export function getProductWhatsAppLink(product, options) {
  return buildWhatsAppLink(buildProductInquiryMessage(product, options))
}

export function getProductTelegramLink(product, options) {
  return buildTelegramLink(buildProductInquiryMessage(product, options))
}
