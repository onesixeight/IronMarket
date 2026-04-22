export function formatPrice(value, locale = 'ru-RU') {
  return `${Number(value || 0).toLocaleString(locale)} ₸`
}
