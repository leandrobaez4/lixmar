const PUBLIC_SESSION_EVENT = 'lixmar-public-auth-change'
let currentSession = null
let refreshTimer = null
let pendingVerification = null
let sessionRevision = 0

function validPublicProfile(profile) {
  return profile !== null && typeof profile === 'object' && !Array.isArray(profile)
    && (Number.isInteger(profile.id) && profile.id > 0
      || typeof profile.id === 'string' && profile.id.trim().length > 0)
    && typeof profile.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)
    && profile.verified === true
}

function scheduleRefresh(expiresIn) {
  clearTimeout(refreshTimer)
  if (!Number.isFinite(expiresIn) || expiresIn <= 0) return
  refreshTimer = setTimeout(refreshPublicSession, Math.max(1000, Math.min(expiresIn * 800, 2147483647)))
}

async function refreshPublicSession() {
  try {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    })
    if (response.status === 401 || response.status === 403) {
      clearPublicSession()
      return
    }
    if (!response.ok) throw new Error('Refresh failed')

    const payload = await response.json()
    const expiresIn = Number(payload?.data?.expires_in)
    if (payload?.success !== true || !Number.isFinite(expiresIn) || expiresIn <= 0) {
      clearPublicSession()
      return
    }
    scheduleRefresh(expiresIn)
  } catch {
    refreshTimer = setTimeout(refreshPublicSession, 30000)
  }
}

export function getPublicSession() {
  return currentSession
}

export function setPublicSession(session) {
  if (typeof window === 'undefined') return

  // Profile details are kept only in memory. The server owns the HttpOnly cookie.
  const { token: _ignoredToken, ...profile } = session || {}
  sessionRevision += 1
  currentSession = profile
  window.dispatchEvent(new Event(PUBLIC_SESSION_EVENT))
}

export function clearPublicSession() {
  clearTimeout(refreshTimer)
  sessionRevision += 1
  refreshTimer = null
  currentSession = null
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('lixmar_public_session')
    window.localStorage.removeItem('lixmar_public_verified_emails')
    window.dispatchEvent(new Event(PUBLIC_SESSION_EVENT))
  }
}

async function requestPublicSession() {
  const requestRevision = sessionRevision
  try {
    const response = await fetch('/api/v1/auth/me', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    })
    if (!response.ok) {
      if ((response.status === 401 || response.status === 403) && requestRevision === sessionRevision) {
        clearPublicSession()
      }
      return false
    }

    const payload = await response.json()
    const expiresIn = Number(payload?.expires_in)
    if (payload?.success !== true || !validPublicProfile(payload.data)
      || !Number.isFinite(expiresIn) || expiresIn <= 0) {
      if (requestRevision === sessionRevision) clearPublicSession()
      return false
    }

    if (requestRevision !== sessionRevision) return Boolean(currentSession)

    setPublicSession(payload.data)
    scheduleRefresh(expiresIn)
    return true
  } catch {
    return false
  }
}

function followVerification(verification, signal) {
  if (!signal) return verification
  if (signal.aborted) return Promise.resolve(false)

  return new Promise((resolve) => {
    const abort = () => resolve(false)
    signal.addEventListener('abort', abort, { once: true })
    verification.then(resolve).finally(() => signal.removeEventListener('abort', abort))
  })
}

export function verifyPublicSession(signal) {
  if (!pendingVerification) {
    pendingVerification = requestPublicSession()
    pendingVerification.then(
      () => { pendingVerification = null },
      () => { pendingVerification = null },
    )
  }

  return followVerification(pendingVerification, signal)
}

export async function logoutPublicSession() {
  try {
    const response = await fetch('/api/v1/auth/logout', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    })
    if (!response.ok && response.status !== 401) return false
    clearPublicSession()
    return true
  } catch {
    return false
  }
}

export function subscribeToPublicSession(callback) {
  if (typeof window === 'undefined') return () => {}

  window.addEventListener(PUBLIC_SESSION_EVENT, callback)
  return () => window.removeEventListener(PUBLIC_SESSION_EVENT, callback)
}
