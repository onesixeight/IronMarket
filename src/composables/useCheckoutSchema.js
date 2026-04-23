const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateCheckout(form) {
  const errors = {}

  if (!form.name || form.name.trim().length < 2) {
    errors.name = 'Укажите имя (минимум 2 символа)'
  }

  if (!form.phone || form.phone.replace(/\D/g, '').length < 11) {
    errors.phone = 'Введите корректный номер телефона'
  }

  if (form.email && !EMAIL_RE.test(form.email)) {
    errors.email = 'Некорректный email'
  }

  if (!form.agreement) {
    errors.agreement = 'Необходимо согласие на обработку данных'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
