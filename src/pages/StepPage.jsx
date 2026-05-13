import { useState } from 'react'
import { Link } from 'react-router-dom'
import Breadcrumb from '@/components/layout/Breadcrumb'

const cartProducts = [
  {
    id: 1, name: 'Teléfono inteligente SROK de 128 GB, pantalla Oled Retina',
    price: 579000, rating: 5, img: '/assets/0b070ec76034ae637ff589014ed8e2419a754a32.png',
    freeShipping: true, stock: true, save: 199000, priceRed: true,
  },
  {
    id: 2, name: 'Tablet aPod Pro 2023 LTE + Wifi, GPS Celular 12,9 Pulgadas, 512GB',
    price: 979000, img: '/assets/09b322b4fe86b16de5a9d343c6e82b51ff89fa52.png',
    freeShipping: false, shippingCost: 2980, stock: true, badge: 'nuevo',
  },
  {
    id: 3, name: 'Samsung Galaxy X6 Ultra LTE 4G/128 Gb, Smartphone Negro',
    price: 659000, rating: 5, reviews: 5, img: '/assets/0dd99e210091b5ecadf239bd35b5f22c0f9e2645.png',
    freeShipping: true, gift: true, stock: true, badge: 'nuevo',
  },
]

const formatPrice = (val) => `$${val.toLocaleString('es-AR')}`

export default function StepPage() {
  const [quantities, setQuantities] = useState(cartProducts.reduce((acc, p) => ({ ...acc, [p.id]: 1 }), {}))

  const updateQty = (id, delta) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(1, Math.min(99, (prev[id] || 1) + delta)) }))
  }

  const subtotal = cartProducts.reduce((sum, p) => sum + p.price * (quantities[p.id] || 1), 0)
  const shipping = 2980
  const tax = 1200
  const total = subtotal + shipping + tax

  return (
    <main className="container">
      <Breadcrumb items={[{ to: '/', label: 'Inicio' }, { to: '#', label: 'Página' }, { label: 'Carrito' }]} />

      <section className="lixmar-checkout">
        <div className="lixmar-checkout__products">
          {cartProducts.map(p => (
            <div className="lixmar-checkout__card" key={p.id}>
              <a href="#" className="lixmar-checkout__card-img">
                <img src={p.img} alt={p.name} />
              </a>
              <div className="lixmar-checkout__card-info">
                {p.rating && (
                  <div className="lixmar-checkout__rating-row">
                    <span className="lixmar-checkout__rating">{'★'.repeat(p.rating)}</span>
                    {p.reviews && <span className="lixmar-checkout__rating-count">({p.reviews})</span>}
                  </div>
                )}
                <h6 className="lixmar-checkout__card-title">{p.name}</h6>
                <p className={`lixmar-checkout__card-price${p.priceRed ? ' lixmar-checkout__card-price--red' : ''}`}>
                  {formatPrice(p.price)}
                </p>
                <div className="lixmar-checkout__qty">
                  <button type="button" className="lixmar-checkout__qty-btn lixmar-checkout__qty-minus" onClick={() => updateQty(p.id, -1)}>−</button>
                  <input type="number" className="lixmar-checkout__qty-input" value={quantities[p.id]} readOnly />
                  <button type="button" className="lixmar-checkout__qty-btn lixmar-checkout__qty-plus" onClick={() => updateQty(p.id, 1)}>+</button>
                </div>
                <div className="lixmar-checkout__badges">
                  {p.freeShipping && <span className="lixmar-checkout__badge lixmar-checkout__badge--green">Envío gratis</span>}
                  {p.shippingCost && <span className="lixmar-checkout__badge lixmar-checkout__badge--dark">${p.shippingCost.toLocaleString('es-AR')} envío</span>}
                  {p.gift && <span className="lixmar-checkout__badge lixmar-checkout__badge--red">Regalo gratis</span>}
                </div>
                {p.stock && (
                  <p className="lixmar-checkout__stock">
                    <span className="lixmar-checkout__stock-icon">✔</span> En stock
                  </p>
                )}
              </div>
              {p.save && (
                <div className="lixmar-checkout__discount">
                  <span className="lixmar-checkout__discount-label">ahorra</span>
                  <span className="lixmar-checkout__discount-value">{formatPrice(p.save)}</span>
                </div>
              )}
              {p.badge && <div className="lixmar-checkout__new-badge">{p.badge}</div>}
              <div className="lixmar-checkout__actions">
                <button className="lixmar-checkout__action-btn lixmar-checkout__action-btn--fav" title="Favoritos">♡</button>
                <button className="lixmar-checkout__action-btn lixmar-checkout__action-btn--del" title="Eliminar">✕</button>
              </div>
            </div>
          ))}
        </div>

        <aside className="lixmar-checkout__summary">
          <h3 className="lixmar-checkout__summary-title">Resumen del pedido</h3>
          <div className="lixmar-checkout__summary-row">
            <span className="lixmar-checkout__summary-label">Subtotal:</span>
            <span className="lixmar-checkout__summary-value">{formatPrice(subtotal)}</span>
          </div>
          <div className="lixmar-checkout__summary-row">
            <span className="lixmar-checkout__summary-label">Estimación de envío:</span>
            <span className="lixmar-checkout__summary-value">{formatPrice(shipping)}</span>
          </div>
          <div className="lixmar-checkout__summary-row">
            <span className="lixmar-checkout__summary-label">Estimación de impuestos:</span>
            <span className="lixmar-checkout__summary-value">{formatPrice(tax)}</span>
          </div>
          <div className="lixmar-checkout__summary-total">
            <span className="lixmar-checkout__summary-total-label">TOTAL DEL PEDIDO:</span>
            <span className="lixmar-checkout__summary-total-value">{formatPrice(total)}</span>
          </div>
          <Link to="/pago" className="lixmar-checkout__pay-btn">PAGAR</Link>
        </aside>
      </section>
    </main>
  )
}
