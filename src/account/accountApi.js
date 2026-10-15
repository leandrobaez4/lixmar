const pendingGetRequests = new Map()

function abortError() {
  return new DOMException('The operation was aborted.', 'AbortError')
}

function followRequest(request, signal) {
  if (!signal) return request
  if (signal.aborted) return Promise.reject(abortError())

  return new Promise((resolve, reject) => {
    const abort = () => reject(abortError())
    signal.addEventListener('abort', abort, { once: true })
    request.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort))
  })
}

async function sendAccountRequest(path, options) {
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

export function accountRequest(path, options = {}) {
  const method = String(options.method || 'GET').toUpperCase()
  if (method !== 'GET') return sendAccountRequest(path, options)

  const { signal, ...sharedOptions } = options
  let request = pendingGetRequests.get(path)

  if (!request) {
    request = sendAccountRequest(path, sharedOptions)
    pendingGetRequests.set(path, request)
    request.then(
      () => pendingGetRequests.delete(path),
      () => pendingGetRequests.delete(path),
    )
  }

  return followRequest(request, signal)
}

export function formatMoney(amount, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(Number(amount) || 0)
}
