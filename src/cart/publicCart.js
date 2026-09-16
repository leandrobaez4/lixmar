const PUBLIC_CART_STORAGE_KEY = 'lixmar_public_cart'
const PUBLIC_CART_EVENT = 'lixmar-public-cart-change'

const DEFAULT_PUBLIC_CART_ITEMS = [
  {
    id: 1,
    name: 'Pinnaeple Macbook Pro 2022 M1/ 512GB',
    price: 579000,
    qty: 1,
    img: '/assets/09b322b4fe86b16de5a9d343c6e82b51ff89fa52.png',
  },
]

function normalizeCartItems(items) {
  if (!Array.isArray(items)) {
    return []
  }

  return items
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      ...item,
      qty: Math.max(0, Number(item.qty) || 0),
    }))
    .filter((item) => item.qty > 0)
}

export function getPublicCartItems() {
  if (typeof window === 'undefined') {
    return DEFAULT_PUBLIC_CART_ITEMS
  }

  const rawValue = window.localStorage.getItem(PUBLIC_CART_STORAGE_KEY)

  if (!rawValue) {
    return DEFAULT_PUBLIC_CART_ITEMS
  }

  try {
    return normalizeCartItems(JSON.parse(rawValue))
  } catch {
    window.localStorage.removeItem(PUBLIC_CART_STORAGE_KEY)
    return DEFAULT_PUBLIC_CART_ITEMS
  }
}

export function setPublicCartItems(items) {
  if (typeof window === 'undefined') {
    return
  }

  const normalizedItems = normalizeCartItems(items)
  window.localStorage.setItem(PUBLIC_CART_STORAGE_KEY, JSON.stringify(normalizedItems))
  window.dispatchEvent(new Event(PUBLIC_CART_EVENT))
}

export function getPublicCartCount() {
  return getPublicCartItems().reduce((total, item) => total + item.qty, 0)
}

export function subscribeToPublicCart(callback) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  window.addEventListener(PUBLIC_CART_EVENT, callback)
  window.addEventListener('storage', callback)

  return () => {
    window.removeEventListener(PUBLIC_CART_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}