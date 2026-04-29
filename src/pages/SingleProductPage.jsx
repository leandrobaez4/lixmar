import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Breadcrumb from '@/components/layout/Breadcrumb'
import ProductCard from '@/components/ui/ProductCard'
import './SingleProductPage.scss'

// Mock Data local provisoria para que los links correspondan al producto real
const ALL_PRODUCTS = [
  {
    id: 1,
    title: "Xiaomi Redmi Note 11 Pro 256GB 2026, Black Smartphone",
    price: 569000,
    originalPrice: 759000,
    rating: 4.8,
    reviews: 152,
    images: [
      "/assets/0b070ec76034ae637ff589014ed8e2419a754a32.png",
      "/assets/0b7bdc132f3d60c767e3b92de9cb2a68c1bfd50f.png"
    ],
    features: ["Pantalla AMOLED 120hz", "Procesador Octa-Core", "108MP", "Batería 5000mAh", "128GB ROM"],
    isFreeShipping: true
  },
  {
    id: 2,
    title: "Laptop Lenovo Ideapad Gaming 3 15ACH6",
    price: 1250000,
    originalPrice: 1400000,
    rating: 4.9,
    reviews: 84,
    images: [
      "/assets/09b322b4fe86b16de5a9d343c6e82b51ff89fa52.png",
      "/assets/6c05cca3-68d9-46d9-9ef6-3df5ee267521.png"
    ],
    features: ["Ryzen 5 5600H", "GTX 1650 4GB", "8GB RAM", "15.6 FHD 120Hz", "Pantalla Anti-glare"],
    isFreeShipping: true
  },
  {
    id: 3,
    title: "Monitor Gamer LG Ultragear 24 Pulgadas 144hz",
    price: 320000,
    rating: 4.7,
    reviews: 21,
    images: [
      "/assets/0dd99e210091b5ecadf239bd35b5f22c0f9e2645.png"
    ],
    features: ["144Hz Refresh Rate", "1ms Response Time", "AMD FreeSync", "IPS Panel", "24 Pulgadas"],
    isFreeShipping: false
  },
  {
    id: 4,
    title: "Auriculares Inalámbricos Sony WH-CH510",
    price: 85000,
    originalPrice: 100000,
    rating: 4.5,
    reviews: 310,
    images: [
      "/assets/090404d25cc6c0aad946d6693b949b48e3f57252.png",
      "/assets/ea697527-51ed-4632-9038-04210af67ddd.png"
    ],
    features: ["35 horas de batería", "Carga rápida", "Bluetooth 5.0", "Micrófono integrado", "Ligeros y cómodos"],
    isFreeShipping: true
  }
];

