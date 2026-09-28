import { Link } from 'react-router-dom'

export default function CheckoutPage() {
  return (
    <main className="container">
      <section className="lixmar-finalize">
        <h1 className="lixmar-finalize__heading">Finalizar compra</h1>
        <p role="status">El pago de compras estará disponible cuando se conecte la pasarela segura.</p>
        <p>Tu carrito sigue disponible para revisar los productos.</p>
        <Link to="/checkout/lista">Volver al carrito</Link>
      </section>
    </main>
  )
}
