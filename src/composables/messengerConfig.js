export const WHATSAPP_PHONE = '77758537092'
export const TELEGRAM_USERNAME = 'etalonkovka'

export function buildWhatsAppLink(message) {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`
}

export function buildTelegramLink(message) {
  return `https://t.me/${TELEGRAM_USERNAME.replace(/^@/, '')}?text=${encodeURIComponent(message)}`
}
