import { useState } from 'react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import ProductCard from '@/components/ui/ProductCard'

export default function SingleProductPayPage() {
  const [qty, setQty] = useState(1)
  const [activeThumb, setActiveThumb] = useState(0)
  const [activeTab, setActiveTab] = useState('desc')

  const thumbs = [
    '/assets/09b322b4fe86b16de5a9d343c6e82b51ff89fa52.png',
    '/assets/0b070ec76034ae637ff589014ed8e2419a754a32.png',
    '/assets/0dd99e210091b5ecadf239bd35b5f22c0f9e2645.png',
  ]

  return (
    <main className="container">
      <Breadcrumb items={[{ to: '/', label: 'Inicio' }, { to: '/productos', label: 'Productos' }, { label: 'Comprar Producto' }]} />

      {/* Product Detail Pay Section */}
      <section className="lixmar-pdp">
        <div className="lixmar-pdp__layout">

          {/* LEFT: Image Slider */}
          <div className="lixmar-pdp__gallery">
            <div className="lixmar-pdp__main-img-wrap">
              <span className="lixmar-pdp__badge lixmar-pdp__badge--dark">NUEVO</span>
              <button className="lixmar-pdp__wishlist">♡</button>
              <img src={thumbs[activeThumb]} alt="Pinnapple Macbook Pro 2022" className="lixmar-pdp__main-img" />
            </div>
            <div className="lixmar-pdp__thumbs">
              {thumbs.map((t, i) => (
                <img
                  key={i} src={t} alt={`Vista ${i+1}`}
                  className={`lixmar-pdp__thumb${activeThumb === i ? ' lixmar-pdp__thumb--active' : ''}`}
                  onClick={() => setActiveThumb(i)}
                />
              ))}
            </div>
          </div>

          {/* CENTER: Product Info */}
          <div className="lixmar-pdp__info">
            <div className="lixmar-pdp__rating">
              <span className="lixmar-pdp__stars">★★★★<span className="lixmar-pdp__star-empty">★</span></span>
              <span className="lixmar-pdp__rating-count">(5)</span>
            </div>
            <h1 className="lixmar-pdp__title">Pinnapple Macbook Pro 2022 M1 / 512GB<br />Gris Oscuro</h1>
            <p className="lixmar-pdp__price">$579.000</p>

            <ul className="lixmar-pdp__features">
              <li>Intel LGA 1700 Socket: Soporta 13th & 12th Gen Intel Core</li>
              <li>DDR5 Compatible: 4*SMD DIMMs con memoria XMP 3.0</li>
              <li>Diseño de potencia dominante: Twin 16+1+2 Phases Digital VRM</li>
            </ul>

            <div className="lixmar-pdp__shipping-tag">
              <span className="lixmar-pdp__envio">ENVIO GRATIS</span>
            </div>
            <div className="lixmar-pdp__stock">
              <span className="lixmar-pdp__stock-dot lixmar-pdp__stock-dot--green">●</span> En stock
            </div>

            <div className="lixmar-pdp__quantity-section">
              <h4 className="lixmar-pdp__qty-label">Cantidad</h4>
              <div className="lixmar-pdp__qty-row">
                <div className="lixmar-pdp__qty-control">
                  <button className="lixmar-pdp__qty-btn lixmar-pdp__qty-btn--minus" onClick={() => setQty(q => Math.max(1, q-1))}>−</button>
                  <input type="text" value={qty} className="lixmar-pdp__qty-input" readOnly />
                  <button className="lixmar-pdp__qty-btn lixmar-pdp__qty-btn--plus" onClick={() => setQty(q => q+1)}>+</button>
                </div>
                <a href="#" className="lixmar-pdp__add-cart">ADD TO CART</a>
                <button className="lixmar-pdp__fav-btn">♥</button>
              </div>
            </div>

            <p className="lixmar-pdp__safe">Guaranteed Safe Checkout</p>

            <div className="lixmar-pdp__meta">
              <p><strong>SKU:</strong> <span>ABC025168</span></p>
              <p><strong>CATEGORIA:</strong> <span>Celulares y Tablets</span></p>
              <p><strong>ETIQUETAS:</strong> <span>Laptop, Macbook, Computadora, M1</span></p>
            </div>

            <div className="lixmar-pdp__social">
              <a href="#" className="lixmar-pdp__social-link">𝕏</a>
              <a href="#" className="lixmar-pdp__social-link">f</a>
              <a href="#" className="lixmar-pdp__social-link">📷</a>
              <a href="#" className="lixmar-pdp__social-link">▶</a>
            </div>
          </div>

          {/* RIGHT: Sidebar */}
          <div className="lixmar-pdp__sidebar">
            <div className="lixmar-pdp__brand-card">
              <p className="lixmar-pdp__brand-label">Marca: <strong>Sonex</strong></p>
            </div>

            <div className="lixmar-pdp__cart-card">
              <h3 className="lixmar-pdp__cart-title">Tu Carrito</h3>
              <div className="lixmar-pdp__cart-item">
                <img src="/assets/09b322b4fe86b16de5a9d343c6e82b51ff89fa52.png" alt="Macbook" className="lixmar-pdp__cart-item-img" />
                <div className="lixmar-pdp__cart-item-info">
                  <h4 className="lixmar-pdp__cart-item-name">Pinnaeple Macbook Pro 2022 M1/ 512GB</h4>
                  <span className="lixmar-pdp__cart-item-qty">3 x $579.000</span>
                </div>
                <button className="lixmar-pdp__cart-item-remove">×</button>
              </div>
              <div className="lixmar-pdp__cart-subtotal">
                <span>Sub Total:</span>
                <strong>$1,737.000</strong>
              </div>
              <div className="lixmar-pdp__cart-actions">
                <a href="#" className="lixmar-pdp__cart-btn lixmar-pdp__cart-btn--dark">VER CARRITO</a>
                <a href="#" className="lixmar-pdp__cart-btn lixmar-pdp__cart-btn--green">PAGAR</a>
              </div>
            </div>

            <div className="lixmar-pdp__shipping-note">
              <span className="lixmar-pdp__shipping-icon">🚚</span>
              <span>Envios desde <strong>Argentina</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      <section className="lix-related" style={{ marginTop: '40px' }}>
        <h3>Productos Relacionados</h3>
        <div className="lix-related-grid">
          <ProductCard id={1} title="SROK Smart Phone 128GB, Oled Retina" price={579000} originalPrice={859000} image="/assets/0b070ec76034ae637ff589014ed8e2419a754a32.png" isFreeShipping={true} />
          <ProductCard id={2} title="aPod Pro Tablet 2023 LTE + Wifi" price={979000} image="/assets/09b322b4fe86b16de5a9d343c6e82b51ff89fa52.png" isFreeShipping={false} />
          <ProductCard id={3} title="OPod Pro 12.9 M1 2023, 64GB" price={659000} image="/assets/0dd99e210091b5ecadf239bd35b5f22c0f9e2645.png" isFreeShipping={true} />
          <ProductCard id={4} title="Xiamoi Redmi Note 5, 64GB" price={1239000} originalPrice={1619000} image="/assets/090404d25cc6c0aad946d6693b949b48e3f57252.png" isFreeShipping={true} />
        </div>
      </section>

      {/* Description Tabs */}
      <section className="lixmar-desctabs" style={{ marginTop: '40px' }}>
        <div className="lixmar-desctabs__nav">
          <button className={`lixmar-desctabs__tab${activeTab === 'desc' ? ' lixmar-desctabs__tab--active' : ''}`} onClick={() => setActiveTab('desc')}>DESCRIPCION</button>
          <button className={`lixmar-desctabs__tab${activeTab === 'reviews' ? ' lixmar-desctabs__tab--active' : ''}`} onClick={() => setActiveTab('reviews')}>RESEÑAS (5)</button>
          <button className={`lixmar-desctabs__tab${activeTab === 'info' ? ' lixmar-desctabs__tab--active' : ''}`} onClick={() => setActiveTab('info')}>INFORMACION ADICIONAL</button>
        </div>
        <div className="lixmar-desctabs__content">
          {activeTab === 'desc' && (
            <>
              <p className="lixmar-desctabs__text">Diseñada para un rendimiento ultrarrápido, la delgada y ligera Samsung Galaxy Tab S2 te acompaña a todas partes. Fotos, películas y documentos se muestran en una pantalla Super AMOLED nítida y clara.</p>
              <h3 className="lixmar-desctabs__subtitle">Del fabricante</h3>
              <p className="lixmar-desctabs__text">Sumérgete en los éxitos de taquilla que anhelas ver. Cambia entre tus apps favoritas rápida y fácilmente. El nuevo y mejorado procesador de ocho núcleos te ofrece la potencia y la velocidad que necesitas.</p>
            </>
          )}
          {activeTab === 'reviews' && (
            <p className="lixmar-desctabs__text">⭐⭐⭐⭐⭐ "Excelente producto, llegó muy rápido." — Juan P.</p>
          )}
          {activeTab === 'info' && (
            <p className="lixmar-desctabs__text">Procesador: M1 | RAM: 8GB | Almacenamiento: 512GB SSD | Pantalla: 13.3" Retina</p>
          )}
        </div>
      </section>
    </main>
  )
}
