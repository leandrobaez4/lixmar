import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getPublicCartItems, setPublicCartItems } from '@/cart/publicCart'
import '@/scss/pages/SingleProductPage.scss'

const PRODUCT = {
  id: 1,
  title: 'Apple iPhone 15 Pro 256 GB',
  price: 2349999,
  rating: 4.8,
  reviews: 342,
  images: [],
  condition: 'Nuevo',
  installments: '12 cuotas de $ 195.833 sin interés',
  stock: '+10 unidades',
  seller: { name: 'Tech Store', rating: 4.9, sales: '+1.200 ventas' },
  description: 'iPhone 15 Pro con diseño de titanio, pantalla Super Retina XDR de 6,1”, chip A17 Pro y sistema de cámaras profesional. Publicación verificada con garantía y envío protegido por LIXMAR.',
  specifications: [
    'Capacidad: 256 GB',
    'Color: Titanio natural',
    'Condición: Nuevo',
    'Garantía: 12 meses',
  ],
}

const QUESTIONS = [
  { question: '¿Hacés envíos al interior?', answer: 'Sí, enviamos a todo el país. Podés calcular el envío antes de comprar.' },
  { question: '¿Viene sellado de fábrica?', answer: 'Sí. Es nuevo, sellado y cuenta con garantía.' },
]

const REVIEWS = [
  { title: 'Excelente compra', body: 'Llegó rápido, sellado y exactamente como se describe.' },
  { title: 'Muy buen producto', body: 'La cámara y la batería son excelentes.' },
  { title: 'Todo perfecto', body: 'Buen vendedor y envío impecable.' },
]

const RECOMMENDATIONS = [
  { id: 2, title: 'Samsung Galaxy S24', price: 1799999 },
  { id: 3, title: 'AirPods Pro 2', price: 399999 },
  { id: 4, title: 'Apple Watch Series 9', price: 749999 },
  { id: 5, title: 'MacBook Air M3', price: 2199999 },
]

const TABS = [
  { id: 'description', label: 'Descripción' },
  { id: 'specifications', label: 'Características' },
  { id: 'reviews', label: 'Opiniones' },
  { id: 'questions', label: 'Preguntas' },
]

const formatPrice = (value) => `$ ${value.toLocaleString('es-AR')}`

function ProductVisual({ title, image, compact = false }) {
  if (image) return <img src={image} alt={title} />

  return (
    <span className={compact ? 'lix-product-placeholder--compact' : 'lix-product-placeholder'}>
      {compact ? title : <>{title}<br />Imagen de producto</>}
    </span>
  )
}

function RecommendationCard({ product }) {
  return (
    <Link className="lix-recommendation-card" to={`/producto/${product.id}`}>
      <div className="lix-recommendation-card__visual">
        <ProductVisual title={product.title} compact />
      </div>
      <div className="lix-recommendation-card__content">
        <h3>{product.title}</h3>
        <strong>{formatPrice(product.price)}</strong>
        <span>Envío gratis</span>
      </div>
    </Link>
  )
}

