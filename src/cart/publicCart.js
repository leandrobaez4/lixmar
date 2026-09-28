const PUBLIC_CART_EVENT = 'lixmar-public-cart-change'
let currentCart = null
let cartGeneration = 0

function announceCartChange() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PUBLIC_CART_EVENT))
}

async function cartRequest(path = '', options = {}) {
  const response = await fetch(`/api/v1/cart${path}`, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
    ...options,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      const error = new Error('Iniciá sesión para ver tu carrito.')
      error.code = 'SESSION_REQUIRED'
      throw error
    }
    if (response.status >= 500) {
      throw new Error('No se pudo cargar el carrito. Intentá de nuevo más tarde.')
    }
    const firstError = Object.values(payload.errors || {}).flat()[0]
    throw new Error(firstError || payload.message || 'No se pudo cargar el carrito. Intentá nuevamente.')
  }
  return payload
}

function validCart(summary) {
  if (!summary || typeof summary !== 'object' || !Array.isArray(summary.vendors)
    || !Number.isInteger(summary.items_count) || summary.items_count < 0
    || typeof summary.grand_total !== 'number' || !Number.isFinite(summary.grand_total) || summary.grand_total < 0
    || typeof summary.is_valid !== 'boolean' || !/^[A-Z]{3}$/.test(summary.currency)) return false
  let itemCount = 0
  for (const vendor of summary.vendors) {
    if (!vendor || !Array.isArray(vendor.items)) return false
    for (const item of vendor.items) {
      if (!item || !Number.isInteger(item.id) || !Number.isInteger(item.quantity) || item.quantity < 1) return false
      itemCount += 1
    }
  }
  return itemCount === summary.items_count
}

export function getPublicCartItems() {
  return currentCart?.vendors?.flatMap((vendor) => vendor.items) || []
}

export function getPublicCartSummary() {
  return currentCart
}

export function getPublicCartCount() {
  return currentCart?.items_count || 0
}

export function clearPublicCart() {
  cartGeneration += 1
  currentCart = null
  announceCartChange()
}

export async function fetchPublicCart() {
  const generation = cartGeneration
  const payload = await cartRequest()
  if (generation !== cartGeneration) return currentCart
  if (!validCart(payload.data)) throw new Error('El carrito recibido no tiene el formato esperado. Inténtalo nuevamente.')
  currentCart = payload.data
  announceCartChange()
  return currentCart
}

export async function addPublicCartItem(productId, quantity = 1) {
  await cartRequest('/items', { method: 'POST', body: JSON.stringify({ product_id: productId, quantity }) })
  return fetchPublicCart()
}

export async function updatePublicCartItem(cartItemId, quantity) {
  await cartRequest(`/items/${cartItemId}`, { method: 'PUT', body: JSON.stringify({ quantity }) })
  return fetchPublicCart()
}

export async function removePublicCartItem(cartItemId) {
  await cartRequest(`/items/${cartItemId}`, { method: 'DELETE' })
  return fetchPublicCart()
}

export async function emptyPublicCart() {
  await cartRequest('', { method: 'DELETE' })
  return fetchPublicCart()
}

export function subscribeToPublicCart(callback) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(PUBLIC_CART_EVENT, callback)
  return () => window.removeEventListener(PUBLIC_CART_EVENT, callback)
}
