export function usePhoneMask() {
  function formatPhone(value) {
    const digits = value.replace(/\D/g, '')
    if (digits.length === 0) return ''
    let formatted = '+7'
    const local = digits.startsWith('7') || digits.startsWith('8') ? digits.slice(1) : digits

    if (local.length > 0) formatted += ' (' + local.slice(0, 3)
    if (local.length >= 3) formatted += ') ' + local.slice(3, 6)
    if (local.length >= 6) formatted += '-' + local.slice(6, 8)
    if (local.length >= 8) formatted += '-' + local.slice(8, 10)

    return formatted
  }

  function onPhoneInput(e) {
    const formatted = formatPhone(e.target.value)
    e.target.value = formatted
    return formatted
  }

  return { formatPhone, onPhoneInput }
}
