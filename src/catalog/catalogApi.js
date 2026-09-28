async function catalogJson(path, signal) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
    signal,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = response.status === 404 ? 'Producto no disponible.'
      : response.status >= 500 ? 'El catálogo no está disponible. Intentá de nuevo más tarde.'
        : payload.message || 'No se pudo cargar el catálogo.'
    const error = new Error(message)
    error.status = response.status
    throw error
  }
  return payload
}

function validProduct(product) {
  return product && Number.isInteger(Number(product.id)) && Number(product.id) > 0
    && typeof product.title === 'string' && product.title.trim() !== ''
    && Number.isFinite(Number(product.price))
    && typeof product.currency === 'string' && product.currency.length === 3
}

export async function fetchProducts(params = {}, signal) {
  const query = new URLSearchParams(params)
  const payload = await catalogJson(`/api/v1/catalog/search?${query}`, signal)
  if (!Array.isArray(payload.data) || !payload.data.every(validProduct)
    || !Number.isInteger(Number(payload.total)) || !Number.isInteger(Number(payload.last_page))) {
    throw new Error('La respuesta del catálogo no tiene el formato esperado.')
  }
  return payload
}

export async function fetchCategories(signal) {
  const payload = await catalogJson('/api/v1/public/catalog/categories', signal)
  if (!Array.isArray(payload.data)) throw new Error('La respuesta de categorías no tiene el formato esperado.')
  return payload
}

export async function fetchProduct(id, signal) {
  const payload = await catalogJson(`/api/v1/catalog/products/${encodeURIComponent(id)}`, signal)
  if (!validProduct(payload.data)) throw new Error('La respuesta del producto no tiene el formato esperado.')
  return payload
}

export function productCardProps(product) {
  return {
    id: product.id,
    title: product.title,
    price: Number(product.price),
    currency: product.currency || 'ARS',
    image: product.primary_image?.thumbnail_url || product.primary_image?.url,
  }
}

export function categoryCardProps(category) {
  return {
    id: category.id,
    name: category.name,
    image: category.assets?.banner?.url || category.assets?.logo?.url || null,
  }
}
