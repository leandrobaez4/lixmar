import { useState } from 'react'
import ProductCard from '@/components/ui/ProductCard'
import './HomePage.scss'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('mas-vendido')

  const products = [
    {
      id: 1,
      title: "Xiaomi Redmi Note 11 Pro 256GB 2026, Black",
      price: 569000,
      originalPrice: 759000,
      image: "/assets/0b070ec76034ae637ff589014ed8e2419a754a32.png",
      isFreeShipping: true
    },
    {
      id: 2,
      title: "Laptop Lenovo Ideapad Gaming 3 15ACH6",
      price: 1250000,
      originalPrice: 1400000,
      image: "/assets/09b322b4fe86b16de5a9d343c6e82b51ff89fa52.png",
      isFreeShipping: true
    },
    {
      id: 3,
      title: "Monitor Gamer LG Ultragear 24 Pulgadas 144hz",
      price: 320000,
      image: "/assets/0dd99e210091b5ecadf239bd35b5f22c0f9e2645.png",
      isFreeShipping: false
    },
    {
      id: 4,
      title: "Auriculares Inalámbricos Sony WH-CH510",
      price: 85000,
      originalPrice: 100000,
      image: "/assets/090404d25cc6c0aad946d6693b949b48e3f57252.png",
      isFreeShipping: true
    },
  ]

  return (
    <main className="ml-home">
      {/* HERO CAROUSEL PURE ML STYLE */}
      <section className="ml-home__hero">
        <div className="ml-home__hero-inner">
          <img src="/assets/0b7bdc132f3d60c767e3b92de9cb2a68c1bfd50f.png" alt="Promoción Principal" />
        </div>
      </section>

      <div className="container" style={{ paddingBottom: '60px' }}>
        
        {/* Payment Methods Bar */}
        <section className="ml-home__payment card-ml">
          <div className="payment-item">
            <span className="payment-icon">💳</span>
            <div className="payment-text">
              <strong>Hasta 6 cuotas sin interés</strong>
              <a href="#">Ver promociones bancarias</a>
            </div>
          </div>
          <div className="payment-item">
            <span className="payment-icon">💵</span>
            <div className="payment-text">
              <strong>Efectivo y débito</strong>
              <a href="#">Conocé más</a>
            </div>
          </div>
          <div className="payment-item">
            <span className="payment-icon">➕</span>
            <div className="payment-text">
              <strong>Más medios de pago</strong>
              <a href="#">Ver todos</a>
            </div>
          </div>
        </section>

        {/* Ofertas Slider */}
        <section className="ml-home__section">
          <div className="ml-home__section-header">
            <h2>Ofertas del día</h2>
            <a href="#">Ver todas</a>
          </div>
          <div className="ml-home__products-grid">
            {products.map(p => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </section>

        {/* Banner Miembros */}
        <section className="ml-home__banner card-ml">
          <img src="/assets/0ce70193a221b92d682e9f24220dd7a3b0099750.png" alt="Miembros" className="banner-icon" />
          <div className="banner-text">
            <h3>Suscribite al nivel 6</h3>
            <p>Conseguí envíos gratis desde $25.000 y mucho más</p>
          </div>
          <button className="banner-btn">Suscribite</button>
        </section>

        {/* Otra fila de productos */}
        <section className="ml-home__section">
          <div className="ml-home__section-header">
            <h2><span className="highlight-text">Basado en tu última visita</span></h2>
            <a href="#">Ver historial</a>
          </div>
          <div className="ml-home__products-grid">
            {/* Reusing products array for mockup, normally would be different */}
            {products.slice().reverse().map((p, i) => (
              <ProductCard key={`hist-${p.id}`} {...p} id={p.id + 10} />
            ))}
          </div>
        </section>

      </div>
    </main>
  )
}
