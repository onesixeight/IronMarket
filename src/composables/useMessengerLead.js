import { buildTelegramLink, buildWhatsAppLink } from './messengerConfig.js'

export function buildLeadMessage(form, options = {}) {
  const source = options.sourceLabel || 'с сайта Эталон Ковка'
  const lines = [`💬 Заявка ${source}`, '', `👤 Имя: ${form.name}`, `📞 Телефон: ${form.phone}`]

  if (form.email) {
    lines.push(`✉️ Email: ${form.email}`)
  }

  if (form.message) {
    lines.push('', `📝 Сообщение: ${form.message}`)
  }

  return lines.join('\n')
}

export function getWhatsAppLeadLink(form, options) {
  return buildWhatsAppLink(buildLeadMessage(form, options))
}

export function getTelegramLeadLink(form, options) {
  return buildTelegramLink(buildLeadMessage(form, options))
}

export function useMessengerLead() {
  return {
    buildLeadMessage,
    getWhatsAppLeadLink,
    getTelegramLeadLink,
  }
}