export default function SingleProductPage() {
  const { id } = useParams();
  const [activeImage, setActiveImage] = useState(0)
  const [activeTab, setActiveTab] = useState('description')
  
  useEffect(() => {
    setActiveImage(0);
    window.scrollTo(0, 0);
  }, [id]);

  const product = ALL_PRODUCTS.find(p => p.id === parseInt(id)) || ALL_PRODUCTS[0];
  const formatPrice = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumSignificantDigits: 9 }).format(val);

  return (
    <main className="lix-product-page">
      <div className="container">
        <Breadcrumb items={[
          { to: '/', label: 'Inicio' }, 
          { to: '/categorias', label: 'Tecnología' }, 
          { label: product.title }
        ]} />

        <div className="lix-product-core">
          {/* LEFT: GALLERY FLAT */}
          <div className="lix-gallery">
            <div className="lix-gallery-main">
              {product.isFreeShipping && <div className="lix-gallery-badge">ENVÍO PRIORITARIO</div>}
              <img src={product.images[activeImage]} alt={product.title} />
            </div>
            {product.images.length > 1 && (
              <div className="lix-gallery-nav">
                {product.images.map((img, i) => (
                  <button 
                    key={i} 
                    className={`lix-gallery-thumb ${activeImage === i ? 'is-active' : ''}`}
                    onClick={() => setActiveImage(i)}
                  >
                    <img src={img} alt={`Vista ${i+1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: PREMIUM INFO */}
          <div className="lix-product-details">
            <div className="lix-product-meta">
              <span className="brand-tag">LIXMAR RECOMENDADO</span>
              <div className="rating-pill">
                ⭐ {product.rating} <span>({product.reviews} reseñas)</span>
              </div>
            </div>

            <h1 className="lix-title">{product.title}</h1>

            <div className="lix-price-wrapper">
              <span className="lix-price-current">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <div className="lix-price-savings">
                  <span className="lix-price-old">{formatPrice(product.originalPrice)}</span>
                  <span className="lix-discount-tag">Ahorras {formatPrice(product.originalPrice - product.price)}</span>
                </div>
              )}
            </div>

            <div className="lix-info-divider"></div>

            <div className="lix-features-preview">
              <h3>Destacados del producto</h3>
              <ul>
                {product.features.slice(0, 3).map((feat, i) => (
                  <li key={i}>✓ {feat}</li>
                ))}
              </ul>
            </div>

            <div className="lix-pdp-actions">
              <div className="lix-qty-selector">
                <button>-</button>
                <input type="text" value="1" readOnly />
                <button>+</button>
              </div>
              <button className="lix-btn-cart">Añadir al Carrito</button>
            </div>
            
            <button className="lix-btn-buy">Finalizar Compra Ahora</button>

            <div className="lix-logistics">
              <div className="logistic-item">
                <span className="icon">📦</span>
                <div>
                  <strong>Despacho inmediato</strong>
                  <p>Cálculo de envío en el checkout. Retiro en tienda gratis.</p>
                </div>
              </div>
              <div className="logistic-item">
                <span className="icon">🛡️</span>
                <div>
                  <strong>Garantía de satisfacción</strong>
                  <p>30 días para devoluciones sin costo.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TABS SECTION */}
        <div className="lix-tabs-section">
          <div className="lix-tabs-headers">
            <button 
              className={activeTab === 'description' ? 'active' : ''} 
              onClick={() => setActiveTab('description')}
            >
              Descripción completa
            </button>
            <button 
              className={activeTab === 'specs' ? 'active' : ''} 
              onClick={() => setActiveTab('specs')}
            >
              Ficha Técnica
            </button>
            <button 
              className={activeTab === 'reviews' ? 'active' : ''} 
              onClick={() => setActiveTab('reviews')}
            >
              Reseñas ({product.reviews})
            </button>
          </div>
          
          <div className="lix-tabs-body">
            {activeTab === 'description' && (
              <div className="tab-pane">
                <p>Diseñado para un rendimiento ultrarrápido, el nuevo <strong>{product.title}</strong> te acompaña a todas partes. Fotos, películas y documentos se muestran en una pantalla impresionante, nítida y clara.</p>
                <p>Sumérgete en los éxitos de taquilla que anhelas ver. Cambia entre tus apps favoritas rápida y fácilmente. Almacenamiento expansivo y tecnología de última generación que proporciona fluidez en el día a día.</p>
              </div>
            )}
            {activeTab === 'specs' && (
              <div className="tab-pane">
                <ul className="spec-list">
                  {product.features.map((feat, i) => (
                    <li key={i}><strong>Característica {i+1}:</strong> {feat}</li>
                  ))}
                  <li><strong>Estado:</strong> Nuevo en caja sellada</li>
                  <li><strong>Línea:</strong> Premium 2026</li>
                </ul>
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="tab-pane">
                <p><strong>Opinión general: {product.rating} / 5.0</strong> basada en compras verificadas.</p>
                <div className="mock-review">
                  <div className="mock-review-stars">⭐⭐⭐⭐⭐</div>
                  <p>"Excelente equipo, llegó súper rápido y funciona a la perfección. Muy recomendado." - <em>Juan P.</em></p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        <section className="lix-related">
          <h3>Completá tu equipo</h3>
          <div className="lix-related-grid">
            <ProductCard 
              id={1}
              title="Laptop Lenovo Ideapad Gaming 3 15ACH6"
              price={1250000}
              originalPrice={1400000}
              image="/assets/09b322b4fe86b16de5a9d343c6e82b51ff89fa52.png"
              isFreeShipping={true}
            />
            <ProductCard 
              id={2}
              title="aPod Pro Tablet 2023 LTE + Wifi"
              price={979000}
              image="/assets/090404d25cc6c0aad946d6693b949b48e3f57252.png"
              isFreeShipping={true}
            />
            <ProductCard 
              id={3}
              title="Monitor Gamer LG Ultragear 24 Pulgadas"
              price={320000}
              image="/assets/0dd99e210091b5ecadf239bd35b5f22c0f9e2645.png"
              isFreeShipping={false}
            />
            <ProductCard 
              id={4}
              title="Auriculares Inalámbricos Sony WH-CH510"
              price={85000}
              image="/assets/0b070ec76034ae637ff589014ed8e2419a754a32.png"
              isFreeShipping={false}
            />
          </div>
        </section>
      </div>
    </main>
  )
}
