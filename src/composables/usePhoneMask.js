export function usePhoneMask() {
  function formatPhone(value) {
    const digits = value.replace(/\D/g, '')
    if (digits.length === 0) return ''

    const local = digits.startsWith('7') || digits.startsWith('8') ? digits.slice(1) : digits
    let formatted = '+7'

    if (local.length > 0 && local.length < 3) {
      formatted += ' ' + local
    } else if (local.length >= 3) {
      formatted += ' (' + local.slice(0, 3) + ')'
      if (local.length >= 3) {
        const rest = local.slice(3)
        if (rest.length > 0) formatted += ' ' + rest.slice(0, 3)
        if (rest.length >= 3) formatted += '-' + rest.slice(3, 5)
        if (rest.length >= 5) formatted += '-' + rest.slice(5, 7)
      }
    }

    return formatted
  }

  function onPhoneInput(e) {
    const formatted = formatPhone(e.target.value)
    e.target.value = formatted
    return formatted
  }

  return { formatPhone, onPhoneInput }
}
