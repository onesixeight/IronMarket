const MAX_LOCAL_DIGITS = 10

export function normalizePhoneDigits(value) {
  const digits = String(value || '').replace(/\D/g, '')
  const local = digits.startsWith('7') || digits.startsWith('8') ? digits.slice(1) : digits
  return local.slice(0, MAX_LOCAL_DIGITS)
}

function formatLocalDigits(local) {
  if (!local) return ''

  let formatted = '+7'

  if (local.length > 0 && local.length < 3) {
    formatted += ' ' + local
  } else if (local.length >= 3) {
    formatted += ' (' + local.slice(0, 3) + ')'
    const rest = local.slice(3)
    if (rest.length > 0) formatted += ' ' + rest.slice(0, 3)
    if (rest.length >= 3) formatted += '-' + rest.slice(3, 5)
    if (rest.length >= 5) formatted += '-' + rest.slice(5, 7)
  }

  return formatted
}

function countLocalDigitsBefore(value, caret) {
  return normalizePhoneDigits(String(value || '').slice(0, caret)).length
}

function caretFromLocalDigitIndex(formatted, localDigitIndex) {
  if (!formatted) return 0
  if (localDigitIndex <= 0) return Math.min(formatted.length, 3)

  let seenLocalDigits = 0

  for (let index = 0; index < formatted.length; index += 1) {
    if (!/\d/.test(formatted[index])) continue
    if (index === 1 && formatted.startsWith('+7')) continue

    seenLocalDigits += 1
    if (seenLocalDigits >= localDigitIndex) return index + 1
  }

  return formatted.length
}

export function usePhoneMask() {
  function formatPhone(value) {
    const digits = String(value || '').replace(/\D/g, '')
    if (digits === '7' || digits === '8') return '+7'

    return formatLocalDigits(normalizePhoneDigits(value))
  }

  function formatPhoneInputEvent(e) {
    const input = e?.target
    if (!input) return ''

    const caret = input.selectionStart ?? input.value.length
    const localDigitsBeforeCaret = countLocalDigitsBefore(input.value, caret)
    const formatted = formatPhone(input.value)

    input.value = formatted

    if (typeof input.setSelectionRange === 'function') {
      const nextCaret = caretFromLocalDigitIndex(formatted, localDigitsBeforeCaret)
      input.setSelectionRange(nextCaret, nextCaret)
    }

    return formatted
  }

  return {
    formatPhone,
    formatPhoneInputEvent,
    normalizePhoneDigits,
    onPhoneInput: formatPhoneInputEvent,
  }
}
