const PUBLIC_VERIFIED_EMAILS_STORAGE_KEY = 'lixmar_public_verified_emails'

function getStoredVerifiedEmails() {
  if (typeof window === 'undefined') {
    return []
  }

  const rawValue = window.localStorage.getItem(PUBLIC_VERIFIED_EMAILS_STORAGE_KEY)

  if (!rawValue) {
    return []
  }

  try {
    const parsedValue = JSON.parse(rawValue)
    return Array.isArray(parsedValue) ? parsedValue : []
  } catch {
    window.localStorage.removeItem(PUBLIC_VERIFIED_EMAILS_STORAGE_KEY)
    return []
  }
}

function setStoredVerifiedEmails(emails) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PUBLIC_VERIFIED_EMAILS_STORAGE_KEY, JSON.stringify(emails))
}

export function isPublicEmailVerified(email) {
  if (!email) {
    return false
  }

  const normalizedEmail = email.trim().toLowerCase()
  return getStoredVerifiedEmails().includes(normalizedEmail)
}

export function markPublicEmailVerified(email) {
  if (!email || typeof window === 'undefined') {
    return
  }

  const normalizedEmail = email.trim().toLowerCase()
  const verifiedEmails = getStoredVerifiedEmails()

  if (verifiedEmails.includes(normalizedEmail)) {
    return
  }

  setStoredVerifiedEmails([...verifiedEmails, normalizedEmail])
}

export function clearPublicEmailVerified(email) {
  if (!email || typeof window === 'undefined') {
    return
  }

  const normalizedEmail = email.trim().toLowerCase()
  const verifiedEmails = getStoredVerifiedEmails().filter((storedEmail) => storedEmail !== normalizedEmail)

  setStoredVerifiedEmails(verifiedEmails)
}