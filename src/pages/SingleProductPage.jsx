import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { addPublicCartItem } from '@/cart/publicCart'
import { fetchProduct, fetchProducts } from '@/catalog/catalogApi'
import { accountRequest } from '@/account/accountApi'
import ProductReviews from '@/catalog/ProductReviews'
import { useDefaultProductImage } from '@/catalog/productImage'
import '@/scss/pages/SingleProductPage.scss'

function productImages(product) {
  const gallery = Array.isArray(product?.assets?.gallery) ? product.assets.gallery : []
  const media = Array.isArray(product?.media) ? product.media.filter((item) => item.type === 'image') : []
  const images = [product?.assets?.primary || product?.primary_image, ...gallery, ...media]
  return images.filter((image, index) => image?.url && images.findIndex((candidate) => candidate?.url === image.url) === index)
}

function productAttributes(product) {
  const values = product?.custom_values
  if (values && !Array.isArray(values) && typeof values === 'object') {
    return Object.entries(values).filter(([, value]) => value !== null && value !== '').map(([name, value]) => ({
      id: name,
      name: name.replace(/_/g, ' '),
      value: String(value),
    }))
  }
  return (Array.isArray(values) ? values : []).filter((item) => item.field?.name).map((item) => ({
    id: item.id,
    name: item.field.name,
    value: item.option_label || item.value_text || (typeof item.value_boolean === 'boolean' ? (item.value_boolean ? 'Sí' : 'No') : null),
  })).filter((item) => item.value)
}

