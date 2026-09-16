const PUBLIC_SESSION_STORAGE_KEY = 'lixmar_public_session'
const PUBLIC_SESSION_EVENT = 'lixmar-public-auth-change'

export function getPublicSession() {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(PUBLIC_SESSION_STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue)
  } catch {
    window.localStorage.removeItem(PUBLIC_SESSION_STORAGE_KEY)
    return null
  }
}

export function setPublicSession(session) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PUBLIC_SESSION_STORAGE_KEY, JSON.stringify(session))
  window.dispatchEvent(new Event(PUBLIC_SESSION_EVENT))
}

export function clearPublicSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(PUBLIC_SESSION_STORAGE_KEY)
  window.dispatchEvent(new Event(PUBLIC_SESSION_EVENT))
}

export function subscribeToPublicSession(callback) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  window.addEventListener(PUBLIC_SESSION_EVENT, callback)
  window.addEventListener('storage', callback)

  return () => {
    window.removeEventListener(PUBLIC_SESSION_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}