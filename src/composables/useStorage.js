const validators = {
  'recently-viewed': (v) => {
    if (!Array.isArray(v)) return false
    return v.every((i) => typeof i === 'number')
  },
}

export function loadStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    const validate = validators[key]
    if (validate && !validate(parsed)) {
      localStorage.removeItem(key)
      return fallback
    }
    return parsed
  } catch {
    localStorage.removeItem(key)
    return fallback
  }
}

export function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Optional browser storage should never break the shopping flow.
  }
}