export default function SingleProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeImage, setActiveImage] = useState(0)
  const [activeTab, setActiveTab] = useState('description')
  const [cartAdded, setCartAdded] = useState(false)
  const recommendation = RECOMMENDATIONS.find((item) => item.id === Number(id))
  const product = recommendation ? { ...PRODUCT, ...recommendation } : PRODUCT
  const gallerySlots = Array.from({ length: 4 }, (_, index) => product.images[index] ?? null)

  useEffect(() => {
    setActiveImage(0)
    setActiveTab('description')
    setCartAdded(false)
    window.scrollTo(0, 0)
  }, [id])

  const addToCart = () => {
    const items = getPublicCartItems()
    const existingItem = items.find((item) => item.id === product.id)
    const nextItems = existingItem
      ? items.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item)
      : [...items, {
          id: product.id,
          name: product.title,
          price: product.price,
          qty: 1,
          img: product.images[0] ?? '/assets/default-placeholder.png',
        }]

    setPublicCartItems(nextItems)
    setCartAdded(true)
  }

  const buyNow = () => {
    addToCart()
    navigate(`/producto/${product.id}/comprar`)
  }

  const goToSection = (tabId) => {
    setActiveTab(tabId)
    document.getElementById(`product-${tabId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="lix-product-page">
      <div className="lix-product-shell">
        <div className="lix-product-core">
          <section className="lix-gallery-card" aria-label="Galería del producto">
            <div className="lix-gallery-thumbnails">
              {gallerySlots.map((image, index) => (
                <button
                  key={`${image ?? 'placeholder'}-${index}`}
                  type="button"
                  className={`lix-gallery-thumbnail ${activeImage === index ? 'is-active' : ''}`}
                  onClick={() => setActiveImage(index)}
                  aria-label={`Ver imagen ${index + 1}`}
                  aria-pressed={activeImage === index}
                >
                  {image ? <img src={image} alt="" /> : null}
                </button>
              ))}
            </div>
            <div className="lix-gallery-main">
              <ProductVisual title={product.title.replace(' 256 GB', '')} image={gallerySlots[activeImage]} />
            </div>
          </section>

          <aside className="lix-purchase-card">
            <span className="lix-condition-badge">{product.condition.toUpperCase()}</span>
            <h1>{product.title}</h1>
            <p className="lix-product-rating">★ {String(product.rating).replace('.', ',')} <span>·</span> {product.reviews} opiniones</p>
            <p className="lix-product-price">{formatPrice(product.price)}</p>
            <p className="lix-installments">{product.installments}</p>
            <p className="lix-shipping">Envío gratis a todo el país</p>
            <p className="lix-stock">Stock disponible <span>·</span> {product.stock}</p>

            <div className="lix-purchase-actions">
              <button type="button" className="lix-buy-button" onClick={buyNow}>Comprar ahora</button>
              <button type="button" className="lix-cart-button" onClick={addToCart}>
                {cartAdded ? 'Agregado al carrito' : 'Agregar al carrito'}
              </button>
            </div>

            <div className="lix-seller-card" id="seller">
              <strong>Tienda oficial • {product.seller.name}</strong>
              <span>★ {String(product.seller.rating).replace('.', ',')} <b>·</b> {product.seller.sales}</span>
              <button type="button">Ver perfil del vendedor →</button>
            </div>
          </aside>
        </div>

        <section className="lix-product-information" id="product-description">
          <nav className="lix-product-tabs" aria-label="Información del producto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? 'is-active' : ''}
                onClick={() => goToSection(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="lix-description-content">
            <h2>Potencia profesional en tu bolsillo</h2>
            <p>{product.description}</p>
            <ul id="product-specifications">
              {product.specifications.map((specification) => <li key={specification}>{specification}</li>)}
            </ul>
          </div>
        </section>

        <section className="lix-questions-card" id="product-questions">
          <h2>Preguntas y respuestas</h2>
          <div className="lix-question-list">
            {QUESTIONS.map((item) => (
              <article key={item.question}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lix-reviews-card" id="product-reviews">
          <h2>Opiniones del producto</h2>
          <div className="lix-reviews-layout">
            <div className="lix-review-summary">
              <strong>{String(product.rating).replace('.', ',')}</strong>
              <div><span>★★★★★</span><p>{product.reviews} opiniones</p></div>
            </div>
            <div className="lix-review-list">
              {REVIEWS.map((review) => (
                <article key={review.title}>
                  <span>★★★★★</span>
                  <h3>{review.title}</h3>
                  <p>{review.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lix-recommendations">
          <h2>También te puede gustar</h2>
          <div className="lix-recommendations-grid">
            {RECOMMENDATIONS.map((recommendation) => (
              <RecommendationCard key={recommendation.id} product={recommendation} />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