export default function SingleProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [favoriteMessage, setFavoriteMessage] = useState('')
  const [favoriteBusy, setFavoriteBusy] = useState(false)
  const [related, setRelated] = useState([])
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeTab, setActiveTab] = useState('description')

  useEffect(() => {
    const controller = new AbortController()
    window.scrollTo(0, 0)
    setLoading(true)
    setError('')
    setProduct(null)
    setQuantity(1)
    setAdded(false)
    setFavoriteMessage('')
    setRelated([])
    setSelectedImage(0)
    setActiveTab('description')
    fetchProduct(id, controller.signal).then((payload) => {
      if (!controller.signal.aborted) setProduct(payload.data)
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message)
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [id])

  useEffect(() => {
    if (!product?.category?.id) return undefined
    const controller = new AbortController()
    fetchProducts({ category_id: product.category.id, page: 1, per_page: 8 }, controller.signal)
      .then((payload) => {
        if (!controller.signal.aborted) setRelated((payload.data || []).filter((item) => String(item.id) !== String(id)).slice(0, 4))
      }).catch(() => {})
    return () => controller.abort()
  }, [product?.category?.id, id])

  const addToCart = async (goToCart = false) => {
    if (!product || busy) return
    setBusy(true)
    setError('')
    try {
      await addPublicCartItem(product.id, quantity)
      setAdded(true)
      if (goToCart) navigate('/checkout/lista')
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  const saveFavorite = async () => {
    if (!product || favoriteBusy) return
    setFavoriteBusy(true)
    setFavoriteMessage('')
    try {
      await accountRequest('/catalog/favorites', {
        method: 'POST', body: JSON.stringify({ product_id: product.id }),
      })
      setFavoriteMessage('Producto guardado en favoritos.')
    } catch (failure) {
      if (failure.status === 401 || failure.status === 403) navigate('/login')
      else setFavoriteMessage(failure.message)
    } finally {
      setFavoriteBusy(false)
    }
  }

  const formatPrice = (value, currency = product?.currency || 'ARS') => new Intl.NumberFormat('es-AR', {
    style: 'currency', currency,
  }).format(Number(value) || 0)
  const images = productImages(product)
  const attributes = productAttributes(product)

  return (
    <main className="lix-product-page">
      <div className="lix-product-shell">
        {loading && <p role="status">Cargando producto…</p>}
        {error && <p role="alert">{error} <Link to="/productos">Volver al catálogo</Link></p>}
        {product && <>
          <section className="lix-product-core" aria-label={`Detalle de ${product.title}`}>
            <div className={`lix-gallery-card${images.length > 1 ? '' : ' lix-gallery-card--single'}`} aria-label="Galería del producto">
              {images.length > 1 && <div className="lix-gallery-thumbnails" aria-label="Elegir imagen">
                {images.map((image, index) => <button
                  key={image.id || image.url} type="button"
                  className={`lix-gallery-thumbnail${selectedImage === index ? ' is-active' : ''}`}
                  aria-label={`Ver imagen ${index + 1}`} aria-pressed={selectedImage === index}
                  onClick={() => setSelectedImage(index)}
                ><img src={image.thumbnail_url || image.url} alt="" onError={useDefaultProductImage} /></button>)}
              </div>}
              <div className="lix-gallery-main">
                {images.length ? <img src={images[selectedImage]?.url || images[0].url} alt={product.title} onError={useDefaultProductImage} />
                  : <span className="lix-product-placeholder">{product.title}<br />Imagen de producto</span>}
              </div>
            </div>
            <div className="lix-purchase-card">
              {product.condition && <span className="lix-condition-badge">{product.condition === 'new' ? 'NUEVO' : product.condition === 'used' ? 'USADO' : product.condition}</span>}
              <h1>{product.title}</h1>
              <p className="lix-product-price">{formatPrice(product.price)}</p>
              {product.shipping && <p className="lix-shipping">{product.shipping}</p>}
              {product.status === 'active' && <p className="lix-stock">Disponible para comprar</p>}
              <label className="lix-quantity-label">Cantidad
                <input type="number" min="1" max="9999" value={quantity}
                  onChange={(event) => setQuantity(Math.max(1, Math.min(9999, Number(event.target.value) || 1)))} />
              </label>
              {product.status === 'active' ? <div className="lix-purchase-actions">
                <button className="lix-buy-button" type="button" disabled={busy} onClick={() => addToCart(true)}>Comprar ahora</button>
                <button className="lix-cart-button" type="button" disabled={busy} onClick={() => addToCart(false)}>Agregar al carrito</button>
                <button className="lix-favorite-button" type="button" disabled={favoriteBusy} onClick={saveFavorite}>Guardar en favoritos</button>
              </div> : <p>Esta publicación todavía no está disponible para comprar.</p>}
              {added && <p role="status">Producto agregado al carrito.</p>}
              {favoriteMessage && <p role="status">{favoriteMessage}</p>}
              <div className="lix-seller-card">
                <strong>Vendido por {product.seller?.name || `Vendedor #${product.seller_id}`}</strong>
                {product.location?.city && <span>{product.location.city}{product.location.province ? `, ${product.location.province}` : ''}</span>}
              </div>
            </div>
          </section>
          <section className="lix-product-information" aria-label="Información del producto">
            <div className="lix-product-tabs" role="tablist" aria-label="Información del producto">
              {[['description', 'Descripción'], ['characteristics', 'Características']].map(([key, label]) => <button
                key={key} type="button" role="tab" aria-selected={activeTab === key}
                className={activeTab === key ? 'is-active' : ''} onClick={() => setActiveTab(key)}>{label}</button>)}
              <a href="#opiniones">Opiniones</a><a href="#preguntas">Preguntas</a>
            </div>
            <div className="lix-description-content" role="tabpanel">
              {activeTab === 'description' ? <><h2>Descripción del producto</h2><p>{product.description || 'El vendedor todavía no agregó una descripción.'}</p></>
                : <><h2>Características</h2><ul>
                  {product.condition && <li>Condición: {product.condition === 'new' ? 'Nuevo' : product.condition === 'used' ? 'Usado' : product.condition}</li>}
                  {product.category?.name && <li>Categoría: {product.category.name}</li>}
                  {attributes.map((item) => <li key={item.id}>{item.name}: {item.value}</li>)}
                  {!product.condition && !product.category?.name && !attributes.length && <li>Sin características informadas.</li>}
                </ul></>}
            </div>
          </section>
          <section className="lix-questions-card" id="preguntas">
            <h2>Preguntas y respuestas</h2>
            <p>Las preguntas de esta publicación aún no están disponibles.</p>
          </section>
          <div id="opiniones"><ProductReviews key={product.id} productId={product.id} /></div>
          {related.length > 0 && <section className="lix-recommendations" aria-label="Productos relacionados">
            <h2>También te puede interesar</h2>
            <div className="lix-recommendations-grid">
              {related.map((item) => <Link key={item.id} to={`/producto/${item.id}`} className="lix-recommendation-card">
                <div className="lix-recommendation-card__visual">
                  {item.primary_image?.url ? <img src={item.primary_image.thumbnail_url || item.primary_image.url} alt="" loading="lazy" onError={useDefaultProductImage} />
                    : <span className="lix-product-placeholder--compact">{item.title}</span>}
                </div>
                <div className="lix-recommendation-card__content"><h3>{item.title}</h3><strong>{formatPrice(item.price, item.currency)}</strong></div>
              </Link>)}
            </div>
          </section>}
        </>}
      </div>
    </main>
  )
}
