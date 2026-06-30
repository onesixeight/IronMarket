import { TELEGRAM_USERNAME, WHATSAPP_PHONE } from '../config/contacts.js'

export { TELEGRAM_USERNAME, WHATSAPP_PHONE }

export function buildWhatsAppLink(message) {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`
}

export function buildTelegramLink(message) {
  return `https://t.me/${TELEGRAM_USERNAME.replace(/^@/, '')}?text=${encodeURIComponent(message)}`
}
