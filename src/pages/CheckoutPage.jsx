import { useState } from 'react'
import Breadcrumb from '@/components/layout/Breadcrumb'

export default function CheckoutPage() {
  const [payMethod, setPayMethod] = useState('bank')

  return (
    <main className="container">
      <Breadcrumb items={[{ to: '/', label: 'Inicio' }, { to: '#', label: 'Página' }, { label: 'Finalizar Compra' }]} />

      <section className="lixmar-finalize">
        <h2 className="lixmar-finalize__heading">FINALIZAR COMPRA</h2>

        {/* Alert boxes */}
        <div className="lixmar-finalize__alerts">
          <div className="lixmar-finalize__alert">
            <span className="lixmar-finalize__alert-icon">👤</span>
            <span>¿Cliente que regresa? <a href="#" className="lixmar-finalize__alert-link">Haga clic aquí para iniciar sesión</a></span>
          </div>
          <div className="lixmar-finalize__alert">
            <span className="lixmar-finalize__alert-icon">🏷️</span>
            <span>¿Tienes un cupón? <a href="#" className="lixmar-finalize__alert-link">Haga clic aquí para ingresar su código</a></span>
          </div>
        </div>

        <div className="lixmar-finalize__grid">
          {/* Left: Billing Form */}
          <div className="lixmar-finalize__form-col">
            <h3 className="lixmar-finalize__section-title">Detalle de facturación</h3>

            <div className="lixmar-finalize__row-2col">
              <div className="lixmar-finalize__field">
                <label className="lixmar-finalize__label">Nombre <span className="lixmar-finalize__req">*</span></label>
                <input type="text" className="lixmar-finalize__input" />
              </div>
              <div className="lixmar-finalize__field">
                <label className="lixmar-finalize__label">Apellido <span className="lixmar-finalize__req">*</span></label>
                <input type="text" className="lixmar-finalize__input" />
              </div>
            </div>

            <div className="lixmar-finalize__field">
              <label className="lixmar-finalize__label">Nombre de la empresa (opcional)</label>
              <input type="text" className="lixmar-finalize__input" />
            </div>

            <div className="lixmar-finalize__field">
              <label className="lixmar-finalize__label">País / Región <span className="lixmar-finalize__req">*</span></label>
              <select className="lixmar-finalize__select">
                <option>Argentina (ARG)</option>
              </select>
            </div>

            <div className="lixmar-finalize__field">
              <label className="lixmar-finalize__label">Dirección</label>
              <input type="text" className="lixmar-finalize__input" placeholder="Número de casa y nombre de la calle..." />
              <input type="text" className="lixmar-finalize__input lixmar-finalize__input--mt" placeholder="Apartamento, suite, unidad, etc (Opcional)" />
            </div>

            <div className="lixmar-finalize__field">
              <label className="lixmar-finalize__label">Pueblo / Ciudad <span className="lixmar-finalize__req">*</span></label>
              <input type="text" className="lixmar-finalize__input" />
            </div>

            <div className="lixmar-finalize__field">
              <label className="lixmar-finalize__label">Estado <span className="lixmar-finalize__req">*</span></label>
              <select className="lixmar-finalize__select">
                <option>CABA</option>
              </select>
            </div>

            <div className="lixmar-finalize__field">
              <label className="lixmar-finalize__label">Código postal <span className="lixmar-finalize__req">*</span></label>
              <input type="text" className="lixmar-finalize__input" />
            </div>

            <div className="lixmar-finalize__field">
              <label className="lixmar-finalize__label">Número de teléfono <span className="lixmar-finalize__req">*</span></label>
              <input type="tel" className="lixmar-finalize__input" />
            </div>

            <div className="lixmar-finalize__field">
              <label className="lixmar-finalize__label">Dirección de correo electrónico<span className="lixmar-finalize__req">*</span></label>
              <input type="email" className="lixmar-finalize__input" />
            </div>

            <label className="lixmar-finalize__checkbox-row">
              <input type="checkbox" className="lixmar-finalize__checkbox" />
              <span>¿Crear una cuenta?</span>
            </label>

            <h3 className="lixmar-finalize__section-title lixmar-finalize__section-title--mt">Información adicional</h3>

            <div className="lixmar-finalize__field">
              <label className="lixmar-finalize__label">Notas de pedido (opcional)</label>
              <textarea className="lixmar-finalize__textarea" placeholder="Nota sobre su pedido, p.e. nota especial para la entrega"></textarea>
            </div>
          </div>

          {/* Right: Order Summary + Payment */}
          <div className="lixmar-finalize__order-col">
            <h3 className="lixmar-finalize__section-title">Tu pedido</h3>

            <div className="lixmar-finalize__order-card">
              <div className="lixmar-finalize__order-header">
                <span>PRODUCTO</span>
                <span>SUBTOTAL</span>
              </div>

              <div className="lixmar-finalize__order-product">
                <div className="lixmar-finalize__product-info">
                  <img src="/assets/09b322b4fe86b16de5a9d343c6e82b51ff89fa52.png" alt="Macbook Pro 2025" className="lixmar-finalize__product-img" />
                  <div>
                    <p className="lixmar-finalize__product-name">Macbook Pro 2025<br />M4/ 512GB</p>
                    <span className="lixmar-finalize__product-qty">x 1</span>
                  </div>
                </div>
              </div>

              <div className="lixmar-finalize__order-shipping">
                <span>Envío estándar gratuito</span>
                <span className="lixmar-finalize__shipping-price">+ $2.900</span>
              </div>

              <div className="lixmar-finalize__order-total">
                <span>Order Total</span>
                <span className="lixmar-finalize__total-price">$1.746.500</span>
              </div>
            </div>

            <div className="lixmar-finalize__payment-card">
              <label className={`lixmar-finalize__pay-option${payMethod === 'bank' ? ' lixmar-finalize__pay-option--active' : ''}`}>
                <input type="radio" name="payment" className="lixmar-finalize__radio" checked={payMethod === 'bank'} onChange={() => setPayMethod('bank')} />
                <div>
                  <strong>Transferencia bancaria directa</strong>
                  {payMethod === 'bank' && (
                    <p className="lixmar-finalize__pay-desc">Realice su pago directamente en nuestra cuenta bancaria. Por favor usa tu ID del pedido como referencia de pago. Tu pedido no será enviado hasta que los fondos se hayan liquidado en nuestra cuenta.</p>
                  )}
                </div>
              </label>
              <label className={`lixmar-finalize__pay-option${payMethod === 'door' ? ' lixmar-finalize__pay-option--active' : ''}`}>
                <input type="radio" name="payment" className="lixmar-finalize__radio" checked={payMethod === 'door'} onChange={() => setPayMethod('door')} />
                <strong>Pagar en la puerta</strong>
              </label>
              <label className={`lixmar-finalize__pay-option${payMethod === 'mp' ? ' lixmar-finalize__pay-option--active' : ''}`}>
                <input type="radio" name="payment" className="lixmar-finalize__radio" checked={payMethod === 'mp'} onChange={() => setPayMethod('mp')} />
                <strong>Mercado Pago</strong>
              </label>

              <a href="#" className="lixmar-finalize__submit-btn">REALIZAR PEDIDO</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
