const validators = {
  'recently-viewed': (v) => {
    if (!Array.isArray(v)) return false
    return v.every((i) => typeof i === 'number')
  },
}

function getStorage() {
  if (typeof globalThis === 'undefined' || !globalThis.localStorage) {
    return null
  }

  return globalThis.localStorage
}

function removeStoredValue(storage, key) {
  try {
    storage.removeItem(key)
  } catch {
    // Broken optional storage should be ignored the same way as unavailable storage.
  }
}

export function loadStorage(key, fallback = null, storage = getStorage()) {
  if (!storage) return fallback

  try {
    const raw = storage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    const validate = validators[key]
    if (validate && !validate(parsed)) {
      removeStoredValue(storage, key)
      return fallback
    }
    return parsed
  } catch {
    removeStoredValue(storage, key)
    return fallback
  }
}

export function saveStorage(key, value, storage = getStorage()) {
  if (!storage) return

  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // Optional browser storage should never break the shopping flow.
  }
}
