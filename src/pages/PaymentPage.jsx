import Breadcrumb from '@/components/layout/Breadcrumb'

export default function PaymentPage() {
  return (
    <main className="container">
      <Breadcrumb items={[{ to: '/', label: 'Inicio' }, { to: '#', label: 'Página' }, { label: 'Pago' }]} />

      <section className="lixmar-payment">
        <div className="lixmar-payment__grid">
          {/* Left: Order Summary */}
          <div className="lixmar-payment__summary">
            <div className="lixmar-payment__logo-row">
              <span className="lixmar-payment__logo-text">
                <span className="lixmar-payment__logo-lix">LIX</span>MAR
              </span>
            </div>
            <p className="lixmar-payment__pay-to">Paga a LIXMAR</p>
            <h2 className="lixmar-payment__amount">$9,99 / mes</h2>
            <div className="lixmar-payment__plan-row">
              <span className="lixmar-payment__plan-name">Plan PRO</span>
              <span className="lixmar-payment__plan-price">$9,99 / mes</span>
            </div>
          </div>

          {/* Right: Payment Form */}
          <div className="lixmar-payment__form-wrapper">
            <form className="lixmar-payment__form" onSubmit={(e) => e.preventDefault()}>
              <div className="lixmar-payment__field">
                <label className="lixmar-payment__label">Dirección de Correo Electrónico <span className="lixmar-payment__required">*</span></label>
                <input type="email" className="lixmar-payment__input" required />
              </div>

              <h3 className="lixmar-payment__section-title">Método de pago</h3>

              <p className="lixmar-payment__sublabel">Información de la tarjeta</p>
              <div className="lixmar-payment__card-number-row">
                <input type="text" className="lixmar-payment__input lixmar-payment__input--card" placeholder="1234 1234 1234 1234" maxLength="19" />
                <div className="lixmar-payment__card-icons">
                  <span className="lixmar-payment__card-brand lixmar-payment__card-brand--visa">VISA</span>
                  <span className="lixmar-payment__card-brand lixmar-payment__card-brand--mc">MC</span>
                  <span className="lixmar-payment__card-brand lixmar-payment__card-brand--amex">AMEX</span>
                  <span className="lixmar-payment__card-brand lixmar-payment__card-brand--discover">DC</span>
                </div>
              </div>
              <div className="lixmar-payment__card-details-row">
                <input type="text" className="lixmar-payment__input lixmar-payment__input--half" placeholder="MM/AA" maxLength="5" />
                <div className="lixmar-payment__cvc-wrapper">
                  <input type="text" className="lixmar-payment__input lixmar-payment__input--half" placeholder="CVC" maxLength="4" />
                  <span className="lixmar-payment__cvc-icon">💳</span>
                </div>
              </div>

              <div className="lixmar-payment__field">
                <p className="lixmar-payment__sublabel">Nombre del titular de tarjeta</p>
                <input type="text" className="lixmar-payment__input" placeholder="Nombre completo" />
              </div>

              <h3 className="lixmar-payment__section-title">Dirección de facturación</h3>

              <div className="lixmar-payment__field">
                <select className="lixmar-payment__select">
                  <option>Argentina</option>
                </select>
              </div>
              <div className="lixmar-payment__field">
                <input type="text" className="lixmar-payment__input" placeholder="Línea 1 de dirección" />
              </div>
              <div className="lixmar-payment__field">
                <input type="text" className="lixmar-payment__input" placeholder="Línea 2 de dirección" />
              </div>
              <div className="lixmar-payment__row-2col">
                <input type="text" className="lixmar-payment__input" placeholder="Código postal" />
                <input type="text" className="lixmar-payment__input" placeholder="Ciudad" />
              </div>
              <div className="lixmar-payment__field">
                <select className="lixmar-payment__select">
                  <option>Provincia</option>
                </select>
              </div>

              <button type="submit" className="lixmar-payment__btn">PAGAR</button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
