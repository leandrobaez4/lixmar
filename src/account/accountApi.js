export async function accountRequest(path, options = {}) {
  const response = await fetch(`/api/v1${path}`, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
    ...options,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const validationMessage = Object.values(payload.errors || {}).flat().find((value) => typeof value === 'string')
    const error = new Error(response.status === 401 || response.status === 403
      ? 'Tu sesión venció. Iniciá sesión de nuevo.'
      : validationMessage || payload.message || (typeof payload.error === 'string' ? payload.error : '') || 'No pudimos cargar la información.')
    error.status = response.status
    throw error
  }
  return payload
}

export function formatMoney(amount, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(Number(amount) || 0)
}
